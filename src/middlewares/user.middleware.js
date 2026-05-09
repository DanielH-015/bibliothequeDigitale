export const validateCreate = (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }
  next();
};

export const validateUpdate = (req, res, next) => {
  next();
};
