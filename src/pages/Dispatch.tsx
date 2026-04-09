import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Truck, Plus, Trash2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { DispatchDestination, DispatchItem } from '@/types';
import { Navigate } from 'react-router-dom';

export default function DispatchPage() {
  const { currentUser, products, stock, createDispatch, dispatches, getProductById } = useApp();

  if (!currentUser) return <Navigate to="/login" replace />;
  const [destination, setDestination] = useState<DispatchDestination | ''>('');
  const [items, setItems] = useState<DispatchItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [qty, setQty] = useState('');

  const addItem = () => {
    if (!selectedProduct || !qty || parseInt(qty) <= 0) return;
    const existing = items.find(i => i.productId === selectedProduct);
    if (existing) {
      setItems(items.map(i => i.productId === selectedProduct ? { ...i, quantity: i.quantity + parseInt(qty) } : i));
    } else {
      setItems([...items, { productId: selectedProduct, quantity: parseInt(qty) }]);
    }
    setSelectedProduct('');
    setQty('');
  };

  const removeItem = (productId: string) => setItems(items.filter(i => i.productId !== productId));

  const handleDispatch = () => {
    if (!destination || items.length === 0) return;
    const success = createDispatch(destination, items);
    if (success) {
      setItems([]);
      setDestination('');
    }
  };

  const availableProducts = products.filter(p => (stock[p.id]?.production || 0) > 0);

  const destLabels: Record<string, string> = { branch_1: 'Branch 1', branch_2: 'Branch 2', walkin: 'Walk-in (Factory)' };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dispatch</h1>
        <p className="text-sm text-muted-foreground">Send products to branches or walk-in sales</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Truck className="h-4 w-4" /> New Dispatch</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Destination</Label>
            <Select value={destination} onValueChange={v => setDestination(v as DispatchDestination)}>
              <SelectTrigger><SelectValue placeholder="Select destination" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="branch_1">Branch 1</SelectItem>
                <SelectItem value="branch_2">Branch 2</SelectItem>
                <SelectItem value="walkin">Walk-in (Factory Gate Sale)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label>Product</Label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                <SelectContent>
                  {availableProducts.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name} ({stock[p.id]?.production} avail)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Quantity</Label>
              <Input type="number" min="1" max={stock[selectedProduct]?.production || 999} value={qty} onChange={e => setQty(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={addItem} disabled={!selectedProduct || !qty}><Plus className="h-4 w-4 mr-1" /> Add</Button>
            </div>
          </div>

          {items.length > 0 && (
            <div className="space-y-2">
              <Label>Items to dispatch:</Label>
              {items.map(item => {
                const p = getProductById(item.productId);
                const available = stock[item.productId]?.production || 0;
                const overStock = item.quantity > available;
                return (
                  <div key={item.productId} className={`flex items-center justify-between p-3 rounded-lg border ${overStock ? 'border-destructive bg-destructive/5' : 'border-border'}`}>
                    <div>
                      <span className="font-medium">{p?.name}</span>
                      <span className="text-muted-foreground ml-2">× {item.quantity}</span>
                      {overStock && <span className="text-destructive text-xs ml-2">(only {available} available!)</span>}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeItem(item.productId)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                );
              })}
            </div>
          )}

          {destination === 'walkin' && items.length > 0 && (
            <Alert><AlertCircle className="h-4 w-4" /><AlertDescription>Walk-in dispatch will automatically record as a factory gate sale.</AlertDescription></Alert>
          )}

          <Button onClick={handleDispatch} disabled={!destination || items.length === 0} className="w-full sm:w-auto">
            Confirm Dispatch
          </Button>
        </CardContent>
      </Card>

      {/* Dispatch History */}
      <Card>
        <CardHeader><CardTitle className="text-base">Dispatch History</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...dispatches].reverse().map(d => (
                <TableRow key={d.id}>
                  <TableCell>{d.date}</TableCell>
                  <TableCell><Badge variant="secondary">{destLabels[d.destination]}</Badge></TableCell>
                  <TableCell>
                    {d.items.map(i => {
                      const p = getProductById(i.productId);
                      return <div key={i.productId} className="text-sm">{p?.name} × {i.quantity}</div>;
                    })}
                  </TableCell>
                  <TableCell><Badge className="bg-success text-success-foreground">{d.status}</Badge></TableCell>
                </TableRow>
              ))}
              {dispatches.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No dispatches yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
