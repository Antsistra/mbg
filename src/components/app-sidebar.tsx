import * as React from "react";
import {
  Apple,
  ChartPie,
  FileText,
  LayoutDashboard,
  Settings2,
  UtensilsCrossed,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

// Sidebar navigation data
const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "Clustering",
      url: "#",
      icon: ChartPie,
      items: [
        {
          title: "Visualisasi",
          url: "/clustering/visualisasi",
        },
        {
          title: "Upload Data",
          url: "/clustering/upload",
        },
        {
          title: "Daftar Hasil",
          url: "/clustering/hasil",
        },
      ],
    },
    {
      title: "Bahan Pangan",
      url: "#",
      icon: Apple,
      items: [
        {
          title: "Daftar Bahan",
          url: "/bahan-pangan",
        },
        {
          title: "Bandingkan",
          url: "/bahan-pangan/bandingkan",
        },
      ],
    },
    {
      title: "Menu MBG",
      url: "#",
      icon: UtensilsCrossed,
      items: [
        {
          title: "Susun Menu",
          url: "/menu/susun",
        },
        {
          title: "Daftar Menu",
          url: "/menu",
        },
        {
          title: "Bandingkan Gizi",
          url: "/menu/bandingkan",
        },
      ],
    },
    {
      title: "Laporan",
      url: "#",
      icon: FileText,
      items: [
        {
          title: "Export Data",
          url: "/laporan/export",
        },
      ],
    },
    {
      title: "Pengaturan",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "Profil",
          url: "/pengaturan/profil",
        },
        {
          title: "Preferensi",
          url: "/pengaturan/preferensi",
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();

  const userData = {
    name:
      user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User",
    email: user?.email || "",
    avatar: user?.user_metadata?.avatar_url || "",
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden">
                  <img
                    src="/bgn.png"
                    alt="BGN Logo"
                    className="size-8 object-cover"
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Badan Gizi</span>
                  <span className="truncate text-xs">Nasional</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
