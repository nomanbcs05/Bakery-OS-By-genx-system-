import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Factory, Save, Search, RefreshCcw, X, ListRestart } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';

const MEASURES = ['pcs', 'kg', 'box', 'dozen', 'tray', 'pkt', 'pound'];

export default function Production() {
  const { currentUser, products, batches, addMultiProduction, addProduct, getProductById, stock } = useApp();

  if (!currentUser) return <Navigate to="/login" replace />;

  const [searchTerm, setSearchTerm] = useState('');
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [measures, setMeasures] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newProduct, setNewProduct] = useState({ name: '', category: 'Bread', price: '', unit: 'pc' });
  const [hiddenProducts, setHiddenProducts] = useState<string[]>([]);

  // Filter active products
  const activeProducts = useMemo(() => {
    return products.filter(p => 
      p.isActive && 
      !hiddenProducts.includes(p.id) &&
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => a.category.localeCompare(b.category));
  }, [products, searchTerm, hiddenProducts]);

  const handleQtyChange = (productId: string, value: string) => {
    setQuantities(prev => ({ ...prev, [productId]: value }));
  };

  const handleMeasureChange = (productId: string, value: string) => {
    setMeasures(prev => ({ ...prev, [productId]: value }));
  };

  const resetForm = () => {
    setQuantities({});
    setMeasures({});
    setNotes('');
    // Intentionally not resetting hiddenProducts so user's preference stays during the session
  };

  const handleHideProduct = (productId: string) => {
    setHiddenProducts(prev => [...prev, productId]);
    setQuantities(prev => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  };

  const handleSubmitAll = async () => {
    const productionItems = Object.entries(quantities)
      .filter(([_, qty]) => qty && parseFloat(qty) > 0)
      .map(([productId, qty]) => ({
        productId,
        quantity: parseFloat(qty)
      }));

    if (productionItems.length === 0) {
      toast.error("Please enter at least one quantity");
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await addMultiProduction(productionItems, notes || undefined);
      if (success) {
        toast.success(`Successfully recorded ${productionItems.length} production items`);
        resetForm();
      }
    } catch (error) {
      toast.error("Failed to record production");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.price) return;
    addProduct({ name: newProduct.name, category: newProduct.category, price: parseFloat(newProduct.price), unit: newProduct.unit });
    setNewProduct({ name: '', category: 'Bread', price: '', unit: 'pc' });
    setShowAddProduct(false);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Daily Production</h1>
          <p className="text-sm text-muted-foreground">Record all items made in the factory today</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search products..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          {hiddenProducts.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setHiddenProducts([])} 
              className="text-muted-foreground"
              title="Restore hidden products"
            >
              <ListRestart className="h-4 w-4 md:mr-1" /> 
              <span className="hidden md:inline">Restore ({hiddenProducts.length})</span>
            </Button>
          )}
          
          <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm"><Plus className="h-4 w-4 mr-1" /> New Product</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add New Product</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Product Name</Label>
                  <Input value={newProduct.name} onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={newProduct.category} onValueChange={v => setNewProduct(p => ({ ...p, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['Bread', 'Pastry', 'Cake', 'Frozen', 'Munchies', 'Other'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Price (Rs.)</Label>
                    <Input type="number" value={newProduct.price} onChange={e => setNewProduct(p => ({ ...p, price: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Default Unit</Label>
                    <Select value={newProduct.unit} onValueChange={v => setNewProduct(p => ({ ...p, unit: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {MEASURES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleAddProduct} className="w-full mt-4">Add Product</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-primary/10 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 pb-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Factory className="h-5 w-5 text-primary" />
                Record Items
              </CardTitle>
              <CardDescription>Enter quantities for items produced today</CardDescription>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Input 
                placeholder="Batch notes (optional)..." 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-9 md:w-64"
              />
              <Button 
                onClick={handleSubmitAll} 
                className="gap-2" 
                disabled={isSubmitting}
              >
                {isSubmitting ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Submit All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20">
                  <TableHead className="w-[300px]">Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Unit / Measure</TableHead>
                  <TableHead className="text-right">Today's Quantity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                      No active products found.
                    </TableCell>
                  </TableRow>
                ) : (
                  activeProducts.map(product => (
                    <TableRow key={product.id} className="hover:bg-muted/10 transition-colors">
                      <TableCell className="font-medium">
                        <div>
                          {product.name}
                          <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                            Current Stock: {stock[product.id]?.production || 0} {product.unit}s
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal">{product.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={measures[product.id] || product.unit} 
                          onValueChange={(v) => handleMeasureChange(product.id, v)}
                        >
                          <SelectTrigger className="h-8 w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {MEASURES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Input 
                            type="number" 
                            min="0" 
                            placeholder="0"
                            className="h-8 w-24 text-right"
                            value={quantities[product.id] || ''}
                            onChange={(e) => handleQtyChange(product.id, e.target.value)}
                          />
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleHideProduct(product.id)}
                            title="Remove from today's list"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Production History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent Production Batches</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/10">
                  <TableHead className="w-24">Batch ID</TableHead>
                  <TableHead>Products Recorded</TableHead>
                  <TableHead>Total Items</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No production records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  [...batches].reverse().slice(0, 10).map(b => {
                    const itemDetails = b.items?.map(item => {
                      const product = getProductById(item.productId);
                      return `${product?.name || 'Unknown'} (${item.quantity})`;
                    }).join(', ') || '—';
                    
                    const totalQty = b.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;

                    return (
                      <TableRow key={b.id}>
                        <TableCell><Badge variant="outline" className="font-mono">{b.id.slice(-6).toUpperCase()}</Badge></TableCell>
                        <TableCell className="max-w-[400px]">
                          <div className="truncate text-xs" title={itemDetails}>
                            {itemDetails}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">{totalQty}</TableCell>
                        <TableCell>{b.date}</TableCell>
                        <TableCell className="text-muted-foreground italic text-xs">{b.notes || '—'}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <div className="fixed bottom-6 right-6 z-10 md:hidden">
        <Button onClick={handleSubmitAll} size="lg" className="rounded-full shadow-lg gap-2">
          <Save className="h-5 w-5" />
          Save Batch
        </Button>
      </div>
    </div>
  );
}
