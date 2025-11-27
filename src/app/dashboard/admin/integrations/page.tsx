import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { isElevatedRole } from '@/lib/roles';

export default async function IntegrationsPage() {
  const session = await getServerSession(authOptions);
  if (!session || !isElevatedRole(session.user.role)) {
    redirect('/login');
  }
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Integrations</h1>
      <p className="text-gray-600">Placeholder interface. Will configure external services (hosting, cloud providers, AI, payment, messaging) via stored JSON configs.</p>
    </div>
  );
}