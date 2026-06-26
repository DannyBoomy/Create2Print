import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Create2Print — Create It. Print It. Hang It.',
  description: 'Generate stunning AI artwork and get it printed and shipped to your door in one step. Posters, canvas, tapestries and more.',
  openGraph: {
    title: 'Create2Print',
    description: 'Create It. Print It. Hang It.',
    url: 'https://create2print.ai',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
