import { useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Package } from 'lucide-react';
import { Navigate } from 'react-router-dom';

export default function Inventory() {
  const { currentUser, getInventorySnapshots, getProductById, loadModuleData } = useApp();

  useEffect(() => {
    loadModuleData('inventory');
    loadModuleData('sales');
  }, [loadModuleData]);

  if (!currentUser) return <Navigate to="/login" replace />;
  const snapshots = getInventorySnapshots();

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
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
