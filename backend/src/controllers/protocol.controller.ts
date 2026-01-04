import type { Request, Response, NextFunction } from "express";
import * as kycService from "../services/kyc.service.js";

/**
 * GET /protocol/check/:walletAddress
 * External protocol query - read-only, no PII
 * 
 * Use cases:
 * - RWA platforms checking if user is verified
 * - DeFi apps checking KYC score
 * - Compliance checks without deanonymization
 */
export async function checkWallet(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { walletAddress } = req.params;
        const normalizedAddress = walletAddress.toLowerCase();

        const status = await kycService.getKycStatus(normalizedAddress);

        if (!status) {
            // Wallet not found - return unverified status
            res.json({
                walletAddress: normalizedAddress,
                isVerified: false,
                kycScore: 0,
                verifiedAt: null,
            });
            return;
        }

        // Return verification status without PII
        res.json({
            walletAddress: status.walletAddress,
            isVerified: status.status === "VERIFIED",
            kycScore: status.kycScore,
            verifiedAt: status.verifiedAt,
        });
    } catch (error) {
        next(error);
    }
}
