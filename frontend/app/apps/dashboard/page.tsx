"use client";

import { useState, useEffect } from "react";
import { UserCircleIcon, CheckBadgeIcon, LockClosedIcon, PuzzlePieceIcon, ExclamationTriangleIcon, ArrowPathIcon, BoltIcon } from "@heroicons/react/24/outline";
import VerificationModal from "@/components/VerificationModal";
import { TransactionToast } from "@/components/TransactionToast";
import { useDeepproofExtension } from "@/hooks/useDeepproofExtension";
import { useProofVerification } from "@/hooks/useProofVerification";
import { useAuth } from "@/hooks/useAuth";
import { useAppKit } from "@reown/appkit/react";
import { useAccount, useChainId, useSignMessage } from "wagmi";
import { mantleSepolia } from "@/lib/wagmiConfig";
import { submitKyc, getKycStatus, connectIdentity } from "@/lib/api";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL!;

interface LogoOption {
    id: string;
    name: string;
    logoUrl: string;
    enabled: boolean;
    points: number;
}

const logoOption: LogoOption[] = [
    {
        id: "binance",
        name: "Binance",
        logoUrl: "https://cdn.worldvectorlogo.com/logos/binance.svg",
        enabled: true,
        points: 20
    },
    {
        id: "bybit",
        name: "Bybit",
        logoUrl: "https://cdn.worldvectorlogo.com/logos/bybit-3.svg",
        enabled: false,
        points: 20
    },
    {
        id: "okx",
        name: "OKX",
        logoUrl: "https://cdn.worldvectorlogo.com/logos/okx-1.svg",
        enabled: false,
        points: 20
    },
    {
        id: "fractal-id",
        name: "Fractal ID",
        logoUrl: "https://web.fractal.id/wp-content/uploads/2023/08/cropped-cropped-jR373pJu_400x400.jpg",
        enabled: false,
        points: 10
    },
    {
        id: "didit",
        name: "Didit",
        logoUrl: "https://media.licdn.com/dms/image/v2/D4D0BAQEXqW6qlzHj2A/company-logo_200_200/B4DZriB9rsIAAI-/0/1764728757486/diditprotocol_logo?e=2147483647&v=beta&t=P9pAo71KlK-75jvziXto3ptUCxsbNlcr--nsZexVXrA",
        enabled: false,
        points: 10
    },
    {
        id: "coinbase",
        name: "Coinbase",
        logoUrl: "https://cdn.worldvectorlogo.com/logos/coinbase-1.svg",
        enabled: false,
        points: 20
    },
];

interface Platform {
    id: string;
    name: string;
    active: boolean;
    icon: string | undefined;
    points: number | undefined;
    enabled: boolean;
}

// Track which proofs have been verified on-chain
interface OnChainStatus {
    [platformId: string]: {
        pending: boolean;  // Proof exists but not on-chain
        verified: boolean; // Verified on-chain
    };
}

export default function Dashboard() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPlatform, setSelectedPlatform] = useState<LogoOption | null>(null);
    const [verifiedPlatforms, setVerifiedPlatforms] = useState<string[]>([]);
    const [onChainStatus, setOnChainStatus] = useState<OnChainStatus>({});
    const [onChainVerifiedCount, setOnChainVerifiedCount] = useState(0);
    const [showToast, setShowToast] = useState(false);
    const [toastTxHash, setToastTxHash] = useState<string | null>(null);
    const [backendStatusFetched, setBackendStatusFetched] = useState(false);
    // Store pending proof from backend - this is the source of truth
    const [backendPendingProof, setBackendPendingProof] = useState<{
        proofReference: string;
        solidityParams: { a: string[]; b: string[][]; c: string[]; input: string[] };
        provider: string;
        commitment: string;
    } | null>(null);

    // Wallet connection
    const { open: openWalletModal } = useAppKit();
    const { address, isConnected } = useAccount();
    const chainId = useChainId();

    // Authentication
    const auth = useAuth();

    // Extension integration
    const extension = useDeepproofExtension();

    // On-chain verification
    const proofVerification = useProofVerification();

    // Check for stored proof on mount and when extension becomes available
    useEffect(() => {
        if (extension.installed && !extension.checking) {
            extension.getStoredProof();
        }
    }, [extension.installed, extension.checking]);

    // Signature state
    const { signMessageAsync } = useSignMessage();

    // Initial connection and signature flow
    useEffect(() => {
        const handleConnection = async () => {
            if (address && isConnected && !auth.isAuthenticated && !auth.isLoading) {
                try {
                    const message = `Sign in to Deeproof\nWallet: ${address}\nTimestamp: ${Date.now()}`;

                    const signature = await signMessageAsync({
                        message,
                    });

                    const result = await connectIdentity({
                        walletAddress: address,
                        signature,
                        message,
                    });

                    if (result.success && result.token) {
                        console.log("[Auth] Wallet connected & verified");
                        auth.login(address, result.token);
                    } else {
                        console.error("[Auth] Verification failed result:", result);
                        alert(`Verification failed: ${result.error || "Unknown error"}`);
                    }
                } catch (error) {
                    console.error("[Auth] Signature rejected or failed:", error);
                    alert(`Signature failed: ${error instanceof Error ? error.message : "Unknown error"}`);
                }
            }
        };

        if (address && isConnected && !auth.isAuthenticated && !auth.isLoading) {
            handleConnection();
        }
    }, [address, isConnected, auth.isAuthenticated, auth.isLoading, signMessageAsync]);

    // Fetch existing KYC status from backend when wallet connects (AND authenticated)
    useEffect(() => {
        if (address && isConnected && auth.isAuthenticated && auth.token) {
            setBackendStatusFetched(false);
            getKycStatus(address, auth.token).then(status => {
                if (status?.status === "VERIFIED" && status.provider) {
                    // User is verified
                    const providerId = status.provider.toLowerCase();
                    setOnChainStatus(prev => ({
                        ...prev,
                        [providerId]: { pending: false, verified: true }
                    }));
                    setVerifiedPlatforms(prev => {
                        if (!prev.includes(providerId)) {
                            return [...prev, providerId];
                        }
                        return prev;
                    });
                    setOnChainVerifiedCount(prev => prev === 0 ? 1 : prev);
                    setBackendPendingProof(null);
                    console.log("[Backend] Restored VERIFIED status:", status);
                } else if (status?.status === "PENDING" && status.pendingProof) {
                    // User has pending proof - restore from backend
                    const providerId = (status.pendingProof.provider || status.provider || "binance").toLowerCase();
                    setBackendPendingProof(status.pendingProof as typeof backendPendingProof);
                    setOnChainStatus(prev => ({
                        ...prev,
                        [providerId]: { pending: true, verified: false }
                    }));
                    console.log("[Backend] Restored PENDING proof:", status.pendingProof);
                }
            }).catch(err => {
                console.log("[Backend] No existing KYC status:", err);
            }).finally(() => {
                setBackendStatusFetched(true);
            });
        } else {
            // If not connected, we consider fetched true to unblock any waiting logic? 
            // Or false? Logic flow: only fetch if connected.
            if (!isConnected) setBackendStatusFetched(true);
        }
    }, [address, isConnected, auth.isAuthenticated, auth.token]);

    // When extension provides a NEW proof, update local status to PENDING
    // But DO NOT auto-submit to backend. We wait for user to click "Process".
    useEffect(() => {
        if (!backendStatusFetched || !address || !isConnected) return;

        if (extension.proof?.solidityParams && extension.proof?.provider) {
            const provider = extension.proof.provider.toLowerCase();

            // If already verified, ignore new proof from extension
            if (onChainStatus[provider]?.verified) return;

            // Update local state to show pending status
            setOnChainStatus(prev => ({
                ...prev,
                [provider]: { pending: true, verified: false }
            }));

        }
    }, [extension.proof, backendStatusFetched, address, isConnected]);

    // Handle on-chain verification success
    useEffect(() => {
        // Use backendPendingProof as source of truth for provider
        const currentProof = backendPendingProof || extension.proof;

        if (proofVerification.isSuccess && currentProof?.provider && address) {
            const provider = currentProof.provider.toLowerCase();
            const txHashToStore = proofVerification.txHash;

            setOnChainStatus(prev => ({
                ...prev,
                [provider]: {
                    pending: false,
                    verified: true,
                }
            }));
            setVerifiedPlatforms(prev => {
                if (!prev.includes(provider)) {
                    return [...prev, provider];
                }
                return prev;
            });
            setOnChainVerifiedCount(prev => prev + 1);

            // Submit to backend with txHash to mark as VERIFIED
            if (txHashToStore && currentProof.commitment && auth.token) {
                // Add proof timestamp if available from extension
                const proofTimestamp = (currentProof as any).timestamp || Date.now();

                submitKyc({
                    walletAddress: address,
                    proofReference: currentProof.commitment,
                    commitment: currentProof.commitment,
                    provider: currentProof.provider,
                    txHash: txHashToStore,
                    kycScore: 20,
                    proofTimestamp,
                }, auth.token).then(result => {
                    if (result && result.success) {
                        console.log("[Backend] KYC VERIFIED submitted:", result);
                        // Only clear proof if backend submission succeeded
                        setBackendPendingProof(null);
                        extension.clearProof();
                    } else {
                        console.error("[Backend] KYC submit failed:", result);
                    }
                }).catch(err => {
                    console.error("[Backend] KYC submit error:", err);
                    alert("Verification succeeded on-chain but failed to save to backend.");
                });
            }

            // Delay toast by 3 seconds
            if (txHashToStore) {
                setToastTxHash(txHashToStore);
                setTimeout(() => {
                    setShowToast(true);
                }, 3000);
            }

            proofVerification.reset();
        }
    }, [proofVerification.isSuccess, backendPendingProof, extension.proof?.provider, address]);

    const platforms: Platform[] = logoOption.map((opt) => ({
        id: opt.id,
        name: opt.name,
        active: verifiedPlatforms.includes(opt.id),
        icon: opt.logoUrl,
        points: opt.points,
        enabled: opt.enabled,
    }));

    const handleConnectWallet = () => {
        openWalletModal();
    };

    const handlePlatformClick = (platform: Platform) => {
        const option = logoOption.find((opt) => opt.id === platform.id);

        if (!option?.enabled) {
            return;
        }

        // Must have wallet connected first
        if (!isConnected) {
            openWalletModal();
            return;
        }

        // Handle Binance - redirect to Binance and let extension handle it
        if (platform.id === "binance") {
            if (!extension.installed) {
                alert("Please install the Deeproof Verifier extension first.");
                return;
            }

            // If already has pending proof, don't redirect again
            if (onChainStatus["binance"]?.pending || onChainStatus["binance"]?.verified) {
                return;
            }

            // Redirect to Binance dashboard - extension will auto-detect
            window.open("https://www.binance.com/en/my/dashboard", "_blank");
            return;
        }

        // For other platforms, show modal
        setSelectedPlatform(option);
        setIsModalOpen(true);
    };

    // Use backend pending proof if available, otherwise fall back to extension proof
    const handleProcessProof = async () => {
        const proofToUse = backendPendingProof || extension.proof;

        if (!proofToUse?.solidityParams) {
            alert("No proof available to process");
            return;
        }

        if (!isConnected) {
            openWalletModal();
            return;
        }

        // Check network
        if (chainId !== mantleSepolia.id) {
            // The hook will handle switching
        }

        await proofVerification.verifyOnChain(proofToUse.solidityParams);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
    };

    // Calculate total points from on-chain verified platforms
    const totalPoints = verifiedPlatforms.reduce((acc, id) => {
        const platform = logoOption.find((opt) => opt.id === id);
        return acc + (platform?.points || 0);
    }, 0);

    // Count pending proofs
    const pendingProofsCount = Object.values(onChainStatus).filter(s => s.pending).length;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Wallet Connection Banner */}
            {!isConnected ? (
                <div className="mb-6 p-4 rounded-xl border border-primary/30 bg-primary/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <ExclamationTriangleIcon className="w-6 h-6 text-primary" />
                        <div>
                            <p className="text-foreground font-medium">Wallet Not Connected</p>
                            <p className="text-text-secondary text-sm">Connect your wallet to start verifying your identity.</p>
                        </div>
                    </div>
                    <button
                        onClick={handleConnectWallet}
                        className="px-4 py-2 bg-primary text-black font-medium rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        Connect Wallet
                    </button>
                </div>
            ) : (
                <div className="mb-6 p-4 rounded-xl border border-green-500/30 bg-green-500/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <CheckBadgeIcon className="w-6 h-6 text-green-500" />
                        <div>
                            <p className="text-foreground font-medium">Wallet Connected</p>
                            <p className="text-text-secondary text-sm font-mono">
                                {address?.slice(0, 6)}...{address?.slice(-4)}
                                {chainId !== mantleSepolia.id && (
                                    <span className="ml-2 text-yellow-500">(Wrong Network)</span>
                                )}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleConnectWallet}
                        className="px-4 py-2 bg-white/10 text-foreground font-medium rounded-lg hover:bg-white/20 transition-colors"
                    >
                        Change
                    </button>
                </div>
            )}

            {/* Extension Status Banner */}
            {extension.checking ? null : !extension.installed ? (
                <div className="mb-6 p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 flex items-center gap-3">
                    <ExclamationTriangleIcon className="w-6 h-6 text-yellow-500" />
                    <div>
                        <p className="text-foreground font-medium">Extension Not Detected</p>
                        <p className="text-text-secondary text-sm">Install Deeproof Verifier extension to verify your KYC.</p>
                    </div>
                </div>
            ) : (
                <div className="mb-6 p-4 rounded-xl border border-green-500/30 bg-green-500/10 flex items-center gap-3">
                    <PuzzlePieceIcon className="w-6 h-6 text-green-500" />
                    <div>
                        <p className="text-foreground font-medium">Extension Connected</p>
                        <p className="text-text-secondary text-sm">
                            {pendingProofsCount > 0
                                ? `${pendingProofsCount} proof${pendingProofsCount > 1 ? 's' : ''} ready to process`
                                : "Click on Binance to verify your KYC"}
                        </p>
                    </div>
                </div>
            )}

            {/* Loading / Error State */}
            {extension.loading && (
                <div className="mb-6 p-4 rounded-xl border border-primary/30 bg-primary/10 text-center">
                    <p className="text-primary">Checking for proof...</p>
                </div>
            )}
            {extension.error && (
                <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10">
                    <p className="text-red-400">{extension.error}</p>
                </div>
            )}

            {/* On-chain verification status */}
            {proofVerification.isLoading && (
                <div className="mb-6 p-4 rounded-xl border border-primary/30 bg-primary/10 flex items-center gap-3">
                    <ArrowPathIcon className="w-6 h-6 text-primary animate-spin" />
                    <p className="text-primary">Processing proof on-chain...</p>
                </div>
            )}
            {proofVerification.error && (
                <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10">
                    <p className="text-red-400">{proofVerification.error}</p>
                </div>
            )}

            {/* Verification Modal */}
            <VerificationModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                platform={selectedPlatform}
                backendUrl={BACKEND_URL}
            />

            {/* Main Dashboard Panel */}
            <div className="glass-card rounded-2xl overflow-hidden border border-border bg-surface/50 backdrop-blur-xl shadow-2xl min-h-[600px] flex flex-col">
                {/* Panel Header */}
                <div className="px-8 pt-8 pb-4 border-b border-border/50">
                    <h2 className="text-xl font-semibold text-foreground">Identity Providers</h2>
                    <p className="text-text-secondary text-sm mt-1">Select a provider to verify your identity</p>
                </div>

                {/* Panel Content */}
                <div className="flex-1 p-8 grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Left Column: Apps Grid */}
                    <div className="lg:col-span-7 xl:col-span-8 flex flex-col justify-center">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                            {platforms.map((platform) => {
                                const hasPendingProof = onChainStatus[platform.id]?.pending;
                                const isOnChainVerified = onChainStatus[platform.id]?.verified;

                                return (
                                    <div
                                        key={platform.name}
                                        onClick={() => handlePlatformClick(platform)}
                                        className={`group relative flex flex-col items-center gap-3 p-4 rounded-xl border transition-all duration-300
                                            ${platform.enabled
                                                ? "border-border/50 bg-background/50 hover:bg-white/5 hover:border-primary/50 cursor-pointer hover:shadow-neon"
                                                : "border-border/30 bg-background/30 cursor-not-allowed opacity-60"
                                            }
                                            ${isOnChainVerified ? "border-green-500/50 bg-green-500/5" : ""}
                                            ${hasPendingProof ? "border-yellow-500/50 bg-yellow-500/5" : ""}
                                        `}
                                    >
                                        {/* Coming Soon Badge for disabled platforms */}
                                        {!platform.enabled && (
                                            <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-white/10 rounded-full">
                                                <LockClosedIcon className="w-3 h-3 text-text-secondary" />
                                                <span className="text-xs text-text-secondary">Soon</span>
                                            </div>
                                        )}

                                        {/* Pending Proof Badge */}
                                        {hasPendingProof && (
                                            <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-yellow-500/20 rounded-full">
                                                <BoltIcon className="w-4 h-4 text-yellow-500" />
                                                <span className="text-xs text-yellow-500">1 pending</span>
                                            </div>
                                        )}

                                        {/* Verified Badge */}
                                        {isOnChainVerified && (
                                            <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-green-500/20 rounded-full">
                                                <CheckBadgeIcon className="w-4 h-4 text-green-500" />
                                            </div>
                                        )}

                                        <div className={`w-full aspect-square rounded-xl bg-surface border flex items-center justify-center p-4 transition-all duration-300
                                            ${platform.enabled
                                                ? "border-border group-hover:border-primary/30 group-hover:shadow-lg"
                                                : "border-border/30"
                                            }
                                        `}>
                                            <div className={`transform transition-transform duration-300 ${platform.enabled ? "group-hover:scale-105" : ""}`}>
                                                {platform.icon && (
                                                    <img
                                                        src={platform.icon}
                                                        alt={platform.name}
                                                        className={`w-20 h-20 object-contain ${!platform.enabled ? "grayscale" : ""}`}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                        <span className={`font-medium text-sm transition-colors
                                            ${platform.enabled
                                                ? "text-foreground group-hover:text-primary"
                                                : "text-text-secondary"
                                            }
                                        `}>
                                            {platform.name}
                                        </span>
                                        <span className={`text-xs font-mono px-2 py-0.5 rounded-full
                                            ${platform.enabled
                                                ? "text-primary/80 bg-primary/10"
                                                : "text-text-secondary/50 bg-white/5"
                                            }
                                        `}>
                                            +{platform.points} pts
                                        </span>

                                        {/* Process Button for pending proofs */}
                                        {hasPendingProof && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleProcessProof();
                                                }}
                                                disabled={proofVerification.isLoading}
                                                className="w-full mt-2 px-3 py-2 bg-primary text-black font-medium text-sm rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                                            >
                                                {proofVerification.isLoading ? "Processing..." : "Process"}
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right Column: User/Score Section */}
                    <div className="lg:col-span-5 xl:col-span-4 flex flex-col items-center justify-center border-t lg:border-t-0 lg:border-l border-border/50 pt-8 lg:pt-0 lg:pl-12">

                        {/* User Profile Circle */}
                        <div className="relative mb-8 group">
                            {/* Outer decorative ring */}
                            <div className="absolute -inset-4 rounded-full border border-primary/20 bg-primary/5 blur-sm opacity-50 group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>

                            {/* Main Avatar Container */}
                            <div className="relative w-48 h-48 rounded-full bg-surface border-2 border-primary/30 flex items-center justify-center shadow-[0_0_30px_rgba(0,240,255,0.15)] overflow-hidden">
                                <UserCircleIcon className="w-full h-full text-text-secondary/50 p-4" />
                            </div>

                            {/* Optional verified badge */}
                            {onChainVerifiedCount > 0 && (
                                <div className="absolute bottom-2 right-4 bg-background rounded-full p-2 border border-primary shadow-lg">
                                    <CheckBadgeIcon className="w-8 h-8 text-primary" />
                                </div>
                            )}
                        </div>

                        {/* Score Stats */}
                        <div className="space-y-3 w-full max-w-xs text-center">
                            <div className="flex justify-between items-center p-4 rounded-xl bg-white/5 border border-border/50">
                                <span className="text-text-secondary text-sm">KYC Score</span>
                                <span className="text-primary font-bold text-2xl font-mono">{totalPoints}</span>
                            </div>
                            <div className="flex justify-between items-center p-4 rounded-xl bg-white/5 border border-border/50">
                                <span className="text-text-secondary text-sm">Verified Proofs</span>
                                <span className="text-compliance font-bold text-2xl font-mono">{onChainVerifiedCount}</span>
                            </div>
                            {pendingProofsCount > 0 && (
                                <div className="flex justify-between items-center p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                                    <span className="text-yellow-500 text-sm">Pending Proofs</span>
                                    <span className="text-yellow-500 font-bold text-2xl font-mono">{pendingProofsCount}</span>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>

            {/* Transaction Success Toast */}
            <TransactionToast
                show={showToast}
                txHash={toastTxHash}
                onClose={() => {
                    setShowToast(false);
                    setToastTxHash(null);
                }}
                explorerUrl="https://sepolia.mantlescan.xyz"
            />
        </div>
    );
}
