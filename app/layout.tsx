import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { QuizProvider } from "@/lib/quiz-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "QuizMaster - Interactive Quiz Platform",
  description: "Real-time quiz platform for teachers and students",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QuizProvider>{children}</QuizProvider>
      </body>
    </html>
  )
}
