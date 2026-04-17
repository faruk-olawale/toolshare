'use strict';

// ── Production-safe global error handler ─────────────────────────────────────
// Catches all errors passed via next(err) across the entire app.
// Logs exact route, method and error so Render logs are actionable.
const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  const isDev  = process.env.NODE_ENV !== 'production';
  const method = req.method;
  const url    = req.originalUrl;

  // ── Determine status code ─────────────────────────────────────────────────
  let statusCode = err.statusCode || err.status || 500;
  let message    = err.message    || 'Internal Server Error';

  // ── Mongoose: duplicate key (e.g. duplicate email) ───────────────────────
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message    = `An account with this ${field} already exists.`;
    statusCode = 409;
  }

  // ── Mongoose: validation error ────────────────────────────────────────────
  if (err.name === 'ValidationError') {
    message    = Object.values(err.errors).map(e => e.message).join(', ');
    statusCode = 400;
  }

  // ── Mongoose: bad ObjectId (e.g. /api/tools/not-an-id) ───────────────────
  if (err.name === 'CastError') {
    message    = `Invalid ${err.path}: ${err.value}`;
    statusCode = 400;
  }

  // ── JWT errors ────────────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError')  { message = 'Invalid token.';  statusCode = 401; }
  if (err.name === 'TokenExpiredError')  { message = 'Token expired.';  statusCode = 401; }
  if (err.name === 'NotBeforeError')     { message = 'Token not active.'; statusCode = 401; }

  // ── Multer errors ─────────────────────────────────────────────────────────
  if (err.code === 'LIMIT_FILE_SIZE')       { message = 'File too large. Maximum is 10MB.'; statusCode = 400; }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') { message = 'Unexpected file field.';           statusCode = 400; }

  // ── Log every 500 with full detail ───────────────────────────────────────
  if (statusCode >= 500) {
    console.error(
      `\x1b[31m[${statusCode}] ${method} ${url}\x1b[0m`,
      `\n  Error: ${err.name || 'Error'}: ${err.message}`,
      isDev ? `\n  Stack: ${err.stack}` : ''
    );
  } else if (statusCode >= 400) {
    // 4xx — log at warn level (not an app bug, but useful for debugging)
    console.warn(`\x1b[33m[${statusCode}] ${method} ${url} — ${message}\x1b[0m`);
  }

  res.status(statusCode).json({
    success: false,
    message,
    // Include stack trace only in development
    ...(isDev && statusCode >= 500 && { stack: err.stack }),
  });
};

module.exports = errorHandler;