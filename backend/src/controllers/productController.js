const supabase = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');
const { cache, CACHE_TTL, getProductCacheKey } = require('../services/cache');

const getProducts = async (req, res, next) => {
  try {
    const { status, category_id, search } = req.query;
    const cacheKey = getProductCacheKey(req.query);

    // Check cache first
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    let query = supabase
      .from('products')
      .select('*, categories(name)');

    // Filter by status (default to active only for performance)
    if (status) {
      query = query.eq('status', status);
    } else {
      // Default to active products only for better performance
      query = query.neq('status', 'archived');
    }

    if (category_id) {
      query = query.eq('category_id', category_id);
    }

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data, error } = await query.order('name');
    if (error) throw error;

    // Cache the result
    cache.set(cacheKey, data, CACHE_TTL.PRODUCTS);

    res.json(data);
  } catch (err) {
    next(err);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .insert([req.body])
      .select();
    if (error) throw error;

    // Invalidate products cache on any change
    cache.flushAll();

    res.status(201).json(data[0]);
  } catch (err) {
    next(err);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .update(req.body)
      .eq('id', req.params.id)
      .select();
    if (error) throw error;

    // Invalidate products cache on any change
    cache.flushAll();

    res.json(data[0]);
  } catch (err) {
    next(err);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', req.params.id);
    if (error) throw error;

    // Invalidate products cache on any change
    cache.flushAll();

    res.json({ message: 'Product deleted' });
  } catch (err) {
    next(err);
  }
};

const uploadProductImage = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const file = req.file; // multer places buffer in file.buffer
    const ext = (file.originalname || '').split('.').pop();
    const filename = `products/${uuidv4()}.${ext}`;

    // Upload to Supabase storage (bucket 'product-images' must exist)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filename, file.buffer, { contentType: file.mimetype, upsert: true });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: publicData } = supabase.storage.from('product-images').getPublicUrl(filename);
    const publicUrl = publicData.publicUrl;

    // If product id provided, update product record
    const productId = req.body.id;
    if (productId) {
      const { data: updated, error: updateError } = await supabase
        .from('products')
        .update({ image_url: publicUrl })
        .eq('id', productId)
        .select();
      if (updateError) throw updateError;
      return res.json({ image_url: publicUrl, product: updated[0] });
    }

    res.json({ image_url: publicUrl });
  } catch (err) {
    next(err);
  }
};

module.exports = { getProducts, createProduct, updateProduct, deleteProduct, uploadProductImage };

