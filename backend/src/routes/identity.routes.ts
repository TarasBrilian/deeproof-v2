import { Router } from "express";
import * as identityController from "../controllers/identity.controller.js";
import { validate, bindIdentitySchema } from "../middleware/validation.js";

export const identityRouter = Router();

// POST /identity/bind - Bind wallet to new identity
identityRouter.post("/bind", validate(bindIdentitySchema), identityController.bindIdentity);

// GET /identity/:walletAddress - Get identity by wallet
identityRouter.get("/:walletAddress", identityController.getIdentity);
