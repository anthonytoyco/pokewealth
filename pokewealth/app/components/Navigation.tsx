import Link from 'next/link'

export default function Navigation() {
    return (
        <nav className="bg-white dark:bg-[#242b3d] border-b border-[#e1e4e8] dark:border-[#3d4556] shadow-sm">
            <div className="container mx-auto px-6 py-5">
                <div className="flex justify-between items-center">
                    <Link href="/" className="flex items-center space-x-3 group">
                        {/* Simple Pokeball Icon */}
                        <div className="w-12 h-12 rounded-full relative overflow-hidden flex-shrink-0 transition-transform group-hover:scale-105 duration-200 border-2 border-black">
                            <div className="absolute top-0 left-0 right-0 h-[calc(50%-2px)] bg-[#ff4444]"></div>
                            <div className="absolute bottom-0 left-0 right-0 h-[calc(50%-2px)] bg-white"></div>
                            <div className="absolute top-1/2 left-0 right-0 h-1 bg-black transform -translate-y-1/2"></div>
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-black"></div>
                        </div>
                        <div className="text-3xl font-black text-[#0078ff]">
                            PokéWealth
                        </div>
                    </Link>
                    <div className="flex items-center gap-1">
                        <Link
                            href="/"
                            className="px-5 py-2.5 text-[#5a6c7d] dark:text-[#a8b2c1] hover:text-[#0078ff] dark:hover:text-[#0078ff] font-semibold transition-colors duration-200 rounded-lg hover:bg-[#f8f9fb] dark:hover:bg-[#1a1f2e]"
                        >
                            Add Card
                        </Link>
                        <Link
                            href="/collection"
                            className="px-5 py-2.5 text-[#5a6c7d] dark:text-[#a8b2c1] hover:text-[#0078ff] dark:hover:text-[#0078ff] font-semibold transition-colors duration-200 rounded-lg hover:bg-[#f8f9fb] dark:hover:bg-[#1a1f2e]"
                        >
                            Collection
                        </Link>
                        <Link
                            href="/deck-binder"
                            className="px-5 py-2.5 text-[#5a6c7d] dark:text-[#a8b2c1] hover:text-[#0078ff] dark:hover:text-[#0078ff] font-semibold transition-colors duration-200 rounded-lg hover:bg-[#f8f9fb] dark:hover:bg-[#1a1f2e]"
                        >
                            Decks & Binders
                        </Link>
                        <Link
                            href="/wealth"
                            className="px-5 py-2.5 bg-[#0078ff] hover:bg-[#0060d9] text-white font-bold rounded-lg transition-colors duration-200 shadow-sm ml-2"
                        >
                            Portfolio
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    )
}
