import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Truck, Plus, Trash2, AlertCircle, Printer, Eye, Banknote, CreditCard } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import type { DispatchDestination, DispatchItem, PaymentMethod } from '@/types';
import { Navigate } from 'react-router-dom';
import GOTDialog from '@/components/GOTDialog';
import ReceiptDialog from '@/components/ReceiptDialog';
import DispatchSummaryDialog from '@/components/DispatchSummaryDialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function DispatchPage() {
  const { currentUser, products, stock, createDispatch, dispatches, getProductById, ledgerEntries, sales } = useApp();

  if (!currentUser) return <Navigate to="/login" replace />;
  const [destination, setDestination] = useState<DispatchDestination | ''>('');
  const [items, setItems] = useState<DispatchItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [qty, setQty] = useState('');
  const [showGOT, setShowGOT] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentMode, setPaymentMode] = useState<PaymentMethod>('cash');
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custStation, setCustStation] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  
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

  const addItem = () => {
    if (!selectedProduct || !qty || parseInt(qty) <= 0) return;
    const existing = items.find(i => i.productId === selectedProduct);
    if (existing) {
      setItems(items.map(i => i.productId === selectedProduct ? { ...i, quantity: i.quantity + parseInt(qty) } : i));
    } else {
      setItems([...items, { productId: selectedProduct, quantity: parseInt(qty) }]);
    }
    setSelectedProduct('');
    setQty('');
  };

  const removeItem = (productId: string) => setItems(items.filter(i => i.productId !== productId));

  const handleDispatch = async (paymentMeth: PaymentMethod = 'cash') => {
    if (!destination || items.length === 0) return;
    
    if (!custName) {
      toast.error('Customer name is required');
      return;
    }

    // Prepare receipt data
    let receiptItems = items.map(i => ({
      name: getProductById(i.productId)?.name || 'Unknown',
      quantity: i.quantity,
      unitPrice: getProductById(i.productId)?.price || 0
    }));
    let total = receiptItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

    const numericAmountPaid = parseFloat(amountPaid) || 0;

    const success = await createDispatch(
      destination, 
      items, 
      paymentMeth, 
      custName, 
      custPhone || undefined, 
      numericAmountPaid, 
      custStation || undefined
    );
    
    if (success) {
      setReceiptData({
        open: true,
        items: receiptItems,
        total,
        paymentMethod: paymentMeth,
        saleId: typeof success === 'string' ? success : `SL-${Date.now().toString(36).toUpperCase()}`,
        date: new Date().toISOString()
      });
      setItems([]);
      setDestination('');
      setIsPaymentOpen(false);
      setCustName('');
      setCustPhone('');
      setCustStation('');
      setAmountPaid('');
      toast.success('Sale completed successfully!');
    }
  };

  const handleWalkinDispatch = () => {
    if (!destination || items.length === 0) return;
    const isSale = !['branch_1', 'branch_2'].includes(destination);
    if (isSale) {
      if (destination !== 'walkin') {
        setCustName(destination);
        const existingCust = ledgerEntries.find(e => e.category === 'customer' && e.name === destination);
        setCustStation(existingCust?.station || 'Factory Gate');
      } else {
        setCustName('');
        setCustStation('');
      }
      setAmountPaid('');
      setIsPaymentOpen(true);
    } else {
      handleDispatch();
    }
  };

  const [historyItems, setHistoryItems] = useState<{ name: string; quantity: number }[]>([]);
  const [historyDest, setHistoryDest] = useState('');
  const [historyToken, setHistoryToken] = useState<number | undefined>(undefined);
  const [showHistoryGOT, setShowHistoryGOT] = useState(false);

  const printHistoryGOT = (items: any[], dest: string, token?: number) => {
    setHistoryItems(items.map(i => ({ 
      name: getProductById(i.productId)?.name || 'Unknown', 
      quantity: i.quantity 
    })));
    setHistoryDest(dest);
    setHistoryToken(token);
    setShowHistoryGOT(true);
  };

  const availableProducts = products.filter(p => (stock[p.id]?.production || 0) > 0);

  const destLabels: Record<string, string> = { branch_1: 'Branch 1', branch_2: 'Branch 2', walkin: 'Walk-in (Factory)' };
  const customerDestinations = Array.from(new Set(ledgerEntries.filter(e => e.category === 'customer' && e.name).map(e => e.name!)));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dispatch</h1>
        <p className="text-sm text-muted-foreground">Send products to branches or walk-in sales</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Truck className="h-4 w-4" /> New Dispatch</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Destination</Label>
            <Select value={destination} onValueChange={v => setDestination(v as DispatchDestination)}>
              <SelectTrigger><SelectValue placeholder="Select destination" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="branch_1">Branch 1</SelectItem>
                <SelectItem value="branch_2">Branch 2</SelectItem>
                <SelectItem value="walkin">Walk-in (Factory Gate Sale)</SelectItem>
                {customerDestinations.length > 0 && <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t">Customers</div>}
                {customerDestinations.map(name => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label>Product</Label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                <SelectContent>
                  {availableProducts.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name} ({stock[p.id]?.production} avail)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Quantity</Label>
              <Input type="number" min="1" max={stock[selectedProduct]?.production || 999} value={qty} onChange={e => setQty(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={addItem} disabled={!selectedProduct || !qty}><Plus className="h-4 w-4 mr-1" /> Add</Button>
            </div>
          </div>

          {items.length > 0 && (
            <div className="space-y-2">
              <Label>Items to dispatch:</Label>
              {items.map(item => {
                const p = getProductById(item.productId);
                const available = stock[item.productId]?.production || 0;
                const overStock = item.quantity > available;
                return (
                  <div key={item.productId} className={`flex items-center justify-between p-3 rounded-lg border ${overStock ? 'border-destructive bg-destructive/5' : 'border-border'}`}>
                    <div>
                      <span className="font-medium">{p?.name}</span>
                      <span className="text-muted-foreground ml-2">× {item.quantity}</span>
                      {overStock && <span className="text-destructive text-xs ml-2">(only {available} available!)</span>}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeItem(item.productId)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                );
              })}
            </div>
          )}

          {destination === 'walkin' && items.length > 0 && (
            <Alert><AlertCircle className="h-4 w-4" /><AlertDescription>Walk-in dispatch will automatically record as a factory gate sale.</AlertDescription></Alert>
          )}

          <div className="flex flex-wrap gap-2">
            {!['branch_1', 'branch_2'].includes(destination) ? (
              <Button onClick={handleWalkinDispatch} disabled={items.length === 0} className="flex-1 sm:flex-none bg-success hover:bg-success/90">
                <CreditCard className="h-4 w-4 mr-2" /> Complete Sale
              </Button>
            ) : (
              <Button onClick={handleDispatch} disabled={!destination || items.length === 0} className="flex-1 sm:flex-none">
                Confirm Dispatch
              </Button>
            )}
            
            <Button 
              variant="secondary" 
              onClick={() => setShowGOT(true)} 
              disabled={items.length === 0}
              className="flex-1 sm:flex-none"
            >
              <Printer className="h-4 w-4 mr-2" /> GOT
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Selection Dialog */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
          <DialogHeader className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-5 py-4 text-white">
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-white">
              <Banknote className="h-5 w-5 text-indigo-200" />
              Complete Factory Sale
            </DialogTitle>
            <DialogDescription className="text-indigo-200 text-xs">
              Select payment method and enter customer details
            </DialogDescription>
          </DialogHeader>
          
          <div className="px-5 py-4 space-y-4 max-h-[65vh] overflow-y-auto">
            {/* Total Payable */}
            <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 rounded-lg px-4 py-3 flex justify-between items-center">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Total Payable</span>
              <span className="text-xl font-black text-indigo-700 dark:text-indigo-300 font-mono">
                Rs. {items.reduce((sum, item) => sum + item.quantity * (getProductById(item.productId)?.price || 0), 0).toLocaleString()}
              </span>
            </div>

            {/* Payment Mode Toggle */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Payment Mode</Label>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  type="button"
                  className={cn(
                    "flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border-2 transition-all duration-200 font-semibold text-sm relative",
                    paymentMode === 'cash' 
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm" 
                      : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300"
                  )}
                  onClick={() => setPaymentMode('cash')}
                >
                  <Banknote className="h-4 w-4" />
                  Full Cash
                  {paymentMode === 'cash' && <span className="absolute -top-1 -right-1 h-4 w-4 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[9px]">✓</span>}
                </button>
                <button 
                  type="button"
                  className={cn(
                    "flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border-2 transition-all duration-200 font-semibold text-sm relative",
                    paymentMode === 'credit' 
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm" 
                      : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300"
                  )}
                  onClick={() => setPaymentMode('credit')}
                >
                  <CreditCard className="h-4 w-4" />
                  Credit / Split
                  {paymentMode === 'credit' && <span className="absolute -top-1 -right-1 h-4 w-4 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[9px]">✓</span>}
                </button>
              </div>
            </div>

            {/* Customer Details */}
            <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-3">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Customer Details</Label>
              
              <div className="space-y-1">
                <Label className="text-xs text-slate-600 font-medium">Customer Name <span className="text-rose-500">*</span></Label>
                <Input 
                  value={custName} 
                  onChange={e => setCustName(e.target.value)} 
                  placeholder="e.g. Ahmed Ali"
                  className="h-9 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-600 font-medium">Station / City</Label>
                  <Input 
                    value={custStation} 
                    onChange={e => setCustStation(e.target.value)} 
                    placeholder="e.g. Sanghar"
                    className="h-9 rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-600 font-medium">Phone</Label>
                  <Input 
                    value={custPhone} 
                    onChange={e => setCustPhone(e.target.value)} 
                    placeholder="03xx-xxxxxxx"
                    className="h-9 rounded-lg"
                  />
                </div>
              </div>

              {/* Split payment - Cash received now */}
              {paymentMode === 'credit' && (
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 p-3 rounded-lg space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                  <Label className="text-xs font-bold text-amber-700 dark:text-amber-400">Cash Received Now (Optional)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-bold text-amber-600">Rs.</span>
                    <Input 
                      type="number"
                      value={amountPaid} 
                      onChange={e => setAmountPaid(e.target.value)} 
                      placeholder="0"
                      className="pl-10 h-9 border-amber-200 dark:border-amber-800 rounded-lg text-amber-900 dark:text-amber-200 font-mono"
                    />
                  </div>
                  <p className="text-[10px] text-amber-600/70 leading-tight">
                    Leave empty or 0 for full credit. Enter partial amount if customer paid some cash now.
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Footer - always visible */}
          <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 px-5 py-3 flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setIsPaymentOpen(false)} className="rounded-lg px-4 text-xs">
              Cancel
            </Button>
            <Button 
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-5 text-xs font-bold gap-1.5" 
              onClick={() => handleDispatch(paymentMode)}
              disabled={!custName}
            >
              <Banknote className="h-3.5 w-3.5" />
              Confirm & Print Bill
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ReceiptDialog 
        open={receiptData.open}
        onClose={() => setReceiptData(prev => ({ ...prev, open: false }))}
        items={receiptData.items}
        total={receiptData.total}
        paymentMethod={receiptData.paymentMethod}
        branch="FACTORY"
        saleId={receiptData.saleId}
        date={receiptData.date}
        autoPrint={true}
      />

      <DispatchSummaryDialog 
        open={showSummary}
        onClose={() => setShowSummary(false)}
        date={new Date().toISOString().slice(0, 10)}
      />

      <GOTDialog 
        open={showGOT}
        onClose={() => setShowGOT(false)}
        destination={destination}
        tokenNumber={dispatches.filter(d => d.date === new Date().toISOString().slice(0, 10)).length + 1}
        items={items.map(i => ({ 
          name: getProductById(i.productId)?.name || 'Unknown', 
          quantity: i.quantity 
        }))}
      />

      {/* Dispatch History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Dispatch History</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center gap-2 text-primary hover:bg-primary/5"
            onClick={() => setShowSummary(true)}
          >
            <Eye className="h-4 w-4" /> Day Summary
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...dispatches].reverse().map(d => (
                <TableRow key={d.id}>
                  <TableCell>{d.date}</TableCell>
                  <TableCell><Badge variant="secondary">{destLabels[d.destination] || d.destination}</Badge></TableCell>
                  <TableCell>
                    {d.items.map(i => {
                      const p = getProductById(i.productId);
                      return <div key={i.productId} className="text-sm">{p?.name} × {i.quantity}</div>;
                    })}
                  </TableCell>
                  <TableCell><Badge className="bg-success text-success-foreground">{d.status}</Badge></TableCell>
                  <TableCell className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => printHistoryGOT(d.items, d.destination, d.tokenNumber)}
                      className="h-8 w-8 p-0"
                      title="Reprint GOT"
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                    {!['branch_1', 'branch_2'].includes(d.destination) && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          const items = d.items.map(i => ({
                            name: getProductById(i.productId)?.name || 'Unknown',
                            quantity: i.quantity,
                            unitPrice: getProductById(i.productId)?.price || 0
                          }));
                          const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
                          
                          // Find associated sale to get accurate payment method and sale ID
                          const associatedSale = sales.find(s => {
                            if (s.date !== d.date) return false;
                            if (d.destination === 'walkin') {
                              if (s.type !== 'factory_walkin') return false;
                            } else {
                              if (s.customerName !== d.destination) return false;
                            }
                            if (s.items.length !== d.items.length) return false;
                            return s.items.every(si => 
                              d.items.some(di => di.productId === si.productId && di.quantity === si.quantity)
                            );
                          });

                          setReceiptData({
                            open: true,
                            items,
                            total,
                            paymentMethod: associatedSale?.paymentMethod || 'cash',
                            saleId: associatedSale?.id || d.id,
                            date: associatedSale?.date || d.date
                          });
                        }}
                        className="h-8 w-8 p-0 text-primary"
                        title="View/Reprint Receipt"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {dispatches.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No dispatches yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <GOTDialog 
        open={showHistoryGOT}
        onClose={() => setShowHistoryGOT(false)}
        destination={historyDest}
        tokenNumber={historyToken}
        items={historyItems}
      />
    </div>
  );
}
