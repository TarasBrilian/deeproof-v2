import { pgTable, uuid, varchar, text, integer, timestamp, pgEnum, jsonb, index } from "drizzle-orm/pg-core";

// KYC Status enum
export const kycStatusEnum = pgEnum("kyc_status", ["PENDING", "VERIFIED", "REJECTED"]);

// Identity table - wallet-bound identity in Deeproof
export const identities = pgTable("identities", {
    id: uuid("id").primaryKey().defaultRandom(),
    walletAddress: varchar("wallet_address", { length: 42 }).notNull().unique(),
    identityCommitment: text("identity_commitment").unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// KYC table - verification record, stores metadata only (never PII)
export const kycs = pgTable(
    "kycs",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        identityId: uuid("identity_id")
            .notNull()
            .unique()
            .references(() => identities.id, { onDelete: "cascade" }),
        status: kycStatusEnum("status").default("PENDING").notNull(),
        kycScore: integer("kyc_score").default(0).notNull(),
        provider: text("provider"),
        proofReference: text("proof_reference"), // Hash or IPFS CID, NOT raw data
        pendingProof: jsonb("pending_proof"), // Stores unresolved proof metadata
        txHash: text("tx_hash"), // On-chain verification transaction
        verifiedAt: timestamp("verified_at"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (table) => [index("kyc_status_idx").on(table.status)]
);

// TypeScript types inferred from schema
export type Identity = typeof identities.$inferSelect;
export type NewIdentity = typeof identities.$inferInsert;
export type Kyc = typeof kycs.$inferSelect;
export type NewKyc = typeof kycs.$inferInsert;
export type KycStatus = "PENDING" | "VERIFIED" | "REJECTED";
