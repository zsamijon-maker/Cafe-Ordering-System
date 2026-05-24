const supabase = require('../config/supabase');
const { cache, CACHE_TTL } = require('../services/cache');
const { ORDER_STATUS } = require('../constants');

const getSalesReport = async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;
    const cacheKey = `sales:report:${start_date || 'all'}:${end_date || 'all'}`;

    // Check cache first
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    let query = supabase
      .from('orders')
      .select('total_amount, created_at')
      .eq('status', ORDER_STATUS.COMPLETED);

    if (start_date) {
      query = query.gte('created_at', start_date);
    }
    if (end_date) {
      query = query.lte('created_at', end_date);
    }

    const { data, error } = await query;
    if (error) throw error;

    const totalSales = data.reduce((sum, order) => sum + order.total_amount, 0);
    const orderCount = data.length;

    const result = {
      totalSales,
      orderCount,
      orders: data
    };

    // Cache the result
    cache.set(cacheKey, result, CACHE_TTL.SALES_REPORT);

    res.json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = { getSalesReport };
