# Deeproof Backend

Off-chain coordination and indexing layer for Deeproof ZK-KYC infrastructure.

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your DATABASE_URL

# Push schema to database
npm run db:push

# Start development server
npm run dev
```

## API Endpoints

### Identity

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/identity/bind` | Bind wallet to new identity |
| GET | `/identity/:walletAddress` | Get identity by wallet |

### KYC

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/kyc/submit` | Submit KYC proof metadata |
| GET | `/kyc/status/:walletAddress` | Get KYC status |
| GET | `/kyc/verified/:walletAddress` | Check if verified (boolean) |
| PATCH | `/kyc/status/:walletAddress` | Update status (internal) |

### Protocol (External)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/protocol/check/:walletAddress` | External protocol query (no PII) |

## API Examples

### Bind Identity
```bash
curl -X POST http://localhost:3001/identity/bind \
  -H "Content-Type: application/json" \
  -d '{"walletAddress": "0x1234567890123456789012345678901234567890"}'
```

### Submit KYC
```bash
curl -X POST http://localhost:3001/kyc/submit \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x1234567890123456789012345678901234567890",
    "proofReference": "Qm...",
    "commitment": "12345678901234567890",
    "provider": "Binance",
    "txHash": "0xabc..."
  }'
```

### Check Verification (External Protocol)
```bash
curl http://localhost:3001/protocol/check/0x1234567890123456789012345678901234567890
```

Response:
```json
{
  "walletAddress": "0x1234567890123456789012345678901234567890",
  "isVerified": true,
  "kycScore": 20,
  "verifiedAt": "2026-01-04T10:00:00.000Z"
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `PORT` | Server port | `3001` |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:3000` |
| `NODE_ENV` | Environment | `development` |

## Database

Uses Drizzle ORM with PostgreSQL (Supabase compatible).

```bash
# Push schema to database
npm run db:push

# Generate migrations
npm run db:generate

# Open Drizzle Studio
npm run db:studio
```

## Architecture

```
src/
├── index.ts           # Express app entry
├── db/
│   ├── schema.ts      # Drizzle schema (tables, enums, types)
│   └── index.ts       # Drizzle client
├── routes/            # Route definitions
├── controllers/       # Request handlers
├── services/          # Business logic (Drizzle queries)
└── middleware/        # Error handling, validation
```

## Integration

External protocols can query `/protocol/check/:walletAddress` to verify user KYC status without accessing any personal data.
