import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { 
  BarChart3, 
  Trash2, 
  ChevronDown, 
  Calendar, 
  Layers, 
  TrendingUp, 
  DollarSign, 
  ArrowUpRight, 
  Activity,
  Filter
} from 'lucide-react';
import { Navigate } from 'react-router-dom';

export default function Reports() {
  const { currentUser, sales, products, batches, expenses, purchases, clearSales, clearAllReportData } = useApp();

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
  const filteredPurchases = purchases.filter(p => isWithinTimeframe(p.date));
  
  const totalRevenue = filteredSales
    .filter(s => s.paymentMethod !== 'credit' || s.isCreditPaid)
    .reduce((sum, s) => sum + s.total, 0);
  
  const totalExpenseEntries = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalProcurement = filteredPurchases.reduce((sum, p) => sum + p.totalCost, 0);
  
  const totalExpenses = totalExpenseEntries + totalProcurement;
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
    <div className="space-y-6 p-4 lg:p-6 bg-slate-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">Analytics</h1>
          <p className="text-slate-500 text-sm font-medium">Business performance and financial summaries</p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={timeframe} onValueChange={(v: any) => setTimeframe(v)}>
            <SelectTrigger className="w-36 h-10 rounded-xl bg-white border-slate-200 text-xs font-semibold">
              <Calendar className="h-3 w-3 mr-2 opacity-50" />
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">Lifetime</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-10 rounded-xl bg-white border-slate-200 text-destructive hover:bg-red-50 hover:text-red-700 transition-colors">
                <Trash2 className="h-4 w-4 mr-2" />
                <span className="text-xs font-bold uppercase tracking-tight">Management</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-2xl border-slate-100 shadow-xl overflow-hidden p-1">
              <DropdownMenuLabel className="px-3 py-2 text-[10px] font-black uppercase text-slate-400">Purge Operations</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => clearSales('today')} className="rounded-xl text-xs font-semibold py-2">Clear Today's Sales</DropdownMenuItem>
              <DropdownMenuItem onClick={() => clearSales('weekly')} className="rounded-xl text-xs font-semibold py-2">Clear Weekly Sales</DropdownMenuItem>
              <DropdownMenuItem onClick={() => clearSales('monthly')} className="rounded-xl text-xs font-semibold py-2">Clear Monthly Sales</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                 onClick={() => confirm('Clear ALL sales records?') && clearSales('all')} 
                 className="rounded-xl text-xs font-bold text-red-600 focus:bg-red-50 py-2"
               >
                 Clear All Sales
               </DropdownMenuItem>
               <DropdownMenuItem 
                 onClick={() => confirm('Clear ALL report data?') && clearAllReportData()} 
                 className="rounded-xl text-xs font-bold bg-red-600 text-white focus:bg-red-700 py-2"
               >
                 Wipe All Reports
               </DropdownMenuItem>
             </DropdownMenuContent>
           </DropdownMenu>
        </div>
      </div>

      {/* Summary Small Cards (Snow UI style copy) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Revenue (Blue) */}
        <div className="bg-[#2563EB] rounded-[22px] p-5 relative overflow-hidden text-white shadow-lg shadow-blue-100">
           <div className="flex items-center justify-between mb-2">
             <span className="text-xs font-medium opacity-90 uppercase tracking-[0.1em]">Total Revenue</span>
             <div className="h-7 w-7 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-md">
               <TrendingUp className="h-4 w-4" />
             </div>
           </div>
           <div className="flex items-end justify-between">
             <h3 className="text-[26px] font-black leading-tight tracking-tight">{(totalRevenue/1000).toFixed(1)}K</h3>
             <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-bold">+11.0%</div>
           </div>
        </div>

        {/* Card 2: Procurement (Dark) */}
        <div className="bg-[#1F2937] rounded-[22px] p-5 relative overflow-hidden text-white shadow-xl">
           <div className="flex items-center justify-between mb-2">
             <span className="text-xs font-medium opacity-70 uppercase tracking-[0.1em]">Procurement</span>
             <div className="h-7 w-7 rounded-lg bg-white/10 flex items-center justify-center">
               <ArrowUpRight className="h-4 w-4" />
             </div>
           </div>
           <div className="flex items-end justify-between">
             <h3 className="text-[26px] font-black leading-tight tracking-tight">{(totalProcurement/1000).toFixed(1)}K</h3>
             <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-400/20 text-red-300 text-[10px] font-bold">-2.1%</div>
           </div>
        </div>

        {/* Card 3: Expenses (Blue) */}
        <div className="bg-[#2563EB] rounded-[22px] p-5 relative overflow-hidden text-white shadow-lg shadow-blue-100">
           <div className="flex items-center justify-between mb-2">
             <span className="text-xs font-medium opacity-90 uppercase tracking-[0.1em]">Total Expenses</span>
             <div className="h-7 w-7 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-md">
               <Activity className="h-4 w-4" />
             </div>
           </div>
           <div className="flex items-end justify-between">
             <h3 className="text-[26px] font-black leading-tight tracking-tight">{(totalExpenses/1000).toFixed(1)}K</h3>
             <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-bold">+15.2%</div>
           </div>
        </div>

        {/* Card 4: Profit (Dark) */}
        <div className="bg-[#1F2937] rounded-[22px] p-5 relative overflow-hidden text-white shadow-xl">
           <div className="flex items-center justify-between mb-2">
             <span className="text-xs font-medium opacity-70 uppercase tracking-[0.1em]">Net Profit</span>
             <div className="h-7 w-7 rounded-lg bg-white/10 flex items-center justify-center">
               <DollarSign className="h-4 w-4" />
             </div>
           </div>
           <div className="flex items-end justify-between">
             <h3 className={`text-[26px] font-black leading-tight tracking-tight ${estimatedProfit < 0 ? 'text-red-400' : ''}`}>
               {(estimatedProfit/1000).toFixed(1)}K
             </h3>
             <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${estimatedProfit >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
               {estimatedProfit >= 0 ? '+6.5%' : '-4.2%'}
             </div>
           </div>
        </div>
      </div>

      {/* Main Large Chart (Snow UI Layout Copy) */}
      <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
        <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between">
          <div className="flex items-center gap-8">
             <div className="space-y-0.5">
               <h3 className="text-lg font-bold text-slate-800">Production vs Sales</h3>
               <p className="text-xs text-slate-400 font-medium">Comparative output and settlement metrics</p>
             </div>
             <div className="hidden sm:flex gap-4 items-center pl-8 border-l border-slate-100">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-blue-500" />
                   <span className="text-xs font-bold text-slate-500">Produced</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-slate-100" />
                   <span className="text-xs font-bold text-slate-500">Sold</span>
                </div>
             </div>
          </div>
          <Select value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
            <SelectTrigger className="w-36 h-9 rounded-xl bg-slate-50 border-slate-200 text-[10px] font-bold uppercase tracking-wider">
              <Layers className="h-3 w-3 mr-2 text-slate-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="product">Product</SelectItem>
              <SelectItem value="category">Category</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="px-8 pb-8 pt-4">
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={comparisonData}>
                <defs>
                  <linearGradient id="colorProduced" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="0 0" stroke="rgba(0,0,0,0.03)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 600 }} 
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 600 }} 
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  cursor={{ stroke: '#2563EB', strokeWidth: 1, strokeDasharray: '4 4' }}
                  contentStyle={{ background: '#fff', border: 'none', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 700 }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="produced" 
                  stroke="#2563EB" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorProduced)" 
                  name="Produced"
                />
                <Area 
                  type="monotone" 
                  dataKey="sold" 
                  stroke="#E2E8F0" 
                  strokeWidth={3} 
                  strokeDasharray="5 5"
                  fill="transparent" 
                  name="Sold"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Grid: Tables or Smaller Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Sales Table Wrapper */}
         <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardHeader className="p-6 flex flex-row items-center justify-between border-b border-slate-50">
               <div>
                  <CardTitle className="text-sm font-bold text-slate-800">Sales Performance</CardTitle>
                  <CardDescription className="text-[10px] font-medium text-slate-400">Inventory movement by entity</CardDescription>
               </div>
               <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg bg-slate-50 border border-slate-100"><Activity className="h-4 w-4 text-slate-400" /></Button>
            </CardHeader>
            <CardContent className="p-0">
               <Table>
                 <TableHeader className="bg-slate-50/50">
                   <TableRow className="hover:bg-transparent border-slate-100">
                     <TableHead className="px-6 py-3 font-bold text-[10px] uppercase tracking-widest text-slate-500">Asset</TableHead>
                     <TableHead className="px-6 py-3 font-bold text-[10px] uppercase tracking-widest text-slate-500 text-right">Sold</TableHead>
                     <TableHead className="px-6 py-3 font-bold text-[10px] uppercase tracking-widest text-slate-500 text-right">Revenue</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {productSales.slice(0, 10).map(p => (
                     <TableRow key={p.name} className="hover:bg-slate-50/50 transition-colors border-slate-50">
                       <TableCell className="px-6 py-3 font-bold text-slate-700 text-xs">{p.name}</TableCell>
                       <TableCell className="px-6 py-3 text-right font-semibold text-slate-500 text-xs">{p.quantity}</TableCell>
                       <TableCell className="px-6 py-3 text-right font-black text-slate-800 text-xs">Rs. {p.revenue.toLocaleString()}</TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
            </CardContent>
         </Card>

         {/* Mini Performance Chart (Snow UI Layout Copy) */}
         <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardHeader className="p-6 border-b border-slate-50">
               <CardTitle className="text-sm font-bold text-slate-800">Unit Distribution</CardTitle>
               <CardDescription className="text-[10px] font-medium text-slate-400">Sold volume across products</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
               <div className="h-64">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={productSales.slice(0, 8)}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
                     <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94A3B8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                     <YAxis hide />
                     <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.05)', fontSize: '10px' }}
                        cursor={{ fill: 'rgba(37,99,235,0.03)' }}
                     />
                     <Bar dataKey="quantity" fill="#2563EB" radius={[6, 6, 0, 0]} barSize={24} />
                   </BarChart>
                 </ResponsiveContainer>
               </div>
            </CardContent>
         </Card>
      </div>

      <div className="text-center py-4 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
        Bakewise System | Analytics Engine
      </div>
    </div>
  );
}
