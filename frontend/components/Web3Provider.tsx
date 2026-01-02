"use client";

import { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, State } from "wagmi";
import { wagmiConfig } from "@/lib/wagmiConfig";

const queryClient = new QueryClient();

interface Web3ProviderProps {
    children: ReactNode;
    initialState?: State;
}

export function Web3Provider({ children, initialState }: Web3ProviderProps) {
    return (
        <WagmiProvider config={wagmiConfig} initialState={initialState}>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </WagmiProvider>
    );
}
