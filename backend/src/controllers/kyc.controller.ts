import type { Request, Response, NextFunction } from "express";
import * as kycService from "../services/kyc.service.js";

/**
 * POST /kyc/submit
 * Submit KYC proof metadata for verification
 */
export async function submitKyc(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { walletAddress, proofReference, commitment, provider, txHash, kycScore } = req.body;

        const kyc = await kycService.submitKyc({
            walletAddress,
            proofReference,
            commitment,
            provider,
            txHash,
            kycScore,
        });

        res.status(201).json({
            success: true,
            message: kyc.status === "VERIFIED" ? "KYC verified" : "KYC submitted, pending verification",
            kyc: {
                id: kyc.id,
                status: kyc.status,
                kycScore: kyc.kycScore,
                provider: kyc.provider,
                verifiedAt: kyc.verifiedAt,
            },
        });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /kyc/status/:walletAddress
 * Get KYC status for a wallet
 */
export async function getKycStatus(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { walletAddress } = req.params;

        const status = await kycService.getKycStatus(walletAddress);

        if (!status) {
            res.status(404).json({
                success: false,
                error: "No KYC record found for this wallet",
            });
            return;
        }

        res.json({
            success: true,
            ...status,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /kyc/verified/:walletAddress
 * Check if wallet is verified (boolean response)
 */
export async function isVerified(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { walletAddress } = req.params;

        const verified = await kycService.isWalletVerified(walletAddress);

        res.json({
            success: true,
            walletAddress: walletAddress.toLowerCase(),
            verified,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * PATCH /kyc/status/:walletAddress
 * Update KYC status (admin/internal use)
 */
export async function updateKycStatus(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { walletAddress } = req.params;
        const { status, txHash } = req.body;

        const kyc = await kycService.updateKycStatus(walletAddress, status, txHash);

        if (!kyc) {
            res.status(404).json({
                success: false,
                error: "No KYC record found for this wallet",
            });
            return;
        }

        res.json({
            success: true,
            message: `KYC status updated to ${status}`,
            kyc: {
                id: kyc.id,
                status: kyc.status,
                txHash: kyc.txHash,
                verifiedAt: kyc.verifiedAt,
            },
        });
    } catch (error) {
        next(error);
    }
}
