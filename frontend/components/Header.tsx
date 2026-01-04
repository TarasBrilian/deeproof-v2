import Link from 'next/link';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

export default function Header() {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo Section */}
                    <div className="flex-shrink-0 flex items-center">
                        <Link href="/" className="flex items-center gap-2.5 group">
                            <ShieldCheckIcon className="h-9 w-9 text-primary group-hover:drop-shadow-[0_0_8px_rgba(0,240,255,0.5)] transition-all duration-300" />
                            <span className="font-bold text-xl tracking-tight text-foreground">
                                DEEP<span className="text-primary">ROOF</span>
                            </span>
                        </Link>
                    </div>

                    {/* Navigation/Actions */}
                    <div className="flex items-center gap-4">
                        <Link
                            href="/apps/dashboard"
                            className="px-4 py-2 rounded-md text-sm font-medium text-foreground hover:text-primary transition-colors duration-200 border border-transparent hover:border-primary/50"
                        >
                            Dashboard
                        </Link>
                        {/* Future wallet connection button can go here */}
                    </div>
                </div>
            </div>
        </header>
    );
}
