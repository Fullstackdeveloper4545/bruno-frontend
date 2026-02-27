import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';

import { PageHeader } from '@/components/admin/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { adminApi } from '@/lib/adminApi';

type Payment = {
  id: number;
  order_number: string;
  method: string;
  provider: string;
  amount: string;
  status: string;
  created_at: string;
};

type WebhookLog = {
  id: number;
  provider: string;
  event_type: string;
  processed: boolean;
  received_at: string;
  processing_error: string | null;
};

const PaymentManagement = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookLog[]>([]);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setError('');
      const [paymentRows, webhookRows] = await Promise.all([
        adminApi.listPayments() as Promise<Payment[]>,
        adminApi.listPaymentWebhookLogs() as Promise<WebhookLog[]>,
      ]);
      setPayments(paymentRows);
      setWebhooks(webhookRows);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load payment data');
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className='space-y-8'>
      <PageHeader
        title='Payment Management'
        description='IfthenPay (MB Way, MB Reference, Credit Card) and Klarna with webhook-driven confirmation.'
        actions={
          <Button variant='outline' onClick={() => void load()}>
            <RefreshCw className='mr-2 h-4 w-4' />
            Refresh
          </Button>
        }
      />

      {error ? <p className='text-sm text-destructive'>{error}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle>Payment Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{payment.id}</TableCell>
                  <TableCell>{payment.order_number}</TableCell>
                  <TableCell>{payment.provider}</TableCell>
                  <TableCell>{payment.method}</TableCell>
                  <TableCell>EUR {Number(payment.amount).toFixed(2)}</TableCell>
                  <TableCell>{payment.status}</TableCell>
                  <TableCell>{new Date(payment.created_at).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Webhook Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Processed</TableHead>
                <TableHead>Error</TableHead>
                <TableHead>Received</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {webhooks.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{log.id}</TableCell>
                  <TableCell>{log.provider}</TableCell>
                  <TableCell>{log.event_type}</TableCell>
                  <TableCell>{log.processed ? 'Yes' : 'No'}</TableCell>
                  <TableCell>{log.processing_error || '-'}</TableCell>
                  <TableCell>{new Date(log.received_at).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Webhook Endpoints</CardTitle>
        </CardHeader>
        <CardContent className='space-y-2 text-sm text-muted-foreground'>
          <p>`POST /api/payments/webhooks/ifthenpay`</p>
          <p>`POST /api/payments/webhooks/klarna`</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentManagement;
