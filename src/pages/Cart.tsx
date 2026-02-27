import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, ArrowLeft, Tag } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { AvailableCoupons } from "@/components/coupons/AvailableCoupons";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const CartPage = () => {
  const { language, t } = useLanguage();
  const {
    items,
    removeItem,
    updateQuantity,
    totalPrice,
    applyCoupon,
    removeCoupon,
    couponCode,
    couponDiscount,
    subtotalAfterDiscount,
  } = useCart();

  const [couponInput, setCouponInput] = useState(couponCode ?? "");
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const couponTargets = useMemo(
    () =>
      items.map((item) => ({
        productId: item.productId || (item.id.includes(":") ? item.id.split(":")[0] : item.id),
        categoryId: item.categoryId || null,
      })),
    [items],
  );

  const shipping = totalPrice >= 50 ? 0 : 4.99;
  const grandTotal = subtotalAfterDiscount + shipping;

  useEffect(() => {
    setCouponInput(couponCode ?? "");
  }, [couponCode]);

  const handleApplyCoupon = async () => {
    try {
      setCouponError("");
      setCouponSuccess("");
      setIsApplyingCoupon(true);
      await applyCoupon(couponInput);
      setCouponSuccess("Coupon applied successfully.");
    } catch (error) {
      setCouponError(error instanceof Error ? error.message : "Failed to apply coupon.");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponSuccess("Coupon removed.");
    setCouponError("");
    setCouponInput("");
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container-page py-20 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <Tag className="w-7 h-7 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">{t("cart.empty")}</h1>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 mt-6 bg-primary text-primary-foreground px-6 py-3 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("cart.continue")}
            </Link>
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
        <h1 className="text-2xl font-bold text-foreground mb-8">{t("cart.title")}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex gap-4 bg-card rounded-lg border border-border p-4">
                <Link to={`/product/${item.productId || item.id}`} className="w-20 h-20 md:w-24 md:h-24 rounded-md overflow-hidden bg-secondary flex-shrink-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link
                        to={`/product/${item.productId || item.id}`}
                        className="text-sm font-medium text-foreground hover:text-primary transition-colors line-clamp-2"
                      >
                        {item.name}
                      </Link>
                      {(item.selectedSize || item.selectedColor) && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.selectedColor && item.selectedColor}
                          {item.selectedSize && ` / ${item.selectedSize}`}
                        </p>
                      )}
                    </div>
                    <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center border border-border rounded">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="px-2 py-1 text-muted-foreground hover:text-foreground">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-3 py-1 text-sm font-medium">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-2 py-1 text-muted-foreground hover:text-foreground">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">EUR {(item.price * item.quantity).toFixed(2)}</p>
                      {item.originalPrice && (
                        <p className="text-xs text-muted-foreground line-through">EUR {(item.originalPrice * item.quantity).toFixed(2)}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <Link to="/products" className="inline-flex items-center gap-2 text-sm text-primary hover:underline mt-4">
              <ArrowLeft className="w-4 h-4" />
              {t("cart.continue")}
            </Link>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg border border-border p-6 sticky top-24">
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder={t("cart.coupon")}
                  className="flex-1 px-3 py-2 bg-secondary rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  disabled={isApplyingCoupon}
                />
                <button
                  onClick={() => void handleApplyCoupon()}
                  className="px-4 py-2 bg-secondary text-foreground text-sm font-medium rounded hover:bg-muted transition-colors disabled:opacity-60"
                  disabled={isApplyingCoupon}
                >
                  {isApplyingCoupon ? "Applying..." : t("cart.apply")}
                </button>
              </div>

              {couponCode ? (
                <div className="mb-2 flex items-center justify-between rounded border border-border bg-secondary/40 px-3 py-2">
                  <p className="text-xs text-foreground">
                    Applied: <span className="font-semibold">{couponCode}</span>
                  </p>
                  <button onClick={handleRemoveCoupon} className="text-xs font-medium text-primary hover:underline">
                    Remove
                  </button>
                </div>
              ) : null}

              {couponError ? <p className="mb-2 text-xs text-destructive">{couponError}</p> : null}
              {couponSuccess ? <p className="mb-4 text-xs text-success">{couponSuccess}</p> : <div className="mb-4" />}
              <AvailableCoupons onSelectCode={(code) => setCouponInput(code)} targets={couponTargets} />

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("cart.subtotal")}</span>
                  <span className="text-foreground font-medium">EUR {totalPrice.toFixed(2)}</span>
                </div>
                {couponDiscount > 0 ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="font-medium text-success">-EUR {couponDiscount.toFixed(2)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal after discount</span>
                  <span className="text-foreground font-medium">EUR {subtotalAfterDiscount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("cart.shipping")}</span>
                  <span className="text-foreground font-medium">{shipping === 0 ? t("cart.free") : `EUR ${shipping.toFixed(2)}`}</span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between">
                  <span className="font-semibold text-foreground">{t("cart.total")}</span>
                  <span className="text-lg font-bold text-foreground">EUR {grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <Link to="/checkout" className="block w-full bg-primary text-primary-foreground py-3 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity text-center">
                {t("cart.checkout")}
              </Link>

              <div className="flex justify-center gap-3 mt-4 text-xs text-muted-foreground">
                <span className="border border-border rounded px-2 py-0.5">VISA</span>
                <span className="border border-border rounded px-2 py-0.5">MC</span>
                <span className="border border-border rounded px-2 py-0.5">MB WAY</span>
                <span className="border border-border rounded px-2 py-0.5">Klarna</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CartPage;
