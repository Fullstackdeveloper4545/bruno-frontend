import { useEffect, useState } from "react";
import { getJson, resolveApiFileUrl } from "@/lib/api";
import { categories as fallbackCategories, type Category } from "@/data/products";

type ApiCategory = {
  id?: string;
  slug?: string;
  name_pt?: string;
  name_es?: string;
  image_url?: string;
  product_count?: number | string;
  is_active?: boolean;
};

const fallbackById = new Map(fallbackCategories.map((cat) => [cat.id, cat]));

const getFallbackImage = () => fallbackCategories[0]?.image ?? "";

const toCount = (value: ApiCategory["product_count"], fallback?: number) => {
  const asNumber = Number(value);
  if (Number.isFinite(asNumber)) return asNumber;
  return fallback ?? 0;
};

const mapApiCategories = (rows: unknown): Category[] => {
  if (!Array.isArray(rows)) return [];

  const mapped = rows
    .filter((row) => row && typeof row === "object")
    .map((row) => {
      const data = row as ApiCategory;
      if (data.is_active === false) return null;

      const id = data.slug || data.id;
      if (!id) return null;

      const fallback = fallbackById.get(id);
      return {
        id,
        name: {
          pt: data.name_pt || fallback?.name.pt || id,
          es: data.name_es || fallback?.name.es || id,
        },
        image: resolveApiFileUrl(data.image_url) || fallback?.image || getFallbackImage(),
        count: toCount(data.product_count, fallback?.count),
      };
    })
    .filter((item): item is Category => Boolean(item));

  return mapped;
};

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>(fallbackCategories);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const result = await getJson<ApiCategory[]>("/api/catalog/categories");
        if (!active) return;
        const mapped = mapApiCategories(result);
        setCategories(mapped);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load categories");
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, []);

  return { categories, error, loading };
}
