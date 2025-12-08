const bcrypt = require('bcryptjs');
const { queryOne, queryMany } = require('../utils/database');
const { generateToken, sendSuccess, sendError } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { schemas } = require('../middleware/validation');

// User login
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user by username
    const user = await queryOne(
      'SELECT id, username, email, password_hash, role, full_name FROM users WHERE username = $1',
      [username]
    );

    if (!user) {
      return sendError(res, 401, 'INVALID_CREDENTIALS', 'Invalid username or password');
    }

    // Compare password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return sendError(res, 401, 'INVALID_CREDENTIALS', 'Invalid username or password');
    }

    // Generate JWT token
    const token = generateToken(user);

    // Remove password hash from response
    const { password_hash, ...userWithoutPassword } = user;

    sendSuccess(res, {
      user: userWithoutPassword,
      token
    }, 'Login successful');
  } catch (error) {
    console.error('Login error:', error);
    sendError(res, 500, 'SERVER_ERROR', 'Internal server error');
  }
};

// Get current user info
const getCurrentUser = async (req, res) => {
  try {
    sendSuccess(res, {
      user: req.user
    }, 'User retrieved successfully');
  } catch (error) {
    console.error('Get current user error:', error);
    sendError(res, 500, 'SERVER_ERROR', 'Internal server error');
  }
};

// User registration (admin only)
const register = async (req, res) => {
  try {
    const { username, email, password, full_name, role } = req.body;

    // Check if username already exists
    const existingUsername = await queryOne(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (existingUsername) {
      return sendError(res, 409, 'USERNAME_EXISTS', 'Username already exists');
    }

    // Check if email already exists
    const existingEmail = await queryOne(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingEmail) {
      return sendError(res, 409, 'EMAIL_EXISTS', 'Email already exists');
    }

    // Hash password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const newUser = await queryOne(
      `INSERT INTO users (username, email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, email, role, full_name, created_at`,
      [username, email, password_hash, full_name, role]
    );

    sendSuccess(res, {
      user: newUser
    }, 'User created successfully');
  } catch (error) {
    console.error('Registration error:', error);
    sendError(res, 500, 'SERVER_ERROR', 'Internal server error');
  }
};

// User logout (client-side token removal)
const logout = (req, res) => {
  sendSuccess(res, null, 'Logout successful');
};

// Get all users (admin only)
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const users = await queryMany(
      `SELECT id, username, email, role, full_name, created_at, updated_at
       FROM users
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const totalResult = await queryOne('SELECT COUNT(*) as total FROM users');
    const total = parseInt(totalResult.total);

    sendSuccess(res, {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }, 'Users retrieved successfully');
  } catch (error) {
    console.error('Get all users error:', error);
    sendError(res, 500, 'SERVER_ERROR', 'Internal server error');
  }
};

// Update user (admin only)
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, full_name, role } = req.body;

    // Check if user exists
    const existingUser = await queryOne(
      'SELECT id FROM users WHERE id = $1',
      [id]
    );

    if (!existingUser) {
      return sendError(res, 404, 'USER_NOT_FOUND', 'User not found');
    }

    // Check if username already exists (excluding current user)
    const existingUsername = await queryOne(
      'SELECT id FROM users WHERE username = $1 AND id != $2',
      [username, id]
    );

    if (existingUsername) {
      return sendError(res, 409, 'USERNAME_EXISTS', 'Username already exists');
    }

    // Check if email already exists (excluding current user)
    const existingEmail = await queryOne(
      'SELECT id FROM users WHERE email = $1 AND id != $2',
      [email, id]
    );

    if (existingEmail) {
      return sendError(res, 409, 'EMAIL_EXISTS', 'Email already exists');
    }

    // Update user
    const updatedUser = await queryOne(
      `UPDATE users
       SET username = $1, email = $2, full_name = $3, role = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING id, username, email, role, full_name, updated_at`,
      [username, email, full_name, role, id]
    );

    sendSuccess(res, {
      user: updatedUser
    }, 'User updated successfully');
  } catch (error) {
    console.error('Update user error:', error);
    sendError(res, 500, 'SERVER_ERROR', 'Internal server error');
  }
};

// Delete user (admin only)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const existingUser = await queryOne(
      'SELECT id, role FROM users WHERE id = $1',
      [id]
    );

    if (!existingUser) {
      return sendError(res, 404, 'USER_NOT_FOUND', 'User not found');
    }

    // Prevent deleting the last admin
    if (existingUser.role === 'admin') {
      const adminCount = await queryOne(
        "SELECT COUNT(*) as count FROM users WHERE role = 'admin'"
      );

      if (parseInt(adminCount.count) <= 1) {
        return sendError(res, 403, 'CANNOT_DELETE_LAST_ADMIN', 'Cannot delete the last admin user');
      }
    }

    // Check if user has created orders
    const ordersCount = await queryOne(
      'SELECT COUNT(*) as count FROM orders WHERE created_by = $1',
      [id]
    );

    if (parseInt(ordersCount.count) > 0) {
      return sendError(res, 409, 'USER_HAS_ORDERS', 'Cannot delete user who has created orders');
    }

    // Delete user
    await queryOne('DELETE FROM users WHERE id = $1', [id]);

    sendSuccess(res, null, 'User deleted successfully');
  } catch (error) {
    console.error('Delete user error:', error);
    sendError(res, 500, 'SERVER_ERROR', 'Internal server error');
  }
};

module.exports = {
  login: [validate(schemas.login), login],
  getCurrentUser,
  register: [validate(schemas.register), register],
  logout,
  getAllUsers,
  updateUser: [validate(schemas.register), updateUser],
  deleteUser
};