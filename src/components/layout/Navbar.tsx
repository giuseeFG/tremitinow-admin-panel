"use client";

import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut, UserCircle } from 'lucide-react';
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useIsMobile } from '@/hooks/use-mobile';

export function Navbar() {
  const { user, logout, loading } = useAuth();
  const isMobile = useIsMobile();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/80 px-4 shadow-sm backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-2">
        {isMobile && <SidebarTrigger />}
        <h1 className="text-xl font-semibold text-primary">Tremiti Today</h1>
      </div>
      <div className="flex items-center gap-3">
        {user && (
          <div className="flex items-center gap-2 text-sm text-foreground">
            <UserCircle className="h-5 w-5 text-muted-foreground" />
            <span>{user.email}</span>
          </div>
        )}
        <Button variant="ghost" size="icon" onClick={logout} disabled={loading} aria-label="Logout">
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
