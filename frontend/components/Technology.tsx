"use client";

import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import {
    ShieldCheck,
    Lightning,
    Hash,
} from "@phosphor-icons/react";

export function Technology() {
    return (
        <section id="technology" className="mb-32">
            <Container>
                <div className="text-center mb-16 px-4">
                    <h2 className="font-bold text-3xl md:text-4xl mb-6 text-foreground">The Hybrid Oracle Architecture</h2>
                    <p className="text-code-grey max-w-2xl mx-auto">
                        A secure, privacy-first pipeline that converts raw verification into boolean on-chain approvals.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card className="flex flex-col items-start">
                        <div className="w-12 h-12 rounded-lg bg-electric-azure/10 flex items-center justify-center mb-6">
                            <Hash className="w-6 h-6 text-electric-azure" />
                        </div>
                        <h3 className="font-semibold text-xl mb-3 text-foreground">Blind Hashing</h3>
                        <p className="text-code-grey text-sm leading-relaxed">
                            Platform partners send us a cryptographic hash (SHA256) of user data. We never see, store, or process raw emails from third parties.
                        </p>
                    </Card>

                    <Card className="flex flex-col items-start">
                        <div className="w-12 h-12 rounded-lg bg-oracle-gold/10 flex items-center justify-center mb-6">
                            <Lightning className="w-6 h-6 text-oracle-gold" />
                        </div>
                        <h3 className="font-semibold text-xl mb-3 text-foreground">Just-in-Time Signing</h3>
                        <p className="text-code-grey text-sm leading-relaxed">
                            If a match is found in our encrypted index, the Oracle signs a time-limited validity proof for that specific transaction.
                        </p>
                    </Card>

                    <Card className="flex flex-col items-start">
                        <div className="w-12 h-12 rounded-lg bg-protocol-cyan/10 flex items-center justify-center mb-6">
                            <ShieldCheck className="w-6 h-6 text-protocol-cyan" />
                        </div>
                        <h3 className="font-semibold text-xl mb-3 text-foreground">On-Chain Settlement</h3>
                        <p className="text-code-grey text-sm leading-relaxed">
                            Smart contracts verify the Oracle's signature on-chain, granting access to RWA pools or Launchpads instantly.
                        </p>
                    </Card>
                </div>
            </Container>
        </section>
    );
}
