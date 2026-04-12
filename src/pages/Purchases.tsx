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
  ChevronRight,
  Filter,
  ArrowDownLeft,
  DollarSign
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
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-8 p-4 lg:p-8 max-w-[1600px] mx-auto min-h-screen mesh-gradient">
      {/* Dynamic Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6"
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
              ERP Operations
            </Badge>
            <span className="text-muted-foreground/30">•</span>
            <span className="text-xs font-medium text-muted-foreground/60 tracking-tight">Supply Chain Management</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground sm:leading-none">
            Procurement <span className="text-primary italic">Central</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl font-medium leading-relaxed">
            Real-time visual intelligence for your raw material pipelines and vendor liquidity.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="rounded-full h-14 px-8 shadow-[0_10px_30px_-10px_rgba(249,115,22,0.5)] hover:shadow-[0_15px_40px_-10px_rgba(249,115,22,0.6)] transition-all bg-primary hover:bg-primary/95 text-primary-foreground group overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <Plus className="mr-2 h-5 w-5 group-hover:rotate-90 transition-transform" />
                <span className="font-bold tracking-tight">Record New Procurement</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl rounded-[40px] p-0 overflow-hidden border-none shadow-2xl">
              <div className="bg-primary p-8 text-primary-foreground">
                <DialogHeader>
                  <DialogTitle className="text-3xl font-black tracking-tighter">New Entry</DialogTitle>
                  <CardDescription className="text-primary-foreground/70 font-medium">Record a new purchase and update inventory automatically</CardDescription>
                </DialogHeader>
              </div>
              <div className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 ml-1">Material Logistics</Label>
                    <Select onValueChange={(v) => setNewPurchase({...newPurchase, materialId: v})}>
                      <SelectTrigger className="rounded-2xl h-14 border-muted/20 bg-muted/5 focus:ring-primary/20">
                        <SelectValue placeholder="Select Material Category" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-muted/20">
                        {rawMaterials.map(m => (
                          <SelectItem key={m.id} value={m.id} className="rounded-xl my-1">{m.name} <span className="text-muted-foreground italic text-xs">({m.unit})</span></SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 ml-1">Volume Quantity</Label>
                    <div className="relative">
                      <Layers className="absolute left-4 top-4.5 h-5 w-5 text-muted-foreground/40" />
                      <Input 
                        type="number" 
                        placeholder="0.00" 
                        className="h-14 pl-12 rounded-2xl border-muted/20 bg-muted/5 focus:ring-primary/20"
                        onChange={(e) => setNewPurchase({...newPurchase, quantity: parseFloat(e.target.value)})}
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 ml-1">Supplier Entity</Label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-4.5 h-5 w-5 text-muted-foreground/40" />
                      <Input 
                        placeholder="Partner/Vendor Name" 
                        className="h-14 pl-12 rounded-2xl border-muted/20 bg-muted/5 focus:ring-primary/20"
                        onChange={(e) => setNewPurchase({...newPurchase, vendorName: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 ml-1">Origin Location</Label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-4.5 h-5 w-5 text-muted-foreground/40" />
                      <Input 
                        placeholder="City or Region" 
                        className="h-14 pl-12 rounded-2xl border-muted/20 bg-muted/5 focus:ring-primary/20"
                        onChange={(e) => setNewPurchase({...newPurchase, vendorCity: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 ml-1">Financial Obligation</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-4.5 h-5 w-5 text-muted-foreground/40" />
                      <Input 
                        type="number" 
                        placeholder="Total Amount" 
                        className="h-14 pl-12 font-black text-xl rounded-2xl border-muted/20 bg-muted/5 focus:ring-primary/20"
                        onChange={(e) => setNewPurchase({...newPurchase, totalCost: parseFloat(e.target.value)})}
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 ml-1">Settled Amount</Label>
                    <div className="relative">
                      <Wallet className="absolute left-4 top-4.5 h-5 w-5 text-muted-foreground/40" />
                      <Input 
                        type="number" 
                        placeholder="Amount Paid" 
                        className="h-14 pl-12 rounded-2xl border-success/20 bg-success/5 focus:ring-success/20 focus:border-success"
                        onChange={(e) => setNewPurchase({...newPurchase, amountPaid: parseFloat(e.target.value)})}
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 ml-1">Payment Strategy</Label>
                    <Select onValueChange={(v: any) => setNewPurchase({...newPurchase, paymentMethod: v})}>
                      <SelectTrigger className="h-14 rounded-2xl border-muted/20 bg-muted/5">
                        <SelectValue placeholder="Method" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        <SelectItem value="cash" className="rounded-xl">Full Cash Settlement</SelectItem>
                        <SelectItem value="credit" className="rounded-xl">Partial Credit Line</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 ml-1">Transaction Timeline</Label>
                    <Input 
                      type="date" 
                      value={newPurchase.date}
                      className="h-14 rounded-2xl border-muted/20 bg-muted/5"
                      onChange={(e) => setNewPurchase({...newPurchase, date: e.target.value})}
                    />
                  </div>
                </div>
                <DialogFooter className="gap-4">
                  <Button variant="ghost" onClick={() => setIsAddOpen(false)} className="rounded-2xl h-14 px-8 font-bold">Discard</Button>
                  <Button onClick={handleAddPurchase} className="rounded-2xl h-14 px-12 flex-1 font-black text-lg shadow-xl shadow-primary/20">Finalize Procurement</Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Hero Analytics Cards */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <motion.div variants={item}>
          <Card className="relative overflow-hidden group border-none shadow-[0_20px_50px_rgba(0,0,0,0.05)] bg-white rounded-[40px] hover:shadow-[0_25px_60px_rgba(0,0,0,0.08)] transition-all duration-500">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
              <ShoppingBag size={120} />
            </div>
            <CardContent className="p-10">
              <div className="space-y-1 relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-12 w-12 rounded-[22px] bg-primary/10 flex items-center justify-center text-primary">
                    <ShoppingBag className="h-6 w-6" />
                  </div>
                  <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">Gross Investment</p>
                </div>
                <h3 className="text-5xl font-black text-foreground tracking-tighter">
                  <span className="text-2xl font-bold align-top mt-1 inline-block mr-1">Rs.</span>
                  {totalSpent.toLocaleString()}
                </h3>
                <div className="flex items-center gap-2 pt-4">
                  <Badge className="bg-primary/10 text-primary border-none text-[10px] px-2 py-0.5 font-bold">LIFETIME SOURCE</Badge>
                  <div className="h-1 w-1 rounded-full bg-muted-foreground/20" />
                  <span className="text-xs font-medium text-muted-foreground tracking-tight italic">Consolidated total</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="relative overflow-hidden group border-none shadow-[0_20px_50px_rgba(0,0,0,0.05)] bg-white rounded-[40px] hover:shadow-[0_25px_60px_rgba(0,0,0,0.08)] transition-all duration-500">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
              <ArrowUpRight size={120} />
            </div>
            <CardContent className="p-10">
              <div className="space-y-1 relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-12 w-12 rounded-[22px] bg-success/10 flex items-center justify-center text-success">
                    <Wallet className="h-6 w-6" />
                  </div>
                  <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">Capital Transferred</p>
                </div>
                <h3 className="text-5xl font-black text-success tracking-tighter">
                  <span className="text-2xl font-bold align-top mt-1 inline-block mr-1">Rs.</span>
                  {totalPaid.toLocaleString()}
                </h3>
                <div className="flex items-center gap-2 pt-4">
                  <Badge className="bg-success/10 text-success border-none text-[10px] px-2 py-0.5 font-bold">{Math.round((totalPaid/totalSpent || 0) * 100)}% SETTLED</Badge>
                  <div className="h-1 w-1 rounded-full bg-muted-foreground/20" />
                  <span className="text-xs font-medium text-muted-foreground tracking-tight italic">Realized payments</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="relative overflow-hidden group border-none shadow-[0_20px_50px_rgba(0,0,0,0.05)] bg-white rounded-[40px] hover:shadow-[0_25_60px_rgba(0,0,0,0.08)] transition-all duration-500">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700 text-destructive">
              <ArrowDownLeft size={120} />
            </div>
            <CardContent className="p-10">
              <div className="space-y-1 relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-12 w-12 rounded-[22px] bg-destructive/10 flex items-center justify-center text-destructive">
                    <History className="h-6 w-6" />
                  </div>
                  <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">Active Liability</p>
                </div>
                <h3 className="text-5xl font-black text-destructive tracking-tighter">
                  <span className="text-2xl font-bold align-top mt-1 inline-block mr-1">Rs.</span>
                  {totalRemaining.toLocaleString()}
                </h3>
                <div className="flex items-center gap-2 pt-4">
                  <Badge className="bg-destructive/10 text-destructive border-none text-[10px] px-2 py-0.5 font-bold">ACTION REQUIRED</Badge>
                  <div className="h-1 w-1 rounded-full bg-muted-foreground/20" />
                  <span className="text-xs font-medium text-muted-foreground tracking-tight italic">Current debt balance</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Main Records Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="border-none shadow-[0_30px_90px_rgba(0,0,0,0.04)] rounded-[48px] overflow-hidden bg-white/80 backdrop-blur-xl relative">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] to-transparent pointer-events-none" />
          
          <CardHeader className="p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-1">
              <CardTitle className="text-3xl font-black tracking-tight flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <History className="h-5 w-5 text-primary" />
                </div>
                Procurement History
              </CardTitle>
              <CardDescription className="text-muted-foreground/70 font-medium ml-1">Comprehensive audit trail of all incoming raw materials</CardDescription>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <div className="relative group flex-1 sm:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="Search materials, vendors..." 
                  className="pl-12 pr-4 rounded-2xl border-muted/20 bg-muted/5 h-14 w-full transition-all focus:ring-primary/20 focus:bg-white focus:shadow-lg focus:shadow-primary/5 border-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" className="h-14 w-14 rounded-2xl border-muted/20 bg-white hover:bg-muted/5 p-0">
                <Filter className="h-5 w-5 text-muted-foreground" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="p-0 relative z-10">
            <div className="overflow-x-auto px-6 pb-6">
              <Table>
                <TableHeader>
                  <TableRow className="border-none hover:bg-transparent">
                    <TableHead className="px-6 py-4 font-black uppercase text-[11px] tracking-[0.2em] text-muted-foreground/50">Timeline</TableHead>
                    <TableHead className="px-6 py-4 font-black uppercase text-[11px] tracking-[0.2em] text-muted-foreground/50">Material Asset</TableHead>
                    <TableHead className="px-6 py-4 font-black uppercase text-[11px] tracking-[0.2em] text-muted-foreground/50">Entity Partner</TableHead>
                    <TableHead className="px-6 py-4 font-black uppercase text-[11px] tracking-[0.2em] text-muted-foreground/50 text-right">Volume</TableHead>
                    <TableHead className="px-6 py-4 font-black uppercase text-[11px] tracking-[0.2em] text-muted-foreground/50">Status</TableHead>
                    <TableHead className="px-6 py-4 font-black uppercase text-[11px] tracking-[0.2em] text-muted-foreground/50 text-right">Capital Value</TableHead>
                    <TableHead className="px-6 py-4 font-black uppercase text-[11px] tracking-[0.2em] text-muted-foreground/50 text-right">Exposure</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {filteredPurchases.map((p, idx) => (
                      <motion.tr 
                        key={p.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: idx * 0.05 }}
                        className="group hover:bg-primary/[0.04] transition-all duration-300 rounded-[20px] mb-4 relative"
                      >
                        <TableCell className="px-6 py-6 font-semibold whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-muted/30 flex items-center justify-center text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                              <Calendar className="h-4 w-4" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-foreground font-black text-sm">{new Date(p.date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short' })}</span>
                              <span className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-wider">{new Date(p.date).getFullYear()}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-6">
                          <div className="flex flex-col">
                            <span className="font-black text-foreground text-lg group-hover:text-primary transition-colors tracking-tight">
                              {getMaterialName(p.materialId)}
                            </span>
                            <div className="flex items-center gap-1.5 pt-1">
                              <Badge variant="outline" className="h-5 text-[9px] font-bold px-1.5 opacity-60 rounded-md">RAW</Badge>
                              <span className="h-1 w-1 rounded-full bg-muted-foreground/20" />
                              <span className="text-[10px] font-semibold text-muted-foreground italic">Batch #{p.id.slice(-4)}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-6">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full border-2 border-muted/10 overflow-hidden bg-muted/5 flex items-center justify-center text-muted-foreground/40 font-black text-xs uppercase group-hover:border-primary/20 transition-colors">
                              {p.vendorName.charAt(0)}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-black text-foreground group-hover:underline decoration-primary/30 underline-offset-4">{p.vendorName}</span>
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-bold uppercase tracking-tight">
                                <MapPin className="h-2.5 w-2.5 opacity-50" /> {p.vendorCity || 'HQ'}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-6 text-right">
                          <div className="flex flex-col items-end">
                            <span className="font-black text-lg text-foreground tracking-tighter">{p.quantity}</span>
                            <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.1em]">
                              {rawMaterials.find(m => m.id === p.materialId)?.unit}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-6">
                          <div className={`
                            inline-flex items-center gap-2 px-3 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest
                            ${p.paymentMethod === 'cash' 
                              ? 'bg-success/10 text-success border border-success/20' 
                              : 'bg-warning/10 text-warning border border-warning/20'}
                          `}>
                            <div className={`h-1.5 w-1.5 rounded-full animate-pulse ${p.paymentMethod === 'cash' ? 'bg-success' : 'bg-warning'}`} />
                            {p.paymentMethod}
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-6 text-right">
                          <div className="flex flex-col items-end">
                            <span className="font-black text-lg text-foreground tracking-tighter">Rs. {p.totalCost.toLocaleString()}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-success font-black border-b border-success/30">PAID {p.amountPaid.toLocaleString()}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-6 text-right">
                          <span className={`
                            font-black text-lg tracking-tighter px-4 py-2 rounded-2xl
                            ${p.totalCost - p.amountPaid > 0 
                              ? 'bg-destructive/5 text-destructive border border-destructive/10' 
                              : 'bg-success/5 text-success border border-success/10 opacity-30'}
                          `}>
                            {p.totalCost - p.amountPaid > 0 
                              ? `Rs. ${(p.totalCost - p.amountPaid).toLocaleString()}` 
                              : 'CLEARED'}
                          </span>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
              
              {filteredPurchases.length === 0 && (
                <div className="h-[400px] flex flex-col items-center justify-center space-y-6 opacity-40 py-20 grayscale transition-all hover:grayscale-0 duration-700">
                  <div className="p-10 rounded-full bg-muted/10 relative">
                     <div className="absolute inset-0 border-4 border-dashed border-muted/20 animate-spin-slow rounded-full" />
                     <ShoppingBag className="h-20 w-20 text-muted-foreground/50" />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-3xl font-black tracking-tight text-foreground">Zero Signal Detected</p>
                    <p className="text-muted-foreground font-medium">No procurement logs match your current search parameters</p>
                  </div>
                  <Button variant="outline" className="rounded-full px-8 h-12 font-bold" onClick={() => setSearchTerm('')}>Reset Search Matrix</Button>
                </div>
              )}
            </div>
          </CardContent>
          
          <div className="p-8 border-t border-muted/10 flex items-center justify-between text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
            <span>SCM AUDIT CONFIGURED</span>
            <div className="flex items-center gap-4">
              <span>ACTIVE SYSTEM SYNC</span>
              <div className="h-2 w-2 rounded-full bg-success shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Footer Signature */}
      <div className="text-center pt-8 pb-4 opacity-20">
        <p className="text-xs font-black tracking-[0.4em] uppercase">Bakewise Intelligence Engine v2.0</p>
      </div>
    </div>
  );
}
