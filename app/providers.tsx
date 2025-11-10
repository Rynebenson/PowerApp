"use client"

import { ThemeProvider } from "next-themes"
import AuthGuard from "@/components/AuthGuard"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import Navigation from "@/components/Navigation"
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
          <Navigation />
          <SidebarInset>
            <Header />
            <main className="pb-20 md:pb-0 overflow-hidden">
              {children}
            </main>
            <BottomNav />
          </SidebarInset>
        </SidebarProvider>
      </AuthGuard>
    </ThemeProvider>
  )
}