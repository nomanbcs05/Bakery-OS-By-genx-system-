import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Store, Plus, Minus, Trash2, Banknote } from 'lucide-react';
import { Navigate } from 'react-router-dom';

export default function WalkInSales() {
  const { currentUser, products, stock, createDispatch, getProductById } = useApp();

  if (!currentUser) return <Navigate to="/login" replace />;
  const [cart, setCart] = useState<{ productId: string; quantity: number }[]>([]);

  const availableProducts = products.filter(p => (stock[p.id]?.production || 0) > 0);

  const addToCart = (productId: string) => {
    const available = stock[productId]?.production || 0;
    const inCart = cart.find(i => i.productId === productId)?.quantity || 0;
    if (inCart >= available) return;
    setCart(prev => {
      const existing = prev.find(i => i.productId === productId);
      if (existing) return prev.map(i => i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { productId, quantity: 1 }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.productId !== productId) return i;
      const newQty = i.quantity + delta;
      if (newQty <= 0) return i;
      if (newQty > (stock[productId]?.production || 0)) return i;
      return { ...i, quantity: newQty };
    }));
  };

  const removeFromCart = (productId: string) => setCart(prev => prev.filter(i => i.productId !== productId));

  const total = cart.reduce((sum, i) => {
    const product = getProductById(i.productId);
    return sum + i.quantity * (product?.price || 0);
  }, 0);

  const printDirectly = (items: any[], total: number, paymentMethod: string, saleId: string, date: string) => {
    // Generate simple receipt layout
    let itemsHtml = '';
    items.forEach(item => {
      itemsHtml += `
        <div class="row">
          <span style="flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.name} x${item.quantity}</span>
          <span style="font-weight: 500;">Rs. ${(item.quantity * item.unitPrice).toFixed(2)}</span>
        </div>
      `;
    });

    const receiptHtml = `
      <html>
        <head>
          <title>Receipt</title>
          <style>
            body { font-family: 'Courier New', monospace; font-size: 12px; padding: 10px; max-width: 280px; margin: 0 auto; color: #000; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .line { border-top: 1px dashed #000; margin: 8px 0; }
            .row { display: flex; justify-content: space-between; margin: 2px 0; font-size: 12px; }
            .total-row { font-size: 14px; font-weight: bold; justify-content: space-between; display: flex; margin-top: 6px; }
            .text-muted { color: #555; }
            .text-xs { font-size: 10px; margin: 2px 0; }
            .title { font-size: 16px; font-weight: bold; margin-bottom: 2px; }
            @media print { body { margin: 0; padding: 0; } }
          </style>
        </head>
        <body>
          <div class="center">
            <div class="title">🍞 BakeryOS</div>
            <div class="text-muted text-xs">Factory Walk-in</div>
            <div class="text-muted text-xs">${date}</div>
            <div class="text-muted text-xs">Receipt #${saleId}</div>
          </div>
          <div class="line"></div>
          <div class="row bold text-muted text-xs">
            <span>Item</span>
            <span>Amount</span>
          </div>
          ${itemsHtml}
          <div class="line"></div>
          <div class="total-row">
            <span>TOTAL</span>
            <span>Rs. ${total.toFixed(2)}</span>
          </div>
          <div class="row text-muted" style="margin-top: 4px;">
            <span>Payment</span>
            <span style="text-transform: capitalize;">${paymentMethod}</span>
          </div>
          <div class="line"></div>
          <div class="center text-muted text-xs" style="margin-top: 8px;">
            Thank you for your purchase!
          </div>
          <script>
             window.onload = () => {
               window.print();
             };
          </script>
        </body>
      </html>
    `;

    // Create a hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    // Write content to iframe and trigger print
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(receiptHtml);
      doc.close();

      // Ensure removal after printing process starts or user cancels
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 5000);
    }
  };

  const handleSale = async () => {
    if (cart.length === 0) return;
    
    const receiptItems = cart.map(i => {
      const product = getProductById(i.productId);
      return { name: product?.name || 'Unknown', quantity: i.quantity, unitPrice: product?.price || 0 };
    });
    const receiptTotal = total;

    const success = await createDispatch('walkin', cart.map(i => ({ productId: i.productId, quantity: i.quantity })));
    if (success && typeof success === 'string') {
      setCart([]);
      printDirectly(receiptItems, receiptTotal, 'cash', success, new Date().toLocaleString());
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Walk-in Sales</h1>
        <p className="text-sm text-muted-foreground">Factory gate sales — directly from production stock</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="pos-grid">
            {availableProducts.map(p => {
              const avail = stock[p.id]?.production || 0;
              return (
                <button key={p.id} onClick={() => addToCart(p.id)}
                  className="bg-card border border-border rounded-xl p-4 text-left hover:border-primary hover:shadow-md transition-all active:scale-[0.97]">
                  <p className="font-semibold text-sm text-foreground">{p.name}</p>
                  <p className="text-primary font-bold mt-1">Rs. {p.price.toFixed(2)}</p>
                  <Badge variant="secondary" className="mt-2 text-xs">{avail} in stock</Badge>
                </button>
              );
            })}
          </div>
        </div>

        <Card className="h-fit sticky top-4">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Store className="h-4 w-4" /> Walk-in Cart</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cart.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No items selected</p>}
            {cart.map(item => {
              const product = getProductById(item.productId);
              return (
                <div key={item.productId} className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{product?.name}</p>
                    <p className="text-xs text-muted-foreground">Rs. {(product?.price || 0).toFixed(2)} each</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(item.productId, -1)}><Minus className="h-3 w-3" /></Button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(item.productId, 1)}><Plus className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeFromCart(item.productId)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </div>
              );
            })}
            {cart.length > 0 && (
              <>
                <Separator />
                <div className="flex justify-between items-center font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">Rs. {total.toFixed(2)}</span>
                </div>
                <Button onClick={handleSale} className="w-full"><Banknote className="h-4 w-4 mr-1" /> Complete Sale</Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
