import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Printer, Search, FileText, TrendingUp, Users, Receipt, AlertCircle } from 'lucide-react';
import { CustomerLedgerInvoiceA4 } from '@/components/invoice/CustomerLedgerInvoiceA4';

function formatDisplayDate(d: Date): string {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${String(d.getDate()).padStart(2,'0')}-${months[d.getMonth()]}-${d.getFullYear()}`;
}

export default function TodayBillingPage() {
  const navigate = useNavigate();
  const { currentUser, selectedProfile, ledgerEntries, loadModuleData } = useApp();
  const printRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedForPrint, setSelectedForPrint] = useState<string | null>(null);

  const role = (selectedProfile?.role || currentUser?.role || '').toLowerCase();
  const isAllowed = role === 'production_manager' || role === 'product_manager' || role === 'admin' || role.includes('manager');

  useEffect(() => { loadModuleData('finance'); }, [loadModuleData]);

  const now = new Date();
  const todayISO = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  const displayDate = formatDisplayDate(now);

  if (!currentUser || !selectedProfile) { navigate('/login'); return null; }
  if (!isAllowed) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p className="text-muted-foreground">This page is for Production Manager / Admin only.</p>
        <Button onClick={() => navigate('/accounts')}>Return to Accounts</Button>
      </div>
    );
  }

  // Filter today's LEDGER_INVOICE entries
  const todayInvoices = ledgerEntries.filter(e =>
    e.date === todayISO && e.category === 'customer' && e.accountHead?.includes('LEDGER_INVOICE')
  );

  // Filter by search
  const filtered = todayInvoices.filter(e =>
    !searchTerm ||
    e.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.accountNo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Summary stats
  const totalSales = todayInvoices.reduce((s, e) => s + e.debit, 0);
  const uniqueCustomers = new Set(todayInvoices.map(e => e.name)).size;

  // Re-print an invoice
  const handleRePrint = (entryId: string) => {
    setSelectedForPrint(entryId);
    setTimeout(() => {
      const el = printRef.current;
      if (!el) return;
      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:210mm;height:297mm;border:none;';
      document.body.appendChild(iframe);
      const doc = iframe.contentWindow?.document;
      if (!doc) return;
      const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"],style')).map(s => s.outerHTML).join('\n');
      doc.open();
      doc.write(`<!DOCTYPE html><html><head><title>Re-Print Invoice</title>${styles}<style>@page{size:A4 portrait;margin:0;}body{background:white!important;margin:0!important;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}</style></head><body>${el.innerHTML}<script>window.onload=function(){setTimeout(function(){window.print();window.onafterprint=function(){window.close();};},400);};<\/script></body></html>`);
      doc.close();
      setTimeout(() => { if (document.body.contains(iframe)) document.body.removeChild(iframe); }, 12000);
    }, 100);
  };

  // Get the selected invoice for hidden print template
  const selectedEntry = todayInvoices.find(e => e.id === selectedForPrint);
  // Parse items from account head (stored as "LEDGER_INVOICE #INV-XXX | qty x name @rate, ...")
  const parsedItems = selectedEntry ? [{
    id: 'reprint-1',
    name: (selectedEntry.accountHead.split('|')[1] || '').trim(),
    qty: 1,
    rate: selectedEntry.debit,
    amount: selectedEntry.debit,
  }] : [];
  const reprintPrevBalance = selectedEntry ? (selectedEntry.closingBalance || 0) - selectedEntry.debit : 0;

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
              <h1 className="text-xl font-bold tracking-tight">Today's Billing</h1>
              <Badge variant="secondary" className="text-[10px] font-bold">{displayDate}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              All invoices created today for your customers
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={() => navigate('/accounts')} className="text-xs font-semibold">
          Back to Accounts
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-sm border-l-4 border-l-emerald-500">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Today's Total Sales</div>
                <div className="text-2xl font-black text-foreground mt-1">PKR {totalSales.toLocaleString()}</div>
              </div>
              <TrendingUp className="h-8 w-8 text-emerald-500 opacity-70" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-blue-500">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Number of Invoices</div>
                <div className="text-2xl font-black text-foreground mt-1">{todayInvoices.length}</div>
              </div>
              <Receipt className="h-8 w-8 text-blue-500 opacity-70" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-purple-500">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Unique Customers</div>
                <div className="text-2xl font-black text-foreground mt-1">{uniqueCustomers}</div>
              </div>
              <Users className="h-8 w-8 text-purple-500 opacity-70" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 pt-4 px-5 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" /> Invoice List
          </CardTitle>
          <div className="relative w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search customer or invoice..."
              className="pl-8 h-8 text-xs"
            />
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="border rounded-xl overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-100 dark:bg-slate-800">
                <TableRow>
                  <TableHead className="text-xs font-bold uppercase w-40">Invoice No</TableHead>
                  <TableHead className="text-xs font-bold uppercase">Customer</TableHead>
                  <TableHead className="text-xs font-bold uppercase">Station</TableHead>
                  <TableHead className="text-xs font-bold uppercase text-right">Invoice Amount</TableHead>
                  <TableHead className="text-xs font-bold uppercase text-right">Grand Total</TableHead>
                  <TableHead className="text-xs font-bold uppercase text-center w-24">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-xs text-muted-foreground italic">
                      {todayInvoices.length === 0
                        ? 'No invoices created today. Go to Accounts → Select a customer → Today Invoice.'
                        : 'No results match your search.'}
                    </TableCell>
                  </TableRow>
                ) : filtered.map((entry) => {
                  const invoiceNo = entry.accountNo || entry.accountHead.match(/INV-[\d]+-[\d]+/)?.[0] || '—';
                  return (
                    <TableRow key={entry.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono text-xs font-bold text-primary">{invoiceNo}</TableCell>
                      <TableCell className="font-semibold text-xs">{entry.name || '—'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{entry.station || '—'}</TableCell>
                      <TableCell className="text-right font-mono text-xs font-bold">PKR {entry.debit.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-mono text-xs font-black text-foreground">PKR {(entry.closingBalance || entry.debit).toLocaleString()}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-[10px] gap-1"
                          onClick={() => handleRePrint(entry.id)}
                        >
                          <Printer className="h-3 w-3" /> Print
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {filtered.length > 0 && (
            <div className="flex justify-end mt-3 text-xs text-muted-foreground font-semibold">
              Showing {filtered.length} of {todayInvoices.length} invoice(s) &nbsp;|&nbsp; Total: PKR {totalSales.toLocaleString()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hidden print area for re-print */}
      {selectedForPrint && selectedEntry && (
        <div style={{ position: 'fixed', left: '-9999px', top: 0, opacity: 0, pointerEvents: 'none', zIndex: -1 }}>
          <div ref={printRef}>
            <CustomerLedgerInvoiceA4
              invoiceNo={selectedEntry.accountNo || '—'}
              date={displayDate}
              customer={{ name: selectedEntry.name || '—', city: selectedEntry.station || 'N/A', phone: 'N/A' }}
              items={parsedItems}
              todayTotal={selectedEntry.debit}
              prevBalance={reprintPrevBalance}
              totalAmount={selectedEntry.closingBalance || selectedEntry.debit}
              grandTotal={selectedEntry.closingBalance || selectedEntry.debit}
            />
          </div>
        </div>
      )}
    </div>
  );
}
