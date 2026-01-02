"use client";

import { cookieStorage, createStorage, http } from "wagmi";
import { defineChain } from "viem";
import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";

// Mantle Sepolia chain definition
export const mantleSepolia = defineChain({
    id: 5003,
    name: "Mantle Sepolia",
    nativeCurrency: {
        name: "Mantle",
        symbol: "MNT",
        decimals: 18,
    },
    rpcUrls: {
        default: { http: ["https://rpc.sepolia.mantle.xyz"] },
    },
    blockExplorers: {
        default: {
            name: "Mantle Sepolia Explorer",
            url: "https://sepolia.mantlescan.xyz",
        },
    },
    testnet: true,
});

// Reown project ID
const projectId = "4f6b26c1c1f5a9397bcc8eea93096f21";

// Wagmi adapter configuration
export const wagmiAdapter = new WagmiAdapter({
    storage: createStorage({
        storage: cookieStorage,
    }),
    ssr: true,
    projectId,
    networks: [mantleSepolia],
    transports: {
        [mantleSepolia.id]: http("https://rpc.sepolia.mantle.xyz"),
    },
});

// Initialize AppKit
createAppKit({
    adapters: [wagmiAdapter],
    projectId,
    networks: [mantleSepolia],
    defaultNetwork: mantleSepolia,
    metadata: {
        name: "Deeproof",
        description: "Privacy-preserving KYC Verification",
        url: "https://deeproof.io",
        icons: ["/logo.svg"],
    },
    features: {
        analytics: false,
    },
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;
