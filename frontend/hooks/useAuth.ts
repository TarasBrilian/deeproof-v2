import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";

const TOKEN_KEY = "deeproof_auth_token";
const SESSION_KEY = "deeproof_session";

interface AuthSession {
    walletAddress: string;
    token: string;
    expiresAt: number;
}

export function useAuth() {
    const { address, isConnected } = useAccount();
    const [token, setToken] = useState<string | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Restore session from localStorage
    useEffect(() => {
        try {
            const savedSession = localStorage.getItem(SESSION_KEY);
            if (savedSession) {
                const session: AuthSession = JSON.parse(savedSession);

                // Check if session is expired
                if (session.expiresAt > Date.now()) {
                    // Check if wallet address matches
                    if (address && session.walletAddress.toLowerCase() === address.toLowerCase()) {
                        setToken(session.token);
                        setIsAuthenticated(true);
                        console.log("[Auth] Session restored from localStorage");
                    } else {
                        // Wallet changed, clear session
                        clearSession();
                    }
                } else {
                    // Session expired
                    console.log("[Auth] Session expired");
                    clearSession();
                }
            }
        } catch (error) {
            console.error("[Auth] Failed to restore session:", error);
            clearSession();
        } finally {
            setIsLoading(false);
        }
    }, [address]);

    // Clear session when wallet disconnects
    useEffect(() => {
        if (!isConnected && isAuthenticated) {
            clearSession();
        }
    }, [isConnected, isAuthenticated]);

    const saveSession = useCallback((walletAddress: string, authToken: string) => {
        // JWT tokens typically expire in 1 hour
        const expiresAt = Date.now() + (60 * 60 * 1000);

        const session: AuthSession = {
            walletAddress: walletAddress.toLowerCase(),
            token: authToken,
            expiresAt,
        };

        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        localStorage.setItem(TOKEN_KEY, authToken);
        setToken(authToken);
        setIsAuthenticated(true);

        console.log("[Auth] Session saved");
    }, []);

    const clearSession = useCallback(() => {
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setIsAuthenticated(false);
        console.log("[Auth] Session cleared");
    }, []);

    const login = useCallback((walletAddress: string, authToken: string) => {
        saveSession(walletAddress, authToken);
    }, [saveSession]);

    const logout = useCallback(() => {
        clearSession();
    }, [clearSession]);

    return {
        token,
        isAuthenticated,
        isLoading,
        login,
        logout,
    };
}
