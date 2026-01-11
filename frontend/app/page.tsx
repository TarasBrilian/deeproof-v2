import Link from "next/link";
import { Technology } from "@/components/Technology";
import { FeatureCard } from "@/components/FeatureCard";
import { ShieldCheckIcon, LockClosedIcon, FingerPrintIcon, ServerStackIcon, VariableIcon } from "@heroicons/react/24/outline";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center relative overflow-hidden bg-background text-foreground">

      {/* Background Decor */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Hero Section */}
      <section className="w-full min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 text-center max-w-5xl mx-auto space-y-8 py-20">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight animate-fade-in">
          The Invisible <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">Fortress</span>
        </h1>

        <p className="text-xl text-text-secondary max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.1s' }}>
          Institutional-grade identity verification with zero-knowledge privacy.
          Your identity remains yours. The proof is all that matters.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <Link href="/apps/dashboard" className="btn-primary flex items-center gap-2 text-lg px-8 py-3">
            Launch App
          </Link>
          <a href="https://deeproof-docs.vercel.app/docs/" className="flex items-center gap-2 text-text-secondary hover:text-foreground transition-colors px-8 py-3 border border-border rounded-lg hover:border-primary/50">
            Learn More
          </a>
        </div>
      </section>

      {/* The Problem Section */}
      <section id="problem" className="w-full py-24 px-4 bg-surface/30 border-y border-border">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">The Transparency Paradox</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold text-primary">Data is a Liability</h3>
              <p className="text-text-secondary text-lg leading-relaxed">
                Traditional identity verification creates massive centralized honeypots.
                Every time you KYC, you hand over your passport, face map, and address to strangers.
                Eventually, <span className="text-error font-mono">Consumer_Data_Breach_01</span> happens.
              </p>
              <ul className="space-y-4 text-text-secondary">
                <li className="flex items-center gap-3">
                  <span className="text-error">✗</span> Identity Theft Risk
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-error">✗</span> Third-party Data Selling
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-error">✗</span> Perpetual Surveillance
                </li>
              </ul>
            </div>
            <div className="glass-card p-8 rounded-xl border border-error/20 flex flex-col items-center justify-center h-full relative overflow-hidden">
              <div className="absolute inset-0 bg-error/5 -z-10"></div>
              <LockClosedIcon className="h-24 w-24 text-error/50 mb-4" />
              <div className="font-mono text-error/80 text-sm">CRITICAL_FAILURE: DATA_LEAK</div>
            </div>
          </div>
        </div>
      </section>

      {/* The Solution / Advantages */}
      <section className="w-full py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-16 text-center">The Deeproof Advantage</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<ShieldCheckIcon className="h-8 w-8 text-primary" />}
              title="Trustless Verification"
              description="Institutions verify your status without ever seeing your documents. Mathematical certainty replaces trust."
            />
            <FeatureCard
              icon={<FingerPrintIcon className="h-8 w-8 text-primary" />}
              title="Sovereign Identity"
              description="Your biometric and civil data never leaves your device. You are the only custodian of your identity."
            />
            <FeatureCard
              icon={<ServerStackIcon className="h-8 w-8 text-primary" />}
              title="Universal Compliance"
              description="Compatible with global KYC/AML standards while preserving user dignity and privacy."
            />
          </div>
        </div>
      </section>

      {/* The Math (ZK) Section */}
      <section className="w-full py-24 px-4 bg-surface/30 border-y border-border">
        <div className="max-w-5xl mx-auto text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">The Math Behind the Magic</h2>
              <div className="inline-flex items-start gap-2 text-primary font-mono text-sm border border-primary/20 px-3 py-1 rounded bg-primary/5">
                <VariableIcon className="h-5 w-5" />
                zk-SNARKs (Zero-Knowledge Succinct Non-Interactive Argument of Knowledge)
              </div>
              <p className="text-text-secondary text-lg leading-relaxed">
                We use advanced arithmetic circuits to generate a proof $\pi$.
                The Verifier function $V(x, \pi)$ returns true if and only if the Prover knows a secret witness $w$ such that $C(x, w) = 0$, without revealing $w$.
              </p>
              <div className="glass-card p-6 rounded-lg text-left font-mono text-sm text-text-secondary space-y-2 border border-primary/10">
                <p><span className="text-primary">function</span> prove(secret, publicInput) &#123;</p>
                <p className="pl-4 text-text-muted">return generateProof(circuit, secret, publicInput);</p>
                <p>&#125;</p>
                <p><span className="text-primary">function</span> verify(proof, publicInput) &#123;</p>
                <p className="pl-4 text-text-muted">return math.check(proof, publicInput) == <span className="text-compliance">true</span>;</p>
                <p>&#125;</p>
              </div>
            </div>
            <div className="flex-1 flex justify-center">
              {/* Abstract Math Visual - Slowed down per design guidelines */}
              <div className="relative w-64 h-64 border border-primary/20 rounded-full flex items-center justify-center animate-slow-spin">
                <div className="absolute w-[120%] h-[1px] bg-primary/20 rotate-45"></div>
                <div className="absolute w-[120%] h-[1px] bg-primary/20 -rotate-45"></div>
                <div className="w-48 h-48 border border-primary/40 rounded-full flex items-center justify-center animate-slow-spin-reverse">
                  <div className="w-4 h-4 bg-primary rounded-full shadow-[0_0_15px_rgba(0,240,255,0.8)]"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section (Hybrid Oracle) */}
      <Technology />
    </div>
  );
}
