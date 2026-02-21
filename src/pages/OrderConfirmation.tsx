import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle, Package, FileText, ArrowRight } from 'lucide-react';

import { useLanguage } from '@/contexts/LanguageContext';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { getJson } from '@/lib/api';

type ConfirmationState = {
  order: { id: number; order_number: string };
  payment: { instructions: Record<string, string> | null; payment_url: string | null };
  grand_total: number;
};

type TrackingInfo = {
  tracking_code?: string;
  label_url?: string;
  status?: string;
};

const OrderConfirmation = () => {
  const { language, t } = useLanguage();
  const location = useLocation();
  const [tracking, setTracking] = useState<TrackingInfo | null>(null);

  const data = useMemo(() => {
    const fromState = location.state as ConfirmationState | null;
    if (fromState) return fromState;

    const raw = sessionStorage.getItem('latest_order');
    return raw ? (JSON.parse(raw) as ConfirmationState) : null;
  }, [location.state]);

  useEffect(() => {
    if (!data?.order?.id) return;

    void getJson<TrackingInfo>(`/api/shipping/orders/${data.order.id}/tracking`)
      .then((result) => setTracking(result))
      .catch(() => setTracking(null));
  }, [data?.order?.id]);

  const orderNumber = data?.order?.order_number || 'N/A';
  const estimatedDelivery = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString(
    language === 'pt' ? 'pt-PT' : 'es-ES',
    { day: 'numeric', month: 'long', year: 'numeric' }
  );

  return (
    <div className='min-h-screen bg-background'>
      <Header />

      <div className='container-page py-16'>
        <div className='mx-auto max-w-2xl text-center'>
          <div className='mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success/10'>
            <CheckCircle className='h-10 w-10 text-success' />
          </div>

          <h1 className='mb-2 text-3xl font-bold text-foreground'>{t('order.thanks')}</h1>
          <p className='mb-8 text-muted-foreground'>{t('order.confirmed')}</p>

          <div className='mb-6 rounded-lg border border-border bg-card p-6 text-left'>
            <div className='mb-4 flex items-center justify-between border-b border-border pb-4'>
              <div>
                <p className='text-xs text-muted-foreground'>{t('order.number')}</p>
                <p className='text-lg font-bold text-foreground'>{orderNumber}</p>
              </div>
              <div className='text-right'>
                <p className='text-xs text-muted-foreground'>{t('order.estimatedDelivery')}</p>
                <p className='text-sm font-medium text-foreground'>{estimatedDelivery}</p>
              </div>
            </div>

            <div className='mb-4 flex items-start gap-3 border-b border-border pb-4'>
              <Package className='mt-0.5 h-5 w-5 flex-shrink-0 text-primary' />
              <div>
                <p className='text-sm font-medium text-foreground'>{t('order.tracking')}</p>
                {tracking?.tracking_code ? (
                  <p className='mt-1 text-xs text-muted-foreground'>
                    Tracking code: <strong>{tracking.tracking_code}</strong>
                    {tracking.label_url ? (
                      <>
                        {' '}|{' '}
                        <a className='text-primary underline' href={tracking.label_url} target='_blank' rel='noreferrer'>
                          Label
                        </a>
                      </>
                    ) : null}
                  </p>
                ) : (
                  <p className='mt-1 text-xs text-muted-foreground'>{t('order.trackingInfo')}</p>
                )}
              </div>
            </div>

            {data?.payment?.instructions ? (
              <div className='mb-4 rounded-md bg-secondary p-3 text-xs text-muted-foreground'>
                {Object.entries(data.payment.instructions).map(([key, value]) => (
                  <p key={key}>
                    <strong>{key}:</strong> {value}
                  </p>
                ))}
              </div>
            ) : null}

            {data?.payment?.payment_url ? (
              <a href={data.payment.payment_url} target='_blank' rel='noreferrer' className='text-sm text-primary underline'>
                Open payment page
              </a>
            ) : null}

            <div className='space-y-3'>
              <div className='flex items-center justify-between font-bold'>
                <span className='text-foreground'>{t('cart.total')}</span>
                <span className='text-foreground'>EUR {(data?.grand_total || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className='flex flex-col justify-center gap-3 sm:flex-row'>
            <button className='inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90'>
              <FileText className='h-4 w-4' />
              {t('order.invoice')}
            </button>
            <Link
              to='/products'
              className='inline-flex items-center justify-center gap-2 rounded-lg bg-secondary px-6 py-3 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-muted'
            >
              {t('order.continue')}
              <ArrowRight className='h-4 w-4' />
            </Link>
            {data?.order?.id ? (
              <Link
                to={`/orders/${data.order.id}`}
                className='inline-flex items-center justify-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary'
              >
                Track Order
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default OrderConfirmation;
