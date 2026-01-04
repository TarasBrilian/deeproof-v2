import { db } from "../db/index.js";
import { identities, type Identity, type NewIdentity } from "../db/schema.js";
import { eq } from "drizzle-orm";

interface BindIdentityInput {
    walletAddress: string;
    identityCommitment?: string;
}

/**
 * Bind a wallet address to a new identity.
 * Enforces: one wallet = one identity
 */
export async function bindIdentity(input: BindIdentityInput): Promise<Identity> {
    const normalizedAddress = input.walletAddress.toLowerCase();

    const [identity] = await db
        .insert(identities)
        .values({
            walletAddress: normalizedAddress,
            identityCommitment: input.identityCommitment || null,
        })
        .returning();

    return identity;
}

/**
 * Get identity by wallet address
 */
export async function getIdentityByWallet(walletAddress: string): Promise<Identity | null> {
    const normalizedAddress = walletAddress.toLowerCase();

    const [identity] = await db
        .select()
        .from(identities)
        .where(eq(identities.walletAddress, normalizedAddress))
        .limit(1);

    return identity || null;
}

/**
 * Update identity commitment (can only be set once)
 */
export async function updateIdentityCommitment(
    walletAddress: string,
    commitment: string
): Promise<Identity> {
    const normalizedAddress = walletAddress.toLowerCase();

    // Check if commitment already exists
    const existing = await getIdentityByWallet(normalizedAddress);

    if (!existing) {
        throw new Error("Identity not found");
    }

    if (existing.identityCommitment) {
        throw new Error("Identity commitment already set");
    }

    const [updated] = await db
        .update(identities)
        .set({ identityCommitment: commitment, updatedAt: new Date() })
        .where(eq(identities.walletAddress, normalizedAddress))
        .returning();

    return updated;
}

/**
 * Check if wallet has an identity
 */
export async function hasIdentity(walletAddress: string): Promise<boolean> {
    const identity = await getIdentityByWallet(walletAddress);
    return identity !== null;
}
