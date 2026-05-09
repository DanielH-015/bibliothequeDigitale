export const notFound = (req, res, next) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found.` });
};

export const globalErrorHandler = (error, req, res, next) => {
  // Display full error in server console for the developer
  console.error(`[Error] ${error.message}`);
  
  let statusCode = error.statusCode || 500;
  let message = error.message || "Internal Server Error";

  // 1. Intercept Prisma Validation Errors (e.g. incorrect types like String instead of Boolean)
  if (error.name === 'PrismaClientValidationError') {
    statusCode = 400; // Bad Request
    message = "Incorrect informations. Please check your data format.";
  }
  
  // 2. Intercept Known Prisma Errors (e.g. Duplicates, Not Found)
  if (error.name === 'PrismaClientKnownRequestError') {
    if (error.code === 'P2002') {
      statusCode = 409; // Conflict
      message = "Incorrect informations. This record already exists.";
    } else if (error.code === 'P2025') {
      statusCode = 404; // Not Found
      message = "Record not found.";
    } else {
      statusCode = 400;
      message = "Incorrect informations provided for database operation.";
    }
  }

  // Only send the clean message to the user
  res.status(statusCode).json({ message });
};
