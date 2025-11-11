"use client"

import { Search, ChevronDown, Menu, User, Settings, LogOut } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel } from "@/components/ui/dropdown-menu"
import { useSidebar } from "@/components/ui/sidebar"
import Image from "next/image"
import Logo from "@/public/logo.png"
import { signOut, fetchUserAttributes, fetchAuthSession } from "aws-amplify/auth"
import Link from "next/link"
import useSWR from "swr"

const fetchUser = async () => {
  const attributes = await fetchUserAttributes()
  return attributes
}

const fetchAppData = async () => {
  const session = await fetchAuthSession()
  const token = session.tokens?.idToken?.toString()
  
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/app-data`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  
  if (!response.ok) throw new Error('Failed to fetch app data')
  return response.json()
}

export default function Header() {
  const [searchFocused, setSearchFocused] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const { openMobile, setOpenMobile } = useSidebar()
  const { data: userAttributes } = useSWR('user-attributes', fetchUser)
  const { data: appData } = useSWR('app-data', fetchAppData)

  const organizations = appData?.organizations || []
  const userProfile = appData?.user
  const activeOrg = organizations.find((org: { id: string }) => org.id === userProfile?.active_org_id)

  const handleSignOut = async () => {
    await signOut()
    window.location.reload()
  }

  const displayName = userAttributes?.name || userAttributes?.email?.split('@')[0] || "User"
  const initials = userAttributes?.name?.split(" ").map((n) => n[0]).join("").toUpperCase() || userAttributes?.email?.charAt(0).toUpperCase() || "U"

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 bg-background px-4">
      <button 
        onClick={() => setOpenMobile(!openMobile)}
        className="flex items-center gap-2 md:hidden h-9 rounded-md border border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-white/5 backdrop-blur-sm px-3 text-sm"
      >
        <Menu className="size-4" />
        {activeOrg && (
          <Avatar className="size-6 ring-2 ring-white/10">
            <AvatarFallback className="text-xs font-semibold bg-blue-500 text-white">{activeOrg.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        )}
        <span className="max-w-[120px] truncate">{activeOrg?.name || "Select Workspace"}</span>
      </button>

      <div className="hidden md:block">
        <Image 
          src={Logo}
          alt="PowerApp"
          className="h-6 w-auto dark:invert" 
          priority
          quality={100}
          draggable={false}
        />
      </div>

      {/* <div className="hidden lg:flex flex-1 justify-center max-w-2xl mx-auto">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground z-10" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search..."
            className="h-9 w-full rounded-md border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-white/5 backdrop-blur-sm pl-9 pr-20 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>
      </div> */}

      <div className="hidden md:flex items-center gap-1">
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Search className="size-5" />
        </Button>
        <div className="w-1" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative">
              <Avatar className="size-10">
                <AvatarImage src={userAttributes?.picture} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 size-4 rounded-full bg-muted border-2 border-sidebar flex items-center justify-center">
                <ChevronDown className="size-2.5" />
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>
              <div className="flex items-center gap-2">
                <Avatar className="size-10">
                  <AvatarImage src={userAttributes?.picture} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{displayName}</span>
                  <span className="text-xs text-muted-foreground">{userAttributes?.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings/account">
                <User className="mr-2 size-4" />
                Account
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings/preferences">
                <Settings className="mr-2 size-4" />
                Preferences
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 size-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex md:hidden items-center gap-1">
        <Button variant="ghost" size="icon" className="hidden xs:flex">
          <Search className="size-5" />
        </Button>

        <div className="w-1 hidden xs:block" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative">
              <Avatar className="size-10">
                <AvatarImage src={userAttributes?.picture} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 size-4 rounded-full bg-muted border-2 border-sidebar flex items-center justify-center">
                <ChevronDown className="size-2.5" />
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>
              <div className="flex items-center gap-2">
                <Avatar className="size-10">
                  <AvatarImage src={userAttributes?.picture} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{displayName}</span>
                  <span className="text-xs text-muted-foreground">{userAttributes?.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings/account">
                <User className="mr-2 size-4" />
                Account
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings/preferences">
                <Settings className="mr-2 size-4" />
                Preferences
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 size-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
