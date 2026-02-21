import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Star, Minus, Plus, ShoppingCart } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { useUserAuth } from "@/contexts/UserAuthContext";
import { postJson } from "@/lib/api";
import { AvailableCoupons } from "@/components/coupons/AvailableCoupons";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { useProducts } from "@/hooks/useProducts";

const COLOR_ATTRIBUTE_KEYS = new Set(["color", "colour", "cor", "cores"]);
const SIZE_ATTRIBUTE_KEYS = new Set(["size", "tamanho", "tam", "talla"]);

const COLOR_SWATCH_MAP: Record<string, string> = {
  black: "#111827",
  preto: "#111827",
  branco: "#f3f4f6",
  white: "#f3f4f6",
  azul: "#2563eb",
  blue: "#2563eb",
  vermelho: "#dc2626",
  red: "#dc2626",
  verde: "#16a34a",
  green: "#16a34a",
  amarelo: "#eab308",
  yellow: "#eab308",
  roxo: "#9333ea",
  purple: "#9333ea",
  rosa: "#ec4899",
  pink: "#ec4899",
  cinza: "#6b7280",
  gray: "#6b7280",
  cinzento: "#6b7280",
  laranja: "#f97316",
  orange: "#f97316",
  castanho: "#92400e",
  brown: "#92400e",
};

const normalizeAttributeKey = (key: string) => key.trim().toLowerCase();
const isColorAttribute = (key: string) => COLOR_ATTRIBUTE_KEYS.has(normalizeAttributeKey(key));
const isSizeAttribute = (key: string) => SIZE_ATTRIBUTE_KEYS.has(normalizeAttributeKey(key));
const humanizeAttributeKey = (key: string) => key.replace(/[_-]+/g, " ");

const parseColorValue = (value: string) => {
  const raw = value.trim();
  if (!raw) return { label: "", hex: "" };

  const hexMatch = raw.match(/#([0-9a-f]{3}|[0-9a-f]{6})/i);
  const hex = hexMatch ? `#${hexMatch[1]}` : "";

  let label = raw;
  if (raw.includes(":")) {
    const [left] = raw.split(":");
    if (left.trim()) label = left.trim();
  } else if (raw.includes("|")) {
    const [left] = raw.split("|");
    if (left.trim()) label = left.trim();
  }

  label = label
    .replace(/#([0-9a-f]{3}|[0-9a-f]{6})/gi, "")
    .replace(/\(\s*\)/g, "")
    .trim();

  return { label: label || raw, hex };
};

const resolveColorSwatch = (value: string) => {
  const parsed = parseColorValue(value);
  if (parsed.hex) return parsed.hex;
  const normalized = parsed.label.trim().toLowerCase();
  if (/^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(normalized)) return normalized;
  return COLOR_SWATCH_MAP[normalized] || "#9ca3af";
};

type ApplyCouponResponse = {
  coupon_id: number;
  discount: number;
};

type PersistedBuyNowCoupon = {
  code: string;
  discount: number;
  expires_at: number;
};

const BUY_NOW_COUPON_TTL_MS = 5 * 60 * 1000;
const BUY_NOW_COUPON_STORAGE_PREFIX = "product:buy-now-coupon:v1:";
const normalizeEmailKey = (email: string | null) => (email ? email.trim().toLowerCase() : "guest");

const getBuyNowCouponStorageKey = (productId: string | undefined, email: string | null) =>
  productId ? `${BUY_NOW_COUPON_STORAGE_PREFIX}${normalizeEmailKey(email)}:${productId}` : null;

const readPersistedBuyNowCoupon = (storageKey: string) => {
  if (typeof window === "undefined") return null as PersistedBuyNowCoupon | null;
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<PersistedBuyNowCoupon>;
    if (!parsed || typeof parsed.code !== "string") return null;
    const discount = Number(parsed.discount);
    const expiresAt = Number(parsed.expires_at);
    if (!Number.isFinite(discount) || !Number.isFinite(expiresAt)) return null;
    return {
      code: parsed.code.toUpperCase(),
      discount: Math.max(0, discount),
      expires_at: expiresAt,
    };
  } catch {
    return null;
  }
};

const writePersistedBuyNowCoupon = (storageKey: string, coupon: PersistedBuyNowCoupon) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey, JSON.stringify(coupon));
};

const removePersistedBuyNowCoupon = (storageKey: string) => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(storageKey);
};

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const { addItem } = useCart();
  const { email } = useUserAuth();
  const { products, loading } = useProducts();
  const product = products.find((p) => p.id === id);

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string | undefined>();
  const [selectedColor, setSelectedColor] = useState<number>(0);
  const [selectedVariantAttributes, setSelectedVariantAttributes] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<"description" | "specifications">("description");
  const [added, setAdded] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [buyNowCoupon, setBuyNowCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponExpiresAt, setCouponExpiresAt] = useState<number | null>(null);
  const addedTimeoutRef = useRef<number | null>(null);
  const couponStorageKey = useMemo(() => getBuyNowCouponStorageKey(id, email), [email, id]);

  useEffect(() => {
    return () => {
      if (addedTimeoutRef.current !== null) {
        window.clearTimeout(addedTimeoutRef.current);
      }
    };
  }, []);

  const clearBuyNowCoupon = useCallback(
    (message?: string) => {
      setBuyNowCoupon(null);
      setCouponExpiresAt(null);
      if (couponStorageKey) {
        removePersistedBuyNowCoupon(couponStorageKey);
      }
      if (message) {
        setCouponSuccess(message);
      }
    },
    [couponStorageKey],
  );

  useEffect(() => {
    if (!couponStorageKey) return;
    const persisted = readPersistedBuyNowCoupon(couponStorageKey);
    if (!persisted) {
      setBuyNowCoupon(null);
      setCouponExpiresAt(null);
      setCouponInput("");
      return;
    }

    if (persisted.expires_at <= Date.now()) {
      removePersistedBuyNowCoupon(couponStorageKey);
      setBuyNowCoupon(null);
      setCouponExpiresAt(null);
      setCouponInput("");
      setCouponSuccess("Coupon session expired. You can apply it again.");
      return;
    }

    setBuyNowCoupon({ code: persisted.code, discount: persisted.discount });
    setCouponInput(persisted.code);
    setCouponExpiresAt(persisted.expires_at);
    setCouponError("");
  }, [couponStorageKey]);

  useEffect(() => {
    if (!buyNowCoupon || !couponExpiresAt) return;
    const remainingMs = couponExpiresAt - Date.now();
    if (remainingMs <= 0) {
      clearBuyNowCoupon("Coupon session expired. You can apply it again.");
      return;
    }

    const timeoutId = window.setTimeout(() => {
      clearBuyNowCoupon("Coupon session expired. You can apply it again.");
    }, remainingMs);
    return () => window.clearTimeout(timeoutId);
  }, [buyNowCoupon, clearBuyNowCoupon, couponExpiresAt]);

  const getVariantAttributeValue = (attributeValues: Record<string, string>, keyId: string) => {
    const found = Object.entries(attributeValues).find(([raw]) => normalizeAttributeKey(raw) === keyId);
    return found?.[1] ?? "";
  };

  const activeVariants = useMemo(
    () => (product?.variants || []).filter((variant) => variant.is_active !== false),
    [product?.variants],
  );

  const variantAttributeMeta = useMemo(() => {
    const map = new Map<string, string>();
    activeVariants.forEach((variant) => {
      Object.keys(variant.attribute_values || {}).forEach((key) => {
        const normalized = normalizeAttributeKey(key);
        if (normalized && !map.has(normalized)) map.set(normalized, key);
      });
    });
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [activeVariants]);

  const variantValuesByAttribute = useMemo(() => {
    const result: Record<string, string[]> = {};

    variantAttributeMeta.forEach((attribute) => {
      const compatible = activeVariants.filter((variant) =>
        variantAttributeMeta.every((other) => {
          if (other.id === attribute.id) return true;
          const selected = selectedVariantAttributes[other.id];
          if (!selected) return true;
          return getVariantAttributeValue(variant.attribute_values, other.id) === selected;
        }),
      );

      const values = new Set<string>();
      (compatible.length > 0 ? compatible : activeVariants).forEach((variant) => {
        const value = getVariantAttributeValue(variant.attribute_values, attribute.id);
        if (value) values.add(value);
      });

      result[attribute.id] = Array.from(values);
    });

    return result;
  }, [activeVariants, selectedVariantAttributes, variantAttributeMeta]);

  useEffect(() => {
    if (!product || variantAttributeMeta.length === 0) {
      setSelectedVariantAttributes({});
      return;
    }

    const seedVariant = activeVariants[0];
    if (!seedVariant) return;

    const initialValues = variantAttributeMeta.reduce<Record<string, string>>((acc, attribute) => {
      acc[attribute.id] = getVariantAttributeValue(seedVariant.attribute_values, attribute.id);
      return acc;
    }, {});
    setSelectedVariantAttributes(initialValues);
  }, [id, product, activeVariants, variantAttributeMeta]);

  useEffect(() => {
    if (variantAttributeMeta.length === 0) return;

    setSelectedVariantAttributes((previous) => {
      let changed = false;
      const next = { ...previous };

      variantAttributeMeta.forEach((attribute) => {
        const options = variantValuesByAttribute[attribute.id] || [];
        if (options.length === 0) return;
        if (!next[attribute.id] || !options.includes(next[attribute.id])) {
          next[attribute.id] = options[0];
          changed = true;
        }
      });

      return changed ? next : previous;
    });
  }, [variantAttributeMeta, variantValuesByAttribute]);

  const selectedVariant = useMemo(() => {
    if (activeVariants.length === 0) return null;

    const matched = activeVariants.find((variant) =>
      variantAttributeMeta.every((attribute) => {
        const selected = selectedVariantAttributes[attribute.id];
        if (!selected) return true;
        return getVariantAttributeValue(variant.attribute_values, attribute.id) === selected;
      }),
    );

    return matched || activeVariants[0];
  }, [activeVariants, selectedVariantAttributes, variantAttributeMeta]);

  const displaySpecifications = useMemo(() => {
    const baseSpecifications = Array.isArray(product?.specifications) ? product.specifications : [];
    if (!selectedVariant) return baseSpecifications;

    const variantEntries = Object.entries(selectedVariant.attribute_values || {}).filter(
      ([key, value]) => key && value != null && String(value).trim() !== "",
    );

    if (variantEntries.length === 0) return baseSpecifications;

    const variantByKey = new Map(
      variantEntries.map(([key, value]) => [normalizeAttributeKey(key), String(value).trim()]),
    );

    const merged = baseSpecifications.map((specification) => {
      const normalizedKey = normalizeAttributeKey(specification.key);
      const variantValue = variantByKey.get(normalizedKey);
      if (!variantValue) return specification;
      variantByKey.delete(normalizedKey);
      return {
        ...specification,
        value: { pt: variantValue, es: variantValue },
      };
    });

    variantByKey.forEach((value, key) => {
      merged.push({
        key: humanizeAttributeKey(key),
        value: { pt: value, es: value },
      });
    });

    return merged;
  }, [product?.specifications, selectedVariant]);

  const imageSet = useMemo(() => {
    if (!product) return [] as Array<{ url: string; alt_text?: string; position?: number }>;

    const baseImageItems =
      product.imageItems && product.imageItems.length > 0
        ? product.imageItems
        : product.images.map((url, index) => ({ url, alt_text: "", position: index }));

    if (!selectedVariant) return baseImageItems;

    const tokens = Object.values(selectedVariant.attribute_values)
      .map((value) => String(value).trim().toLowerCase())
      .filter((value) => Boolean(value));
    if (tokens.length === 0) return baseImageItems;

    const prioritized = baseImageItems
      .map((image, index) => {
        const altText = (image.alt_text || "").toLowerCase();
        const score = altText && tokens.some((token) => altText.includes(token)) ? 1 : 0;
        return { ...image, __score: score, __index: index };
      })
      .sort((a, b) => {
        if (b.__score !== a.__score) return b.__score - a.__score;
        return a.__index - b.__index;
      })
      .map(({ __score: _score, __index: _index, ...image }) => image);

    return prioritized;
  }, [product, selectedVariant]);

  const displayImages = imageSet.map((image) => image.url).filter((url) => Boolean(url));
  const activeImage = displayImages[selectedImage] || displayImages[0] || product?.image || "";

  useEffect(() => {
    setSelectedImage(0);
  }, [id, selectedVariant?.id, displayImages.length]);

  const displayPrice = selectedVariant?.price ?? product?.price ?? 0;
  const displayOriginalPrice =
    selectedVariant?.compare_at_price && selectedVariant.compare_at_price > displayPrice
      ? selectedVariant.compare_at_price
      : selectedVariant
        ? undefined
        : product?.originalPrice;
  const inStock = selectedVariant ? selectedVariant.is_active !== false : Boolean(product?.inStock);

  const dynamicColorAttribute = variantAttributeMeta.find((attribute) => isColorAttribute(attribute.id));
  const dynamicSizeAttribute = variantAttributeMeta.find((attribute) => isSizeAttribute(attribute.id));

  const relatedProducts = useMemo(
    () => (product ? products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4) : []),
    [products, product],
  );

  const buildCartItem = () => {
    if (!product) return null;

    const dynamicColor = dynamicColorAttribute ? selectedVariantAttributes[dynamicColorAttribute.id] : undefined;
    const dynamicSize = dynamicSizeAttribute ? selectedVariantAttributes[dynamicSizeAttribute.id] : undefined;
    const cartItemId = selectedVariant ? `${product.id}:${selectedVariant.id}` : product.id;

    return {
      id: cartItemId,
      productId: product.id,
      variantId: selectedVariant?.id,
      categoryId: product.categoryId || product.category,
      name: product.name[language],
      price: displayPrice,
      originalPrice: displayOriginalPrice,
      image: activeImage,
      quantity,
      selectedSize: dynamicSize || selectedSize,
      selectedColor: dynamicColor ? parseColorValue(dynamicColor).label : product.colors?.[selectedColor]?.name,
    };
  };

  const handleAddToCart = () => {
    const nextItem = buildCartItem();
    if (!nextItem) return;
    addItem(nextItem);

    setAdded(true);
    if (addedTimeoutRef.current !== null) {
      window.clearTimeout(addedTimeoutRef.current);
    }
    addedTimeoutRef.current = window.setTimeout(() => {
      setAdded(false);
      addedTimeoutRef.current = null;
    }, 2000);
  };

  const handleBuyNow = () => {
    const nextItem = buildCartItem();
    if (!nextItem) return;
    const activeCoupon =
      buyNowCoupon && couponExpiresAt && couponExpiresAt > Date.now()
        ? buyNowCoupon
        : null;
    if (!activeCoupon && buyNowCoupon) {
      clearBuyNowCoupon("Coupon session expired. You can apply it again.");
    }
    navigate("/checkout", { state: { buyNowItem: nextItem, buyNowCoupon: activeCoupon } });
  };

  const handleApplyCoupon = async () => {
    const normalizedCode = couponInput.trim().toUpperCase();
    if (!normalizedCode) {
      setCouponError("Please enter a coupon code.");
      setCouponSuccess("");
      return;
    }

    const item = buildCartItem();
    if (!item) {
      setCouponError("Product is not ready for coupon check.");
      setCouponSuccess("");
      return;
    }

    try {
      setIsApplyingCoupon(true);
      setCouponError("");
      setCouponSuccess("");

      const result = await postJson<ApplyCouponResponse>("/api/discounts/apply", {
        code: normalizedCode,
        items: [
          {
            product_id: item.productId ?? item.id,
            category_id: item.categoryId ?? null,
            quantity: item.quantity,
            unit_price: item.price,
            line_total: item.quantity * item.price,
          },
        ],
      });

      const discount = Number(result.discount) || 0;
      const expiresAt = Date.now() + BUY_NOW_COUPON_TTL_MS;
      const nextCoupon = { code: normalizedCode, discount };
      setBuyNowCoupon(nextCoupon);
      setCouponInput(normalizedCode);
      setCouponExpiresAt(expiresAt);
      setCouponSuccess("Coupon applied for this Buy Now checkout.");
      if (couponStorageKey) {
        writePersistedBuyNowCoupon(couponStorageKey, {
          code: normalizedCode,
          discount,
          expires_at: expiresAt,
        });
      }
    } catch (error) {
      setCouponError(error instanceof Error ? error.message : "Failed to apply coupon.");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  if (!product && loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container-page py-20 text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container-page py-20 text-center">
          <p className="text-muted-foreground">Product not found</p>
          <Link to="/products" className="text-primary hover:underline mt-4 inline-block">
            {t("nav.shop")}
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container-page py-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground transition-colors">
            {t("nav.home")}
          </Link>
          <span>/</span>
          <Link to="/products" className="hover:text-foreground transition-colors">
            {t("nav.shop")}
          </Link>
          <span>/</span>
          <span className="text-foreground">{product.name[language]}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <div>
            <div className="aspect-square rounded-lg overflow-hidden bg-secondary mb-3">
              <img src={activeImage} alt={product.name[language]} className="w-full h-full object-cover" />
            </div>
            {displayImages.length > 1 && (
              <>
                <div className="flex gap-2">
                  {displayImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`w-16 h-16 rounded-md overflow-hidden border-2 transition-colors ${
                        i === selectedImage ? "border-primary" : "border-border"
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-center gap-2">
                  {displayImages.map((_img, i) => (
                    <button
                      key={`dot-${i}`}
                      onClick={() => setSelectedImage(i)}
                      className={`h-2.5 w-2.5 rounded-full transition-colors ${
                        i === selectedImage ? "bg-primary" : "bg-border"
                      }`}
                      aria-label={`View image ${i + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{product.name[language]}</h1>

            <div className="flex items-center gap-2 mb-4">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < Math.floor(product.rating) ? "fill-accent text-accent" : "text-border"}`} />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">{product.rating} ({product.reviews} {t("product.reviews")})</span>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl font-bold text-foreground">EUR {displayPrice.toFixed(2)}</span>
              {displayOriginalPrice && (
                <>
                  <span className="text-lg text-muted-foreground line-through">EUR {displayOriginalPrice.toFixed(2)}</span>
                  <span className="bg-accent/10 text-accent text-sm font-semibold px-2 py-0.5 rounded">
                    -{Math.round((1 - displayPrice / displayOriginalPrice) * 100)}%
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 mb-6">
              {inStock ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-success" />
                  <span className="text-sm text-success font-medium">{t("product.inStock")}</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 rounded-full bg-destructive" />
                  <span className="text-sm text-destructive font-medium">{t("product.outOfStock")}</span>
                </>
              )}
            </div>

            <div className="mb-6 rounded-xl border border-border/70 bg-card p-4 shadow-sm">
              <p className="mb-2 text-sm font-semibold text-foreground">Have a coupon?</p>
              <p className="mb-3 text-xs text-muted-foreground">Apply for direct Buy Now checkout from this product.</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="Enter coupon code"
                  className="h-10 flex-1 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  disabled={isApplyingCoupon}
                />
                <button
                  type="button"
                  onClick={() => void handleApplyCoupon()}
                  disabled={isApplyingCoupon}
                  className="h-10 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {isApplyingCoupon ? "Applying..." : "Apply Coupon"}
                </button>
              </div>
              {buyNowCoupon ? (
                <div className="mt-3 flex items-center justify-between rounded-md border border-border bg-secondary/30 px-3 py-2">
                  <p className="text-xs text-foreground">
                    Applied: <span className="font-semibold">{buyNowCoupon.code}</span>
                    {buyNowCoupon.discount > 0 ? ` (Saved EUR ${buyNowCoupon.discount.toFixed(2)})` : ""}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      clearBuyNowCoupon("Coupon removed.");
                      setCouponInput("");
                    }}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ) : null}
              {couponError ? <p className="mt-2 text-xs text-destructive">{couponError}</p> : null}
              {couponSuccess ? <p className="mt-2 text-xs text-success">{couponSuccess}</p> : null}
              <AvailableCoupons
                onSelectCode={(code) => setCouponInput(code)}
                targets={[{ productId: product.id, categoryId: product.categoryId || product.category }]}
              />
            </div>

            {variantAttributeMeta.length > 0 ? (
              <div className="mb-6 space-y-4">
                {variantAttributeMeta.map((attribute) => {
                  const values = variantValuesByAttribute[attribute.id] || [];
                  const selectedValue = selectedVariantAttributes[attribute.id] || "";
                  if (values.length === 0) return null;

                  if (isColorAttribute(attribute.id)) {
                    return (
                      <div key={attribute.id}>
                        <p className="text-sm font-medium text-foreground mb-2">
                          {humanizeAttributeKey(attribute.label)}: {parseColorValue(selectedValue).label}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {values.map((value) => (
                            <button
                              key={value}
                              onClick={() => setSelectedVariantAttributes((previous) => ({ ...previous, [attribute.id]: value }))}
                              className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-all ${
                                selectedValue === value ? "border-primary bg-primary text-primary-foreground" : "border-border text-foreground hover:border-primary"
                              }`}
                            >
                              <span className="h-4 w-4 rounded-full border border-black/10" style={{ backgroundColor: resolveColorSwatch(value) }} />
                              <span>{parseColorValue(value).label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={attribute.id}>
                      <p className="text-sm font-medium text-foreground mb-2">{humanizeAttributeKey(attribute.label)}</p>
                      <div className="flex flex-wrap gap-2">
                        {values.map((value) => (
                          <button
                            key={value}
                            onClick={() => setSelectedVariantAttributes((previous) => ({ ...previous, [attribute.id]: value }))}
                            className={`px-4 py-2 text-sm rounded-md border transition-all ${
                              selectedValue === value ? "bg-primary text-primary-foreground border-primary" : "border-border text-foreground hover:border-primary"
                            }`}
                          >
                            {value}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <>
                {product.colors && (
                  <div className="mb-6">
                    <p className="text-sm font-medium text-foreground mb-2">{language === "pt" ? "Cor" : "Color"}: {product.colors[selectedColor].name}</p>
                    <div className="flex gap-2">
                      {product.colors.map((color, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedColor(i)}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${i === selectedColor ? "border-primary scale-110" : "border-border"}`}
                          style={{ backgroundColor: color.hex }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {product.sizes && (
                  <div className="mb-6">
                    <p className="text-sm font-medium text-foreground mb-2">{language === "pt" ? "Tamanho" : "Talla"}</p>
                    <div className="flex flex-wrap gap-2">
                      {product.sizes.map((size) => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`px-4 py-2 text-sm rounded-md border transition-all ${selectedSize === size ? "bg-primary text-primary-foreground border-primary" : "border-border text-foreground hover:border-primary"}`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-[auto,minmax(0,1.35fr),minmax(170px,0.9fr)] sm:items-stretch">
              <div className="flex h-12 items-center border border-border rounded-lg">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-3 text-muted-foreground hover:text-foreground transition-colors">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-4 py-3 text-sm font-medium min-w-[3rem] text-center">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="px-3 py-3 text-muted-foreground hover:text-foreground transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={!inStock}
                className="inline-flex h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {added ? (
                  <span key="added" className="inline-flex items-center gap-2">
                    <span className="text-xs font-bold">OK</span>
                    <span>{language === "pt" ? "Adicionado!" : "Anadido!"}</span>
                  </span>
                ) : (
                  <span key="default" className="inline-flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4" />
                    <span>{t("product.addToCart")}</span>
                  </span>
                )}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={!inStock}
                className="h-12 w-full whitespace-nowrap rounded-lg border border-primary px-6 text-sm font-semibold text-primary transition-all hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Buy Now
              </button>
            </div>

            <div className="border-t border-border pt-6">
              <div className="flex gap-6 mb-4">
                <button
                  onClick={() => setActiveTab("description")}
                  className={`text-sm font-medium pb-2 border-b-2 transition-colors ${activeTab === "description" ? "border-primary text-foreground" : "border-transparent text-muted-foreground"}`}
                >
                  {language === "pt" ? "Sobre este item" : "About this item"}
                </button>
                {displaySpecifications.length > 0 && (
                  <button
                    onClick={() => setActiveTab("specifications")}
                    className={`text-sm font-medium pb-2 border-b-2 transition-colors ${activeTab === "specifications" ? "border-primary text-foreground" : "border-transparent text-muted-foreground"}`}
                  >
                    {t("product.specifications")}
                  </button>
                )}
              </div>
              {activeTab === "description" && <p className="text-sm text-muted-foreground leading-relaxed">{product.description[language]}</p>}
              {activeTab === "specifications" && displaySpecifications.length > 0 && (
                <div className="space-y-2">
                  {displaySpecifications.map((spec) => (
                    <div key={spec.key} className="flex justify-between text-sm py-2 border-b border-border/50">
                      <span className="text-muted-foreground">{spec.key}</span>
                      <span className="text-foreground font-medium">{spec.value[language]}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <section className="mt-16 pb-8">
            <h2 className="text-xl font-bold text-foreground mb-6">{t("product.related")}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default ProductDetail;
