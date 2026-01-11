# Deeproof

Privacy-preserving KYC verification layer for Web3 using Zero-Knowledge Proofs.
### EXTENSION LINK: https://drive.google.com/drive/folders/1N8cksQdHeZn5CMBT2eRZ8zT9GaDR98jr?usp=sharing

## Overview

Deeproof enables users to prove their KYC status from trusted identity providers (like Binance) without revealing personal data. It implements an "Inherited Trust" model where a user's existing KYC verification at a regulated exchange is cryptographically proven via zk-SNARKs and recorded on-chain.

**Key Principle**: Verify once (at Binance/Coinbase), use anywhere. No re-KYC, no data storage by RWA platforms.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER FLOW                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  1. User logs into Binance                                                  │
│  2. Chrome Extension intercepts API response (userId, kycLevel)             │
│  3. Extension generates ZK Proof locally (snarkjs + Circom circuit)         │
│  4. Frontend submits proof to Groth16Verifier contract on Mantle Sepolia    │
│  5. Proof verification result recorded on-chain                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌────────────────┐     ┌──────────────────┐     ┌──────────────────────────┐
│   Extension    │────▶│    Frontend      │────▶│   Smart Contract         │
│  (Proof Gen)   │     │  (Dashboard)     │     │   (Groth16Verifier)      │
└────────────────┘     └──────────────────┘     └──────────────────────────┘
        │                      │                          │
        ▼                      ▼                          ▼
┌────────────────┐     ┌──────────────────┐     ┌──────────────────────────┐
│  Binance API   │     │  Wagmi + Reown   │     │   Mantle Sepolia         │
│  Interception  │     │  Wallet Connect  │     │   (Chain ID: 5003)       │
└────────────────┘     └──────────────────┘     └──────────────────────────┘
```

## Project Structure

```
deeproof-v2/
├── backend/                 # Express.js server (placeholder)
│   ├── index.js             # Empty - not yet implemented
│   └── package.json
│
├── circuits/                # Circom ZK circuits
│   ├── identity.circom      # Main identity circuit (Poseidon hash)
│   ├── identity.r1cs        # Compiled circuit
│   ├── identity_final.zkey  # Proving key
│   ├── verification_key.json
│   ├── pot12_final.ptau     # Powers of Tau ceremony file
│   └── identity_js/         # WASM prover artifacts
│
├── contract/                # Solidity smart contracts (Foundry)
│   ├── src/verifier.sol     # Groth16Verifier (snarkjs-generated)
│   ├── script/              # Deployment scripts
│   ├── foundry.toml         # Foundry configuration
│   └── lib/                 # Dependencies (forge-std)
│
├── deeproof-indexer/        # Ponder indexer for on-chain events
│   ├── ponder.config.ts     # Indexes Verifier at 0x21a3...E905e3
│   ├── ponder.schema.ts     # GraphQL schema
│   ├── abis/                # Contract ABIs
│   └── src/                 # Event handlers
│
├── extension/               # Chrome Extension (Manifest V3)
│   ├── manifest.json        # Extension config
│   ├── background.js        # Service worker
│   ├── popup.js             # ZK proof generation logic
│   ├── popup.html           # Extension popup UI
│   ├── content.js           # Bridge between popup and page
│   ├── injected.js          # XHR/fetch interceptor (MAIN world)
│   ├── dashboard-bridge.js  # Frontend-extension communication
│   ├── identity.wasm        # WASM prover
│   ├── identity_final.zkey  # Proving key
│   └── webpack.config.js    # Build configuration
│
├── frontend/                # Next.js 16 application
│   ├── app/
│   │   ├── page.tsx         # Landing page
│   │   └── apps/dashboard/  # Dashboard with platform verification
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── VerificationModal.tsx
│   │   ├── TransactionToast.tsx
│   │   └── Web3Provider.tsx
│   ├── hooks/
│   │   ├── useDeepproofExtension.ts  # Extension communication
│   │   └── useProofVerification.ts   # On-chain proof submission
│   ├── lib/
│   │   └── wagmiConfig.ts   # Wagmi + Reown AppKit setup
│   └── package.json
│
├── project.md               # Original project specification
└── design-guideline.md      # UI/UX design guidelines
```

## Main Features

### 1. ZK Identity Circuit

The circuit (`identity.circom`) uses Poseidon hash to create an identity commitment:

```circom
signal input userId;
signal input trapdoor;
signal input minKycLevel;
signal input userKycLevel;

signal output identityCommitment;

userKycLevel === minKycLevel;  // Constraint: KYC level must match
identityCommitment <== Poseidon(userId, trapdoor);
```

**Public input**: `minKycLevel`
**Private inputs**: `userId`, `trapdoor`, `userKycLevel`

### 2. Binance Data Interception

The extension passively captures user data by hooking `XMLHttpRequest` and `fetch`:

- **Target API**: `bapi/accounts/v1/private/account/get-user-base-info`
- **Captured data**: `userId`, `email`, `level` (KYC level)
- **Requirement**: KYC level must be >= 2

### 3. Proof Generation

The extension uses `snarkjs.groth16.fullProve()` to generate proofs locally:

```javascript
const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    { userId, trapdoor, minKycLevel: "2", userKycLevel },
    "identity.wasm",
    "identity_final.zkey"
);
```

### 4. On-Chain Verification

The `Groth16Verifier` contract verifies proofs:

```solidity
function verifyProof(
    uint[2] calldata _pA,
    uint[2][2] calldata _pB,
    uint[2] calldata _pC,
    uint[2] calldata _pubSignals
) public view returns (bool)
```

**Deployed at**: `0x21a3Cfdeb67f06C9353E43306c5E34f2C2E905e3` on Mantle Sepolia

### 5. Frontend Dashboard

- Displays supported platforms (Binance enabled, others coming soon)
- Tracks proof status: pending (off-chain) vs verified (on-chain)
- Calculates identity score based on verified platforms

## Technology Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS 4 |
| Wallet | Wagmi 3, Reown AppKit, viem |
| ZK Circuits | Circom 2.0, snarkjs 0.7.5 |
| Cryptography | Poseidon Hash (circomlib) |
| Smart Contract | Solidity 0.7-0.9 (Foundry) |
| Blockchain | Mantle Sepolia (Chain ID: 5003) |
| Extension | Chrome Manifest V3, Webpack |
| Indexer | Ponder |

## Installation

### Prerequisites

- Node.js >= 18
- Chrome browser (for extension)
- Foundry (for contract deployment)
- circom (for circuit compilation)

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:3000`

### Extension

```bash
cd extension
npm install
npm run build
```

Load the extension in Chrome:
1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `extension/` directory

### Circuits

Circuits are pre-compiled. To recompile:

```bash
cd circuits
npm install
circom identity.circom --r1cs --wasm --sym
snarkjs groth16 setup identity.r1cs pot12_final.ptau identity_0000.zkey
snarkjs zkey contribute identity_0000.zkey identity_final.zkey
snarkjs zkey export verificationkey identity_final.zkey verification_key.json
snarkjs zkey export solidityverifier identity_final.zkey verifier.sol
```

### Smart Contract

```bash
cd contract
forge build
forge script script/Deploy.s.sol --rpc-url <RPC_URL> --broadcast
```

### Indexer

```bash
cd deeproof-indexer
npm install
# Configure .env.local with PONDER_RPC_URL_2
npm run dev
```

## Environment Variables

### Frontend

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_BACKEND_URL` | Backend API URL | `http://localhost:3001` |

### Indexer

| Variable | Description |
|----------|-------------|
| `PONDER_RPC_URL_2` | RPC URL for Mantle (chain ID 5000) |

### Extension

| Variable | Description |
|----------|-------------|
| (none currently) | Extension uses bundled config |

## Usage Flow

1. **Connect Wallet**: Click "Connect Wallet" on the dashboard to connect via Reown AppKit
2. **Navigate to Binance**: Click on the Binance card to open binance.com
3. **Login to Binance**: Ensure you're logged in with KYC level >= 2
4. **Generate Proof**: Click the Deeproof extension icon, then "Verify Identity"
5. **Process On-Chain**: Return to dashboard, click "Process" on the pending proof
6. **Confirm Transaction**: Sign the transaction in your wallet

## Supported Platforms

| Platform | Status | Points |
|----------|--------|--------|
| Binance | Enabled | 20 |
| OKX | Coming Soon | 20 |
| Bybit | Coming Soon | 20 |
| Coinbase | Coming Soon | 20 |
| Fractal ID | Coming Soon | 10 |
| Didit | Coming Soon | 10 |

## Limitations & Assumptions

### Known Limitations

1. **Backend not implemented**: The `backend/index.js` is empty. No server-side logic exists.
2. **Single platform**: Only Binance verification is functional.
3. **Testnet only**: Contract deployed on Mantle Sepolia testnet.
4. **No identity recovery**: If `trapdoor` is lost, identity cannot be recovered.
5. **Indexer incomplete**: `src/index.ts` has no event handlers implemented.

### Security Assumptions

1. User's browser is trusted (proof generation happens client-side)
2. Binance session is secure and not compromised
3. Extension intercepts data only when user is actively logged in
4. Private keys (nullifier, trapdoor) are stored in browser local storage

### Circuit Constraints

- `minKycLevel` is hardcoded to `2`
- The circuit only proves KYC level equality, not greater-than

## Development Commands

### Frontend

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run lint     # Run ESLint
```

### Extension

```bash
npm run build    # Build with Webpack
npm run watch    # Watch mode for development
```

### Contract

```bash
forge build      # Compile contracts
forge test       # Run tests
forge fmt        # Format code
```

### Indexer

```bash
npm run dev      # Start Ponder development server
npm run build    # Build for production
```

## Block Explorer

- **Mantle Sepolia Explorer**: https://sepolia.mantlescan.xyz
- **Verifier Contract**: https://sepolia.mantlescan.xyz/address/0x21a3Cfdeb67f06C9353E43306c5E34f2C2E905e3

## License

- Smart Contract (Verifier): GPL-3.0 (snarkjs generated)
- Other components: ISC
