import { Router } from "express";
import * as kycController from "../controllers/kyc.controller.js";
import { validate, submitKycSchema, updateKycStatusSchema } from "../middleware/validation.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

export const kycRouter = Router();

// POST /kyc/submit - Submit KYC proof metadata (requires authentication)
kycRouter.post("/submit", authenticateToken, validate(submitKycSchema), kycController.submitKyc);

// GET /kyc/status/:walletAddress - Get KYC status (requires authentication)
kycRouter.get("/status/:walletAddress", authenticateToken, kycController.getKycStatus);

// GET /kyc/verified/:walletAddress - Check if verified (boolean)
kycRouter.get("/verified/:walletAddress", kycController.isVerified);

// PATCH /kyc/status/:walletAddress - Update status (internal)
kycRouter.patch("/status/:walletAddress", validate(updateKycStatusSchema), kycController.updateKycStatus);

