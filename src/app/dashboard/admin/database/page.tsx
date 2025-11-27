import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Database, ExternalLink, Shield, AlertCircle } from 'lucide-react';

export default async function DatabaseManagementPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Only ADMIN and CEO can access database management
  if (session.user.role !== 'ADMIN' && session.user.role !== 'CEO') {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            <span>You do not have permission to access database management.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Database className="w-8 h-8" />
          Database Management
        </h1>
        <p className="text-gray-600 mt-1">Direct access to database tables and records</p>
      </div>

      {/* Warning Card */}
      <Card className="p-6 bg-yellow-50 border-yellow-200">
        <div className="flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-yellow-900 mb-2">
              Caution: Direct Database Access
            </h3>
            <p className="text-yellow-800 mb-4">
              Direct database modifications can affect data integrity and application functionality.
              Always ensure you understand the impact of changes before committing them.
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-yellow-900">
              <li>Backup database before making significant changes</li>
              <li>Use transactions for complex operations</li>
              <li>Verify relationships before deleting records</li>
              <li>Test changes in development environment first</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Prisma Studio Access */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-brand-navy-100 rounded-lg">
            <Database className="w-8 h-8 text-brand-navy-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Prisma Studio</h2>
            <p className="text-gray-600 mb-4">
              Prisma Studio provides a powerful visual interface to view and edit data in your database.
              It offers a safe, intuitive way to manage all your tables and relationships.
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">Features:</h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-brand-navy-600 rounded-full"></span>
                  Browse all database tables
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-brand-navy-600 rounded-full"></span>
                  Create, read, update, delete records
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-brand-navy-600 rounded-full"></span>
                  Filter and search data
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-brand-navy-600 rounded-full"></span>
                  Navigate relationships
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-brand-navy-600 rounded-full"></span>
                  Real-time data visualization
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-brand-navy-600 rounded-full"></span>
                  Safe transaction handling
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">How to Access:</h4>
                <ol className="space-y-2 text-sm text-gray-700">
                  <li className="flex gap-2">
                    <span className="font-semibold">1.</span>
                    <span>Open a terminal in your project directory</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-semibold">2.</span>
                    <span>Run the command: <code className="bg-gray-200 px-2 py-1 rounded">npx prisma studio</code></span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-semibold">3.</span>
                    <span>Prisma Studio will open in your browser at <code className="bg-gray-200 px-2 py-1 rounded">http://localhost:5555</code></span>
                  </li>
                </ol>
              </div>

              <Button
                onClick={() => window.open('http://localhost:5555', '_blank')}
                className="flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Open Prisma Studio
              </Button>
              <p className="text-xs text-gray-500">
                Note: Prisma Studio must be running in your terminal for this link to work
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-4 hover:shadow-lg transition-shadow">
          <h3 className="font-semibold text-gray-900 mb-2">User Management</h3>
          <p className="text-sm text-gray-600 mb-3">
            View and manage user accounts, roles, and permissions
          </p>
          <p className="text-xs text-gray-500">
            Tables: <code className="bg-gray-100 px-1 rounded">User</code>, <code className="bg-gray-100 px-1 rounded">Customer</code>
          </p>
        </Card>

        <Card className="p-4 hover:shadow-lg transition-shadow">
          <h3 className="font-semibold text-gray-900 mb-2">Services & Vehicles</h3>
          <p className="text-sm text-gray-600 mb-3">
            Manage automotive services, vehicles, and job history
          </p>
          <p className="text-xs text-gray-500">
            Tables: <code className="bg-gray-100 px-1 rounded">Vehicle</code>, <code className="bg-gray-100 px-1 rounded">AutomotiveService</code>, <code className="bg-gray-100 px-1 rounded">JobHistory</code>
          </p>
        </Card>

        <Card className="p-4 hover:shadow-lg transition-shadow">
          <h3 className="font-semibold text-gray-900 mb-2">Inventory</h3>
          <p className="text-sm text-gray-600 mb-3">
            Manage spare parts inventory and sales records
          </p>
          <p className="text-xs text-gray-500">
            Tables: <code className="bg-gray-100 px-1 rounded">SparePart</code>, <code className="bg-gray-100 px-1 rounded">ServiceSparePart</code>
          </p>
        </Card>

        <Card className="p-4 hover:shadow-lg transition-shadow">
          <h3 className="font-semibold text-gray-900 mb-2">Financial</h3>
          <p className="text-sm text-gray-600 mb-3">
            View and manage invoices, receipts, and payments
          </p>
          <p className="text-xs text-gray-500">
            Tables: <code className="bg-gray-100 px-1 rounded">Invoice</code>, <code className="bg-gray-100 px-1 rounded">Receipt</code>, <code className="bg-gray-100 px-1 rounded">Payment</code>
          </p>
        </Card>

        <Card className="p-4 hover:shadow-lg transition-shadow">
          <h3 className="font-semibold text-gray-900 mb-2">Properties</h3>
          <p className="text-sm text-gray-600 mb-3">
            Manage property listings and inquiries
          </p>
          <p className="text-xs text-gray-500">
            Tables: <code className="bg-gray-100 px-1 rounded">Property</code>, <code className="bg-gray-100 px-1 rounded">PropertyInquiry</code>
          </p>
        </Card>

        <Card className="p-4 hover:shadow-lg transition-shadow">
          <h3 className="font-semibold text-gray-900 mb-2">Content</h3>
          <p className="text-sm text-gray-600 mb-3">
            Manage blog posts, pages, and media content
          </p>
          <p className="text-xs text-gray-500">
            Tables: <code className="bg-gray-100 px-1 rounded">BlogPost</code>, <code className="bg-gray-100 px-1 rounded">Page</code>
          </p>
        </Card>
      </div>

      {/* Terminal Command Reference */}
      <Card className="p-6 bg-gray-50">
        <h3 className="font-semibold text-gray-900 mb-3">Terminal Commands Reference</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-3">
            <code className="bg-gray-800 text-green-400 px-3 py-1 rounded flex-1 font-mono">
              npx prisma studio
            </code>
            <span className="text-gray-600">Launch Prisma Studio</span>
          </div>
          <div className="flex items-start gap-3">
            <code className="bg-gray-800 text-green-400 px-3 py-1 rounded flex-1 font-mono">
              npx prisma db push
            </code>
            <span className="text-gray-600">Push schema changes to database</span>
          </div>
          <div className="flex items-start gap-3">
            <code className="bg-gray-800 text-green-400 px-3 py-1 rounded flex-1 font-mono">
              npx prisma migrate dev
            </code>
            <span className="text-gray-600">Create and apply migration</span>
          </div>
          <div className="flex items-start gap-3">
            <code className="bg-gray-800 text-green-400 px-3 py-1 rounded flex-1 font-mono">
              npx prisma db seed
            </code>
            <span className="text-gray-600">Seed database with initial data</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
