import { useState, useMemo } from 'react';
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
  Building2, AlertTriangle, CheckCircle2
} from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { exportToPDF, exportToExcel } from '@/utils/exportUtils';

export default function DispatchHistoryBranches() {
  const {
    currentUser, selectedProfile, dispatches, getProductById, products,
    clearBranchDispatches
  } = useApp();

  if (!currentUser || !selectedProfile) return <Navigate to="/login" replace />;

  // Filter state
  const [branchFilter, setBranchFilter] = useState<'all' | 'branch_1' | 'branch_2'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterYear, setFilterYear] = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Clear history dialog
  const [isClearOpen, setIsClearOpen] = useState(false);
  const [clearTarget, setClearTarget] = useState<'all' | 'branch_1' | 'branch_2'>('all');

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  // Branch dispatches only
  const branchDispatches = useMemo(() =>
    dispatches.filter(d => d.destination === 'branch_1' || d.destination === 'branch_2')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [dispatches]
  );

  const uniqueYears = useMemo(() =>
    Array.from(new Set(branchDispatches.map(d => new Date(d.date).getFullYear().toString())))
      .sort((a, b) => Number(b) - Number(a)),
    [branchDispatches]
  );

  // Filtered dispatches
  const filteredDispatches = useMemo(() => {
    return branchDispatches.filter(d => {
      const date = new Date(d.date);
      const dateStr = d.date.split('T')[0];

      // Branch filter
      if (branchFilter !== 'all' && d.destination !== branchFilter) return false;

      // Date range
      if (startDate && dateStr < startDate) return false;
      if (endDate && dateStr > endDate) return false;

      // Year/Month
      if (filterYear !== 'all' && date.getFullYear().toString() !== filterYear) return false;
      if (filterMonth !== 'all' && date.getMonth().toString() !== filterMonth) return false;

      // Search
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const productNames = d.items.map(i => (getProductById(i.productId)?.name || '').toLowerCase()).join(' ');
        const tokenMatch = d.tokenNumber?.toString().includes(term);
        const destMatch = (d.destination === 'branch_1' ? 'branch 1' : 'branch 2').includes(term);
        if (!productNames.includes(term) && !tokenMatch && !destMatch) return false;
      }

      return true;
    });
  }, [branchDispatches, branchFilter, startDate, endDate, filterYear, filterMonth, searchTerm, getProductById]);

  // KPI stats
  const stats = useMemo(() => {
    const totalDispatches = filteredDispatches.length;
    const totalItems = filteredDispatches.reduce((sum, d) => sum + d.items.reduce((s, i) => s + i.quantity, 0), 0);
    const branch1Count = filteredDispatches.filter(d => d.destination === 'branch_1').length;
    const branch2Count = filteredDispatches.filter(d => d.destination === 'branch_2').length;
    const branch1Items = filteredDispatches.filter(d => d.destination === 'branch_1').reduce((sum, d) => sum + d.items.reduce((s, i) => s + i.quantity, 0), 0);
    const branch2Items = filteredDispatches.filter(d => d.destination === 'branch_2').reduce((sum, d) => sum + d.items.reduce((s, i) => s + i.quantity, 0), 0);
    const uniqueProducts = new Set(filteredDispatches.flatMap(d => d.items.map(i => i.productId))).size;
    return { totalDispatches, totalItems, branch1Count, branch2Count, branch1Items, branch2Items, uniqueProducts };
  }, [filteredDispatches]);

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

  const handleExport = (format: 'pdf' | 'excel') => {
    const title = 'Branch Dispatch History Report';
    const fileName = 'branch_dispatch_history';
    
    // Build flat rows: one row per dispatch item
    const rows = filteredDispatches.flatMap(d =>
      d.items.map((item, idx) => ({
        date: new Date(d.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }),
        token: d.tokenNumber || '-',
        branch: d.destination === 'branch_1' ? 'Branch 1' : 'Branch 2',
        product: getProductById(item.productId)?.name || 'Unknown',
        quantity: item.quantity,
        status: d.status === 'confirmed' ? 'Confirmed' : 'Pending',
        dispatchId: idx === 0 ? d.id : '' // only show once per dispatch
      }))
    );

    if (format === 'pdf') {
      const headers = ['Date', 'Token #', 'Branch', 'Product', 'Qty', 'Status'];
      const data = rows.map(r => [r.date, String(r.token), r.branch, r.product, String(r.quantity), r.status]);
      // Add totals
      data.push([]);
      data.push(['', '', '', 'TOTAL DISPATCHES:', String(filteredDispatches.length), '']);
      data.push(['', '', '', 'TOTAL ITEMS:', String(stats.totalItems), '']);
      data.push(['', '', '', 'BRANCH 1:', String(stats.branch1Count) + ' dispatches', String(stats.branch1Items) + ' items']);
      data.push(['', '', '', 'BRANCH 2:', String(stats.branch2Count) + ' dispatches', String(stats.branch2Items) + ' items']);
      exportToPDF(title, headers, data, fileName);
    } else {
      const excelData = rows.map(r => ({
        'Date': r.date,
        'Token #': r.token,
        'Branch': r.branch,
        'Product': r.product,
        'Quantity': r.quantity,
        'Status': r.status
      }));
      exportToExcel(excelData, fileName, 'Branch Dispatches');
    }
    toast.success(`Exported successfully as ${format.toUpperCase()}`);
  };

  const hasActiveFilters = branchFilter !== 'all' || searchTerm || startDate || endDate || filterYear !== 'all' || filterMonth !== 'all';

  const clearFilters = () => {
    setBranchFilter('all');
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    setFilterYear('all');
    setFilterMonth('all');
  };

  const destLabel = (dest: string) => dest === 'branch_1' ? 'Branch 1' : 'Branch 2';
  const destColor = (dest: string) => dest === 'branch_1'
    ? 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800'
    : 'bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-800';

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-violet-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/35">
              <Truck className="h-5 w-5" />
            </div>
            Dispatch History (Branches)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Complete record of all dispatches sent to Branch 1 &amp; Branch 2 — saved in real database.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Clear History */}
          <Button
            variant="outline"
            className="h-10 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950 flex items-center gap-2 font-semibold"
            onClick={() => { setClearTarget('all'); setIsClearOpen(true); }}
          >
            <Trash2 className="h-4 w-4" /> Clear History
          </Button>

          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-10 border-slate-200 hover:bg-slate-50 flex items-center gap-2 dark:border-slate-700 dark:hover:bg-slate-800">
                <Download className="h-4 w-4" /> Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('pdf')} className="flex items-center gap-2 cursor-pointer">
                <FileText className="h-4 w-4 text-rose-500" />
                <span>Export as PDF</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('excel')} className="flex items-center gap-2 cursor-pointer">
                <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
                <span>Export as Excel</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Dispatches */}
        <Card className="border-0 bg-gradient-to-br from-slate-500/10 to-slate-600/10 shadow-sm relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Total Dispatches</p>
                <h3 className="text-3xl font-black text-slate-800 dark:text-white mt-1">{stats.totalDispatches}</h3>
              </div>
              <div className="h-12 w-12 bg-slate-600/10 text-slate-600 dark:text-slate-300 rounded-xl flex items-center justify-center">
                <Truck className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-3">
              <Badge className="bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 text-[10px]">{stats.totalItems} total items</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Unique Products */}
        <Card className="border-0 bg-gradient-to-br from-amber-500/10 to-orange-500/10 shadow-sm relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Unique Products</p>
                <h3 className="text-3xl font-black text-slate-800 dark:text-white mt-1">{stats.uniqueProducts}</h3>
              </div>
              <div className="h-12 w-12 bg-amber-600/10 text-amber-600 rounded-xl flex items-center justify-center">
                <Package className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-3">
              <Badge className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800 text-[10px]">Products dispatched</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Branch 1 */}
        <Card className="border-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 shadow-sm relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Branch 1</p>
                <h3 className="text-3xl font-black text-slate-800 dark:text-white mt-1">{stats.branch1Count}</h3>
              </div>
              <div className="h-12 w-12 bg-blue-600/10 text-blue-600 rounded-xl flex items-center justify-center">
                <Building2 className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-3">
              <Badge className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800 text-[10px]">{stats.branch1Items} items dispatched</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Branch 2 */}
        <Card className="border-0 bg-gradient-to-br from-violet-500/10 to-purple-500/10 shadow-sm relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Branch 2</p>
                <h3 className="text-3xl font-black text-slate-800 dark:text-white mt-1">{stats.branch2Count}</h3>
              </div>
              <div className="h-12 w-12 bg-violet-600/10 text-violet-600 rounded-xl flex items-center justify-center">
                <Building2 className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-3">
              <Badge className="bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800 text-[10px]">{stats.branch2Items} items dispatched</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Filters */}
      <Card className="border-slate-100 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
        <CardHeader className="py-3 px-4 border-b border-slate-50 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-700 dark:text-slate-200">
              <Filter className="h-4 w-4 text-slate-400" /> Filters &amp; Search
            </CardTitle>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7 px-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50"
                onClick={clearFilters}
              >
                <X className="h-3 w-3 mr-1" /> Clear All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {/* Search */}
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-semibold text-slate-500">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Product name, token #..."
                  className="pl-9 h-9"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Branch filter */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500">Branch</Label>
              <Select value={branchFilter} onValueChange={v => setBranchFilter(v as typeof branchFilter)}>
                <SelectTrigger className="h-9"><SelectValue placeholder="All Branches" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  <SelectItem value="branch_1">Branch 1</SelectItem>
                  <SelectItem value="branch_2">Branch 2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Year filter */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500">Year</Label>
              <Select value={filterYear} onValueChange={v => { setFilterYear(v); setStartDate(''); setEndDate(''); }}>
                <SelectTrigger className="h-9"><SelectValue placeholder="All Years" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {uniqueYears.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Month filter */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500">Month</Label>
              <Select value={filterMonth} onValueChange={v => { setFilterMonth(v); setStartDate(''); setEndDate(''); }}>
                <SelectTrigger className="h-9"><SelectValue placeholder="All Months" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {MONTHS.map((m, i) => <SelectItem key={i} value={i.toString()}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="space-y-1.5 sm:col-span-2 xl:col-span-1">
              <Label className="text-xs font-semibold text-slate-500">Date Range</Label>
              <div className="flex gap-1.5 items-center">
                <Input
                  type="date"
                  className="h-9 px-2 text-xs flex-1"
                  value={startDate}
                  onChange={e => { setStartDate(e.target.value); setFilterYear('all'); setFilterMonth('all'); }}
                  title="From Date"
                />
                <span className="text-slate-400 text-xs shrink-0">—</span>
                <Input
                  type="date"
                  className="h-9 px-2 text-xs flex-1"
                  value={endDate}
                  onChange={e => { setEndDate(e.target.value); setFilterYear('all'); setFilterMonth('all'); }}
                  title="To Date"
                />
              </div>
            </div>
          </div>

          {/* Active filter chips */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-50 dark:border-slate-800">
              {branchFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-2.5 py-0.5 text-xs font-semibold dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
                  <Building2 className="h-3 w-3" /> {destLabel(branchFilter)}
                  <button onClick={() => setBranchFilter('all')} className="ml-1 hover:text-blue-900"><X className="h-3 w-3" /></button>
                </span>
              )}
              {filterYear !== 'all' && (
                <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full px-2.5 py-0.5 text-xs font-semibold dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800">
                  <Calendar className="h-3 w-3" /> {filterYear}
                  <button onClick={() => setFilterYear('all')} className="ml-1 hover:text-indigo-900"><X className="h-3 w-3" /></button>
                </span>
              )}
              {filterMonth !== 'all' && (
                <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full px-2.5 py-0.5 text-xs font-semibold dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800">
                  <Calendar className="h-3 w-3" /> {MONTHS[Number(filterMonth)]}
                  <button onClick={() => setFilterMonth('all')} className="ml-1 hover:text-indigo-900"><X className="h-3 w-3" /></button>
                </span>
              )}
              {searchTerm && (
                <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-full px-2.5 py-0.5 text-xs font-semibold dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                  <Search className="h-3 w-3" /> "{searchTerm}"
                  <button onClick={() => setSearchTerm('')} className="ml-1 hover:text-slate-900"><X className="h-3 w-3" /></button>
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results summary bar */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>
          Showing <strong className="text-slate-700 dark:text-slate-200">{filteredDispatches.length}</strong> of <strong className="text-slate-700 dark:text-slate-200">{branchDispatches.length}</strong> branch dispatches
          {(filterYear !== 'all' || filterMonth !== 'all') && (
            <span className="ml-1 text-blue-600 font-semibold">
              — {filterMonth !== 'all' ? MONTHS[Number(filterMonth)] : ''}{filterMonth !== 'all' && filterYear !== 'all' ? ' ' : ''}{filterYear !== 'all' ? filterYear : ''}
            </span>
          )}
        </span>
        <span className="font-semibold text-slate-600 dark:text-slate-300">
          Total Items: <span className="text-blue-600 font-black">{stats.totalItems}</span>
        </span>
      </div>

      {/* Main Data Table */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50 border-b border-slate-100 dark:bg-slate-800">
              <TableRow>
                <TableHead className="w-[40px]"></TableHead>
                <TableHead className="w-[120px] text-xs font-bold uppercase text-slate-500">Date</TableHead>
                <TableHead className="w-[80px] text-xs font-bold uppercase text-slate-500">Token #</TableHead>
                <TableHead className="text-xs font-bold uppercase text-slate-500">Branch</TableHead>
                <TableHead className="text-xs font-bold uppercase text-slate-500">Products</TableHead>
                <TableHead className="text-right text-xs font-bold uppercase text-slate-500">Total Items</TableHead>
                <TableHead className="text-center text-xs font-bold uppercase text-slate-500">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDispatches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-16 w-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
                        <Truck className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-500">No branch dispatches found</p>
                        <p className="text-xs text-slate-400 mt-1">Dispatch products to Branch 1 or Branch 2 from the Dispatch page to see records here.</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredDispatches.map(d => {
                  const isExpanded = expandedRows.has(d.id);
                  const totalQty = d.items.reduce((sum, i) => sum + i.quantity, 0);
                  const productSummary = d.items.slice(0, 3).map(i => {
                    const p = getProductById(i.productId);
                    return `${p?.name || 'Unknown'} ×${i.quantity}`;
                  }).join(', ') + (d.items.length > 3 ? ` +${d.items.length - 3} more` : '');

                  return (
                    <>
                      <TableRow
                        key={d.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                        onClick={() => toggleRow(d.id)}
                      >
                        <TableCell className="text-center">
                          {isExpanded
                            ? <ChevronDown className="h-4 w-4 text-blue-500 mx-auto transition-transform" />
                            : <ChevronRight className="h-4 w-4 text-slate-400 mx-auto transition-transform" />
                          }
                        </TableCell>
                        <TableCell className="font-mono text-xs text-slate-600 dark:text-slate-300">
                          {new Date(d.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs font-bold">
                            #{d.tokenNumber || '-'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-[10px] font-bold border ${destColor(d.destination)}`}>
                            <Building2 className="h-2.5 w-2.5 mr-1" />
                            {destLabel(d.destination)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-slate-700 dark:text-slate-300 max-w-[300px]">
                          <span className="line-clamp-1">{productSummary}</span>
                        </TableCell>
                        <TableCell className="text-right font-mono font-black text-slate-900 dark:text-white text-sm">
                          {totalQty}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800 text-[10px]">
                            <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                            {d.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                          </Badge>
                        </TableCell>
                      </TableRow>

                      {/* Expanded detail rows */}
                      {isExpanded && d.items.map((item, idx) => {
                        const product = getProductById(item.productId);
                        return (
                          <TableRow
                            key={`${d.id}-item-${idx}`}
                            className="bg-blue-50/40 dark:bg-blue-950/20 border-0"
                          >
                            <TableCell></TableCell>
                            <TableCell></TableCell>
                            <TableCell></TableCell>
                            <TableCell colSpan={2} className="py-2">
                              <div className="flex items-center gap-2">
                                <div className="h-6 w-6 bg-blue-100 dark:bg-blue-900 rounded flex items-center justify-center">
                                  <Package className="h-3 w-3 text-blue-600 dark:text-blue-300" />
                                </div>
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{product?.name || 'Unknown Product'}</span>
                                {product?.price && (
                                  <span className="text-[10px] text-slate-400">@ Rs. {product.price.toLocaleString()}/unit</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-mono font-bold text-blue-700 dark:text-blue-300 py-2">
                              ×{item.quantity}
                            </TableCell>
                            <TableCell className="text-center py-2">
                              {product?.price && (
                                <span className="text-[10px] font-mono text-slate-500">
                                  Rs. {(item.quantity * product.price).toLocaleString()}
                                </span>
                              )}
                            </TableCell>
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
        <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
          <DialogHeader className="bg-gradient-to-r from-rose-600 to-rose-700 px-6 py-4 text-white">
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-white">
              <AlertTriangle className="h-5 w-5 text-rose-200" />
              Clear Branch Dispatch History
            </DialogTitle>
            <DialogDescription className="text-rose-100 text-xs">
              This will permanently delete dispatch records from the database. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 py-5 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Select what to clear</Label>
              <Select value={clearTarget} onValueChange={v => setClearTarget(v as typeof clearTarget)}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branch Dispatches (Branch 1 & 2)</SelectItem>
                  <SelectItem value="branch_1">Branch 1 Only</SelectItem>
                  <SelectItem value="branch_2">Branch 2 Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-lg p-3">
              <p className="text-xs text-rose-700 dark:text-rose-300 font-medium">
                ⚠️ This will delete <strong>
                  {clearTarget === 'all'
                    ? branchDispatches.length
                    : branchDispatches.filter(d => d.destination === clearTarget).length
                  }
                </strong> dispatch record(s) permanently from the cloud database.
              </p>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 px-6 py-3 flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setIsClearOpen(false)} className="rounded-lg px-4 text-xs">
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-lg px-5 text-xs font-bold gap-1.5"
              onClick={handleClearHistory}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear Permanently
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
