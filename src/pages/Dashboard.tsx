import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, TrendingUp, Factory, ShoppingCart, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Navigate } from 'react-router-dom';

export default function Dashboard() {
  const { currentUser, products, batches, sales, dispatches, stock, getInventorySnapshots, getProductById } = useApp();

  if (!currentUser) return <Navigate to="/login" replace />;

  const todaySales = sales.filter(s => s.date === new Date().toISOString().slice(0, 10));
  const totalRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);
  const totalProduced = batches.reduce((sum, b) => sum + b.quantity, 0);
  const totalDispatched = dispatches.flatMap(d => d.items).reduce((sum, i) => sum + i.quantity, 0);
  const snapshots = getInventorySnapshots();

  const pendingSyncCount = sales.filter(s => s.syncStatus === 'pending').length;

  const lowStock = snapshots.filter(s => s.productionStock < 20 && s.productionStock > 0);

  const branchSalesData = [
    { name: 'Branch 1', sales: sales.filter(s => s.branch === 'branch_1').reduce((sum, s) => sum + s.total, 0) },
    { name: 'Branch 2', sales: sales.filter(s => s.branch === 'branch_2').reduce((sum, s) => sum + s.total, 0) },
    { name: 'Walk-in', sales: sales.filter(s => s.type === 'factory_walkin').reduce((sum, s) => sum + s.total, 0) },
  ];

  const categoryData = products.reduce((acc, p) => {
    const existing = acc.find(a => a.name === p.category);
    const produced = batches.filter(b => b.productId === p.id).reduce((sum, b) => sum + b.quantity, 0);
    if (existing) existing.value += produced;
    else acc.push({ name: p.category, value: produced });
    return acc;
  }, [] as { name: string; value: number }[]);

  const COLORS = ['hsl(32, 95%, 44%)', 'hsl(25, 80%, 50%)', 'hsl(142, 71%, 45%)', 'hsl(210, 100%, 52%)'];

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
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today's Revenue</p>
                <p className="text-2xl font-bold text-foreground">Rs. {totalRevenue.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">{todaySales.length} transactions</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Produced</p>
                <p className="text-2xl font-bold text-foreground">{totalProduced}</p>
                <p className="text-xs text-muted-foreground">{batches.length} batches</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
                <Factory className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Dispatched</p>
                <p className="text-2xl font-bold text-foreground">{totalDispatched}</p>
                <p className="text-xs text-muted-foreground">{dispatches.length} dispatches</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-info/10 flex items-center justify-center">
                <Package className="h-6 w-6 text-info" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Items Sold</p>
                <p className="text-2xl font-bold text-foreground">{sales.flatMap(s => s.items).reduce((sum, i) => sum + i.quantity, 0)}</p>
                <p className="text-xs text-muted-foreground">all channels</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-warning" />
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
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
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
              ? sales.filter(s => s.type === 'factory_walkin')
              : sales.filter(s => s.branch === channel);
            const channelTotal = channelSales.reduce((sum, s) => sum + s.total, 0);
            return (
              <div key={channel} className="mb-4 last:mb-0">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-foreground">{label}</h3>
                  <Badge variant="secondary">{channelSales.length} sales · ${channelTotal.toFixed(2)}</Badge>
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
