"use client"

import { ThemeProvider } from "next-themes"
import AuthGuard from "@/components/AuthGuard"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import Header from "@/components/Header"
import BottomNav from "@/components/BottomNav"
import "@/lib/amplify"

export default function Providers({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthGuard>
        <SidebarProvider>
          {children}
        </SidebarProvider>
      </AuthGuard>
    </ThemeProvider>
  )
}