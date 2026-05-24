const Joi = require('joi');
const { ORDER_STATUSES, PAYMENT_STATUSES, ORDER_TYPES, ROLE } = require('../constants');

// Validation schemas
const schemas = {
  login: Joi.object({
    username: Joi.string().min(1).required(),
    password: Joi.string().min(1).required(),
  }),

  createProduct: Joi.object({
    name: Joi.string().min(1).max(255).required(),
    description: Joi.string().allow('', null),
    price: Joi.number().min(0).required(),
    category_id: Joi.string().uuid().allow(null),
    stock: Joi.number().integer().min(0).default(0),
    status: Joi.string().valid('available', 'out_of_stock', 'archived').default('available'),
    image_url: Joi.string().uri().allow('', null),
  }),

  updateProduct: Joi.object({
    name: Joi.string().min(1).max(255),
    description: Joi.string().allow('', null),
    price: Joi.number().min(0),
    category_id: Joi.string().uuid().allow(null),
    stock: Joi.number().integer().min(0),
    status: Joi.string().valid('available', 'out_of_stock', 'archived'),
    image_url: Joi.string().uri().allow('', null),
  }),

  createOrder: Joi.object({
    customer_name: Joi.string().min(1).max(255).required(),
    items: Joi.array().items(Joi.object({
      product_id: Joi.string().uuid().required(),
      quantity: Joi.number().integer().min(1).required(),
      price: Joi.number().min(0).required(),
    })).min(1).required(),
    total_amount: Joi.number().min(0).required(),
    payment_method: Joi.string().valid('Cash', 'GCash', 'Maya', 'Card', 'Cash on Delivery').required(),
    order_type: Joi.string().valid(...ORDER_TYPES).default('Pickup'),
    address: Joi.when('order_type', {
      is: 'Delivery',
      then: Joi.string().min(3).required(),
      otherwise: Joi.string().allow('', null)
    }),
    landmark: Joi.when('order_type', {
      is: 'Delivery',
      then: Joi.string().min(1).required(),
      otherwise: Joi.string().allow('', null)
    }),
    contact_number: Joi.when('order_type', {
      is: 'Delivery',
      then: Joi.string().min(7).required(),
      otherwise: Joi.string().allow('', null)
    }),
    payment_reference: Joi.string().allow('', null),
    delivery_fee: Joi.number().min(0).default(0),
    notes: Joi.string().allow('', null),
    table_number: Joi.when('order_type', {
      is: 'Dine-in',
      then: Joi.string().min(1).required(),
      otherwise: Joi.string().allow('', null)
    }),
  }),

  createStaff: Joi.object({
    name: Joi.string().min(1).max(255).required(),
    username: Joi.string().min(3).max(50).required(),
    password: Joi.string().min(6).max(128).required(),
  }),

  updateOrderStatus: Joi.object({
    status: Joi.string().valid(...ORDER_STATUSES).required(),
    note: Joi.string().allow('', null),
  }),

  verifyPayment: Joi.object({
    payment_status: Joi.string().valid(...PAYMENT_STATUSES),
    payment_reference: Joi.string().allow('', null),
  }),
};

// Middleware factory for validation
const validate = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    if (!schema) {
      return res.status(500).json({ message: 'Validation schema not found' });
    }

    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const messages = error.details.map(detail => detail.message).join(', ');
      return res.status(400).json({ message: `Validation error: ${messages}` });
    }

    req.validatedBody = value;
    next();
  };
};

module.exports = { validate, schemas };