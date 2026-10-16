const errorMiddleware = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const validation = err.name === 'ValidationError' || err.name === 'CastError';
  const statusCode = validation ? 400 : (err.statusCode || err.status || 500);
  const message = validation ? 'Validation failed' : statusCode >= 500 ? 'Internal server error' : err.message;

  if (process.env.NODE_ENV !== 'test') {
    console.error('Server error:', err);
  }

  return res.status(statusCode).json({
    success: false,
    message,
    errors: validation ? Object.values(err.errors || {}).map(error => ({ field: error.path, message: error.message })) : [],
  });
};

export default errorMiddleware;
