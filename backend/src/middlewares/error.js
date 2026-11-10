
class ErrorHandler extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.name = "ErrorHandler";

        Error.captureStackTrace?.(this, this.constructor);
    }
}

export const errorMiddleware = (err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";

    // MongoDB duplicate key error
    if (err.code === 11000) {
        statusCode = 400;

        const field = err.keyValue
            ? Object.keys(err.keyValue)[0]
            : "field";

        message = `Duplicate ${field} entered`;
    }

    // Invalid MongoDB ObjectId
    else if (err.name === "CastError") {
        statusCode = 400;
        message = `Invalid value for ${err.path}`;
    }

    // Mongoose validation error
    else if (err.name === "ValidationError") {
        statusCode = 400;

        message = Object.values(err.errors)
            .map((error) => error.message)
            .join(", ");
    }

    // Invalid or expired JWT
    else if (
        err.name === "JsonWebTokenError" ||
        err.name === "TokenExpiredError"
    ) {
        statusCode = 401;
        message = "Invalid or expired authentication token";
    }

    // Hide unexpected internal server errors
    if (statusCode >= 500) {
        message = "Internal Server Error";

        if (process.env.NODE_ENV !== "production") {
            console.error(err);
        }
    }

    return res.status(statusCode).json({
        success: false,
        message
    });
};

export default ErrorHandler;
