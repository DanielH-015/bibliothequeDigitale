export const validateCreate = (req, res, next) => {
  const { firstName, lastName, email, password, registrationNumber, birthDate, classroom, studyStream } = req.body;
  if (!firstName || !lastName || !email || !password || !registrationNumber || !birthDate || !classroom || !studyStream) {
    return res.status(400).json({ message: "All required fields must be provided." });
  }
  next();
};

export const validateUpdate = (req, res, next) => {
  next();
};
