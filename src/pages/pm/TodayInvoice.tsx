import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Printer, ArrowLeft, User, AlertCircle, FileText, CheckCircle2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { CustomerLedgerInvoiceA4, InvoiceItem } from '@/components/invoice/CustomerLedgerInvoiceA4';

// Format date as "09-Sep-2026"
function formatDisplayDate(d: Date): string {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const dd = String(d.getDate()).padStart(2, '0');
  const mon = months[d.getMonth()];
  const yyyy = d.getFullYear();
  return `${dd}-${mon}-${yyyy}`;
}

// Format date as YYYYMMDD for invoice number
function dateKey(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

export default function TodayInvoicePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    currentUser, selectedProfile, products, ledgerEntries, addLedgerEntry, loadModuleData, sales
  } = useApp();

  const printRef = useRef<HTMLDivElement>(null);
  const [isSaved, setIsSaved] = useState(false);

  // Role check
  const role = (selectedProfile?.role || currentUser?.role || '').toLowerCase();
  const isProductManager = role === 'production_manager' || role === 'product_manager' || role === 'admin' || role.includes('manager');

  useEffect(() => {
    loadModuleData('sales');
    loadModuleData('finance');
    loadModuleData('inventory');
  }, [loadModuleData]);

  const now = new Date();
  const customerName = decodeURIComponent(id || '');

  // Previous balance from ledger entries
  const customerRecords = ledgerEntries.filter(e => e.category === 'customer' && e.name === customerName);
  const totalDebit = customerRecords.reduce((sum, e) => sum + e.debit, 0);
  const totalCredit = customerRecords.reduce((sum, e) => sum + e.credit, 0);
  const prevBalance = totalDebit - totalCredit;

  // Customer info from ledger or sales
  const station = customerRecords.length > 0 ? (customerRecords[0].station || 'N/A') : 'N/A';
  const foundPhone = sales.find(s => s.customerName === customerName)?.customerPhone || '';

  // Invoice number — use timestamp-based unique sequence to avoid duplicates
  const dKey = dateKey(now);
  const todayPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const todayInvoicesCount = ledgerEntries.filter(e =>
    e.date.startsWith(todayPrefix) && e.accountHead?.includes('LEDGER_INVOICE')
  ).length;
  const invoiceSequence = String(todayInvoicesCount + 1).padStart(3, '0');
  const [invoiceNo] = useState(`INV-${dKey}-${invoiceSequence}`);
  const displayDate = formatDisplayDate(now);

  // Form state
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [itemQty, setItemQty] = useState('');
  const [itemRate, setItemRate] = useState('');
  const [customerPhone, setCustomerPhone] = useState(foundPhone);
  const [isSaving, setIsSaving] = useState(false);

  // Sync phone when sales data loads
  useEffect(() => {
    if (foundPhone && !customerPhone) setCustomerPhone(foundPhone);
  }, [foundPhone]);

  if (!currentUser || !selectedProfile) return <Navigate to="/login" replace />;

  if (!isProductManager) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p className="text-muted-foreground">This feature is for Production Manager / Admin only.</p>
        <Button onClick={() => navigate('/accounts')}>Return to Accounts</Button>
      </div>
    );
  }

  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId);
    const prod = products.find(p => p.id === productId);
    if (prod) setItemRate(String(prod.price || 0));
  };

  const handleAddItem = () => {
    if (!selectedProductId) { toast.error('Please select a product'); return; }
    const qtyNum = parseFloat(itemQty);
    const rateNum = parseFloat(itemRate);
    if (isNaN(qtyNum) || qtyNum <= 0) { toast.error('Enter a valid quantity'); return; }
    if (isNaN(rateNum) || rateNum < 0) { toast.error('Enter a valid rate'); return; }
    const prod = products.find(p => p.id === selectedProductId);
    const newItem: InvoiceItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: prod?.name || 'Unknown',
      qty: qtyNum,
      rate: rateNum,
      amount: qtyNum * rateNum,
    };
    setItems(prev => [...prev, newItem]);
    setSelectedProductId('');
    setItemQty('');
    setItemRate('');
  };

  const handleRemoveItem = (itemId: string) => {
    if (isSaved) { toast.warning('Invoice already saved — cannot remove items'); return; }
    setItems(items.filter(i => i.id !== itemId));
  };

  const todayTotal = items.reduce((sum, item) => sum + item.amount, 0);
  const totalAmount = todayTotal + prevBalance;
  const grandTotal = totalAmount;

  // Iframe-based A4 print
  const triggerPrint = () => {
    const el = printRef.current;
    if (!el) { window.print(); return; }

    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:210mm;height:297mm;border:none;';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"],style')).map(s => s.outerHTML).join('\n');
    doc.open();
    doc.write(`<!DOCTYPE html><html><head><title>Invoice - ${customerName} - ${invoiceNo}</title>${styles}<style>
      @page { size: A4 portrait; margin: 0; }
      body { background: white !important; color: black !important; margin: 0 !important; padding: 0 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    </style></head><body>${el.innerHTML}<script>window.onload=function(){setTimeout(function(){window.print();window.onafterprint=function(){window.close();};},400);};<\/script></body></html>`);
    doc.close();
    setTimeout(() => { if (document.body.contains(iframe)) document.body.removeChild(iframe); }, 12000);
  };

  const handleSaveAndPrint = async () => {
    if (items.length === 0) { toast.error('Add at least one item'); return; }
    setIsSaving(true);
    try {
      const todayISO = new Date().toISOString().slice(0, 10);
      const itemsSummary = items.map(i => `${i.qty}x ${i.name} @${i.rate}`).join(', ');
      await addLedgerEntry({
        date: todayISO,
        accountHead: `LEDGER_INVOICE #${invoiceNo} | ${itemsSummary}`,
        accountType: 'Asset',
        debit: todayTotal,
        credit: 0,
        name: customerName,
        station,
        accountNo: invoiceNo,
        closingBalance: grandTotal,
        category: 'customer',
      });
      setIsSaved(true);
      toast.success(`Invoice ${invoiceNo} saved!`);
      setTimeout(() => triggerPrint(), 300);
    } catch (err: any) {
      toast.error(`Save failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrintOnly = () => {
    if (items.length === 0) { toast.error('No items to print'); return; }
    triggerPrint();
  };

  return (
    <div className="space-y-6 pb-16 animate-fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-4 rounded-xl border shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate('/accounts')} className="h-9 w-9 rounded-lg">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">Customer Daily Ledger Invoice</h1>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">PM Only</span>
              {isSaved && <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase flex items-center gap-1"><CheckCircle2 className="h-3 w-3"/>Saved</span>}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              A4 credit/debit invoice for <strong className="text-foreground">{customerName}</strong> &nbsp;·&nbsp; {invoiceNo}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isSaved && (
            <Button variant="outline" onClick={handlePrintOnly} className="text-xs font-semibold gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" /> Re-Print
            </Button>
          )}
          <Button variant="outline" onClick={() => navigate('/accounts')} className="text-xs font-semibold">Cancel</Button>
          <Button
            onClick={isSaved ? handlePrintOnly : handleSaveAndPrint}
            disabled={items.length === 0 || isSaving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-2 shadow-sm"
          >
            <Printer className="h-4 w-4" />
            {isSaving ? 'Saving...' : isSaved ? 'Print Again' : 'Save & Print A4'}
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Customer Info + Add Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-700 dark:text-slate-200">
                <User className="h-4 w-4 text-emerald-600" /> Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-muted/40 p-2.5 rounded-lg border">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Customer</span>
                  <div className="font-bold text-foreground truncate mt-0.5">{customerName}</div>
                </div>
                <div className="bg-muted/40 p-2.5 rounded-lg border">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">City / Station</span>
                  <div className="font-semibold text-foreground truncate mt-0.5">{station}</div>
                </div>
                <div className="bg-muted/40 p-2.5 rounded-lg border">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Invoice No</span>
                  <div className="font-mono font-bold text-foreground mt-0.5 text-[11px]">{invoiceNo}</div>
                </div>
                <div className="bg-muted/40 p-2.5 rounded-lg border">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Date</span>
                  <div className="font-semibold text-foreground mt-0.5">{displayDate}</div>
                </div>
              </div>
              {/* Phone input */}
              <div className="mt-3">
                <Label className="text-xs text-muted-foreground">Customer Phone (for invoice)</Label>
                <Input
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="e.g. 0300-1234567"
                  className="h-8 text-xs font-mono mt-1 max-w-xs"
                />
              </div>
            </CardContent>
          </Card>

          {/* Add Items Card */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-bold flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                  <Plus className="h-4 w-4 text-emerald-600" /> Add Products
                </span>
                <span className="text-xs font-normal text-muted-foreground">{items.length} item(s)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-4">
              {!isSaved && (
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="sm:col-span-5 space-y-1">
                    <Label className="text-xs">Product</Label>
                    <Select value={selectedProductId} onValueChange={handleProductChange}>
                      <SelectTrigger className="h-9 bg-background text-xs">
                        <SelectValue placeholder="Choose product..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-64">
                        {products.filter(p => p.isActive !== false).map(p => (
                          <SelectItem key={p.id} value={p.id} className="text-xs">{p.name} — Rs.{p.price}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <Label className="text-xs">Qty</Label>
                    <Input type="number" min="1" step="any" placeholder="Qty" value={itemQty} onChange={e => setItemQty(e.target.value)} className="h-9 bg-background text-xs font-mono" />
                  </div>
                  <div className="sm:col-span-3 space-y-1">
                    <Label className="text-xs">Rate (PKR)</Label>
                    <Input type="number" min="0" step="any" placeholder="Rate" value={itemRate} onChange={e => setItemRate(e.target.value)} className="h-9 bg-background text-xs font-mono font-bold" />
                  </div>
                  <div className="sm:col-span-2">
                    <Button type="button" onClick={handleAddItem} className="w-full h-9 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold">
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add
                    </Button>
                  </div>
                </div>
              )}

              <div className="border rounded-xl overflow-hidden shadow-sm">
                <Table>
                  <TableHeader className="bg-slate-100 dark:bg-slate-800">
                    <TableRow>
                      <TableHead className="w-10 text-center text-xs">#</TableHead>
                      <TableHead className="text-xs font-bold uppercase">Particulars</TableHead>
                      <TableHead className="text-right text-xs font-bold uppercase w-20">Qty</TableHead>
                      <TableHead className="text-right text-xs font-bold uppercase w-28">Rate (PKR)</TableHead>
                      <TableHead className="text-right text-xs font-bold uppercase w-32">Amount (PKR)</TableHead>
                      {!isSaved && <TableHead className="w-10" />}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground italic">
                          No items added yet. Select a product above and click "+ Add".
                        </TableCell>
                      </TableRow>
                    ) : items.map((item, idx) => (
                      <TableRow key={item.id} className="hover:bg-muted/30">
                        <TableCell className="text-center font-mono text-xs text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell className="font-semibold text-xs text-foreground">{item.name}</TableCell>
                        <TableCell className="text-right font-mono text-xs font-bold">{item.qty}</TableCell>
                        <TableCell className="text-right font-mono text-xs">Rs. {item.rate.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono text-xs font-black text-foreground">Rs. {item.amount.toLocaleString()}</TableCell>
                        {!isSaved && (
                          <TableCell className="text-right">
                            <Button size="icon" variant="ghost" onClick={() => handleRemoveItem(item.id)} className="h-7 w-7 text-muted-foreground hover:text-destructive">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Auto Calculation */}
        <div className="space-y-4">
          <Card className="border-2 border-emerald-600/30 shadow-md bg-gradient-to-b from-card to-emerald-50/20 dark:to-emerald-950/10">
            <CardHeader className="pb-2 pt-4 px-5 border-b border-border/50">
              <CardTitle className="text-sm font-black flex items-center justify-between uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                <span>Auto Calculation</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 py-4 space-y-3 text-xs">
              <div className="flex justify-between items-center py-1">
                <span className="font-semibold text-muted-foreground uppercase">Current Invoice:</span>
                <span className="font-mono font-bold text-foreground text-sm">PKR {todayTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-t border-border/50 pt-2">
                <div>
                  <span className="font-semibold text-muted-foreground uppercase block">Previous Balance:</span>
                  <span className="text-[10px] text-muted-foreground">From Customer Ledger</span>
                </div>
                <span className={`font-mono font-bold text-sm ${prevBalance > 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                  PKR {prevBalance.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-t border-border/50 bg-muted/40 px-3 rounded-lg">
                <span className="font-bold text-foreground uppercase">Total Amount:</span>
                <span className="font-mono font-black text-base text-foreground">PKR {totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-2 border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-3 rounded-xl">
                <div>
                  <span className="font-black text-emerald-900 dark:text-emerald-200 uppercase text-xs block">Grand Total:</span>
                  <span className="text-[9px] text-emerald-700 dark:text-emerald-400 uppercase font-semibold">Payable Daily</span>
                </div>
                <span className="font-mono font-black text-xl text-emerald-700 dark:text-emerald-300">PKR {grandTotal.toLocaleString()}</span>
              </div>

              <div className="pt-2 space-y-2">
                <Button
                  onClick={isSaved ? handlePrintOnly : handleSaveAndPrint}
                  disabled={items.length === 0 || isSaving}
                  className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-sm"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  {isSaving ? 'Processing...' : isSaved ? 'Print Again' : 'Save & Print A4'}
                </Button>
                {isSaved && (
                  <Button variant="outline" onClick={() => navigate('/pm/today-billing')} className="w-full text-xs font-semibold">
                    <FileText className="h-3.5 w-3.5 mr-1.5" /> View Today's Billing
                  </Button>
                )}
                <Button variant="outline" onClick={() => navigate('/accounts')} className="w-full text-xs font-semibold">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="p-4 rounded-xl border bg-card text-xs text-muted-foreground space-y-1.5 shadow-sm">
            <div className="font-bold text-foreground flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-primary" /> Daily Clearance Policy
            </div>
            <p>Saving this invoice adds a <strong>DEBIT</strong> to {customerName}&apos;s account. Invoices must be cleared on a daily basis.</p>
          </div>
        </div>
      </div>

      {/* Hidden A4 Printable */}
      <div style={{ position: 'fixed', left: '-9999px', top: 0, opacity: 0, pointerEvents: 'none', zIndex: -1 }}>
        <div ref={printRef}>
          <CustomerLedgerInvoiceA4
            invoiceNo={invoiceNo}
            date={displayDate}
            customer={{ name: customerName, city: station, phone: customerPhone }}
            items={items}
            todayTotal={todayTotal}
            prevBalance={prevBalance}
            totalAmount={totalAmount}
            grandTotal={grandTotal}
          />
        </div>
      </div>
    </div>
  );
}
