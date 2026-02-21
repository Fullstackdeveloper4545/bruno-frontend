import { useEffect, useState } from 'react';
import { PackageSearch } from 'lucide-react';

import { PageHeader } from '@/components/admin/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { adminApi } from '@/lib/adminApi';

type Shipment = {
  id: number;
  order_id: number;
  order_number: string;
  provider: string;
  status: string;
  tracking_code: string;
  label_url: string;
  created_at: string;
};

const Shipping = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [orderId, setOrderId] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    const rows = await adminApi.listShipments() as Shipment[];
    setShipments(rows);
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className='space-y-8'>
      <PageHeader
        title='Shipping Management'
        description='CTT integration: label generation, tracking retrieval, and shipment status updates.'
        actions={
          <Button variant='outline' onClick={() => void load()}>
            Refresh Shipments
          </Button>
        }
      />

      {message ? <p className='text-sm'>{message}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle>Generate CTT Label</CardTitle>
        </CardHeader>
        <CardContent className='flex flex-col gap-3 sm:flex-row'>
          <Input placeholder='Order ID' value={orderId} onChange={(e) => setOrderId(e.target.value)} />
          <Button
            onClick={() =>
              void adminApi
                .generateShippingLabel(Number(orderId))
                .then(() => load())
                .then(() => setMessage('Label generated'))
                .catch((e) => setMessage(e instanceof Error ? e.message : 'Failed to generate label'))
            }
          >
            Generate Label
          </Button>
          <Button
            variant='outline'
            onClick={() =>
              void adminApi
                .getOrderTracking(Number(orderId))
                .then((result) => setMessage(`Tracking: ${(result as { tracking_code?: string }).tracking_code || 'N/A'}`))
                .catch((e) => setMessage(e instanceof Error ? e.message : 'Tracking lookup failed'))
            }
          >
            <PackageSearch className='mr-2 h-4 w-4' />
            Track Order
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Shipment Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shipment</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tracking</TableHead>
                <TableHead>Label</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shipments.map((shipment) => (
                <TableRow key={shipment.id}>
                  <TableCell>{shipment.id}</TableCell>
                  <TableCell>{shipment.order_number}</TableCell>
                  <TableCell>{shipment.provider}</TableCell>
                  <TableCell>{shipment.status}</TableCell>
                  <TableCell>{shipment.tracking_code || '-'}</TableCell>
                  <TableCell>
                    {shipment.label_url ? (
                      <a href={shipment.label_url} target='_blank' rel='noreferrer' className='text-primary underline'>
                        Open
                      </a>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Shipping;
