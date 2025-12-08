const { queryOne, queryMany, transaction } = require('../utils/database');
const { sendSuccess, sendError } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { schemas } = require('../middleware/validation');

// Get all customers with pagination and search
const getAllCustomers = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);

    let baseQuery = `
      SELECT id, identity_document, full_name, phone, email, address, created_at, updated_at
      FROM customers
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM customers';
    const params = [];

    if (search) {
      const searchCondition = ` WHERE full_name ILIKE $1 OR identity_document ILIKE $1 OR email ILIKE $1`;
      baseQuery += searchCondition;
      countQuery += searchCondition;
      params.push(`%${search}%`);
    }

    baseQuery += ` ORDER BY full_name ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limitNum, offset);

    const customers = await queryMany(baseQuery, params);

    const totalResult = await queryOne(countQuery, search ? [params[0]] : []);
    const total = parseInt(totalResult.total);

    sendSuccess(res, {
      customers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    }, 'Customers retrieved successfully');
  } catch (error) {
    console.error('Get customers error:', error);
    sendError(res, 500, 'SERVER_ERROR', 'Internal server error');
  }
};

// Get customer by ID
const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await queryOne(
      `SELECT id, identity_document, full_name, phone, email, address, created_at, updated_at
       FROM customers WHERE id = $1`,
      [id]
    );

    if (!customer) {
      return sendError(res, 404, 'CUSTOMER_NOT_FOUND', 'Customer not found');
    }

    // Get customer's order count
    const orderCount = await queryOne(
      'SELECT COUNT(*) as count FROM orders WHERE customer_id = $1',
      [id]
    );

    sendSuccess(res, {
      customer: {
        ...customer,
        order_count: parseInt(orderCount.count)
      }
    }, 'Customer retrieved successfully');
  } catch (error) {
    console.error('Get customer error:', error);
    sendError(res, 500, 'SERVER_ERROR', 'Internal server error');
  }
};

// Create new customer
const createCustomer = async (req, res) => {
  try {
    const { identity_document, full_name, phone, email, address } = req.body;

    // Check if identity document already exists
    const existingCustomer = await queryOne(
      'SELECT id FROM customers WHERE identity_document = $1',
      [identity_document]
    );

    if (existingCustomer) {
      return sendError(res, 409, 'DUPLICATE_IDENTITY_DOCUMENT', 'Identity document already exists');
    }

    // Check if email already exists (if provided)
    if (email) {
      const existingEmail = await queryOne(
        'SELECT id FROM customers WHERE email = $1',
        [email]
      );

      if (existingEmail) {
        return sendError(res, 409, 'EMAIL_EXISTS', 'Email already exists');
      }
    }

    // Create customer
    const newCustomer = await queryOne(
      `INSERT INTO customers (identity_document, full_name, phone, email, address)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, identity_document, full_name, phone, email, address, created_at`,
      [identity_document, full_name, phone, email, address]
    );

    sendSuccess(res, {
      customer: newCustomer
    }, 'Customer created successfully');
  } catch (error) {
    console.error('Create customer error:', error);
    sendError(res, 500, 'SERVER_ERROR', 'Internal server error');
  }
};

// Update customer
const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { identity_document, full_name, phone, email, address } = req.body;

    // Check if customer exists
    const existingCustomer = await queryOne(
      'SELECT id FROM customers WHERE id = $1',
      [id]
    );

    if (!existingCustomer) {
      return sendError(res, 404, 'CUSTOMER_NOT_FOUND', 'Customer not found');
    }

    // Check if identity document already exists (excluding current customer)
    const duplicateIdentity = await queryOne(
      'SELECT id FROM customers WHERE identity_document = $1 AND id != $2',
      [identity_document, id]
    );

    if (duplicateIdentity) {
      return sendError(res, 409, 'DUPLICATE_IDENTITY_DOCUMENT', 'Identity document already exists');
    }

    // Check if email already exists (if provided and excluding current customer)
    if (email) {
      const duplicateEmail = await queryOne(
        'SELECT id FROM customers WHERE email = $1 AND id != $2',
        [email, id]
      );

      if (duplicateEmail) {
        return sendError(res, 409, 'EMAIL_EXISTS', 'Email already exists');
      }
    }

    // Update customer
    const updatedCustomer = await queryOne(
      `UPDATE customers
       SET identity_document = $1, full_name = $2, phone = $3, email = $4, address = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING id, identity_document, full_name, phone, email, address, updated_at`,
      [identity_document, full_name, phone, email, address, id]
    );

    sendSuccess(res, {
      customer: updatedCustomer
    }, 'Customer updated successfully');
  } catch (error) {
    console.error('Update customer error:', error);
    sendError(res, 500, 'SERVER_ERROR', 'Internal server error');
  }
};

// Delete customer (admin only)
const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if customer exists
    const existingCustomer = await queryOne(
      'SELECT id FROM customers WHERE id = $1',
      [id]
    );

    if (!existingCustomer) {
      return sendError(res, 404, 'CUSTOMER_NOT_FOUND', 'Customer not found');
    }

    // Check if customer has orders
    const orderCount = await queryOne(
      'SELECT COUNT(*) as count FROM orders WHERE customer_id = $1',
      [id]
    );

    if (parseInt(orderCount.count) > 0) {
      return sendError(res, 409, 'CUSTOMER_HAS_ORDERS', 'Cannot delete customer with existing orders');
    }

    // Delete customer
    await queryOne('DELETE FROM customers WHERE id = $1', [id]);

    sendSuccess(res, null, 'Customer deleted successfully');
  } catch (error) {
    console.error('Delete customer error:', error);
    sendError(res, 500, 'SERVER_ERROR', 'Internal server error');
  }
};

// Get customer statistics
const getCustomerStats = async (req, res) => {
  try {
    // Total customers
    const totalCustomers = await queryOne('SELECT COUNT(*) as count FROM customers');

    // Customers created in last 30 days
    const recentCustomers = await queryOne(
      `SELECT COUNT(*) as count FROM customers
       WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'`
    );

    // Customers with orders vs without orders
    const customersWithOrders = await queryOne(
      `SELECT COUNT(DISTINCT customer_id) as count FROM orders`
    );

    const customersWithoutOrders = {
      count: parseInt(totalCustomers.count) - parseInt(customersWithOrders.count)
    };

    sendSuccess(res, {
      total_customers: parseInt(totalCustomers.count),
      recent_customers: parseInt(recentCustomers.count),
      customers_with_orders: parseInt(customersWithOrders.count),
      customers_without_orders: parseInt(customersWithoutOrders.count)
    }, 'Customer statistics retrieved successfully');
  } catch (error) {
    console.error('Get customer stats error:', error);
    sendError(res, 500, 'SERVER_ERROR', 'Internal server error');
  }
};

module.exports = {
  getAllCustomers: [validate(schemas.customerSearch, 'query'), getAllCustomers],
  getCustomerById,
  createCustomer: [validate(schemas.createCustomer), createCustomer],
  updateCustomer: [validate(schemas.updateCustomer), updateCustomer],
  deleteCustomer,
  getCustomerStats
};