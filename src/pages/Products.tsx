import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, ChevronDown, X, Sparkles, Search } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { useCategories } from "@/hooks/useCategories";
import { useProducts } from "@/hooks/useProducts";

const ProductsPage = () => {
  const { language, t } = useLanguage();
  const { categories } = useCategories();
  const { products } = useProducts();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const categoryParam = searchParams.get("category");
  const queryParam = searchParams.get("q") ?? "";

  useEffect(() => {
    if (categoryParam && categories.some((cat) => cat.id === categoryParam)) {
      setSelectedCategory(categoryParam);
    } else {
      setSelectedCategory(null);
    }
  }, [categoryParam, categories]);

  useEffect(() => {
    setSearchQuery(queryParam);
  }, [queryParam]);

  const updateCategory = (category: string | null) => {
    setSelectedCategory(category);
    const next = new URLSearchParams(searchParams);
    if (category) {
      next.set("category", category);
    } else {
      next.delete("category");
    }
    setSearchParams(next, { replace: true });
  };

  const updateSearch = (value: string) => {
    setSearchQuery(value);
    const next = new URLSearchParams(searchParams);
    const trimmed = value.trim();
    if (trimmed) {
      next.set("q", trimmed);
    } else {
      next.delete("q");
    }
    setSearchParams(next, { replace: true });
  };

  const filteredProducts = useMemo(() => {
    let result = [...products];
    if (selectedCategory) result = result.filter((p) => p.category === selectedCategory);
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      const matchedCategoryIds = categories
        .filter((cat) => {
          const id = cat.id.toLowerCase();
          const namePt = cat.name.pt?.toLowerCase() ?? "";
          const nameEs = cat.name.es?.toLowerCase() ?? "";
          return id.includes(query) || namePt.includes(query) || nameEs.includes(query);
        })
        .map((cat) => cat.id);
      result = result.filter((p) => {
        const name = p.name[language]?.toLowerCase() ?? "";
        const desc = p.description[language]?.toLowerCase() ?? "";
        const matchesCategory = matchedCategoryIds.includes(p.category);
        return name.includes(query) || desc.includes(query) || matchesCategory;
      });
    }
    if (inStockOnly) result = result.filter((p) => p.inStock);
    result = result.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);

    switch (sortBy) {
      case "priceLow":
        result.sort((a, b) => a.price - b.price);
        break;
      case "priceHigh":
        result.sort((a, b) => b.price - a.price);
        break;
      case "popular":
        result.sort((a, b) => b.reviews - a.reviews);
        break;
      default:
        break;
    }
    return result;
  }, [products, selectedCategory, sortBy, priceRange, inStockOnly, searchQuery, language, categories]);

  const sortOptions = [
    { value: "newest", label: t("filter.sort.newest") },
    { value: "priceLow", label: t("filter.sort.priceLow") },
    { value: "priceHigh", label: t("filter.sort.priceHigh") },
    { value: "popular", label: t("filter.sort.popular") },
  ];

  const totalProducts = filteredProducts.length;
  const activeCategoryLabel = selectedCategory
    ? categories.find((cat) => cat.id === selectedCategory)?.name[language] ??
      (language === "pt" ? "Todas" : "Todas")
    : language === "pt"
      ? "Todas"
      : "Todas";

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container-page py-10">
        <div className="mb-8 rounded-3xl border border-border/60 bg-card/90 p-6 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                {language === "pt" ? "Loja curada" : "Tienda curada"}
              </div>
              <h1 className="font-display text-3xl font-semibold text-foreground sm:text-4xl">
                {t("nav.shop")}
              </h1>
              <p className="text-sm text-muted-foreground sm:text-base">
                {language === "pt"
                  ? "Explore colecoes com entrega rapida, qualidade premium e ofertas semanais."
                  : "Explora colecciones con entrega rapida, calidad premium y ofertas semanales."}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border/60 bg-background px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Produtos</p>
                <p className="text-lg font-semibold text-foreground">{totalProducts}</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Categoria</p>
                <p className="text-lg font-semibold text-foreground">{activeCategoryLabel}</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Entrega</p>
                <p className="text-lg font-semibold text-foreground">2-5 dias</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pb-6">
          <button
            onClick={() => updateCategory(null)}
            className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
              !selectedCategory
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border/60 bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            {language === "pt" ? "Todos" : "Todos"}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => updateCategory(cat.id)}
              className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                selectedCategory === cat.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border/60 bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat.name[language]}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pb-6">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">{t("nav.shop")}</h2>
            <p className="text-sm text-muted-foreground">
              {totalProducts} {language === "pt" ? "produtos" : "productos"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(event) => updateSearch(event.target.value)}
                placeholder={t("search.placeholder")}
                className="w-64 rounded-full bg-secondary px-10 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden flex items-center gap-2 text-sm font-medium text-foreground bg-secondary px-4 py-2 rounded-full"
            >
              <SlidersHorizontal className="w-4 h-4" />
              {t("filter.title")}
            </button>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-secondary text-sm px-4 py-2 pr-8 rounded-full text-foreground focus:outline-none cursor-pointer"
              >
                {sortOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          <aside
            className={`${
              showFilters ? "fixed inset-0 z-50 bg-background p-6 overflow-auto" : "hidden"
            } lg:block lg:static lg:w-64 flex-shrink-0`}
          >
            <div className="flex items-center justify-between lg:hidden mb-6">
              <h2 className="text-lg font-bold">{t("filter.title")}</h2>
              <button onClick={() => setShowFilters(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6 rounded-3xl border border-border/60 bg-card/90 p-5 shadow-sm">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">{t("filter.category")}</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => updateCategory(null)}
                    className={`block text-sm w-full text-left px-3 py-1.5 rounded transition-colors ${
                      !selectedCategory
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {language === "pt" ? "Todas" : "Todas"}
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => updateCategory(cat.id)}
                      className={`block text-sm w-full text-left px-3 py-1.5 rounded transition-colors ${
                        selectedCategory === cat.id
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {cat.name[language]} ({cat.count})
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">{t("filter.price")}</h3>
                <input
                  type="range"
                  min={0}
                  max={200}
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([0, Number(e.target.value)])}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>EUR 0</span>
                  <span>EUR {priceRange[1]}</span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">{t("filter.availability")}</h3>
                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="accent-primary rounded"
                  />
                  {t("product.inStock")}
                </label>
              </div>
            </div>

            <button
              onClick={() => setShowFilters(false)}
              className="lg:hidden w-full bg-primary text-primary-foreground py-3 rounded-full text-sm font-semibold mt-4"
            >
              {language === "pt" ? "Aplicar Filtros" : "Aplicar Filtros"}
            </button>
          </aside>

          <div className="flex-1">
            <div className="mb-4 md:hidden">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={searchQuery}
                  onChange={(event) => updateSearch(event.target.value)}
                  placeholder={t("search.placeholder")}
                  className="w-full rounded-full bg-secondary px-10 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {filteredProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="opacity-0 motion-safe:animate-fade-in"
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
            {filteredProducts.length === 0 && (
              <div className="text-center py-20 text-muted-foreground">
                {language === "pt" ? "Nenhum produto encontrado." : "No se encontraron productos."}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ProductsPage;
