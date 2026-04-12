import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Settings2, Save, X, Search } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function ProductionStock() {
  const { currentUser, selectedProfile, products, getProductionStock, updateProduct, addProduction } = useApp();

  if (!currentUser || !selectedProfile) return <Navigate to="/login" replace />;

  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  
  // Form state
  const [editPrice, setEditPrice] = useState('');
  const [editStock, setEditStock] = useState('');
  const [adjustReason, setAdjustReason] = useState('Stock Correction');

  // Verify access privileges
  const isAuthorized = selectedProfile.role === 'production_manager' || selectedProfile.role === 'admin';

  // Get current production stock
  const productionStockItems = getProductionStock();

  // Map products and group them with their stock amounts
  // We want to list ALL products so we can manage them, even if stock is 0
  const groupedProducts = useMemo(() => {
    const groups: Record<string, any[]> = {};
    
    // Filter by search
    const filteredProducts = products.filter(p => 
      p.isActive && p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filteredProducts.forEach(product => {
      const category = product.category || 'Uncategorized';
      if (!groups[category]) groups[category] = [];
      
      const stockItem = productionStockItems.find(s => s.productId === product.id);
      
      groups[category].push({
        ...product,
        currentStock: stockItem ? stockItem.stock : 0
      });
    });
    
    return groups;
  }, [products, productionStockItems, searchTerm]);

  const openAdjustmentDialog = (productId: string, currentPrice: number, currentStock: number) => {
    setSelectedProductId(productId);
    setEditPrice(currentPrice.toString());
    setEditStock(currentStock.toString());
    setAdjustReason('Stock Correction');
    setIsDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedProductId) return;

    const product = products.find(p => p.id === selectedProductId);
    const stockItem = productionStockItems.find(s => s.productId === selectedProductId);
    const currentStock = stockItem ? stockItem.stock : 0;
    
    const newPrice = parseFloat(editPrice);
    const newStock = parseFloat(editStock);

    if (isNaN(newPrice) || newPrice < 0) return;
    if (isNaN(newStock) || newStock < 0) return;

    // 1. Update Price
    if (newPrice !== product?.price) {
      await updateProduct(selectedProductId, { price: newPrice });
    }

    // 2. Update Stock (By adding a positive or negative adjustment)
    if (newStock !== currentStock) {
      const difference = newStock - currentStock;
      addProduction(selectedProductId, difference, adjustReason || 'Inventory Adjustment');
    }

    setIsDialogOpen(false);
    setSelectedProductId(null);
  };

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <Settings2 className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-bold">Access Restricted</h2>
        <p className="text-muted-foreground max-w-md">Only production managers and admins can manage central stock and product prices.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Stock & Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage factory stock quantities and product pricing.
          </p>
        </div>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search products..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 w-full bg-background"
          />
        </div>
      </div>

      <div className="space-y-8">
        {Object.entries(groupedProducts).length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
            No active products found matching your search.
          </div>
        ) : (
          Object.entries(groupedProducts).map(([category, items]) => (
            <div key={category} className="space-y-3">
              <h2 className="text-lg font-bold flex items-center gap-2 pb-2 border-b">
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                  {category}
                </Badge>
                <span className="text-muted-foreground text-sm font-normal">
                  ({items.length} items)
                </span>
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {items.map(item => (
                  <Card key={item.id} className="overflow-hidden border-border/50 hover:border-primary/20 transition-all shadow-sm">
                    <CardHeader className="bg-muted/30 p-4 pb-3 border-b border-border/50">
                      <div className="flex justify-between items-start gap-2">
                        <CardTitle className="text-sm font-semibold truncate" title={item.name}>
                          {item.name}
                        </CardTitle>
                        <Badge 
                          variant={item.currentStock > 0 ? "secondary" : "destructive"} 
                          className="font-mono text-[10px] uppercase font-bold tracking-tight"
                        >
                          {item.currentStock} {item.unit}s
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 bg-card flex flex-col gap-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Price:</span>
                        <span className="font-semibold">Rs. {item.price.toFixed(2)}</span>
                      </div>
                      <Button 
                        size="sm" 
                        variant="slate" 
                        className="w-full text-xs font-semibold"
                        onClick={() => openAdjustmentDialog(item.id, item.price, item.currentStock)}
                      >
                        <Settings2 className="w-3 h-3 mr-2" />
                        Manage Product
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Editing Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Update Product Details</DialogTitle>
            <CardDescription>
              Adjust current factory stock count and update pricing.
            </CardDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Product Price (Rs.)</Label>
              <Input 
                type="number" 
                min="0" 
                step="0.01"
                placeholder="e.g. 500"
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Actual Factory Stock Count</Label>
              <Input 
                type="number" 
                min="0" 
                step="1"
                placeholder="e.g. 150"
                value={editStock}
                onChange={(e) => setEditStock(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Enter the exact amount of items currently in the factory. The system will auto-calculate the adjustment difference.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Correction Reason</Label>
              <Input 
                placeholder="e.g. Damage, Morning Count, Expiry"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 mt-6">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setIsDialogOpen(false)}
              >
                <X className="w-4 h-4 mr-2" /> Cancel
              </Button>
              <Button 
                className="flex-1" 
                onClick={handleUpdate}
                disabled={!editPrice || !editStock}
              >
                <Save className="w-4 h-4 mr-2" /> Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
