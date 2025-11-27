'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { SparePartSelector } from '@/components/ui/SparePartSelector';
import { Plus, Edit, Trash2, Search, Package, X } from 'lucide-react';

interface SparePart {
  id: string;
  name: string;
  partNumber: string;
  category: string;
  description: string | null;
  price: number;
  stock: number;
  supplier: string | null;
  createdAt: string;
}

export default function SparePartsPage() {
  const { data: session } = useSession();
  const [parts, setParts] = useState<SparePart[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPart, setEditingPart] = useState<SparePart | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    partNumber: '',
    category: '',
    description: '',
    price: '',
    stock: '',
    supplier: '',
  });
  const [error, setError] = useState('');

  // Check if user can edit inventory
  const canEdit =
    session?.user.role === 'ADMIN' ||
    session?.user.role === 'STAFF_AUTO' ||
    session?.user.role === 'CEO' ||
    session?.user.role === 'MANAGER';

  useEffect(() => {
    fetchParts();
  }, []);

  const fetchParts = async () => {
    try {
      const res = await fetch('/api/parts');
      if (res.ok) {
        const data = await res.json();
        setParts(data);
      }
    } catch (error) {
      setError('Failed to load spare parts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const url = editingPart ? `/api/parts/${editingPart.id}` : '/api/parts';
      const method = editingPart ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save part');
      }

      await fetchParts();
      handleCloseModal();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEdit = (part: SparePart) => {
    setEditingPart(part);
    setFormData({
      name: part.name,
      partNumber: part.partNumber,
      category: part.category,
      description: part.description || '',
      price: part.price.toString(),
      stock: part.stock.toString(),
      supplier: part.supplier || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this part?')) return;

    try {
      const res = await fetch(`/api/parts/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete part');
      await fetchParts();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPart(null);
    setFormData({
      name: '',
      partNumber: '',
      category: '',
      description: '',
      price: '',
      stock: '',
      supplier: '',
    });
    setError('');
  };

  const filteredParts = parts.filter(
    (part) =>
      part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-8 h-8" />
            Spare Parts Inventory
          </h1>
          <p className="text-gray-600 mt-1">Manage automotive spare parts and supplies</p>
        </div>
        {canEdit && (
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Part
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <p className="text-sm text-gray-600">Total Parts</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{parts.length}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-600">In Stock</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {parts.filter((p) => p.stock > 10).length}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-600">Low Stock</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">
            {parts.filter((p) => p.stock > 0 && p.stock <= 10).length}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-600">Out of Stock</p>
          <p className="text-2xl font-bold text-red-600 mt-1">
            {parts.filter((p) => p.stock === 0).length}
          </p>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search by name, part number, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
      </Card>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Parts Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Part Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Price (GHS)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Supplier
                </th>
                {canEdit && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredParts.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 7 : 6} className="px-6 py-12 text-center text-gray-500">
                    No spare parts found
                  </td>
                </tr>
              ) : (
                filteredParts.map((part) => (
                  <tr key={part.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-mono">{part.partNumber}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{part.name}</div>
                      {part.description && (
                        <div className="text-sm text-gray-500">{part.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{part.category}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {part.price.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={
                          part.stock > 10 ? 'success' : part.stock > 0 ? 'warning' : 'danger'
                        }
                      >
                        {part.stock}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{part.supplier || 'N/A'}</td>
                    {canEdit && (
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => handleEdit(part)}
                          className="text-brand-navy-600 hover:text-brand-navy-800"
                        >
                          <Edit className="w-4 h-4 inline" />
                        </button>
                        {(session?.user.role === 'ADMIN' || session?.user.role === 'CEO') && (
                          <button
                            onClick={() => handleDelete(part.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4 inline" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add/Edit Modal */}
      {showModal && canEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingPart ? 'Edit Part' : 'Add New Part'}
                </h2>
                <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <SparePartSelector
                  defaultCategory={formData.category}
                  defaultPartName={formData.name}
                  onCategoryChange={(category) => setFormData({ ...formData, category })}
                  onPartNameChange={(name) => setFormData({ ...formData, name })}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Part Number"
                    value={formData.partNumber}
                    onChange={(e) => setFormData({ ...formData, partNumber: e.target.value })}
                    required
                    placeholder="e.g., OE-12345"
                  />
                  <Input
                    label="Price (GHS)"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                    placeholder="0.00"
                  />
                  <Input
                    label="Stock Quantity"
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    required
                    placeholder="0"
                  />
                  <Input
                    label="Supplier"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    placeholder="Supplier name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-navy-500 focus:border-transparent"
                    placeholder="Part description and specifications..."
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button type="submit" className="flex-1">
                    {editingPart ? 'Update' : 'Add'} Part
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCloseModal}>
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
