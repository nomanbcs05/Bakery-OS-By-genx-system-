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
import { 
  ShoppingBag, 
  Plus, 
  Search, 
  Building2, 
  MapPin, 
  Wallet, 
  CreditCard, 
  ArrowUpRight, 
  TrendingUp, 
  History,
  Calendar,
  Layers,
  Filter,
  ArrowDownLeft,
  DollarSign,
  TrendingDown
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

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
    p.vendorCity.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (rawMaterials.find(m => m.id === p.materialId)?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalSpent = purchases.reduce((sum, p) => sum + p.totalCost, 0);
  const totalPaid = purchases.reduce((sum, p) => sum + p.amountPaid, 0);
  const totalRemaining = totalSpent - totalPaid;

  const getMaterialName = (id: string) => rawMaterials.find(m => m.id === id)?.name || 'Unknown';

  return (
    <div className="space-y-6 p-4 lg:p-6 bg-slate-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
             Procurement
             <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100 rounded-lg text-[10px] py-0 px-2 font-bold uppercase tracking-wider">v2.0</Badge>
          </h1>
          <p className="text-slate-500 text-sm font-medium">Manage raw material logistics and accounts</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl h-10 px-5 shadow-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl rounded-3xl p-6 overflow-hidden">
            <DialogHeader className="pb-4">
              <DialogTitle className="text-xl font-bold">New Procurement</DialogTitle>
              <DialogDescription>Record a new purchase and update inventory</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-wider">Material</Label>
                <Select onValueChange={(v) => setNewPurchase({...newPurchase, materialId: v})}>
                  <SelectTrigger className="rounded-xl h-11 border-slate-200">
                    <SelectValue placeholder="Select Material" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {rawMaterials.map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-wider">Qty</Label>
                <Input type="number" className="h-11 rounded-xl border-slate-200" onChange={(e) => setNewPurchase({...newPurchase, quantity: parseFloat(e.target.value)})}/>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-wider">Supplier</Label>
                <Input placeholder="Vendor name" className="h-11 rounded-xl border-slate-200" onChange={(e) => setNewPurchase({...newPurchase, vendorName: e.target.value})}/>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-wider">City</Label>
                <Input placeholder="Location" className="h-11 rounded-xl border-slate-200" onChange={(e) => setNewPurchase({...newPurchase, vendorCity: e.target.value})}/>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-wider">Total Bill</Label>
                <Input type="number" className="h-11 rounded-xl border-slate-200 font-bold" onChange={(e) => setNewPurchase({...newPurchase, totalCost: parseFloat(e.target.value)})}/>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-wider">Settled Amount</Label>
                <Input type="number" className="h-11 rounded-xl border-slate-200 focus:border-green-500" onChange={(e) => setNewPurchase({...newPurchase, amountPaid: parseFloat(e.target.value)})}/>
              </div>
            </div>
            <DialogFooter className="mt-6 gap-2">
              <Button variant="ghost" onClick={() => setIsAddOpen(false)} className="rounded-xl">Cancel</Button>
              <Button onClick={handleAddPurchase} className="rounded-xl bg-blue-600 hover:bg-blue-700 px-8">Submit Entry</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Small Stat Cards (Layout Copy from Screenshot) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Blue Style */}
        <div className="bg-[#2563EB] rounded-[22px] p-5 relative overflow-hidden text-white shadow-lg shadow-blue-200">
           <div className="flex items-center justify-between mb-2">
             <span className="text-xs font-medium opacity-90 uppercase tracking-[0.1em]">Gross Investment</span>
             <div className="h-7 w-7 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-md">
               <ArrowUpRight className="h-4 w-4" />
             </div>
           </div>
           <div className="flex items-end justify-between">
             <h3 className="text-[26px] font-black leading-tight tracking-tight">{(totalSpent/1000).toFixed(1)}K</h3>
             <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-bold">
               +11.01%
             </div>
           </div>
        </div>

        {/* Card 2: Dark Style */}
        <div className="bg-[#1F2937] rounded-[22px] p-5 relative overflow-hidden text-white shadow-xl">
           <div className="flex items-center justify-between mb-2">
             <span className="text-xs font-medium opacity-70 uppercase tracking-[0.1em]">Settled Funds</span>
             <div className="h-7 w-7 rounded-lg bg-white/10 flex items-center justify-center">
               <TrendingUp className="h-4 w-4" />
             </div>
           </div>
           <div className="flex items-end justify-between">
             <h3 className="text-[26px] font-black leading-tight tracking-tight">{(totalPaid/1000).toFixed(1)}K</h3>
             <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-400/20 text-red-300 text-[10px] font-bold">
               -0.03%
             </div>
           </div>
        </div>

        {/* Card 3: Blue Style */}
        <div className="bg-[#2563EB] rounded-[22px] p-5 relative overflow-hidden text-white shadow-lg shadow-blue-200">
           <div className="flex items-center justify-between mb-2">
             <span className="text-xs font-medium opacity-90 uppercase tracking-[0.1em]">Outstanding</span>
             <div className="h-7 w-7 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-md">
               <TrendingDown className="h-4 w-4" />
             </div>
           </div>
           <div className="flex items-end justify-between">
             <h3 className="text-[26px] font-black leading-tight tracking-tight">{(totalRemaining/1000).toFixed(1)}K</h3>
             <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-bold">
               +15.03%
             </div>
           </div>
        </div>

        {/* Card 4: Dark Style (Extra Info) */}
        <div className="bg-[#1F2937] rounded-[22px] p-5 relative overflow-hidden text-white shadow-xl">
           <div className="flex items-center justify-between mb-2">
             <span className="text-xs font-medium opacity-70 uppercase tracking-[0.1em]">Records</span>
             <div className="h-7 w-7 rounded-lg bg-white/10 flex items-center justify-center">
               <Layers className="h-4 w-4" />
             </div>
           </div>
           <div className="flex items-end justify-between">
             <h3 className="text-[26px] font-black leading-tight tracking-tight">{filteredPurchases.length}</h3>
             <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-bold text-green-400">
               +6.08%
             </div>
           </div>
        </div>
      </div>

      {/* Main Content Table (Snow UI Styled) */}
      <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
        <CardHeader className="p-6 flex flex-row items-center justify-between border-b border-slate-100">
          <div className="space-y-0.5">
            <CardTitle className="text-lg font-bold flex items-center gap-2">History</CardTitle>
            <CardDescription className="text-xs">Procurement logs and transactions</CardDescription>
          </div>
          <div className="flex items-center gap-3">
             <div className="relative w-56 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input 
                  placeholder="Search..." 
                  className="pl-9 rounded-xl border-slate-200 h-9 text-xs focus:ring-blue-100 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
             <Button variant="ghost" className="h-9 w-9 p-0 rounded-xl bg-slate-50 border border-slate-100"><Filter className="h-4 w-4 text-slate-500" /></Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-slate-500">Log Date</TableHead>
                <TableHead className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-slate-500">Material</TableHead>
                <TableHead className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-slate-500">Vendor</TableHead>
                <TableHead className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-slate-500 text-right">Volume</TableHead>
                <TableHead className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-slate-500">Method</TableHead>
                <TableHead className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-slate-500 text-right">Amount</TableHead>
                <TableHead className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-slate-500 text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPurchases.map((p) => (
                <TableRow key={p.id} className="hover:bg-slate-50/50 transition-colors border-slate-50">
                  <TableCell className="px-6 py-4 font-medium text-slate-500 text-xs">
                    {new Date(p.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <span className="font-bold text-slate-800 text-sm whitespace-nowrap">{getMaterialName(p.materialId)}</span>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-700 text-xs">{p.vendorName}</span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">{p.vendorCity || 'Global'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <span className="font-bold text-slate-800 text-xs">{p.quantity}</span>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <Badge className={`rounded-lg px-2 py-0.5 text-[9px] font-bold uppercase shadow-none border-none ${
                        p.paymentMethod === 'cash' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                    }`} variant="outline">
                      {p.paymentMethod}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-bold text-slate-800 text-xs">Rs. {p.totalCost.toLocaleString()}</span>
                      <span className="text-[9px] text-green-600 font-bold">Paid: {p.amountPaid.toLocaleString()}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <span className={`font-black text-xs ${p.totalCost - p.amountPaid > 0 ? 'text-red-500' : 'text-slate-300'}`}>
                      {p.totalCost - p.amountPaid > 0 ? `Rs. ${(p.totalCost - p.amountPaid).toLocaleString()}` : 'Cleared'}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {filteredPurchases.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center text-slate-400 text-xs font-medium italic">
                    No procurement records found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="text-center py-4 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
        Bakewise System | Procurement Engine
      </div>
    </div>
  );
}
