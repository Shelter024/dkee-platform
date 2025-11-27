'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { formatCurrencyGHS } from '@/lib/utils';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Search,
  DollarSign,
  User,
  Package,
  X,
  Receipt,
} from 'lucide-react';

interface SparePart {
  id: string;
  name: string;
  partNumber: string;
  category: string;
  price: number;
  stock: number;
}

interface CartItem extends SparePart {
  quantity: number;
}

interface Customer {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
}

export default function PartsSalesPage() {
  const { data: session } = useSession();
  const [parts, setParts] = useState<SparePart[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    fetchParts();
    fetchCustomers();
  }, []);

  const fetchParts = async () => {
    try {
      const res = await fetch('/api/parts');
      if (res.ok) {
        const data = await res.json();
        setParts(data.filter((p: SparePart) => p.stock > 0));
      }
    } catch (error) {
      setError('Failed to load parts');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      }
    } catch (error) {
      console.error('Failed to load customers');
    }
  };

  const addToCart = (part: SparePart) => {
    const existingItem = cart.find((item) => item.id === part.id);
    if (existingItem) {
      if (existingItem.quantity < part.stock) {
        setCart(
          cart.map((item) =>
            item.id === part.id ? { ...item, quantity: item.quantity + 1 } : item
          )
        );
      } else {
        setError(`Maximum stock available: ${part.stock}`);
        setTimeout(() => setError(''), 3000);
      }
    } else {
      setCart([...cart, { ...part, quantity: 1 }]);
    }
  };

  const updateQuantity = (partId: string, change: number) => {
    setCart(
      cart
        .map((item) => {
          if (item.id === partId) {
            const newQuantity = item.quantity + change;
            if (newQuantity > item.stock) {
              setError(`Maximum stock available: ${item.stock}`);
              setTimeout(() => setError(''), 3000);
              return item;
            }
            return { ...item, quantity: newQuantity };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (partId: string) => {
    setCart(cart.filter((item) => item.id !== partId));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomer('');
    setDiscount(0);
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    return subtotal - discount;
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      setError('Cart is empty');
      return;
    }

    if (!selectedCustomer) {
      setError('Please select a customer');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/sales/parts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomer,
          items: cart.map((item) => ({
            partId: item.id,
            quantity: item.quantity,
            price: item.price,
          })),
          paymentMethod,
          discount,
          subtotal: calculateSubtotal(),
          total: calculateTotal(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to process sale');
      }

      setSuccess(`Sale completed! Receipt #${data.receiptNumber}`);
      clearCart();
      fetchParts(); // Refresh parts to update stock
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredParts = parts.filter(
    (part) =>
      part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCustomers = customers.filter((customer) =>
    customer.user.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.user.email.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.user.phone?.toLowerCase().includes(customerSearch.toLowerCase())
  );

  if (loading) {
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingCart className="w-8 h-8" />
            Spare Parts Sales
          </h1>
          <p className="text-gray-600 mt-1">Point of Sale - Direct parts sales</p>
        </div>
        {cart.length > 0 && (
          <Badge variant="info" className="text-lg px-4 py-2">
            {cart.length} items in cart
          </Badge>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-700 hover:text-red-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess('')} className="text-green-700 hover:text-green-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Parts Catalog */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search parts by name, part number, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredParts.length === 0 ? (
              <Card className="col-span-2 p-12 text-center">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No parts available</p>
              </Card>
            ) : (
              filteredParts.map((part) => (
                <Card key={part.id} className="p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{part.name}</h3>
                      <p className="text-sm text-gray-600 font-mono">{part.partNumber}</p>
                      <p className="text-xs text-gray-500">{part.category}</p>
                    </div>
                    <Badge variant={part.stock > 10 ? 'success' : 'warning'}>
                      {part.stock} in stock
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <span className="text-lg font-bold text-brand-navy-600">
                      {formatCurrencyGHS(part.price)}
                    </span>
                    <Button onClick={() => addToCart(part)} size="sm">
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Cart & Checkout */}
        <div className="space-y-4">
          {/* Customer Selection */}
          <Card className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <User className="w-5 h-5" />
              Customer
            </h3>
            <Input
              type="text"
              placeholder="Search customer..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              className="mb-2"
            />
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-navy-500 focus:border-transparent"
            >
              <option value="">Select customer...</option>
              {filteredCustomers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.user.name} - {customer.user.phone}
                </option>
              ))}
            </select>
          </Card>

          {/* Cart */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Cart
              </h3>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Clear
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Cart is empty</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.id} className="border-b pb-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.partNumber}</p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="p-1 rounded border hover:bg-gray-100"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="p-1 rounded border hover:bg-gray-100"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="font-semibold">
                        {formatCurrencyGHS(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Checkout */}
          {cart.length > 0 && (
            <Card className="p-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="Cash">Cash</option>
                  <option value="Mobile Money">Mobile Money</option>
                  <option value="Card">Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount (GHS)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>

              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatCurrencyGHS(calculateSubtotal())}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount:</span>
                    <span className="font-medium text-red-600">
                      -{formatCurrencyGHS(discount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span className="text-brand-navy-600">
                    {formatCurrencyGHS(calculateTotal())}
                  </span>
                </div>
              </div>

              <Button
                onClick={handleCheckout}
                disabled={submitting || !selectedCustomer}
                className="w-full flex items-center justify-center gap-2"
              >
                <DollarSign className="w-5 h-5" />
                {submitting ? 'Processing...' : 'Complete Sale'}
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
