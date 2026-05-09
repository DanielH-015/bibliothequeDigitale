export const validateCreate = (req, res, next) => {
  const { bookId, studentId, dueDate } = req.body;
  if (!bookId || !studentId || !dueDate) {
    return res.status(400).json({ message: "bookId, studentId, and dueDate are required." });
  }
  next();
};
