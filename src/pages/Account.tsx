import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { User, MapPin, Package, FileText, LogOut, Plus, Download } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUserAuth } from "@/contexts/UserAuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { toast } from "@/components/ui/sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { getJson, postJson } from "@/lib/api";

type Tab = "profile" | "addresses" | "orders" | "invoices";

type AccountLocationState = {
  mode?: "login" | "register";
  email?: string;
};

type CustomerOrder = {
  id: number;
  order_number: string;
  created_at: string;
  status: string;
  total: string | number;
  shipping_status?: string | null;
  shipping_tracking_code?: string | null;
  store_name?: string | null;
  store_address?: string | null;
  item_count?: number;
};

const statusLabelMap: Record<string, string> = {
  pending: "Pending",
  awaiting_payment: "Awaiting Payment",
  payment_failed: "Payment Failed",
  paid: "Paid",
  processing: "Packaging",
  shipped: "Shipped",
  completed: "Delivered",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const shippingStatusLabelMap: Record<string, string> = {
  not_created: "Not Created",
};

const toStatusLabel = (status: string) => statusLabelMap[status] || status;
const toShippingStatusLabel = (status: string) => shippingStatusLabelMap[status] || status;

const AccountPage = () => {
  const { language, t } = useLanguage();
  const { isLoggedIn, email: userEmail, login, logout } = useUserAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");
  const authMode = isRegistering ? "register" : isForgotPassword ? `forgot-${forgotStep}` : "login";

  useEffect(() => {
    const state = location.state as AccountLocationState | null;
    if (state?.mode === "login") {
      setIsRegistering(false);
      setIsForgotPassword(false);
      setForgotStep(1);
      if (state.email) {
        setLoginEmail((prev) => (prev ? prev : state.email ?? ""));
      }
    }
    if (state?.mode === "register") {
      setIsRegistering(true);
      setIsForgotPassword(false);
      setForgotStep(1);
    }
  }, [location.state]);

  useEffect(() => {
    let active = true;

    const loadOrders = async () => {
      if (!isLoggedIn || !userEmail) {
        setCustomerOrders([]);
        setOrdersLoading(false);
        setOrdersError("");
        return;
      }

      try {
        setOrdersLoading(true);
        setOrdersError("");
        const result = await getJson<CustomerOrder[]>(`/api/orders/my?email=${encodeURIComponent(userEmail)}`);
        if (!active) return;
        setCustomerOrders(Array.isArray(result) ? result : []);
      } catch (error) {
        if (!active) return;
        setCustomerOrders([]);
        setOrdersError(error instanceof Error ? error.message : "Failed to load orders");
      } finally {
        if (active) setOrdersLoading(false);
      }
    };

    void loadOrders();

    return () => {
      active = false;
    };
  }, [isLoggedIn, userEmail]);

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      toast.error(t("account.allFields"));
      return;
    }

    setIsSubmitting(true);
    try {
      await postJson("/api/auth/login", {
        email: loginEmail.trim(),
        password: loginPassword,
      });
      login(loginEmail.trim());
      toast.success(t("account.loginSuccess"));
      navigate("/");
    } catch (error) {
      const message = error instanceof Error ? error.message : t("account.loginFailed");
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async () => {
    if (!registerName || !registerEmail || !registerPassword) {
      toast.error(t("account.allFields"));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await postJson<{ message?: string; otp?: string }>("/api/auth/register", {
        name: registerName.trim(),
        email: registerEmail.trim(),
        password: registerPassword,
      });
      if (response.message) {
        toast.success(response.message);
      }
      navigate("/otp", { state: { email: registerEmail.trim() } });
    } catch (error) {
      const message = error instanceof Error ? error.message : t("account.registerFailed");
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPasswordRequest = async () => {
    if (!forgotEmail.trim()) {
      toast.error(t("account.allFields"));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await postJson<{ message?: string }>("/api/auth/forgot-password/request", {
        email: forgotEmail.trim(),
      });
      toast.success(response.message || t("account.sendResetOtp"));
      setForgotStep(2);
    } catch (error) {
      const message = error instanceof Error ? error.message : t("account.registerFailed");
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPasswordReset = async () => {
    if (!forgotEmail.trim() || !forgotOtp.trim() || !forgotNewPassword) {
      toast.error(t("account.allFields"));
      return;
    }

    if (!/^\d{6}$/.test(forgotOtp.trim())) {
      toast.error(t("account.otpHint"));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await postJson<{ message?: string }>("/api/auth/forgot-password/reset", {
        email: forgotEmail.trim(),
        otp: forgotOtp.trim(),
        new_password: forgotNewPassword,
      });
      toast.success(response.message || t("account.resetPassword"));
      setIsForgotPassword(false);
      setForgotStep(1);
      setLoginEmail(forgotEmail.trim());
      setLoginPassword("");
      setForgotOtp("");
      setForgotNewPassword("");
    } catch (error) {
      const message = error instanceof Error ? error.message : t("account.registerFailed");
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabs: { id: Tab; label: string; icon: typeof User }[] = [
    { id: "profile", label: t("account.profile"), icon: User },
    { id: "addresses", label: t("account.addresses"), icon: MapPin },
    { id: "orders", label: t("account.orders"), icon: Package },
    { id: "invoices", label: t("account.invoices"), icon: FileText },
  ];

  // Simple mock login for now (will be replaced with real auth)
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container-page py-16">
          <div className="max-w-md mx-auto">
            <h1 className="text-2xl font-bold text-foreground mb-6 text-center">
              {isRegistering ? t("account.register") : isForgotPassword ? t("account.forgotPassword") : t("account.login")}
            </h1>
            <div
              key={authMode}
              translate="no"
              className="notranslate bg-card rounded-lg border border-border p-6 space-y-4"
            >
              {isRegistering ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">{t("account.name")}</label>
                    <input
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      className="w-full px-3 py-2.5 bg-secondary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">{t("checkout.email")}</label>
                    <input
                      type="email"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      className="w-full px-3 py-2.5 bg-secondary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">{t("account.password")}</label>
                    <input
                      type="password"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      className="w-full px-3 py-2.5 bg-secondary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </>
              ) : isForgotPassword ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">{t("checkout.email")}</label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full px-3 py-2.5 bg-secondary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  {forgotStep === 2 ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">{t("account.otpCode")}</label>
                        <input
                          value={forgotOtp}
                          onChange={(e) => setForgotOtp(e.target.value)}
                          maxLength={6}
                          className="w-full px-3 py-2.5 bg-secondary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">{t("account.newPassword")}</label>
                        <input
                          type="password"
                          value={forgotNewPassword}
                          onChange={(e) => setForgotNewPassword(e.target.value)}
                          className="w-full px-3 py-2.5 bg-secondary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </>
                  ) : null}
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">{t("checkout.email")}</label>
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full px-3 py-2.5 bg-secondary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">{t("account.password")}</label>
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full px-3 py-2.5 bg-secondary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setForgotStep(1);
                        setForgotEmail(loginEmail);
                        setForgotOtp("");
                        setForgotNewPassword("");
                      }}
                      className="text-sm text-primary hover:underline"
                    >
                      {t("account.forgotPassword")}
                    </button>
                  </div>
                </>
              )}
              <button
                type="button"
                onClick={
                  isRegistering
                    ? handleRegister
                    : isForgotPassword
                      ? forgotStep === 1
                        ? handleForgotPasswordRequest
                        : handleForgotPasswordReset
                      : handleLogin
                }
                disabled={isSubmitting}
                className="w-full bg-primary text-primary-foreground py-3 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isRegistering
                  ? t("account.register")
                  : isForgotPassword
                    ? forgotStep === 1
                      ? t("account.sendResetOtp")
                      : t("account.resetPassword")
                    : t("account.login")}
              </button>
              <p className="text-center text-sm text-muted-foreground">
                {isRegistering ? (
                  <>
                    {language === "pt" ? "Já tem conta? " : "¿Ya tiene cuenta? "}
                    <button
                      onClick={() => {
                        setIsRegistering(false);
                        setIsForgotPassword(false);
                        setForgotStep(1);
                      }}
                      className="text-primary hover:underline"
                    >
                      {t("account.login")}
                    </button>
                  </>
                ) : isForgotPassword ? (
                  <button
                    onClick={() => {
                      setIsForgotPassword(false);
                      setForgotStep(1);
                      setForgotOtp("");
                      setForgotNewPassword("");
                    }}
                    className="text-primary hover:underline"
                  >
                    {t("account.backToLogin")}
                  </button>
                ) : (
                  <>
                    {language === "pt" ? "Não tem conta? " : "¿No tiene cuenta? "}
                    <button
                      onClick={() => {
                        setIsRegistering(true);
                        setIsForgotPassword(false);
                        setForgotStep(1);
                      }}
                      className="text-primary hover:underline"
                    >
                      {t("account.register")}
                    </button>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container-page py-8">
        <h1 className="text-2xl font-bold text-foreground mb-8">{t("account.title")}</h1>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <aside className="md:w-56 flex-shrink-0">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-destructive hover:bg-destructive/5 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    {t("account.logout")}
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("account.logoutConfirmTitle")}</AlertDialogTitle>
                    <AlertDialogDescription>{t("account.logoutConfirmDescription")}</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("account.logoutConfirmNo")}</AlertDialogCancel>
                    <AlertDialogAction onClick={() => logout()}>
                      {t("account.logoutConfirmYes")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </nav>
          </aside>

          {/* Content */}
          <div className="flex-1">
            {activeTab === "profile" && (
              <div className="bg-card rounded-lg border border-border p-6 animate-fade-in">
                <h2 className="text-lg font-semibold mb-6">{t("account.profile")}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">{t("checkout.firstName")}</label>
                    <input defaultValue="João" className="w-full px-3 py-2.5 bg-secondary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">{t("checkout.lastName")}</label>
                    <input defaultValue="Silva" className="w-full px-3 py-2.5 bg-secondary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">{t("checkout.email")}</label>
                    <input
                      defaultValue={userEmail ?? "joao@exemplo.pt"}
                      type="email"
                      className="w-full px-3 py-2.5 bg-secondary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">{t("checkout.phone")}</label>
                    <input defaultValue="+351 912 345 678" className="w-full px-3 py-2.5 bg-secondary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                </div>
                <button className="mt-6 bg-primary text-primary-foreground px-6 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
                  {t("account.save")}
                </button>
              </div>
            )}

            {activeTab === "addresses" && (
              <div className="animate-fade-in">
                <div className="bg-card rounded-lg border border-border p-6 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">{t("account.addresses")}</h2>
                    <button className="flex items-center gap-1 text-sm text-primary hover:underline">
                      <Plus className="w-4 h-4" /> {t("account.addAddress")}
                    </button>
                  </div>
                  {/* Mock address */}
                  <div className="border border-border rounded-lg p-4">
                    <p className="text-sm font-medium text-foreground">João Silva</p>
                    <p className="text-sm text-muted-foreground mt-1">Rua Augusta 123, 3º Esq.</p>
                    <p className="text-sm text-muted-foreground">1100-053 Lisboa, Portugal</p>
                    <p className="text-sm text-muted-foreground">+351 912 345 678</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "orders" && (
              <div className="animate-fade-in space-y-4">
                <h2 className="text-lg font-semibold">{t("account.orders")}</h2>
                {ordersError ? <p className="text-sm text-destructive">{ordersError}</p> : null}
                {ordersLoading ? (
                  <p className="text-sm text-muted-foreground">Loading orders...</p>
                ) : customerOrders.length === 0 ? (
                  <div className="bg-card rounded-lg border border-border p-4">
                    <p className="text-sm text-muted-foreground">No orders found.</p>
                  </div>
                ) : (
                  customerOrders.map((order) => (
                    <div key={order.id} className="bg-card rounded-lg border border-border p-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-foreground">{order.order_number}</p>
                        <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>{order.item_count || 0} item(s)</span>
                          <span>|</span>
                          <span>Store: {order.store_name || "-"}</span>
                          <span>|</span>
                          <span>Store Address: {order.store_address || "-"}</span>
                          <span>|</span>
                          <span>Shipping:</span>
                          <StatusBadge
                            status={order.shipping_status || "not_created"}
                            label={toShippingStatusLabel(order.shipping_status || "not_created")}
                          />
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-foreground">EUR {Number(order.total || 0).toFixed(2)}</p>
                        <StatusBadge status={order.status} label={toStatusLabel(order.status)} />
                        <div className="mt-2">
                          <Link to={`/orders/${order.id}`} className="text-xs text-primary hover:underline">
                            Track / Details
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "invoices" && (
              <div className="animate-fade-in space-y-4">
                <h2 className="text-lg font-semibold">{t("account.invoices")}</h2>
                {ordersLoading ? (
                  <p className="text-sm text-muted-foreground">Loading invoices...</p>
                ) : customerOrders.length === 0 ? (
                  <div className="bg-card rounded-lg border border-border p-4">
                    <p className="text-sm text-muted-foreground">No invoices available.</p>
                  </div>
                ) : (
                  customerOrders.map((order) => (
                    <div key={order.id} className="bg-card rounded-lg border border-border p-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-foreground">{order.order_number}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()} - EUR {Number(order.total || 0).toFixed(2)}
                        </p>
                      </div>
                      <Link to={`/orders/${order.id}`} className="flex items-center gap-1 text-sm text-primary hover:underline">
                        <Download className="w-4 h-4" />
                        View
                      </Link>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AccountPage;
