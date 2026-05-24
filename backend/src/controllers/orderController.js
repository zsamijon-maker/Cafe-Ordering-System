const supabase = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const { cache } = require('../services/cache');
const { ALLOWED_TRANSITIONS, ORDER_STATUS, PAYMENT_STATUS, ORDER_TYPE, DIGITAL_PAYMENT_METHODS, COD_METHODS, ROLE } = require('../constants');

// Role permission matrix for specific transitions (empty = admin and staff)
const transitionRoleRequirements = {};

const findProductById = (products, productId) =>
  products.find(p => String(p.id) === String(productId));

const deductProductStock = async (items, products) => {
  for (const item of items) {
    const product = findProductById(products, item.product_id);
    if (!product) {
      throw new Error(`Product not found for stock deduction: ${item.product_id}`);
    }

    const currentStock = Number(product.stock) || 0;
    const newStock = Math.max(0, currentStock - item.quantity);
    const updatePayload = { stock: newStock };
    if (newStock <= 0) {
      updatePayload.status = 'out_of_stock';
    }

    const { data: updatedRows, error: updateError } = await supabase
      .from('products')
      .update(updatePayload)
      .eq('id', product.id)
      .select('id, stock, status');

    if (updateError) {
      throw new Error(`Failed to deduct stock for product ${product.id}: ${updateError.message}`);
    }
    if (!updatedRows || updatedRows.length === 0) {
      throw new Error(
        `Stock update returned no rows for product ${product.id}. Check Supabase RLS or use SUPABASE_SERVICE_ROLE_KEY on the server.`
      );
    }
  }

  try {
    cache.flushAll();
  } catch (e) {
    console.warn('Failed to flush cache after stock deduction', e?.message || e);
  }
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
      const product = findProductById(products, item.product_id);
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
    let payment_status = null;
    if (DIGITAL_PAYMENT_METHODS.includes(payment_method)) payment_status = PAYMENT_STATUS.PENDING_VERIFICATION;
    else if (COD_METHODS.includes(payment_method)) payment_status = PAYMENT_STATUS.PAID;

    // 1. Create Order
    const orderPayload = {
      customer_name,
      order_number,
      total_amount,
      payment_method,
      payment_status,
      payment_reference: payment_reference || null,
      payment_proof: payment_proof_url,
      order_type: order_type || ORDER_TYPE.PICKUP,
      address: address || null,
      landmark: landmark || null,
      contact_number: contact_number || null,
      delivery_fee: delivery_fee || 0,
      notes: notes || null,
      table_number: table_number || null,
      status: ORDER_STATUS.PENDING
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

    // 3. Deduct stock for each ordered item (fail loudly if update is blocked)
    try {
      await deductProductStock(items, products);
    } catch (stockErr) {
      console.error('Stock deduction failed, rolling back order', stockErr.message || stockErr);
      await supabase.from('order_items').delete().eq('order_id', order.id);
      await supabase.from('orders').delete().eq('id', order.id);
      return res.status(500).json({
        message: 'Order could not be completed because stock could not be updated',
        detail: stockErr.message
      });
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

    const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: `Invalid status transition: ${currentStatus} -> ${status}` });
    }

    // Validate order type specific statuses
    const orderType = order.order_type || ORDER_TYPE.PICKUP;
    if (status === ORDER_STATUS.OUT_FOR_DELIVERY || status === ORDER_STATUS.DELIVERED) {
      if (orderType !== ORDER_TYPE.DELIVERY) {
        return res.status(400).json({ message: `Cannot use '${status}' status for ${orderType} orders` });
      }
    }
    if (status === ORDER_STATUS.READY_FOR_PICKUP) {
      if (orderType !== ORDER_TYPE.PICKUP) {
        return res.status(400).json({ message: `Cannot use 'Ready for Pickup' status for ${orderType} orders` });
      }
    }
    if (status === ORDER_STATUS.SERVED) {
      if (orderType !== ORDER_TYPE.DINE_IN) {
        return res.status(400).json({ message: `Cannot use 'Served' status for ${orderType} orders` });
      }
    }

    const preparingStatuses = [ORDER_STATUS.PREPARING, ORDER_STATUS.OUT_FOR_DELIVERY];
    if (preparingStatuses.includes(status) && order.payment_status !== PAYMENT_STATUS.PAID) {
      const paymentMethod = order.payment_method || '';
      if (!COD_METHODS.includes(paymentMethod)) {
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
    if (status === ORDER_STATUS.OUT_FOR_DELIVERY) updatePayload.delivery_started_at = new Date().toISOString();
    if (status === ORDER_STATUS.DELIVERED) updatePayload.delivered_at = new Date().toISOString();

    const { data: updatedRows, error: updateErr } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', id)
      .select();
    if (updateErr) throw updateErr;

    const updatedOrder = updatedRows[0];

    if (status === ORDER_STATUS.COMPLETED || currentStatus === ORDER_STATUS.COMPLETED) {
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

    const cancellable = [ORDER_STATUS.PENDING, ORDER_STATUS.PREPARING, ORDER_STATUS.OUT_FOR_DELIVERY];
    let isAllowed = cancellable.includes(order.status) || order.payment_status === PAYMENT_STATUS.REJECTED;

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
        if (actingUserRole === ROLE.ADMIN || actingUserRole === ROLE.STAFF) isAllowed = true;
      } catch (e) {
        // invalid token - ignore and proceed with public rules
      }
    }

    if (!isAllowed) {
      return res.status(400).json({ message: `Cannot cancel order in status ${order.status}` });
    }

    const { data, error } = await supabase
      .from('orders')
      .update({ status: ORDER_STATUS.CANCELLED, cancellation_reason: reason || null, cancellation_time: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;

    // write a cancellation log
    try {
      await supabase.from('order_logs').insert([{
        order_id: id,
        old_status: order.status,
        new_status: ORDER_STATUS.CANCELLED,
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
