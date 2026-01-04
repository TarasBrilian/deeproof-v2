import type { Request, Response, NextFunction } from "express";
import { z, type ZodSchema } from "zod";

export function validate(schema: ZodSchema) {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            schema.parse(req.body);
            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({
                    success: false,
                    error: "Validation failed",
                    details: error.errors.map((e) => ({
                        field: e.path.join("."),
                        message: e.message,
                    })),
                });
                return;
            }
            next(error);
        }
    };
}

// Wallet address validation (0x + 40 hex chars)
export const walletAddressSchema = z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address format");

// Identity binding schema
export const bindIdentitySchema = z.object({
    walletAddress: walletAddressSchema,
    identityCommitment: z.string().optional(),
});

// KYC submit schema
export const submitKycSchema = z.object({
    walletAddress: walletAddressSchema,
    proofReference: z.string().min(1, "Proof reference required"),
    commitment: z.string().min(1, "Commitment required"),
    provider: z.string().optional(),
    txHash: z.string().optional(),
    kycScore: z.number().int().min(0).max(100).optional(),
    solidityParams: z.object({
        a: z.array(z.string()),
        b: z.array(z.array(z.string())),
        c: z.array(z.string()),
        input: z.array(z.string()),
    }).optional(),
});

// KYC status update schema
export const updateKycStatusSchema = z.object({
    status: z.enum(["PENDING", "VERIFIED", "REJECTED"]),
    txHash: z.string().optional(),
});
