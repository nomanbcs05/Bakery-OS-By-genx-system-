import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Settings2, Save, X, Search, Image as ImageIcon, Plus, Trash2, LayoutGrid, PackageOpen } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ProductionStock() {
  const { currentUser, selectedProfile, products, getProductionStock, updateProduct, addProduction, addProduct, deleteProduct } = useApp();

  if (!currentUser || !selectedProfile) return <Navigate to="/login" replace />;

  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  
  // Form state (Edit)
  const [editPrice, setEditPrice] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [adjustReason, setAdjustReason] = useState('Stock Correction');

  // New Product Form state
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: '',
    price: '',
    unit: 'pc',
    imageUrl: '',
    description: ''
  });

  const categoriesList = useMemo(() => {
    return Array.from(new Set(products.map(p => p.category))).filter(Boolean);
  }, [products]);

  // Verify access privileges
  const isAuthorized = selectedProfile.role === 'production_manager' || selectedProfile.role === 'admin';

  // Get current production stock
  const productionStockItems = getProductionStock();

  // Map products and group them with their stock amounts
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

  const openAdjustmentDialog = (productId: string, currentPrice: number, currentStock: number, imageUrl?: string, description?: string) => {
    setSelectedProductId(productId);
    setEditPrice(currentPrice.toString());
    setEditStock(currentStock.toString());
    setEditImageUrl(imageUrl || '');
    setEditDescription(description || '');
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

    // 1. Update Product Details
    await updateProduct(selectedProductId, { 
      price: newPrice,
      imageUrl: editImageUrl,
      description: editDescription
    });

    // 2. Update Stock (By adding a positive or negative adjustment)
    if (newStock !== currentStock) {
      const difference = newStock - currentStock;
      addProduction(selectedProductId, difference, adjustReason || 'Inventory Adjustment');
    }

    setIsDialogOpen(false);
    setSelectedProductId(null);
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.category || !newProduct.price) return;
    
    await addProduct({
      name: newProduct.name,
      category: newProduct.category,
      price: parseFloat(newProduct.price),
      unit: newProduct.unit,
      imageUrl: newProduct.imageUrl,
      description: newProduct.description
    });
    
    setIsAddDialogOpen(false);
    setNewProduct({
      name: '',
      category: '',
      price: '',
      unit: 'pc',
      imageUrl: '',
      description: ''
    });
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
    <div className="space-y-6 animate-fade-in pb-10 px-4 lg:px-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Stock & Master Inventory</h1>
          <p className="text-sm text-slate-500 font-medium">
            Configure product metadata, pricing and factory stock counts.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search products..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full bg-white border-slate-200 rounded-xl"
            />
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl bg-primary hover:bg-primary/95 shadow-lg shadow-orange-100 font-bold flex items-center gap-2">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Product</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none rounded-[32px]">
              <div className="bg-slate-900 p-6 text-white">
                <DialogTitle className="text-xl font-black">New Product Entry</DialogTitle>
                <p className="text-slate-400 text-xs font-medium mt-1">Initialize a new item into your master inventory</p>
              </div>
              
              <div className="p-6 space-y-4">
                 <div className="space-y-1.5">
                   <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Product Name</Label>
                   <Input 
                     className="h-11 rounded-xl border-slate-200" 
                     placeholder="e.g. Chocolate Fudge Cake"
                     value={newProduct.name}
                     onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                   />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Category</Label>
                      <Select value={newProduct.category} onValueChange={v => setNewProduct({...newProduct, category: v})}>
                        <SelectTrigger className="h-11 rounded-xl border-slate-200">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {categoriesList.map(c => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                          <SelectItem value="Cakes">Cakes</SelectItem>
                          <SelectItem value="Biscuits">Biscuits</SelectItem>
                          <SelectItem value="Pastries">Pastries</SelectItem>
                          <SelectItem value="Frozen">Frozen</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Price (Rs.)</Label>
                      <Input 
                        type="number" 
                        className="h-11 rounded-xl border-slate-200 font-bold text-primary" 
                        placeholder="0.00"
                        value={newProduct.price}
                        onChange={e => setNewProduct({...newProduct, price: e.target.value})}
                      />
                    </div>
                 </div>

                 <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Image URL</Label>
                    <Input 
                      className="h-11 rounded-xl border-slate-200" 
                      placeholder="https://..."
                      value={newProduct.imageUrl}
                      onChange={e => setNewProduct({...newProduct, imageUrl: e.target.value})}
                    />
                 </div>

                 <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Description</Label>
                    <Textarea 
                      className="rounded-xl border-slate-200 min-h-[80px]" 
                      placeholder="Product details..."
                      value={newProduct.description}
                      onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                    />
                 </div>

                 <Button 
                   onClick={handleAddProduct}
                   className="w-full h-12 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold mt-2"
                   disabled={!newProduct.name || !newProduct.category || !newProduct.price}
                 >
                   Create Product Instance
                 </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="space-y-10">
        {Object.entries(groupedProducts).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white border border-dashed border-slate-200 rounded-[32px] text-slate-400 gap-4">
            <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center">
               <PackageOpen className="h-8 w-8 text-slate-200" />
            </div>
            <p className="font-bold text-sm tracking-tight">No active products found matching your search.</p>
          </div>
        ) : (
          Object.entries(groupedProducts).map(([category, items]) => (
            <div key={category} className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge className="bg-primary/10 text-primary border-none text-[10px] font-black uppercase tracking-widest px-3 py-1">
                  {category}
                </Badge>
                <div className="h-[1px] flex-1 bg-slate-100" />
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                  {items.length} SKUs
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {items.map(item => (
                  <Card key={item.id} className="group overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-300 rounded-[28px] bg-white">
                    <div className="aspect-[4/3] bg-slate-50 relative overflow-hidden">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-200">
                          <ImageIcon className="h-12 w-12" />
                        </div>
                      )}
                      <div className="absolute top-3 right-3 flex flex-col gap-2">
                        <Badge className={`border-none shadow-lg text-[10px] font-black uppercase px-2 py-0.5 ${item.currentStock > 0 ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                           {item.currentStock} {item.unit}
                        </Badge>
                      </div>
                    </div>
                    <CardHeader className="p-5 pb-2">
                       <CardTitle className="text-sm font-bold text-slate-800 truncate" title={item.name}>
                         {item.name}
                       </CardTitle>
                       <p className="text-[10px] text-slate-400 font-medium line-clamp-1">{item.description || "No description provided."}</p>
                    </CardHeader>
                    <CardContent className="p-5 pt-3 flex flex-col gap-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Pricing</span>
                        <span className="font-black text-primary text-sm">Rs. {item.price.toLocaleString()}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="secondary" 
                          className="flex-1 h-10 rounded-xl text-[11px] font-bold uppercase tracking-wider bg-slate-50 hover:bg-primary hover:text-white border-none transition-colors"
                          onClick={() => openAdjustmentDialog(item.id, item.price, item.currentStock, item.imageUrl, item.description)}
                        >
                          <Settings2 className="w-3.5 h-3.5 mr-2" />
                          Config
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-10 w-10 text-red-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                          onClick={() => confirm(`Delete ${item.name}?`) && deleteProduct(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
        <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none rounded-[32px]">
          <div className="bg-primary p-6 text-white">
            <DialogTitle className="text-xl font-black">Product Customizer</DialogTitle>
            <p className="text-white/70 text-xs font-medium mt-1">Update visual identity and operational metrics</p>
          </div>
          
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Price (Rs.)</Label>
                <Input 
                  type="number" 
                  className="h-11 rounded-xl border-slate-200 focus:ring-primary/20"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                />
              </div>
              
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Physical Stock</Label>
                <Input 
                  type="number" 
                  className="h-11 rounded-xl border-slate-200 focus:ring-primary/20"
                  value={editStock}
                  onChange={(e) => setEditStock(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Product Description</Label>
              <Textarea 
                placeholder="Describe the item flavor, weight, ingredients..."
                className="rounded-xl border-slate-200 min-h-[80px]"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Display Image (URL)</Label>
              <div className="relative">
                <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="https://images.unsplash.com/..."
                  className="pl-10 h-11 rounded-xl border-slate-200"
                  value={editImageUrl}
                  onChange={(e) => setEditImageUrl(e.target.value)}
                />
              </div>
              <p className="text-[9px] text-slate-400 font-medium italic ml-1">Paste a direct image link from Unsplash, Google or Supabase Storage.</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Adjustment Reason</Label>
              <Input 
                placeholder="Reason for stock correction..."
                className="h-10 rounded-lg border-slate-100 bg-slate-50 text-xs"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 mt-4">
              <Button 
                variant="ghost" 
                className="flex-1 rounded-xl h-11 font-bold text-slate-400"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                className="flex-[2] rounded-xl h-11 bg-primary hover:bg-primary/95 font-bold shadow-lg shadow-orange-100" 
                onClick={handleUpdate}
                disabled={!editPrice || !editStock}
              >
                <Save className="w-4 h-4 mr-2" /> Commit Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
