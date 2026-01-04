import type { Request, Response, NextFunction } from "express";
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
