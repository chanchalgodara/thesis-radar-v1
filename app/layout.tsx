import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

const geistSans = Geist({ subsets: ["latin"] })
const geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Thesis Radar - M&A Strategic Intelligence",
  description:
    "AI-powered M&A strategic intelligence tool for proactive deal sourcing and target monitoring.",
}

export const viewport: Viewport = {
  themeColor: "#0d0f11",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.className} antialiased`}>{children}</body>
    </html>
  )
}
