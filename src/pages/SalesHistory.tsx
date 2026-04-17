import { useState, useMemo, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Search, Download, Printer, CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Navigate } from 'react-router-dom';

type BranchFilter = 'all' | 'branch_1' | 'branch_2' | 'factory_walkin';

export default function SalesHistory() {
  const { currentUser, selectedProfile, sales, getProductById } = useApp();

  if (!currentUser) return <Navigate to="/login" replace />;
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState<BranchFilter>('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const summaryRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    return sales.filter(sale => {
      // Branch filter
      if (branchFilter !== 'all') {
        if (branchFilter === 'factory_walkin') {
          if (sale.type !== 'factory_walkin') return false;
        } else {
          if (sale.branch !== branchFilter) return false;
        }
      }
      // Date filter
      if (dateFrom && sale.date < format(dateFrom, 'yyyy-MM-dd')) return false;
      if (dateTo && sale.date > format(dateTo, 'yyyy-MM-dd')) return false;
      // Search
      if (search) {
        const q = search.toLowerCase();
        const matchesId = sale.id.toLowerCase().includes(q);
        const matchesProduct = sale.items.some(i => {
          const p = getProductById(i.productId);
          return p?.name.toLowerCase().includes(q);
        });
        if (!matchesId && !matchesProduct) return false;
      }
      return true;
    }).sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  }, [sales, branchFilter, dateFrom, dateTo, search, getProductById]);

  const branchSummary = useMemo(() => {
    const summary = {
      branch_1: { count: 0, total: 0, cash: 0, card: 0 },
      branch_2: { count: 0, total: 0, cash: 0, card: 0 },
      factory_walkin: { count: 0, total: 0, cash: 0, card: 0 },
    };
    filtered.forEach(sale => {
      const key = sale.type === 'factory_walkin' ? 'factory_walkin' : (sale.branch || 'branch_1');
      const s = summary[key as keyof typeof summary];
      s.count++;
      s.total += sale.total;
      if (sale.paymentMethod === 'cash') s.cash += sale.total;
      else s.card += sale.total;
    });
    return summary;
  }, [filtered]);

  const grandTotal = Object.values(branchSummary).reduce((s, b) => s + b.total, 0);
  const grandCount = Object.values(branchSummary).reduce((s, b) => s + b.count, 0);

  const getBranchLabel = (sale: typeof sales[0]) => {
    if (sale.type === 'factory_walkin') return 'Walk-in';
    if (sale.branch === 'branch_1') return 'Branch 1';
    if (sale.branch === 'branch_2') return 'Branch 2';
    return 'Unknown';
  };

  const getBranchColor = (sale: typeof sales[0]) => {
    if (sale.type === 'factory_walkin') return 'bg-accent text-accent-foreground';
    if (sale.branch === 'branch_1') return 'bg-primary text-primary-foreground';
    return 'bg-secondary text-secondary-foreground';
  };

  const exportCSV = () => {
    const headers = ['Sale ID', 'Date', 'Branch', 'Items', 'Payment', 'Total'];
    const rows = filtered.map(sale => [
      sale.id,
      sale.date,
      getBranchLabel(sale),
      sale.items.map(i => {
        const p = getProductById(i.productId);
        return `${p?.name || 'Unknown'} x${i.quantity}`;
      }).join('; '),
      sale.paymentMethod,
      sale.total.toFixed(2),
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printSummary = () => {
    const content = summaryRef.current;
    if (!content) return;
    
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(`
        <html><head><title>Sales Summary</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 700px; margin: 0 auto; color: #000; }
          h1 { font-size: 20px; text-align: center; margin-bottom: 4px; }
          .subtitle { text-align: center; color: #666; font-size: 13px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
          th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; font-size: 13px; }
          th { background: #f5f5f5; font-weight: 600; }
          .right { text-align: right; }
          .total-row { font-weight: bold; background: #fef3c7; }
          @media print { body { margin: 0; } }
        </style></head><body>
        <h1>🍞 BakeryOS — Sales Summary</h1>
        <p class="subtitle">Generated: ${format(new Date(), 'PPP p')}${dateFrom ? ' | From: ' + format(dateFrom, 'PP') : ''}${dateTo ? ' | To: ' + format(dateTo, 'PP') : ''}</p>
        <table>
          <tr><th>Branch</th><th class="right">Sales</th><th class="right">Cash</th><th class="right">Card</th><th class="right">Total</th></tr>
          <tr><td>Branch 1</td><td class="right">${branchSummary.branch_1.count}</td><td class="right">$${branchSummary.branch_1.cash.toFixed(2)}</td><td class="right">$${branchSummary.branch_1.card.toFixed(2)}</td><td class="right">$${branchSummary.branch_1.total.toFixed(2)}</td></tr>
          <tr><td>Branch 2</td><td class="right">${branchSummary.branch_2.count}</td><td class="right">$${branchSummary.branch_2.cash.toFixed(2)}</td><td class="right">$${branchSummary.branch_2.card.toFixed(2)}</td><td class="right">$${branchSummary.branch_2.total.toFixed(2)}</td></tr>
          <tr><td>Walk-in</td><td class="right">${branchSummary.factory_walkin.count}</td><td class="right">$${branchSummary.factory_walkin.cash.toFixed(2)}</td><td class="right">$${branchSummary.factory_walkin.card.toFixed(2)}</td><td class="right">$${branchSummary.factory_walkin.total.toFixed(2)}</td></tr>
          <tr class="total-row"><td>Grand Total</td><td class="right">${grandCount}</td><td class="right">$${Object.values(branchSummary).reduce((s, b) => s + b.cash, 0).toFixed(2)}</td><td class="right">$${Object.values(branchSummary).reduce((s, b) => s + b.card, 0).toFixed(2)}</td><td class="right">$${grandTotal.toFixed(2)}</td></tr>
        </table>
        <h2 style="font-size:16px;margin-top:24px;">Detailed Transactions (${filtered.length})</h2>
        <table>
          <tr><th>ID</th><th>Date</th><th>Branch</th><th>Items</th><th>Payment</th><th class="right">Total</th></tr>
          ${filtered.map(sale => `<tr>
            <td>${sale.id}</td>
            <td>${sale.date}</td>
            <td>${getBranchLabel(sale)}</td>
            <td>${sale.items.map(i => { const p = getProductById(i.productId); return `${p?.name || '?'} x${i.quantity}`; }).join(', ')}</td>
            <td>${sale.paymentMethod}</td>
            <td class="right">$${sale.total.toFixed(2)}</td>
          </tr>`).join('')}
        </table>
        <script>window.onload = () => { window.print(); };</script>
        </body></html>
      `);
      doc.close();

      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 5000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sales History</h1>
          <p className="text-sm text-muted-foreground">Branch-wise sales breakdown with search & filtering</p>
        </div>
        {selectedProfile?.role !== 'branch_staff' && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="h-4 w-4 mr-1" /> Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={printSummary}>
              <Printer className="h-4 w-4 mr-1" /> Print Summary
            </Button>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      {selectedProfile?.role !== 'branch_staff' && (
        <div ref={summaryRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Branch 1', data: branchSummary.branch_1, color: 'text-primary' },
            { label: 'Branch 2', data: branchSummary.branch_2, color: 'text-secondary-foreground' },
            { label: 'Walk-in', data: branchSummary.factory_walkin, color: 'text-accent-foreground' },
            { label: 'Grand Total', data: { count: grandCount, total: grandTotal, cash: Object.values(branchSummary).reduce((s, b) => s + b.cash, 0), card: Object.values(branchSummary).reduce((s, b) => s + b.card, 0) }, color: 'text-foreground' },
          ].map(({ label, data, color }) => (
            <Card key={label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${color}`}>Rs. {data.total.toFixed(2)}</p>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{data.count} sales</span>
                  <span>Cash: Rs. {data.cash.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by product or sale ID..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={branchFilter} onValueChange={v => setBranchFilter(v as BranchFilter)}>
              <SelectTrigger className="w-full sm:w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                <SelectItem value="branch_1">Branch 1</SelectItem>
                <SelectItem value="branch_2">Branch 2</SelectItem>
                <SelectItem value="factory_walkin">Walk-in</SelectItem>
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full sm:w-[140px] justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  {dateFrom ? format(dateFrom, 'MM/dd') : 'From'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full sm:w-[140px] justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  {dateTo ? format(dateTo, 'MM/dd') : 'To'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateTo} onSelect={setDateTo} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
            {(dateFrom || dateTo || search || branchFilter !== 'all') && (
              <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setBranchFilter('all'); setDateFrom(undefined); setDateTo(undefined); }}>
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transactions ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No sales found matching your filters.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sale ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(sale => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-mono text-xs">{sale.id}</TableCell>
                    <TableCell>{sale.date}</TableCell>
                    <TableCell>
                      <Badge className={getBranchColor(sale)} variant="secondary">{getBranchLabel(sale)}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      {sale.items.map((item, i) => {
                        const p = getProductById(item.productId);
                        return <span key={i} className="block text-sm">{p?.name || 'Unknown'} x{item.quantity} @ Rs. {item.unitPrice.toFixed(2)}</span>;
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{sale.paymentMethod}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">Rs. {sale.total.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
