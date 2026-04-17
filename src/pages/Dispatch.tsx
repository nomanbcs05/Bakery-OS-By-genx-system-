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

export default function DispatchPage() {
  const { currentUser, products, stock, createDispatch, dispatches, getProductById } = useApp();

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
    
    if (paymentMeth === 'credit' && (!custName || !custPhone)) {
      toast.error('Name and Phone number are required for credit sales');
      return;
    }

    // Prepare receipt data if walk-in
    let currentSaleId = `SL-${Date.now().toString(36).toUpperCase()}`;
    let receiptItems = items.map(i => ({
      name: getProductById(i.productId)?.name || 'Unknown',
      quantity: i.quantity,
      unitPrice: getProductById(i.productId)?.price || 0
    }));
    let total = receiptItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

    const success = await createDispatch(destination, items, paymentMeth, custName, custPhone);
    if (success) {
      if (destination === 'walkin' && typeof success === 'string') {
        setReceiptData({
          open: true,
          items: receiptItems,
          total,
          paymentMethod: paymentMeth,
          saleId: success,
          date: new Date().toISOString()
        });
      }
      setItems([]);
      setDestination('');
      setIsPaymentOpen(false);
      setCustName('');
      setCustPhone('');
    }
  };

  const handleWalkinDispatch = () => {
    if (!destination || items.length === 0) return;
    if (destination === 'walkin') {
      setIsPaymentOpen(true);
    } else {
      handleDispatch();
    }
  };

  const [historyItems, setHistoryItems] = useState<{ name: string; quantity: number }[]>([]);
  const [historyDest, setHistoryDest] = useState('');
  const [showHistoryGOT, setShowHistoryGOT] = useState(false);

  const printHistoryGOT = (items: any[], dest: string) => {
    setHistoryItems(items.map(i => ({ 
      name: getProductById(i.productId)?.name || 'Unknown', 
      quantity: i.quantity 
    })));
    setHistoryDest(dest);
    setShowHistoryGOT(true);
  };

  const availableProducts = products.filter(p => (stock[p.id]?.production || 0) > 0);

  const destLabels: Record<string, string> = { branch_1: 'Branch 1', branch_2: 'Branch 2', walkin: 'Walk-in (Factory)' };

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
            {destination === 'walkin' ? (
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
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Complete Factory Sale</DialogTitle>
            <DialogDescription>Select payment method for this walk-in dispatch</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant={paymentMode === 'cash' ? "default" : "outline"} 
                className="h-20 flex flex-col gap-1 border-2" 
                onClick={() => setPaymentMode('cash')}
              >
                <Banknote className="h-6 w-6" />
                <span className="text-xs">Cash</span>
              </Button>
              <Button 
                variant={paymentMode === 'credit' ? "default" : "outline"} 
                className="h-20 flex flex-col gap-1 border-2" 
                onClick={() => setPaymentMode('credit')}
              >
                <CreditCard className="h-6 w-6" />
                <span className="text-xs">Credit</span>
              </Button>
            </div>

            {paymentMode === 'credit' && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="space-y-1">
                  <Label>Customer Name</Label>
                  <Input value={custName} onChange={e => setCustName(e.target.value)} placeholder="Enter name" />
                </div>
                <div className="space-y-1">
                  <Label>Phone Number</Label>
                  <Input value={custPhone} onChange={e => setCustPhone(e.target.value)} placeholder="03xx-xxxxxxx" />
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button className="w-full" onClick={() => handleDispatch(paymentMode)}>
              Confirm & Print Bill
            </Button>
            <Button variant="ghost" onClick={() => setIsPaymentOpen(false)} className="w-full text-xs">Cancel</Button>
          </DialogFooter>
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
                  <TableCell><Badge variant="secondary">{destLabels[d.destination]}</Badge></TableCell>
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
                      onClick={() => printHistoryGOT(d.items, d.destination)}
                      className="h-8 w-8 p-0"
                      title="Reprint GOT"
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                    {d.destination === 'walkin' && (
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
                          setReceiptData({
                            open: true,
                            items,
                            total,
                            paymentMethod: 'cash', // assume cash for reprint if not stored
                            saleId: d.id,
                            date: d.date
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
        items={historyItems}
      />
    </div>
  );
}
