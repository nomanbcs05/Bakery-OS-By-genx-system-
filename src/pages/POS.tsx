import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, Banknote, Search } from 'lucide-react';
import type { SaleItem, PaymentMethod } from '@/types';
import { Navigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import ReceiptDialog from '@/components/ReceiptDialog';

interface POSProps {
  branch: 'branch_1' | 'branch_2';
}

export default function POS({ branch }: POSProps) {
  const { currentUser, products, stock, createSale, getProductById, getBranchStock } = useApp();

  if (!currentUser) return <Navigate to="/login" replace />;
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [receiptData, setReceiptData] = useState<{
    open: boolean;
    items: any[];
    total: number;
    paymentMethod: string;
    saleId: string;
    date: string;
  }>({
    open: false,
    items: [],
    total: 0,
    paymentMethod: 'cash',
    saleId: '',
    date: '',
  });

  const branchLabel = branch === 'branch_1' ? 'Branch 1' : 'Branch 2';
  
  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  const availableProducts = products
    .filter(p => p.isActive)
    .filter(p => selectedCategory === 'All' || p.category === selectedCategory)
    .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .map(p => {
      const s = stock[p.id]?.[branch] || 0;
      return { ...p, stock: s };
    });

  const addToCart = (productId: string) => {
    const product = getProductById(productId);
    if (!product) return;
    // Removed strict stock check to ensure products are always available for selling

    setCart(prev => {
      const existing = prev.find(i => i.productId === productId);
      if (existing) return prev.map(i => i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { productId, quantity: 1, unitPrice: product.price }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.productId !== productId) return i;
      const newQty = i.quantity + delta;
      if (newQty <= 0) return i;
      // if (newQty > available) return i; // removed limit
      return { ...i, quantity: newQty };
    }));
  };

  const removeFromCart = (productId: string) => setCart(prev => prev.filter(i => i.productId !== productId));

  const total = cart.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

  const checkout = async (method: PaymentMethod) => {
    if (cart.length === 0) return;
    
    const receiptItems = cart.map(i => ({
      name: getProductById(i.productId)?.name || 'Unknown',
      quantity: i.quantity,
      unitPrice: i.unitPrice,
    }));
    const receiptTotal = total;
    const saleId = `RCP-${Date.now().toString(36).toUpperCase()}`;
    const date = new Date().toISOString();

    const success = await createSale('branch', branch, cart, method);
    if (success) {
      setCart([]);
      setReceiptData({
        open: true,
        items: receiptItems,
        total: receiptTotal,
        paymentMethod: method,
        saleId,
        date,
      });
    }
  };

  return (
    <div className="animate-fade-in -mt-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Grid */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search products..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 bg-background"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide items-center">
              {categories.map(c => (
                <Badge 
                  key={c}
                  variant={selectedCategory === c ? "default" : "outline"}
                  className="cursor-pointer whitespace-nowrap bg-background"
                  onClick={() => setSelectedCategory(c)}
                >
                  {c}
                </Badge>
              ))}
            </div>
          </div>
          <div className="pos-grid">
            {availableProducts.map(p => {
              const avail = p.stock;
              const isOutOfStock = false; // Bypass stock ui disabling
              return (
                <button
                  key={p.id}
                  onClick={() => addToCart(p.id)}
                  className={`bg-card border border-border rounded-xl p-4 text-left hover:border-primary hover:shadow-md transition-all active:scale-[0.97]`}
                >
                  <p className="font-semibold text-sm text-foreground">{p.name}</p>
                  <p className="text-primary font-bold mt-1">Rs. {p.price.toFixed(2)}</p>
                  <Badge variant={avail <= 0 ? "destructive" : "secondary"} className="mt-2 text-xs">
                    {avail} in stock
                  </Badge>
                </button>
              );
            })}
            {availableProducts.length === 0 && (
              <div className="col-span-full text-center py-16 text-muted-foreground">
                No stock available at {branchLabel}. Dispatch from production first.
              </div>
            )}
          </div>
        </div>

        {/* Cart */}
        <Card className="h-fit sticky top-4">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" /> Cart
              {cart.length > 0 && <Badge>{cart.length}</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cart.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Cart is empty</p>}
            {cart.map(item => {
              const product = getProductById(item.productId);
              return (
                <div key={item.productId} className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{product?.name}</p>
                    <p className="text-xs text-muted-foreground">${item.unitPrice.toFixed(2)} each</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(item.productId, -1)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(item.productId, 1)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeFromCart(item.productId)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}

            {cart.length > 0 && (
              <>
                <Separator />
                <div className="flex justify-between items-center text-lg font-bold mb-4">
                  <span>Total</span>
                  <span className="text-primary">Rs. {total.toFixed(2)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={() => checkout('cash')} className="w-full" variant="outline">
                    <Banknote className="h-4 w-4 mr-1" /> Cash
                  </Button>
                  <Button onClick={() => checkout('card')} className="w-full">
                    <CreditCard className="h-4 w-4 mr-1" /> Card
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <ReceiptDialog 
        open={receiptData.open}
        onClose={() => setReceiptData(prev => ({ ...prev, open: false }))}
        items={receiptData.items}
        total={receiptData.total}
        paymentMethod={receiptData.paymentMethod}
        branch={branchLabel}
        saleId={receiptData.saleId}
        date={receiptData.date}
        autoPrint={true}
      />
    </div>
  );
}
