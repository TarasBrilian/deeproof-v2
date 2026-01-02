"use client";

import { useWriteContract, useSwitchChain, useWaitForTransactionReceipt } from "wagmi";
import { useCallback, useState, useEffect } from "react";
import { mantleSepolia } from "@/lib/wagmiConfig";

// Contract address on Mantle Sepolia
const VERIFIER_CONTRACT = "0x21a3Cfdeb67f06C9353E43306c5E34f2C2E905e3" as const;

// Contract ABI for verifyProof - called as transaction
const VERIFIER_ABI = [
    {
        inputs: [
            { name: "_pA", type: "uint256[2]" },
            { name: "_pB", type: "uint256[2][2]" },
            { name: "_pC", type: "uint256[2]" },
            { name: "_pubSignals", type: "uint256[2]" },
        ],
        name: "verifyProof",
        outputs: [{ name: "", type: "bool" }],
        stateMutability: "view",
        type: "function",
    },
] as const;

interface SolidityParams {
    a: string[];
    b: string[][];
    c: string[];
    input: string[];
}

interface UseProofVerificationReturn {
    verifyOnChain: (params: SolidityParams) => Promise<boolean>;
    isLoading: boolean;
    isSuccess: boolean;
    error: string | null;
    txHash: string | null;
    reset: () => void;
}

export function useProofVerification(): UseProofVerificationReturn {
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [txHash, setTxHash] = useState<string | null>(null);

    const { switchChainAsync } = useSwitchChain();
    const { writeContractAsync } = useWriteContract();

    const verifyOnChain = useCallback(async (params: SolidityParams): Promise<boolean> => {
        setIsLoading(true);
        setError(null);
        setIsSuccess(false);
        setTxHash(null);

        try {
            // Switch to Mantle Sepolia if needed
            try {
                await switchChainAsync({ chainId: mantleSepolia.id });
            } catch (switchError) {
                console.log("Chain switch not needed or failed:", switchError);
            }

            // Format params for contract call
            const pA: [bigint, bigint] = [
                BigInt(params.a[0]),
                BigInt(params.a[1]),
            ];

            const pB: [[bigint, bigint], [bigint, bigint]] = [
                [BigInt(params.b[0][0]), BigInt(params.b[0][1])],
                [BigInt(params.b[1][0]), BigInt(params.b[1][1])],
            ];

            const pC: [bigint, bigint] = [
                BigInt(params.c[0]),
                BigInt(params.c[1]),
            ];

            const pubSignals: [bigint, bigint] = [
                BigInt(params.input[0]),
                BigInt(params.input[1]),
            ];

            console.log("Sending verifyProof transaction...");
            console.log("pA:", pA);
            console.log("pB:", pB);
            console.log("pC:", pC);
            console.log("pubSignals:", pubSignals);

            // Execute transaction
            const hash = await writeContractAsync({
                address: VERIFIER_CONTRACT,
                abi: VERIFIER_ABI,
                functionName: "verifyProof",
                args: [pA, pB, pC, pubSignals],
                chainId: mantleSepolia.id,
            });

            console.log("Transaction hash:", hash);
            setTxHash(hash);
            setIsSuccess(true);
            setIsLoading(false);
            return true;

        } catch (err) {
            console.error("Transaction error:", err);
            const message = err instanceof Error ? err.message : "Transaction failed";
            setError(message);
            setIsLoading(false);
            return false;
        }
    }, [switchChainAsync, writeContractAsync]);

    const reset = useCallback(() => {
        setIsLoading(false);
        setIsSuccess(false);
        setError(null);
        setTxHash(null);
    }, []);

    return {
        verifyOnChain,
        isLoading,
        isSuccess,
        error,
        txHash,
        reset,
    };
}


