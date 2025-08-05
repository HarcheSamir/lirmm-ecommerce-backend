// ===== FILE: auth-service/src/config/app.js =====

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('../modules/auth/auth.routes');
const userRoutes = require('../modules/user/user.routes');
const roleRoutes = require('../modules/role/role.routes'); // <-- NEW
const permissionRoutes = require('../modules/permission/permission.routes'); // <-- NEW
const errorHandler = require('../middlewares/errorHandler');

const app = express();

// Global Middlewares
app.use(express.json());
app.use(cors());
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: process.env.SERVICE_NAME});
});

// API Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/roles', roleRoutes);             // <-- NEW
app.use('/permissions', permissionRoutes); // <-- NEW

app.use(errorHandler);

module.exports = app;