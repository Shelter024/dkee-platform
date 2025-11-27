'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Loader2, Database, KeyRound, UserPlus, CheckCircle, AlertCircle, RefreshCcw } from 'lucide-react';

interface ApplyResponse {
  ok: boolean;
  dbPush?: string;
  seed?: string;
  error?: string;
  step?: string;
  stdout?: string;
  stderr?: string;
}

type Step = 1 | 2 | 3 | 4;

export default function SetupWizardPage() {
  const [step, setStep] = useState<Step>(1);
  const [databaseUrl, setDatabaseUrl] = useState('');
  const [nextAuthSecret, setNextAuthSecret] = useState('');
  const [encryptionKey, setEncryptionKey] = useState('');
  const [adminEmail, setAdminEmail] = useState('admin@dkexecutive.com');
  const [adminPassword, setAdminPassword] = useState('ChangeMe123!');
  const [adminName, setAdminName] = useState('Admin User');
  const [testingDb, setTestingDb] = useState(false);
  const [dbTestResult, setDbTestResult] = useState<{ ok: boolean; error?: string } | null>(null);
  const [applying, setApplying] = useState(false);
  const [applyResult, setApplyResult] = useState<ApplyResponse | null>(null);

  function generateSecret(bytes = 32) {
    const array = new Uint8Array(bytes);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array)).replace(/=+$/,'');
  }

  async function testDb() {
    setTestingDb(true);
    setDbTestResult(null);
    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test-db', databaseUrl }),
      });
      const data = await res.json();
      setDbTestResult(data);
    } catch (e: any) {
      setDbTestResult({ ok: false, error: e.message });
    } finally {
      setTestingDb(false);
    }
  }

  async function apply() {
    setApplying(true);
    setApplyResult(null);
    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'apply',
          databaseUrl,
            nextAuthSecret,
            encryptionKey,
            adminEmail,
            adminPassword,
            adminName,
        }),
      });
      const data: ApplyResponse = await res.json();
      setApplyResult(data);
    } catch (e: any) {
      setApplyResult({ ok: false, error: e.message });
    } finally {
      setApplying(false);
    }
  }

  function canProceedFromStep1() {
    return dbTestResult?.ok;
  }

  function canProceedFromStep2() {
    return nextAuthSecret.length >= 16 && encryptionKey.length >= 16;
  }

  function canApply() {
    return databaseUrl && nextAuthSecret && encryptionKey && adminEmail && adminPassword && adminName;
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-6 flex flex-col items-center">
      <div className="w-full max-w-3xl space-y-6">
        <h1 className="text-3xl font-bold text-neutral-900">Initial Setup Wizard</h1>
        <p className="text-neutral-600">Guide the platform through first-time configuration. After completion, restart the server and proceed to settings to configure integrations.</p>

        <div className="flex items-center gap-2 text-sm">
          {[1,2,3,4].map(s => (
            <div key={s} className={`px-3 py-1 rounded-full border ${step === s ? 'bg-brand-navy-600 text-white border-brand-navy-600' : 'bg-white text-neutral-600'}`}>Step {s}</div>
          ))}
        </div>

        {step === 1 && (
          <Card>
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2"><Database size={20} /> Database Connection</h2>
              <p className="text-sm text-neutral-600">Provide a PostgreSQL connection string. Format: <code className="bg-neutral-100 px-1 py-0.5 rounded text-xs">postgresql://user:password@host:port/dbname?schema=public</code></p>
              <Input value={databaseUrl} onChange={e=>{setDatabaseUrl(e.target.value); setDbTestResult(null);}} placeholder="postgresql://..." />
              <div className="flex gap-2">
                <Button disabled={!databaseUrl || testingDb} onClick={testDb} variant="primary">
                  {testingDb ? <Loader2 size={16} className="animate-spin" /> : 'Test Connection'}
                </Button>
                {dbTestResult && dbTestResult.ok && (
                  <span className="flex items-center text-green-600 text-sm"><CheckCircle size={16} className="mr-1" /> Connection OK</span>
                )}
                {dbTestResult && !dbTestResult.ok && (
                  <span className="flex items-center text-red-600 text-sm"><AlertCircle size={16} className="mr-1" /> {dbTestResult.error}</span>
                )}
              </div>
              <div className="flex justify-end">
                <Button disabled={!canProceedFromStep1()} onClick={()=>setStep(2)}>Continue</Button>
              </div>
            </div>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2"><KeyRound size={20} /> Security Secrets</h2>
              <p className="text-sm text-neutral-600">Generate strong secrets. They will be written to <code className="bg-neutral-100 px-1 py-0.5 rounded text-xs">.env</code>.</p>
              <div className="space-y-2">
                <label className="text-xs font-medium text-neutral-700">NEXTAUTH_SECRET</label>
                <div className="flex gap-2">
                  <Input value={nextAuthSecret} onChange={e=>setNextAuthSecret(e.target.value)} placeholder="Generate or enter secret" />
                  <Button variant="outline" onClick={()=>setNextAuthSecret(generateSecret(48))}>Generate</Button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-neutral-700">SETTINGS_ENCRYPTION_KEY</label>
                <div className="flex gap-2">
                  <Input value={encryptionKey} onChange={e=>setEncryptionKey(e.target.value)} placeholder="Generate or enter encryption key" />
                  <Button variant="outline" onClick={()=>setEncryptionKey(generateSecret(48))}>Generate</Button>
                </div>
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={()=>setStep(1)}>Back</Button>
                <Button disabled={!canProceedFromStep2()} onClick={()=>setStep(3)}>Continue</Button>
              </div>
            </div>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2"><UserPlus size={20} /> Admin Account</h2>
              <p className="text-sm text-neutral-600">Provide initial admin credentials. These seed only once.</p>
              <Input value={adminEmail} onChange={e=>setAdminEmail(e.target.value)} placeholder="Admin Email" />
              <Input value={adminName} onChange={e=>setAdminName(e.target.value)} placeholder="Admin Name" />
              <Input type="password" value={adminPassword} onChange={e=>setAdminPassword(e.target.value)} placeholder="Admin Password" />
              <div className="flex justify-between">
                <Button variant="outline" onClick={()=>setStep(2)}>Back</Button>
                <Button onClick={()=>setStep(4)}>Review</Button>
              </div>
            </div>
          </Card>
        )}

        {step === 4 && (
          <Card>
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2"><CheckCircle size={20} /> Review & Apply</h2>
              <div className="bg-neutral-100 rounded p-4 text-sm space-y-2">
                <p><span className="font-semibold">Database:</span> {databaseUrl}</p>
                <p><span className="font-semibold">NEXTAUTH_SECRET:</span> {nextAuthSecret.slice(0,12)}...</p>
                <p><span className="font-semibold">SETTINGS_ENCRYPTION_KEY:</span> {encryptionKey.slice(0,12)}...</p>
                <p><span className="font-semibold">Admin Email:</span> {adminEmail}</p>
                <p><span className="font-semibold">Admin Name:</span> {adminName}</p>
              </div>
              <p className="text-xs text-neutral-500">This will: 1) Write .env 2) Run prisma db push 3) Seed minimal admin user. Afterwards restart the dev server.</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={()=>setStep(3)}>Back</Button>
                <Button disabled={!canApply() || applying} onClick={apply} variant="primary">
                  {applying ? <Loader2 size={16} className="animate-spin" /> : 'Apply Configuration'}
                </Button>
              </div>
              {applyResult && (
                <div className={`p-4 rounded border text-sm ${applyResult.ok ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                  {applyResult.ok ? (
                    <div className="space-y-2">
                      <p className="font-semibold flex items-center gap-1"><CheckCircle size={16} /> Setup completed.</p>
                      <p>Restart server now:</p>
                      <pre className="bg-neutral-900 text-neutral-100 p-3 rounded text-xs overflow-auto">npm run dev</pre>
                      <p className="text-xs">Then visit /dashboard/admin/settings to finish service configuration.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="font-semibold flex items-center gap-1"><AlertCircle size={16} /> Setup failed at {applyResult.step}.</p>
                      <p>{applyResult.error}</p>
                      {applyResult.stderr && <details><summary className="cursor-pointer">Details</summary><pre className="mt-2 text-xs whitespace-pre-wrap">{applyResult.stderr}</pre></details>}
                    </div>
                  )}
                </div>
              )}
              {applyResult?.ok && (
                <Button variant="outline" onClick={()=>window.location.reload()} className="flex items-center gap-2"><RefreshCcw size={16} /> Re-check</Button>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
