const express = require('express');
const supabase = require('../config/supabase');

const router = express.Router();

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ ok: false, error: 'Forbidden' });
    }
    next();
  } catch (e) {
    return res.status(401).json({ ok: false, error: 'Invalid token' });
  }
};

router.get('/supabase', authMiddleware, async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('products').select('id').limit(1);
    if (error) return res.status(500).json({ ok: false, error: error.message });
    res.json({ ok: true, rows: Array.isArray(data) ? data.length : 0 });
  } catch (err) {
    next(err);
  }
});

router.get('/users', authMiddleware, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, role')
      .eq('username', 'jireh')
      .maybeSingle();
    if (error) return res.status(500).json({ ok: false, error: error.message, hint: error });
    if (!data) return res.json({ ok: true, found: false });
    res.json({ ok: true, found: true, user: data });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

router.get('/config', (req, res) => {
  const url = process.env.SUPABASE_URL ? true : false;
  const anon = process.env.SUPABASE_ANON_KEY ? true : false;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY ? true : false;
  res.json({ ok: true, supabaseUrlSet: url, anonKeySet: anon, serviceKeySet: service });
});

module.exports = router;
