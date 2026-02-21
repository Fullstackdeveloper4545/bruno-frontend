import { useEffect, useState } from "react";
import { getJson, resolveApiFileUrl } from "@/lib/api";
import { products as fallbackProducts, type Product, type ProductVariant } from "@/data/products";

type ApiVariant = {
  id?: string | number;
  sku?: string | null;
  price?: number | string;
  compare_at_price?: number | string | null;
  currency?: string | null;
  is_active?: boolean;
  attribute_values?: Record<string, unknown> | string | null;
};

type ApiImage = {
  image_url?: string | null;
  alt_text?: string | null;
  position?: number | string | null;
};

type ApiProduct = {
  id?: string;
  sku?: string | null;
  name_pt?: string | null;
  name_es?: string | null;
  description_pt?: string | null;
  description_es?: string | null;
  specifications?: unknown;
  category_id?: string | null;
  category_slug?: string | null;
  base_price?: number | string | null;
  is_active?: boolean;
  is_promoted?: boolean;
  variants?: ApiVariant[];
  images?: ApiImage[];
};

const fallbackById = new Map(fallbackProducts.map((product) => [product.id, product]));
const fallbackImage = fallbackProducts[0]?.image ?? "";

const toNumber = (value: unknown, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const pickPrimaryVariant = (variants: ApiVariant[]) =>
  variants.find((variant) => variant && variant.is_active !== false) ?? variants[0];

const parseAttributeValues = (value: ApiVariant["attribute_values"]) => {
  if (!value) return {} as Record<string, string>;

  let source: Record<string, unknown> | null = null;
  if (typeof value === "string") {
    try {
      source = JSON.parse(value) as Record<string, unknown>;
    } catch {
      source = null;
    }
  } else if (typeof value === "object") {
    source = value as Record<string, unknown>;
  }

  if (!source) return {} as Record<string, string>;

  return Object.entries(source).reduce<Record<string, string>>((acc, [key, raw]) => {
    const normalizedKey = key.trim();
    if (!normalizedKey || raw == null) return acc;
    acc[normalizedKey] = String(raw);
    return acc;
  }, {});
};

const parseSpecifications = (value: ApiProduct["specifications"]): NonNullable<Product["specifications"]> => {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const specification = item as {
        key?: unknown;
        value?: { pt?: unknown; es?: unknown } | unknown;
      };
      const key = typeof specification.key === "string" ? specification.key.trim() : "";
      if (!key) return null;

      const rawValue = specification.value;
      if (rawValue && typeof rawValue === "object" && !Array.isArray(rawValue)) {
        const localized = rawValue as { pt?: unknown; es?: unknown };
        const pt = typeof localized.pt === "string" ? localized.pt : "";
        const es = typeof localized.es === "string" ? localized.es : "";
        const resolvedPt = pt || es;
        const resolvedEs = es || pt;
        if (!resolvedPt && !resolvedEs) return null;
        return { key, value: { pt: resolvedPt, es: resolvedEs } };
      }

      if (typeof rawValue === "string" && rawValue.trim()) {
        const resolved = rawValue.trim();
        return { key, value: { pt: resolved, es: resolved } };
      }

      return null;
    })
    .filter((item): item is NonNullable<Product["specifications"]>[number] => Boolean(item));
};

const mapApiProduct = (item: ApiProduct): Product | null => {
  if (!item.id) return null;
  const id = String(item.id);

  const fallback = fallbackById.get(id);
  const variants = Array.isArray(item.variants) ? item.variants : [];
  const primaryVariant = pickPrimaryVariant(variants);

  const price = toNumber(primaryVariant?.price ?? item.base_price ?? fallback?.price ?? 0, 0);
  const compareAt = toNumber(primaryVariant?.compare_at_price ?? fallback?.originalPrice ?? 0, 0);
  const originalPrice = compareAt > price ? compareAt : fallback?.originalPrice;
  const discountPercent =
    originalPrice && originalPrice > price
      ? Math.round((1 - price / originalPrice) * 100)
      : 0;

  const imageItems = Array.isArray(item.images)
    ? item.images
        .map((image, index) => ({
          url: resolveApiFileUrl(image?.image_url),
          alt_text: image?.alt_text || "",
          position: toNumber(image?.position, index),
        }))
        .filter((image) => Boolean(image.url))
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    : [];
  const images = imageItems.map((image) => image.url);
  const image = images[0] || fallback?.image || fallbackImage;

  const mappedVariants: ProductVariant[] = Array.isArray(item.variants)
    ? item.variants
        .filter((variant) => variant && typeof variant === "object")
        .map((variant, index) => ({
          id: String(variant.id ?? variant.sku ?? `${id}-variant-${index}`),
          sku: variant.sku || undefined,
          price: toNumber(variant.price, price),
          compare_at_price:
            variant.compare_at_price != null ? toNumber(variant.compare_at_price, 0) : undefined,
          currency: variant.currency || "EUR",
          is_active: variant.is_active !== false,
          attribute_values: parseAttributeValues(variant.attribute_values),
        }))
    : [];

  const namePt = item.name_pt || fallback?.name.pt || `Produto ${id.slice(0, 6)}`;
  const nameEs = item.name_es || fallback?.name.es || namePt;

  const descriptionPt = item.description_pt || fallback?.description.pt || "";
  const descriptionEs = item.description_es || fallback?.description.es || "";
  const specifications = parseSpecifications(item.specifications);

  return {
    id,
    name: { pt: namePt, es: nameEs },
    description: { pt: descriptionPt, es: descriptionEs },
    price,
    originalPrice: originalPrice && originalPrice > price ? originalPrice : undefined,
    category: item.category_slug || item.category_id || fallback?.category || "general",
    categoryId: item.category_id || undefined,
    image,
    images: images.length > 0 ? images : [image],
    rating: fallback?.rating ?? 4.6,
    reviews: fallback?.reviews ?? 0,
    inStock: item.is_active !== false,
    badge: discountPercent > 0 ? `-${discountPercent}%` : item.is_promoted ? "Promo" : fallback?.badge,
    imageItems: imageItems.length > 0 ? imageItems : undefined,
    variants: mappedVariants.length > 0 ? mappedVariants : undefined,
    specifications: specifications.length > 0 ? specifications : fallback?.specifications,
  };
};

export function useProducts() {
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const result = await getJson<ApiProduct[]>("/api/products");
        if (!active) return;
        const mapped = Array.isArray(result)
          ? result.map(mapApiProduct).filter((item): item is Product => Boolean(item))
          : [];
        setProducts(mapped);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load products");
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, []);

  return { products, error, loading };
}
