import type { Request, Response, NextFunction } from "express";

interface AppError extends Error {
    statusCode?: number;
    code?: string;
}

export function errorHandler(
    err: AppError,
    _req: Request,
    res: Response,
    _next: NextFunction
): void {
    console.error("[Error]", err.message);

    // PostgreSQL unique constraint violation
    if (err.code === "23505") {
        res.status(409).json({
            success: false,
            error: "Resource already exists",
            message: err.message,
        });
        return;
    }

    // PostgreSQL foreign key violation
    if (err.code === "23503") {
        res.status(400).json({
            success: false,
            error: "Invalid reference",
            message: err.message,
        });
        return;
    }

    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        error: statusCode === 500 ? "Internal server error" : err.message,
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
}
