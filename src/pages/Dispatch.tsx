import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Truck, Plus, Trash2, AlertCircle, Printer, Eye, Banknote, CreditCard, Edit, Search, FileDown, CalendarDays, Users, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import type { DispatchDestination, DispatchItem, PaymentMethod, LedgerEntry } from '@/types';
import { Navigate } from 'react-router-dom';
import GOTDialog, { GOTCustomerGroup } from '@/components/GOTDialog';
import ReceiptDialog from '@/components/ReceiptDialog';
import DispatchSummaryDialog from '@/components/DispatchSummaryDialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { exportToPDF, exportToExcel } from '@/utils/exportUtils';

export interface CustomerDispatchOrder {
  id: string;
  destination: DispatchDestination | '';
  items: DispatchItem[];
}

export default function DispatchPage() {
  const { 
    currentUser, products, stock, createDispatch, dispatches, getProductById, ledgerEntries, sales,
    deleteLedgerEntry, updateLedgerEntry
  } = useApp();

  if (!currentUser) return <Navigate to="/login" replace />;

  // Multi-Customer State
  const [customerOrders, setCustomerOrders] = useState<CustomerDispatchOrder[]>([
    { id: 'cust-1', destination: '', items: [] }
  ]);
  const [activeCustIdx, setActiveCustIdx] = useState(0);
  const [showMultiGOT, setShowMultiGOT] = useState(false);
  const [multiGOTGroups, setMultiGOTGroups] = useState<GOTCustomerGroup[]>([]);

  // Product Selection & Search State
  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [qty, setQty] = useState('');
  const [adjustedPrice, setAdjustedPrice] = useState('');
  const [showGOT, setShowGOT] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  // Active Customer Helpers
  const activeOrder = customerOrders[activeCustIdx] || customerOrders[0];
  const destination = activeOrder.destination;
  const items = activeOrder.items;

  // Is this destination a named customer (not branch/walkin)?
  const isCustomerDestination = destination && !['branch_1', 'branch_2', 'walkin', ''].includes(destination);

  // Customer Ledger Filtering & Modal States
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterStation, setFilterStation] = useState('all');
  const [searchCustomer, setSearchCustomer] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [selectedCustName, setSelectedCustName] = useState<string | null>(null);
  const [isCustDetailOpen, setIsCustDetailOpen] = useState(false);
  const [custDetailStartDate, setCustDetailStartDate] = useState('');
  const [custDetailEndDate, setCustDetailEndDate] = useState('');

  const [isEditEntryOpen, setIsEditEntryOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Partial<LedgerEntry>>({});

  const safeLower = (str: any) => String(str || '').toLowerCase();

  const filterData = <T extends { date: string, station?: string, name?: string }>(items: T[]) => {
    return items.filter(item => {
      const date = new Date(item.date);
      
      let dateMatch = true;
      if (startDate || endDate) {
        const dateStr = item.date.split('T')[0];
        if (startDate && dateStr < startDate) dateMatch = false;
        if (endDate && dateStr > endDate) dateMatch = false;
      } else {
        const yearMatch = date.getFullYear().toString() === filterYear;
        const monthMatch = filterMonth === 'all' || date.toLocaleString('default', { month: 'long' }) === filterMonth;
        dateMatch = yearMatch && monthMatch;
      }

      const stationMatch = filterStation === 'all' || item.station === filterStation;
      
      let customerMatch = true;
      if (searchCustomer) {
        customerMatch = !!safeLower(item.name).includes(safeLower(searchCustomer));
      }

      return dateMatch && stationMatch && customerMatch;
    });
  };

  const handleExportCustomerLedger = (format: 'pdf' | 'excel') => {
    const filteredRecords = [
      ...filterData(ledgerEntries.filter(e => e.category === 'customer')).map(e => ({
        id: e.id, date: e.date, name: e.name, station: e.station || 'NWS', debit: e.debit, credit: e.credit, type: 'Manual', isManual: true
      }))
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const totalDebit = filteredRecords.reduce((sum, r) => sum + r.debit, 0);
    const totalCredit = filteredRecords.reduce((sum, r) => sum + r.credit, 0);
    const currentBalance = totalDebit - totalCredit;

    const targetCustomerName = searchCustomer || "All Customers";
    const reportTitle = `Customer Ledger Statement - ${targetCustomerName}`;
    const fileBaseName = `customer_ledger_${safeLower(targetCustomerName).replace(/[^a-z0-9]/g, '_')}`;

    if (format === 'pdf') {
      const headers = ['Date', 'Customer Name', 'Station', 'Debit (Sales)', 'Credit (Paid)', 'Balance'];
      let runningBalance = 0;
      const pdfData = filteredRecords.map(r => {
        runningBalance += (r.debit - r.credit);
        return [
          new Date(r.date).toLocaleDateString(),
          r.name || 'Unknown',
          r.station || 'NWS',
          `Rs. ${r.debit.toLocaleString()}`,
          `Rs. ${r.credit.toLocaleString()}`,
          `Rs. ${runningBalance.toLocaleString()}`
        ];
      });

      pdfData.push([]);
      pdfData.push(['', '', 'TOTAL DEBIT (SALES):', `Rs. ${totalDebit.toLocaleString()}`, '', '']);
      pdfData.push(['', '', 'TOTAL CREDIT (PAID):', `Rs. ${totalCredit.toLocaleString()}`, '', '']);
      pdfData.push(['', '', 'CLOSING BALANCE:', `Rs. ${currentBalance.toLocaleString()}`, '', '']);

      exportToPDF(reportTitle, headers, pdfData, fileBaseName);
    } else {
      let runningBalance = 0;
      const excelData = filteredRecords.map(r => {
        runningBalance += (r.debit - r.credit);
        return {
          'Date': new Date(r.date).toLocaleDateString(),
          'Customer Name': r.name || 'Unknown',
          'Station/City': r.station || 'NWS',
          'Debit (Sales) (Rs.)': r.debit,
          'Credit (Paid) (Rs.)': r.credit,
          'Running Balance (Rs.)': runningBalance
        };
      });

      excelData.push({
        'Date': 'TOTAL DEBIT:',
        'Customer Name': totalDebit,
        'Station/City': 'TOTAL CREDIT:',
        'Debit (Sales) (Rs.)': totalCredit,
        'Credit (Paid) (Rs.)': 'CLOSING BALANCE:',
        'Running Balance (Rs.)': currentBalance
      } as any);

      exportToExcel(excelData, fileBaseName, 'Customer Ledger');
    }
    toast.success(`Exported ${targetCustomerName} ledger statement successfully`);
  };
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

  const handleSetDestination = (dest: DispatchDestination) => {
    setCustomerOrders(prev => prev.map((ord, idx) => 
      idx === activeCustIdx ? { ...ord, destination: dest } : ord
    ));
    setSelectedProduct('');
    setQty('');
    setAdjustedPrice('');
  };

  const handleAddAnotherCustomer = () => {
    const newOrder: CustomerDispatchOrder = {
      id: `cust-${Date.now()}`,
      destination: '',
      items: []
    };
    setCustomerOrders(prev => [...prev, newOrder]);
    setActiveCustIdx(customerOrders.length);
    setSelectedProduct('');
    setQty('');
    setAdjustedPrice('');
  };

  const handleRemoveCustomer = (idxToRemove: number) => {
    if (customerOrders.length <= 1) return;
    const updated = customerOrders.filter((_, idx) => idx !== idxToRemove);
    setCustomerOrders(updated);
    setActiveCustIdx(Math.max(0, Math.min(activeCustIdx, updated.length - 1)));
  };

  const addItem = () => {
    if (!selectedProduct || !qty || parseFloat(qty) <= 0) return;
    const finalPrice = isCustomerDestination && adjustedPrice !== ''
      ? parseFloat(adjustedPrice)
      : undefined;

    setCustomerOrders(prev => prev.map((ord, idx) => {
      if (idx !== activeCustIdx) return ord;
      const existing = ord.items.find(i => i.productId === selectedProduct);
      if (existing) {
        return {
          ...ord,
          items: ord.items.map(i => i.productId === selectedProduct
            ? { ...i, quantity: i.quantity + parseFloat(qty), customPrice: finalPrice ?? i.customPrice }
            : i
          )
        };
      }
      return {
        ...ord,
        items: [...ord.items, { productId: selectedProduct, quantity: parseFloat(qty), customPrice: finalPrice }]
      };
    }));
    setSelectedProduct('');
    setQty('');
    setAdjustedPrice('');
  };

  const removeItem = (productId: string) => {
    setCustomerOrders(prev => prev.map((ord, idx) => {
      if (idx !== activeCustIdx) return ord;
      return {
        ...ord,
        items: ord.items.filter(i => i.productId !== productId)
      };
    }));
  };

  const handleDispatch = async (paymentMeth: PaymentMethod = 'cash') => {
    if (!destination || items.length === 0) return;
    
    const isSale = !['branch_1', 'branch_2'].includes(destination);
    if (isSale && !custName) {
      toast.error('Customer name is required');
      return;
    }

    // Prepare receipt data — use customPrice for customer wholesale pricing
    let receiptItems = items.map(i => ({
      name: getProductById(i.productId)?.name || 'Unknown',
      quantity: i.quantity,
      unitPrice: i.customPrice ?? getProductById(i.productId)?.price ?? 0
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
      setCustomerOrders(prev => prev.map((ord, idx) => 
        idx === activeCustIdx ? { ...ord, destination: '', items: [] } : ord
      ));
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

  const handlePrintAllGOT = async () => {
    const validOrders = customerOrders.filter(c => c.items.length > 0 && c.destination);
    if (validOrders.length === 0) {
      toast.error('Please select customer destination and add items first');
      return;
    }

    const groups: GOTCustomerGroup[] = validOrders.map(c => ({
      customerName: destLabels[c.destination] || c.destination || 'Customer',
      items: c.items.map(i => ({
        name: getProductById(i.productId)?.name || 'Unknown',
        quantity: i.quantity
      }))
    }));

    setMultiGOTGroups(groups);
    setShowMultiGOT(true);

    for (const ord of validOrders) {
      const isSale = !['branch_1', 'branch_2'].includes(ord.destination);
      const cName = isSale ? (destLabels[ord.destination] || ord.destination) : undefined;
      await createDispatch(
        ord.destination,
        ord.items,
        'cash',
        cName
      );
    }

    toast.success(`Dispatched ${validOrders.length} customer order(s) in Single GOT!`);
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

  // Feature 2 & 3: Product Search + Over-Dispatch Allowed (never filter out zero stock)
  const availableProducts = products.filter(p => 
    p.isActive !== false &&
    (!productSearch || 
      p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
      p.category?.toLowerCase().includes(productSearch.toLowerCase()))
  );

  const destLabels: Record<string, string> = { branch_1: 'Branch 1', branch_2: 'Branch 2', walkin: 'Walk-in (Factory)' };
  const customerDestinations = Array.from(new Set(ledgerEntries.filter(e => e.category === 'customer' && e.name).map(e => e.name!)));

  const combinedTotalItems = customerOrders.reduce(
    (total, ord) => total + ord.items.reduce((s, it) => s + it.quantity, 0),
    0
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dispatch</h1>
        <p className="text-sm text-muted-foreground">Send products to branches, customers, or walk-in sales with Single GOT printing</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" /> New Dispatch
            </CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddAnotherCustomer}
              className="text-xs font-bold border-dashed border-primary/50 text-primary hover:bg-primary/10"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Another Customer
            </Button>
          </div>

          {/* Multi-Customer Tabs Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pt-2 pb-1">
            {customerOrders.map((ord, idx) => {
              const isActive = idx === activeCustIdx;
              const count = ord.items.reduce((s, it) => s + it.quantity, 0);
              const name = destLabels[ord.destination] || ord.destination || `Customer ${idx + 1}`;

              return (
                <div
                  key={ord.id}
                  onClick={() => setActiveCustIdx(idx)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold cursor-pointer transition-all shrink-0",
                    isActive
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-muted/50 hover:bg-muted text-muted-foreground border-border"
                  )}
                >
                  <span>{idx + 1}. {name}</span>
                  <span className={cn(
                    "px-1.5 py-0.5 rounded-full text-[10px] font-mono",
                    isActive ? "bg-white/20 text-white" : "bg-muted text-foreground"
                  )}>
                    {count} items
                  </span>
                  {customerOrders.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveCustomer(idx);
                      }}
                      className="ml-1 hover:text-destructive transition-colors"
                      title="Remove customer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <Label>Destination for {destLabels[destination] || destination || `Customer ${activeCustIdx + 1}`}</Label>
              <span className="text-[11px] text-muted-foreground font-semibold">Active: Order #{activeCustIdx + 1}</span>
            </div>
            <Select value={destination} onValueChange={v => handleSetDestination(v as DispatchDestination)}>
              <SelectTrigger><SelectValue placeholder="Select customer or branch destination" /></SelectTrigger>
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
            {isCustomerDestination && (
              <div className="mt-2 flex items-center gap-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 shrink-0">Wholesale Mode</span>
                <span className="text-[10px] text-amber-500">— Set custom rates per product below</span>
              </div>
            )}
          </div>

          {/* Feature 2: Product Search Bar with Professional Search Icon */}
          <div>
            <Label className="text-xs mb-1 block">Search & Select Product</Label>
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder="Search product by name or category…"
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                className="pl-8 text-xs bg-background"
              />
              {productSearch && (
                <button
                  type="button"
                  onClick={() => setProductSearch('')}
                  className="absolute right-2.5 top-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Product selector row */}
          <div className={`grid gap-3 ${isCustomerDestination ? 'grid-cols-1 sm:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3'}`}>
            <div>
              <Label>Product</Label>
              <Select
                value={selectedProduct}
                onValueChange={v => {
                  setSelectedProduct(v);
                  const p = products.find(pr => pr.id === v);
                  setAdjustedPrice(p?.price !== undefined ? String(p.price) : '');
                }}
              >
                <SelectTrigger><SelectValue placeholder="Choose product" /></SelectTrigger>
                <SelectContent>
                  {availableProducts.length === 0 ? (
                    <div className="p-2 text-xs text-muted-foreground text-center">No products found</div>
                  ) : (
                    availableProducts.map(p => {
                      const avail = stock[p.id]?.production || 0;
                      return (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} ({avail} avail)
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Wholesale price override */}
            {isCustomerDestination && (
              <div>
                <Label className="flex items-center gap-1.5">
                  <span>Set Price</span>
                  {selectedProduct && (() => {
                    const p = getProductById(selectedProduct);
                    const regular = p?.price;
                    const current = parseFloat(adjustedPrice);
                    if (!regular || !adjustedPrice) return null;
                    if (current < regular) {
                      const disc = (((regular - current) / regular) * 100).toFixed(0);
                      return <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-md px-1.5 py-0.5">↓ {disc}% off</span>;
                    }
                    if (current > regular) {
                      return <span className="text-[10px] font-black text-rose-600 bg-rose-50 border border-rose-200 rounded-md px-1.5 py-0.5">↑ Premium</span>;
                    }
                    return <span className="text-[10px] font-black text-slate-400 bg-slate-50 border border-slate-200 rounded-md px-1.5 py-0.5">Regular</span>;
                  })()}
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 pointer-events-none">Rs.</span>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    value={adjustedPrice}
                    onChange={e => setAdjustedPrice(e.target.value)}
                    placeholder={selectedProduct ? String(getProductById(selectedProduct)?.price ?? '') : 'Select product first'}
                    className="pl-9 font-mono font-bold border-amber-200 focus:border-amber-400 focus:ring-amber-200 bg-amber-50/30"
                    disabled={!selectedProduct}
                  />
                </div>
              </div>
            )}

            {/* Feature 3: Over-dispatch allowed (No max constraint) */}
            <div>
              <Label>Quantity</Label>
              <Input 
                type="number" 
                min="0.01" 
                step="any" 
                value={qty} 
                onChange={e => setQty(e.target.value)} 
                placeholder="Enter quantity"
              />
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={addItem} disabled={!selectedProduct || !qty} className="w-full">
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
          </div>

          {/* Active Customer Items Table */}
          {items.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Items for {destLabels[destination] || destination || `Customer ${activeCustIdx + 1}`}:</Label>
                {isCustomerDestination && (
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-amber-400"></span> Wholesale Pricing Active
                  </span>
                )}
              </div>
              <div className="rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                {isCustomerDestination && (
                  <div className="grid grid-cols-12 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <div className="col-span-4">Product</div>
                    <div className="col-span-2 text-right">Regular</div>
                    <div className="col-span-2 text-right">Wholesale</div>
                    <div className="col-span-1 text-right">Qty</div>
                    <div className="col-span-2 text-right">Subtotal</div>
                    <div className="col-span-1"></div>
                  </div>
                )}
                {items.map(item => {
                  const p = getProductById(item.productId);
                  const available = stock[item.productId]?.production || 0;
                  const isShortage = item.quantity > available;
                  const regularPrice = p?.price || 0;
                  const billedPrice = item.customPrice ?? regularPrice;
                  const subtotal = item.quantity * billedPrice;
                  const isDiscounted = item.customPrice !== undefined && item.customPrice < regularPrice;
                  const isPremium = item.customPrice !== undefined && item.customPrice > regularPrice;

                  return (
                    <div
                      key={item.productId}
                      className={`flex items-center px-3 py-2.5 border-b last:border-b-0 border-slate-50 dark:border-slate-800 gap-2 ${
                        isShortage ? 'bg-amber-50/50 dark:bg-amber-950/20' : 'hover:bg-slate-50/30'
                      } transition-colors`}
                    >
                      {isCustomerDestination ? (
                        <>
                          <div className="flex-1 min-w-0">
                            <span className="font-bold text-sm text-foreground truncate block">{p?.name}</span>
                            {isShortage && (
                              <span className="text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                                ⚠️ Shortage: +{(item.quantity - available)} (Over-Dispatch Allowed)
                              </span>
                            )}
                          </div>
                          <div className="w-20 text-right">
                            <span className="font-mono text-xs text-muted-foreground line-through">{regularPrice.toLocaleString()}</span>
                          </div>
                          <div className="w-24 text-right">
                            <span className={`font-mono text-sm font-black ${
                              isDiscounted ? 'text-emerald-600' : isPremium ? 'text-rose-600' : 'text-foreground'
                            }`}>
                              Rs. {billedPrice.toLocaleString()}
                            </span>
                          </div>
                          <div className="w-12 text-right">
                            <span className="font-mono text-sm text-foreground font-bold">×{item.quantity}</span>
                          </div>
                          <div className="w-24 text-right">
                            <span className="font-mono text-sm font-black text-foreground">Rs. {subtotal.toLocaleString()}</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex-1 flex items-center justify-between">
                          <div>
                            <span className="font-medium text-foreground">{p?.name}</span>
                            <span className="text-muted-foreground ml-2">× {item.quantity}</span>
                            {isShortage && (
                              <span className="text-amber-600 text-xs ml-2 font-bold">
                                ⚠️ Shortage: +{(item.quantity - available)} (Over-Dispatch Allowed)
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-xs text-muted-foreground">Avail: {available}</span>
                        </div>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => removeItem(item.productId)} className="shrink-0 h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })}

                {/* Subtotal for active customer */}
                {isCustomerDestination && items.length > 0 && (
                  <div className="flex items-center justify-between px-3 py-2 bg-slate-900 text-white">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                      {destLabels[destination] || destination}: {items.length} Item(s)
                    </span>
                    <span className="font-mono text-base font-black text-white">
                      Rs. {items.reduce((sum, i) => sum + i.quantity * (i.customPrice ?? getProductById(i.productId)?.price ?? 0), 0).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Combined Multi-Customer Manifest Summary (when multiple customers added) */}
          {customerOrders.length > 1 && (
            <div className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-primary">
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" /> Multi-Customer GOT Manifest ({customerOrders.length} Customers)
                </span>
                <span className="font-mono text-sm">TOTAL: {combinedTotalItems} Items</span>
              </div>
              <div className="space-y-1 text-xs">
                {customerOrders.map((ord, idx) => (
                  <div key={ord.id} className="flex justify-between py-1 border-b border-border/50 last:border-b-0">
                    <span className="font-medium text-foreground">
                      {idx + 1}. {destLabels[ord.destination] || ord.destination || 'Unnamed Customer'}
                    </span>
                    <span className="font-mono text-muted-foreground">
                      {ord.items.reduce((s, it) => s + it.quantity, 0)} items ({ord.items.length} product lines)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {destination === 'walkin' && items.length > 0 && (
            <Alert><AlertCircle className="h-4 w-4" /><AlertDescription>Walk-in dispatch will automatically record as a factory gate sale.</AlertDescription></Alert>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-1">
            {customerOrders.length > 1 ? (
              <>
                <Button 
                  onClick={handlePrintAllGOT}
                  disabled={combinedTotalItems === 0}
                  className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 font-bold"
                >
                  <Printer className="h-4 w-4 mr-2" /> Print All (Single GOT)
                </Button>
                <Button
                  variant="outline"
                  onClick={handleAddAnotherCustomer}
                  className="flex-1 sm:flex-none text-xs font-bold"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Another Customer
                </Button>
              </>
            ) : (
              <>
                {!['branch_1', 'branch_2'].includes(destination) ? (
                  <Button onClick={handleWalkinDispatch} disabled={items.length === 0} className="flex-1 sm:flex-none bg-success hover:bg-success/90">
                    <CreditCard className="h-4 w-4 mr-2" /> Complete Sale
                  </Button>
                ) : (
                  <Button onClick={() => handleDispatch()} disabled={!destination || items.length === 0} className="flex-1 sm:flex-none">
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

                <Button
                  variant="outline"
                  onClick={handleAddAnotherCustomer}
                  className="flex-1 sm:flex-none text-xs font-bold"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Another Customer
                </Button>
              </>
            )}
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
            {/* Total Payable — respects wholesale custom prices */}
            <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 rounded-lg px-4 py-3 flex justify-between items-center">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Total Payable</span>
              <span className="text-xl font-black text-indigo-700 dark:text-indigo-300 font-mono">
                Rs. {items.reduce((sum, item) => sum + item.quantity * (item.customPrice ?? getProductById(item.productId)?.price ?? 0), 0).toLocaleString()}
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

      <GOTDialog 
        open={showMultiGOT}
        onClose={() => setShowMultiGOT(false)}
        customerGroups={multiGOTGroups}
        tokenNumber={dispatches.filter(d => d.date === new Date().toISOString().slice(0, 10)).length + 1}
      />

      {/* Customer Ledger */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" /> Customer Ledger
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2 text-primary hover:bg-primary/5"
              onClick={() => setShowSummary(true)}
            >
              <Eye className="h-4 w-4" /> Day Summary
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-6 p-4 bg-muted/30 rounded-lg border">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Label className="text-xs font-bold uppercase text-slate-500">Year:</Label>
                <Select value={filterYear} onValueChange={setFilterYear}>
                  <SelectTrigger className="w-24 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['2023', '2024', '2025', '2026', '2027'].map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs font-bold uppercase text-slate-500">Month:</Label>
                <Select value={filterMonth} onValueChange={setFilterMonth}>
                  <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Months</SelectItem>
                    {['January','February','March','April','May','June','July','August','September','October','November','December'].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs font-bold uppercase text-slate-500">City/Station:</Label>
                <Select value={filterStation} onValueChange={setFilterStation}>
                  <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cities</SelectItem>
                    {Array.from(new Set(ledgerEntries.filter(e => e.category === 'customer').map(e => e.station).filter(Boolean))).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs font-bold uppercase text-slate-500">Search Customer:</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input placeholder="Customer name..." value={searchCustomer} onChange={e => setSearchCustomer(e.target.value)} className="pl-7 h-8 text-xs w-40 bg-background" />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 bg-muted/20 p-2 rounded-md border">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold uppercase text-slate-500">From:</span>
                <div className="relative flex items-center">
                  <CalendarDays className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-primary pointer-events-none z-10" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="h-8 pl-7 pr-2 text-xs w-36 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 [color-scheme:light] dark:[color-scheme:dark]"
                  />
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold uppercase text-slate-500">To:</span>
                <div className="relative flex items-center">
                  <CalendarDays className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-primary pointer-events-none z-10" />
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="h-8 pl-7 pr-2 text-xs w-36 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 [color-scheme:light] dark:[color-scheme:dark]"
                  />
                </div>
              </div>
              {(startDate || endDate || searchCustomer) && (
                <Button variant="ghost" size="sm" onClick={() => { setStartDate(''); setEndDate(''); setSearchCustomer(''); }} className="h-8 text-xs text-muted-foreground hover:text-foreground">
                  Clear
                </Button>
              )}
              <div className="flex items-center gap-2 ml-auto">
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1 border-primary/20 hover:bg-primary/5 font-medium shadow-sm transition-colors" onClick={() => handleExportCustomerLedger('pdf')}>
                  <FileDown className="h-3.5 w-3.5 text-primary" /> Export PDF
                </Button>
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1 border-primary/20 hover:bg-primary/5 font-medium shadow-sm transition-colors" onClick={() => handleExportCustomerLedger('excel')}>
                  <FileDown className="h-3.5 w-3.5 text-primary" /> Export Excel
                </Button>
              </div>
            </div>
          </div>

          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Customer Name</TableHead>
                <TableHead>Station</TableHead>
                <TableHead className="text-right">Debit (Sales)</TableHead>
                <TableHead className="text-right">Credit (Paid)</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="text-right w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(() => {
                const allCustomerRecords = [
                  ...filterData(ledgerEntries.filter(e => e.category === 'customer')).map(e => ({
                    id: e.id,
                    date: e.date,
                    name: e.name,
                    station: e.station || 'NWS',
                    debit: e.debit,
                    credit: e.credit,
                    type: e.accountHead && e.accountHead.startsWith('Dispatched Sales') ? 'Dispatch' : 'Manual',
                    accountHead: e.accountHead,
                    isManual: true
                  }))
                ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                if (allCustomerRecords.length === 0) return <TableRow><TableCell colSpan={7} className="text-center py-8">No customer data found</TableCell></TableRow>;
                
                return allCustomerRecords.map((rec, idx) => (
                  <TableRow key={`${rec.id}-${idx}`}>
                    <TableCell className="text-xs">{new Date(rec.date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span 
                          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline font-semibold cursor-pointer w-fit"
                          onClick={() => {
                            setSelectedCustName(rec.name || null);
                            setCustDetailStartDate('');
                            setCustDetailEndDate('');
                            setIsCustDetailOpen(true);
                          }}
                        >
                          {rec.name}
                        </span>
                        {rec.accountHead && (
                          <span className="text-[10px] text-muted-foreground mt-0.5 max-w-[300px] break-words">
                            {rec.accountHead}
                          </span>
                        )}
                        <Badge variant="outline" className="w-fit text-[8px] h-3 px-1 mt-1">{rec.type}</Badge>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{rec.station}</Badge></TableCell>
                    <TableCell className="text-right font-mono text-destructive">Rs. {rec.debit.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono text-success">Rs. {rec.credit.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono font-bold">Rs. {(rec.debit - rec.credit).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      {rec.isManual && (
                        <div className="flex justify-end gap-2">
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-primary" onClick={() => {
                            setEditingEntry(rec);
                            setIsEditEntryOpen(true);
                          }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => {
                            if (confirm(`Delete this ledger record?`)) deleteLedgerEntry(rec.id!);
                          }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ));
              })()}
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

      {/* Individual Customer Detailed Ledger Dialog */}
      <Dialog open={isCustDetailOpen} onOpenChange={setIsCustDetailOpen}>
        <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden bg-background">
          <DialogHeader className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-bold text-white">
                  Customer Detailed Statement
                </DialogTitle>
                <DialogDescription className="text-indigo-100 text-sm mt-0.5">
                  Account Ledger statement for <span className="font-bold underline">{selectedCustName}</span>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="px-6 py-5 space-y-6 max-h-[80vh] overflow-y-auto">
            {/* Stats Summary Cards */}
            {(() => {
              const customerManual = ledgerEntries.filter(e => e.category === 'customer' && e.name === selectedCustName);
              const totalDebit = customerManual.reduce((sum, e) => sum + e.debit, 0);
              const totalCredit = customerManual.reduce((sum, e) => sum + e.credit, 0);
              const balance = totalDebit - totalCredit;
              const station = customerManual.length > 0 ? customerManual[0].station : 'Factory Gate';

              const filteredModalEntries = customerManual.filter(entry => {
                if (custDetailStartDate || custDetailEndDate) {
                  const dateStr = entry.date.split('T')[0];
                  if (custDetailStartDate && dateStr < custDetailStartDate) return false;
                  if (custDetailEndDate && dateStr > custDetailEndDate) return false;
                }
                return true;
              }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

              const modalDebit = filteredModalEntries.reduce((sum, r) => sum + r.debit, 0);
              const modalCredit = filteredModalEntries.reduce((sum, r) => sum + r.credit, 0);
              const modalBalance = modalDebit - modalCredit;

              const exportSingleCustomer = (format: 'pdf' | 'excel') => {
                const title = `Statement of Account - ${selectedCustName}`;
                const fileBaseName = `statement_${(selectedCustName || '').toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

                if (format === 'pdf') {
                  const headers = ['Date', 'Details / Products', 'Debit (Sales)', 'Credit (Paid)', 'Balance'];
                  let runningBal = 0;
                  const pdfData = filteredModalEntries.map(r => {
                    runningBal += (r.debit - r.credit);
                    return [
                      new Date(r.date).toLocaleDateString(),
                      r.accountHead || 'Sales/Payment',
                      `Rs. ${r.debit.toLocaleString()}`,
                      `Rs. ${r.credit.toLocaleString()}`,
                      `Rs. ${runningBal.toLocaleString()}`
                    ];
                  });
                  pdfData.push([]);
                  pdfData.push(['', 'TOTAL DEBIT:', `Rs. ${modalDebit.toLocaleString()}`, '', '']);
                  pdfData.push(['', 'TOTAL CREDIT:', `Rs. ${modalCredit.toLocaleString()}`, '', '']);
                  pdfData.push(['', 'CLOSING BALANCE:', `Rs. ${modalBalance.toLocaleString()}`, '', '']);

                  exportToPDF(title, headers, pdfData, fileBaseName);
                } else {
                  let runningBal = 0;
                  const excelData = filteredModalEntries.map(r => {
                    runningBal += (r.debit - r.credit);
                    return {
                      'Date': new Date(r.date).toLocaleDateString(),
                      'Details': r.accountHead || 'Sales/Payment',
                      'Debit (Sales)': r.debit,
                      'Credit (Paid)': r.credit,
                      'Running Balance': runningBal
                    };
                  });
                  excelData.push({
                    'Date': 'TOTAL DEBIT:',
                    'Details': modalDebit,
                    'Debit (Sales)': 'TOTAL CREDIT:',
                    'Credit (Paid)': modalCredit,
                    'Running Balance': `BALANCE: ${modalBalance}`
                  } as any);

                  exportToExcel(excelData, fileBaseName, 'Customer Ledger');
                }
                toast.success(`Exported statement for ${selectedCustName}`);
              };

              return (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-muted/40 p-4 rounded-lg border flex flex-col justify-center">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">City/Station</span>
                      <span className="text-lg font-bold text-foreground mt-1">{station}</span>
                    </div>
                    <div className="bg-destructive/5 dark:bg-destructive/10 p-4 rounded-lg border border-destructive/10 flex flex-col justify-center">
                      <span className="text-[10px] uppercase font-bold text-destructive tracking-wider">Total Sales (Debit)</span>
                      <span className="text-xl font-extrabold text-destructive font-mono mt-1">Rs. {totalDebit.toLocaleString()}</span>
                    </div>
                    <div className="bg-success/5 dark:bg-success/10 p-4 rounded-lg border border-success/10 flex flex-col justify-center">
                      <span className="text-[10px] uppercase font-bold text-success tracking-wider">Total Paid (Credit)</span>
                      <span className="text-xl font-extrabold text-success font-mono mt-1">Rs. {totalCredit.toLocaleString()}</span>
                    </div>
                    <div className="bg-indigo-50 dark:bg-indigo-950/30 p-4 rounded-lg border border-indigo-100 dark:border-indigo-900 flex flex-col justify-center">
                      <span className="text-[10px] uppercase font-bold text-indigo-700 dark:text-indigo-300 tracking-wider">Outstanding Balance</span>
                      <span className="text-xl font-extrabold text-indigo-700 dark:text-indigo-300 font-mono mt-1">Rs. {balance.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 bg-muted/30 p-3 rounded-lg border">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold uppercase text-muted-foreground">From:</span>
                        <input
                          type="date"
                          value={custDetailStartDate}
                          onChange={e => setCustDetailStartDate(e.target.value)}
                          className="h-8 px-2 text-xs w-32 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold uppercase text-muted-foreground">To:</span>
                        <input
                          type="date"
                          value={custDetailEndDate}
                          onChange={e => setCustDetailEndDate(e.target.value)}
                          className="h-8 px-2 text-xs w-32 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      {(custDetailStartDate || custDetailEndDate) && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => { setCustDetailStartDate(''); setCustDetailEndDate(''); }}
                          className="h-8 text-xs text-muted-foreground hover:text-foreground"
                        >
                          Clear Filter
                        </Button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" className="h-8 text-xs gap-1 border-primary/20 hover:bg-primary/5 shadow-sm" onClick={() => exportSingleCustomer('pdf')}>
                        <FileDown className="h-3.5 w-3.5 text-primary" /> Export PDF
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 text-xs gap-1 border-primary/20 hover:bg-primary/5 shadow-sm" onClick={() => exportSingleCustomer('excel')}>
                        <FileDown className="h-3.5 w-3.5 text-primary" /> Export Excel
                      </Button>
                    </div>
                  </div>

                  <div className="border rounded-lg overflow-hidden shadow-sm bg-background">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead className="w-[120px]">Date</TableHead>
                          <TableHead>Details / Purchased Products</TableHead>
                          <TableHead className="text-right w-[120px]">Debit (Sales)</TableHead>
                          <TableHead className="text-right w-[120px]">Credit (Paid)</TableHead>
                          <TableHead className="text-right w-[120px]">Balance</TableHead>
                          <TableHead className="text-right w-[90px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredModalEntries.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                              No transactions found for the selected period
                            </TableCell>
                          </TableRow>
                        ) : (() => {
                          let rBal = 0;
                          return filteredModalEntries.map((rec) => {
                            rBal += (rec.debit - rec.credit);
                            const entryType = rec.accountHead && rec.accountHead.startsWith('Dispatched Sales') ? 'Dispatch' : 'Manual';
                            return (
                              <TableRow key={rec.id}>
                                <TableCell className="text-xs">{new Date(rec.date).toLocaleDateString()}</TableCell>
                                <TableCell className="font-medium">
                                  <div className="flex flex-col">
                                    <span className="text-xs text-foreground font-semibold">{rec.accountHead}</span>
                                    <Badge variant="outline" className="w-fit text-[8px] h-3.5 px-1.5 mt-1">{entryType}</Badge>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right font-mono text-destructive text-xs">Rs. {rec.debit.toLocaleString()}</TableCell>
                                <TableCell className="text-right font-mono text-success text-xs">Rs. {rec.credit.toLocaleString()}</TableCell>
                                <TableCell className="text-right font-mono font-bold text-xs">Rs. {rBal.toLocaleString()}</TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-1.5">
                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-primary" onClick={() => {
                                      setEditingEntry(rec);
                                      setIsEditEntryOpen(true);
                                    }}>
                                      <Edit className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => {
                                      if (confirm(`Delete this ledger record?`)) {
                                        deleteLedgerEntry(rec.id);
                                        if (filteredModalEntries.length <= 1) {
                                          setIsCustDetailOpen(false);
                                        }
                                      }
                                    }}>
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          });
                        })()}
                      </TableBody>
                    </Table>
                  </div>
                </>
              );
            })()}
          </div>
          
          <DialogFooter className="bg-slate-50 dark:bg-slate-900 px-6 py-3 border-t">
            <Button size="sm" onClick={() => setIsCustDetailOpen(false)} className="rounded-lg px-5">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Ledger Entry Dialog */}
      <Dialog open={isEditEntryOpen} onOpenChange={setIsEditEntryOpen}>
        <DialogContent className="bg-background">
          <DialogHeader>
            <DialogTitle>Edit Ledger Entry</DialogTitle>
            <DialogDescription>Update the details for this manual ledger entry.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2 col-span-2">
              <Label>Date</Label>
              <Input type="date" value={editingEntry.date?.split('T')[0]} onChange={e => setEditingEntry({...editingEntry, date: e.target.value})} />
            </div>
            
            {(editingEntry.category === 'customer' || editingEntry.category === 'vendor') ? (
              <>
                <div className="space-y-2 col-span-2">
                  <Label>{editingEntry.category === 'customer' ? 'Customer Name' : 'Vendor Name'}</Label>
                  <Input value={editingEntry.name || ''} onChange={e => setEditingEntry({...editingEntry, name: e.target.value})} />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Details / Description</Label>
                  <Input value={editingEntry.accountHead || ''} onChange={e => setEditingEntry({...editingEntry, accountHead: e.target.value})} />
                </div>
                {editingEntry.category === 'customer' && (
                  <div className="space-y-2 col-span-2">
                    <Label>Station / City</Label>
                    <Input value={editingEntry.station || ''} onChange={e => setEditingEntry({...editingEntry, station: e.target.value})} />
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="space-y-2 col-span-2">
                  <Label>Name / Title of Account</Label>
                  <Input value={editingEntry.name || editingEntry.accountHead || ''} onChange={e => setEditingEntry({...editingEntry, name: e.target.value, accountHead: e.target.value})} />
                </div>

                {editingEntry.category === 'general' && (
                  <>
                    <div className="space-y-2">
                      <Label>Account No</Label>
                      <Input value={editingEntry.accountNo || ''} onChange={e => setEditingEntry({...editingEntry, accountNo: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select value={editingEntry.accountType} onValueChange={v => setEditingEntry({...editingEntry, accountType: v as any})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Income">Income</SelectItem>
                          <SelectItem value="Expense">Expense</SelectItem>
                          <SelectItem value="Asset">Asset</SelectItem>
                          <SelectItem value="Liability">Liability</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </>
            )}

            <div className="space-y-2">
              <Label className="text-destructive font-bold">Debit</Label>
              <Input type="number" value={editingEntry.debit} onChange={e => setEditingEntry({...editingEntry, debit: Number(e.target.value)})} />
            </div>
            <div className="space-y-2">
              <Label className="text-success font-bold">Credit</Label>
              <Input type="number" value={editingEntry.credit} onChange={e => setEditingEntry({...editingEntry, credit: Number(e.target.value)})} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Closing Balance</Label>
              <Input type="number" value={editingEntry.closingBalance} onChange={e => setEditingEntry({...editingEntry, closingBalance: Number(e.target.value)})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditEntryOpen(false)}>Cancel</Button>
            <Button onClick={async () => {
              if (editingEntry.id) {
                await updateLedgerEntry(editingEntry.id, editingEntry);
                setIsEditEntryOpen(false);
              }
            }}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
