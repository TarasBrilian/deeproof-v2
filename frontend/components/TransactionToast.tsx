"use client";

import { useEffect, useState } from "react";
import { CheckCircleIcon, XMarkIcon, ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";

interface ToastProps {
    show: boolean;
    txHash: string | null;
    onClose: () => void;
    explorerUrl?: string;
}

export function TransactionToast({ show, txHash, onClose, explorerUrl = "https://sepolia.mantlescan.xyz" }: ToastProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (show) {
            setIsVisible(true);
            // Auto dismiss after 10 seconds
            const timer = setTimeout(() => {
                setIsVisible(false);
                setTimeout(onClose, 300); // Wait for animation
            }, 10000);
            return () => clearTimeout(timer);
        } else {
            setIsVisible(false);
        }
    }, [show, onClose]);

    if (!show && !isVisible) return null;

    const txUrl = txHash ? `${explorerUrl}/tx/${txHash}` : "#";

    return (
        <div
            className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                }`}
        >
            <div className="bg-surface border border-green-500/50 rounded-xl p-4 shadow-2xl shadow-green-500/20 max-w-sm">
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                        <CheckCircleIcon className="w-6 h-6 text-green-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-foreground font-medium text-sm">
                            Verification Successful!
                        </p>
                        {txHash ? (
                            <>
                                <p className="text-text-secondary text-xs mt-1">
                                    Your proof has been verified on-chain at tx
                                </p>
                                <a
                                    href={txUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-primary/10 border border-primary/30 rounded-lg text-primary hover:bg-primary/20 hover:border-primary/50 transition-all duration-200 font-mono text-xs group"
                                >
                                    <span>{txHash.slice(0, 10)}...{txHash.slice(-8)}</span>
                                    <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 transition-opacity" />
                                </a>
                            </>
                        ) : (
                            <p className="text-text-secondary text-xs mt-1">
                                Your proof has been verified on-chain.
                            </p>
                        )}
                    </div>
                    <button
                        onClick={() => {
                            setIsVisible(false);
                            setTimeout(onClose, 300);
                        }}
                        className="flex-shrink-0 text-text-secondary hover:text-foreground transition-colors"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
