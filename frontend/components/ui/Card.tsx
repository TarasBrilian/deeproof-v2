import React from 'react';

export function Card({ children, className = "" }: { children: React.ReactNode, className?: string }) {
    return (
        <div className={`glass-card p-6 rounded-xl hover:border-primary/50 transition-colors duration-300 ${className}`}>
            {children}
        </div>
    );
}
