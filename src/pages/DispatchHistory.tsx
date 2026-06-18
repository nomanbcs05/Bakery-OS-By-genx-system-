import { safeLower } from "../lib/utils";
import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import type { LedgerEntry } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  History, Plus, Search, Download, Trash2, Edit, CheckCircle2, 
  Printer, Eye, Truck, Calendar, TrendingUp, Coins, Users, 
  MapPin, Filter, ArrowUpDown, ChevronRight, FileText, FileSpreadsheet, X
} from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { exportToPDF, exportToExcel } from '@/utils/exportUtils';

interface RunningLedgerEntry extends LedgerEntry {
  runningBalance: number;
}

export default function DispatchHistory() {
  const { 
    currentUser, selectedProfile, ledgerEntries, addLedgerEntry, 
    updateLedgerEntry, deleteLedgerEntry, loadModuleData, products, getProductById
  } = useApp();

  useEffect(() => {
    loadModuleData('finance');
    loadModuleData('sales');
  }, [loadModuleData]);

  const [activeTab, setActiveTab] = useState('transactions');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStation, setFilterStation] = useState('all');
  const [filterCustomer, setFilterCustomer] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterYear, setFilterYear] = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');
  
  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<Partial<LedgerEntry>>({});
  const [editingEntry, setEditingEntry] = useState<Partial<LedgerEntry>>({});

  // Receipt Statement State
  const [receiptData, setReceiptData] = useState<{
    open: boolean;
    customerName: string;
    station: string;
    entries: RunningLedgerEntry[];
    balance: number;
  }>({
    open: false,
    customerName: '',
    station: '',
    entries: [],
    balance: 0
  });

  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().slice(0, 10),
    name: '',
    station: '',
    type: 'sale', // 'sale' = debit, 'payment' = credit
    amount: '',
    accountHead: 'Manual Credit Record'
  });

  if (!currentUser || !selectedProfile) return <Navigate to="/login" replace />;

  const customerEntries = ledgerEntries.filter(e => e.category === 'customer');

  // Calculate Running Balances grouped by customer
  const calculateBalances = (entries: LedgerEntry[]): RunningLedgerEntry[] => {
    const sorted = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const customerBalances: Record<string, number> = {};
    
    const mapped = sorted.map(entry => {
      const custName = entry.name || 'Unknown';
      const prevBalance = customerBalances[custName] || 0;
      const currentBalance = prevBalance + (entry.debit || 0) - (entry.credit || 0);
      customerBalances[custName] = currentBalance;
      return {
        ...entry,
        runningBalance: currentBalance
      };
    });

    // Re-sort descending for user display (newest first)
    return mapped.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const allRunningEntries = calculateBalances(customerEntries);

  // Unique lists for filters
  const uniqueStations = Array.from(new Set(customerEntries.map(e => e.station).filter(Boolean))) as string[];
  const uniqueCustomers = Array.from(new Set(customerEntries.map(e => e.name).filter(Boolean))) as string[];
  const uniqueYears = Array.from(new Set(customerEntries.map(e => new Date(e.date).getFullYear().toString()))).sort((a, b) => Number(b) - Number(a));
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  // Filtered entries
  const filteredEntries = allRunningEntries.filter(entry => {
    const entryDate = new Date(entry.date);
    const dateStr = entry.date.split('T')[0];
    
    const matchesSearch = 
      (safeLower(entry.name).includes(safeLower(searchTerm)) || false) ||
      (safeLower(entry.station).includes(safeLower(searchTerm)) || false) ||
      (safeLower(entry.accountHead).includes(safeLower(searchTerm)) || false);
      
    const matchesStation = filterStation === 'all' || entry.station === filterStation;
    const matchesCustomer = filterCustomer === 'all' || entry.name === filterCustomer;
    const matchesStartDate = !startDate || dateStr >= startDate;
    const matchesEndDate = !endDate || dateStr <= endDate;
    const matchesYear = filterYear === 'all' || entryDate.getFullYear().toString() === filterYear;
    const matchesMonth = filterMonth === 'all' || entryDate.getMonth().toString() === filterMonth;

    return matchesSearch && matchesStation && matchesCustomer && matchesStartDate && matchesEndDate && matchesYear && matchesMonth;
  });

  // Customer Summaries
  const customerSummaries = uniqueCustomers.map(name => {
    const custEntries = customerEntries.filter(e => e.name === name);
    const station = custEntries[0]?.station || 'N/A';
    const totalDebit = custEntries.reduce((sum, e) => sum + (e.debit || 0), 0);
    const totalCredit = custEntries.reduce((sum, e) => sum + (e.credit || 0), 0);
    const balance = totalDebit - totalCredit;
    
    return { name, station, totalDebit, totalCredit, balance };
  }).filter(c => {
    const matchesSearch = safeLower(c.name).includes(safeLower(searchTerm)) || safeLower(c.station).includes(safeLower(searchTerm));
    const matchesStation = filterStation === 'all' || c.station === filterStation;
    return matchesSearch && matchesStation;
  });

  // Card stats
  const totalOutstanding = uniqueCustomers.reduce((sum, name) => {
    const custEntries = customerEntries.filter(e => e.name === name);
    const balance = custEntries.reduce((s, e) => s + (e.debit || 0) - (e.credit || 0), 0);
    return sum + (balance > 0 ? balance : 0);
  }, 0);

  const totalPaid = customerEntries.reduce((sum, e) => sum + (e.credit || 0), 0);
  const totalSales = customerEntries.reduce((sum, e) => sum + (e.debit || 0), 0);
  const totalActiveCustomers = uniqueCustomers.length;

  // Add manual entry
  const handleAdd = async () => {
    if (!newEntry.name || !newEntry.amount || parseFloat(newEntry.amount) <= 0) {
      toast.error("Please fill all required fields");
      return;
    }

    const debit = newEntry.type === 'sale' ? parseFloat(newEntry.amount) : 0;
    const credit = newEntry.type === 'payment' ? parseFloat(newEntry.amount) : 0;

    await addLedgerEntry({
      date: newEntry.date,
      accountHead: newEntry.accountHead || (newEntry.type === 'sale' ? 'Dispatch Credit Sale' : 'Credit Payment'),
      accountType: 'Asset',
      debit,
      credit,
      name: newEntry.name,
      station: newEntry.station || 'Factory Gate',
      accountNo: `le-${Date.now()}`,
      closingBalance: 0,
      category: 'customer'
    });

    setIsAddOpen(false);
    setNewEntry({
      date: new Date().toISOString().slice(0, 10),
      name: '',
      station: '',
      type: 'sale',
      amount: '',
      accountHead: 'Manual Credit Record'
    });
    toast.success("Customer credit transaction created");
  };

  // Edit entry
  const handleEdit = (entry: LedgerEntry) => {
    setEditingEntry({ ...entry });
    setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    if (editingEntry.id) {
      await updateLedgerEntry(editingEntry.id, {
        date: editingEntry.date,
        name: editingEntry.name,
        station: editingEntry.station,
        debit: Number(editingEntry.debit) || 0,
        credit: Number(editingEntry.credit) || 0,
        accountHead: editingEntry.accountHead
      });
      setIsEditOpen(false);
      toast.success("Ledger entry updated successfully");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this credit record? This will permanently modify customer balance.")) {
      await deleteLedgerEntry(id);
      toast.success("Credit record deleted successfully");
    }
  };

  // Export to Excel / PDF
  const handleExport = (type: 'excel' | 'pdf') => {
    const title = 'Dispatch & Customer Credit History';
    const fileName = 'dispatch_credit_history';
    const headers = ['Date', 'Customer Name', 'Station/City', 'Debit (Sales)', 'Credit (Paid)', 'Balance'];
    
    const data = filteredEntries.map(e => [
      new Date(e.date).toLocaleDateString(),
      e.name || 'N/A',
      e.station || 'N/A',
      `Rs. ${(e.debit || 0).toLocaleString()}`,
      `Rs. ${(e.credit || 0).toLocaleString()}`,
      `Rs. ${e.runningBalance.toLocaleString()}`
    ]);

    if (type === 'pdf') {
      exportToPDF(title, headers, data, fileName);
    } else {
      const excelData = filteredEntries.map(e => ({
        Date: new Date(e.date).toLocaleDateString(),
        'Customer Name': e.name || 'N/A',
        Station: e.station || 'N/A',
        'Debit (Sales)': e.debit || 0,
        'Credit (Paid)': e.credit || 0,
        Balance: e.runningBalance
      }));
      exportToExcel(excelData, fileName, 'Credit Statement');
    }
    toast.success(`Exported successfully as ${type.toUpperCase()}`);
  };

  // Print Statement for specific customer
  const handlePrintStatement = (custName: string) => {
    const custEntries = allRunningEntries.filter(e => e.name === custName).reverse(); // oldest first for running ledger statement
    const totalDebit = custEntries.reduce((sum, e) => sum + (e.debit || 0), 0);
    const totalCredit = custEntries.reduce((sum, e) => sum + (e.credit || 0), 0);
    const balance = totalDebit - totalCredit;

    setReceiptData({
      open: true,
      customerName: custName,
      station: custEntries[0]?.station || 'N/A',
      entries: custEntries,
      balance
    });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Title Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <div className="h-10 w-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/35">
              <History className="h-5 w-5" />
            </div>
            Dispatch & Credit History
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Enterprise ledger auditing, permanent dispatch histories, and customer credit ledger balances.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 font-semibold px-4 h-10 flex items-center gap-2 rounded-lg">
                <Plus className="h-4 w-4" /> Add Record
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-slate-900">New Credit/Payment Record</DialogTitle>
                <DialogDescription>Add a direct debit (sale) or credit (payment) to a customer's ledger.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input type="date" value={newEntry.date} onChange={e => setNewEntry({...newEntry, date: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Entry Type</Label>
                    <Select value={newEntry.type} onValueChange={v => setNewEntry({...newEntry, type: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sale">Debit (Sale / Dispatch)</SelectItem>
                        <SelectItem value="payment">Credit (Amount Paid)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Customer Name</Label>
                  <Input 
                    placeholder="e.g. Ahmed Ali" 
                    value={newEntry.name} 
                    onChange={e => setNewEntry({...newEntry, name: e.target.value})} 
                    list="customer-suggestions"
                  />
                  <datalist id="customer-suggestions">
                    {uniqueCustomers.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Station / City</Label>
                    <Input 
                      placeholder="e.g. Nawabshah" 
                      value={newEntry.station} 
                      onChange={e => setNewEntry({...newEntry, station: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Amount (Rs.)</Label>
                    <Input 
                      type="number" 
                      placeholder="0.00" 
                      value={newEntry.amount} 
                      onChange={e => setNewEntry({...newEntry, amount: e.target.value})} 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description / Remarks</Label>
                  <Input 
                    placeholder="e.g. Manual payment received, Gate pass dispatch" 
                    value={newEntry.accountHead} 
                    onChange={e => setNewEntry({...newEntry, accountHead: e.target.value})} 
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button onClick={handleAdd} className="bg-indigo-600 text-white hover:bg-indigo-700">Save Transaction</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-10 border-slate-200 hover:bg-slate-50 flex items-center gap-2">
                <Download className="h-4 w-4" /> Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('pdf')} className="flex items-center gap-2 cursor-pointer">
                <FileText className="h-4 w-4 text-rose-500" />
                <span>Export Statement PDF</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('excel')} className="flex items-center gap-2 cursor-pointer">
                <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
                <span>Export Statement Excel</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Outstanding */}
        <Card className="border-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 shadow-sm relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Total Outstanding</p>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1">Rs. {totalOutstanding.toLocaleString()}</h3>
              </div>
              <div className="h-12 w-12 bg-indigo-600/10 text-indigo-600 rounded-xl flex items-center justify-center">
                <Coins className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Badge className="bg-amber-100 text-amber-800 border-amber-200">Customer Receivable</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Total Sales (Debits) */}
        <Card className="border-0 bg-gradient-to-br from-rose-500/10 to-orange-500/10 shadow-sm relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Total Credit Sales</p>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1">Rs. {totalSales.toLocaleString()}</h3>
              </div>
              <div className="h-12 w-12 bg-rose-600/10 text-rose-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Badge className="bg-rose-100 text-rose-800 border-rose-200">Sales Value</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Total Cash Recovered */}
        <Card className="border-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 shadow-sm relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Cash Recovered</p>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1">Rs. {totalPaid.toLocaleString()}</h3>
              </div>
              <div className="h-12 w-12 bg-emerald-600/10 text-emerald-600 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Total Credits Paid</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Total Active Customers */}
        <Card className="border-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 shadow-sm relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Active Credit Customers</p>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1">{totalActiveCustomers}</h3>
              </div>
              <div className="h-12 w-12 bg-blue-600/10 text-blue-600 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Badge className="bg-blue-100 text-blue-800 border-blue-200">Distributors & Dealers</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Filters Panel */}
      <Card className="border-slate-100 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
        <CardHeader className="py-3 px-4 border-b border-slate-50 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-700 dark:text-slate-200">
              <Filter className="h-4 w-4 text-slate-400" /> Filters &amp; Search
            </CardTitle>
            {(searchTerm || filterStation !== 'all' || filterCustomer !== 'all' || startDate || endDate || filterYear !== 'all' || filterMonth !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7 px-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50"
                onClick={() => {
                  setSearchTerm('');
                  setFilterStation('all');
                  setFilterCustomer('all');
                  setStartDate('');
                  setEndDate('');
                  setFilterYear('all');
                  setFilterMonth('all');
                }}
              >
                <X className="h-3 w-3 mr-1" /> Clear All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">

            {/* Search Input */}
            <div className="space-y-1.5 sm:col-span-2 xl:col-span-2">
              <Label className="text-xs font-semibold text-slate-500">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Name, city, remarks..."
                  className="pl-9 h-9"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Customer filter */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500">Customer</Label>
              <Select value={filterCustomer} onValueChange={setFilterCustomer}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All Customers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  {uniqueCustomers.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Station filter */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500">City / Station</Label>
              <Select value={filterStation} onValueChange={setFilterStation}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All Cities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {uniqueStations.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Year filter */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500">Year</Label>
              <Select value={filterYear} onValueChange={v => { setFilterYear(v); setStartDate(''); setEndDate(''); }}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All Years" />
                </SelectTrigger>
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
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All Months" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {MONTHS.map((m, i) => <SelectItem key={i} value={i.toString()}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="space-y-1.5 sm:col-span-2 xl:col-span-1">
              <Label className="text-xs font-semibold text-slate-500">Custom Date Range</Label>
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
          {(filterYear !== 'all' || filterMonth !== 'all' || filterCustomer !== 'all' || filterStation !== 'all') && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-50">
              {filterYear !== 'all' && (
                <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full px-2.5 py-0.5 text-xs font-semibold">
                  <Calendar className="h-3 w-3" /> {filterYear}
                  <button onClick={() => setFilterYear('all')} className="ml-1 hover:text-indigo-900"><X className="h-3 w-3" /></button>
                </span>
              )}
              {filterMonth !== 'all' && (
                <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full px-2.5 py-0.5 text-xs font-semibold">
                  <Calendar className="h-3 w-3" /> {MONTHS[Number(filterMonth)]}
                  <button onClick={() => setFilterMonth('all')} className="ml-1 hover:text-indigo-900"><X className="h-3 w-3" /></button>
                </span>
              )}
              {filterCustomer !== 'all' && (
                <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-full px-2.5 py-0.5 text-xs font-semibold">
                  <Users className="h-3 w-3" /> {filterCustomer}
                  <button onClick={() => setFilterCustomer('all')} className="ml-1 hover:text-slate-900"><X className="h-3 w-3" /></button>
                </span>
              )}
              {filterStation !== 'all' && (
                <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-full px-2.5 py-0.5 text-xs font-semibold">
                  <MapPin className="h-3 w-3" /> {filterStation}
                  <button onClick={() => setFilterStation('all')} className="ml-1 hover:text-slate-900"><X className="h-3 w-3" /></button>
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results summary bar */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>
          Showing <strong className="text-slate-700">{filteredEntries.length}</strong> of <strong className="text-slate-700">{allRunningEntries.length}</strong> transactions
          {(filterYear !== 'all' || filterMonth !== 'all') && (
            <span className="ml-1 text-indigo-600 font-semibold">
              — {filterMonth !== 'all' ? MONTHS[Number(filterMonth)] : ''}{filterMonth !== 'all' && filterYear !== 'all' ? ' ' : ''}{filterYear !== 'all' ? filterYear : ''}
            </span>
          )}
        </span>
        <span className="font-semibold text-slate-600">
          Filtered Outstanding: <span className="text-rose-600 font-black">Rs. {filteredEntries.filter(e => e.debit > 0).reduce((s,e) => s + (e.debit - e.credit), 0).toLocaleString()}</span>
        </span>
      </div>

      {/* Main Ledger Tables */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-4 w-[280px]">
          <TabsTrigger value="transactions" className="rounded-lg text-xs font-bold py-2">Transactions History</TabsTrigger>
          <TabsTrigger value="summaries" className="rounded-lg text-xs font-bold py-2">Customer Balances</TabsTrigger>
        </TabsList>

        {/* Transactions Tab */}
        <TabsContent value="transactions">
          <Card className="border-0 shadow-md">
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50 border-b border-slate-100 dark:bg-slate-800">
                  <TableRow>
                    <TableHead className="w-[110px] text-xs font-bold uppercase text-slate-500">Date</TableHead>
                    <TableHead className="text-xs font-bold uppercase text-slate-500">Customer Name</TableHead>
                    <TableHead className="text-xs font-bold uppercase text-slate-500">Station / City</TableHead>
                    <TableHead className="text-right text-xs font-bold uppercase text-slate-500">Debit (Sales)</TableHead>
                    <TableHead className="text-right text-xs font-bold uppercase text-slate-500">Credit (Paid)</TableHead>
                    <TableHead className="text-right text-xs font-bold uppercase text-slate-500">Running Balance</TableHead>
                    <TableHead className="text-right text-xs font-bold uppercase text-slate-500 w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-slate-400 italic">
                        No credit transaction records found matching your filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEntries.map((rec) => (
                      <TableRow key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Date column (display nice date format) */}
                        <TableCell className="font-mono text-xs text-slate-600">
                          {new Date(rec.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                        </TableCell>
                        
                        {/* Customer Name */}
                        <TableCell className="font-semibold text-slate-800">
                          <div className="flex flex-col">
                            <span>{rec.name}</span>
                            <span className="text-[9px] text-slate-400 font-normal">{rec.accountHead || 'Sales dispatch'}</span>
                          </div>
                        </TableCell>

                        {/* Station/City */}
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] border-slate-200 text-slate-600 font-medium">
                            <MapPin className="h-2.5 w-2.5 mr-1 text-slate-400" />
                            {rec.station || 'Factory'}
                          </Badge>
                        </TableCell>

                        {/* Debit */}
                        <TableCell className="text-right font-mono font-bold text-rose-600">
                          {rec.debit > 0 ? `Rs. ${rec.debit.toLocaleString()}` : '-'}
                        </TableCell>

                        {/* Credit */}
                        <TableCell className="text-right font-mono font-bold text-emerald-600">
                          {rec.credit > 0 ? `Rs. ${rec.credit.toLocaleString()}` : '-'}
                        </TableCell>

                        {/* Running Balance */}
                        <TableCell className="text-right font-mono font-black text-slate-900">
                          Rs. {rec.runningBalance.toLocaleString()}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                              onClick={() => handleEdit(rec)}
                              title="Edit record details"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8 text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                              onClick={() => handleDelete(rec.id!)}
                              title="Delete record"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customer summaries view */}
        <TabsContent value="summaries">
          <Card className="border-0 shadow-md">
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50 border-b border-slate-100 dark:bg-slate-800">
                  <TableRow>
                    <TableHead className="text-xs font-bold uppercase text-slate-500">Customer Name</TableHead>
                    <TableHead className="text-xs font-bold uppercase text-slate-500">Station / City</TableHead>
                    <TableHead className="text-right text-xs font-bold uppercase text-slate-500">Total Debit (Sales)</TableHead>
                    <TableHead className="text-right text-xs font-bold uppercase text-slate-500">Total Credit (Paid)</TableHead>
                    <TableHead className="text-right text-xs font-bold uppercase text-slate-500 font-black">Net Balance</TableHead>
                    <TableHead className="text-right text-xs font-bold uppercase text-slate-500 w-[200px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerSummaries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-slate-400 italic">
                        No customer accounts found matching your filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    customerSummaries.map((c, idx) => (
                      <TableRow key={`${c.name}-${idx}`} className="hover:bg-slate-50/70 transition-colors">
                        <TableCell className="font-bold text-slate-800 text-sm">{c.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] border-slate-200 text-slate-600 font-medium">
                            <MapPin className="h-2.5 w-2.5 mr-1 text-slate-400" />
                            {c.station}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-slate-600">Rs. {c.totalDebit.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono text-slate-600">Rs. {c.totalCredit.toLocaleString()}</TableCell>
                        <TableCell className={`text-right font-mono font-black text-sm ${c.balance > 0 ? 'text-rose-600' : c.balance < 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                          Rs. {c.balance.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs font-semibold h-8 border-slate-200 hover:bg-slate-50 hover:text-indigo-600"
                              onClick={() => handlePrintStatement(c.name)}
                            >
                              <Printer className="h-3.5 w-3.5 mr-1" /> Statement
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Editing Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">Edit Ledger Record</DialogTitle>
            <DialogDescription>Modify fields of this ledger entry. All changes are saved permanently.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input 
                  type="date" 
                  value={editingEntry.date ? editingEntry.date.split('T')[0] : ''} 
                  onChange={e => setEditingEntry({...editingEntry, date: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input 
                  placeholder="Description" 
                  value={editingEntry.accountHead || ''} 
                  onChange={e => setEditingEntry({...editingEntry, accountHead: e.target.value})} 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Customer Name</Label>
                <Input 
                  value={editingEntry.name || ''} 
                  onChange={e => setEditingEntry({...editingEntry, name: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label>Station / City</Label>
                <Input 
                  value={editingEntry.station || ''} 
                  onChange={e => setEditingEntry({...editingEntry, station: e.target.value})} 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-rose-600 font-bold">Debit (Sale Amount)</Label>
                <Input 
                  type="number" 
                  value={editingEntry.debit || 0} 
                  onChange={e => setEditingEntry({...editingEntry, debit: Number(e.target.value)})} 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-emerald-600 font-bold">Credit (Paid Amount)</Label>
                <Input 
                  type="number" 
                  value={editingEntry.credit || 0} 
                  onChange={e => setEditingEntry({...editingEntry, credit: Number(e.target.value)})} 
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdate} className="bg-indigo-600 text-white hover:bg-indigo-700">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Customer Ledger statement preview modal */}
      <Dialog open={receiptData.open} onOpenChange={(open) => setReceiptData(prev => ({ ...prev, open }))}>
        <DialogContent className="max-w-2xl bg-white dark:bg-slate-900 border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center justify-between text-slate-800">
              <span>Customer Statement Preview</span>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => {
                  window.print();
                }}
                className="bg-indigo-50 border-indigo-100 text-indigo-600 hover:bg-indigo-100"
              >
                <Printer className="h-4 w-4 mr-2" /> Print Statement
              </Button>
            </DialogTitle>
          </DialogHeader>

          {/* Statement body for printing */}
          <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 print-section overflow-y-auto max-h-[450px]">
            <div className="flex justify-between items-start border-b pb-4 mb-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">BAKEWISE ERP</h2>
                <p className="text-xs text-slate-500">Premium Bakery Production & Sales Ledger</p>
                <p className="text-xs text-slate-500 mt-1">Station: {receiptData.station}</p>
              </div>
              <div className="text-right">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Statement of Account</h3>
                <p className="text-xs text-slate-500">Customer: <strong className="text-slate-800">{receiptData.customerName}</strong></p>
                <p className="text-[10px] text-slate-400 mt-1">Generated: {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            <Table>
              <TableHeader className="bg-slate-100">
                <TableRow>
                  <TableHead className="text-xs font-bold text-slate-600 py-2">Date</TableHead>
                  <TableHead className="text-xs font-bold text-slate-600 py-2">Description</TableHead>
                  <TableHead className="text-right text-xs font-bold text-slate-600 py-2">Debit (Sale)</TableHead>
                  <TableHead className="text-right text-xs font-bold text-slate-600 py-2">Credit (Paid)</TableHead>
                  <TableHead className="text-right text-xs font-bold text-slate-600 py-2">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receiptData.entries.map((rec, i) => (
                  <TableRow key={i} className="border-b border-slate-100 text-xs">
                    <TableCell className="py-2 font-mono">{new Date(rec.date).toLocaleDateString()}</TableCell>
                    <TableCell className="py-2 font-medium">{rec.accountHead || 'Credit sale'}</TableCell>
                    <TableCell className="py-2 text-right font-mono text-rose-600">
                      {rec.debit > 0 ? `Rs. ${rec.debit.toLocaleString()}` : '-'}
                    </TableCell>
                    <TableCell className="py-2 text-right font-mono text-emerald-600">
                      {rec.credit > 0 ? `Rs. ${rec.credit.toLocaleString()}` : '-'}
                    </TableCell>
                    <TableCell className="py-2 text-right font-mono font-bold text-slate-900">
                      Rs. {rec.runningBalance.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex justify-end mt-6 border-t pt-4">
              <div className="w-64 space-y-1.5 text-xs text-right">
                <div className="flex justify-between font-semibold text-slate-600">
                  <span>Total Debit:</span>
                  <span className="font-mono">Rs. {receiptData.entries.reduce((sum, e) => sum + (e.debit || 0), 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-semibold text-slate-600">
                  <span>Total Credit:</span>
                  <span className="font-mono">Rs. {receiptData.entries.reduce((sum, e) => sum + (e.credit || 0), 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-900 border-t pt-1.5">
                  <span>Net Outstanding Balance:</span>
                  <span className="font-mono text-indigo-600">Rs. {receiptData.balance.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReceiptData(prev => ({ ...prev, open: false }))}>Close Preview</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
