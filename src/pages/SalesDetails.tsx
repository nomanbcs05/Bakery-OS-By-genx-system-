import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, ShoppingBag, Filter, CalendarIcon, Download, ListOrdered } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Navigate } from 'react-router-dom';

export default function SalesDetails() {
  const { currentUser, selectedProfile, sales, getProductById } = useApp();

  if (!currentUser || !selectedProfile) return <Navigate to="/login" replace />;

  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState<'all' | 'branch_1' | 'branch_2' | 'factory_walkin'>('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  // Flatten the sales into individual line items
  const lineItems = useMemo(() => {
    const items: Array<{
      saleId: string;
      date: string;
      branch: string;
      type: string;
      productId: string;
      quantity: number;
      unitPrice: number;
      total: number;
      paymentMethod: string;
    }> = [];

    sales.forEach(sale => {
      sale.items.forEach(item => {
        items.push({
          saleId: sale.id,
          date: sale.date,
          branch: sale.branch || '',
          type: sale.type,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
          paymentMethod: sale.paymentMethod
        });
      });
    });

    return items;
  }, [sales]);

  const filteredItems = useMemo(() => {
    const isStaff = selectedProfile.role === 'branch_staff';
    const staffBranch = selectedProfile.branchId;

    return lineItems.filter(item => {
      // Role-based visibility
      if (isStaff && item.branch !== staffBranch) return false;

      // Branch filter (if admin)
      if (!isStaff && branchFilter !== 'all') {
        if (branchFilter === 'factory_walkin') {
          if (item.type !== 'factory_walkin') return false;
        } else if (item.branch !== branchFilter) {
          return false;
        }
      }

      // Date filter
      if (dateFrom && item.date < format(dateFrom, 'yyyy-MM-dd')) return false;
      if (dateTo && item.date > format(dateTo, 'yyyy-MM-dd')) return false;

      // Search
      if (search) {
        const q = search.toLowerCase();
        const product = getProductById(item.productId);
        const matchesProduct = product?.name.toLowerCase().includes(q);
        const matchesId = item.saleId.toLowerCase().includes(q);
        if (!matchesProduct && !matchesId) return false;
      }

      return true;
    }).sort((a, b) => b.date.localeCompare(a.date) || b.saleId.localeCompare(a.saleId));
  }, [lineItems, selectedProfile, branchFilter, dateFrom, dateTo, search, getProductById]);

  const totalRevenue = filteredItems.reduce((acc, curr) => acc + curr.total, 0);

  const exportCSV = () => {
    const headers = ['Date', 'Sale ID', 'Branch', 'Product', 'Qty', 'Price', 'Total', 'Payment'];
    const rows = filteredItems.map(item => {
      const p = getProductById(item.productId);
      return [
        item.date,
        item.saleId,
        item.type === 'factory_walkin' ? 'Walk-in' : (item.branch === 'branch_1' ? 'Branch 1' : 'Branch 2'),
        p?.name || 'Unknown',
        item.quantity,
        item.unitPrice.toFixed(2),
        item.total.toFixed(2),
        item.paymentMethod
      ];
    });
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `detailed-sales-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.click();
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Detailed Sales Records</h1>
          <p className="text-sm text-muted-foreground">Product-by-product itemized sales log</p>
        </div>
        {selectedProfile.role !== 'branch_staff' && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportCSV} className="h-9">
              <Download className="h-4 w-4 mr-2" /> Export
            </Button>
            <Badge variant="outline" className="px-3 py-1 bg-primary/5 border-primary/20 text-primary font-bold">
              Total Revenue: Rs. {totalRevenue.toFixed(2)}
            </Badge>
          </div>
        )}
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="relative md:col-span-2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products or Sale IDs..."
                className="pl-9 h-10"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            
            {selectedProfile.role !== 'branch_staff' && (
              <Select value={branchFilter} onValueChange={(v: any) => setBranchFilter(v)}>
                <SelectTrigger className="h-10">
                  <Filter className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="All Branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="branch_1">Branch 1</SelectItem>
                  <SelectItem value="branch_2">Branch 2</SelectItem>
                  <SelectItem value="factory_walkin">Walk-in Sales</SelectItem>
                </SelectContent>
              </Select>
            )}

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("h-10 justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {dateFrom ? format(dateFrom, 'MMM dd, yyyy') : 'Start Date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("h-10 justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {dateTo ? format(dateTo, 'MMM dd, yyyy') : 'End Date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 border-b pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <ListOrdered className="h-4 w-4 text-primary" />
              Itemized Sales Log ({filteredItems.length} items)
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50 text-[10px] uppercase tracking-wider font-bold">
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Line Total</TableHead>
                  <TableHead className="text-center">Sale ID</TableHead>
                  <TableHead>Payment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-40 text-center text-muted-foreground italic">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <ShoppingBag className="h-8 w-8 opacity-20" />
                        <p>No item records found matching filters.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item, idx) => {
                    const p = getProductById(item.productId);
                    const bColor = item.type === 'factory_walkin' ? 'bg-orange-100 text-orange-700' : 
                                   item.branch === 'branch_1' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700';
                    const bLabel = item.type === 'factory_walkin' ? 'Walk-in' : 
                                  item.branch === 'branch_1' ? 'Branch 1' : 'Branch 2';

                    return (
                      <TableRow key={`${item.saleId}-${idx}`} className="hover:bg-muted/10">
                        <TableCell className="text-xs font-medium whitespace-nowrap">{item.date}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("text-[9px] px-1.5 h-5 font-bold border-none", bColor)}>
                            {bLabel}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold text-sm">{p?.name || 'Unknown Item'}</TableCell>
                        <TableCell className="text-right font-mono text-xs">{item.quantity}</TableCell>
                        <TableCell className="text-right font-mono text-xs">Rs. {item.unitPrice.toFixed(0)}</TableCell>
                        <TableCell className="text-right font-mono font-bold text-primary">Rs. {item.total.toFixed(0)}</TableCell>
                        <TableCell className="text-center">
                          <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">#{item.saleId.slice(-5)}</code>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] capitalize h-5">
                            {item.paymentMethod}
                          </Badge>
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
    </div>
  );
}
