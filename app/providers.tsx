"use client"

import { ThemeProvider } from "next-themes"
import AuthGuard from "@/components/AuthGuard"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppProvider } from "@/contexts/AppContext"
import "@/lib/amplify"

export default function Providers({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
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