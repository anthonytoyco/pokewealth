import Link from 'next/link'

export default function Navigation() {
    return (
        <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
            <div className="container mx-auto px-4 py-4">
                <div className="flex justify-between items-center">
                    <Link href="/" className="text-2xl font-bold text-gray-900 dark:text-white">
                        PokeWealth
                    </Link>
                    <div className="flex space-x-4">
                        <Link
                            href="/"
                            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        >
                            Add Card
                        </Link>
                        <Link
                            href="/collection"
                            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        >
                            Collection
                        </Link>
                        <Link
                            href="/wealth"
                            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        >
                            Portfolio
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    )
}
