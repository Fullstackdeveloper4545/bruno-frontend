import { useEffect, useState } from 'react';
import { FileDown } from 'lucide-react';

import { PageHeader } from '@/components/admin/PageHeader';
import { ConfirmDeleteButton } from '@/components/admin/ConfirmDeleteButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { adminApi } from '@/lib/adminApi';

type Store = { id: number; name: string };
type Schedule = {
  id: number;
  store_id: number;
  store_name: string;
  report_type: string;
  send_time_utc: string;
  recipient_email: string;
  is_active: boolean;
  last_sent_date: string | null;
};

const Reports = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [form, setForm] = useState({ store_id: '', send_time_utc: '09:00', recipient_email: '' });
  const [message, setMessage] = useState('');

  const load = async () => {
    const [storeRows, scheduleRows] = await Promise.all([
      adminApi.listStores() as Promise<Store[]>,
      adminApi.listReportSchedules() as Promise<Schedule[]>,
    ]);
    setStores(storeRows);
    setSchedules(scheduleRows);
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className='space-y-8'>
      <PageHeader
        title='Reports and Analytics'
        description='Configure daily pending-order reports by store and UTC time.'
        actions={
          <Button variant='outline' onClick={() => void adminApi.runReportsNow().then(() => setMessage('Ran due report schedules now'))}>
            <FileDown className='mr-2 h-4 w-4' />
            Run Due Reports
          </Button>
        }
      />

      {message ? <p className='text-sm'>{message}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle>Create Daily Report Schedule</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-3 md:grid-cols-4'>
          <select
            className='rounded-md border bg-background px-3 py-2 text-sm'
            value={form.store_id}
            onChange={(e) => setForm((prev) => ({ ...prev, store_id: e.target.value }))}
          >
            <option value=''>Select store</option>
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>
          <Input
            placeholder='HH:MM (UTC)'
            value={form.send_time_utc}
            onChange={(e) => setForm((prev) => ({ ...prev, send_time_utc: e.target.value }))}
          />
          <Input
            placeholder='recipient@email.com'
            value={form.recipient_email}
            onChange={(e) => setForm((prev) => ({ ...prev, recipient_email: e.target.value }))}
          />
          <Button
            onClick={() =>
              void adminApi
                .createReportSchedule({
                  store_id: Number(form.store_id),
                  send_time_utc: form.send_time_utc,
                  recipient_email: form.recipient_email,
                  report_type: 'pending_orders',
                  is_active: true,
                })
                .then(() => load())
                .then(() => setForm({ store_id: '', send_time_utc: '09:00', recipient_email: '' }))
                .then(() => setMessage('Schedule saved'))
            }
          >
            Save
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Report Schedules</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Store</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>UTC Time</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Last Sent</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.map((schedule) => (
                <TableRow key={schedule.id}>
                  <TableCell>{schedule.id}</TableCell>
                  <TableCell>{schedule.store_name}</TableCell>
                  <TableCell>{schedule.report_type}</TableCell>
                  <TableCell>{schedule.send_time_utc}</TableCell>
                  <TableCell>{schedule.recipient_email}</TableCell>
                  <TableCell>{schedule.last_sent_date || '-'}</TableCell>
                  <TableCell className='flex gap-2'>
                    <Button variant='outline' size='sm' onClick={() => void adminApi.runReportsNow(schedule.id).then(() => setMessage(`Schedule ${schedule.id} executed`))}>
                      Run
                    </Button>
                    <ConfirmDeleteButton
                      entityName={`report schedule #${schedule.id}`}
                      onConfirm={() => adminApi.deleteReportSchedule(schedule.id).then(load)}
                    />
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

export default Reports;
