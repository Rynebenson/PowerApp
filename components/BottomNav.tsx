"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { TbHome, TbRobot, TbMessageCircle, TbChartBar } from "react-icons/tb"

export default function BottomNav() {
  const pathname = usePathname()

  const navItems = [
    { href: "/", icon: TbHome, label: "Home" },
    { href: "/chatbots", icon: TbRobot, label: "Chatbots" },
    { href: "/conversations", icon: TbMessageCircle, label: "Conversations" },
    { href: "/analytics", icon: TbChartBar, label: "Analytics" },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-sidebar md:hidden">
      <div className="flex items-center justify-around h-20">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-1 ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className="text-2xl" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
