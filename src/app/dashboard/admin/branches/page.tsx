import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { isElevatedRole } from '@/lib/roles';
import BranchesClient from './BranchesClient';

export default async function BranchesPage() {
  const session = await getServerSession(authOptions);
  if (!session || !isElevatedRole(session.user.role)) {
    redirect('/login');
  }
  return <BranchesClient />;
}