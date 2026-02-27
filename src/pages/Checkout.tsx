import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, Smartphone, Building2, ArrowLeft, ArrowRight } from 'lucide-react';

import { useLanguage } from '@/contexts/LanguageContext';
import { useCart, type CartItem } from '@/contexts/CartContext';
import { useUserAuth } from '@/contexts/UserAuthContext';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { API_BASE_URL, postJson } from '@/lib/api';

type PaymentMethod = 'mbway' | 'mbref' | 'klarna';

type CreatedOrder = {
  id: number;
  order_number: string;
  total: string;
};

type CheckoutPaymentResponse = {
  payment: { id: number; provider: string; method: string; status: string };
  instructions: Record<string, string> | null;
  payment_url: string | null;
};

type CheckoutLocationState = {
  buyNowItem?: CartItem;
  buyNowCoupon?: { code: string; discount: number };
};

const bypassPaymentCheckout =
  String(import.meta.env.VITE_BYPASS_PAYMENT_CHECKOUT ?? 'true').toLowerCase() === 'true';

const isValidBuyNowItem = (value: unknown): value is CartItem => {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<CartItem>;
  return Boolean(
    typeof item.id === 'string' &&
      typeof item.name === 'string' &&
      typeof item.image === 'string' &&
      Number.isFinite(Number(item.price)) &&
      Number(item.price) >= 0 &&
      Number.isFinite(Number(item.quantity)) &&
      Number(item.quantity) > 0,
  );
};

const isValidBuyNowCoupon = (value: unknown): value is { code: string; discount: number } => {
  if (!value || typeof value !== 'object') return false;
  const coupon = value as Partial<{ code: string; discount: number }>;
  return Boolean(typeof coupon.code === 'string' && coupon.code.trim() && Number.isFinite(Number(coupon.discount)));
};

const CheckoutPage = () => {
  const { language, t } = useLanguage();
  const { items, clearCart, couponCode, couponDiscount } = useCart();
  const { isLoggedIn, email: userEmail } = useUserAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const buyNowItemState = (location.state as CheckoutLocationState | null)?.buyNowItem;
  const buyNowCouponState = (location.state as CheckoutLocationState | null)?.buyNowCoupon;
  const buyNowItem = isValidBuyNowItem(buyNowItemState) ? buyNowItemState : null;
  const buyNowCoupon = isValidBuyNowCoupon(buyNowCouponState) ? buyNowCouponState : null;
  const checkoutItems = useMemo(() => (buyNowItem ? [buyNowItem] : items), [buyNowItem, items]);
  const subtotal = useMemo(
    () => checkoutItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [checkoutItems],
  );
  const effectiveCouponCode = buyNowItem ? buyNowCoupon?.code ?? null : couponCode;
  const effectiveDiscount = buyNowItem
    ? Math.min(Math.max(0, Number(buyNowCoupon?.discount || 0)), subtotal)
    : Math.min(couponDiscount, subtotal);
  const subtotalAfterDiscount = Math.max(0, subtotal - effectiveDiscount);

  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mbway');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [personal, setPersonal] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  const [shippingData, setShippingData] = useState({
    address: '',
    city: '',
    postalCode: '',
    country: 'PT',
  });

  const shipping = subtotal >= 50 ? 0 : 4.99;
  const grandTotal = subtotalAfterDiscount + shipping;
  const steps = [t('checkout.step1'), t('checkout.step2'), t('checkout.step3')];

  const paymentProvider = paymentMethod === 'klarna' ? 'klarna' : 'ifthenpay';
  const paymentMethodApi = paymentMethod === 'mbref' ? 'mb_reference' : paymentMethod;
  const paymentHint =
    bypassPaymentCheckout
      ? 'Test mode: order will be placed without payment integration to validate routing/store assignment.'
      : paymentMethod === 'mbway'
        ? 'MB Way payment will be confirmed by webhook.'
        : paymentMethod === 'mbref'
          ? 'Multibanco entity/reference will be generated in payment instructions.'
          : 'Klarna checkout authorization and capture will be confirmed by webhook.';

  const isEmailValid = (value: string) => /\S+@\S+\.\S+/.test(value.trim());
  const getCheckoutEmail = () => (isLoggedIn && userEmail ? userEmail : personal.email).trim();

  useEffect(() => {
    if (isLoggedIn && userEmail) {
      setPersonal((prev) => ({ ...prev, email: userEmail }));
    }
  }, [isLoggedIn, userEmail]);

  const validateStep1 = () => {
    const checkoutEmail = getCheckoutEmail();
    if (!personal.firstName.trim() || !personal.lastName.trim()) {
      setError('Please enter first name and last name.');
      return false;
    }
    if (!isEmailValid(checkoutEmail)) {
      setError('Please enter a valid email.');
      return false;
    }
    if (!personal.phone.trim()) {
      setError('Please enter phone number.');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!shippingData.address.trim()) {
      setError('Please enter shipping address.');
      return false;
    }
    if (!shippingData.city.trim()) {
      setError('Please enter shipping city.');
      return false;
    }
    if (!shippingData.postalCode.trim()) {
      setError('Please enter postal code.');
      return false;
    }
    if (!shippingData.country.trim()) {
      setError('Please select country.');
      return false;
    }
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateStep1() || !validateStep2()) {
      return;
    }
    if (!checkoutItems.length) {
      setError('Your cart is empty.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      const checkoutEmail = getCheckoutEmail();

      const createdOrder = await postJson<CreatedOrder>('/api/orders', {
        customer_name: `${personal.firstName} ${personal.lastName}`.trim(),
        customer_email: checkoutEmail,
        shipping_address: `${shippingData.address}, ${shippingData.postalCode} ${shippingData.city}, ${shippingData.country}`,
        shipping_region: shippingData.city,
        items: checkoutItems.map((item) => ({
          product_id: item.productId || (item.id.includes(':') ? item.id.split(':')[0] : item.id),
          variant_id: item.variantId || null,
          product_name: item.name,
          sku: item.variantId || item.productId || item.id,
          quantity: item.quantity,
          unit_price: item.price,
        })),
        discount_total: effectiveDiscount,
      });

      const payment = bypassPaymentCheckout
        ? {
            payment: { id: 0, provider: 'manual', method: 'manual', status: 'pending' },
            instructions: null,
            payment_url: null,
          }
        : await postJson<CheckoutPaymentResponse>('/api/payments/checkout', {
            order_id: createdOrder.id,
            provider: paymentProvider,
            method: paymentMethodApi,
            customer: { phone: personal.phone, email: checkoutEmail },
            callback_url: `${API_BASE_URL}/api/payments/webhooks/${paymentProvider}`,
            return_url: `${window.location.origin}/order-confirmation`,
          });

      const confirmation = {
        order: createdOrder,
        payment,
        coupon_code: effectiveCouponCode,
        discount_total: effectiveDiscount,
        shipping_total: shipping,
        grand_total: grandTotal,
        is_buy_now: Boolean(buyNowItem),
      };

      sessionStorage.setItem('latest_order', JSON.stringify(confirmation));
      if (!buyNowItem) {
        clearCart();
      }

      if (!bypassPaymentCheckout && payment.payment_url) {
        window.open(payment.payment_url, '_blank', 'noopener,noreferrer');
      }

      navigate('/order-confirmation', { state: confirmation });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Checkout failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (checkoutItems.length === 0) {
    return (
      <div className='min-h-screen bg-background'>
        <Header />
        <div className='container-page py-20 text-center'>
          <p className='mb-4 text-muted-foreground'>{t('cart.empty')}</p>
          <Link to='/products' className='text-primary hover:underline'>
            {t('cart.continue')}
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-background'>
      <Header />

      <div className='container-page py-8'>
        <Link to='/cart' className='mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground'>
          <ArrowLeft className='h-4 w-4' /> {t('checkout.back')}
        </Link>

        <h1 className='mb-8 text-2xl font-bold text-foreground'>{t('checkout.title')}</h1>

        {error ? <p className='mb-4 text-sm text-destructive'>{error}</p> : null}

        <div className='mb-10 flex items-center gap-2'>
          {steps.map((label, i) => (
            <div key={i} className='flex flex-1 items-center gap-2'>
              <div
                className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  step > i + 1
                    ? 'bg-success text-success-foreground'
                    : step === i + 1
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground'
                }`}
              >
                {step > i + 1 ? 'OK' : i + 1}
              </div>
              <span className={`hidden text-xs font-medium sm:block ${step === i + 1 ? 'text-foreground' : 'text-muted-foreground'}`}>
                {label}
              </span>
              {i < 2 && <div className={`h-px flex-1 ${step > i + 1 ? 'bg-success' : 'bg-border'}`} />}
            </div>
          ))}
        </div>

        <div className='grid grid-cols-1 gap-8 lg:grid-cols-3'>
          <div className='lg:col-span-2'>
            {step === 1 && (
              <div className='animate-fade-in rounded-lg border border-border bg-card p-6'>
                <h2 className='mb-6 text-lg font-semibold'>{t('checkout.step1')}</h2>
                <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                  <div>
                    <label className='mb-1 block text-sm font-medium text-foreground'>{t('checkout.firstName')}</label>
                    <input
                      value={personal.firstName}
                      onChange={(e) => setPersonal((prev) => ({ ...prev, firstName: e.target.value }))}
                      className='w-full rounded-lg bg-secondary px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20'
                    />
                  </div>
                  <div>
                    <label className='mb-1 block text-sm font-medium text-foreground'>{t('checkout.lastName')}</label>
                    <input
                      value={personal.lastName}
                      onChange={(e) => setPersonal((prev) => ({ ...prev, lastName: e.target.value }))}
                      className='w-full rounded-lg bg-secondary px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20'
                    />
                  </div>
                  <div>
                    <label className='mb-1 block text-sm font-medium text-foreground'>{t('checkout.email')}</label>
                    <input
                      type='email'
                      value={personal.email}
                      onChange={(e) => setPersonal((prev) => ({ ...prev, email: e.target.value }))}
                      disabled={isLoggedIn}
                      className='w-full rounded-lg bg-secondary px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-70'
                    />
                  </div>
                  <div>
                    <label className='mb-1 block text-sm font-medium text-foreground'>{t('checkout.phone')}</label>
                    <input
                      type='tel'
                      value={personal.phone}
                      onChange={(e) => setPersonal((prev) => ({ ...prev, phone: e.target.value }))}
                      className='w-full rounded-lg bg-secondary px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20'
                    />
                  </div>
                </div>
                <div className='mt-6 flex justify-end'>
                  <button
                    onClick={() => {
                      setError('');
                      if (!validateStep1()) return;
                      setStep(2);
                    }}
                    className='flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90'
                  >
                    {t('checkout.next')} <ArrowRight className='h-4 w-4' />
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className='animate-fade-in rounded-lg border border-border bg-card p-6'>
                <h2 className='mb-6 text-lg font-semibold'>{t('checkout.step2')}</h2>
                <div className='space-y-4'>
                  <div>
                    <label className='mb-1 block text-sm font-medium text-foreground'>{t('checkout.address')}</label>
                    <input
                      value={shippingData.address}
                      onChange={(e) => setShippingData((prev) => ({ ...prev, address: e.target.value }))}
                      className='w-full rounded-lg bg-secondary px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20'
                    />
                  </div>
                  <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
                    <div>
                      <label className='mb-1 block text-sm font-medium text-foreground'>{t('checkout.city')}</label>
                      <input
                        value={shippingData.city}
                        onChange={(e) => setShippingData((prev) => ({ ...prev, city: e.target.value }))}
                        className='w-full rounded-lg bg-secondary px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20'
                      />
                    </div>
                    <div>
                      <label className='mb-1 block text-sm font-medium text-foreground'>{t('checkout.postalCode')}</label>
                      <input
                        value={shippingData.postalCode}
                        onChange={(e) => setShippingData((prev) => ({ ...prev, postalCode: e.target.value }))}
                        className='w-full rounded-lg bg-secondary px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20'
                      />
                    </div>
                    <div>
                      <label className='mb-1 block text-sm font-medium text-foreground'>{t('checkout.country')}</label>
                      <select
                        value={shippingData.country}
                        onChange={(e) => setShippingData((prev) => ({ ...prev, country: e.target.value }))}
                        className='w-full rounded-lg bg-secondary px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20'
                      >
                        <option value='PT'>Portugal</option>
                        <option value='ES'>Spain</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className='mt-6 flex justify-between'>
                  <button onClick={() => setStep(1)} className='text-sm text-muted-foreground hover:text-foreground'>
                    {'<-'} {t('checkout.back')}
                  </button>
                  <button
                    onClick={() => {
                      setError('');
                      if (!validateStep2()) return;
                      setStep(3);
                    }}
                    className='flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90'
                  >
                    {t('checkout.next')} <ArrowRight className='h-4 w-4' />
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className='animate-fade-in rounded-lg border border-border bg-card p-6'>
                <h2 className='mb-6 text-lg font-semibold'>{t('checkout.step3')}</h2>

                <div className='mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3'>
                  {[
                    { id: 'mbway' as const, label: t('checkout.mbway'), icon: Smartphone },
                    { id: 'mbref' as const, label: t('checkout.mbref'), icon: Building2 },
                    { id: 'klarna' as const, label: t('checkout.klarna'), icon: ShieldCheck },
                  ].map((method) => (
                    <button
                      key={method.id}
                      type='button'
                      onClick={() => setPaymentMethod(method.id)}
                      className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 text-sm transition-all ${
                        paymentMethod === method.id
                          ? 'border-primary bg-primary/5 text-foreground'
                          : 'border-border text-muted-foreground hover:border-primary/30'
                      }`}
                    >
                      <method.icon className='h-5 w-5' />
                      <span className='text-center text-xs font-medium'>{method.label}</span>
                    </button>
                  ))}
                </div>

                <div className='rounded-lg bg-secondary p-4 text-sm text-muted-foreground'>{paymentHint}</div>

                <div className='mt-6 flex items-center gap-2 text-xs text-muted-foreground'>
                  <ShieldCheck className='h-4 w-4 text-success' />
                  {t('checkout.secure')}
                </div>

                <div className='mt-6 flex justify-between'>
                  <button onClick={() => setStep(2)} className='text-sm text-muted-foreground hover:text-foreground'>
                    {'<-'} {t('checkout.back')}
                  </button>
                  <button
                    onClick={() => void handlePlaceOrder()}
                    disabled={isSubmitting}
                    className='flex items-center gap-2 rounded-lg bg-accent px-8 py-3 text-sm font-bold text-accent-foreground shadow-lg transition-all hover:brightness-110 disabled:opacity-70'
                  >
                    <ShieldCheck className='h-4 w-4' />
                    {isSubmitting ? 'Processing...' : bypassPaymentCheckout ? 'Place Order (Test Mode)' : t('checkout.placeOrder')}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className='lg:col-span-1'>
            <div className='sticky top-24 rounded-lg border border-border bg-card p-6'>
              <h3 className='mb-4 font-semibold text-foreground'>{t('order.summary')}</h3>
              <div className='mb-4 space-y-3'>
                {checkoutItems.map((item) => (
                  <div key={item.id} className='flex items-center gap-3'>
                    <img src={item.image} alt={item.name} className='h-12 w-12 rounded bg-secondary object-cover' />
                    <div className='min-w-0 flex-1'>
                      <p className='line-clamp-1 text-xs text-foreground'>{item.name}</p>
                      <p className='text-xs text-muted-foreground'>x{item.quantity}</p>
                    </div>
                    <p className='text-sm font-medium'>EUR {(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
              <div className='space-y-2 border-t border-border pt-3'>
                <div className='flex justify-between text-sm'>
                  <span className='text-muted-foreground'>{t('cart.subtotal')}</span>
                  <span>EUR {subtotal.toFixed(2)}</span>
                </div>
                {effectiveDiscount > 0 ? (
                  <>
                    <div className='flex justify-between text-sm'>
                      <span className='text-muted-foreground'>Coupon ({effectiveCouponCode})</span>
                      <span className='font-medium text-success'>-EUR {effectiveDiscount.toFixed(2)}</span>
                    </div>
                    <div className='flex justify-between text-sm'>
                      <span className='text-muted-foreground'>Subtotal after discount</span>
                      <span>EUR {subtotalAfterDiscount.toFixed(2)}</span>
                    </div>
                  </>
                ) : null}
                <div className='flex justify-between text-sm'>
                  <span className='text-muted-foreground'>{t('cart.shipping')}</span>
                  <span>{shipping === 0 ? t('cart.free') : `EUR ${shipping.toFixed(2)}`}</span>
                </div>
                <div className='flex justify-between border-t border-border pt-2 font-bold text-foreground'>
                  <span>{t('cart.total')}</span>
                  <span>EUR {grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CheckoutPage;
