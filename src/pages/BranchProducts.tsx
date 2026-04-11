import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PackageMinus, Settings2, Search } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function BranchProducts() {
  const { currentUser, selectedProfile, products, getBranchStock, adjustBranchStock } = useApp();

  if (!currentUser || !selectedProfile) return <Navigate to="/login" replace />;

  const [adjustQuantity, setAdjustQuantity] = useState('');
  const [adjustReason, setAdjustReason] = useState('Morning Check Adjust');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // We only show this for branch staff
  const isBranchStaff = selectedProfile.role === 'branch_staff';
  const targetBranch = selectedProfile.branchId as 'branch_1' | 'branch_2' | undefined;

  // If not branch staff, they shouldn't realistically use this page as it's scoped specifically for branch adjustments.
  // But we can fallback to branch_1 so it renders gracefully for admin preview.
  const branchView = targetBranch || 'branch_1';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  // Map to detailed product and group by category
  const groupedProducts = useMemo(() => {
    const groups: Record<string, any[]> = {};
    
    products.filter(p => p.isActive).forEach(product => {
      if (selectedCategory !== 'All' && product.category !== selectedCategory) return;
      if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase())) return;

      const category = product.category || 'Uncategorized';
      if (!groups[category]) groups[category] = [];
      
      const stockAmount = stock[product.id]?.[branchView] || 0;

      groups[category].push({
        productId: product.id,
        stock: stockAmount,
        productDetails: product
      });
    });
    
    return groups;
  }, [products, stock, branchView, selectedCategory, searchQuery]);

  const handleAdjust = () => {
    if (!selectedProductId || !adjustQuantity || parseFloat(adjustQuantity) <= 0) return;
    
    adjustBranchStock(
      selectedProductId, 
      branchView, 
      parseFloat(adjustQuantity), 
      adjustReason || 'Inventory Check'
    );
    
    setIsDialogOpen(false);
    setAdjustQuantity('');
    setSelectedProductId(null);
  };

  const openAdjustmentDialog = (productId: string) => {
    setSelectedProductId(productId);
    setAdjustQuantity('');
    setAdjustReason('Morning Check / Wastage');
    setIsDialogOpen(true);
  };

  if (!isBranchStaff && selectedProfile.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <Settings2 className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-bold">Access Restricted</h2>
        <p className="text-muted-foreground max-w-md">Only branch staff can perform morning stock adjustments.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Branch Products</h1>
          <p className="text-sm text-muted-foreground">
            Current stock received at {branchView === 'branch_1' ? 'Branch 1' : 'Branch 2'}. Adjust stock for wastage or counting errors.
          </p>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 mb-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search products..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 bg-background"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide items-center">
          {categories.map(c => (
            <Badge 
              key={c}
              variant={selectedCategory === c ? "default" : "outline"}
              className="cursor-pointer whitespace-nowrap bg-background"
              onClick={() => setSelectedCategory(c)}
            >
              {c}
            </Badge>
          ))}
        </div>
      </div>

      {Object.keys(groupedProducts).length === 0 ? (
        <Card className="border-border/50 bg-muted/20">
          <CardContent className="py-12 flex flex-col items-center justify-center text-center">
            <PackageMinus className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Products Available</h3>
            <p className="text-muted-foreground max-w-sm">
              There are currently no products in stock at your branch. Products dispatched from production will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedProducts).map(([category, items]) => (
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
                  <Card key={item.productId} className="overflow-hidden border-border/50 hover:border-primary/20 transition-all shadow-sm">
                    <CardHeader className="bg-muted/30 p-4 pb-3 border-b border-border/50">
                      <div className="flex justify-between items-start gap-2">
                        <CardTitle className="text-sm font-semibold truncate" title={item.productDetails.name}>
                          {item.productDetails.name}
                        </CardTitle>
                        <Badge variant="secondary" className="font-mono text-[10px] uppercase font-bold tracking-tight bg-background">
                          {item.stock} {item.productDetails.unit}s
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 bg-card flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        Price: Rs. {item.productDetails.price.toFixed(2)}
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 text-xs font-semibold text-destructive/80 hover:text-destructive border-destructive/20 hover:bg-destructive/5"
                        onClick={() => openAdjustmentDialog(item.productId)}
                      >
                        Adjust
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Adjustment Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Adjust Branch Stock</DialogTitle>
            <CardDescription>
              Minus items that are missing, damaged, or wasted during the morning check.
            </CardDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Quantity to Minus</Label>
              <Input 
                type="number" 
                min="0.1" 
                step="1"
                placeholder="e.g. 2"
                value={adjustQuantity}
                onChange={(e) => setAdjustQuantity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Input 
                placeholder="Reason (e.g. damaged, expired)"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
              />
            </div>
            <Button 
              className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground mt-4" 
              onClick={handleAdjust}
              disabled={!adjustQuantity || parseFloat(adjustQuantity) <= 0}
            >
              Confirm Reduction
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
