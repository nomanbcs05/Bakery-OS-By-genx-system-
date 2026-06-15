import { safeLower } from "../lib/utils";
import { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  History, Search, Trash2, CalendarDays, FileDown, 
  Filter, X, Factory, ChevronRight, PackageCheck, Layers
} from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { exportToPDF, exportToExcel } from '@/utils/exportUtils';

export default function ProductionHistory() {
  const { 
    currentUser, products, batches, deleteProduction, getProductById, loadModuleData 
  } = useApp();

  useEffect(() => {
    loadModuleData('inventory');
  }, [loadModuleData]);

  if (!currentUser) return <Navigate to="/login" replace />;

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProduct, setFilterProduct] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Deletion logic
  const handleDeleteBatch = async (id: string) => {
    if (confirm("Are you sure you want to delete this production batch? This will revert the production stock levels!")) {
      try {
        await deleteProduction(id);
        toast.success("Production batch deleted successfully");
      } catch (err) {
        toast.error("Failed to delete production batch");
      }
    }
  };

  // Filter batches
  const filteredBatches = useMemo(() => {
    return [...batches].reverse().filter(b => {
      const d = b.date?.split('T')[0] || b.date || '';
      
      // Date range filter
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
      
      // Search term filter (on notes or product names inside the batch)
      const matchesSearch = 
        (safeLower(b.notes).includes(safeLower(searchTerm)) || false) ||
        (safeLower(b.id).includes(safeLower(searchTerm))) ||
        (b.items?.some(item => {
          const p = getProductById(item.productId);
          return p ? safeLower(p.name).includes(safeLower(searchTerm)) : false;
        }) || false);
        
      if (!matchesSearch) return false;

      // Specific product filter
      if (filterProduct !== 'all' && !b.items?.some(item => item.productId === filterProduct)) {
        return false;
      }

      return true;
    });
  }, [batches, startDate, endDate, searchTerm, filterProduct, getProductById]);

  // Export production summary
  const handleExportProduction = (format: 'pdf' | 'excel') => {
    if (filteredBatches.length === 0) {
      toast.error("No data available to export");
      return;
    }

    // Build per-product summary from filtered batches
    const summaryMap: Record<string, { name: string; category: string; unit: string; total: number }> = {};
    filteredBatches.forEach(b => {
      b.items?.forEach(item => {
        const p = getProductById(item.productId);
        const unit = item.unit || p?.unit || 'pcs';
        const key = `${item.productId}-${unit}`; // Key by product ID and unit to prevent overlap if units changed
        if (!summaryMap[key]) {
          summaryMap[key] = { 
            name: p?.name || 'Unknown', 
            category: p?.category || '—', 
            unit: unit, 
            total: 0 
          };
        }
        summaryMap[key].total += item.quantity;
      });
    });
    
    const rows = Object.values(summaryMap).sort((a, b) => a.category.localeCompare(b.category));

    const dateLabel = startDate || endDate
      ? `${startDate || 'Start'} to ${endDate || 'End'}`
      : 'All Filtered Time';
    const title = `Production Summary — ${dateLabel}`;
    const fileName = `production_summary_${startDate || 'all'}_${endDate || 'all'}`;

    if (format === 'pdf') {
      exportToPDF(
        title,
        ['Product', 'Category', 'Total Produced', 'Unit'],
        rows.map(r => [r.name, r.category, r.total.toString(), r.unit]),
        fileName
      );
      toast.success('PDF exported!');
    } else {
      exportToExcel(
        rows.map(r => ({ Product: r.name, Category: r.category, 'Total Produced': r.total, Unit: r.unit })),
        fileName,
        'Production Summary'
      );
      toast.success('Excel exported!');
    }
  };

  // Lifetime Stats
  const stats = useMemo(() => {
    let totalItems = 0;
    filteredBatches.forEach(b => {
      b.items?.forEach(item => {
        totalItems += item.quantity;
      });
    });
    return {
      batchCount: filteredBatches.length,
      itemCount: totalItems
    };
  }, [filteredBatches]);

  return (
    <div className="space-y-6 animate-fade-in pb-12 p-4 lg:p-6 bg-slate-50/50 min-h-screen">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
            <div className="h-10 w-10 bg-primary text-primary-foreground rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
              <History className="h-5 w-5" />
            </div>
            Production History
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse and manage all past production batches with preserved unit logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            className="h-10 border-slate-200 hover:bg-slate-50 flex items-center gap-2 bg-white"
            onClick={() => handleExportProduction('pdf')}
          >
            <FileDown className="h-4 w-4 text-rose-500" /> Export PDF
          </Button>
          <Button 
            variant="outline" 
            className="h-10 border-slate-200 hover:bg-slate-50 flex items-center gap-2 bg-white"
            onClick={() => handleExportProduction('excel')}
          >
            <FileDown className="h-4 w-4 text-emerald-500" /> Export Excel
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 bg-gradient-to-br from-orange-500/10 to-amber-500/10 shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Filtered Batches</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{stats.batchCount}</h3>
            </div>
            <div className="h-12 w-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
              <Factory className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Units Stored</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{stats.itemCount.toLocaleString()}</h3>
            </div>
            <div className="h-12 w-12 bg-indigo-600/10 text-indigo-600 rounded-xl flex items-center justify-center">
              <PackageCheck className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Date Filters</p>
              <h3 className="text-sm font-bold text-slate-700 mt-2 truncate">
                {startDate || endDate ? (
                  `${startDate || 'Beginning'} ➔ ${endDate || 'Today'}`
                ) : (
                  "All Time Records"
                )}
              </h3>
            </div>
            <div className="h-12 w-12 bg-emerald-600/10 text-emerald-600 rounded-xl flex items-center justify-center">
              <CalendarDays className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Filters Card */}
      <Card className="border-slate-100 shadow-sm bg-white">
        <CardHeader className="py-3 px-4 border-b border-slate-50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-700">
              <Filter className="h-4 w-4 text-slate-400" /> Filters &amp; Search
            </CardTitle>
            {(searchTerm || filterProduct !== 'all' || startDate || endDate) && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7 px-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50"
                onClick={() => {
                  setSearchTerm('');
                  setFilterProduct('all');
                  setStartDate('');
                  setEndDate('');
                }}
              >
                <X className="h-3 w-3 mr-1" /> Clear All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search Input */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500">Search Batch / Product</Label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="ID, notes, product..."
                  className="pl-9 h-9 text-xs"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Product filter */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500">Filter by Product</Label>
              <Select value={filterProduct} onValueChange={setFilterProduct}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="All Products" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Start Date */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500">From Date</Label>
              <div className="relative">
                <CalendarDays className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none z-10" />
                <Input
                  type="date"
                  className="pl-9 h-9 text-xs"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                />
              </div>
            </div>

            {/* End Date */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500">To Date</Label>
              <div className="relative">
                <CalendarDays className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none z-10" />
                <Input
                  type="date"
                  className="pl-9 h-9 text-xs"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Production Batches Table */}
      <Card className="border-0 shadow-sm overflow-hidden bg-white">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50 border-b border-slate-100">
                <TableRow>
                  <TableHead className="w-28 text-xs font-bold uppercase text-slate-500">Batch ID</TableHead>
                  <TableHead className="w-40 text-xs font-bold uppercase text-slate-500">Recorded Date</TableHead>
                  <TableHead className="text-xs font-bold uppercase text-slate-500">Products &amp; Quantities Stored</TableHead>
                  <TableHead className="w-32 text-right text-xs font-bold uppercase text-slate-500">Total Units</TableHead>
                  <TableHead className="text-xs font-bold uppercase text-slate-500">Batch Notes</TableHead>
                  <TableHead className="w-20 text-center text-xs font-bold uppercase text-slate-500">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBatches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-slate-400 italic">
                      No production batch records found matching your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBatches.map((batch) => {
                    const totalQty = batch.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;
                    return (
                      <TableRow key={batch.id} className="hover:bg-slate-50/50 transition-colors">
                        {/* Batch ID */}
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs uppercase bg-slate-50 border-slate-200">
                            {batch.id.slice(-6).toUpperCase()}
                          </Badge>
                        </TableCell>

                        {/* Date */}
                        <TableCell className="text-xs text-slate-600 font-medium">
                          {new Date(batch.date).toLocaleDateString(undefined, { 
                            day: '2-digit', 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </TableCell>

                        {/* Products Stored */}
                        <TableCell className="max-w-[450px]">
                          <div className="flex flex-wrap gap-1.5 py-1">
                            {batch.items?.map((item) => {
                              const product = getProductById(item.productId);
                              const storedUnit = item.unit || product?.unit || 'pcs';
                              return (
                                <Badge 
                                  key={item.productId}
                                  variant="secondary"
                                  className="text-[11px] font-semibold bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md shadow-sm"
                                >
                                  {product?.name || 'Unknown'}: 
                                  <span className="text-primary ml-1 font-extrabold">{item.quantity}</span> 
                                  <span className="text-slate-400 ml-0.5 font-normal">{storedUnit}</span>
                                </Badge>
                              );
                            })}
                            {(!batch.items || batch.items.length === 0) && (
                              <span className="text-slate-400 text-xs">—</span>
                            )}
                          </div>
                        </TableCell>

                        {/* Total items */}
                        <TableCell className="text-right font-mono font-bold text-slate-900 text-xs">
                          {totalQty.toLocaleString()}
                        </TableCell>

                        {/* Notes */}
                        <TableCell className="text-slate-500 italic text-xs truncate max-w-[200px]" title={batch.notes}>
                          {batch.notes || '—'}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-center">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                            onClick={() => handleDeleteBatch(batch.id)}
                            title="Delete production record"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <div className="text-center py-4 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
        Bakewise System | Production Log Auditor
      </div>
    </div>
  );
}
