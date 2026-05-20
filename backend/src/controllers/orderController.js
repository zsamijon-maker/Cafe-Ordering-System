const supabase = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const { cache } = require('../services/cache');

// Allowed transitions and role permissions
const allowedTransitions = {
  Pending: ['Preparing', 'Cancelled'],
  Preparing: ['Ready for Pickup', 'Served', 'Out for Delivery', 'Cancelled'],
  'Ready for Pickup': ['Completed', 'Cancelled'],
  'Served': ['Completed', 'Cancelled'],
  'Out for Delivery': ['Delivered'],
  Delivered: ['Completed'],
  Completed: [],
  Cancelled: []
};

// Role permission matrix for certain transitions (defaults to both roles)
// e.g., Delivered -> Completed is admin-only by default
const transitionRoleRequirements = {
  'Delivered:Completed': ['admin']
};

const getOrders = async (req, res, next) => {
  try {
    // Pagination params with defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status || null;

    // Build query with optional status filter
    let query = supabase
      .from('orders')
      .select('*, order_items(*, products(name))', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (err) {
    next(err);
  }
};

const getOrderByNumber = async (req, res, next) => {
  try {
    const { order_number } = req.params;
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*, products(name, price))')
      .eq('order_number', order_number)
      .limit(1)
      .single();
    if (error) {
      // If not found, supabase returns error - handle gracefully
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(data);
  } catch (err) {
    next(err);
  }
};

const getOrderLogs = async (req, res, next) => {
  try {
    const { order_number } = req.params;
    // First get the order ID
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id')
      .eq('order_number', order_number)
      .limit(1)
      .single();
    if (orderError || !order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    // Then get the logs
    const { data: logs, error: logsError } = await supabase
      .from('order_logs')
      .select('*')
      .eq('order_id', order.id)
      .order('changed_at', { ascending: true });
    if (logsError) throw logsError;
    res.json(logs || []);
  } catch (err) {
    next(err);
  }
};

const createOrder = async (req, res, next) => {
  try {
    // Prefer validated payload (from Joi) when available
    const body = req.validatedBody || req.body || {};
    const {
      customer_name,
      items: itemsRaw,
      total_amount: totalAmountRaw,
      payment_method,
      order_type,
      address,
      landmark,
      contact_number,
      payment_reference,
      delivery_fee: deliveryFeeRaw,
      notes,
      table_number
    } = body;

    const items = Array.isArray(itemsRaw) ? itemsRaw : (typeof itemsRaw === 'string' ? JSON.parse(itemsRaw) : []);
    const total_amount = Number(totalAmountRaw) || 0;
    const delivery_fee = Number(deliveryFeeRaw) || 0;

    // Stock validation - check availability before creating order
    const productIds = items.map(item => item.product_id);
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, stock, status')
      .in('id', productIds);

    if (productsError) throw productsError;

    // Check for out of stock items
    const outOfStockItems = [];
    const insufficientStockItems = [];

    for (const item of items) {
      const product = products.find(p => p.id === item.product_id);
      if (!product) {
        outOfStockItems.push({ product_id: item.product_id, message: 'Product not found' });
      } else if (product.status === 'out_of_stock') {
        outOfStockItems.push({ product_id: item.product_id, name: product.name, message: 'Product is out of stock' });
      } else if ((product.stock || 0) < item.quantity) {
        insufficientStockItems.push({
          product_id: item.product_id,
          name: product.name,
          requested: item.quantity,
          available: product.stock || 0,
          message: `Insufficient stock (available: ${product.stock || 0})`
        });
      }
    }

    if (outOfStockItems.length > 0 || insufficientStockItems.length > 0) {
      return res.status(400).json({
        message: 'Stock validation failed',
        out_of_stock: outOfStockItems,
        insufficient_stock: insufficientStockItems
      });
    }

    const order_number = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // If payment proof file provided, upload to Supabase storage
    let payment_proof_url = null;
    if (req.file) {
      const file = req.file;
      const ext = (file.originalname || '').split('.').pop();
      const filename = `payment-proofs/${uuidv4()}.${ext}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(filename, file.buffer, { contentType: file.mimetype, upsert: true });
      if (uploadError) throw uploadError;
      const { data: publicData } = supabase.storage.from('payment-proofs').getPublicUrl(filename);
      payment_proof_url = publicData.publicUrl;
    }

    // Determine initial payment status
    const digitalMethods = ['GCash', 'Maya', 'Card'];
    let payment_status = null;
    if (digitalMethods.includes(payment_method)) payment_status = 'Pending Verification';
    else if (payment_method === 'Cash on Delivery' || payment_method === 'Cash') payment_status = 'Paid';

    // 1. Create Order
    const orderPayload = {
      customer_name,
      order_number,
      total_amount,
      payment_method,
      payment_status,
      payment_reference: payment_reference || null,
      payment_proof: payment_proof_url,
      order_type: order_type || 'Pickup',
      address: address || null,
      landmark: landmark || null,
      contact_number: contact_number || null,
      delivery_fee: delivery_fee || 0,
      notes: notes || null,
      table_number: table_number || null,
      status: 'Pending'
    };

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([orderPayload])
      .select()
      .single();

    if (orderError) throw orderError;

    // 2. Create Order Items
    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.price * item.quantity
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    // 3. Batch deduct stock using RPC for atomic operation
    const stockDeductions = items.map(item => {
      const product = products.find(p => p.id === item.product_id);
      return {
        product_id: item.product_id,
        quantity: item.quantity,
        current_stock: product?.stock || 0
      };
    }).filter(item => item.current_stock > 0);

    if (stockDeductions.length > 0) {
      // Use batch update via multiple single calls (more reliable than RPC for this case)
      const updatePromises = stockDeductions.map(item =>
        supabase
          .from('products')
          .update({ stock: item.current_stock - item.quantity })
          .eq('id', item.product_id)
      );
      await Promise.all(updatePromises);
      // Invalidate product cache so API returns fresh stock values
      try {
        cache.flushAll();
      } catch (e) {
        console.warn('Failed to flush cache after stock deduction', e?.message || e);
      }
    }

    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const note = req.body.note || null;
    const id = req.params.id;

    // fetch current order
    const { data: order, error: fetchErr } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();
    if (fetchErr) return res.status(404).json({ message: 'Order not found' });

    const currentStatus = order.status;

    if (status === currentStatus) return res.json(order);

    // validate allowed transition
    const allowed = allowedTransitions[currentStatus] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: `Invalid status transition: ${currentStatus} -> ${status}` });
    }

    // Validate order type specific statuses
    const orderType = order.order_type || 'Pickup';
    if (status === 'Out for Delivery' || status === 'Delivered') {
      if (orderType !== 'Delivery') {
        return res.status(400).json({ message: `Cannot use '${status}' status for ${orderType} orders` });
      }
    }
    if (status === 'Ready for Pickup') {
      if (orderType !== 'Pickup') {
        return res.status(400).json({ message: `Cannot use 'Ready for Pickup' status for ${orderType} orders` });
      }
    }
    if (status === 'Served') {
      if (orderType !== 'Dine-in') {
        return res.status(400).json({ message: `Cannot use 'Served' status for ${orderType} orders` });
      }
    }

    // Payment verification check - cannot proceed to Preparing without verified payment
    const preparingStatuses = ['Preparing', 'Out for Delivery'];
    if (preparingStatuses.includes(status) && order.payment_status !== 'Paid') {
      const paymentMethod = order.payment_method || '';
      const codMethods = ['Cash on Delivery', 'Cash'];
      // Allow if it's Cash payment (treated as Paid) or if payment is already verified
      if (!codMethods.includes(paymentMethod)) {
        return res.status(400).json({
          message: 'Payment must be verified before preparing the order',
          payment_status: order.payment_status,
          requires_verification: true
        });
      }
    }

    // role enforcement for specific transitions
    const transitionKey = `${currentStatus}:${status}`;
    const requiredRoles = transitionRoleRequirements[transitionKey];
    if (requiredRoles && req.user && !requiredRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient role to perform this transition' });
    }

    // prepare update payload
    const updatePayload = { status };
    if (status === 'Out for Delivery') updatePayload.delivery_started_at = new Date().toISOString();
    if (status === 'Delivered') updatePayload.delivered_at = new Date().toISOString();

    const { data: updatedRows, error: updateErr } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', id)
      .select();
    if (updateErr) throw updateErr;

    const updatedOrder = updatedRows[0];

    // Clear sales cache if order is marked as Completed
    if (status === 'Completed' || currentStatus === 'Completed') {
      const keys = cache.keys();
      const salesKeys = keys.filter(k => k.startsWith('sales:report'));
      salesKeys.forEach(k => cache.del(k));
    }

    // insert audit log
    try {
      await supabase.from('order_logs').insert([{
        order_id: id,
        old_status: currentStatus,
        new_status: status,
        changed_by: req.user && req.user.id ? req.user.id : null,
        notes: note || null
      }]);
    } catch (logErr) {
      console.error('Failed to write order log', logErr.message || logErr);
    }

    res.json(updatedOrder);
  } catch (err) {
    next(err);
  }
};

const verifyPayment = async (req, res, next) => {
  try {
    const { payment_status, payment_reference } = req.body;

    // Optional: allow uploading new proof during verification
    let payment_proof_url = null;
    if (req.file) {
      const file = req.file;
      const ext = (file.originalname || '').split('.').pop();
      const filename = `payment-proofs/${uuidv4()}.${ext}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(filename, file.buffer, { contentType: file.mimetype, upsert: true });
      if (uploadError) throw uploadError;
      const { data: publicData } = supabase.storage.from('payment-proofs').getPublicUrl(filename);
      payment_proof_url = publicData.publicUrl;
    }

    const updatePayload = {};
    if (payment_status) updatePayload.payment_status = payment_status;
    if (payment_reference) updatePayload.payment_reference = payment_reference;
    if (payment_proof_url) updatePayload.payment_proof = payment_proof_url;

    const { data, error } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', req.params.id)
      .select();
    if (error) throw error;
    res.json(data[0]);
  } catch (err) {
    next(err);
  }
};

const cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // fetch order
    const { data: order, error: fetchErr } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();
    if (fetchErr) return res.status(404).json({ message: 'Order not found' });

    // Only allow cancel for certain statuses or allow admin/staff override
    const cancellable = ['Pending', 'Preparing', 'Out for Delivery'];

    // Also allow cancel if payment was rejected
    if (order.payment_status === 'Rejected') {
      isAllowed = true;
    }

    let isAllowed = cancellable.includes(order.status);

    // if request contains Authorization header, try to decode and check role
    let actingUserId = null;
    let actingUserRole = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        actingUserId = decoded.id || decoded.userId || null;
        actingUserRole = decoded.role || null;
        // allow staff/admin to cancel regardless of current status
        if (actingUserRole === 'admin' || actingUserRole === 'staff') isAllowed = true;
      } catch (e) {
        // invalid token - ignore and proceed with public rules
      }
    }

    if (!isAllowed) {
      return res.status(400).json({ message: `Cannot cancel order in status ${order.status}` });
    }

    const { data, error } = await supabase
      .from('orders')
      .update({ status: 'Cancelled', cancellation_reason: reason || null, cancellation_time: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;

    // write a cancellation log
    try {
      await supabase.from('order_logs').insert([{
        order_id: id,
        old_status: order.status,
        new_status: 'Cancelled',
        changed_by: actingUserId,
        notes: reason || 'Cancelled by customer'
      }]);
    } catch (logErr) {
      console.error('Failed to write cancellation log', logErr.message || logErr);
    }

    // Restore stock for cancelled order
    try {
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('product_id, quantity')
        .eq('order_id', id);

      if (orderItems && orderItems.length > 0) {
        for (const item of orderItems) {
          // Get current stock
          const { data: product } = await supabase
            .from('products')
            .select('stock')
            .eq('id', item.product_id)
            .single();

          if (product) {
            const newStock = (product.stock || 0) + item.quantity;
            await supabase
              .from('products')
              .update({ stock: newStock })
              .eq('id', item.product_id);
          }
        }
        // Invalidate product cache so API returns fresh stock values after restore
        try {
          cache.flushAll();
        } catch (e) {
          console.warn('Failed to flush cache after stock restore', e?.message || e);
        }
      }
    } catch (stockErr) {
      console.error('Failed to restore stock', stockErr.message || stockErr);
    }

    res.json(data);
  } catch (err) {
    next(err);
  }
};

module.exports = { getOrders, createOrder, updateOrderStatus, verifyPayment, getOrderByNumber, getOrderLogs, cancelOrder };
