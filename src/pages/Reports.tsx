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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3, Trash2, ChevronDown } from 'lucide-react';
import { Navigate } from 'react-router-dom';

export default function Reports() {
  const { currentUser, sales, products, batches, expenses, clearSales, clearAllReportData } = useApp();

  if (!currentUser) return <Navigate to="/login" replace />;
  const [branchFilter, setBranchFilter] = useState<string>('all');

  const filteredSales = branchFilter === 'all' ? sales
    : branchFilter === 'walkin' ? sales.filter(s => s.type === 'factory_walkin')
    : sales.filter(s => s.branch === branchFilter);

  const totalRevenue = filteredSales.reduce((sum, s) => sum + s.total, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const estimatedProfit = totalRevenue - totalExpenses;

  // Product-wise sales
  const productSales = products.map(p => {
    const qty = filteredSales.flatMap(s => s.items).filter(i => i.productId === p.id).reduce((sum, i) => sum + i.quantity, 0);
    const rev = filteredSales.flatMap(s => s.items).filter(i => i.productId === p.id).reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
    return { name: p.name, quantity: qty, revenue: rev };
  }).filter(p => p.quantity > 0).sort((a, b) => b.revenue - a.revenue);

  // Production vs Sales
  const prodVsSales = products.map(p => ({
    name: p.name,
    produced: batches.filter(b => b.productId === p.id).reduce((sum, b) => sum + b.quantity, 0),
    sold: sales.flatMap(s => s.items).filter(i => i.productId === p.id).reduce((sum, i) => sum + i.quantity, 0),
  })).filter(p => p.produced > 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports</h1>
          <p className="text-sm text-muted-foreground">Sales, production, and financial reports</p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-10 text-destructive border-destructive/20 hover:bg-destructive/5 hover:text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Data
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
                   if(confirm('Are you sure you want to clear ALL report data (Sales, Production, and Expenses)? This action cannot be undone.')) {
                     clearAllReportData();
                   }
                 }} 
                 className="bg-destructive text-destructive-foreground focus:bg-destructive/90 focus:text-destructive-foreground"
               >
                 Clear All Report Data
               </DropdownMenuItem>
             </DropdownMenuContent>
           </DropdownMenu>

          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Channels</SelectItem>
              <SelectItem value="branch_1">Branch 1</SelectItem>
              <SelectItem value="branch_2">Branch 2</SelectItem>
              <SelectItem value="walkin">Walk-in</SelectItem>
            </SelectContent>
          </Select>
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
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Production vs Sales</CardTitle></CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={prodVsSales}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Bar dataKey="produced" fill="hsl(var(--primary))" name="Produced" radius={[4, 4, 0, 0]} />
                <Bar dataKey="sold" fill="hsl(var(--success))" name="Sold" radius={[4, 4, 0, 0]} />
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
