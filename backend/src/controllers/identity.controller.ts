import type { Request, Response, NextFunction } from "express";
import { verifyMessage } from "viem";
import * as identityService from "../services/identity.service.js";

/**
 * POST /identity/bind
 * Bind a wallet address to a new Deeproof identity
 */
export async function bindIdentity(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { walletAddress, identityCommitment } = req.body;

        const identity = await identityService.bindIdentity({
            walletAddress,
            identityCommitment,
        });

        res.status(201).json({
            success: true,
            message: "Identity created",
            identity: {
                id: identity.id,
                walletAddress: identity.walletAddress,
                identityCommitment: identity.identityCommitment,
                createdAt: identity.createdAt,
            },
        });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /identity/connect
 * Authenticate wallet via signature and ensure identity exists
 */
export async function connect(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { walletAddress, signature, message } = req.body;

        const valid = await verifyMessage({
            address: walletAddress,
            message: message,
            signature: signature,
        });

        if (!valid) {
            res.status(401).json({
                success: false,
                error: "Invalid signature",
            });
            return;
        }

        const identity = await identityService.connectIdentity(walletAddress);

        // Generate JWT token
        const { generateToken } = await import("../middleware/auth.middleware.js");
        const token = generateToken(walletAddress);

        res.json({
            success: true,
            message: "Wallet connected",
            token,
            identity: {
                id: identity.id,
                walletAddress: identity.walletAddress,
                createdAt: identity.createdAt,
            },
        });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /identity/:walletAddress
 * Get identity by wallet address
 */
export async function getIdentity(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { walletAddress } = req.params;

        const identity = await identityService.getIdentityByWallet(walletAddress);

        if (!identity) {
            res.status(404).json({
                success: false,
                error: "Identity not found",
            });
            return;
        }

        res.json({
            success: true,
            identity: {
                id: identity.id,
                walletAddress: identity.walletAddress,
                identityCommitment: identity.identityCommitment,
                createdAt: identity.createdAt,
            },
        });
    } catch (error) {
        next(error);
    }
}
