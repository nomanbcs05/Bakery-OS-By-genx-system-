import { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  Truck, Search, Download, Trash2, Filter, X, Calendar,
  FileText, FileSpreadsheet, Package, ChevronDown, ChevronRight,
  Building2, AlertTriangle, CheckCircle2, Printer, Coins, Users, Clock, ShoppingBag
} from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { exportToPDF, exportToExcel } from '@/utils/exportUtils';
import type { Dispatch } from '@/types';
import ReceiptDialog from '@/components/ReceiptDialog';
import GOTDialog from '@/components/GOTDialog';

export default function DispatchHistoryBranches() {
  const {
    currentUser, selectedProfile, dispatches, getProductById, products,
    clearBranchDispatches, sales, loadModuleData
  } = useApp();

  useEffect(() => {
    loadModuleData('sales');
  }, [loadModuleData]);

  if (!currentUser || !selectedProfile) return <Navigate to="/login" replace />;

  // Filter state
  const [destinationFilter, setDestinationFilter] = useState<'all' | 'branch_1' | 'branch_2' | 'customers' | 'walkin'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterYear, setFilterYear] = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Clear history dialog
  const [isClearOpen, setIsClearOpen] = useState(false);
  const [clearTarget, setClearTarget] = useState<'all' | 'branch_1' | 'branch_2'>('all');

  // Reprint states
  const [reprintGOTData, setReprintGOTData] = useState<{
    open: boolean;
    items: { name: string; quantity: number }[];
    destination: string;
    tokenNumber?: number;
  }>({
    open: false,
    items: [],
    destination: '',
    tokenNumber: undefined
  });

  const [reprintReceiptData, setReprintReceiptData] = useState<{
    open: boolean;
    items: { name: string; quantity: number; unitPrice: number }[];
    total: number;
    paymentMethod: string;
    branch: string;
    saleId: string;
    date: string;
    customerName?: string;
    customerPhone?: string;
  }>({
    open: false,
    items: [],
    total: 0,
    paymentMethod: 'cash',
    branch: '',
    saleId: '',
    date: ''
  });

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  // All dispatches sorted newest first
  const allDispatches = useMemo(() =>
    [...dispatches].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [dispatches]
  );

  const uniqueYears = useMemo(() =>
    Array.from(new Set(allDispatches.map(d => new Date(d.date).getFullYear().toString())))
      .sort((a, b) => Number(b) - Number(a)),
    [allDispatches]
  );

  // Filtered dispatches
  const filteredDispatches = useMemo(() => {
    return allDispatches.filter(d => {
      const date = new Date(d.date);
      const dateStr = d.date.split('T')[0];

      // Destination filter
      if (destinationFilter !== 'all') {
        const isBranch1 = d.destination === 'branch_1';
        const isBranch2 = d.destination === 'branch_2';
        const isWalkin = d.destination === 'walkin';
        if (destinationFilter === 'branch_1' && !isBranch1) return false;
        if (destinationFilter === 'branch_2' && !isBranch2) return false;
        if (destinationFilter === 'walkin' && !isWalkin) return false;
        if (destinationFilter === 'customers' && (isBranch1 || isBranch2 || isWalkin)) return false;
      }

      // Date range
      if (startDate && dateStr < startDate) return false;
      if (endDate && dateStr > endDate) return false;

      // Year/Month
      if (filterYear !== 'all' && date.getFullYear().toString() !== filterYear) return false;
      if (filterMonth !== 'all' && date.getMonth().toString() !== filterMonth) return false;

      // Search (fuzzy matches token, product name, or destination name)
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const productNames = d.items.map(i => (getProductById(i.productId)?.name || '').toLowerCase()).join(' ');
        const tokenMatch = d.tokenNumber?.toString().includes(term);
        
        let destName = d.destination;
        if (d.destination === 'branch_1') destName = 'Branch 1';
        else if (d.destination === 'branch_2') destName = 'Branch 2';
        else if (d.destination === 'walkin') destName = 'Walk-in';

        const destMatch = destName.toLowerCase().includes(term);
        if (!productNames.includes(term) && !tokenMatch && !destMatch) return false;
      }

      return true;
    });
  }, [allDispatches, destinationFilter, startDate, endDate, filterYear, filterMonth, searchTerm, getProductById]);

  // KPI stats
  const stats = useMemo(() => {
    let totalQty = 0;
    let totalValue = 0;
    let branchCount = 0;
    let customerCount = 0;
    
    filteredDispatches.forEach(d => {
      const isBranch = d.destination === 'branch_1' || d.destination === 'branch_2';
      if (isBranch) {
        branchCount++;
      } else {
        customerCount++;
      }
      
      d.items.forEach(item => {
        totalQty += item.quantity;
        if (!isBranch) {
          const product = getProductById(item.productId);
          totalValue += item.quantity * (product?.price || 0);
        }
      });
    });

    return {
      totalDispatches: filteredDispatches.length,
      totalQty,
      totalValue,
      branchCount,
      customerCount
    };
  }, [filteredDispatches, getProductById]);

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleClearHistory = async () => {
    await clearBranchDispatches(clearTarget);
    setIsClearOpen(false);
    const label = clearTarget === 'all' ? 'All branch' : clearTarget === 'branch_1' ? 'Branch 1' : 'Branch 2';
    toast.success(`${label} dispatch history cleared successfully`);
  };

  const handleReprint = (d: Dispatch) => {
    const isBranch = d.destination === 'branch_1' || d.destination === 'branch_2';
    
    if (isBranch) {
      const gotItems = d.items.map(item => ({
        name: getProductById(item.productId)?.name || 'Unknown',
        quantity: item.quantity
      }));
      
      setReprintGOTData({
        open: true,
        items: gotItems,
        destination: d.destination === 'branch_1' ? 'Branch 1' : 'Branch 2',
        tokenNumber: d.tokenNumber
      });
    } else {
      // Find matching sales record for proper ledger and previousBalance representation
      const matchingSale = sales.find(s => {
        const sDate = s.date.split('T')[0];
        const dDate = d.date.split('T')[0];
        if (sDate !== dDate) return false;
        
        if (d.destination === 'walkin') {
          return s.type === 'factory_walkin';
        } else {
          return s.customerName === d.destination;
        }
      });

      const receiptItems = d.items.map(item => {
        const p = getProductById(item.productId);
        return {
          name: p?.name || 'Unknown',
          quantity: item.quantity,
          unitPrice: p?.price || 0
        };
      });

      const totalVal = receiptItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

      setReprintReceiptData({
        open: true,
        items: receiptItems,
        total: matchingSale?.total || totalVal,
        paymentMethod: matchingSale?.paymentMethod || 'credit',
        branch: d.destination === 'walkin' ? 'Factory Walk-in' : 'Customer Dispatch',
        saleId: matchingSale?.id || d.id,
        date: matchingSale?.date || d.date,
        customerName: d.destination === 'walkin' ? (matchingSale?.customerName || 'Walk-in') : d.destination,
        customerPhone: matchingSale?.customerPhone
      });
    }
  };

  const handleExport = (format: 'pdf' | 'excel') => {
    const title = 'Complete Dispatch History Report';
    const fileName = 'dispatch_history';
    
    // Flat rows for itemized details
    const rows = filteredDispatches.flatMap(d =>
      d.items.map((item, idx) => {
        const p = getProductById(item.productId);
        const isBranch = d.destination === 'branch_1' || d.destination === 'branch_2';
        const price = p?.price || 0;
        const total = isBranch ? 0 : item.quantity * price;
        return {
          date: new Date(d.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }),
          token: d.tokenNumber || '-',
          destination: d.destination === 'branch_1' ? 'Branch 1' : d.destination === 'branch_2' ? 'Branch 2' : d.destination === 'walkin' ? 'Walk-in' : d.destination,
          product: p?.name || 'Unknown',
          quantity: item.quantity,
          price: isBranch ? '-' : `Rs. ${price}`,
          total: isBranch ? '-' : `Rs. ${total}`,
          type: isBranch ? 'Branch Transfer' : 'Customer Sale'
        };
      })
    );

    if (format === 'pdf') {
      const headers = ['Date', 'Token #', 'Destination', 'Product', 'Qty', 'Unit Price', 'Total', 'Type'];
      const data = rows.map(r => [r.date, String(r.token), r.destination, r.product, String(r.quantity), r.price, r.total, r.type]);
      
      data.push([]);
      data.push(['', '', '', 'TOTAL DISPATCHES:', String(stats.totalDispatches), '', '', '']);
      data.push(['', '', '', 'TOTAL QUANTITY:', String(stats.totalQty), '', '', '']);
      data.push(['', '', '', 'TOTAL SALES VALUE:', `Rs. ${stats.totalValue.toLocaleString()}`, '', '', '']);
      data.push(['', '', '', 'BRANCH TRANSFERS:', String(stats.branchCount), '', '', '']);
      exportToPDF(title, headers, data, fileName);
    } else {
      const excelData = rows.map(r => ({
        'Date': r.date,
        'Token #': r.token,
        'Destination': r.destination,
        'Product Name': r.product,
        'Quantity': r.quantity,
        'Unit Price (Rs.)': r.price,
        'Total (Rs.)': r.total,
        'Type': r.type
      }));
      exportToExcel(excelData, fileName, 'Dispatch Details');
    }
    toast.success(`Exported successfully as ${format.toUpperCase()}`);
  };

  const hasActiveFilters = destinationFilter !== 'all' || searchTerm || startDate || endDate || filterYear !== 'all' || filterMonth !== 'all';

  const clearFilters = () => {
    setDestinationFilter('all');
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    setFilterYear('all');
    setFilterMonth('all');
  };

  const destColor = (dest: string) => {
    if (dest === 'branch_1') return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800';
    if (dest === 'branch_2') return 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-300 dark:border-violet-800';
    if (dest === 'walkin') return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800';
    return 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/30 dark:text-pink-300 dark:border-pink-800';
  };

  const destLabel = (dest: string) => {
    if (dest === 'branch_1') return 'Branch 1';
    if (dest === 'branch_2') return 'Branch 2';
    if (dest === 'walkin') return 'Walk-in (Factory)';
    return dest; // Customer Name
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header section with glassmorphism glow */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/35">
              <Truck className="h-5 w-5" />
            </div>
            Dispatch History
          </h1>
          <p className="text-sm text-slate-500 mt-1 pl-1">
            Complete record of transfers to branches and client dispatch invoices
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Clear History */}
          <Button
            variant="outline"
            className="h-10 border-rose-100 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950/20 flex items-center gap-2 font-bold rounded-2xl transition-all"
            onClick={() => { setClearTarget('all'); setIsClearOpen(true); }}
          >
            <Trash2 className="h-4 w-4" /> Clear History
          </Button>

          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-10 border-slate-200 hover:bg-slate-50 flex items-center gap-2 dark:border-slate-800 dark:hover:bg-slate-850 rounded-2xl font-bold transition-all shadow-sm">
                <Download className="h-4 w-4 text-indigo-500" /> Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-2xl p-1.5 shadow-xl border-slate-100">
              <DropdownMenuItem onClick={() => handleExport('pdf')} className="flex items-center gap-2.5 cursor-pointer py-2 rounded-xl text-slate-700 font-bold hover:bg-slate-50">
                <FileText className="h-4 w-4 text-rose-500" />
                <span>Export as PDF</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('excel')} className="flex items-center gap-2.5 cursor-pointer py-2 rounded-xl text-slate-700 font-bold hover:bg-slate-50">
                <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
                <span>Export as Excel</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* KPI Dashboard Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Dispatches */}
        <Card className="border-0 bg-gradient-to-br from-indigo-500/[0.04] to-violet-500/[0.04] shadow-sm relative overflow-hidden rounded-3xl border border-indigo-100/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Dispatches</p>
                <h3 className="text-3xl font-black text-slate-800 dark:text-white mt-1.5">{stats.totalDispatches}</h3>
              </div>
              <div className="h-12 w-12 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center shadow-inner">
                <Truck className="h-6 w-6" strokeWidth={2.5} />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5">
              <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-50/50 text-[10px] font-bold rounded-lg px-2 py-0.5">
                {stats.totalQty} total items
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Customer Sales Value */}
        <Card className="border-0 bg-gradient-to-br from-emerald-500/[0.04] to-teal-500/[0.04] shadow-sm relative overflow-hidden rounded-3xl border border-emerald-100/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sales Value (Clients)</p>
                <h3 className="text-3xl font-black text-slate-800 dark:text-white mt-1.5">Rs. {stats.totalValue.toLocaleString()}</h3>
              </div>
              <div className="h-12 w-12 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center shadow-inner">
                <Coins className="h-6 w-6" strokeWidth={2.5} />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5">
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-50/50 text-[10px] font-bold rounded-lg px-2 py-0.5">
                {stats.customerCount} retail invoices
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Branch Transfers */}
        <Card className="border-0 bg-gradient-to-br from-blue-500/[0.04] to-cyan-500/[0.04] shadow-sm relative overflow-hidden rounded-3xl border border-blue-100/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Branch transfers</p>
                <h3 className="text-3xl font-black text-slate-800 dark:text-white mt-1.5">{stats.branchCount}</h3>
              </div>
              <div className="h-12 w-12 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center shadow-inner">
                <Building2 className="h-6 w-6" strokeWidth={2.5} />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5">
              <Badge className="bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-50/50 text-[10px] font-bold rounded-lg px-2 py-0.5">
                POS 1 &amp; POS 2 restock
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Average Dispatch Size */}
        <Card className="border-0 bg-gradient-to-br from-amber-500/[0.04] to-orange-500/[0.04] shadow-sm relative overflow-hidden rounded-3xl border border-amber-100/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg Items / Load</p>
                <h3 className="text-3xl font-black text-slate-800 dark:text-white mt-1.5">
                  {stats.totalDispatches > 0 ? (stats.totalQty / stats.totalDispatches).toFixed(1) : '0.0'}
                </h3>
              </div>
              <div className="h-12 w-12 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center shadow-inner">
                <ShoppingBag className="h-6 w-6" strokeWidth={2.5} />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5">
              <Badge className="bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-50/50 text-[10px] font-bold rounded-lg px-2 py-0.5">
                Items per dispatch batch
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Filter Panel */}
      <Card className="border-slate-100 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 rounded-3xl">
        <CardHeader className="py-3.5 px-5 border-b border-slate-50 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-black uppercase tracking-wider flex items-center gap-2 text-slate-400">
              <Filter className="h-3.5 w-3.5 text-indigo-400" strokeWidth={2.5} /> Filters &amp; Date Range
            </CardTitle>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7 px-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl font-bold"
                onClick={clearFilters}
              >
                <X className="h-3.5 w-3.5 mr-1" /> Clear All Filters
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {/* Search */}
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-bold text-slate-500">Keyword Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Product name, token #, customer..."
                  className="pl-9.5 h-9.5 rounded-xl border-slate-200 text-sm font-medium"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Destination filter */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-500">Destination Type</Label>
              <Select value={destinationFilter} onValueChange={v => setDestinationFilter(v as typeof destinationFilter)}>
                <SelectTrigger className="h-9.5 rounded-xl border-slate-200 text-sm font-semibold"><SelectValue placeholder="All Destinations" /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">All Destinations</SelectItem>
                  <SelectItem value="branch_1">Branch 1 Only</SelectItem>
                  <SelectItem value="branch_2">Branch 2 Only</SelectItem>
                  <SelectItem value="customers">Customers Only</SelectItem>
                  <SelectItem value="walkin">Walk-in Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Year filter */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-500">Year</Label>
              <Select value={filterYear} onValueChange={v => { setFilterYear(v); setStartDate(''); setEndDate(''); }}>
                <SelectTrigger className="h-9.5 rounded-xl border-slate-200 text-sm font-semibold"><SelectValue placeholder="All Years" /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">All Years</SelectItem>
                  {uniqueYears.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Month filter */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-500">Month</Label>
              <Select value={filterMonth} onValueChange={v => { setFilterMonth(v); setStartDate(''); setEndDate(''); }}>
                <SelectTrigger className="h-9.5 rounded-xl border-slate-200 text-sm font-semibold"><SelectValue placeholder="All Months" /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">All Months</SelectItem>
                  {MONTHS.map((m, i) => <SelectItem key={i} value={i.toString()}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range Selector */}
            <div className="space-y-1.5 sm:col-span-2 xl:col-span-1">
              <Label className="text-xs font-bold text-slate-500">Date Range Filter</Label>
              <div className="flex gap-2 items-center">
                <Input
                  type="date"
                  className="h-9.5 px-2.5 text-xs flex-1 rounded-xl border-slate-200"
                  value={startDate}
                  onChange={e => { setStartDate(e.target.value); setFilterYear('all'); setFilterMonth('all'); }}
                  title="From Date"
                />
                <span className="text-slate-400 text-xs shrink-0">—</span>
                <Input
                  type="date"
                  className="h-9.5 px-2.5 text-xs flex-1 rounded-xl border-slate-200"
                  value={endDate}
                  onChange={e => { setEndDate(e.target.value); setFilterYear('all'); setFilterMonth('all'); }}
                  title="To Date"
                />
              </div>
            </div>
          </div>

          {/* Active chips */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800">
              {destinationFilter !== 'all' && (
                <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl px-3 py-1 text-xs font-bold dark:bg-indigo-950/20 dark:text-indigo-300 dark:border-indigo-800">
                  <Building2 className="h-3.5 w-3.5 text-indigo-500" /> {destinationFilter === 'customers' ? 'Customers' : destLabel(destinationFilter)}
                  <button onClick={() => setDestinationFilter('all')} className="ml-1 hover:text-indigo-900 transition-colors"><X className="h-3 w-3" /></button>
                </span>
              )}
              {filterYear !== 'all' && (
                <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl px-3 py-1 text-xs font-bold dark:bg-indigo-950/20 dark:text-indigo-300 dark:border-indigo-800">
                  <Calendar className="h-3.5 w-3.5 text-indigo-500" /> {filterYear}
                  <button onClick={() => setFilterYear('all')} className="ml-1 hover:text-indigo-900 transition-colors"><X className="h-3 w-3" /></button>
                </span>
              )}
              {filterMonth !== 'all' && (
                <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl px-3 py-1 text-xs font-bold dark:bg-indigo-950/20 dark:text-indigo-300 dark:border-indigo-800">
                  <Calendar className="h-3.5 w-3.5 text-indigo-500" /> {MONTHS[Number(filterMonth)]}
                  <button onClick={() => setFilterMonth('all')} className="ml-1 hover:text-indigo-900 transition-colors"><X className="h-3 w-3" /></button>
                </span>
              )}
              {startDate && endDate && (
                <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl px-3 py-1 text-xs font-bold dark:bg-indigo-950/20 dark:text-indigo-300 dark:border-indigo-800">
                  <Clock className="h-3.5 w-3.5 text-indigo-500" /> {startDate} to {endDate}
                  <button onClick={() => { setStartDate(''); setEndDate(''); }} className="ml-1 hover:text-indigo-900 transition-colors"><X className="h-3 w-3" /></button>
                </span>
              )}
              {searchTerm && (
                <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl px-3 py-1 text-xs font-bold dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                  <Search className="h-3.5 w-3.5 text-slate-500" /> "{searchTerm}"
                  <button onClick={() => setSearchTerm('')} className="ml-1 hover:text-slate-950 transition-colors"><X className="h-3 w-3" /></button>
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results header details */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          Showing <strong className="text-slate-700 dark:text-slate-200">{filteredDispatches.length}</strong> of <strong className="text-slate-700 dark:text-slate-200">{allDispatches.length}</strong> dispatches
        </span>
        <span className="font-bold text-slate-600 dark:text-slate-300 flex items-center gap-4">
          <span>Items Qty: <strong className="text-indigo-600 font-black">{stats.totalQty}</strong></span>
          {stats.totalValue > 0 && <span>Sales Total: <strong className="text-emerald-600 font-black">Rs. {stats.totalValue.toLocaleString()}</strong></span>}
        </span>
      </div>

      {/* Main Datatable */}
      <Card className="border-0 shadow-md rounded-3xl overflow-hidden bg-white dark:bg-slate-900">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/70 border-b border-slate-100 dark:bg-slate-800/40">
              <TableRow>
                <TableHead className="w-[40px]"></TableHead>
                <TableHead className="w-[120px] text-xs font-black uppercase text-slate-400 tracking-wider">Date</TableHead>
                <TableHead className="w-[80px] text-xs font-black uppercase text-slate-400 tracking-wider">Token #</TableHead>
                <TableHead className="text-xs font-black uppercase text-slate-400 tracking-wider">Destination</TableHead>
                <TableHead className="text-xs font-black uppercase text-slate-400 tracking-wider">Product Summary</TableHead>
                <TableHead className="text-right text-xs font-black uppercase text-slate-400 tracking-wider">Total Items</TableHead>
                <TableHead className="text-right text-xs font-black uppercase text-slate-400 tracking-wider">Sale Total</TableHead>
                <TableHead className="text-center text-xs font-black uppercase text-slate-400 tracking-wider">Type</TableHead>
                <TableHead className="w-[100px] text-center text-xs font-black uppercase text-slate-400 tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDispatches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-20">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-16 w-16 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center border shadow-inner">
                        <Truck className="h-7 w-7 text-slate-300 dark:text-slate-600 animate-pulse" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-700">No dispatch records found</p>
                        <p className="text-xs text-slate-400 mt-1 max-w-[280px] mx-auto">Try adjusting the filter criteria or date ranges to discover matching results.</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredDispatches.map(d => {
                  const isExpanded = expandedRows.has(d.id);
                  const totalQty = d.items.reduce((sum, i) => sum + i.quantity, 0);
                  
                  // Calculate Sale Total if customer/walk-in dispatch
                  const isBranch = d.destination === 'branch_1' || d.destination === 'branch_2';
                  let saleTotal = 0;
                  if (!isBranch) {
                    d.items.forEach(item => {
                      const p = getProductById(item.productId);
                      saleTotal += item.quantity * (p?.price || 0);
                    });
                  }

                  const productSummary = d.items.slice(0, 2).map(i => {
                    const p = getProductById(i.productId);
                    return `${p?.name || 'Unknown'} ×${i.quantity}`;
                  }).join(', ') + (d.items.length > 2 ? ` +${d.items.length - 2} more` : '');

                  return (
                    <>
                      <TableRow
                        key={d.id}
                        className={`hover:bg-slate-50/60 dark:hover:bg-slate-850/40 transition-all border-b border-slate-50 dark:border-slate-850/60 cursor-pointer ${isExpanded ? 'bg-indigo-500/[0.01]' : ''}`}
                        onClick={() => toggleRow(d.id)}
                      >
                        <TableCell className="text-center">
                          {isExpanded
                            ? <ChevronDown className="h-4 w-4 text-indigo-500 mx-auto transition-transform" />
                            : <ChevronRight className="h-4 w-4 text-slate-400 mx-auto transition-transform" />
                          }
                        </TableCell>
                        <TableCell className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          {new Date(d.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs font-bold rounded-lg border-slate-200 text-slate-600 bg-slate-50/50">
                            #{d.tokenNumber || '-'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-bold text-slate-800 text-sm">
                          <span className={`inline-flex items-center gap-1 border px-2 py-0.5 rounded-lg text-xs ${destColor(d.destination)}`}>
                            {d.destination === 'branch_1' || d.destination === 'branch_2' ? (
                              <Building2 className="h-3 w-3" />
                            ) : d.destination === 'walkin' ? (
                              <Users className="h-3 w-3" />
                            ) : (
                              <Users className="h-3 w-3" />
                            )}
                            {destLabel(d.destination)}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-slate-500 dark:text-slate-400 max-w-[240px] truncate">
                          {productSummary}
                        </TableCell>
                        <TableCell className="text-right font-mono font-black text-slate-900 dark:text-white text-sm">
                          {totalQty}
                        </TableCell>
                        <TableCell className="text-right font-mono font-black text-slate-950 text-sm">
                          {isBranch ? (
                            <span className="text-slate-300 font-normal">—</span>
                          ) : (
                            <span className="text-emerald-600 font-bold">Rs. {saleTotal.toLocaleString()}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                            isBranch 
                              ? 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-50' 
                              : 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-50'
                          }`}>
                            {isBranch ? 'Branch restock' : 'Client invoice'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center" onClick={e => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl transition-all"
                            onClick={() => handleReprint(d)}
                            title="Reprint bill / Gate Out Pass"
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>

                      {/* Expanded item details */}
                      {isExpanded && d.items.map((item, idx) => {
                        const product = getProductById(item.productId);
                        return (
                          <TableRow
                            key={`${d.id}-item-${idx}`}
                            className="bg-indigo-50/20 dark:bg-indigo-950/10 border-0"
                          >
                            <TableCell></TableCell>
                            <TableCell></TableCell>
                            <TableCell></TableCell>
                            <TableCell colSpan={2} className="py-2.5 border-b border-indigo-100/10">
                              <div className="flex items-center gap-2.5">
                                <div className="h-6.5 w-6.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                                  <Package className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{product?.name || 'Unknown Product'}</span>
                                {!isBranch && product?.price && (
                                  <span className="text-[10px] font-bold text-slate-400">@ Rs. {product.price.toLocaleString()}</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-mono font-black text-indigo-700 dark:text-indigo-300 py-2.5 border-b border-indigo-100/10">
                              ×{item.quantity}
                            </TableCell>
                            <TableCell className="text-right py-2.5 border-b border-indigo-100/10">
                              {isBranch ? (
                                <span className="text-slate-300 font-mono text-[10px]">—</span>
                              ) : (
                                product?.price && (
                                  <span className="text-xs font-mono font-bold text-slate-500">
                                    Rs. {(item.quantity * product.price).toLocaleString()}
                                  </span>
                                )
                              )}
                            </TableCell>
                            <TableCell colSpan={2} className="border-b border-indigo-100/10"></TableCell>
                          </TableRow>
                        );
                      })}
                    </>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Clear History Dialog */}
      <Dialog open={isClearOpen} onOpenChange={setIsClearOpen}>
        <DialogContent className="max-w-md p-0 gap-0 overflow-hidden rounded-3xl border-rose-200">
          <DialogHeader className="bg-gradient-to-r from-rose-600 to-rose-700 px-6 py-4 text-white">
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-white">
              <AlertTriangle className="h-5 w-5 text-rose-200" />
              Clear Dispatch History Records
            </DialogTitle>
            <DialogDescription className="text-rose-100 text-xs mt-0.5">
              This will permanently delete local and cloud dispatch logs. This action is irreversible.
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 py-5 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Select what target to clear</Label>
              <Select value={clearTarget} onValueChange={v => setClearTarget(v as typeof clearTarget)}>
                <SelectTrigger className="h-10 rounded-xl border-slate-200 text-sm font-semibold"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">All Branch Dispatches (Branch 1 & 2)</SelectItem>
                  <SelectItem value="branch_1">Branch 1 Dispatches Only</SelectItem>
                  <SelectItem value="branch_2">Branch 2 Dispatches Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-2xl p-4">
              <p className="text-xs text-rose-700 dark:text-rose-300 font-bold">
                ⚠️ Confirming this will erase <strong>
                  {clearTarget === 'all'
                    ? allDispatches.filter(d => d.destination === 'branch_1' || d.destination === 'branch_2').length
                    : allDispatches.filter(d => d.destination === clearTarget).length
                  }
                </strong> branch dispatch transfers permanently from database.
              </p>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 px-6 py-4 flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setIsClearOpen(false)} className="rounded-xl px-4 text-xs font-bold border-slate-200">
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl px-5 text-xs font-bold gap-1.5"
              onClick={handleClearHistory}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear Permanently
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bill Reprint Dialogs */}
      <ReceiptDialog
        open={reprintReceiptData.open}
        onClose={() => setReprintReceiptData(prev => ({ ...prev, open: false }))}
        items={reprintReceiptData.items}
        total={reprintReceiptData.total}
        paymentMethod={reprintReceiptData.paymentMethod}
        branch={reprintReceiptData.branch}
        saleId={reprintReceiptData.saleId}
        date={reprintReceiptData.date}
        autoPrint={true}
        customerName={reprintReceiptData.customerName}
        customerPhone={reprintReceiptData.customerPhone}
      />

      <GOTDialog
        open={reprintGOTData.open}
        onClose={() => setReprintGOTData(prev => ({ ...prev, open: false }))}
        items={reprintGOTData.items}
        destination={reprintGOTData.destination}
        tokenNumber={reprintGOTData.tokenNumber}
        autoPrint={true}
      />
    </div>
  );
}
