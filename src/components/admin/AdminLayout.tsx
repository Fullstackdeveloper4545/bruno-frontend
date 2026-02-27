import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bell,
  Boxes,
  ClipboardList,
  CreditCard,
  Languages,
  LayoutDashboard,
  LogOut,
  Percent,
  Plug,
  Receipt,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Store,
  Tags,
  Truck,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { cn } from "@/lib/utils";

const formatDate = () =>
  new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date());

type NavItem = {
  title: string;
  to: string;
  icon: LucideIcon;
  badge?: string;
  nested?: boolean;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

const navSections: NavSection[] = [
  {
    label: "Overview",
    items: [{ title: "Dashboard", to: "/admin", icon: LayoutDashboard }],
  },
  {
    label: "Catalog",
    items: [
      { title: "Products", to: "/admin/products", icon: Boxes },
      { title: "Categories", to: "/admin/categories", icon: Tags },
    ],
  },
  {
    label: "Operations",
    items: [
      { title: "Stores", to: "/admin/stores", icon: Store },
      { title: "Orders", to: "/admin/orders/total", icon: ClipboardList, badge: "8" },
      { title: "Shipping", to: "/admin/shipping", icon: Truck },
      { title: "Invoices", to: "/admin/invoices", icon: Receipt },
    ],
  },
  {
    label: "Finance",
    items: [
      { title: "Payments", to: "/admin/payments", icon: CreditCard, badge: "2" },
      { title: "Discounts", to: "/admin/discounts/coupons", icon: Percent },
      { title: "Reports", to: "/admin/reports", icon: BarChart3 },
    ],
  },
  {
    label: "Customers",
    items: [{ title: "Customers", to: "/admin/customers", icon: Users }],
  },
  {
    label: "Platform",
    items: [
      { title: "Integrations", to: "/admin/integrations", icon: Plug },
      { title: "Languages", to: "/admin/languages", icon: Languages },
      { title: "Settings", to: "/admin/settings", icon: Settings },
      { title: "Admin Security", to: "/admin/security", icon: ShieldCheck },
    ],
  },
];

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAdminAuth();
  const normalizedPath = location.pathname.replace(/\/$/, "");

  const isActive = (to: string) => {
    if (to === "/admin") {
      return normalizedPath === "/admin" || normalizedPath === "";
    }
    return normalizedPath.startsWith(to);
  };

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" variant="inset">
        <SidebarHeader>
          <div className="flex flex-col gap-3 rounded-lg border border-sidebar-border/60 bg-background/70 p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="leading-tight">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Backoffice</p>
                <p className="font-display text-sm font-semibold">Portugal x Espanha</p>
              </div>
            </div>
            <Badge variant="secondary" className="inline-flex w-fit gap-1 px-2 text-[10px] uppercase tracking-[0.2em]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Live
            </Badge>
          </div>
        </SidebarHeader>
        <SidebarContent>
          {navSections.map((section, sectionIndex) => (
            <SidebarGroup key={section.label}>
              <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {section.items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive(item.to)}
                        tooltip={item.title}
                        className={cn(
                          isActive(item.to) && "bg-sidebar-accent font-semibold",
                          item.nested && "pl-8 text-[13px] opacity-90",
                        )}
                      >
                        <NavLink to={item.to}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                      {item.badge ? <SidebarMenuBadge>{item.badge}</SidebarMenuBadge> : null}
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
              {sectionIndex < navSections.length - 1 ? <SidebarSeparator /> : null}
            </SidebarGroup>
          ))}
        </SidebarContent>
        <SidebarFooter>
          <div className="flex items-center gap-3 rounded-lg border border-sidebar-border/60 bg-background/70 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              AO
            </div>
            <div className="flex-1 text-sm">
              <p className="font-medium">Admin Owner</p>
              <p className="text-xs text-muted-foreground">admin@ecom.pt</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                logout();
                navigate("/", { replace: true });
              }}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarRail />
      <SidebarInset className="bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.25),_transparent_55%)] before:pointer-events-none before:absolute before:inset-0 before:bg-[linear-gradient(90deg,rgba(148,163,184,0.25)_1px,transparent_1px),linear-gradient(rgba(148,163,184,0.25)_1px,transparent_1px)] before:bg-[size:48px_48px] before:opacity-40">
        <div className="relative z-10 flex min-h-svh flex-col">
          <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 lg:px-8">
              <div className="flex items-center gap-3">
                <SidebarTrigger />
                <div className="leading-tight">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Admin Overview</p>
                  <p className="font-display text-lg font-semibold">Operations Center</p>
                </div>
                <Badge variant="secondary" className="hidden gap-1 text-[10px] uppercase tracking-[0.2em] md:inline-flex">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Integration Active
                </Badge>
              </div>
              <div className="hidden md:block">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input className="h-9 w-64 rounded-full pl-9" placeholder="Search orders, SKUs, customers" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="hidden text-xs text-muted-foreground lg:block">{formatDate()}</span>
                <Button variant="outline" size="sm" className="hidden md:inline-flex">
                  Manual Sync
                </Button>
                <Button size="sm">New Order</Button>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-4 w-4" />
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-amber-500" />
                </Button>
              </div>
            </div>
          </header>
          <main className="flex-1">
            <div className="mx-auto w-full max-w-7xl px-4 pb-12 pt-6 lg:px-8">
              <Outlet />
            </div>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default AdminLayout;
