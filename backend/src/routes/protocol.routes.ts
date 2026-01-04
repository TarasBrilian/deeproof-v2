import { Router } from "express";
import * as protocolController from "../controllers/protocol.controller.js";

export const protocolRouter = Router();

// GET /protocol/check/:walletAddress - External protocol query
// Read-only, no PII, designed for RWA/DeFi platform integration
protocolRouter.get("/check/:walletAddress", protocolController.checkWallet);
