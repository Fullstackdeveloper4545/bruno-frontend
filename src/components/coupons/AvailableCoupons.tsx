import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useAvailableCoupons } from "@/hooks/useAvailableCoupons";

type CouponTarget = {
  productId?: string | null;
  categoryId?: string | null;
};

type AvailableCouponsProps = {
  onSelectCode?: (code: string) => void;
  targets?: CouponTarget[];
};

const formatDiscount = (type: "percentage" | "fixed", value: number | string) => {
  const amount = Number(value) || 0;
  return type === "percentage" ? `${amount}% off` : `EUR ${amount.toFixed(2)} off`;
};

const formatRestriction = (restrictionType: "global" | "product" | "category") => {
  if (restrictionType === "global") return "All products";
  if (restrictionType === "product") return "Specific product";
  return "Specific category";
};

const normalizeId = (value: unknown) => (value == null ? "" : String(value).trim().toLowerCase());

export function AvailableCoupons({ onSelectCode, targets }: AvailableCouponsProps) {
  const { coupons, loading } = useAvailableCoupons();
  const normalizedTargets = useMemo(
    () =>
      (targets || []).map((target) => ({
        productId: normalizeId(target.productId),
        categoryId: normalizeId(target.categoryId),
      })),
    [targets],
  );

  const isApplicable = (coupon: (typeof coupons)[number]) => {
    if (coupon.restriction_type === "global") return true;
    if (normalizedTargets.length === 0) return false;

    const restrictionId = normalizeId(coupon.restriction_id);
    if (!restrictionId) return false;

    if (coupon.restriction_type === "product") {
      return normalizedTargets.some((target) => target.productId === restrictionId);
    }

    return normalizedTargets.some((target) => target.categoryId === restrictionId);
  };

  if (loading) {
    return <p className="mt-3 text-xs text-muted-foreground">Loading available coupons...</p>;
  }

  if (coupons.length === 0) {
    return <p className="mt-3 text-xs text-muted-foreground">No active coupons available right now.</p>;
  }

  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Available coupons</p>
      <div className="space-y-2">
        {coupons.map((coupon) => {
          const applicable = isApplicable(coupon);

          return (
            <div
              key={coupon.id}
              className={`rounded-md border px-3 py-2 transition-opacity ${
                applicable ? "border-border bg-background/70" : "border-border/70 bg-background/40 opacity-70"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{coupon.code}</p>
                  <p className="text-xs text-muted-foreground">
                    {coupon.type} - {formatDiscount(coupon.type, coupon.value)} - {formatRestriction(coupon.restriction_type)}
                  </p>
                  {!applicable ? <p className="mt-1 text-[11px] font-medium text-muted-foreground">Not eligible for selected product(s)</p> : null}
                </div>
                {onSelectCode ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSelectCode(coupon.code)}
                    disabled={!applicable}
                  >
                    {applicable ? "Use" : "Disabled"}
                  </Button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
