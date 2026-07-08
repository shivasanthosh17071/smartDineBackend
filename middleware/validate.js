// Simple request body field validator generator
// Usage: validate(['name', 'email', 'password'])
const validate = (requiredFields = []) => {
  return (req, res, next) => {
    const missing = requiredFields.filter((field) => {
      const value = req.body[field];
      return value === undefined || value === null || value === "";
    });

    if (missing.length > 0) {
      res.status(400);
      return next(new Error(`Missing required field(s): ${missing.join(", ")}`));
    }
    next();
  };
};

module.exports = validate;
