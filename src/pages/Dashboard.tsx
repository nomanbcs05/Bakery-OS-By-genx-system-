import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, TrendingUp, Factory, ShoppingCart, AlertTriangle, ArrowUpRight, ArrowDownRight, Layers, Layout, Share2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area } from 'recharts';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const { currentUser, products, batches, sales, dispatches, stock, getInventorySnapshots, getProductById } = useApp();

  if (!currentUser) return <Navigate to="/login" replace />;

  const today = new Date().toISOString().slice(0, 10);
  const todaySales = sales.filter(s => s.date === today);
  const todayBatches = batches.filter(b => b.date === today);
  const todayDispatches = dispatches.filter(d => d.date === today);
  const snapshots = getInventorySnapshots();
  
  const totalRevenue = todaySales
    .filter(s => s.paymentMethod !== 'credit' || s.isCreditPaid)
    .reduce((sum, s) => sum + s.total, 0);
  const totalProduced = todayBatches.reduce((sum, b) => sum + b.quantity, 0);
  const totalDispatched = todayDispatches.flatMap(d => d.items).reduce((sum, i) => sum + i.quantity, 0);
  const totalSold = todaySales.flatMap(s => s.items).reduce((sum, i) => sum + i.quantity, 0);

  const pendingSyncCount = sales.filter(s => s.syncStatus === 'pending').length;

  const lowStock = snapshots.filter(s => s.productionStock < 20 && s.productionStock > 0);

  const branchSalesData = [
    { name: 'Branch 1', sales: todaySales.filter(s => s.branch === 'branch_1' && (s.paymentMethod !== 'credit' || s.isCreditPaid)).reduce((sum, s) => sum + s.total, 0) },
    { name: 'Branch 2', sales: todaySales.filter(s => s.branch === 'branch_2' && (s.paymentMethod !== 'credit' || s.isCreditPaid)).reduce((sum, s) => sum + s.total, 0) },
    { name: 'Walk-in', sales: todaySales.filter(s => s.type === 'factory_walkin' && (s.paymentMethod !== 'credit' || s.isCreditPaid)).reduce((sum, s) => sum + s.total, 0) },
  ];

  const categoryData = products.reduce((acc, p) => {
    const existing = acc.find(a => a.name === p.category);
    const produced = batches.filter(b => b.productId === p.id).reduce((sum, b) => sum + b.quantity, 0);
    if (produced > 0) {
      if (existing) existing.value += produced;
      else acc.push({ name: p.category, value: produced });
    }
    return acc;
  }, [] as { name: string; value: number }[])
  .sort((a, b) => b.value - a.value);

  const COLORS = ['#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE'];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-6 p-4 lg:p-6 bg-slate-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm font-medium">Bakewise operational overview for today</p>
        </div>
        
        {pendingSyncCount > 0 && (
          <Badge className="bg-amber-50 text-amber-700 border-amber-200 rounded-lg px-3 py-1.5 flex items-center gap-2 animate-pulse">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">{pendingSyncCount} sales pending sync</span>
          </Badge>
        )}
      </div>

      {/* Small Compact Stat Cards (Layout Copy from Snapshot) */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <motion.div variants={item}>
          <div className="bg-[#2563EB] rounded-[24px] p-5 relative overflow-hidden text-white shadow-lg shadow-blue-200 group hover:scale-[1.02] transition-transform">
             <div className="flex items-center justify-between mb-2">
               <span className="text-[10px] font-bold opacity-90 uppercase tracking-[0.15em]">Today's Revenue</span>
               <div className="h-7 w-7 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-md">
                 <TrendingUp className="h-4 w-4" />
               </div>
             </div>
             <div className="flex items-end justify-between">
               <h3 className="text-[26px] font-black leading-tight tracking-tight">Rs. {totalRevenue.toLocaleString()}</h3>
               <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/10 text-[9px] font-bold tracking-tighter">
                  {todaySales.length} TRX
               </div>
             </div>
          </div>
        </motion.div>

        <motion.div variants={item}>
          <div className="bg-[#1F2937] rounded-[24px] p-5 relative overflow-hidden text-white shadow-xl group hover:scale-[1.02] transition-transform">
             <div className="flex items-center justify-between mb-2">
               <span className="text-[10px] font-bold opacity-70 uppercase tracking-[0.15em]">Produced Volume</span>
               <div className="h-7 w-7 rounded-lg bg-white/10 flex items-center justify-center">
                 <Factory className="h-4 w-4" />
               </div>
             </div>
             <div className="flex items-end justify-between">
               <h3 className="text-[26px] font-black leading-tight tracking-tight">{totalProduced.toLocaleString()}</h3>
               <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[9px] font-bold tracking-tighter uppercase">
                 {todayBatches.length} Batches
               </div>
             </div>
          </div>
        </motion.div>

        <motion.div variants={item}>
          <div className="bg-[#2563EB] rounded-[24px] p-5 relative overflow-hidden text-white shadow-lg shadow-blue-200 group hover:scale-[1.02] transition-transform">
             <div className="flex items-center justify-between mb-2">
               <span className="text-[10px] font-bold opacity-90 uppercase tracking-[0.15em]">Dispatched Units</span>
               <div className="h-7 w-7 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-md">
                 <Package className="h-4 w-4" />
               </div>
             </div>
             <div className="flex items-end justify-between">
               <h3 className="text-[26px] font-black leading-tight tracking-tight">{totalDispatched.toLocaleString()}</h3>
               <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/10 text-[9px] font-bold tracking-tighter uppercase">
                 {todayDispatches.length} Trips
               </div>
             </div>
          </div>
        </motion.div>

        <motion.div variants={item}>
          <div className="bg-[#1F2937] rounded-[24px] p-5 relative overflow-hidden text-white shadow-xl group hover:scale-[1.02] transition-transform">
             <div className="flex items-center justify-between mb-2">
               <span className="text-[10px] font-bold opacity-70 uppercase tracking-[0.15em]">Market Demand</span>
               <div className="h-7 w-7 rounded-lg bg-white/10 flex items-center justify-center">
                 <ShoppingCart className="h-4 w-4" />
               </div>
             </div>
             <div className="flex items-end justify-between">
               <h3 className="text-[26px] font-black leading-tight tracking-tight">{totalSold.toLocaleString()}</h3>
               <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 text-[9px] font-bold tracking-tighter uppercase">
                  Units Sold
               </div>
             </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Channel Card */}
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
          <CardHeader className="p-6 pb-2 border-b border-slate-50 flex flex-row items-center justify-between">
            <div className="space-y-0.5">
              <CardTitle className="text-sm font-bold text-slate-800">Sales by Channel</CardTitle>
              <CardDescription className="text-[10px] font-medium text-slate-400">Revenue distribution by branch</CardDescription>
            </div>
            <Layout className="h-4 w-4 text-slate-300" />
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={branchSalesData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="0 0" stroke="rgba(0,0,0,0.03)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94A3B8', fontWeight: 600 }} axisLine={false} tickLine={false} dy={5} />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ background: '#fff', border: 'none', borderRadius: '12px', boxShadow: '0 5px 20px rgba(0,0,0,0.05)', fontSize: '11px', fontWeight: 700 }}
                    cursor={{ stroke: '#2563EB', strokeWidth: 1, strokeDasharray: '4 4' }}
                    formatter={(value: number) => [`Rs. ${value.toLocaleString()}`, 'Revenue']}
                  />
                  <Area type="monotone" dataKey="sales" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Categories Distribution */}
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
          <CardHeader className="p-6 pb-2 border-b border-slate-50 flex flex-row items-center justify-between">
             <div className="space-y-0.5">
               <CardTitle className="text-sm font-bold text-slate-800">Production Focus</CardTitle>
               <CardDescription className="text-[10px] font-medium text-slate-400">Category-wise resource allocation</CardDescription>
             </div>
             <Share2 className="h-4 w-4 text-slate-300" />
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={categoryData} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={60} 
                    outerRadius={80} 
                    paddingAngle={5}
                    dataKey="value" 
                  >
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} cornerRadius={8} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ border: 'none', borderRadius: '12px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)', fontSize: '11px' }} 
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    iconType="circle"
                    wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Feed */}
      <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
        <CardHeader className="p-6 border-b border-slate-50 flex flex-row items-center justify-between">
          <div className="space-y-0.5">
            <CardTitle className="text-sm font-bold text-slate-800">Active Transaction Feed</CardTitle>
            <CardDescription className="text-[10px] font-medium text-slate-400">Live operational data from all branches</CardDescription>
          </div>
          <History className="h-4 w-4 text-slate-300" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-50 max-h-[400px] overflow-y-auto">
            {todaySales.slice().reverse().map(sale => (
              <div key={sale.id} className="p-4 hover:bg-slate-50/50 transition-colors flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${sale.branch === 'branch_1' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-600'}`}>
                    <ShoppingCart className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">
                      {sale.items.map(i => `${getProductById(i.productId)?.name || '?'} x${i.quantity}`).join(', ')}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                        {sale.branch === 'factory_walkin' ? 'Walk-in' : sale.branch === 'branch_1' ? 'Branch 1' : 'Branch 2'}
                      </span>
                      <span className="h-1 w-1 rounded-full bg-slate-200" />
                      <span className="text-[9px] font-medium text-slate-400 capitalize">{sale.paymentMethod}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-slate-900">Rs. {sale.total.toLocaleString()}</span>
                </div>
              </div>
            ))}
            {todaySales.length === 0 && (
              <div className="p-12 text-center">
                <p className="text-xs font-medium text-slate-300 italic tracking-wide">No transactions recorded today</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Low Stock Alerts (Modernized) */}
      {lowStock.length > 0 && (
        <Card className="border-none bg-red-50/50 rounded-3xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div className="flex flex-wrap gap-2">
                {lowStock.map(s => (
                  <Badge key={s.productId} className="bg-white text-red-600 border-none shadow-sm rounded-md text-[9px] font-bold uppercase tracking-tight">
                    {getProductById(s.productId)?.name}: {s.productionStock}
                  </Badge>
                ))}
              </div>
            </div>
            <span className="text-[9px] font-black text-red-400 uppercase tracking-widest hidden sm:block">Inventory Alert</span>
          </CardContent>
        </Card>
      )}
      
      <div className="text-center py-4 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
        Bakewise System | Core Dashboard
      </div>
    </div>
  );
}
