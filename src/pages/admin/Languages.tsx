import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/admin/PageHeader';
import { adminApi } from '@/lib/adminApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

const Languages = () => {
  const [selected, setSelected] = useState<string[]>(['pt', 'es']);
  const [message, setMessage] = useState('');

  useEffect(() => {
    void adminApi.getLanguages().then((data) => setSelected((data as { languages: string[] }).languages || ['pt', 'es']));
  }, []);

  const toggle = (lang: string) => {
    setSelected((prev) => prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]);
  };

  return (
    <div className='space-y-6'>
      <PageHeader title='Language Management' description='PT/ES i18n activation for storefront and admin.' />
      {message ? <p className='text-sm'>{message}</p> : null}
      <Card>
        <CardHeader><CardTitle>Enabled Languages</CardTitle></CardHeader>
        <CardContent className='space-y-3'>
          {['pt', 'es'].map((lang) => (
            <label key={lang} className='flex items-center gap-2 text-sm'>
              <Checkbox checked={selected.includes(lang)} onCheckedChange={() => toggle(lang)} />
              {lang.toUpperCase()}
            </label>
          ))}
          <Button onClick={() => void adminApi.setLanguages(selected).then(() => setMessage('Language config saved'))}>Save</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Languages;
