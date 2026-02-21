import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, ShoppingCart, User, Menu, X, Globe, ChevronDown } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { useUserAuth } from "@/contexts/UserAuthContext";
import { useCategories } from "@/hooks/useCategories";

export function Header() {
  const { language, setLanguage, t } = useLanguage();
  const { categories } = useCategories();
  const { totalItems } = useCart();
  const { isLoggedIn, email } = useUserAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const showSearch = location.pathname === "/" || location.pathname.startsWith("/products");

  useEffect(() => {
    if (!showSearch) {
      setSearchOpen(false);
    }
  }, [showSearch]);

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!showSearch) return;
    const query = searchValue.trim();
    if (query) {
      navigate(`/products?q=${encodeURIComponent(query)}`, { replace: false });
    } else {
      navigate("/products", { replace: false });
    }
    setSearchOpen(false);
  };

  const navLinks = [
    { label: t("nav.home"), to: "/" },
    { label: t("nav.shop"), to: "/products" },
    { label: t("nav.orders"), to: "/orders" },
    { label: t("nav.contact"), to: "/contact" },
  ];

  const categoryLabel = t("nav.categories");
  const accountButtonBase =
    "rounded-full border border-border/60 bg-card/80 shadow-sm transition hover:border-primary/40";

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-white/30 backdrop-blur-2xl shadow-[0_8px_30px_rgba(15,23,42,0.08)]">
      <div className="bg-primary text-primary-foreground text-xs py-1.5 text-center tracking-wide">
        {language === "pt"
          ? "Envio gratis para encomendas acima de EUR 50 | Portugal & Espanha"
          : "Envio gratis para pedidos superiores a EUR 50 | Portugal y Espana"}
      </div>

      <div className="container-page">
        <div className="flex items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden rounded-full border border-border/60 bg-card/80 p-2 text-foreground shadow-sm transition hover:border-primary/40"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <Link to="/" className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20 text-lg font-semibold text-accent">
                L
              </span>
              <div className="hidden sm:block">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Loja</p>
                <p className="text-base font-semibold text-foreground">Portugal & Espanha</p>
              </div>
            </Link>
          </div>

          <nav className="hidden lg:flex items-center gap-2 rounded-2xl border border-border/60 bg-card/60 px-4 py-2 shadow-sm backdrop-blur-xl">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className="rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}

            <div className="relative group">
              <Link
                to="/products"
                className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {categoryLabel}
                <ChevronDown className="h-4 w-4" />
              </Link>
              <div className="absolute left-1/2 top-full z-50 mt-3 w-64 -translate-x-1/2 rounded-2xl border border-border/60 bg-card/95 p-3 shadow-xl opacity-0 translate-y-2 pointer-events-none transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:translate-y-0 group-focus-within:pointer-events-auto">
                <div className="grid gap-2">
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/products?category=${cat.id}`}
                      className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
                    >
                      <span>{cat.name[language]}</span>
                      <span className="text-xs text-muted-foreground">{cat.count}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </nav>

          <div className="flex items-center gap-2">
            {showSearch && (
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="rounded-full border border-border/60 bg-card/80 p-2 text-muted-foreground shadow-sm transition hover:border-primary/40 hover:text-foreground"
              >
                <Search className="h-5 w-5" />
              </button>
            )}

            <button
              onClick={() => setLanguage(language === "pt" ? "es" : "pt")}
              className="hidden sm:flex items-center gap-2 rounded-full border border-border/60 bg-card/80 px-3 py-2 text-xs font-semibold text-muted-foreground shadow-sm transition hover:border-primary/40 hover:text-foreground"
            >
              <Globe className="h-4 w-4" />
              {language.toUpperCase()}
            </button>

            <Link
              to="/account"
              className={
                isLoggedIn
                  ? `${accountButtonBase} flex items-center gap-2 px-3 py-2 text-xs font-semibold text-foreground`
                  : `${accountButtonBase} p-2 text-muted-foreground hover:text-foreground`
              }
              title={email ?? t("account")}
            >
              {isLoggedIn && email ? (
                <>
                  <User className="h-4 w-4" />
                  <span className="max-w-[140px] truncate">{email}</span>
                </>
              ) : (
                <User className="h-5 w-5" />
              )}
            </Link>

            <Link
              to="/cart"
              className="relative rounded-full border border-border/60 bg-card/80 p-2 text-muted-foreground shadow-sm transition hover:border-primary/40 hover:text-foreground"
            >
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>
        </div>

        {showSearch && searchOpen && (
          <div className="pb-4 animate-fade-in">
            <form className="relative" onSubmit={handleSearchSubmit}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={t("search.placeholder")}
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                className="w-full rounded-full bg-secondary px-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                autoFocus
              />
            </form>
          </div>
        )}
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-border bg-card/95">
          <nav className="container-page py-4 space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-semibold text-foreground"
              >
                {link.label}
              </Link>
            ))}

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">{categoryLabel}</p>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/products?category=${cat.id}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-lg border border-border/60 bg-background/80 px-3 py-2 text-xs font-medium text-foreground"
                  >
                    {cat.name[language]}
                  </Link>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                setLanguage(language === "pt" ? "es" : "pt");
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground"
            >
              <Globe className="h-4 w-4" />
              {language === "pt" ? "Espanol" : "Portugues"}
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
