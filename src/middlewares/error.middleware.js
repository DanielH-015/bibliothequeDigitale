class ErrorMiddleware {
  
  // Method for capturing non-existent routes (404 Error)
  notFound(req, res, next) {
    res.status(404).json({ message: `Route ${req.originalUrl} not found.` });
  }

  // Global method for capturing all other errors (500 Error)
  globalErrorHandler(error, req, res, next) {
    console.error(`[Error] ${error.message}`);
    
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      message: error.message || "Internal Server Error",
    });
  }
}

// We instanciate the class
export const errorMiddleware = new ErrorMiddleware();
