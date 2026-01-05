CREATE TYPE "public"."kyc_status" AS ENUM('PENDING', 'VERIFIED', 'REJECTED');--> statement-breakpoint
CREATE TABLE "identities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet_address" varchar(42) NOT NULL,
	"identity_commitment" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "identities_wallet_address_unique" UNIQUE("wallet_address"),
	CONSTRAINT "identities_identity_commitment_unique" UNIQUE("identity_commitment")
);
--> statement-breakpoint
CREATE TABLE "kycs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identity_id" uuid NOT NULL,
	"status" "kyc_status" DEFAULT 'PENDING' NOT NULL,
	"kyc_score" integer DEFAULT 0 NOT NULL,
	"provider" text,
	"proof_reference" text,
	"pending_proof" jsonb,
	"tx_hash" text,
	"verified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "kycs_identity_id_unique" UNIQUE("identity_id")
);
--> statement-breakpoint
ALTER TABLE "kycs" ADD CONSTRAINT "kycs_identity_id_identities_id_fk" FOREIGN KEY ("identity_id") REFERENCES "public"."identities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "kyc_status_idx" ON "kycs" USING btree ("status");