/**
 * Backend API service for Deeproof
 * Handles communication with the off-chain coordination layer
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL!;

interface ApiResponse<T> {
    success: boolean;
    error?: string;
    message?: string;
    data?: T;
}

interface KycStatusResponse {
    walletAddress: string;
    status: "PENDING" | "VERIFIED" | "REJECTED";
    kycScore: number;
    provider: string | null;
    verifiedAt: string | null;
}

interface ProtocolCheckResponse {
    walletAddress: string;
    isVerified: boolean;
    kycScore: number;
    verifiedAt: string | null;
}

interface SubmitKycPayload {
    walletAddress: string;
    proofReference: string;
    commitment: string;
    provider: string;
    txHash?: string;
    kycScore?: number;
}

interface BindIdentityPayload {
    walletAddress: string;
    identityCommitment?: string;
}

/**
 * Bind wallet address to a new identity
 */
export async function bindIdentity(payload: BindIdentityPayload): Promise<ApiResponse<unknown>> {
    try {
        const response = await fetch(`${BACKEND_URL}/identity/bind`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("[API] bindIdentity error:", error);
        return { success: false, error: "Failed to connect to backend" };
    }
}

/**
 * Submit KYC proof metadata to backend
 */
export async function submitKyc(payload: SubmitKycPayload): Promise<ApiResponse<unknown>> {
    try {
        const response = await fetch(`${BACKEND_URL}/kyc/submit`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("[API] submitKyc error:", error);
        return { success: false, error: "Failed to connect to backend" };
    }
}

/**
 * Get KYC status for a wallet address
 */
export async function getKycStatus(walletAddress: string): Promise<KycStatusResponse | null> {
    try {
        const response = await fetch(`${BACKEND_URL}/kyc/status/${walletAddress}`);

        if (!response.ok) {
            if (response.status === 404) return null;
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        return data.success ? data : null;
    } catch (error) {
        console.error("[API] getKycStatus error:", error);
        return null;
    }
}

/**
 * Check if wallet is verified (boolean)
 */
export async function isWalletVerified(walletAddress: string): Promise<boolean> {
    try {
        const response = await fetch(`${BACKEND_URL}/kyc/verified/${walletAddress}`);

        if (!response.ok) return false;

        const data = await response.json();
        return data.verified === true;
    } catch (error) {
        console.error("[API] isWalletVerified error:", error);
        return false;
    }
}

/**
 * Protocol check - external protocol query
 */
export async function protocolCheck(walletAddress: string): Promise<ProtocolCheckResponse | null> {
    try {
        const response = await fetch(`${BACKEND_URL}/protocol/check/${walletAddress}`);

        if (!response.ok) return null;

        return await response.json();
    } catch (error) {
        console.error("[API] protocolCheck error:", error);
        return null;
    }
}
