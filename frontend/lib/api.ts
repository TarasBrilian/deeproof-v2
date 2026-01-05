/**
 * Backend API service for Deeproof
 * Handles communication with the off-chain coordination layer
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
console.log("[API] Configured Backend URL:", BACKEND_URL);

interface ApiResponse<T> {
    success: boolean;
    error?: string;
    message?: string;
    data?: T;
    token?: string; // JWT token from connect endpoint
}

interface SolidityParams {
    a: string[];
    b: string[][];
    c: string[];
    input: string[];
}

interface PendingProof {
    proofReference: string;
    solidityParams: SolidityParams;
    provider: string;
    commitment: string;
    timestamp?: number;
}

interface KycStatusResponse {
    walletAddress: string;
    status: "PENDING" | "VERIFIED" | "REJECTED";
    kycScore: number;
    provider: string | null;
    verifiedAt: string | null;
    pendingProof: PendingProof | null;
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
    solidityParams?: SolidityParams;
    proofTimestamp?: number; // Unix timestamp when proof was generated
}

interface BindIdentityPayload {
    walletAddress: string;
    identityCommitment?: string;
}

interface ConnectIdentityPayload {
    walletAddress: string;
    signature: string;
    message: string;
}

/**
 * Get Authorization header with JWT token
 */
function getAuthHeaders(token?: string | null): HeadersInit {
    const headers: HeadersInit = { "Content-Type": "application/json" };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
}

/**
 * Connect wallet with signature
 * Returns JWT token on success
 */
export async function connectIdentity(payload: ConnectIdentityPayload): Promise<ApiResponse<unknown>> {
    try {
        const response = await fetch(`${BACKEND_URL}/identity/connect`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("[API] connectIdentity error:", error);
        return { success: false, error: "Failed to connect to backend" };
    }
}

/**
 * Bind wallet address to a new identity
 */
export async function bindIdentity(payload: BindIdentityPayload, token?: string | null): Promise<ApiResponse<unknown>> {
    try {
        const response = await fetch(`${BACKEND_URL}/identity/bind`, {
            method: "POST",
            headers: getAuthHeaders(token),
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
 * Requires authentication token
 */
export async function submitKyc(payload: SubmitKycPayload, token?: string | null): Promise<ApiResponse<unknown>> {
    try {
        const response = await fetch(`${BACKEND_URL}/kyc/submit`, {
            method: "POST",
            headers: getAuthHeaders(token),
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        // Handle 401 Unauthorized (expired/invalid token)
        if (response.status === 401) {
            console.error("[API] Authentication failed - token invalid or expired");
            return { success: false, error: "Authentication required. Please reconnect your wallet." };
        }

        return data;
    } catch (error) {
        console.error("[API] submitKyc error:", error);
        return { success: false, error: "Failed to connect to backend" };
    }
}

/**
 * Get KYC status for a wallet address
 * Requires authentication token
 */
export async function getKycStatus(walletAddress: string, token?: string | null): Promise<KycStatusResponse | null> {
    try {
        const response = await fetch(`${BACKEND_URL}/kyc/status/${walletAddress}`, {
            headers: getAuthHeaders(token),
        });

        if (!response.ok) {
            if (response.status === 404) return null;
            if (response.status === 401) {
                console.error("[API] Authentication required for getKycStatus");
                return null;
            }
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

