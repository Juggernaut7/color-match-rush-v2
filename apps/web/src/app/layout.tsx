import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { WalletProvider } from "@/components/wallet-provider"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Color Match Rush | Arc reaction game",
  description:
    "Play free or enter an optional Arc Mainnet competition using native USDC.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  )
}
