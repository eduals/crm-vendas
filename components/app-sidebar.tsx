"use client"

import Link from "next/link"
import type * as React from "react"
import {
  BuildingIcon,
  CalendarIcon,
  HomeIcon,
  LayoutDashboardIcon,
  SearchIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react"

import { NavMain } from "./nav-main"
import { NavSecondary } from "./nav-secondary"
import { NavUser } from "./nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "Admin",
    email: "admin@imobiliaria.com",
    avatar: "https://i.pravatar.cc/300",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboardIcon,
    },
    {
      title: "Imóveis",
      url: "/properties",
      icon: BuildingIcon,
    },
    {
      title: "Corretores",
      url: "/agents",
      icon: UsersIcon,
    },
    {
      title: "Visitas",
      url: "/visits",
      icon: CalendarIcon,
    },
  ],
  navSecondary: [
    {
      title: "Configurações",
      url: "/settings",
      icon: SettingsIcon,
    }
    // {
    //   title: "Ajuda",
    //   url: "/help",
    //   icon: SearchIcon,
    // },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <Link href="/dashboard">
                <HomeIcon className="h-5 w-5" />
                <span className="text-base font-semibold">ImobSystem</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}

