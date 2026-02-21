import { useRef, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Truck, RotateCcw, Headphones, ArrowRight, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { useCategories } from "@/hooks/useCategories";
import { useProducts } from "@/hooks/useProducts";
import heroBanner from "@/assets/hero-banner.jpg";
import promoBanner from "@/assets/promo-banner.jpg";

const Index = () => {
  const { language, t } = useLanguage();
  const { categories } = useCategories();
  const { products } = useProducts();
  const featuredProducts = products.slice(0, 4);

  const trustItems = [
    { icon: ShieldCheck, label: t("trust.payment"), desc: language === "pt" ? "SSL & 3D Secure" : "SSL & 3D Secure" },
    { icon: Truck, label: t("trust.delivery"), desc: language === "pt" ? "2-5 dias uteis" : "2-5 dias habiles" },
    { icon: RotateCcw, label: t("trust.returns"), desc: language === "pt" ? "30 dias" : "30 dias" },
    { icon: Headphones, label: t("trust.support"), desc: language === "pt" ? "Sempre disponivel" : "Siempre disponible" },
  ];

  const heroHighlights = [
    {
      label: language === "pt" ? "Categorias" : "Categorias",
      value: `${categories.length}`,
    },
    {
      label: language === "pt" ? "Produtos em destaque" : "Productos destacados",
      value: `${featuredProducts.length}`,
    },
    {
      label: language === "pt" ? "Avaliacoes 5*" : "Resenas 5*",
      value: "4.8/5",
    },
  ];

  const categoryCta = language === "pt" ? "Explorar" : "Explorar";
  const categoryCountLabel = language === "pt" ? "produtos" : "productos";
  const categoryTrendLabel = language === "pt" ? "Em alta" : "Tendencia";
  const categoryFeaturedLabel = language === "pt" ? "Selecao premium" : "Seleccion premium";
  const categoryGradientPresets = [
    "from-amber-300/45 via-orange-500/25 to-transparent",
    "from-emerald-300/45 via-cyan-500/25 to-transparent",
    "from-rose-300/45 via-fuchsia-500/25 to-transparent",
    "from-sky-300/45 via-indigo-500/25 to-transparent",
  ];
  const highlightCardRef = useRef<HTMLDivElement | null>(null);

  const highlightCardStyle = {
    transform: "perspective(900px) rotateX(var(--tilt-x)) rotateY(var(--tilt-y))",
    transformStyle: "preserve-3d",
    willChange: "transform",
    ["--tilt-x" as string]: "0deg",
    ["--tilt-y" as string]: "0deg",
  } as CSSProperties;

  const handleHighlightMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const card = highlightCardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    const rotateX = (-y * 10).toFixed(2);
    const rotateY = (x * 10).toFixed(2);
    card.style.setProperty("--tilt-x", `${rotateX}deg`);
    card.style.setProperty("--tilt-y", `${rotateY}deg`);
  };

  const handleHighlightLeave = () => {
    const card = highlightCardRef.current;
    if (!card) return;
    card.style.setProperty("--tilt-x", "0deg");
    card.style.setProperty("--tilt-y", "0deg");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-primary text-primary-foreground">
        <div className="absolute inset-0">
          <img src={heroBanner} alt="Hero" className="h-full w-full object-cover opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/70 to-primary/20" />
          <div className="absolute -left-32 top-12 h-72 w-72 rounded-full bg-accent/30 blur-3xl" />
          <div className="absolute -bottom-24 right-0 h-80 w-80 rounded-full bg-amber-400/20 blur-3xl" />
        </div>
        <div className="relative container-page py-20 md:py-32">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-primary-foreground/90">
                <Sparkles className="h-3.5 w-3.5" />
                {language === "pt" ? "Novo Collection Drop" : "Nuevo Collection Drop"}
              </div>
              <h1 className="font-display text-3xl font-semibold leading-tight text-primary-foreground sm:text-4xl md:text-6xl">
                {t("hero.title")}
              </h1>
              <p className="text-base text-primary-foreground/80 sm:text-lg">
                {t("hero.subtitle")}
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 rounded-full bg-accent px-8 py-3.5 text-sm font-semibold text-accent-foreground shadow-lg transition-all hover:-translate-y-0.5 hover:brightness-110"
                >
                  {t("hero.cta")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-white/10"
                >
                  {language === "pt" ? "Ver colecoes" : "Ver colecciones"}
                </Link>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div
                ref={highlightCardRef}
                onMouseMove={handleHighlightMove}
                onMouseLeave={handleHighlightLeave}
                className="rounded-3xl border border-white/15 bg-white/10 p-6 shadow-2xl backdrop-blur transition-transform duration-200 ease-out"
                style={highlightCardStyle}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.25em] text-primary-foreground/70">
                    {language === "pt" ? "Destaques da semana" : "Destacados de la semana"}
                  </p>
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                    {language === "pt" ? "Novidades" : "Novedades"}
                  </span>
                </div>
                <div className="mt-6 grid gap-4">
                  {heroHighlights.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3"
                    >
                      <span className="text-sm text-primary-foreground/70">{item.label}</span>
                      <span className="text-lg font-semibold text-primary-foreground">{item.value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 rounded-2xl bg-white/10 p-4">
                  <p className="text-sm font-semibold text-primary-foreground">
                    {language === "pt" ? "Entrega expresso em 48h" : "Entrega express en 48h"}
                  </p>
                  <p className="text-xs text-primary-foreground/70">
                    {language === "pt" ? "Portugal & Espanha" : "Portugal y Espana"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="border-b border-border bg-card/80">
        <div className="container-page py-10">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {trustItems.map((item) => (
              <div
                key={item.label}
                className="group flex items-center gap-3 rounded-2xl border border-border/60 bg-background/80 p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container-page py-16">
        <div className="flex items-center justify-between gap-4 pb-8">
          <div>
            <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">{t("featured.categories")}</h2>
            <p className="text-sm text-muted-foreground">
              {language === "pt" ? "Colecoes pensadas para cada estilo" : "Colecciones pensadas para cada estilo"}
            </p>
          </div>
          <Link to="/products" className="text-sm font-semibold text-primary hover:underline">
            {t("view.all")} â†’
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {categories.map((cat, index) => {
            const accentGradient = categoryGradientPresets[index % categoryGradientPresets.length];

            return (
              <Link
                key={cat.id}
                to="/products"
                className="group relative isolate min-h-[220px] overflow-hidden rounded-[1.4rem] bg-slate-900 opacity-0 shadow-[0_14px_30px_rgba(15,23,42,0.2)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_28px_50px_rgba(15,23,42,0.35)] motion-safe:animate-fade-in"
                style={{ animationDelay: `${index * 90}ms` }}
              >
                <img
                  src={cat.image}
                  alt={cat.name[language]}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110 group-hover:saturate-125"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950/10 via-slate-950/22 to-slate-950/72" />
                <div className={`absolute inset-0 bg-gradient-to-br ${accentGradient} opacity-38 transition-opacity duration-500 group-hover:opacity-58`} />
                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-lg  bg-white/25 blur-2xl transition-opacity duration-500 group-hover:opacity-90" />
                <div className="absolute left-4 top-4 flex items-center gap-2">
                  <span className="rounded-full border border-white/35 bg-black/25 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-sm">
                    {categoryTrendLabel}
                  </span>
                  <span className="rounded-full border border-white/25 bg-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-sm">
                    {categoryFeaturedLabel}
                  </span>
                </div>
                <div className="absolute inset-x-4 bottom-4 rounded-xl border border-white/25 bg-gradient-to-r from-slate-900/72 via-slate-900/56 to-slate-900/72 p-3.5 backdrop-blur-md">
                  <h3 className="font-display text-xl font-semibold tracking-wide text-white drop-shadow-[0_2px_8px_rgba(15,23,42,0.55)]">
                    {cat.name[language]}
                  </h3>
                  <div className="mt-2.5 flex items-center justify-between border-t border-white/15 pt-2.5">
                    <p className="text-xs text-white/85">
                      {cat.count} {categoryCountLabel}
                    </p>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-900 transition-all group-hover:bg-accent group-hover:px-3.5 group-hover:text-accent-foreground">
                      {categoryCta}
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured products */}
      <section className="bg-secondary/50">
        <div className="container-page py-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">{t("featured.products")}</h2>
            <Link to="/products" className="text-sm font-semibold text-primary hover:underline">
              {t("view.all")} â†’
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Promo banner */}
      <section className="container-page py-16">
        <div className="relative overflow-hidden rounded-3xl bg-primary">
          <img src={promoBanner} alt="Promo" className="absolute inset-0 h-full w-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/80 via-primary/60 to-transparent" />
          <div className="relative px-8 py-16 text-center md:py-20">
            <h2 className="font-display text-3xl font-semibold text-primary-foreground md:text-4xl">
              {t("promo.title")}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-primary-foreground/80">{t("promo.subtitle")}</p>
            <Link
              to="/products"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-accent px-8 py-3 text-sm font-semibold text-accent-foreground transition-all hover:-translate-y-0.5 hover:brightness-110"
            >
              {t("promo.cta")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="bg-secondary">
        <div className="container-page py-16 text-center">
          <div className="mx-auto max-w-2xl rounded-3xl border border-border/60 bg-card/80 px-6 py-10 shadow-sm">
            <h2 className="text-2xl font-semibold text-foreground mb-2">{t("newsletter.title")}</h2>
            <p className="text-muted-foreground mb-6">{t("newsletter.subtitle")}</p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
              <input
                type="email"
                placeholder={t("newsletter.placeholder")}
                className="w-full sm:w-72 px-4 py-3 rounded-full bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
                {t("newsletter.button")}
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
