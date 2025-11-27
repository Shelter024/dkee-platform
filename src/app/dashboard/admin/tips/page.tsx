import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { isElevatedRole } from '@/lib/roles';

export default async function TipsPage() {
  const session = await getServerSession(authOptions);
  if (!session || !isElevatedRole(session.user.role)) {
    redirect('/login');
  }
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tips & Advice</h1>
      <p className="text-gray-600">Placeholder interface. Will curate automotive maintenance and property care guidance tailored to Ghanaian conditions.</p>
    </div>
  );
}