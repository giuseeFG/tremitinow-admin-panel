
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar as UISidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LayoutDashboard, Users, Briefcase, FileText, BookOpen, ClipboardList, Settings, LogOut, UserCircle, Ship, Ticket, Car } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import Image from 'next/image';
import { parseImg } from '@/lib/utils'; 

const adminNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/utenti', label: 'Utenti', icon: Users },
  { href: '/operatori', label: 'Operatori', icon: Briefcase },
  { href: '/posts', label: 'Post', icon: FileText },
  { href: '/pagine', label: 'Pagine', icon: BookOpen },
  { href: '/richieste', label: 'Richieste', icon: ClipboardList },
  { href: '/tasse-sbarco', label: 'Tasse di Sbarco', icon: Ship },
  { href: '/permessi-veicoli', label: 'Permessi Veicoli', icon: Car },
];

const operatorNavItems = [
  { href: '/operator-dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/tasse-sbarco', label: 'Tasse di Sbarco', icon: Ship }, 
  { href: '/permessi-veicoli', label: 'Permessi Veicoli', icon: Car }, 
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout, loading } = useAuth();

  const logoSrc = parseImg("https://placehold.co/40x40/29ABE2/FFFFFF.png?text=TN") || "https://placehold.co/40x40/29ABE2/FFFFFF.png?text=TN";

  const navItemsToDisplay = user?.role === 'operator' ? operatorNavItems : adminNavItems;
  const dashboardPath = user?.role === 'operator' ? "/operator-dashboard" : "/dashboard";

  return (
    <UISidebar collapsible="icon">
      <SidebarHeader className="p-4 flex items-center justify-between">
          <Link href={dashboardPath} className="flex items-center gap-2">
            <Image 
              src={logoSrc} 
              alt="TremitiNow Logo" 
              width={32} height={32} 
              className="rounded-md" 
              data-ai-hint="logo initial"
            />
            <span className="font-semibold text-lg text-primary group-data-[collapsible=icon]:hidden">TremitiNow</span>
          </Link>
          <div className="group-data-[collapsible=icon]:hidden">
             <SidebarTrigger />
          </div>
      </SidebarHeader>
      <Separator />
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItemsToDisplay.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} legacyBehavior passHref>
                <SidebarMenuButton
                  isActive={pathname === item.href || (item.href !== dashboardPath && pathname.startsWith(item.href)) || (pathname === dashboardPath && item.href === dashboardPath) }
                  tooltip={{ children: item.label, side: "right", align: "center" }}
                  className="justify-start"
                >
                  <item.icon className="h-5 w-5" />
                  <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <Separator />
      <SidebarFooter className="p-2">
         {user && (
            <SidebarMenuButton
                tooltip={{ children: user.email, side: "right", align: "center" }}
                className="justify-start w-full mb-2"
                variant="outline"
                asChild
            >
              <div className="flex items-center gap-2">
                <UserCircle className="h-5 w-5" />
                <span className="truncate group-data-[collapsible=icon]:hidden">{user.email}</span>
              </div>
            </SidebarMenuButton>
         )}
        <Button variant="ghost" className="w-full justify-start gap-2 group-data-[collapsible=icon]:justify-center" onClick={logout} disabled={loading}>
          <LogOut className="h-5 w-5" />
          <span className="group-data-[collapsible=icon]:hidden">Logout</span>
        </Button>
      </SidebarFooter>
    </UISidebar>
  );
}
