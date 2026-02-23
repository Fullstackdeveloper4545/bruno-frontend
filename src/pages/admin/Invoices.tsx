import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/admin/PageHeader';
import { adminApi } from '@/lib/adminApi';
import { API_BASE_URL } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type Invoice = { id: number; invoice_number: string; order_number: string; synced: boolean };

const Invoices = () => {
  const [rows, setRows] = useState<Invoice[]>([]);
  const [message, setMessage] = useState('');

  const load = async () => setRows(await adminApi.listInvoices() as Invoice[]);
  useEffect(() => { void load(); }, []);

  return (
    <div className='space-y-6'>
      <PageHeader title='Invoices' description='Download/resend/sync invoice PDFs.' />
      {message ? <p className='text-sm'>{message}</p> : null}

      <Card>
        <CardHeader><CardTitle>Invoice List</CardTitle></CardHeader>
        <CardContent>
          <div className='mb-3'>
            <Button variant='outline' onClick={() => void adminApi.syncInvoices().then(() => load()).then(() => setMessage('Unsynced invoices pushed to stock API'))}>Sync Pending Invoices</Button>
          </div>
          <Table><TableHeader><TableRow><TableHead>Invoice</TableHead><TableHead>Order</TableHead><TableHead>Synced</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
            <TableBody>{rows.map((row) => <TableRow key={row.id}><TableCell>{row.invoice_number}</TableCell><TableCell>{row.order_number}</TableCell><TableCell>{row.synced ? 'Yes' : 'No'}</TableCell><TableCell><div className='flex gap-2'><a className='inline-flex h-8 items-center rounded-md border px-3 text-sm' href={`${API_BASE_URL}/api/invoices/${row.id}/pdf`} target='_blank' rel='noreferrer'>View PDF</a><Button variant='outline' size='sm' onClick={() => void adminApi.resendInvoice(row.id).then(() => setMessage('Invoice emailed'))}>Resend Email</Button></div></TableCell></TableRow>)}</TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Invoices;
