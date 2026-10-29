import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Admin | ZELTRON Express', robots: { index: false, follow: false } }
export default function Layout({ children }: { children: React.ReactNode }) { return children }
