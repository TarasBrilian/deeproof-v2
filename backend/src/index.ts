import "dotenv/config";
import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";

import { kycRouter } from "./routes/kyc.routes.js";
import { identityRouter } from "./routes/identity.routes.js";
import { protocolRouter } from "./routes/protocol.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:3000";
console.log(`[Deeproof Backend] CORS Origin allowed: ${corsOrigin}`);

app.use(
    cors({
        origin: corsOrigin,
        credentials: true,
    })
);
app.use(express.json());

// Health check
app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API routes
app.use("/identity", identityRouter);
app.use("/kyc", kycRouter);
app.use("/protocol", protocolRouter);

// 404 handler
app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: "Not found" });
});

// Global error handler
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`[Deeproof Backend] Running on http://localhost:${PORT}`);
});

export default app;
