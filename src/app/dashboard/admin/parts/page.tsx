import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import PartsClient from './PartsClient';

export default async function SparePartsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/login');
  }

  // Check if user has access to parts inventory
  const hasAccess =
    session.user.role === 'ADMIN' ||
    session.user.role === 'STAFF_AUTO' ||
    session.user.role === 'CEO' ||
    session.user.role === 'MANAGER';

  if (!hasAccess) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          You do not have permission to access the spare parts inventory.
        </div>
      </div>
    );
  }

  return <PartsClient />;
}
