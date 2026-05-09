export const validateCreate = (req, res, next) => {
  const { bookId } = req.body;
  if (!bookId) {
    return res.status(400).json({ message: "bookId is required." });
  }
  next();
};
