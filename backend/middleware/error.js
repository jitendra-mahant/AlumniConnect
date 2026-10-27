const ApiError = require('../utils/ApiError');

const notFound = (req, _res, next) => next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, _req, res, _next) => {
  let status = err.status || 500;
  let message = err.message || 'Server error';
  let details = err.details;

  if (err.name === 'ValidationError') {
    status = 400;
    details = Object.values(err.errors).map((e) => e.message);
    message = details[0] || 'Validation failed';
  } else if (err.name === 'CastError') {
    status = 400;
    message = `Invalid ${err.path}`;
  } else if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyPattern || {})[0] || 'value';
    if (field === 'email') {
      message = 'An account with this institutional email already exists. Please log in or reset your password.';
      details = { code: 'DUPLICATE_EMAIL' };
    } else {
      message = `Duplicate ${field}`;
    }
  }

  if (status >= 500) console.error('[error]', err);

  const extra = typeof details === 'object' && !Array.isArray(details) ? details : {};
  res.status(status).json({
    success: false,
    message,
    ...extra,
    ...(details ? { details } : {}),
  });
};

module.exports = { notFound, errorHandler };
