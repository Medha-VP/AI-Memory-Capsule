import { SignInScreen } from "@/components/SignInScreen";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useQueryClient } from "@tanstack/react-query";
import { Link, Outlet, useLocation } from "@tanstack/react-router";
import {
  BrainCircuit,
  FileText,
  LayoutDashboard,
  LogOut,
  Network,
  Sparkles,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Overview", to: "/dashboard", icon: LayoutDashboard },
  { label: "Documents", to: "/dashboard/documents", icon: FileText },
  { label: "AI Dashboard", to: "/dashboard/ai", icon: BrainCircuit },
  { label: "Knowledge Graph", to: "/dashboard/knowledge-graph", icon: Network },
];

export function DashboardLayout() {
  const { isAuthenticated, identity, clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { pathname } = useLocation();

  if (!isAuthenticated) {
    return <SignInScreen />;
  }

  const principal = identity?.getPrincipal().toString() ?? "";
  const shortPrincipal =
    principal.length > 14
      ? `${principal.slice(0, 6)}…${principal.slice(-4)}`
      : principal;

  const handleSignOut = () => {
    clear();
    queryClient.clear();
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-1">
            <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-primary">
              <Sparkles className="size-4 text-primary-foreground" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-display text-sm font-bold tracking-tight">
                AI Memory Capsule
              </span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Vault
              </span>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV_ITEMS.map((item) => (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild isActive={pathname === item.to}>
                      <Link to={item.to}>
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
        <SidebarFooter>
          <div className="flex items-center gap-2 px-2 py-1">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary font-mono text-xs text-secondary-foreground">
              {shortPrincipal.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex min-w-0 flex-1 flex-col leading-tight">
              <span className="truncate font-mono text-xs text-foreground">
                {shortPrincipal}
              </span>
              <span className="text-[10px] text-muted-foreground">
                Signed in
              </span>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b bg-card/80 px-4 backdrop-blur">
          <SidebarTrigger />
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            AI Memory Capsule
          </span>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 font-mono text-xs text-accent sm:flex">
              <span className="size-1.5 animate-pulse-soft rounded-full bg-accent" />
              AI online
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              {shortPrincipal}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              data-ocid="dashboard.sign_out_button"
            >
              <LogOut className="size-3.5" />
              Sign out
            </Button>
          </div>
        </header>
        <main className="flex-1 bg-background p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
