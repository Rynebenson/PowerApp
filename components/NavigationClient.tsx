'use client'

import { 
  Sidebar, 
  SidebarContent,
  SidebarFooter,
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Home,
  Settings,
  Bot,
  MessageSquare,
  BarChart3,
  Zap,
  ChevronUp,
  CircleHelp,
  User,
  LogOut,
} from "lucide-react"
import Link from "next/link"
import { AuthUser, signOut, fetchUserAttributes } from "aws-amplify/auth"
import { usePathname } from "next/navigation"
import useSWR from "swr"
import { useIsMobile } from "@/hooks/use-mobile"
import { useSidebar } from "@/components/ui/sidebar"

interface NavigationClientProps {
  user: AuthUser | null
}

const MENU_ITEMS = [
  { icon: Home, href: "/", label: "Dashboard" },
  { icon: Bot, href: "/chatbots", label: "Chatbots" },
  { icon: MessageSquare, href: "/conversations", label: "Conversations" },
  { icon: BarChart3, href: "/analytics", label: "Analytics" },
  { icon: Zap, href: "/integrations", label: "Integrations" },
]

const fetchUser = async () => {
  const attributes = await fetchUserAttributes()
  return attributes
}

export default function NavigationClient({ user: _user }: NavigationClientProps) {
  const pathname = usePathname()
  const { data: userAttributes, isLoading } = useSWR('user-attributes', fetchUser)
  const isMobile = useIsMobile()
  const { setOpenMobile } = useSidebar()

  const handleSignOut = async () => {
    await signOut()
    window.location.reload()
  }

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  const displayName = userAttributes?.name || userAttributes?.email?.split('@')[0] || "User"
  const initials = userAttributes?.name?.split(" ").map((n) => n[0]).join("").toUpperCase() || userAttributes?.email?.charAt(0).toUpperCase() || "U"

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-3">
        <div className="flex items-center gap-3 w-full h-12 px-2">
          <Avatar className="size-8 ring-2 ring-white/10">
            <AvatarFallback className="text-sm font-semibold bg-blue-600 text-white">PA</AvatarFallback>
          </Avatar>
          <div className="flex-1 text-left">
            <div className="font-medium">PowerApp</div>
            <div className="text-xs text-muted-foreground">Chatbot Management</div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarGroup className="pt-0">
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {MENU_ITEMS.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link href={item.href} onClick={handleLinkClick}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2 space-y-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith("/settings")}>
              <Link href="/settings" onClick={handleLinkClick}>
                <Settings />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/support" onClick={handleLinkClick}>
                <CircleHelp />
                <span>Help & Support</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="border-t pt-2">
        {isLoading ? (
          <div className="flex items-center gap-2 px-2 py-3">
            <Skeleton className="size-8 rounded-full" />
            <div className="flex flex-col gap-1 flex-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        ) : (
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton className="h-14">
                    <Avatar className="size-8">
                      <AvatarImage src={userAttributes?.picture} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start text-sm">
                      <span className="font-medium">{displayName}</span>
                      <span className="text-xs text-muted-foreground truncate">{userAttributes?.email}</span>
                    </div>
                    <ChevronUp className="ml-auto" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="bottom" align="start" sideOffset={8} className="w-80">
                  <DropdownMenuLabel>
                    <div className="flex items-center gap-2">
                      <Avatar className="size-8">
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
                    <Link href="/settings">
                      <Settings className="mr-2 size-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 size-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
