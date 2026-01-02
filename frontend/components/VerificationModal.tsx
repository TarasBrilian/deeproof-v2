"use client";

import { useEffect, useState, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { XMarkIcon, ArrowPathIcon, CheckCircleIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";

type VerificationStatus = "IDLE" | "LOADING" | "PENDING" | "VERIFIED" | "ERROR";

interface Platform {
    id: string;
    name: string;
    logoUrl: string;
}

interface VerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    platform: Platform | null;
    backendUrl: string;
}

interface SessionData {
    status: VerificationStatus;
    kycData?: {
        kycStatus: string;
        firstName: string;
        lastName: string;
        verified: boolean;
    };
}

export default function VerificationModal({ isOpen, onClose, platform, backendUrl }: VerificationModalProps) {
    const [status, setStatus] = useState<VerificationStatus>("IDLE");
    const [requestUrl, setRequestUrl] = useState<string | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Generate unique userId for this session
    const generateUserId = () => {
        return `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    };

    // Initialize Reclaim verification
    const initVerification = useCallback(async () => {
        if (!platform) return;

        setStatus("LOADING");
        setError(null);

        try {
            const userId = generateUserId();
            const response = await fetch(`${backendUrl}/api/reclaim/init?userId=${userId}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || "Failed to initialize verification");
            }

            setRequestUrl(data.data.requestUrl);
            setSessionId(data.data.sessionId);
            setStatus("PENDING");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to initialize verification");
            setStatus("ERROR");
        }
    }, [platform, backendUrl]);

    // Poll session status
    useEffect(() => {
        if (status !== "PENDING" || !sessionId) return;

        const pollInterval = setInterval(async () => {
            try {
                const response = await fetch(`${backendUrl}/api/reclaim/status/${sessionId}`);
                const data = await response.json();

                if (data.success && data.session) {
                    const session: SessionData = data.session;

                    if (session.status === "VERIFIED") {
                        setStatus("VERIFIED");
                        clearInterval(pollInterval);

                        // Auto close after 3 seconds on success
                        setTimeout(() => {
                            onClose();
                        }, 3000);
                    }
                }
            } catch (err) {
                console.error("Polling error:", err);
            }
        }, 3000); // Poll every 3 seconds

        return () => clearInterval(pollInterval);
    }, [status, sessionId, backendUrl, onClose]);

    // Initialize when modal opens
    useEffect(() => {
        if (isOpen && platform) {
            initVerification();
        } else {
            // Reset state when modal closes
            setStatus("IDLE");
            setRequestUrl(null);
            setSessionId(null);
            setError(null);
        }
    }, [isOpen, platform, initVerification]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-md mx-4 bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div className="flex items-center gap-3">
                        {platform && (
                            <img
                                src={platform.logoUrl}
                                alt={platform.name}
                                className="w-8 h-8 object-contain"
                            />
                        )}
                        <h2 className="text-lg font-semibold text-foreground">
                            Verify {platform?.name}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    >
                        <XMarkIcon className="w-5 h-5 text-text-secondary" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col items-center">
                    {/* Loading State */}
                    {status === "LOADING" && (
                        <div className="flex flex-col items-center gap-4 py-8">
                            <ArrowPathIcon className="w-12 h-12 text-primary animate-spin" />
                            <p className="text-text-secondary">Initializing verification...</p>
                        </div>
                    )}

                    {/* QR Code State */}
                    {status === "PENDING" && requestUrl && (
                        <div className="flex flex-col items-center gap-6">
                            <div className="p-4 bg-white rounded-xl">
                                <QRCodeSVG
                                    value={requestUrl}
                                    size={220}
                                    level="M"
                                />
                            </div>
                            <div className="text-center space-y-2">
                                <p className="text-foreground font-medium">
                                    Scan with your phone
                                </p>
                                <p className="text-text-secondary text-sm">
                                    Open {platform?.name} app and complete verification
                                </p>
                            </div>
                            <div className="flex items-center gap-2 text-primary text-sm">
                                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                <span>Waiting for verification...</span>
                            </div>
                        </div>
                    )}

                    {/* Success State */}
                    {status === "VERIFIED" && (
                        <div className="flex flex-col items-center gap-4 py-8">
                            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                                <CheckCircleIcon className="w-10 h-10 text-green-500" />
                            </div>
                            <div className="text-center">
                                <p className="text-foreground font-semibold text-lg">Verified!</p>
                                <p className="text-text-secondary text-sm mt-1">
                                    Your {platform?.name} KYC has been verified
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Error State */}
                    {status === "ERROR" && (
                        <div className="flex flex-col items-center gap-4 py-8">
                            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                                <ExclamationCircleIcon className="w-10 h-10 text-red-500" />
                            </div>
                            <div className="text-center">
                                <p className="text-foreground font-semibold">Verification Failed</p>
                                <p className="text-text-secondary text-sm mt-1">{error}</p>
                            </div>
                            <button
                                onClick={initVerification}
                                className="px-4 py-2 bg-primary text-background font-medium rounded-lg hover:bg-primary/90 transition-colors"
                            >
                                Try Again
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
