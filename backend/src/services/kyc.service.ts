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
}

interface KycStatusCheck {
    walletAddress: string;
    status: KycStatus;
    kycScore: number;
    provider: string | null;
    verifiedAt: Date | null;
}

/**
 * Submit KYC proof metadata.
 * Creates identity if not exists, then creates or updates KYC record.
 */
export async function submitKyc(input: SubmitKycInput): Promise<Kyc> {
    const normalizedAddress = input.walletAddress.toLowerCase();

    // Get or create identity
    let [identity] = await db
        .select()
        .from(identities)
        .where(eq(identities.walletAddress, normalizedAddress))
        .limit(1);

    if (!identity) {
        [identity] = await db
            .insert(identities)
            .values({
                walletAddress: normalizedAddress,
                identityCommitment: input.commitment,
            })
            .returning();
    } else if (!identity.identityCommitment) {
        // Update commitment if not set
        await db
            .update(identities)
            .set({ identityCommitment: input.commitment, updatedAt: new Date() })
            .where(eq(identities.id, identity.id));
    }

    // Check if KYC record exists
    const [existingKyc] = await db
        .select()
        .from(kycs)
        .where(eq(kycs.identityId, identity.id))
        .limit(1);

    if (existingKyc) {
        // If already verified, reject new submission
        if (existingKyc.status === "VERIFIED") {
            throw new Error("KYC already verified for this wallet");
        }

        // Update existing pending KYC
        const [updated] = await db
            .update(kycs)
            .set({
                proofReference: input.proofReference,
                provider: input.provider || existingKyc.provider,
                txHash: input.txHash || existingKyc.txHash,
                kycScore: input.kycScore ?? existingKyc.kycScore,
                status: input.txHash ? "VERIFIED" : "PENDING",
                verifiedAt: input.txHash ? new Date() : null,
                pendingProof: input.txHash ? null : { proofReference: input.proofReference },
                updatedAt: new Date(),
            })
            .where(eq(kycs.id, existingKyc.id))
            .returning();

        return updated;
    }

    // Create new KYC record
    const [newKyc] = await db
        .insert(kycs)
        .values({
            identityId: identity.id,
            proofReference: input.proofReference,
            provider: input.provider,
            txHash: input.txHash,
            kycScore: input.kycScore ?? (input.provider ? 20 : 0),
            status: input.txHash ? "VERIFIED" : "PENDING",
            verifiedAt: input.txHash ? new Date() : null,
            pendingProof: input.txHash ? null : { proofReference: input.proofReference },
        })
        .returning();

    return newKyc;
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
