const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const apiRouter = require('./routes/api');
const authRouter = require('./routes/auth');
const { initialize } = require('./db');

const app = express();

app.use(logger('dev'));
// Enable CORS for frontend. Configure with FRONTEND_ORIGINS (CSV) or FRONTEND_ORIGIN env var.
// Example: FRONTEND_ORIGINS="https://p5opc-xvcz.vercel.app,http://localhost:3000"
const rawOrigins = process.env.FRONTEND_ORIGINS || process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
const FRONTEND_ORIGINS = rawOrigins.split(',').map((s) => s.trim()).filter(Boolean);

// Use a dynamic origin function so we return an explicit origin when credentials=true.
app.use(cors({
  origin: function (origin, callback) {
    // Allow non-browser requests or same-origin requests (no origin)
    if (!origin) return callback(null, true);
    if (FRONTEND_ORIGINS.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    return callback(new Error('CORS policy: origin not allowed'), false);
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize database and expose via app.locals
initialize().then((db) => {
  app.locals.db = db;
  console.log('Database initialized');
}).catch((err) => {
  console.error('Database initialization failed:', err);
});

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/api', apiRouter);
app.use('/auth', authRouter);

module.exports = app;
