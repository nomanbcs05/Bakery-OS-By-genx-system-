import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, TrendingUp, Factory, ShoppingCart, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Navigate } from 'react-router-dom';

export default function Dashboard() {
  const { currentUser, products, batches, sales, dispatches, stock, getInventorySnapshots, getProductById } = useApp();

  if (!currentUser) return <Navigate to="/login" replace />;

  const today = new Date().toISOString().slice(0, 10);
  const todaySales = sales.filter(s => s.date === today);
  const todayBatches = batches.filter(b => b.date === today);
  const todayDispatches = dispatches.filter(d => d.date === today);
  const snapshots = getInventorySnapshots();
  
  const totalRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);
  const totalProduced = todayBatches.reduce((sum, b) => sum + b.quantity, 0);
  const totalDispatched = todayDispatches.flatMap(d => d.items).reduce((sum, i) => sum + i.quantity, 0);
  const totalSold = todaySales.flatMap(s => s.items).reduce((sum, i) => sum + i.quantity, 0);

  const pendingSyncCount = sales.filter(s => s.syncStatus === 'pending').length;

  const lowStock = snapshots.filter(s => s.productionStock < 20 && s.productionStock > 0);

  const branchSalesData = [
    { name: 'Branch 1', sales: todaySales.filter(s => s.branch === 'branch_1').reduce((sum, s) => sum + s.total, 0) },
    { name: 'Branch 2', sales: todaySales.filter(s => s.branch === 'branch_2').reduce((sum, s) => sum + s.total, 0) },
    { name: 'Walk-in', sales: todaySales.filter(s => s.type === 'factory_walkin').reduce((sum, s) => sum + s.total, 0) },
  ];

  const categoryData = products.reduce((acc, p) => {
    const existing = acc.find(a => a.name === p.category);
    const produced = todayBatches.filter(b => b.productId === p.id).reduce((sum, b) => sum + b.quantity, 0);
    if (existing) existing.value += produced;
    else acc.push({ name: p.category, value: produced });
    return acc;
  }, [] as { name: string; value: number }[])
  .filter(item => item.value > 0)
  .sort((a, b) => b.value - a.value);

  const COLORS = [
    '#f97316', // Orange 500
    '#0ea5e9', // Sky 500
    '#22c55e', // Green 500
    '#a855f7', // Purple 500
    '#ef4444', // Red 500
    '#14b8a6', // Teal 500
    '#eab308', // Yellow 500
    '#6366f1'  // Indigo 500
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of today's bakery operations</p>
      </div>

      {/* Stat Cards */}
      {pendingSyncCount > 0 && (
        <Card className="bg-warning/10 border-warning/20 mb-6">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-warning">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium text-sm">{pendingSyncCount} sales waiting to be synced to cloud</span>
            </div>
            <p className="text-xs text-muted-foreground">App will sync automatically when back online</p>
          </CardContent>
        </Card>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="stat-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Today's Revenue</p>
                <p className="text-2xl font-bold text-foreground mt-1">Rs. {totalRevenue.toFixed(0)}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{todaySales.length} transactions</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Produced Today</p>
                <p className="text-2xl font-bold text-foreground mt-1">{totalProduced}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{todayBatches.length} batches</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
                <Factory className="h-5 w-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Dispatched Today</p>
                <p className="text-2xl font-bold text-foreground mt-1">{totalDispatched}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{todayDispatches.length} dispatches</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-info/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-info" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Sold Today</p>
                <p className="text-2xl font-bold text-foreground mt-1">{totalSold}</p>
                <p className="text-[10px] text-muted-foreground mt-1">units sold today</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <ShoppingCart className="h-5 w-5 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sales by Channel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={branchSalesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
                  />
                  <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Production by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={categoryData} 
                    cx="50%" 
                    cy="45%" 
                    innerRadius={65} 
                    outerRadius={85} 
                    paddingAngle={5}
                    dataKey="value" 
                    label={({ name, value, percent }) => 
                      percent > 0.08 ? `${name}: ${value}` : ''
                    }
                  >
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} cornerRadius={4} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      background: 'rgba(255, 255, 255, 0.95)', 
                      backdropFilter: 'blur(4px)',
                      border: '1px solid hsl(var(--border))', 
                      borderRadius: '12px',
                      fontSize: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }} 
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    iconType="circle"
                    wrapperStyle={{ fontSize: '11px', paddingTop: '15px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Branch-wise Sales History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Branch-wise Sales</CardTitle>
        </CardHeader>
        <CardContent>
          {(['branch_1', 'branch_2', 'factory_walkin'] as const).map(channel => {
            const label = channel === 'branch_1' ? 'Branch 1' : channel === 'branch_2' ? 'Branch 2' : 'Walk-in';
            const channelSales = channel === 'factory_walkin'
              ? todaySales.filter(s => s.type === 'factory_walkin')
              : todaySales.filter(s => s.branch === channel);
            const channelTotal = channelSales.reduce((sum, s) => sum + s.total, 0);
            return (
              <div key={channel} className="mb-4 last:mb-0">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-foreground">{label}</h3>
                  <Badge variant="secondary">{channelSales.length} sales · Rs. {channelTotal.toFixed(0)}</Badge>
                </div>
                {channelSales.length === 0 ? (
                  <p className="text-xs text-muted-foreground pl-2">No sales yet</p>
                ) : (
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {channelSales.slice().reverse().map(sale => (
                      <div key={sale.id} className="flex items-center justify-between text-sm bg-muted/50 rounded-lg px-3 py-2">
                        <div className="flex-1 min-w-0">
                          <span className="text-foreground font-medium">
                            {sale.items.map(i => {
                              const p = getProductById(i.productId);
                              return `${p?.name || '?'} x${i.quantity}`;
                            }).join(', ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <Badge variant="outline" className="text-xs capitalize">{sale.paymentMethod}</Badge>
                          <span className="font-bold text-primary">Rs. {sale.total.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Low Stock Alerts */}
      {lowStock.length > 0 && (
        <Card className="border-warning/30 bg-warning/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {lowStock.map(s => {
                const product = getProductById(s.productId);
                return (
                  <Badge key={s.productId} variant="outline" className="border-warning/40 text-warning">
                    {product?.name}: {s.productionStock} left
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
