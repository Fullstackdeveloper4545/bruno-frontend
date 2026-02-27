import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/admin/PageHeader';
import { ConfirmDeleteButton } from '@/components/admin/ConfirmDeleteButton';
import { adminApi } from '@/lib/adminApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type Attribute = { id: number; name_pt: string; name_es: string };

const Attributes = () => {
  const [rows, setRows] = useState<Attribute[]>([]);
  const [form, setForm] = useState({ name_pt: '', name_es: '' });

  const load = async () => setRows(await adminApi.listAttributes() as Attribute[]);
  useEffect(() => { void load(); }, []);

  return (
    <div className='space-y-6'>
      <PageHeader title='Attribute Management' description='CRUD attributes (size, color, etc.).' />
      <Card>
        <CardHeader><CardTitle>Attributes</CardTitle></CardHeader>
        <CardContent>
          <Table><TableHeader><TableRow><TableHead>ID</TableHead><TableHead>PT</TableHead><TableHead>ES</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
            <TableBody>{rows.map((row) => <TableRow key={row.id}><TableCell>{row.id}</TableCell><TableCell>{row.name_pt}</TableCell><TableCell>{row.name_es}</TableCell><TableCell><ConfirmDeleteButton entityName={`attribute "${row.name_pt || row.name_es || row.id}"`} onConfirm={() => adminApi.deleteAttribute(row.id).then(load)} /></TableCell></TableRow>)}</TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Create Attribute</CardTitle></CardHeader>
        <CardContent className='grid gap-3 md:grid-cols-3'>
          <Input placeholder='Name PT' value={form.name_pt} onChange={(e) => setForm((p) => ({ ...p, name_pt: e.target.value }))} />
          <Input placeholder='Name ES' value={form.name_es} onChange={(e) => setForm((p) => ({ ...p, name_es: e.target.value }))} />
          <Button onClick={() => void adminApi.createAttribute(form).then(() => { setForm({ name_pt: '', name_es: '' }); return load(); })}>Save</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Attributes;
