const Joi = require('joi');
const { sendError } = require('./auth');

// Validation middleware factory
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return sendError(res, 400, 'VALIDATION_ERROR', 'Validation failed', details);
    }

    req[property] = value;
    next();
  };
};

// Validation schemas
const schemas = {
  // User validation schemas
  login: Joi.object({
    username: Joi.string().alphanum().min(3).max(50).required(),
    password: Joi.string().min(6).required()
  }),

  register: Joi.object({
    username: Joi.string().alphanum().min(3).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required()
      .messages({
        'string.pattern.base': 'Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number'
      }),
    full_name: Joi.string().min(2).max(100).required(),
    role: Joi.string().valid('admin', 'staff').default('staff')
  }),

  // Customer validation schemas
  createCustomer: Joi.object({
    identity_document: Joi.string().pattern(/^[a-zA-Z0-9\-]+$/).min(5).max(20).required(),
    full_name: Joi.string().pattern(/^[a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+$/).min(2).max(100).required(),
    phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
    email: Joi.string().email().optional(),
    address: Joi.string().max(500).optional()
  }),

  updateCustomer: Joi.object({
    identity_document: Joi.string().pattern(/^[a-zA-Z0-9\-]+$/).min(5).max(20).required(),
    full_name: Joi.string().pattern(/^[a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+$/).min(2).max(100).required(),
    phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
    email: Joi.string().email().optional().allow(null),
    address: Joi.string().max(500).optional().allow(null)
  }),

  // Order validation schemas
  createOrder: Joi.object({
    customer_id: Joi.string().uuid().required(),
    furniture_type: Joi.string().min(2).max(100).required(),
    description: Joi.string().min(10).max(2000).required(),
    agreed_price: Joi.number().positive().max(999999.99).required(),
    estimated_delivery: Joi.date().min('now').optional().allow(null),
    materials: Joi.array().items(
      Joi.object({
        material_id: Joi.string().uuid().required(),
        quantity_used: Joi.number().positive().required()
      })
    ).optional()
  }),

  updateOrder: Joi.object({
    customer_id: Joi.string().uuid().required(),
    furniture_type: Joi.string().min(2).max(100).required(),
    description: Joi.string().min(10).max(2000).required(),
    agreed_price: Joi.number().positive().max(999999.99).required(),
    estimated_delivery: Joi.date().min('now').optional().allow(null),
    status: Joi.string().valid('pending', 'in_progress', 'completed', 'delivered').required()
  }),

  // Material validation schemas
  createMaterial: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    category: Joi.string().valid('madera', 'pintura', 'herrajes', 'otros').required(),
    unit: Joi.string().valid('unidades', 'litros', 'kg', 'metros').required(),
    current_stock: Joi.number().min(0).required(),
    min_stock_alert: Joi.number().min(0).required(),
    unit_cost: Joi.number().positive().optional()
  }),

  updateMaterial: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    category: Joi.string().valid('madera', 'pintura', 'herrajes', 'otros').required(),
    unit: Joi.string().valid('unidades', 'litros', 'kg', 'metros').required(),
    current_stock: Joi.number().min(0).required(),
    min_stock_alert: Joi.number().min(0).required(),
    unit_cost: Joi.number().positive().optional().allow(null)
  }),

  // Query parameter validation schemas
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
  }),

  orderFilter: Joi.object({
    status: Joi.string().valid('pending', 'in_progress', 'completed', 'delivered').optional(),
    customer_id: Joi.string().uuid().optional(),
    start_date: Joi.date().optional(),
    end_date: Joi.date().min(Joi.ref('start_date')).optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
  }),

  materialFilter: Joi.object({
    category: Joi.string().valid('madera', 'pintura', 'herrajes', 'otros').optional(),
    low_stock: Joi.boolean().optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
  }),

  customerSearch: Joi.object({
    search: Joi.string().min(1).max(100).optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
  }),

  reportFilter: Joi.object({
    start_date: Joi.date().optional(),
    end_date: Joi.date().min(Joi.ref('start_date')).optional(),
    status: Joi.string().valid('pending', 'in_progress', 'completed', 'delivered').optional(),
    customer_id: Joi.string().uuid().optional(),
    format: Joi.string().valid('json', 'csv').default('json')
  })
};

module.exports = {
  validate,
  schemas
};