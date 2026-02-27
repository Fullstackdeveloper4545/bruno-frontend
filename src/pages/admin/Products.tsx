import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/admin/PageHeader';
import { ConfirmDeleteButton } from '@/components/admin/ConfirmDeleteButton';
import { adminApi } from '@/lib/adminApi';
import { resolveApiFileUrl, uploadFile } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type Variant = { id: string; sku: string; price: string | number; attribute_values?: Record<string, unknown> | string | null };
type ProductImage = { image_url?: string | null; position?: number | string | null };
type Product = {
  id: string;
  name_pt: string;
  name_es: string;
  is_promoted: boolean;
  variants: Variant[];
  images?: ProductImage[];
  category_id?: string | null;
  category_name_pt?: string | null;
  category_name_es?: string | null;
};
type Store = { id: string; name: string };
type Category = { id: string; name_pt?: string | null; name_es?: string | null; image_url?: string | null };
type InventoryRow = {
  store_id: string;
  store_name?: string | null;
  variant_id?: string | null;
  sku?: string | null;
  stock_quantity?: number | string | null;
  updated_at?: string | null;
};

const roundMoney = (value: number) => Math.round(value * 100) / 100;

const toSlugPart = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const buildAttributeCombinations = (entries: Array<[string, string[]]>) => {
  if (entries.length === 0) return [{}] as Record<string, string>[];

  const [head, ...tail] = entries;
  const [key, values] = head;
  const suffixes = buildAttributeCombinations(tail);
  const combinations: Record<string, string>[] = [];

  values.forEach((value) => {
    suffixes.forEach((suffix) => {
      combinations.push({ [key]: value, ...suffix });
    });
  });

  return combinations;
};

const createSpecificationRow = () => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  key: '',
  value_pt: '',
  value_es: '',
});

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stockLocked, setStockLocked] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name_pt: '',
    name_es: '',
    description_pt: '',
    description_es: '',
    sku: '',
    price: '0',
    compare_at_price: '',
    discount_percent: '',
    currency: 'EUR',
    variant_is_active: true,
    is_promoted: false,
    category_id: '',
  });
  const createAttributeRow = () => ({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name: '', value: '' });
  const [variantAttributes, setVariantAttributes] = useState([createAttributeRow()]);
  const [specifications, setSpecifications] = useState([createSpecificationRow()]);
  const [productImages, setProductImages] = useState<File[]>([]);
  const [productImagePreviews, setProductImagePreviews] = useState<string[]>([]);
  const [productImageTags, setProductImageTags] = useState<string[]>([]);

  const [inventoryForm, setInventoryForm] = useState({ variantId: '', storeId: '', stock: '0' });
  const [inventoryProductId, setInventoryProductId] = useState('');
  const [inventoryCategoryId, setInventoryCategoryId] = useState('');
  const [inventoryProductSearch, setInventoryProductSearch] = useState('');
  const [inventoryRows, setInventoryRows] = useState<InventoryRow[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const selectedCategory = categories.find((category) => category.id === form.category_id);
  const discountPercentPreview = Number(form.discount_percent);
  const basePricePreview = Number(form.price);
  const canPreviewDiscount =
    Number.isFinite(discountPercentPreview) &&
    discountPercentPreview > 0 &&
    discountPercentPreview < 100 &&
    Number.isFinite(basePricePreview) &&
    basePricePreview > 0;
  const discountedPricePreview = canPreviewDiscount
    ? roundMoney(basePricePreview * (1 - discountPercentPreview / 100))
    : null;
  const filteredInventoryProducts = products.filter((product) => {
    const matchesCategory = !inventoryCategoryId || product.category_id === inventoryCategoryId;
    if (!matchesCategory) return false;

    const query = inventoryProductSearch.trim().toLowerCase();
    if (!query) return true;

    const namePt = String(product.name_pt || '').toLowerCase();
    const nameEs = String(product.name_es || '').toLowerCase();
    const categoryPt = String(product.category_name_pt || '').toLowerCase();
    const categoryEs = String(product.category_name_es || '').toLowerCase();
    const variants = (product.variants || []).map((variant) => String(variant.sku || '').toLowerCase()).join(' ');
    return (
      namePt.includes(query) ||
      nameEs.includes(query) ||
      categoryPt.includes(query) ||
      categoryEs.includes(query) ||
      variants.includes(query)
    );
  });
  const getProductThumbnail = (product: Product) => {
    const firstImage = Array.isArray(product.images)
      ? product.images.find((image) => image?.image_url)?.image_url || ''
      : '';
    return resolveApiFileUrl(firstImage);
  };

  useEffect(() => {
    if (productImages.length === 0) {
      setProductImagePreviews([]);
      return;
    }

    const objectUrls = productImages.map((file) => URL.createObjectURL(file));
    setProductImagePreviews(objectUrls);
    return () => objectUrls.forEach((url) => URL.revokeObjectURL(url));
  }, [productImages]);

  const formatAttributes = (attrs: Variant['attribute_values']) => {
    if (!attrs) return '';
    let resolved: Record<string, unknown> | null = null;
    if (typeof attrs === 'string') {
      try {
        resolved = JSON.parse(attrs);
      } catch {
        return '';
      }
    } else if (typeof attrs === 'object') {
      resolved = attrs as Record<string, unknown>;
    }
    if (!resolved) return '';
    const entries = Object.entries(resolved).filter(([key]) => key);
    if (entries.length === 0) return '';
    return entries.map(([key, value]) => `${key}: ${String(value)}`).join(', ');
  };

  const variantOptions = products.flatMap((product) =>
    (product.variants || []).map((variant) => {
      const name = product.name_pt || product.name_es || product.id;
      const attrs = formatAttributes(variant.attribute_values);
      const label = attrs ? `${name} • ${variant.sku} • ${attrs}` : `${name} • ${variant.sku}`;
      return { id: variant.id, label };
    }),
  );

  const loadInventory = async (productId: string) => {
    if (!productId) {
      setInventoryRows([]);
      return;
    }
    try {
      setLoadingInventory(true);
      const result = await adminApi.getInventory(productId) as InventoryRow[];
      setInventoryRows(Array.isArray(result) ? result : []);
    } catch (e) {
      setInventoryRows([]);
      setError(e instanceof Error ? e.message : 'Failed to load inventory');
    } finally {
      setLoadingInventory(false);
    }
  };

  const load = async () => {
    try {
      setError('');
      const [productRes, storeRes, categoryRes, integrationRes] = await Promise.allSettled([
        adminApi.listProducts() as Promise<Product[]>,
        adminApi.listStores() as Promise<Store[]>,
        adminApi.listCategories() as Promise<Category[]>,
        adminApi.getIntegrationSettings() as Promise<{ is_active: boolean }>,
      ]);

      if (productRes.status === 'fulfilled') {
        setProducts(productRes.value);
      } else {
        setProducts([]);
        setError(productRes.reason instanceof Error ? productRes.reason.message : 'Failed to load products');
      }

      if (storeRes.status === 'fulfilled') {
        setStores(storeRes.value);
      } else {
        setStores([]);
      }

      if (categoryRes.status === 'fulfilled') {
        setCategories(categoryRes.value);
      } else {
        setCategories([]);
      }

      if (integrationRes.status === 'fulfilled') {
        setStockLocked(Boolean(integrationRes.value?.is_active));
      } else {
        setStockLocked(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load products');
    }
  };

  useEffect(() => { void load(); }, []);
  useEffect(() => {
    if (!inventoryProductId) return;
    void loadInventory(inventoryProductId);
  }, [inventoryProductId]);

  const resetProductForm = () => {
    setEditingProductId(null);
    setForm({
      name_pt: '',
      name_es: '',
      description_pt: '',
      description_es: '',
      sku: '',
      price: '0',
      compare_at_price: '',
      discount_percent: '',
      currency: 'EUR',
      variant_is_active: true,
      is_promoted: false,
      category_id: '',
    });
    setVariantAttributes([createAttributeRow()]);
    setSpecifications([createSpecificationRow()]);
    setProductImages([]);
    setProductImagePreviews([]);
    setProductImageTags([]);
  };

  const saveProduct = async () => {
    try {
      setError('');
      const basePrice = Number(form.price);
      if (!Number.isFinite(basePrice) || basePrice <= 0) {
        setError('Price must be greater than 0');
        return;
      }

      const manualCompareAt = form.compare_at_price ? Number(form.compare_at_price) : null;
      if (manualCompareAt != null && (!Number.isFinite(manualCompareAt) || manualCompareAt <= 0)) {
        setError('Compare at price must be greater than 0');
        return;
      }

      const parsedDiscountPercent = form.discount_percent ? Number(form.discount_percent) : 0;
      if (form.discount_percent && (!Number.isFinite(parsedDiscountPercent) || parsedDiscountPercent <= 0 || parsedDiscountPercent >= 100)) {
        setError('Discount % must be between 1 and 99');
        return;
      }

      const hasDiscountPercent = Number.isFinite(parsedDiscountPercent) && parsedDiscountPercent > 0;
      const effectivePrice = hasDiscountPercent
        ? roundMoney(basePrice * (1 - parsedDiscountPercent / 100))
        : basePrice;
      const effectiveCompareAt = hasDiscountPercent
        ? roundMoney(basePrice)
        : manualCompareAt;

      const parsedAttributeValues = variantAttributes.reduce<Array<[string, string[]]>>((acc, item) => {
        const key = item.name.trim();
        if (!key) return acc;
        const values = item.value
          .split(',')
          .map((value) => value.trim())
          .filter((value) => Boolean(value));
        if (values.length === 0) return acc;
        acc.push([key, values]);
        return acc;
      }, []);
      const attributeCombinations = buildAttributeCombinations(parsedAttributeValues);
      const baseSku = form.sku.trim() || `SKU-${Date.now()}`;
      const variantsPayload = attributeCombinations.map((attributes, index) => {
        const suffix = Object.values(attributes)
          .map((value) => toSlugPart(value))
          .filter((value) => Boolean(value))
          .join('-');
        const sku =
          attributeCombinations.length === 1
            ? baseSku
            : `${baseSku}-${suffix || index + 1}`;
        return {
          sku,
          price: effectivePrice,
          compare_at_price: effectiveCompareAt,
          currency: form.currency || 'EUR',
          attribute_values: attributes,
          is_active: form.variant_is_active,
        };
      });
      const specificationsPayload = specifications
        .map((specification) => {
          const key = specification.key.trim();
          if (!key) return null;
          const pt = specification.value_pt.trim();
          const es = specification.value_es.trim();
          if (!pt && !es) return null;
          return {
            key,
            value: {
              pt: pt || es,
              es: es || pt,
            },
          };
        })
        .filter((specification): specification is { key: string; value: { pt: string; es: string } } => Boolean(specification));
      let imagePayload: { image_url: string; alt_text?: string; position?: number }[] = [];
      if (productImages.length > 0) {
        const uploadedImages = await Promise.all(productImages.map((file) => uploadFile('/api/uploads', file)));
        imagePayload = uploadedImages.map((uploaded, index) => ({
          image_url: uploaded.url,
          alt_text: productImageTags[index]?.trim() || form.name_pt || form.name_es || '',
          position: index,
        }));
      }
      if (editingProductId) {
        await adminApi.updateProduct(editingProductId, {
          category_id: form.category_id || null,
          sku: form.sku || null,
          base_price: effectivePrice,
          name_pt: form.name_pt || null,
          name_es: form.name_es || null,
          description_pt: form.description_pt || null,
          description_es: form.description_es || null,
          specifications: specificationsPayload,
          is_promoted: form.is_promoted,
        });
      } else {
        await adminApi.createProduct({
          category_id: form.category_id || null,
          name_pt: form.name_pt,
          name_es: form.name_es,
          description_pt: form.description_pt,
          description_es: form.description_es,
          specifications: specificationsPayload,
          is_promoted: form.is_promoted,
          images: imagePayload,
          variants: variantsPayload,
        });
      }
      resetProductForm();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : `Failed to ${editingProductId ? 'update' : 'create'} product`);
    }
  };

  const startEditProduct = (product: Product) => {
    const firstVariant = (product.variants || [])[0];
    setEditingProductId(product.id);
    setForm({
      name_pt: product.name_pt || '',
      name_es: product.name_es || '',
      description_pt: '',
      description_es: '',
      sku: firstVariant?.sku || '',
      price: String(firstVariant?.price ?? '0'),
      compare_at_price: '',
      discount_percent: '',
      currency: 'EUR',
      variant_is_active: true,
      is_promoted: Boolean(product.is_promoted),
      category_id: product.category_id || '',
    });
    setVariantAttributes([createAttributeRow()]);
    setSpecifications([createSpecificationRow()]);
    setProductImages([]);
    setProductImagePreviews([]);
    setProductImageTags([]);
  };

  const updateStock = async () => {
    try {
      setError('');
      await adminApi.updateInventory(inventoryForm.variantId, inventoryForm.storeId, Number(inventoryForm.stock));
      const productIdFromVariant = products.find((product) =>
        product.variants?.some((variant) => variant.id === inventoryForm.variantId),
      )?.id;
      if (productIdFromVariant) {
        setInventoryProductId(productIdFromVariant);
        await loadInventory(productIdFromVariant);
      }
      setInventoryForm({ variantId: '', storeId: '', stock: '0' });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update stock');
    }
  };

  return (
    <div className='space-y-6'>
      <PageHeader title='Product Management' description='CRUD products, variants, prices, promotions and inventory.' />
      {error ? <p className='text-sm text-destructive'>{error}</p> : null}

      <Card>
        <CardHeader><CardTitle>Products</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Thumbnail</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>PT</TableHead>
                <TableHead>ES</TableHead>
                <TableHead>Promoted</TableHead>
                <TableHead>Variants</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{product.id}</TableCell>
                  <TableCell>
                    {getProductThumbnail(product) ? (
                      <img
                        src={getProductThumbnail(product)}
                        alt={product.name_pt || product.name_es || 'product'}
                        className='h-10 w-10 rounded-md border object-cover'
                      />
                    ) : '-'}
                  </TableCell>
                  <TableCell>{product.category_name_pt ?? product.category_name_es ?? '-'}</TableCell>
                  <TableCell>{product.name_pt}</TableCell>
                  <TableCell>{product.name_es}</TableCell>
                  <TableCell>{product.is_promoted ? 'Yes' : 'No'}</TableCell>
                  <TableCell>{product.variants?.map((v) => `${v.sku} (EUR ${v.price})`).join(', ') || '-'}</TableCell>
                  <TableCell className='flex gap-2'>
                    <Button variant='secondary' size='sm' onClick={() => startEditProduct(product)}>
                      Edit
                    </Button>
                    <ConfirmDeleteButton
                      entityName={`product "${product.name_pt || product.name_es || product.id}"`}
                      onConfirm={() => adminApi.deleteProduct(product.id).then(load)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{editingProductId ? 'Edit Product' : 'Create Product + Variant'}</CardTitle></CardHeader>
        <CardContent className='grid gap-3 md:grid-cols-2'>
          <select
            className='rounded-md border bg-background px-3 py-2 text-sm md:col-span-2'
            value={form.category_id}
            onChange={(e) => setForm((p) => ({ ...p, category_id: e.target.value }))}
          >
            <option value=''>Category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name_pt || category.name_es || category.id}
              </option>
            ))}
          </select>
          {selectedCategory?.image_url ? (
            <div className='md:col-span-2 flex items-center gap-3 rounded-md border bg-muted/20 p-2'>
              <img
                src={resolveApiFileUrl(selectedCategory.image_url)}
                alt={selectedCategory.name_pt || selectedCategory.name_es || 'category'}
                className='h-12 w-12 rounded-md border object-cover'
              />
              <div className='text-sm'>
                <p className='font-medium'>Category thumbnail</p>
                <p className='text-xs text-muted-foreground'>{selectedCategory.name_pt || selectedCategory.name_es || selectedCategory.id}</p>
              </div>
            </div>
          ) : null}
          <Input placeholder='Name PT' value={form.name_pt} onChange={(e) => setForm((p) => ({ ...p, name_pt: e.target.value }))} />
          <Input placeholder='Name ES' value={form.name_es} onChange={(e) => setForm((p) => ({ ...p, name_es: e.target.value }))} />
          <Input placeholder='Description PT' value={form.description_pt} onChange={(e) => setForm((p) => ({ ...p, description_pt: e.target.value }))} />
          <Input placeholder='Description ES' value={form.description_es} onChange={(e) => setForm((p) => ({ ...p, description_es: e.target.value }))} />
          <div className='md:col-span-2 space-y-2'>
            <p className='text-sm text-muted-foreground'>Specifications (for all product types)</p>
            {specifications.map((specification, index) => (
              <div key={specification.id} className='grid gap-2 sm:grid-cols-[1.2fr_1fr_1fr_auto]'>
                <Input
                  placeholder='Spec key (e.g. RAM)'
                  value={specification.key}
                  onChange={(e) =>
                    setSpecifications((prev) =>
                      prev.map((item, i) => (i === index ? { ...item, key: e.target.value } : item)),
                    )
                  }
                />
                <Input
                  placeholder='Value PT (e.g. 8 GB)'
                  value={specification.value_pt}
                  onChange={(e) =>
                    setSpecifications((prev) =>
                      prev.map((item, i) => (i === index ? { ...item, value_pt: e.target.value } : item)),
                    )
                  }
                />
                <Input
                  placeholder='Value ES (e.g. 8 GB)'
                  value={specification.value_es}
                  onChange={(e) =>
                    setSpecifications((prev) =>
                      prev.map((item, i) => (i === index ? { ...item, value_es: e.target.value } : item)),
                    )
                  }
                />
                <Button
                  variant='secondary'
                  onClick={() => setSpecifications((prev) => prev.filter((_, i) => i !== index))}
                  disabled={specifications.length === 1}
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button variant='secondary' onClick={() => setSpecifications((prev) => [...prev, createSpecificationRow()])}>
              Add specification
            </Button>
          </div>
          <input
            type='file'
            accept='image/*'
            multiple
            className='md:col-span-2 text-sm'
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              if (files.length === 0) return;
              setProductImages((prev) => [...prev, ...files]);
              setProductImageTags((prev) => [...prev, ...files.map(() => '')]);
              e.currentTarget.value = '';
            }}
          />
          <p className='md:col-span-2 text-xs text-muted-foreground'>Upload limit: max 5 MB per image.</p>
          {productImagePreviews.length > 0 ? (
            <div className='md:col-span-2 space-y-2 rounded-md border bg-muted/20 p-2'>
              <p className='text-xs text-muted-foreground'>Product images preview ({productImagePreviews.length})</p>
              <div className='flex flex-wrap gap-2'>
                {productImagePreviews.map((preview, index) => (
                  <div key={preview} className='relative'>
                    <img
                      src={resolveApiFileUrl(preview)}
                      alt={`Product preview ${index + 1}`}
                      className='h-14 w-14 rounded-md border object-cover'
                    />
                    <button
                      type='button'
                      className='absolute -right-1 -top-1 rounded-full border bg-background px-1 text-xs'
                      onClick={() => {
                        setProductImages((prev) => prev.filter((_, i) => i !== index));
                        setProductImageTags((prev) => prev.filter((_, i) => i !== index));
                      }}
                      aria-label={`Remove image ${index + 1}`}
                    >
                      x
                    </button>
                    <Input
                      value={productImageTags[index] || ''}
                      onChange={(e) =>
                        setProductImageTags((prev) => prev.map((tag, i) => (i === index ? e.target.value : tag)))
                      }
                      placeholder='Tag (e.g. Red, XL)'
                      className='mt-2 h-7 w-28 text-xs'
                    />
                  </div>
                ))}
              </div>
              <p className='text-[11px] text-muted-foreground'>Use image tags to match variants (example: Red, Blue, XL).</p>
            </div>
          ) : null}
          <Input placeholder='SKU' value={form.sku} onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))} />
          <Input placeholder='Price' type='number' value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} />
          <Input
            placeholder='Compare at price'
            type='number'
            value={form.compare_at_price}
            onChange={(e) => setForm((p) => ({ ...p, compare_at_price: e.target.value }))}
          />
          <Input
            placeholder='Discount % (optional)'
            type='number'
            value={form.discount_percent}
            onChange={(e) => setForm((p) => ({ ...p, discount_percent: e.target.value }))}
          />
          {canPreviewDiscount ? (
            <p className='md:col-span-2 text-xs text-muted-foreground'>
              Discount preview: EUR {basePricePreview.toFixed(2)} {'->'} EUR {discountedPricePreview?.toFixed(2)} ({discountPercentPreview}% off)
            </p>
          ) : null}
          <Input
            placeholder='Currency'
            value={form.currency}
            onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))}
          />
          <div className='md:col-span-2 space-y-2'>
            <p className='text-sm text-muted-foreground'>Variant attributes</p>
            {variantAttributes.map((attr, index) => (
              <div key={attr.id} className='flex flex-col gap-2 sm:flex-row sm:items-center'>
                <Input
                  placeholder='Attribute name (e.g. Size)'
                  value={attr.name}
                  onChange={(e) =>
                    setVariantAttributes((prev) =>
                      prev.map((item, i) => (i === index ? { ...item, name: e.target.value } : item)),
                    )
                  }
                  className='flex-1'
                />
                <Input
                  placeholder='Attribute value (e.g. yellow, red)'
                  value={attr.value}
                  onChange={(e) =>
                    setVariantAttributes((prev) =>
                      prev.map((item, i) => (i === index ? { ...item, value: e.target.value } : item)),
                    )
                  }
                  className='flex-1'
                />
                <Button
                  variant='secondary'
                  onClick={() =>
                    setVariantAttributes((prev) => prev.filter((_, i) => i !== index))
                  }
                  disabled={variantAttributes.length === 1}
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button
              variant='secondary'
              onClick={() => setVariantAttributes((prev) => [...prev, createAttributeRow()])}
            >
              Add attribute
            </Button>
            <p className='text-xs text-muted-foreground'>Tip: use comma-separated values to create multiple variants in one product (e.g. color: yellow, red).</p>
            <p className='text-xs text-muted-foreground'>For beauty shades, you can set custom color swatch: `Sandstone:#D8B08F, Rose Beige:#C98F7E`.</p>
          </div>
          <div className='flex items-center gap-3'>
            <span className='text-sm'>Promoted</span>
            <Switch checked={form.is_promoted} onCheckedChange={(checked) => setForm((p) => ({ ...p, is_promoted: checked }))} />
          </div>
          <div className='flex items-center gap-3'>
            <span className='text-sm'>Variant Active</span>
            <Switch
              checked={form.variant_is_active}
              onCheckedChange={(checked) => setForm((p) => ({ ...p, variant_is_active: checked }))}
            />
          </div>
          <div className='md:col-span-2 flex gap-2'>
            <Button onClick={() => void saveProduct()}>
              {editingProductId ? 'Update Product' : 'Save Product'}
            </Button>
            {editingProductId ? (
              <Button variant='outline' onClick={resetProductForm}>
                Cancel Edit
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Inventory Update</CardTitle></CardHeader>
        <CardContent className='grid gap-3 md:grid-cols-4'>
          <select
            className='rounded-md border bg-background px-3 py-2 text-sm'
            value={inventoryForm.variantId}
            onChange={(e) => setInventoryForm((p) => ({ ...p, variantId: e.target.value }))}
            disabled={stockLocked}
          >
            <option value=''>Variant (name + attributes)</option>
            {variantOptions.map((variant) => (
              <option key={variant.id} value={variant.id}>{variant.label}</option>
            ))}
          </select>
          <select className='rounded-md border bg-background px-3 py-2 text-sm' value={inventoryForm.storeId} onChange={(e) => setInventoryForm((p) => ({ ...p, storeId: e.target.value }))} disabled={stockLocked}>
            <option value=''>Store</option>
            {stores.map((store) => <option key={store.id} value={store.id}>{store.name}</option>)}
          </select>
          <Input placeholder='Stock Qty' type='number' value={inventoryForm.stock} onChange={(e) => setInventoryForm((p) => ({ ...p, stock: e.target.value }))} disabled={stockLocked} />
          <Button onClick={() => void updateStock()} disabled={stockLocked}>Update Stock</Button>
          {stockLocked ? <p className='text-xs text-muted-foreground md:col-span-4'>Stock editing is locked while integration is ON.</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Inventory by Store</CardTitle></CardHeader>
        <CardContent className='space-y-3'>
          <div className='grid gap-3 md:grid-cols-3'>
            <select
              className='rounded-md border bg-background px-3 py-2 text-sm'
              value={inventoryCategoryId}
              onChange={(e) => {
                setInventoryCategoryId(e.target.value);
                setInventoryProductId('');
              }}
            >
              <option value=''>All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name_pt || category.name_es || category.id}
                </option>
              ))}
            </select>
            <Input
              placeholder='Search product (name, sku, category)'
              value={inventoryProductSearch}
              onChange={(e) => {
                setInventoryProductSearch(e.target.value);
                setInventoryProductId('');
              }}
            />
            <select
              className='rounded-md border bg-background px-3 py-2 text-sm'
              value={inventoryProductId}
              onChange={(e) => setInventoryProductId(e.target.value)}
            >
              <option value=''>Select Product</option>
              {filteredInventoryProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  {`${product.name_pt || product.name_es || product.id} (${product.category_name_pt || product.category_name_es || 'No Category'})`}
                </option>
              ))}
            </select>
          </div>
          <div className='grid gap-3 md:grid-cols-[1fr_auto]'>
            <p className='text-xs text-muted-foreground'>
              Products found: {filteredInventoryProducts.length}
            </p>
            <Button
              variant='secondary'
              onClick={() => void loadInventory(inventoryProductId)}
              disabled={!inventoryProductId || loadingInventory}
            >
              {loadingInventory ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Store</TableHead>
                <TableHead>Variant SKU</TableHead>
                <TableHead>Stock Qty</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!inventoryProductId ? (
                <TableRow><TableCell colSpan={4}>Select a product to view stock.</TableCell></TableRow>
              ) : loadingInventory ? (
                <TableRow><TableCell colSpan={4}>Loading inventory...</TableCell></TableRow>
              ) : inventoryRows.length === 0 ? (
                <TableRow><TableCell colSpan={4}>No inventory records for this product.</TableCell></TableRow>
              ) : (
                inventoryRows.map((row, index) => (
                  <TableRow key={`${row.store_id}-${row.variant_id || index}`}>
                    <TableCell>{row.store_name || row.store_id}</TableCell>
                    <TableCell>{row.sku || row.variant_id || '-'}</TableCell>
                    <TableCell>{Number(row.stock_quantity || 0)}</TableCell>
                    <TableCell>{row.updated_at ? new Date(row.updated_at).toLocaleString() : '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Products;
