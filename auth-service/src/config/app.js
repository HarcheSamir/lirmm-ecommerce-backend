const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('../modules/auth/auth.routes');
const userRoutes = require('../modules/user/user.routes');
const errorHandler = require('../middlewares/errorHandler');

const app = express();

// Global Middlewares
app.use(express.json());
app.use(cors());
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health Check Endpoint for Consul
app.get('/health', (req, res) => {
  // TODO: Add database connection check if needed
  res.status(200).json({ status: 'UP', service: process.env.SERVICE_NAME});
});


// Now mount the routes directly without a sub-prefix that differs from the gateway path.
// For example, if the client calls `/api/auth/register`, the authRoutes should respond to `/register`.
app.use('/', authRoutes);         // This mounts routes defined in auth.routes (e.g., /register, /login, /me, /validate)
// Mount users routes at '/users' so that `/api/auth/users/:id` will resolve correctly.
app.use('/users', userRoutes);

app.use(errorHandler);

module.exports = app;
