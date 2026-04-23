import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, Banknote, Search, Calculator, Tag } from 'lucide-react';
import type { SaleItem, PaymentMethod } from '@/types';
import { Navigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import ReceiptDialog from '@/components/ReceiptDialog';
import GOTDialog from '@/components/GOTDialog';

interface POSProps {
  branch: 'branch_1' | 'branch_2';
}

export default function POS({ branch }: POSProps) {
  const { currentUser, products, stock, createSale, getProductById, getBranchStock, sales } = useApp();

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
    customerName: undefined,
    customerPhone: undefined,
    previousBalance: undefined,
  });

  const [checkoutPrompt, setCheckoutPrompt] = useState<{ open: boolean; name: string; phone: string; method: PaymentMethod | null }>({
    open: false,
    name: '',
    phone: '',
    method: null
  });

  const [amountPrompt, setAmountPrompt] = useState<{ open: boolean; productId: string; amount: string }>({
    open: false,
    productId: '',
    amount: ''
  });
  const [pricePrompt, setPricePrompt] = useState<{ open: boolean; productId: string; price: string }>({
    open: false,
    productId: '',
    price: ''
  });

  const [gotData, setGotData] = useState<{ open: boolean; items: any[] }>({
    open: false,
    items: [],
  });

  const handleAmountConfirm = () => {
    const amountVal = parseFloat(amountPrompt.amount);
    if (!isNaN(amountVal) && amountVal > 0) {
      setCart(prev => prev.map(i => {
        if (i.productId !== amountPrompt.productId) return i;
        const newQty = amountVal / i.unitPrice;
        return { ...i, quantity: newQty };
      }));
    }
    setAmountPrompt({ open: false, productId: '', amount: '' });
  };

  const handlePriceConfirm = (printGOT = false) => {
    const priceVal = parseFloat(pricePrompt.price);
    if (!isNaN(priceVal) && priceVal > 0) {
      setCart(prev => prev.map(i => {
        if (i.productId !== pricePrompt.productId) return i;
        return { ...i, unitPrice: priceVal };
      }));
      
      if (printGOT) {
        const product = getProductById(pricePrompt.productId);
        const itemInCart = cart.find(i => i.productId === pricePrompt.productId);
        setGotData({
          open: true,
          items: [{ name: product?.name || 'Unknown Item', quantity: itemInCart?.quantity || 1 }]
        });
      }
    }
    setPricePrompt({ open: false, productId: '', price: '' });
  };

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

  const checkout = async (method: PaymentMethod, customerName?: string, customerPhone?: string) => {
    if (cart.length === 0) return;
    
    const receiptItems = cart.map(i => ({
      name: getProductById(i.productId)?.name || 'Unknown',
      quantity: i.quantity,
      unitPrice: i.unitPrice,
    }));
    const receiptTotal = total;
    const date = new Date().toISOString();

    let previousBalance = 0;
    if (customerName) {
      previousBalance = sales
        .filter(s => s.paymentMethod === 'credit' && !s.isCreditPaid && (s.customerName === customerName || s.customerPhone === customerPhone))
        .reduce((sum, s) => sum + s.total, 0);
    }

    const createdSaleId = await createSale('branch', branch, cart, method, customerName, customerPhone);
    if (createdSaleId) {
      setCart([]);
      setReceiptData({
        open: true,
        items: receiptItems,
        total: receiptTotal,
        paymentMethod: method,
        saleId: createdSaleId as string,
        date,
        customerName,
        customerPhone,
        previousBalance
      });
    }
  };

  const handleCheckoutConfirm = () => {
    if (!checkoutPrompt.method) return;
    if (!checkoutPrompt.name) {
      toast.error('Customer name is required');
      return;
    }
    checkout(checkoutPrompt.method, checkoutPrompt.name, checkoutPrompt.phone);
    setCheckoutPrompt({ open: false, name: '', phone: '', method: null });
  };

  return (
    <div className="animate-fade-in h-[calc(100vh-120px)]">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        {/* Product Grid — scrolls independently */}
        <div className="lg:col-span-2 overflow-y-auto pr-2 space-y-6" style={{ scrollbarWidth: 'thin' }}>
          <div className="flex flex-col sm:flex-row gap-4 sticky top-0 z-10 bg-slate-50 pb-3">
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
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-muted-foreground flex items-center gap-2">
              <Plus className="h-4 w-4" /> Quick Items
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-3">
              {['p_b100', 'p_b50', 'p_b80', 'p_b120', 'p_c120', 'p_cup40', 'p_eggs'].map(id => {
                const p = getProductById(id);
                if (!p) return null;
                return (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p.id)}
                    className="bg-white dark:bg-card border-2 border-primary/10 rounded-xl p-3 text-left hover:border-primary hover:shadow-lg transition-all active:scale-95 group"
                  >
                    <p className="font-semibold text-[11px] text-muted-foreground group-hover:text-primary transition-colors">{p.name}</p>
                    <p className="text-primary font-bold text-lg leading-tight">Rs. {p.price}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pos-grid pb-6">
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
                    {Number.isInteger(avail) ? avail : Number(avail).toFixed(2)} in stock
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

        {/* Cart — stays fixed, never scrolls with products */}
        <div className="lg:col-span-1 h-full">
          <Card className="h-full max-h-[calc(100vh-120px)] flex flex-col shadow-xl border-primary/10">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <CardTitle className="text-base flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-primary" /> 
                  Cart
                </div>
                {cart.length > 0 && <Badge variant="secondary" className="font-bold">{cart.length}</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
              {cart.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 opacity-50">
                  <ShoppingCart className="h-12 w-12 mb-2" />
                  <p className="text-sm font-medium">Cart is empty</p>
                </div>
              )}
              {cart.map(item => {
                const product = getProductById(item.productId);
                return (
                  <div key={item.productId} className="flex flex-col gap-2 p-2 rounded-lg bg-muted/30 border border-transparent hover:border-primary/20 transition-all">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{product?.name}</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Rs. {item.unitPrice.toFixed(2)} / {product?.unit}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={() => removeFromCart(item.productId)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between gap-2 bg-background/50 p-1 rounded-md border">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQty(item.productId, -1)}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-10 text-center text-sm font-bold">
                          {Number.isInteger(item.quantity) ? item.quantity : item.quantity.toFixed(2)}
                        </span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQty(item.productId, 1)}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-1">
                        {product?.unit?.toLowerCase() === 'kg' && (
                          <Button 
                            variant="secondary" 
                            size="icon" 
                            className="h-7 w-7 text-primary shadow-sm" 
                            onClick={() => setAmountPrompt({ open: true, productId: item.productId, amount: '' })}
                          >
                            <Calculator className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button 
                          variant="secondary" 
                          size="icon" 
                          className="h-7 w-7 text-amber-600 shadow-sm" 
                          onClick={() => setPricePrompt({ open: true, productId: item.productId, price: item.unitPrice.toString() })}
                          title="Change custom/wholesale price"
                        >
                          <Tag className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
            
            {cart.length > 0 && (
              <div className="p-4 bg-muted/10 border-t space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">Subtotal</span>
                  <span className="text-xl font-black text-primary">Rs. {total.toFixed(2)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={() => setCheckoutPrompt({ open: true, name: '', phone: '', method: 'cash' })} className="w-full h-12 shadow-sm font-bold" variant="outline">
                    <Banknote className="h-4 w-4 mr-2" /> Cash
                  </Button>
                  <Button onClick={() => setCheckoutPrompt({ open: true, name: '', phone: '', method: 'credit' })} className="w-full h-12 shadow-lg font-bold">
                    <CreditCard className="h-4 w-4 mr-2" /> Credit
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
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
        customerName={receiptData.customerName}
        customerPhone={receiptData.customerPhone}
        previousBalance={receiptData.previousBalance}
      />

      <Dialog open={amountPrompt.open} onOpenChange={(open) => !open && setAmountPrompt(prev => ({ ...prev, open: false }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Amount</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="amount">Amount (Rs.)</Label>
              <Input 
                id="amount" 
                type="number" 
                placeholder="e.g. 100" 
                value={amountPrompt.amount}
                onChange={e => setAmountPrompt(prev => ({ ...prev, amount: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && handleAmountConfirm()}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAmountPrompt(prev => ({ ...prev, open: false }))}>Cancel</Button>
            <Button onClick={handleAmountConfirm}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={pricePrompt.open} onOpenChange={(open) => !open && setPricePrompt(prev => ({ ...prev, open: false }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Daily Price</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="price">New Unit Price (Rs.)</Label>
              <Input 
                id="price" 
                type="number" 
                placeholder="e.g. 350" 
                value={pricePrompt.price}
                onChange={e => setPricePrompt(prev => ({ ...prev, price: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && handlePriceConfirm(false)}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2 justify-end sm:flex-row flex-col">
            <Button variant="outline" onClick={() => setPricePrompt(prev => ({ ...prev, open: false }))}>Cancel</Button>
            <Button variant="secondary" onClick={() => handlePriceConfirm(true)}>Update & Print GOT</Button>
            <Button onClick={() => handlePriceConfirm(false)}>Update Price</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={checkoutPrompt.open} onOpenChange={(open) => !open && setCheckoutPrompt(prev => ({ ...prev, open: false }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {checkoutPrompt.method === 'credit' ? 'Credit Sale Customer Info' : 'Cash Sale (Optional Customer Info)'}
            </DialogTitle>
            {checkoutPrompt.method === 'cash' && (
              <p className="text-sm text-muted-foreground mt-1">
                Enter name to link this cash sale to a customer and print their previous credit balance on the receipt. Leave blank to skip.
              </p>
            )}
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="customerName">Customer Name {checkoutPrompt.method === 'credit' && '*'}</Label>
              <Input 
                id="customerName" 
                placeholder="e.g. John Doe" 
                value={checkoutPrompt.name}
                onChange={e => setCheckoutPrompt(prev => ({ ...prev, name: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && checkoutPrompt.method === 'cash' && handleCheckoutConfirm()}
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="customerPhone">Phone Number</Label>
              <Input 
                id="customerPhone" 
                placeholder="e.g. 03001234567" 
                value={checkoutPrompt.phone}
                onChange={e => setCheckoutPrompt(prev => ({ ...prev, phone: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && handleCheckoutConfirm()}
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2 flex-col sm:flex-row">
            <Button variant="outline" onClick={() => setCheckoutPrompt(prev => ({ ...prev, open: false }))}>Cancel</Button>
            {checkoutPrompt.method === 'cash' && (
              <Button 
                variant="outline" 
                onClick={() => {
                  checkout('cash');
                  setCheckoutPrompt({ open: false, name: '', phone: '', method: null });
                }}
              >
                Normal Cash Sale
              </Button>
            )}
            <Button onClick={handleCheckoutConfirm} className="bg-primary hover:bg-primary/90">
              {checkoutPrompt.method === 'credit' ? 'Complete Credit Sale' : 'Add Credit Balance'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <GOTDialog 
        open={gotData.open}
        onClose={() => setGotData(prev => ({ ...prev, open: false }))}
        items={gotData.items}
        destination={branchLabel}
        autoPrint={true}
      />
    </div>
  );
}
