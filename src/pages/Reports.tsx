import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { BarChart3, Trash2, ChevronDown, Calendar, Layers } from 'lucide-react';
import { Navigate } from 'react-router-dom';

export default function Reports() {
  const { currentUser, sales, products, batches, expenses, clearSales, clearAllReportData } = useApp();

  if (!currentUser) return <Navigate to="/login" replace />;
  
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [viewMode, setViewMode] = useState<'product' | 'category'>('product');

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  
  const isWithinTimeframe = (dateStr: string) => {
    if (timeframe === 'all') return true;
    if (timeframe === 'today') return dateStr === todayStr;
    
    const date = new Date(dateStr);
    const diffDays = (now.getTime() - date.getTime()) / (1000 * 3600 * 24);
    
    if (timeframe === 'week') return diffDays <= 7;
    if (timeframe === 'month') return diffDays <= 30;
    return true;
  };

  const filteredSales = sales.filter(s => {
    const matchesBranch = branchFilter === 'all' 
      ? true 
      : branchFilter === 'walkin' ? s.type === 'factory_walkin' 
      : s.branch === branchFilter;
    
    return matchesBranch && isWithinTimeframe(s.date);
  });

  const filteredBatches = batches.filter(b => isWithinTimeframe(b.date));
  const filteredExpenses = expenses.filter(e => isWithinTimeframe(e.date));

  const totalRevenue = filteredSales
    .filter(s => s.paymentMethod !== 'credit' || s.isCreditPaid)
    .reduce((sum, s) => sum + s.total, 0);
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const estimatedProfit = totalRevenue - totalExpenses;

  // Product-wise sales
  const productSales = products.map(p => {
    const relevantSales = filteredSales.filter(s => s.paymentMethod !== 'credit' || s.isCreditPaid);
    const qty = relevantSales.flatMap(s => s.items).filter(i => i.productId === p.id).reduce((sum, i) => sum + i.quantity, 0);
    const rev = relevantSales.flatMap(s => s.items).filter(i => i.productId === p.id).reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
    return { name: p.name, quantity: qty, revenue: rev };
  }).filter(p => p.quantity > 0).sort((a, b) => b.revenue - a.revenue);

  // Grouped Data: Product vs Category
  let comparisonData = [];
  
  if (viewMode === 'product') {
    comparisonData = products.map(p => ({
      name: p.name,
      produced: filteredBatches.filter(b => b.productId === p.id).reduce((sum, b) => sum + b.quantity, 0),
      sold: filteredSales
        .filter(s => s.paymentMethod !== 'credit' || s.isCreditPaid)
        .flatMap(s => s.items)
        .filter(i => i.productId === p.id)
        .reduce((sum, i) => sum + i.quantity, 0),
    })).filter(p => p.produced > 0 || p.sold > 0);
  } else {
    const categories = Array.from(new Set(products.map(p => p.category)));
    comparisonData = categories.map(cat => {
      const catProducts = products.filter(p => p.category === cat);
      const prod = filteredBatches.filter(b => catProducts.some(p => p.id === b.productId)).reduce((sum, b) => sum + b.quantity, 0);
      const sold = filteredSales
        .filter(s => s.paymentMethod !== 'credit' || s.isCreditPaid)
        .flatMap(s => s.items)
        .filter(i => catProducts.some(p => p.id === i.productId))
        .reduce((sum, i) => sum + i.quantity, 0);
      return { name: cat, produced: prod, sold };
    }).filter(c => c.produced > 0 || c.sold > 0);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports</h1>
          <p className="text-sm text-muted-foreground">Sales, production, and financial reports</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={timeframe} onValueChange={(v: any) => setTimeframe(v)}>
            <SelectTrigger className="w-40">
              <Calendar className="h-4 w-4 mr-2 opacity-50" />
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Lifetime</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>

          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Channels</SelectItem>
              <SelectItem value="branch_1">Branch 1</SelectItem>
              <SelectItem value="branch_2">Branch 2</SelectItem>
              <SelectItem value="walkin">Walk-in</SelectItem>
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="text-destructive border-destructive/20 hover:bg-destructive/5 hover:text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Clear
                <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Clear Sales Records</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => clearSales('today')} className="text-destructive focus:text-destructive">
                Clear Today's Sales
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => clearSales('weekly')} className="text-destructive focus:text-destructive">
                Clear Weekly Sales
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => clearSales('monthly')} className="text-destructive focus:text-destructive">
                Clear Monthly Sales
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                 onClick={() => {
                   if(confirm('Are you sure you want to clear ALL sales records?')) {
                     clearSales('all');
                   }
                 }} 
                 className="text-destructive focus:text-destructive"
               >
                 Clear All Sales
               </DropdownMenuItem>
               <DropdownMenuSeparator />
               <DropdownMenuItem 
                 onClick={() => {
                   if(confirm('Are you sure you want to clear ALL report data?')) {
                     clearAllReportData();
                   }
                 }} 
                 className="bg-destructive text-destructive-foreground"
               >
                 Wipe All Reports
               </DropdownMenuItem>
             </DropdownMenuContent>
           </DropdownMenu>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="stat-card"><CardContent className="p-0">
          <p className="text-sm text-muted-foreground">Total Revenue</p>
          <p className="text-2xl font-bold text-foreground">Rs. {totalRevenue.toFixed(2)}</p>
        </CardContent></Card>
        <Card className="stat-card"><CardContent className="p-0">
          <p className="text-sm text-muted-foreground">Total Expenses</p>
          <p className="text-2xl font-bold text-destructive">Rs. {totalExpenses.toFixed(2)}</p>
        </CardContent></Card>
        <Card className="stat-card"><CardContent className="p-0">
          <p className="text-sm text-muted-foreground">Est. Profit</p>
          <p className={`text-2xl font-bold ${estimatedProfit >= 0 ? 'text-success' : 'text-destructive'}`}>Rs. {estimatedProfit.toFixed(2)}</p>
        </CardContent></Card>
      </div>

      {/* Production vs Sales Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4" /> Production vs Sales
          </CardTitle>
          <Select value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
            <SelectTrigger className="w-36 h-8 text-xs">
              <Layers className="h-3 w-3 mr-2 opacity-50" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="product">By Product</SelectItem>
              <SelectItem value="category">By Category</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  cursor={{ fill: 'hsl(var(--muted)/0.1)' }}
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} 
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="produced" fill="hsl(var(--primary))" name="Produced" radius={[4, 4, 0, 0]} barSize={30} />
                <Bar dataKey="sold" fill="hsl(var(--success))" name="Sold" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Product Sales Table */}
      <Card>
        <CardHeader><CardTitle className="text-base">Product-wise Sales</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Qty Sold</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productSales.map(p => (
                <TableRow key={p.name}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-right">{p.quantity}</TableCell>
                  <TableCell className="text-right font-semibold">Rs. {p.revenue.toFixed(2)}</TableCell>
                </TableRow>
              ))}
              {productSales.length === 0 && (
                <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No sales data</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
