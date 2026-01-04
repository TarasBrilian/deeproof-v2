import { Router } from "express";
import * as kycController from "../controllers/kyc.controller.js";
import { validate, submitKycSchema, updateKycStatusSchema } from "../middleware/validation.js";

export const kycRouter = Router();

// POST /kyc/submit - Submit KYC proof metadata
kycRouter.post("/submit", validate(submitKycSchema), kycController.submitKyc);

// GET /kyc/status/:walletAddress - Get KYC status
kycRouter.get("/status/:walletAddress", kycController.getKycStatus);

// GET /kyc/verified/:walletAddress - Check if verified (boolean)
kycRouter.get("/verified/:walletAddress", kycController.isVerified);

// PATCH /kyc/status/:walletAddress - Update status (internal)
kycRouter.patch("/status/:walletAddress", validate(updateKycStatusSchema), kycController.updateKycStatus);
