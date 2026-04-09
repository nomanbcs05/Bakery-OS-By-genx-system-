import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, Banknote } from 'lucide-react';
import type { SaleItem, PaymentMethod } from '@/types';
import { Navigate } from 'react-router-dom';

interface POSProps {
  branch: 'branch_1' | 'branch_2';
}

export default function POS({ branch }: POSProps) {
  const { currentUser, products, stock, createSale, getProductById, getBranchStock } = useApp();

  if (!currentUser) return <Navigate to="/login" replace />;
  const [cart, setCart] = useState<SaleItem[]>([]);

  const branchLabel = branch === 'branch_1' ? 'Branch 1' : 'Branch 2';
  const branchStockItems = getBranchStock(branch);
  const availableProducts = branchStockItems.map(s => {
    const p = getProductById(s.productId);
    return { ...p!, stock: s.stock };
  }).filter(p => p !== undefined);

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

  const printDirectly = (items: any[], total: number, paymentMethod: string, saleId: string, date: string) => {
    const totalQty = items.reduce((acc, item) => acc + item.quantity, 0);
    const gst = 0; 
    const grossAmount = total - gst;
    
    // Format date properly
    const formattedDate = new Date(date).toLocaleString('en-GB', { 
      weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', 
      hour: 'numeric', minute: '2-digit', hour12: true 
    }).replace(',', '');

    const receiptHtml = `
      <html>
        <head>
          <title>Receipt</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              font-size: 11px; 
              color: #000; 
              background: #fff;
              margin: 0; 
              padding: 0; 
              width: 280px; 
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .uppercase { text-transform: uppercase; }
            .border-y { border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 4px 0; }
            .border-b { border-bottom: 1px solid #000; padding-bottom: 4px; margin-bottom: 4px; }
            .border-t { border-top: 1px solid #000; padding-top: 4px; margin-top: 4px; }
            .double-border-b { border-bottom: 3px double #000; padding-bottom: 4px; margin-bottom: 4px; }
            .flex-between { display: flex; justify-content: space-between; align-items: center; }
            
            .grid-meta { display: grid; grid-template-columns: 100px 1fr; gap: 2px; margin-bottom: 8px; font-size: 11px; }
            .meta-lbl { font-weight: bold; }
            
            .flex-table-header { display: flex; font-weight: bold; font-size: 9px; padding: 4px 0; border-top: 1px solid #000; border-bottom: 1px solid #000; margin-bottom: 4px; background: #f9fafb; }
            
            /* Items */
            .item-row { margin-bottom: 8px; font-size: 10px; }
            .item-name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px; }
            .item-details { display: flex; width: 100%; color: #333; margin-top: 2px; }
            
            /* Utils */
            .w-15 { width: 15%; }
            .w-30 { width: 30%; }
            .w-25 { width: 25%; }
            .w-45 { width: 45%; }
            .w-12 { width: 12%; }
            .w-13 { width: 13%; }
            
            .dashed-bot { border-bottom: 1px dashed #000; flex: 1; margin: 0 8px; position: relative; top: -4px; height: 10px; }
            
            .flex-center { display: flex; justify-content: center; align-items: center; }
            
            @media print { body { margin: 0; padding: 10px; } }
          </style>
        </head>
        <body>
          <div class="text-center" style="margin-bottom: 12px;">
            <div class="flex-center" style="margin-bottom: 4px;">
              <svg width="40" height="24" viewBox="0 0 100 60" fill="currentColor" style="margin: 0 auto;">
                <path d="M50 0 L60 20 L80 20 L65 35 L70 55 L50 40 L30 55 L35 35 L20 20 L40 20 Z" fill="#000" />
                <path d="M50 10 L55 25 L70 25 L60 35 L65 50 L50 40 L35 50 L40 35 L30 25 L45 25 Z" fill="#fff" />
              </svg>
            </div>
            <div style="font-family: 'Times New Roman', serif; font-size: 22px; font-weight: bold; letter-spacing: -0.5px;">
              ${receiptSettings?.brandName || 'Rehmat-e-Shereen'}
            </div>
            <div style="font-family: 'Times New Roman', serif; font-size: 12px; font-style: italic; margin-bottom: 4px;">
              ${receiptSettings?.tagline || 'make life delicious'}
            </div>
            <div style="font-size: 14px; font-weight: bold; margin-bottom: 4px;">
              ${branchLabel.toUpperCase()}
            </div>
            <div style="font-size: 9px; line-height: 1.2;">
              ${receiptSettings?.address || 'Main Branch, KARACHI, Pakistan'}
            </div>
            <div style="font-size: 9px; font-weight: bold; margin-top: 4px;">
              UAN #: ${receiptSettings?.phone || '021 111 111 111'}
            </div>
          </div>

          <div class="text-center font-bold border-y" style="font-size: 12px; margin-bottom: 8px;">
            Sale Receipt
          </div>

          <div class="grid-meta">
            <div class="meta-lbl">Invoice #</div>
            <div>: ${saleId.slice(0, 8).toUpperCase()}</div>
            
            <div class="meta-lbl">Operator Name</div>
            <div>: ${currentUser?.name || 'SYS_ADMIN'}</div>
            
            <div class="meta-lbl">Invoice Date</div>
            <div>: ${formattedDate}</div>
            
            <div class="meta-lbl">Client Name</div>
            <div>: Walk-in Customer</div>
            
            <div class="meta-lbl">SalesMan</div>
            <div>: ${currentUser?.id?.slice(0, 6) || '000001'}</div>
            
            <div class="meta-lbl">Counter</div>
            <div>: MAIN COUNTER</div>
            
            <div class="meta-lbl">Reference #</div>
            <div>: 0</div>
          </div>

          <div class="flex-table-header">
            <div class="w-45">Item Name</div>
            <div class="w-15 text-right">Price</div>
            <div class="w-15 text-center">Qty/Wt</div>
            <div class="w-12 text-center">Tax %</div>
            <div class="w-13 text-right">Amount</div>
          </div>

          <div class="text-center font-bold border-b" style="font-size: 10px; padding-bottom: 4px; margin: 4px 0 8px 0; letter-spacing: 1px;">
            ITEMS
          </div>

          <div style="margin-bottom: 8px; min-height: 50px;">
            ${items.map((item, i) => `
              <div class="item-row">
                <div class="item-name">${String(i + 1).padStart(5, '0')} ${item.name}</div>
                <div class="item-details">
                  <div class="w-15"></div>
                  <div class="w-30 text-right">${item.unitPrice.toLocaleString()}</div>
                  <div class="w-25 text-center">${item.quantity}.000 P</div>
                  <div class="w-15 text-center">0.00%</div>
                  <div class="w-15 text-right font-bold" style="color: #000;">${((item.quantity * item.unitPrice)).toLocaleString()}</div>
                </div>
              </div>
            `).join('')}
          </div>

          <div class="border-y flex-between font-bold" style="font-size: 10px; padding: 4px 8px; margin-bottom: 8px;">
            <span>Total Item <span style="margin-left: 16px;">${items.length}</span></span>
            <span>Total Qty <span style="margin-left: 16px;">${totalQty}</span></span>
          </div>

          <div style="font-size: 11px; margin-bottom: 8px;">
            <div class="flex-between" style="margin-bottom: 4px;">
              <span>Gross Amount</span>
              <span class="font-bold">${grossAmount.toLocaleString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 4px;">
              <span>On Invoice Discount</span>
              <div class="dashed-bot"></div>
              <div style="display: flex; justify-content: flex-end; min-width: 60px;">
                <span style="margin-right: 16px;">(0.00%)</span>
                <span>0.00</span>
              </div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: flex-end;">
              <span>G.S.T</span>
              <div class="dashed-bot"></div>
              <span class="font-bold">${gst.toFixed(2)}</span>
            </div>
          </div>

          <div style="font-size: 11px; margin-bottom: 8px;">
            <div class="flex-between" style="margin-bottom: 4px;">
              <span class="border-t" style="flex: 1;"></span>
              <span class="font-bold" style="margin: 0 8px;">Other Charges Detail</span>
              <span class="border-t" style="flex: 1;"></span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: flex-end; padding-left: 8px;">
              <span style="font-style: italic; font-size: 10px;">Fbr Service Fee</span>
              <div class="dashed-bot"></div>
              <span>1</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: flex-end; font-weight: bold; margin-top: 4px;">
              <span>Total Charges</span>
              <div class="dashed-bot" style="border-bottom-style: solid;"></div>
              <span>1</span>
            </div>
          </div>

          <div class="flex-between bg-gray-50 bg-gray" style="border-top: 1px solid #000; border-bottom: 3px double #000; padding: 4px 0; margin-bottom: 12px; background: #f9fafb;">
            <span class="font-bold" style="font-size: 13px;">Net Amount</span>
            <span class="font-bold" style="font-size: 15px;">${(total + 1).toLocaleString()}</span>
          </div>

          <div class="text-center" style="margin-bottom: 12px;">
            <div class="font-bold" style="font-size: 11px;">FBR Invoice #</div>
            <div style="font-size: 10px; letter-spacing: 2px;">${saleId.replace(/[^0-9]/g, '').padEnd(16, '0').slice(0, 16)}</div>
            
            <div class="flex-center" style="gap: 16px; margin-top: 8px;">
              <div style="font-size: 9px; font-weight: bold; border: 1px solid #000; padding: 4px; text-align: center; width: 80px; text-transform: uppercase;">
                 <div style="margin-bottom:2px">_[]_</div>POS<br/>System
              </div>
              <div style="border: 1px solid #000; padding: 4px; display: inline-block;">
                <!-- Mock QR Code by using unicode blocks -->
                <div style="font-size: 6px; line-height: 1; letter-spacing: 0; font-family: monospace;">
                   ███████ █  █ ███████<br>
                   █     █  ██  █     █<br>
                   █ ███ █ █  █ █ ███ █<br>
                   █     █ █ ██ █     █<br>
                   ███████ █ █  ███████<br>
                   ██  █  █████  ███  █<br>
                   ███████  █   ███████
                </div>
              </div>
            </div>
            
            <div style="font-size: 9px; margin-top: 8px; font-style: italic; line-height: 1.2; padding: 0 16px;">
              Verify this invoice through FBR TaxAsaan MobileApp or SMS at 9966 and win exciting prizes in draw
            </div>
          </div>

          <div style="border: 1px solid #000; font-size: 11px; display: flex; flex-direction: column;">
            <div class="flex-between" style="padding: 4px; border-bottom: 1px solid #000;">
              <span class="font-bold">Cash Paid</span>
              <span>${(total + 1).toLocaleString()}</span>
            </div>
            <div class="flex-between" style="padding: 4px; background: #f3f4f6;">
              <span class="font-bold">Cash Back</span>
              <span>-</span>
            </div>
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

  const checkout = async (method: PaymentMethod) => {
    if (cart.length === 0) return;
    
    // Create copy for receipt variables before clearing cart
    const receiptItems = cart.map(i => ({
      name: getProductById(i.productId)?.name || 'Unknown',
      quantity: i.quantity,
      unitPrice: i.unitPrice,
    }));
    const receiptTotal = total;

    const success = await createSale('branch', branch, cart, method);
    if (success) {
      const saleId = `RCP-${Date.now().toString(36).toUpperCase()}`;
      setCart([]);
      
      // Directly trigger print
      printDirectly(receiptItems, receiptTotal, method, saleId, new Date().toLocaleString());
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
              const avail = p.stock;
              const isOutOfStock = avail <= 0;
              return (
                <button
                  key={p.id}
                  onClick={() => addToCart(p.id)}
                  disabled={isOutOfStock}
                  className={`bg-card border border-border rounded-xl p-4 text-left hover:border-primary hover:shadow-md transition-all active:scale-[0.97] ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <p className="font-semibold text-sm text-foreground">{p.name}</p>
                  <p className="text-primary font-bold mt-1">Rs. {p.price.toFixed(2)}</p>
                  <Badge variant={isOutOfStock ? "destructive" : "secondary"} className="mt-2 text-xs">
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
    </div>
  );
}
