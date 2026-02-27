import { useEffect, useMemo, useState } from "react";
import { getJson } from "@/lib/api";

export type AvailableCoupon = {
  id: number;
  code: string;
  type: "percentage" | "fixed";
  value: number | string;
  expiration: string | null;
  usage_limit: number | null;
  usage_count: number;
  restriction_type: "global" | "product" | "category";
  restriction_id?: string | null;
  is_active: boolean;
};

const isActiveCoupon = (coupon: AvailableCoupon) => {
  if (!coupon.is_active) return false;
  if (coupon.expiration && new Date(coupon.expiration) < new Date()) return false;
  if (coupon.usage_limit != null && coupon.usage_count >= coupon.usage_limit) return false;
  return true;
};

export function useAvailableCoupons() {
  const [rows, setRows] = useState<AvailableCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const result = await getJson<AvailableCoupon[]>("/api/discounts/coupons");
        if (!active) return;
        setRows(Array.isArray(result) ? result : []);
      } catch (e) {
        if (!active) return;
        setError(e instanceof Error ? e.message : "Failed to load coupons");
        setRows([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, []);

  const coupons = useMemo(() => rows.filter(isActiveCoupon), [rows]);

  return { coupons, loading, error };
}
