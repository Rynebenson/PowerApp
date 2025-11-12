"use client"

import { ThemeProvider } from "next-themes"
import AuthGuard from "@/components/AuthGuard"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppProvider } from "@/contexts/AppContext"
import NextTopLoader from "nextjs-toploader"
import { Toaster } from "react-hot-toast"
import "@/lib/amplify"

export default function Providers({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <NextTopLoader color="#4f39f6" height={3} showSpinner={false} />
      <Toaster position="top-center" />

      <AuthGuard>
        <AppProvider>
          <SidebarProvider>
            {children}
          </SidebarProvider>
        </AppProvider>
      </AuthGuard>
    </ThemeProvider>
  )
}