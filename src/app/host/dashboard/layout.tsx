'use client'

import Wordmark from '@/components/wordmark'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const menuItems: { label: string; href: string }[] = [
  { label: 'Quizzes', href: '/host/dashboard' },
  { label: 'How to play', href: '/host/dashboard/how-to' },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-mist">
      <header className="border-b-2 border-ink bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <Link href="/host/dashboard">
            <Wordmark tone="dark" />
          </Link>
          <nav className="flex gap-2">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={pathname === item.href ? 'page' : undefined}
                className={`rounded-full border-2 px-4 py-1.5 font-semibold transition ${
                  pathname === item.href
                    ? 'border-ink bg-ink text-white'
                    : 'border-transparent text-ink/70 hover:border-ink/20 hover:text-ink'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  )
}
