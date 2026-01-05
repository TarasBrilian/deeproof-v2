import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET not configured in environment variables");
}

export interface AuthenticatedRequest extends Request {
    user?: {
        walletAddress: string;
    };
}

/**
 * Authentication middleware
 * Validates JWT token and attaches wallet address to request
 */
export function authenticateToken(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): void {
    const authHeader = req.headers["authorization"];
    const token = authHeader?.split(" ")[1]; // Extract "Bearer <token>"

    if (!token) {
        res.status(401).json({
            success: false,
            error: "Authentication required. No token provided.",
        });
        return;
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { walletAddress: string };

        if (!decoded.walletAddress) {
            res.status(401).json({
                success: false,
                error: "Invalid token payload",
            });
            return;
        }

        req.user = { walletAddress: decoded.walletAddress };
        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({
                success: false,
                error: "Token expired. Please sign in again.",
            });
            return;
        }

        if (error instanceof jwt.JsonWebTokenError) {
            res.status(401).json({
                success: false,
                error: "Invalid token",
            });
            return;
        }

        res.status(500).json({
            success: false,
            error: "Authentication error",
        });
    }
}

/**
 * Optional authentication - attaches user if token exists but doesn't fail
 */
export function optionalAuth(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): void {
    const authHeader = req.headers["authorization"];
    const token = authHeader?.split(" ")[1];

    if (!token) {
        next();
        return;
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { walletAddress: string };
        if (decoded.walletAddress) {
            req.user = { walletAddress: decoded.walletAddress };
        }
    } catch (error) {
        // Silently fail for optional auth
    }

    next();
}

/**
 * Generate JWT token for authenticated wallet
 */
export function generateToken(walletAddress: string): string {
    return jwt.sign(
        { walletAddress: walletAddress.toLowerCase() },
        JWT_SECRET,
        { expiresIn: "1h" }
    );
}
