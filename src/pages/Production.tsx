import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Factory } from 'lucide-react';
import { Navigate } from 'react-router-dom';

export default function Production() {
  const { currentUser, products, batches, addProduction, addProduct, getProductById, stock } = useApp();

  if (!currentUser) return <Navigate to="/login" replace />;
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', category: 'Bread', price: '', unit: 'piece' });

  const handleAddProduction = async () => {
    if (!selectedProduct || !quantity || parseInt(quantity) <= 0) return;
    const success = await addProduction(selectedProduct, parseInt(quantity), notes || undefined);
    if (success) {
      setQuantity('');
      setNotes('');
      setSelectedProduct('');
    }
  };

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.price) return;
    addProduct({ name: newProduct.name, category: newProduct.category, price: parseFloat(newProduct.price), unit: newProduct.unit });
    setNewProduct({ name: '', category: 'Bread', price: '', unit: 'piece' });
    setShowAddProduct(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Production</h1>
          <p className="text-sm text-muted-foreground">Record production batches</p>
        </div>
        <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm"><Plus className="h-4 w-4 mr-1" /> New Product</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add New Product</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Name</Label><Input value={newProduct.name} onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))} /></div>
              <div><Label>Category</Label>
                <Select value={newProduct.category} onValueChange={v => setNewProduct(p => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Bread', 'Pastry', 'Cake', 'Other'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Price ($)</Label><Input type="number" value={newProduct.price} onChange={e => setNewProduct(p => ({ ...p, price: e.target.value }))} /></div>
              <Button onClick={handleAddProduct} className="w-full">Add Product</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Add Production Form */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Factory className="h-4 w-4" /> Record Production</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <Label>Product</Label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                <SelectContent>
                  {products.filter(p => p.isActive).map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Quantity</Label>
              <Input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="e.g. 500" />
            </div>
            <div>
              <Label>Notes</Label>
              <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional" />
            </div>
            <div className="flex items-end">
              <Button onClick={handleAddProduction} className="w-full" disabled={!selectedProduct || !quantity}>
                Add Production
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Production History */}
      <Card>
        <CardHeader><CardTitle className="text-base">Production History</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch ID</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...batches].reverse().map(b => {
                const product = getProductById(b.productId);
                return (
                  <TableRow key={b.id}>
                    <TableCell><Badge variant="outline">{b.batchId}</Badge></TableCell>
                    <TableCell className="font-medium">{product?.name}</TableCell>
                    <TableCell>{b.quantity}</TableCell>
                    <TableCell>{b.date}</TableCell>
                    <TableCell>{stock[b.productId]?.production || 0}</TableCell>
                    <TableCell className="text-muted-foreground">{b.notes || '—'}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
