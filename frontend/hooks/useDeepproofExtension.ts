"use client";

import { useState, useEffect, useCallback } from "react";

interface SolidityParams {
    a: string[];
    b: string[][];
    c: string[];
    input: string[];
}

interface ProofData {
    isVerified: boolean;
    provider: string;
    kycLevel: number;
    proof: unknown;
    publicSignals: string[];
    commitment: string;
    solidityParams: SolidityParams;
    timestamp: number;
}

interface ExtensionState {
    installed: boolean;
    checking: boolean;
    proof: ProofData | null;
    loading: boolean;
    error: string | null;
}

interface UseDeepproofExtensionReturn extends ExtensionState {
    requestProof: () => void;
    getStoredProof: () => void;
}

const EXTENSION_ID = "deeproof-verifier";

export function useDeepproofExtension(): UseDeepproofExtensionReturn {
    const [state, setState] = useState<ExtensionState>({
        installed: false,
        checking: true,
        proof: null,
        loading: false,
        error: null,
    });

    // Listen for messages from extension
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.source !== window) return;

            const { type, source, payload } = event.data || {};
            if (source !== EXTENSION_ID) return;

            switch (type) {
                case "DEEPROOF_EXTENSION_READY":
                case "DEEPROOF_EXTENSION_STATUS":
                    setState(prev => ({ ...prev, installed: true, checking: false }));
                    break;

                case "DEEPROOF_PROOF_RESULT":
                    if (payload?.success) {
                        setState(prev => ({
                            ...prev,
                            loading: false,
                            error: null,
                            proof: {
                                isVerified: true,
                                provider: "Binance",
                                kycLevel: 2,
                                proof: payload.proof,
                                publicSignals: payload.publicSignals || [],
                                commitment: payload.commitment,
                                solidityParams: payload.solidityParams,
                                timestamp: payload.timestamp,
                            },
                        }));
                    } else {
                        setState(prev => ({
                            ...prev,
                            loading: false,
                            error: payload?.message || payload?.error || "Failed to get proof",
                        }));
                    }
                    break;

                case "DEEPROOF_STORED_PROOF":
                    if (payload) {
                        setState(prev => ({ ...prev, proof: payload, loading: false }));
                    } else {
                        setState(prev => ({ ...prev, loading: false }));
                    }
                    break;

                case "DEEPROOF_PROOF_ERROR":
                    setState(prev => ({
                        ...prev,
                        loading: false,
                        error: payload?.error || "Unknown error",
                    }));
                    break;

                case "DEEPROOF_PROOF_UPDATE":
                    // Real-time proof update from extension
                    if (payload?.isVerified) {
                        setState(prev => ({
                            ...prev,
                            proof: payload,
                            loading: false,
                            error: null,
                        }));
                    }
                    break;
            }
        };

        window.addEventListener("message", handleMessage);

        // Check if extension is installed on mount
        const timeout = setTimeout(() => {
            setState(prev => {
                if (prev.checking) {
                    return { ...prev, checking: false };
                }
                return prev;
            });
        }, 1500);

        // Send check message
        window.postMessage({ type: "DEEPROOF_CHECK_EXTENSION" }, "*");

        return () => {
            window.removeEventListener("message", handleMessage);
            clearTimeout(timeout);
        };
    }, []);

    const requestProof = useCallback(() => {
        if (!state.installed) {
            setState(prev => ({ ...prev, error: "Extension not installed" }));
            return;
        }

        setState(prev => ({ ...prev, loading: true, error: null }));
        window.postMessage({
            type: "DEEPROOF_REQUEST_PROOF",
            payload: { platform: "binance" }
        }, "*");
    }, [state.installed]);

    const getStoredProof = useCallback(() => {
        if (!state.installed) return;

        setState(prev => ({ ...prev, loading: true }));
        window.postMessage({ type: "DEEPROOF_GET_STORED_PROOF" }, "*");
    }, [state.installed]);

    return {
        ...state,
        requestProof,
        getStoredProof,
    };
}
