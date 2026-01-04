import React from 'react';

interface FeatureCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
}

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
    return (
        <div className="glass-card p-6 rounded-xl hover:border-primary/50 hover:scale-[1.02] transition-all duration-300">
            <div className="mb-4 p-3 bg-surface/50 rounded-lg w-fit border border-border">
                {icon}
            </div>
            <h3 className="text-xl font-bold mb-2 text-foreground">{title}</h3>
            <p className="text-text-secondary leading-relaxed">{description}</p>
        </div>
    );
}
