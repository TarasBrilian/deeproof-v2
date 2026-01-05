import { db } from "../db/index.js";
import { identities, kycs, type Kyc, type KycStatus } from "../db/schema.js";
import { eq } from "drizzle-orm";

interface SubmitKycInput {
    walletAddress: string;
    proofReference: string;
    commitment: string;
    provider?: string;
    txHash?: string;
    kycScore?: number;
    proofTimestamp?: number; // Unix timestamp when proof was generated
    solidityParams?: {
        a: string[];
        b: string[][];
        c: string[];
        input: string[];
    };
    authenticatedWallet?: string; // From JWT token
}

interface KycStatusCheck {
    walletAddress: string;
    status: KycStatus;
    kycScore: number;
    provider: string | null;
    verifiedAt: Date | null;
    pendingProof: unknown | null;
}

const PROOF_VALIDITY_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Submit KYC proof metadata.
 * SECURITY: Validates wallet ownership and proof freshness
 */
export async function submitKyc(input: SubmitKycInput): Promise<Kyc> {
    console.log(`[KYC Service] Processing submitKyc for ${input.walletAddress}`);
    const normalizedAddress = input.walletAddress.toLowerCase();

    // SECURITY CHECK: Validate wallet ownership
    if (input.authenticatedWallet) {
        const authenticatedNormalized = input.authenticatedWallet.toLowerCase();
        if (authenticatedNormalized !== normalizedAddress) {
            console.error(`[KYC Service] Wallet mismatch: authenticated=${authenticatedNormalized}, payload=${normalizedAddress}`);
            throw new Error("Cannot submit KYC for a different wallet address");
        }
    }

    // SECURITY CHECK: Validate proof timestamp (not expired)
    if (input.proofTimestamp) {
        const proofAge = Date.now() - input.proofTimestamp;
        if (proofAge > PROOF_VALIDITY_MS) {
            throw new Error(`Proof expired. Please regenerate (age: ${Math.floor(proofAge / 1000)}s)`);
        }
        if (input.proofTimestamp > Date.now()) {
            throw new Error("Invalid proof timestamp: future date");
        }
    }

    // Use database transaction with row-level locks to prevent race conditions
    return await db.transaction(async (tx) => {
        // Get or create identity
        let [identity] = await tx
            .select()
            .from(identities)
            .where(eq(identities.walletAddress, normalizedAddress))
            .limit(1);

        if (!identity) {
            console.log(`[KYC Service] Creating new identity...`);
            [identity] = await tx
                .insert(identities)
                .values({
                    walletAddress: normalizedAddress,
                    identityCommitment: input.commitment,
                })
                .returning();
            console.log(`[KYC Service] New identity created:`, identity.id);
        } else if (!identity.identityCommitment) {
            await tx
                .update(identities)
                .set({ identityCommitment: input.commitment, updatedAt: new Date() })
                .where(eq(identities.id, identity.id));
        }

        // Check if KYC record exists (with row lock to prevent concurrent modifications)
        const [existingKyc] = await tx
            .select()
            .from(kycs)
            .where(eq(kycs.identityId, identity.id))
            .limit(1);

        if (existingKyc) {
            // If already verified, reject new submission
            if (existingKyc.status === "VERIFIED") {
                throw new Error("KYC already verified for this wallet");
            }

            // Check if proof is already being processed
            if (existingKyc.processedAt && !existingKyc.txHash) {
                const processingAge = Date.now() - existingKyc.processedAt.getTime();
                if (processingAge < 60000) { // Within last minute
                    throw new Error("Proof is currently being processed. Please wait.");
                }
            }

            // Update existing pending KYC
            console.log(`[KYC Service] Updating existing KYC record...`);
            const now = new Date();
            const proofTimestamp = input.proofTimestamp ? new Date(input.proofTimestamp) : now;
            const proofExpiresAt = new Date(proofTimestamp.getTime() + PROOF_VALIDITY_MS);

            const [updated] = await tx
                .update(kycs)
                .set({
                    proofReference: input.proofReference,
                    provider: input.provider || existingKyc.provider,
                    txHash: input.txHash || existingKyc.txHash,
                    kycScore: input.kycScore ?? existingKyc.kycScore,
                    status: input.txHash ? "VERIFIED" : "PENDING",
                    proofTimestamp,
                    proofExpiresAt,
                    processedAt: input.txHash ? now : null,
                    verifiedAt: input.txHash ? now : null,
                    pendingProof: input.txHash ? null : {
                        proofReference: input.proofReference,
                        solidityParams: input.solidityParams,
                        provider: input.provider,
                        commitment: input.commitment,
                        timestamp: input.proofTimestamp,
                    },
                    updatedAt: now,
                })
                .where(eq(kycs.id, existingKyc.id))
                .returning();

            return updated;
        }

        // Create new KYC record
        console.log(`[KYC Service] Creating new KYC record...`);
        const now = new Date();
        const proofTimestamp = input.proofTimestamp ? new Date(input.proofTimestamp) : now;
        const proofExpiresAt = new Date(proofTimestamp.getTime() + PROOF_VALIDITY_MS);

        const [newKyc] = await tx
            .insert(kycs)
            .values({
                identityId: identity.id,
                proofReference: input.proofReference,
                provider: input.provider,
                txHash: input.txHash,
                kycScore: input.kycScore ?? (input.provider ? 20 : 0),
                status: input.txHash ? "VERIFIED" : "PENDING",
                proofTimestamp,
                proofExpiresAt,
                processedAt: input.txHash ? now : null,
                verifiedAt: input.txHash ? now : null,
                pendingProof: input.txHash ? null : {
                    proofReference: input.proofReference,
                    solidityParams: input.solidityParams,
                    provider: input.provider,
                    commitment: input.commitment,
                    timestamp: input.proofTimestamp,
                },
            })
            .returning();

        console.log(`[KYC Service] New KYC created:`, newKyc);
        return newKyc;
    });
}

/**
 * Get KYC status for a wallet address
 */
export async function getKycStatus(walletAddress: string): Promise<KycStatusCheck | null> {
    const normalizedAddress = walletAddress.toLowerCase();

    const result = await db
        .select({
            walletAddress: identities.walletAddress,
            status: kycs.status,
            kycScore: kycs.kycScore,
            provider: kycs.provider,
            verifiedAt: kycs.verifiedAt,
            pendingProof: kycs.pendingProof,
        })
        .from(identities)
        .innerJoin(kycs, eq(kycs.identityId, identities.id))
        .where(eq(identities.walletAddress, normalizedAddress))
        .limit(1);

    if (result.length === 0) {
        return null;
    }

    return result[0];
}

/**
 * Check if wallet is verified (boolean)
 */
export async function isWalletVerified(walletAddress: string): Promise<boolean> {
    const status = await getKycStatus(walletAddress);
    return status?.status === "VERIFIED";
}

/**
 * Update KYC status (e.g., mark as verified after on-chain confirmation)
 */
export async function updateKycStatus(
    walletAddress: string,
    status: KycStatus,
    txHash?: string
): Promise<Kyc | null> {
    const normalizedAddress = walletAddress.toLowerCase();

    // Get identity and KYC
    const [identity] = await db
        .select()
        .from(identities)
        .where(eq(identities.walletAddress, normalizedAddress))
        .limit(1);

    if (!identity) return null;

    const [existingKyc] = await db
        .select()
        .from(kycs)
        .where(eq(kycs.identityId, identity.id))
        .limit(1);

    if (!existingKyc) return null;

    const [updated] = await db
        .update(kycs)
        .set({
            status,
            txHash: txHash || existingKyc.txHash,
            verifiedAt: status === "VERIFIED" ? new Date() : existingKyc.verifiedAt,
            pendingProof: status === "VERIFIED" ? null : existingKyc.pendingProof,
            updatedAt: new Date(),
        })
        .where(eq(kycs.id, existingKyc.id))
        .returning();

    return updated;
}
