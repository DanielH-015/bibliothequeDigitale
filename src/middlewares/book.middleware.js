export const validateCreate = (req, res, next) => {
  const { title, author, isbn, category } = req.body;
  if (!title || !author || !isbn || !category) {
    return res.status(400).json({ message: "Title, author, isbn, and category are required." });
  }
  next();
};

export const validateUpdate = (req, res, next) => {
  next();
};
