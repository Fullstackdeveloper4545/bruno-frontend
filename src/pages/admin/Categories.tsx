import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/admin/PageHeader';
import { ConfirmDeleteButton } from '@/components/admin/ConfirmDeleteButton';
import { adminApi } from '@/lib/adminApi';
import { resolveApiFileUrl, uploadFile } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type Category = {
  id: string;
  slug?: string | null;
  name_pt?: string | null;
  name_es?: string | null;
  image_url?: string | null;
  is_active?: boolean;
};

const Categories = () => {
  const [rows, setRows] = useState<Category[]>([]);
  const [form, setForm] = useState({ name_pt: '', name_es: '', slug: '', image_url: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setRows(await adminApi.listCategories() as Category[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load categories');
    }
  };

  useEffect(() => { void load(); }, []);

  const startEdit = (row: Category) => {
    setEditingId(row.id);
    setForm({
      name_pt: row.name_pt ?? '',
      name_es: row.name_es ?? '',
      slug: row.slug ?? '',
      image_url: row.image_url ?? '',
    });
    setImageFile(null);
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({ name_pt: '', name_es: '', slug: '', image_url: '' });
    setImageFile(null);
  };

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(form.image_url || '');
      return;
    }

    const objectUrl = URL.createObjectURL(imageFile);
    setImagePreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile, form.image_url]);

  const handleSubmit = async () => {
    try {
      if (!form.name_pt && !form.name_es) {
        setError('Provide at least a PT or ES name.');
        return;
      }

      setError('');
      let imageUrl = form.image_url.trim();
      if (imageFile) {
        const uploaded = await uploadFile('/api/uploads', imageFile);
        imageUrl = uploaded.url;
      }

      const payload = {
        name_pt: form.name_pt,
        name_es: form.name_es,
        slug: form.slug,
        image_url: imageUrl || null,
      };

      if (editingId) {
        await adminApi.updateCategory(editingId, payload);
        resetForm();
        await load();
        return;
      }
      await adminApi.createCategory(payload);
      resetForm();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save category');
    }
  };

  return (
    <div className='space-y-6'>
      <PageHeader title='Category Management' description='CRUD categories with PT/ES names.' />
      {error ? <p className='text-sm text-destructive'>{error}</p> : null}
      <Card>
        <CardHeader><CardTitle>Categories</CardTitle></CardHeader>
        <CardContent>
          <Table><TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Thumbnail</TableHead><TableHead>Slug</TableHead><TableHead>PT</TableHead><TableHead>ES</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
            <TableBody>{rows.map((row) => <TableRow key={row.id}><TableCell>{row.id}</TableCell><TableCell>{row.image_url ? <img src={resolveApiFileUrl(row.image_url)} alt={row.name_pt || row.name_es || row.slug || 'category'} className='h-10 w-10 rounded-md border object-cover' /> : '-'}</TableCell><TableCell>{row.slug ?? '-'}</TableCell><TableCell>{row.name_pt ?? '-'}</TableCell><TableCell>{row.name_es ?? '-'}</TableCell><TableCell className='flex gap-2'><Button variant='secondary' size='sm' onClick={() => startEdit(row)}>Edit</Button><ConfirmDeleteButton entityName={`category "${row.name_pt || row.name_es || row.slug || row.id}"`} onConfirm={() => adminApi.deleteCategory(row.id).then(load)} /></TableCell></TableRow>)}</TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>{editingId ? 'Update Category' : 'Create Category'}</CardTitle></CardHeader>
        <CardContent className='grid gap-3 md:grid-cols-4'>
          <Input placeholder='Name PT' value={form.name_pt} onChange={(e) => setForm((p) => ({ ...p, name_pt: e.target.value }))} />
          <Input placeholder='Name ES' value={form.name_es} onChange={(e) => setForm((p) => ({ ...p, name_es: e.target.value }))} />
          <Input placeholder='Slug (optional)' value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} />
          <input
            type='file'
            accept='image/*'
            className='md:col-span-4 text-sm'
            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
          />
          <p className='md:col-span-4 text-xs text-muted-foreground'>Upload limit: max 5 MB per image.</p>
          {imagePreview ? (
            <div className='md:col-span-4 flex items-center gap-3'>
              <img src={resolveApiFileUrl(imagePreview)} alt='Category thumbnail preview' className='h-16 w-16 rounded-md border object-cover' />
              <p className='text-xs text-muted-foreground'>Category thumbnail preview</p>
            </div>
          ) : null}
          <div className='flex gap-2 md:col-span-4'>
            <Button onClick={() => void handleSubmit()}>{editingId ? 'Update' : 'Save'}</Button>
            {editingId ? <Button variant='secondary' onClick={resetForm}>Cancel</Button> : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Categories;
