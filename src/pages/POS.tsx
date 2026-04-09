import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, Banknote } from 'lucide-react';
import ReceiptDialog from '@/components/ReceiptDialog';
import type { SaleItem, PaymentMethod } from '@/types';
import { Navigate } from 'react-router-dom';

interface POSProps {
  branch: 'branch_1' | 'branch_2';
}

export default function POS({ branch }: POSProps) {
  const { currentUser, products, stock, createSale, getProductById } = useApp();

  if (!currentUser) return <Navigate to="/login" replace />;
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [receipt, setReceipt] = useState<{
    items: { name: string; quantity: number; unitPrice: number }[];
    total: number;
    paymentMethod: string;
    saleId: string;
    date: string;
  } | null>(null);

  const branchLabel = branch === 'branch_1' ? 'Branch 1' : 'Branch 2';
  const availableProducts = products.filter(p => (stock[p.id]?.[branch] || 0) > 0);

  const addToCart = (productId: string) => {
    const product = getProductById(productId);
    if (!product) return;
    const available = stock[productId]?.[branch] || 0;
    const inCart = cart.find(i => i.productId === productId)?.quantity || 0;
    if (inCart >= available) return;

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
      const available = stock[productId]?.[branch] || 0;
      if (newQty > available) return i;
      return { ...i, quantity: newQty };
    }));
  };

  const removeFromCart = (productId: string) => setCart(prev => prev.filter(i => i.productId !== productId));

  const total = cart.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

  const checkout = async (method: PaymentMethod) => {
    if (cart.length === 0) return;
    const success = await createSale('branch', branch, cart, method);
    if (success) {
      const saleId = `RCP-${Date.now().toString(36).toUpperCase()}`;
      setReceipt({
        items: cart.map(i => ({
          name: getProductById(i.productId)?.name || 'Unknown',
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
        total,
        paymentMethod: method,
        saleId,
        date: new Date().toLocaleString(),
      });
      setCart([]);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{branchLabel} POS</h1>
        <p className="text-sm text-muted-foreground">Point of sale — sell available stock</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Grid */}
        <div className="lg:col-span-2">
          <div className="pos-grid">
            {availableProducts.map(p => {
              const avail = stock[p.id]?.[branch] || 0;
              return (
                <button
                  key={p.id}
                  onClick={() => addToCart(p.id)}
                  className="bg-card border border-border rounded-xl p-4 text-left hover:border-primary hover:shadow-md transition-all active:scale-[0.97]"
                >
                  <p className="font-semibold text-sm text-foreground">{p.name}</p>
                  <p className="text-primary font-bold mt-1">Rs. {p.price.toFixed(2)}</p>
                  <Badge variant="secondary" className="mt-2 text-xs">{avail} in stock</Badge>
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

      {receipt && (
        <ReceiptDialog
          open={!!receipt}
          onClose={() => setReceipt(null)}
          items={receipt.items}
          total={receipt.total}
          paymentMethod={receipt.paymentMethod}
          branch={branchLabel}
          saleId={receipt.saleId}
          date={receipt.date}
        />
      )}
    </div>
  );
}
