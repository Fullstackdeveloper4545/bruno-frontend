import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/admin/PageHeader';
import { adminApi } from '@/lib/adminApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

type Integration = { base_url: string; api_key: string; webhook_secret: string; is_active: boolean; last_sync_at?: string };

const Integrations = () => {
  const [settings, setSettings] = useState<Integration>({ base_url: '', api_key: '', webhook_secret: '', is_active: false });
  const [logs, setLogs] = useState<Array<{ id: number; mode: string; status: string; created_at: string }>>([]);
  const [message, setMessage] = useState('');

  const load = async () => {
    const [s, l] = await Promise.all([
      adminApi.getIntegrationSettings() as Promise<Integration>,
      adminApi.getSyncLogs() as Promise<Array<{ id: number; mode: string; status: string; created_at: string }>>,
    ]);
    setSettings({ ...settings, ...s });
    setLogs(l);
  };

  useEffect(() => { void load(); }, []);

  return (
    <div className='space-y-6'>
      <PageHeader title='Integration Settings' description='Toggle integration, manual sync, and webhook security.' />
      {message ? <p className='text-sm'>{message}</p> : null}

      <Card>
        <CardHeader><CardTitle>Stock Integration</CardTitle></CardHeader>
        <CardContent className='grid gap-3 md:grid-cols-2'>
          <Input placeholder='API Base URL' value={settings.base_url || ''} onChange={(e) => setSettings((p) => ({ ...p, base_url: e.target.value }))} />
          <Input placeholder='API Key' value={settings.api_key || ''} onChange={(e) => setSettings((p) => ({ ...p, api_key: e.target.value }))} />
          <Input placeholder='Webhook Secret' value={settings.webhook_secret || ''} onChange={(e) => setSettings((p) => ({ ...p, webhook_secret: e.target.value }))} />
          <div className='flex items-center gap-2'><span>Integration ON</span><Switch checked={settings.is_active} onCheckedChange={(checked) => setSettings((p) => ({ ...p, is_active: checked }))} /></div>
          <Button onClick={() => void adminApi.updateIntegrationSettings(settings).then(() => setMessage('Settings saved'))}>Save</Button>
          <Button variant='outline' onClick={() => void adminApi.manualSync().then(() => load()).then(() => setMessage('Manual sync completed'))}>Manual Sync</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Sync Logs</CardTitle></CardHeader>
        <CardContent className='space-y-2'>
          {logs.map((log) => <p key={log.id} className='text-sm'>{log.created_at} | {log.mode} | {log.status}</p>)}
        </CardContent>
      </Card>
    </div>
  );
};

export default Integrations;
