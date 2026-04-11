import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ShoppingBag, Plus, Search, Building2, MapPin, Wallet, CreditCard, ArrowUpRight, TrendingUp, History } from 'lucide-react';
import { toast } from 'sonner';

export default function Purchases() {
  const { rawMaterials, purchases, addPurchase } = useApp();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [newPurchase, setNewPurchase] = useState({
    materialId: '',
    quantity: 0,
    totalCost: 0,
    amountPaid: 0,
    paymentMethod: 'cash' as 'cash' | 'credit',
    vendorName: '',
    vendorCity: '',
    date: new Date().toISOString().slice(0, 10)
  });

  const handleAddPurchase = async () => {
    if (!newPurchase.materialId || !newPurchase.vendorName || newPurchase.quantity <= 0) {
      toast.error("Please fill all required fields");
      return;
    }

    await addPurchase(newPurchase);
    setIsAddOpen(false);
    setNewPurchase({
      materialId: '',
      quantity: 0,
      totalCost: 0,
      amountPaid: 0,
      paymentMethod: 'cash',
      vendorName: '',
      vendorCity: '',
      date: new Date().toISOString().slice(0, 10)
    });
  };

  const filteredPurchases = purchases.filter(p => 
    p.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.vendorCity.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalSpent = purchases.reduce((sum, p) => sum + p.totalCost, 0);
  const totalPaid = purchases.reduce((sum, p) => sum + p.amountPaid, 0);
  const totalRemaining = totalSpent - totalPaid;

  const getMaterialName = (id: string) => rawMaterials.find(m => m.id === id)?.name || 'Unknown';

  return (
    <div className="space-y-8 animate-fade-in p-1 lg:p-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center">
              <ShoppingBag className="h-6 w-6 text-primary" />
            </div>
            Procurement Central
          </h1>
          <p className="text-muted-foreground mt-1 text-lg">Manage raw material purchases and vendor accounts</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="rounded-2xl h-14 px-8 shadow-xl hover:shadow-primary/20 transition-all bg-primary hover:bg-primary/90 text-primary-foreground group">
              <Plus className="mr-2 h-5 w-5 group-hover:rotate-90 transition-transform" />
              New Purchase Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl rounded-[32px] p-8">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Record New Purchase</DialogTitle>
              <CardDescription>Enter procurement details from your supplier</CardDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Raw Material</Label>
                <Select onValueChange={(v) => setNewPurchase({...newPurchase, materialId: v})}>
                  <SelectTrigger className="rounded-xl h-12">
                    <SelectValue placeholder="Select Material" />
                  </SelectTrigger>
                  <SelectContent>
                    {rawMaterials.map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.name} ({m.unit})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Quantity</Label>
                <Input 
                  type="number" 
                  placeholder="0.00" 
                  className="h-12 rounded-xl"
                  onChange={(e) => setNewPurchase({...newPurchase, quantity: parseFloat(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Supplier/Vendor Name</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                  <Input 
                    placeholder="E.g. United Mills" 
                    className="h-12 pl-10 rounded-xl"
                    onChange={(e) => setNewPurchase({...newPurchase, vendorName: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Vendor City</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                  <Input 
                    placeholder="E.g. Karachi" 
                    className="h-12 pl-10 rounded-xl"
                    onChange={(e) => setNewPurchase({...newPurchase, vendorCity: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Total Bill Amount</Label>
                <Input 
                  type="number" 
                  placeholder="0.00" 
                  className="h-12 font-bold text-lg rounded-xl"
                  onChange={(e) => setNewPurchase({...newPurchase, totalCost: parseFloat(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Amount Paid Now</Label>
                <Input 
                  type="number" 
                  placeholder="0.00" 
                  className="h-12 rounded-xl border-success/30 focus-visible:ring-success"
                  onChange={(e) => setNewPurchase({...newPurchase, amountPaid: parseFloat(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Payment Strategy</Label>
                <Select onValueChange={(v: any) => setNewPurchase({...newPurchase, paymentMethod: v})}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder="Payment Mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Full Cash Payment</SelectItem>
                    <SelectItem value="credit">Partial Credit Account</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Purchase Date</Label>
                <Input 
                  type="date" 
                  value={newPurchase.date}
                  className="h-12 rounded-xl"
                  onChange={(e) => setNewPurchase({...newPurchase, date: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => setIsAddOpen(false)} className="rounded-xl h-12">Cancel</Button>
              <Button onClick={handleAddPurchase} className="rounded-xl h-12 px-8 flex-1 md:flex-none">Submit Purchase</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-card overflow-hidden group border-none shadow-2xl bg-gradient-to-br from-primary/5 via-transparent to-transparent">
          <CardContent className="p-8">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Gross Investment</p>
                <h3 className="text-4xl font-black text-foreground">Rs. {totalSpent.toLocaleString()}</h3>
                <div className="flex items-center gap-1.5 text-xs text-primary font-bold mt-2">
                  <TrendingUp className="h-4 w-4" />
                  Total Materials Sourced
                </div>
              </div>
              <div className="h-14 w-14 rounded-[20px] bg-primary/20 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                <ShoppingBag className="h-7 w-7 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card overflow-hidden group border-none shadow-2xl bg-gradient-to-br from-success/5 via-transparent to-transparent">
          <CardContent className="p-8">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Realized Payments</p>
                <h3 className="text-4xl font-black text-success">Rs. {totalPaid.toLocaleString()}</h3>
                <div className="flex items-center gap-1.5 text-xs text-success font-bold mt-2">
                  <Wallet className="h-4 w-4" />
                  Settled with Vendors
                </div>
              </div>
              <div className="h-14 w-14 rounded-[20px] bg-success/20 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                <ArrowUpRight className="h-7 w-7 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card overflow-hidden group border-none shadow-2xl bg-gradient-to-br from-destructive/5 via-transparent to-transparent">
          <CardContent className="p-8">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Liquidity Liability</p>
                <h3 className="text-4xl font-black text-destructive">Rs. {totalRemaining.toLocaleString()}</h3>
                <div className="flex items-center gap-1.5 text-xs text-destructive font-bold mt-2">
                  <CreditCard className="h-4 w-4" />
                  Outstanding Balances
                </div>
              </div>
              <div className="h-14 w-14 rounded-[20px] bg-destructive/20 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                <History className="h-7 w-7 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="border-none shadow-2xl rounded-[32px] overflow-hidden bg-white/50 backdrop-blur-md">
        <CardHeader className="p-8 flex flex-row items-center justify-between border-b border-muted/20">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Procurement History
            </CardTitle>
            <CardDescription>Comprehensive log of all materials brought in</CardDescription>
          </div>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search vendor or city..." 
              className="pl-9 rounded-xl border-muted/30 h-10 transition-all focus:w-80"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="px-8 py-4 font-bold uppercase text-[10px] tracking-widest">Date</TableHead>
                  <TableHead className="px-8 py-4 font-bold uppercase text-[10px] tracking-widest">Material</TableHead>
                  <TableHead className="px-8 py-4 font-bold uppercase text-[10px] tracking-widest">Supplier</TableHead>
                  <TableHead className="px-8 py-4 font-bold uppercase text-[10px] tracking-widest text-right">Qty</TableHead>
                  <TableHead className="px-8 py-4 font-bold uppercase text-[10px] tracking-widest">Payment</TableHead>
                  <TableHead className="px-8 py-4 font-bold uppercase text-[10px] tracking-widest text-right">Amount</TableHead>
                  <TableHead className="px-8 py-4 font-bold uppercase text-[10px] tracking-widest text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPurchases.map((p) => (
                  <TableRow key={p.id} className="group hover:bg-primary/[0.02] transition-colors border-b border-muted/10 last:border-0">
                    <TableCell className="px-8 py-5 font-medium whitespace-nowrap text-muted-foreground">
                      {new Date(p.date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </TableCell>
                    <TableCell className="px-8 py-5 font-bold text-foreground">
                      {getMaterialName(p.materialId)}
                    </TableCell>
                    <TableCell className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground group-hover:text-primary transition-colors">{p.vendorName}</span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase tracking-wider font-semibold">
                          <MapPin className="h-2 w-2" /> {p.vendorCity || 'Global'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-8 py-5 text-right font-black">
                      {p.quantity} <span className="text-[10px] font-medium text-muted-foreground">{rawMaterials.find(m => m.id === p.materialId)?.unit}</span>
                    </TableCell>
                    <TableCell className="px-8 py-5">
                      <Badge className={`rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight ${
                        p.paymentMethod === 'cash' ? 'bg-success/10 text-success border-success/20 hover:bg-success/20' : 'bg-warning/10 text-warning border-warning/20 hover:bg-warning/20'
                      }`} variant="outline">
                        {p.paymentMethod}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-8 py-5 text-right">
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground">Rs. {p.totalCost.toLocaleString()}</span>
                        <span className="text-[10px] text-success font-bold">Paid: {p.amountPaid.toLocaleString()}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-8 py-5 text-right">
                      <span className={`font-black ${p.totalCost - p.amountPaid > 0 ? 'text-destructive' : 'text-success/50'}`}>
                        {p.totalCost - p.amountPaid > 0 ? `Rs. ${(p.totalCost - p.amountPaid).toLocaleString()}` : 'Cleared'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredPurchases.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3 opacity-30">
                        <ShoppingBag className="h-12 w-12" />
                        <p className="text-xl font-bold italic">No procurement records found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
