import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { postJson } from "@/lib/api";
import { useUserAuth } from "@/contexts/UserAuthContext";

export interface CartItem {
  id: string;
  productId?: string;
  variantId?: string;
  categoryId?: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  couponCode: string | null;
  couponDiscount: number;
  subtotalAfterDiscount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

type ApplyCouponResponse = {
  coupon_id: number;
  discount: number;
};

type AppliedCoupon = {
  id: number;
  code: string;
  discount: number;
};

const CART_STORAGE_PREFIX = "cart:items:v1:";
const LEGACY_CART_STORAGE_KEY = "cart:items";
const COUPON_STORAGE_PREFIX = "cart:coupon:v1:";

const normalizeEmailKey = (email: string | null) => (email ? email.trim().toLowerCase() : "guest");
const cartStorageKey = (email: string | null) => `${CART_STORAGE_PREFIX}${normalizeEmailKey(email)}`;
const couponStorageKey = (email: string | null) => `${COUPON_STORAGE_PREFIX}${normalizeEmailKey(email)}`;

const toCartItem = (raw: unknown): CartItem | null => {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Partial<CartItem>;
  if (!item.id || typeof item.id !== "string") return null;
  if (!item.name || typeof item.name !== "string") return null;
  if (!item.image || typeof item.image !== "string") return null;

  const price = Number(item.price);
  const quantity = Number(item.quantity);
  if (!Number.isFinite(price) || price < 0) return null;
  if (!Number.isFinite(quantity) || quantity < 1) return null;

  return {
    id: item.id,
    productId: item.productId || undefined,
    variantId: item.variantId || undefined,
    categoryId: item.categoryId || undefined,
    name: item.name,
    price,
    originalPrice: item.originalPrice != null ? Number(item.originalPrice) : undefined,
    image: item.image,
    quantity: Math.max(1, Math.floor(quantity)),
    selectedSize: item.selectedSize || undefined,
    selectedColor: item.selectedColor || undefined,
  };
};

const readStoredCart = (key: string) => {
  if (typeof window === "undefined") return [] as CartItem[];
  const raw = window.localStorage.getItem(key);
  if (!raw) return [] as CartItem[];

  try {
    const parsed = JSON.parse(raw) as unknown;
    const list = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === "object" && Array.isArray((parsed as { items?: unknown[] }).items)
        ? (parsed as { items: unknown[] }).items
        : [];
    return list.map(toCartItem).filter((item): item is CartItem => Boolean(item));
  } catch {
    return [] as CartItem[];
  }
};

const writeStoredCart = (key: string, items: CartItem[]) => {
  if (typeof window === "undefined") return;
  if (items.length === 0) {
    window.localStorage.removeItem(key);
    return;
  }
  window.localStorage.setItem(key, JSON.stringify({ items }));
};

const readStoredCoupon = (key: string) => {
  if (typeof window === "undefined") return null as AppliedCoupon | null;
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<AppliedCoupon>;
    if (!parsed || typeof parsed !== "object") return null;
    if (!parsed.code || typeof parsed.code !== "string") return null;
    const id = Number(parsed.id);
    const discount = Number(parsed.discount);
    if (!Number.isFinite(id) || !Number.isFinite(discount)) return null;
    return { id, code: parsed.code, discount: Math.max(0, discount) };
  } catch {
    return null;
  }
};

const writeStoredCoupon = (key: string, coupon: AppliedCoupon | null) => {
  if (typeof window === "undefined") return;
  if (!coupon) {
    window.localStorage.removeItem(key);
    return;
  }
  window.localStorage.setItem(key, JSON.stringify(coupon));
};

const resolveProductId = (item: CartItem) => {
  if (item.productId) return item.productId;
  if (item.id.includes(":")) return item.id.split(":")[0];
  return item.id;
};

export function CartProvider({ children }: { children: ReactNode }) {
  const { email } = useUserAuth();
  const activeStorageKey = useMemo(() => cartStorageKey(email), [email]);
  const activeCouponStorageKey = useMemo(() => couponStorageKey(email), [email]);
  const [items, setItems] = useState<CartItem[]>(() => readStoredCart(cartStorageKey(email)));
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(() => readStoredCoupon(couponStorageKey(email)));

  useEffect(() => {
    if (typeof window === "undefined") return;
    const legacy = window.localStorage.getItem(LEGACY_CART_STORAGE_KEY);
    if (legacy && !window.localStorage.getItem(activeStorageKey)) {
      window.localStorage.setItem(activeStorageKey, legacy);
      window.localStorage.removeItem(LEGACY_CART_STORAGE_KEY);
    }
  }, [activeStorageKey]);

  useEffect(() => {
    setItems(readStoredCart(activeStorageKey));
    setCoupon(readStoredCoupon(activeCouponStorageKey));
  }, [activeCouponStorageKey, activeStorageKey]);

  useEffect(() => {
    writeStoredCart(activeStorageKey, items);
  }, [activeStorageKey, items]);

  useEffect(() => {
    writeStoredCoupon(activeCouponStorageKey, coupon);
  }, [activeCouponStorageKey, coupon]);

  const addItem = (item: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i);
      }
      return [...prev, item];
    });
  };

  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) return removeItem(id);
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, quantity } : i));
  };

  const removeCoupon = () => setCoupon(null);

  const applyCoupon = async (rawCode: string) => {
    const code = rawCode.trim().toUpperCase();
    if (!code) {
      throw new Error("Enter a coupon code");
    }
    if (items.length === 0) {
      throw new Error("Cart is empty");
    }

    const payloadItems = items.map((item) => ({
      product_id: resolveProductId(item),
      category_id: item.categoryId ?? null,
      quantity: item.quantity,
      unit_price: item.price,
      line_total: item.quantity * item.price,
    }));

    const result = await postJson<ApplyCouponResponse>("/api/discounts/apply", {
      code,
      items: payloadItems,
    });

    setCoupon({
      id: Number(result.coupon_id),
      code,
      discount: Number(result.discount) || 0,
    });
  };

  const clearCart = () => {
    setItems([]);
    setCoupon(null);
  };

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const couponDiscount = Math.min(coupon?.discount ?? 0, totalPrice);
  const subtotalAfterDiscount = Math.max(0, totalPrice - couponDiscount);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        applyCoupon,
        removeCoupon,
        clearCart,
        totalItems,
        totalPrice,
        couponCode: coupon?.code ?? null,
        couponDiscount,
        subtotalAfterDiscount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
