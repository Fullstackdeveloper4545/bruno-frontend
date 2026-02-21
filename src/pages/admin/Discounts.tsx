import { useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { NavLink } from 'react-router-dom';

import { PageHeader } from '@/components/admin/PageHeader';
import { ConfirmDeleteButton } from '@/components/admin/ConfirmDeleteButton';
import { adminApi } from '@/lib/adminApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type Coupon = {
  id: number;
  code: string;
  type: 'percentage' | 'fixed';
  value: string;
  expiration: string | null;
  usage_limit: number | null;
  usage_count: number;
  restriction_type: 'global' | 'product' | 'category';
  restriction_id: string | null;
  is_active: boolean;
};

type ProductOption = {
  id: string | number;
  sku?: string | null;
  name_pt?: string | null;
  name_es?: string | null;
  variants?: Array<{
    id: string | number;
    price?: string | number | null;
    compare_at_price?: string | number | null;
    currency?: string | null;
  }>;
};

type CategoryOption = {
  id: string | number;
  slug?: string | null;
  name_pt?: string | null;
  name_es?: string | null;
};

type CouponForm = {
  code: string;
  type: 'percentage' | 'fixed';
  value: string;
  expiration: string;
  usage_limit: string;
  restriction_type: 'global' | 'product' | 'category';
  restriction_id: string;
  is_active: boolean;
};

const emptyForm: CouponForm = {
  code: '',
  type: 'percentage',
  value: '0',
  expiration: '',
  usage_limit: '',
  restriction_type: 'global',
  restriction_id: '',
  is_active: true,
};

const toDateInput = (value: string | null | undefined) => (value ? value.slice(0, 10) : '');
const roundMoney = (value: number) => Math.round(value * 100) / 100;
const formatMoney = (value: number, currency = 'EUR') => `${currency} ${value.toFixed(2)}`;

export type DiscountsViewMode = 'coupons' | 'product-discounts';

const Discounts = ({ mode = 'coupons' }: { mode?: DiscountsViewMode }) => {
  const [rows, setRows] = useState<Coupon[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [form, setForm] = useState<CouponForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [productDiscountMessage, setProductDiscountMessage] = useState('');
  const [selectedDiscountProductId, setSelectedDiscountProductId] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isApplyingProductDiscount, setIsApplyingProductDiscount] = useState(false);
  const [activeDiscountActionProductId, setActiveDiscountActionProductId] = useState<string | null>(null);

  const productMap = useMemo(
    () => new Map(products.map((item) => [String(item.id), item])),
    [products]
  );
  const categoryMap = useMemo(
    () => new Map(categories.map((item) => [String(item.id), item])),
    [categories]
  );
  const productDiscountRows = useMemo(() => {
    return products
      .map((product) => {
        const variants = Array.isArray(product.variants) ? product.variants : [];
        const discountedVariants = variants.filter((variant) => {
          const price = Number(variant.price);
          const compareAt = Number(variant.compare_at_price);
          return Number.isFinite(price) && Number.isFinite(compareAt) && compareAt > price;
        });

        if (discountedVariants.length === 0) {
          return null;
        }

        const discounts = discountedVariants.map((variant) => {
          const price = Number(variant.price);
          const compareAt = Number(variant.compare_at_price);
          return roundMoney(((compareAt - price) / compareAt) * 100);
        });
        const minDiscount = Math.min(...discounts);
        const maxDiscount = Math.max(...discounts);

        const currentPrices = discountedVariants.map((variant) => Number(variant.price));
        const originalPrices = discountedVariants.map((variant) => Number(variant.compare_at_price));
        const minCurrent = Math.min(...currentPrices);
        const maxCurrent = Math.max(...currentPrices);
        const minOriginal = Math.min(...originalPrices);
        const maxOriginal = Math.max(...originalPrices);
        const currency = discountedVariants[0]?.currency || 'EUR';

        return {
          id: String(product.id),
          name: product.name_pt || product.name_es || product.sku || String(product.id),
          discountedVariants: discountedVariants.length,
          totalVariants: variants.length,
          minDiscount,
          maxDiscount,
          minCurrent,
          maxCurrent,
          minOriginal,
          maxOriginal,
          currency,
        };
      })
      .filter((row): row is {
        id: string;
        name: string;
        discountedVariants: number;
        totalVariants: number;
        minDiscount: number;
        maxDiscount: number;
        minCurrent: number;
        maxCurrent: number;
        minOriginal: number;
        maxOriginal: number;
        currency: string;
      } => Boolean(row))
      .sort((a, b) => b.maxDiscount - a.maxDiscount);
  }, [products]);

  const load = async () => {
    try {
      setError('');
      const couponRows = await (adminApi.listCoupons() as Promise<Coupon[]>);
      const [productResult, categoryResult] = await Promise.allSettled([
        adminApi.listProducts() as Promise<ProductOption[]>,
        adminApi.listCategories() as Promise<CategoryOption[]>,
      ]);

      setRows(couponRows);

      if (productResult.status === 'fulfilled') {
        setProducts(productResult.value);
      } else {
        setProducts([]);
      }

      if (categoryResult.status === 'fulfilled') {
        setCategories(categoryResult.value);
      } else {
        setCategories([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load coupons');
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const startEdit = (coupon: Coupon) => {
    setEditingId(coupon.id);
    setForm({
      code: coupon.code,
      type: coupon.type,
      value: String(coupon.value),
      expiration: toDateInput(coupon.expiration),
      usage_limit: coupon.usage_limit != null ? String(coupon.usage_limit) : '',
      restriction_type: coupon.restriction_type,
      restriction_id: coupon.restriction_id ? String(coupon.restriction_id) : '',
      is_active: coupon.is_active,
    });
  };

  const resolveRestriction = (coupon: Coupon) => {
    if (coupon.restriction_type === 'global') return 'All products';
    if (!coupon.restriction_id) return coupon.restriction_type;
    const key = String(coupon.restriction_id);
    if (coupon.restriction_type === 'product') {
      const product = productMap.get(key);
      const label = product?.name_pt || product?.name_es || product?.sku || key;
      return `Product: ${label}`;
    }
    const category = categoryMap.get(key);
    const label = category?.name_pt || category?.name_es || category?.slug || key;
    return `Category: ${label}`;
  };

  const handleDelete = async (id: number) => {
    try {
      setError('');
      await adminApi.deleteCoupon(id);
      if (editingId === id) {
        resetForm();
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete coupon');
    }
  };

  const handleSubmit = async () => {
    const normalizedCode = form.code.trim().toUpperCase();
    const parsedValue = Number(form.value);
    const parsedUsageLimit = form.usage_limit ? Number(form.usage_limit) : null;

    if (!normalizedCode) {
      setError('Coupon code is required.');
      return;
    }
    if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
      setError('Value must be greater than 0.');
      return;
    }
    if (form.type === 'percentage' && parsedValue > 100) {
      setError('Percentage value cannot exceed 100.');
      return;
    }
    if (parsedUsageLimit != null && (!Number.isInteger(parsedUsageLimit) || parsedUsageLimit < 1)) {
      setError('Usage limit must be an integer greater than 0.');
      return;
    }
    if (form.restriction_type !== 'global' && !form.restriction_id) {
      setError('Select a product/category for restriction.');
      return;
    }

    const payload = {
      code: normalizedCode,
      type: form.type,
      value: parsedValue,
      expiration: form.expiration || null,
      usage_limit: parsedUsageLimit,
      restriction_type: form.restriction_type,
      restriction_id: form.restriction_type === 'global' ? null : form.restriction_id,
      is_active: form.is_active,
    };

    try {
      setError('');
      setIsSaving(true);
      if (editingId) {
        await adminApi.updateCoupon(editingId, payload);
      } else {
        await adminApi.createCoupon(payload);
      }
      resetForm();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save coupon');
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyProductDiscount = async () => {
    const applyDiscountForProduct = async (productId: string, parsedPercent: number) => {
      const targetProduct = products.find((item) => String(item.id) === productId);
      if (!targetProduct) {
        throw new Error('Selected product not found.');
      }

      const variants = Array.isArray(targetProduct.variants) ? targetProduct.variants : [];
      if (variants.length === 0) {
        throw new Error('This product has no variants to update.');
      }

      const updates = variants.map(async (variant) => {
        const currentPrice = Number(variant.price);
        const currentCompareAt = Number(variant.compare_at_price);
        const hasCompareAt = Number.isFinite(currentCompareAt) && currentCompareAt > currentPrice;
        const basePrice = hasCompareAt ? currentCompareAt : currentPrice;

        if (!Number.isFinite(basePrice) || basePrice <= 0) {
          throw new Error(`Variant ${String(variant.id)} has invalid price.`);
        }

        const nextPrice = parsedPercent > 0
          ? roundMoney(basePrice * (1 - parsedPercent / 100))
          : roundMoney(basePrice);

        return adminApi.updateVariant(String(variant.id), {
          price: nextPrice,
          compare_at_price: roundMoney(basePrice),
        });
      });

      await Promise.all(updates);
      return variants.length;
    };

    const productId = selectedDiscountProductId.trim();
    const parsedPercent = Number(discountPercent);

    if (!productId) {
      setError('Select a product for discount.');
      setProductDiscountMessage('');
      return;
    }

    if (!Number.isFinite(parsedPercent) || parsedPercent < 0 || parsedPercent >= 100) {
      setError('Discount % must be between 0 and 99.');
      setProductDiscountMessage('');
      return;
    }

    try {
      setError('');
      setProductDiscountMessage('');
      setIsApplyingProductDiscount(true);
      const updatedCount = await applyDiscountForProduct(productId, parsedPercent);
      await load();
      setProductDiscountMessage(
        parsedPercent > 0
          ? `Applied ${parsedPercent}% discount to ${updatedCount} variant(s).`
          : `Removed discount from ${updatedCount} variant(s).`
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to apply product discount');
      setProductDiscountMessage('');
    } finally {
      setIsApplyingProductDiscount(false);
    }
  };

  const handleEditProductDiscount = (row: {
    id: string;
    minDiscount: number;
    maxDiscount: number;
  }) => {
    setSelectedDiscountProductId(row.id);
    setDiscountPercent(String(row.maxDiscount));
    setProductDiscountMessage('Product selected in form. Update the discount % and click Apply to Product.');
    setError('');
  };

  const handleDeleteProductDiscount = async (productId: string) => {
    const targetProduct = products.find((item) => String(item.id) === productId);
    if (!targetProduct) {
      setError('Selected product not found.');
      setProductDiscountMessage('');
      return;
    }

    try {
      setError('');
      setProductDiscountMessage('');
      setActiveDiscountActionProductId(productId);
      const variants = Array.isArray(targetProduct.variants) ? targetProduct.variants : [];
      const updates = variants.map(async (variant) => {
        const currentPrice = Number(variant.price);
        const currentCompareAt = Number(variant.compare_at_price);
        const hasCompareAt = Number.isFinite(currentCompareAt) && currentCompareAt > currentPrice;
        const basePrice = hasCompareAt ? currentCompareAt : currentPrice;

        if (!Number.isFinite(basePrice) || basePrice <= 0) {
          throw new Error(`Variant ${String(variant.id)} has invalid price.`);
        }

        return adminApi.updateVariant(String(variant.id), {
          price: roundMoney(basePrice),
          compare_at_price: roundMoney(basePrice),
        });
      });

      await Promise.all(updates);
      await load();
      if (selectedDiscountProductId === productId) {
        setDiscountPercent('0');
      }
      setProductDiscountMessage(`Removed discount from ${variants.length} variant(s).`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to remove product discount');
      setProductDiscountMessage('');
    } finally {
      setActiveDiscountActionProductId(null);
    }
  };

  const isCouponsMode = mode === 'coupons';
  const isProductDiscountMode = mode === 'product-discounts';

  return (
    <div className='space-y-6'>
      <PageHeader
        title={isCouponsMode ? 'Coupons' : 'Product Discounts'}
        description={
          isCouponsMode
            ? 'Create and manage coupons for all products, specific products, or categories.'
            : 'Apply or remove direct product-level discounts.'
        }
        actions={
          <Button variant='outline' onClick={() => void load()}>
            <RefreshCw className='mr-2 h-4 w-4' />
            Refresh
          </Button>
        }
      />
      {error ? <p className='text-sm text-destructive'>{error}</p> : null}

      <Card>
        <CardHeader><CardTitle>Discount Sections</CardTitle></CardHeader>
        <CardContent className='flex flex-wrap gap-2'>
          <Button asChild variant={isCouponsMode ? 'default' : 'outline'} size='sm'>
            <NavLink to='/admin/discounts/coupons'>Coupons</NavLink>
          </Button>
          <Button asChild variant={isProductDiscountMode ? 'default' : 'outline'} size='sm'>
            <NavLink to='/admin/discounts/product-discounts'>Product Discounts</NavLink>
          </Button>
        </CardContent>
      </Card>

      {isCouponsMode ? (
      <>
      <Card>
        <CardHeader><CardTitle>Coupons</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Restriction</TableHead>
                <TableHead>Limit</TableHead>
                <TableHead>Used</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className='text-center text-sm text-muted-foreground'>
                    No coupons yet
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className='font-medium'>{row.code}</TableCell>
                    <TableCell>{row.type}</TableCell>
                    <TableCell>
                      {row.type === 'percentage' ? `${Number(row.value)}%` : `EUR ${Number(row.value).toFixed(2)}`}
                    </TableCell>
                    <TableCell>{resolveRestriction(row)}</TableCell>
                    <TableCell>{row.usage_limit ?? '-'}</TableCell>
                    <TableCell>{row.usage_count ?? 0}</TableCell>
                    <TableCell>{row.expiration ? new Date(row.expiration).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>{row.is_active ? 'Active' : 'Inactive'}</TableCell>
                    <TableCell className='flex gap-2'>
                      <Button variant='secondary' size='sm' onClick={() => startEdit(row)}>
                        Edit
                      </Button>
                      <ConfirmDeleteButton entityName={`coupon "${row.code}"`} onConfirm={() => handleDelete(row.id)} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{editingId ? 'Update Coupon' : 'Create Coupon'}</CardTitle></CardHeader>
        <CardContent className='grid gap-3 md:grid-cols-4'>
          <Input placeholder='Code' value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} />
          <select className='rounded-md border bg-background px-3 py-2 text-sm' value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as CouponForm['type'] }))}>
            <option value='percentage'>percentage</option>
            <option value='fixed'>fixed</option>
          </select>
          <Input placeholder='Value' type='number' value={form.value} onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))} />
          <Input type='date' value={form.expiration} onChange={(e) => setForm((p) => ({ ...p, expiration: e.target.value }))} />
          <Input placeholder='Usage limit' type='number' value={form.usage_limit} onChange={(e) => setForm((p) => ({ ...p, usage_limit: e.target.value }))} />
          <select
            className='rounded-md border bg-background px-3 py-2 text-sm'
            value={form.restriction_type}
            onChange={(e) => setForm((p) => ({ ...p, restriction_type: e.target.value as CouponForm['restriction_type'], restriction_id: '' }))}
          >
            <option value='global'>All products</option>
            <option value='product'>Specific product</option>
            <option value='category'>Specific category</option>
          </select>
          {form.restriction_type === 'global' ? (
            <div className='rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground'>Coupon will apply to all products</div>
          ) : (
            <select
              className='rounded-md border bg-background px-3 py-2 text-sm'
              value={form.restriction_id}
              onChange={(e) => setForm((p) => ({ ...p, restriction_id: e.target.value }))}
            >
              <option value=''>
                {form.restriction_type === 'product' ? 'Select product' : 'Select category'}
              </option>
              {form.restriction_type === 'product'
                ? products.map((item) => (
                    <option key={String(item.id)} value={String(item.id)}>
                      {item.name_pt || item.name_es || item.sku || String(item.id)}
                    </option>
                  ))
                : categories.map((item) => (
                    <option key={String(item.id)} value={String(item.id)}>
                      {item.name_pt || item.name_es || item.slug || String(item.id)}
                    </option>
                  ))}
            </select>
          )}
          <label className='flex items-center gap-2 rounded-md border px-3 py-2 text-sm'>
            <input
              type='checkbox'
              checked={form.is_active}
              onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
            />
            Active
          </label>
          <div className='flex gap-2 md:col-span-4'>
            <Button disabled={isSaving} onClick={() => void handleSubmit()}>
              {isSaving ? 'Saving...' : editingId ? 'Update' : 'Save'}
            </Button>
            {editingId ? (
              <Button variant='secondary' onClick={resetForm}>
                Cancel
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
      </>
      ) : null}

      {isProductDiscountMode ? (
      <>
      <Card>
        <CardHeader><CardTitle>Product Discounts</CardTitle></CardHeader>
        <CardContent className='grid gap-3 md:grid-cols-4'>
          <select
            className='rounded-md border bg-background px-3 py-2 text-sm md:col-span-2'
            value={selectedDiscountProductId}
            onChange={(e) => setSelectedDiscountProductId(e.target.value)}
          >
            <option value=''>Select product</option>
            {products.map((item) => (
              <option key={String(item.id)} value={String(item.id)}>
                {item.name_pt || item.name_es || item.sku || String(item.id)}
              </option>
            ))}
          </select>
          <Input
            placeholder='Discount % (0-99)'
            type='number'
            min={0}
            max={99}
            value={discountPercent}
            onChange={(e) => setDiscountPercent(e.target.value)}
          />
          <Button disabled={isApplyingProductDiscount} onClick={() => void handleApplyProductDiscount()}>
            {isApplyingProductDiscount ? 'Applying...' : 'Apply to Product'}
          </Button>
          <p className='text-xs text-muted-foreground md:col-span-4'>
            This updates all variants of the selected product. Use 0% to remove discount.
          </p>
          {productDiscountMessage ? (
            <p className='text-xs text-success md:col-span-4'>{productDiscountMessage}</p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Applied Product Discounts</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Variants</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Current Price</TableHead>
                <TableHead>Original Price</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productDiscountRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className='text-center text-sm text-muted-foreground'>
                    No product discounts applied yet.
                  </TableCell>
                </TableRow>
              ) : (
                productDiscountRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className='font-medium'>{row.name}</TableCell>
                    <TableCell>{row.discountedVariants}/{row.totalVariants}</TableCell>
                    <TableCell>
                      {row.minDiscount === row.maxDiscount
                        ? `${row.maxDiscount}%`
                        : `${row.minDiscount}% - ${row.maxDiscount}%`}
                    </TableCell>
                    <TableCell>
                      {row.minCurrent === row.maxCurrent
                        ? formatMoney(row.minCurrent, row.currency)
                        : `${formatMoney(row.minCurrent, row.currency)} - ${formatMoney(row.maxCurrent, row.currency)}`}
                    </TableCell>
                    <TableCell>
                      {row.minOriginal === row.maxOriginal
                        ? formatMoney(row.minOriginal, row.currency)
                        : `${formatMoney(row.minOriginal, row.currency)} - ${formatMoney(row.maxOriginal, row.currency)}`}
                    </TableCell>
                    <TableCell className='flex gap-2'>
                      <Button
                        variant='secondary'
                        size='sm'
                        disabled={isApplyingProductDiscount || activeDiscountActionProductId === row.id}
                        onClick={() => handleEditProductDiscount(row)}
                      >
                        Edit
                      </Button>
                      <ConfirmDeleteButton
                        entityName={`discount on "${row.name}"`}
                        triggerLabel={activeDiscountActionProductId === row.id ? 'Removing...' : 'Delete'}
                        confirmLabel='Remove'
                        disabled={isApplyingProductDiscount || activeDiscountActionProductId === row.id}
                        onConfirm={() => handleDeleteProductDiscount(row.id)}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      </>
      ) : null}
    </div>
  );
};

export default Discounts;
