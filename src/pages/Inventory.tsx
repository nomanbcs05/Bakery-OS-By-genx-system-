import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Package, Pencil } from 'lucide-react';
import { Navigate } from 'react-router-dom';

export default function Inventory() {
  const { currentUser, getInventorySnapshots, getProductById, loadModuleData, adjustBranchStock, stock } = useApp();

  useEffect(() => {
    loadModuleData('inventory');
    loadModuleData('sales');
  }, [loadModuleData]);

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editProductId, setEditProductId] = useState<string | null>(null);
  const [factoryVal, setFactoryVal] = useState('');
  const [branch1Val, setBranch1Val] = useState('');
  const [branch2Val, setBranch2Val] = useState('');
  const [reason, setReason] = useState('Manual Inventory Adjustment');

  if (!currentUser) return <Navigate to="/login" replace />;
  const snapshots = getInventorySnapshots();

  const openEditDialog = (productId: string) => {
    const s = stock[productId];
    if (!s) return;
    setEditProductId(productId);
    setFactoryVal(String(s.production));
    setBranch1Val(String(s.branch_1));
    setBranch2Val(String(s.branch_2));
    setReason('Manual Inventory Adjustment');
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!editProductId) return;
    const s = stock[editProductId];
    if (!s) return;

    const newFactory = parseFloat(factoryVal);
    const newBranch1 = parseFloat(branch1Val);
    const newBranch2 = parseFloat(branch2Val);

    // Delta = current - target (positive delta = reduction, negative delta = increase)
    // Because stock computation does: stock -= adjustment.quantity
    const factoryDelta = s.production - newFactory;
    const branch1Delta = s.branch_1 - newBranch1;
    const branch2Delta = s.branch_2 - newBranch2;

    const adjustmentReason = reason || 'Manual Inventory Adjustment';
    const timestamp = Date.now();

    if (factoryDelta !== 0 && !isNaN(newFactory)) {
      adjustBranchStock(editProductId, 'factory', factoryDelta, adjustmentReason);
    }
    // Slight delay to ensure unique IDs
    setTimeout(() => {
      if (branch1Delta !== 0 && !isNaN(newBranch1)) {
        adjustBranchStock(editProductId!, 'branch_1', branch1Delta, adjustmentReason);
      }
    }, 10);
    setTimeout(() => {
      if (branch2Delta !== 0 && !isNaN(newBranch2)) {
        adjustBranchStock(editProductId!, 'branch_2', branch2Delta, adjustmentReason);
      }
    }, 20);

    setIsDialogOpen(false);
    setEditProductId(null);
  };

  const editProduct = editProductId ? getProductById(editProductId) : null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Inventory</h1>
        <p className="text-sm text-muted-foreground">Complete stock tracking across production and branches</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Package className="h-4 w-4" /> Stock Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Total Produced</TableHead>
                  <TableHead className="text-right">Total Dispatched</TableHead>
                  <TableHead className="text-right">Total Sold</TableHead>
                  <TableHead className="text-right">Factory Stock</TableHead>
                  <TableHead className="text-right">Branch 1</TableHead>
                  <TableHead className="text-right">Branch 2</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {snapshots.map(s => {
                  const product = getProductById(s.productId);
                  const totalRemaining = s.productionStock + s.branch1Stock + s.branch2Stock;
                  return (
                    <TableRow key={s.productId}>
                      <TableCell className="font-medium">{product?.name}</TableCell>
                      <TableCell className="text-right">{s.totalProduced}</TableCell>
                      <TableCell className="text-right">{s.totalDispatched}</TableCell>
                      <TableCell className="text-right">{s.totalSold}</TableCell>
                      <TableCell className="text-right font-semibold">{s.productionStock}</TableCell>
                      <TableCell className="text-right">{s.branch1Stock}</TableCell>
                      <TableCell className="text-right">{s.branch2Stock}</TableCell>
                      <TableCell>
                        {totalRemaining === 0 ? (
                          <Badge variant="destructive">Out of Stock</Badge>
                        ) : totalRemaining < 20 ? (
                          <Badge className="bg-warning text-warning-foreground">Low</Badge>
                        ) : (
                          <Badge className="bg-success text-success-foreground">OK</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => openEditDialog(s.productId)}
                          className="gap-1"
                        >
                          <Pencil className="h-3 w-3" />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Stock Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Edit Stock — {editProduct?.name}</DialogTitle>
            <CardDescription>
              Set the correct stock values. Changes are recorded as adjustments.
            </CardDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Factory Stock</Label>
              <Input
                type="number"
                step="1"
                value={factoryVal}
                onChange={(e) => setFactoryVal(e.target.value)}
                placeholder="Factory stock quantity"
              />
            </div>
            <div className="space-y-2">
              <Label>Branch 1 Stock</Label>
              <Input
                type="number"
                step="1"
                value={branch1Val}
                onChange={(e) => setBranch1Val(e.target.value)}
                placeholder="Branch 1 stock quantity"
              />
            </div>
            <div className="space-y-2">
              <Label>Branch 2 Stock</Label>
              <Input
                type="number"
                step="1"
                value={branch2Val}
                onChange={(e) => setBranch2Val(e.target.value)}
                placeholder="Branch 2 stock quantity"
              />
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Input
                placeholder="Reason for adjustment"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            <Button
              className="w-full mt-4"
              onClick={handleSave}
              disabled={factoryVal === '' && branch1Val === '' && branch2Val === ''}
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
