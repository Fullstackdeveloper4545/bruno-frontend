import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { toast } from "@/components/ui/sonner";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { adminApi } from "@/lib/adminApi";
import { cn } from "@/lib/utils";

const formatDate = () =>
  new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date());

const formatNotificationTime = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));

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

type AdminOrderSnapshot = {
  id: number;
  order_number?: string;
  customer_name?: string;
  status?: string;
};

type LowStockSnapshot = {
  product_id?: string | number;
  name?: string;
  sku?: string;
  store_id?: string | number | null;
  store_name?: string;
  stock_left?: number;
};

type DashboardSummaryResponse = {
  low_stock_products?: LowStockSnapshot[];
};

type ManualSyncResponse = {
  synced_products?: number;
};

type IntegrationSettingsSnapshot = {
  is_active?: boolean;
  base_url?: string | null;
  integration_name?: string | null;
};

type AdminNotificationType = "new_order" | "order_cancelled" | "out_of_stock" | "low_stock";

type AdminNotification = {
  id: string;
  type: AdminNotificationType;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
};

type OrderTrackingState = {
  initialized: boolean;
  orderIds: Set<number>;
  orderStatusById: Map<number, string>;
};

type LowStockTrackingState = {
  initialized: boolean;
  stockByKey: Map<string, number>;
};

const NOTIFICATION_POLL_INTERVAL_MS = 20000;
const INTEGRATION_STATUS_POLL_INTERVAL_MS = 30000;
const INTEGRATION_STATUS_EVENT = "admin:integration-settings-updated";
const LOW_STOCK_THRESHOLD = 10;
const LOW_STOCK_LIMIT = 300;
const MAX_NOTIFICATIONS = 40;

const normalizeStatus = (status?: string) => String(status || "").trim().toLowerCase();

const toOrderLabel = (order: AdminOrderSnapshot) => order.order_number || `#${order.id}`;

const lowStockKey = (item: LowStockSnapshot) => {
  const productKey = item.product_id != null ? String(item.product_id) : item.sku || item.name || "product";
  const storeKey = item.store_id != null ? String(item.store_id) : item.store_name || "store";
  return `${productKey}::${storeKey}`;
};

const detectIntegrationProvider = (baseUrl?: string | null) => {
  const value = String(baseUrl || "").trim().toLowerCase();
  if (!value) return null;
  if (value.includes("wordpress") || value.includes("/wp-json") || value.includes("/wc/v3")) return "WordPress";
  if (value.includes("shopify") || value.includes("myshopify.com")) return "Shopify";
  return null;
};

const buildIntegrationBadgeLabel = (settings?: IntegrationSettingsSnapshot) => {
  if (!settings?.is_active) return "Integration Active";
  const explicitName = String(settings.integration_name || "").trim();
  if (explicitName) return `${explicitName} Integration Active`;
  const provider = detectIntegrationProvider(settings.base_url);
  return provider ? `${provider} Integration Active` : "Integration Active";
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
  const isOrdersSection = normalizedPath.startsWith("/admin/orders");
  const ordersSearchQuery = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("q") || "";
  }, [location.search]);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [notificationsError, setNotificationsError] = useState("");
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [integrationBadgeLabel, setIntegrationBadgeLabel] = useState("Integration Active");
  const orderTrackingRef = useRef<OrderTrackingState>({
    initialized: false,
    orderIds: new Set<number>(),
    orderStatusById: new Map<number, string>(),
  });
  const lowStockTrackingRef = useRef<LowStockTrackingState>({
    initialized: false,
    stockByKey: new Map<string, number>(),
  });

  const pushNotification = useCallback((type: AdminNotificationType, title: string, message: string) => {
    const next: AdminNotification = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      title,
      message,
      createdAt: new Date().toISOString(),
      read: false,
    };

    setNotifications((prev) => [next, ...prev].slice(0, MAX_NOTIFICATIONS));
    toast(title, { description: message });
  }, []);

  const pollNotifications = useCallback(async () => {
    try {
      const [ordersResponse, summaryResponse] = await Promise.all([
        adminApi.listOrders() as Promise<AdminOrderSnapshot[]>,
        adminApi.getDashboardSummary({ threshold: LOW_STOCK_THRESHOLD, limit: LOW_STOCK_LIMIT }) as Promise<DashboardSummaryResponse>,
      ]);

      const orders = Array.isArray(ordersResponse) ? ordersResponse : [];
      const lowStockRows = Array.isArray(summaryResponse?.low_stock_products) ? summaryResponse.low_stock_products : [];

      const orderTracker = orderTrackingRef.current;
      const previousIds = orderTracker.orderIds;
      const previousStatusById = orderTracker.orderStatusById;
      const nextIds = new Set<number>();
      const nextStatusById = new Map<number, string>();

      for (const order of orders) {
        const id = Number(order.id);
        if (!Number.isFinite(id)) continue;

        const status = normalizeStatus(order.status);
        nextIds.add(id);
        nextStatusById.set(id, status);

        if (!orderTracker.initialized) continue;

        if (!previousIds.has(id)) {
          const customer = order.customer_name?.trim() || "a customer";
          pushNotification("new_order", "New Order Received", `${toOrderLabel(order)} was placed by ${customer}.`);
          continue;
        }

        const previousStatus = previousStatusById.get(id);
        if (previousStatus && previousStatus !== "cancelled" && status === "cancelled") {
          pushNotification("order_cancelled", "Order Cancelled", `${toOrderLabel(order)} has been cancelled.`);
        }
      }

      const lowStockTracker = lowStockTrackingRef.current;
      const previousStockByKey = lowStockTracker.stockByKey;
      const currentStockByKey = new Map<string, number>();
      const currentRowsByKey = new Map<string, LowStockSnapshot>();

      for (const row of lowStockRows) {
        const key = lowStockKey(row);
        const qty = Math.max(0, Number(row.stock_left || 0));
        currentStockByKey.set(key, qty);
        currentRowsByKey.set(key, row);
      }

      if (lowStockTracker.initialized) {
        currentStockByKey.forEach((qty, key) => {
          const previousQty = previousStockByKey.get(key);
          const row = currentRowsByKey.get(key);
          const productName = row?.name?.trim() || row?.sku?.trim() || "Product";
          const storeName = row?.store_name?.trim() || "Unknown Store";

          if (qty === 0 && previousQty !== 0) {
            pushNotification("out_of_stock", "Product Out Of Stock", `${productName} is out of stock at ${storeName}.`);
            return;
          }

          if (qty > 0 && qty < LOW_STOCK_THRESHOLD && previousQty == null) {
            pushNotification("low_stock", "Low Stock Alert", `${productName} has only ${qty} units left at ${storeName}.`);
          }
        });
      }

      orderTracker.initialized = true;
      orderTracker.orderIds = nextIds;
      orderTracker.orderStatusById = nextStatusById;
      lowStockTracker.initialized = true;
      lowStockTracker.stockByKey = currentStockByKey;
      setNotificationsError("");
    } catch (error) {
      setNotificationsError(error instanceof Error ? error.message : "Failed to refresh notifications");
    } finally {
      setNotificationsLoading(false);
    }
  }, [pushNotification]);

  const unreadCount = useMemo(() => notifications.filter((item) => !item.read).length, [notifications]);

  const isActive = (to: string) => {
    if (to === "/admin") {
      return normalizedPath === "/admin" || normalizedPath === "";
    }
    return normalizedPath.startsWith(to);
  };

  useEffect(() => {
    void pollNotifications();
    const intervalId = window.setInterval(() => {
      void pollNotifications();
    }, NOTIFICATION_POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [pollNotifications]);

  const pollIntegrationStatus = useCallback(async () => {
    try {
      const settings = (await adminApi.getIntegrationSettings()) as IntegrationSettingsSnapshot;
      setIntegrationBadgeLabel(buildIntegrationBadgeLabel(settings));
    } catch {
      setIntegrationBadgeLabel("Integration Active");
    }
  }, []);

  useEffect(() => {
    void pollIntegrationStatus();
    const intervalId = window.setInterval(() => {
      void pollIntegrationStatus();
    }, INTEGRATION_STATUS_POLL_INTERVAL_MS);
    const onIntegrationStatusUpdated = () => {
      void pollIntegrationStatus();
    };
    window.addEventListener(INTEGRATION_STATUS_EVENT, onIntegrationStatusUpdated);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener(INTEGRATION_STATUS_EVENT, onIntegrationStatusUpdated);
    };
  }, [pollIntegrationStatus]);

  useEffect(() => {
    if (!isNotificationsOpen || unreadCount === 0) return;
    setNotifications((prev) => prev.map((item) => (item.read ? item : { ...item, read: true })));
  }, [isNotificationsOpen, unreadCount]);

  const handleManualSync = useCallback(async () => {
    try {
      setIsManualSyncing(true);
      const result = (await adminApi.manualSync()) as ManualSyncResponse;
      const syncedProducts = Number(result?.synced_products || 0);
      const suffix = syncedProducts === 1 ? "" : "s";
      toast.success("Manual sync completed", {
        description: `${syncedProducts} product${suffix} synced successfully.`,
      });
      void pollNotifications();
    } catch (error) {
      toast.error("Manual sync failed", {
        description: error instanceof Error ? error.message : "Unable to run manual sync.",
      });
    } finally {
      setIsManualSyncing(false);
    }
  }, [pollNotifications]);

  const handleOrdersSearchChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(location.search);
      if (value.trim().length > 0) {
        params.set("q", value);
      } else {
        params.delete("q");
      }
      const nextSearch = params.toString();
      navigate(
        {
          pathname: location.pathname,
          search: nextSearch ? `?${nextSearch}` : "",
        },
        { replace: true },
      );
    },
    [location.pathname, location.search, navigate],
  );

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
                  {integrationBadgeLabel}
                </Badge>
              </div>
              {isOrdersSection ? (
                <div className="hidden md:block">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="h-9 w-64 rounded-full pl-9"
                      placeholder="Search orders, SKUs, customers"
                      value={ordersSearchQuery}
                      onChange={(event) => handleOrdersSearchChange(event.target.value)}
                    />
                  </div>
                </div>
              ) : null}
              <div className="flex items-center gap-2">
                <span className="hidden text-xs text-muted-foreground lg:block">{formatDate()}</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden md:inline-flex"
                  onClick={handleManualSync}
                  disabled={isManualSyncing}
                >
                  {isManualSyncing ? "Syncing..." : "Manual Sync"}
                </Button>
                <Popover open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative" aria-label="Open notifications">
                      <Bell className="h-4 w-4" />
                      {unreadCount > 0 ? (
                        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-semibold text-black">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      ) : null}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-96 p-0">
                    <div className="border-b px-4 py-3">
                      <p className="text-sm font-semibold">Notifications</p>
                      <p className="text-xs text-muted-foreground">
                        {notificationsLoading
                          ? "Loading notifications..."
                          : unreadCount > 0
                            ? `${unreadCount} unread`
                            : "All caught up"}
                      </p>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="px-4 py-8 text-center text-sm text-muted-foreground">No notifications yet.</p>
                      ) : (
                        notifications.map((item) => (
                          <div
                            key={item.id}
                            className={cn(
                              "border-b px-4 py-3",
                              !item.read && "bg-amber-50/50",
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium">{item.title}</p>
                              <span className="shrink-0 text-[11px] text-muted-foreground">
                                {formatNotificationTime(item.createdAt)}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">{item.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                    {notificationsError ? (
                      <p className="border-t px-4 py-2 text-xs text-destructive">{notificationsError}</p>
                    ) : null}
                  </PopoverContent>
                </Popover>
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
