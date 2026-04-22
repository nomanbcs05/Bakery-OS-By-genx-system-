import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Package, 
  Plus, 
  Minus, 
  AlertTriangle, 
  History, 
  ArrowUpRight, 
  ArrowDownRight,
  Search,
  Filter,
  Trash2,
  Edit2,
  X
} from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function RawMaterialStock() {
  const { 
    currentUser, 
    rawMaterials, 
    rawMaterialAdjustments,
    addRawMaterial, 
    updateRawMaterial, 
    deleteRawMaterial, 
    adjustRawMaterialStock 
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Form states
  const [newMaterial, setNewMaterial] = useState({
    name: '',
    category: 'Dry',
    unit: 'kg',
    minStockLevel: 0,
    costPerUnit: 0,
    supplierName: ''
  });

  const [isCustomCategory, setIsCustomCategory] = useState(false);
  
  const [adjustment, setAdjustment] = useState({
    materialId: '',
    type: 'in' as 'in' | 'out',
    quantity: 0,
    reason: ''
  });

  if (!currentUser) return <Navigate to="/login" replace />;

  const filteredMaterials = rawMaterials.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || m.category === categoryFilter;
    return matchesSearch && matchesCategory && m.isActive;
  });

  const lowStockItems = rawMaterials.filter(m => m.isActive && m.currentStock <= m.minStockLevel);
  const categories = Array.from(new Set(rawMaterials.map(m => m.category)));

  const handleAddMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaterial.name) return toast.error("Material name is required");
    addRawMaterial(newMaterial);
    setIsCustomCategory(false);
    setNewMaterial({
      name: '',
      category: 'Dry',
      unit: 'kg',
      minStockLevel: 0,
      costPerUnit: 0,
      supplierName: ''
    });
  };

  const handleAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustment.materialId) return toast.error("Please select a material");
    if (adjustment.quantity <= 0) return toast.error("Quantity must be greater than 0");
    
    const success = await adjustRawMaterialStock(
      adjustment.materialId,
      adjustment.type,
      adjustment.quantity,
      adjustment.reason
    );

    if (success) {
      setAdjustment({
        materialId: '',
        type: 'in',
        quantity: 0,
        reason: ''
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Raw Material Management</h1>
          <p className="text-sm text-muted-foreground">Monitor and manage your bakery's core ingredients</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1 bg-card border-primary/20 text-primary flex items-center gap-2">
            <Package className="h-4 w-4" />
            Total Items: {rawMaterials.filter(m => m.isActive).length}
          </Badge>
          {lowStockItems.length > 0 && (
            <Badge variant="destructive" className="px-3 py-1 flex items-center gap-2 animate-pulse">
              <AlertTriangle className="h-4 w-4" />
              Low Stock: {lowStockItems.length}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Forms */}
        <div className="space-y-6">
          <Card className="border-primary/10 shadow-sm overflow-hidden">
            <div className="h-1 bg-primary w-full" />
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="h-4 w-4 text-primary" />
                Quick Add Material
              </CardTitle>
              <CardDescription>Add a new ingredient to your database</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddMaterial} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Material Name</Label>
                  <Input 
                    id="name" 
                    placeholder="e.g. Bread Flour" 
                    value={newMaterial.name}
                    onChange={e => setNewMaterial({...newMaterial, name: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    {isCustomCategory ? (
                      <div className="flex gap-2">
                        <Input 
                          id="category"
                          placeholder="Enter category..." 
                          value={newMaterial.category}
                          onChange={e => setNewMaterial({...newMaterial, category: e.target.value})}
                          autoFocus
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="icon" 
                          className="shrink-0"
                          onClick={() => {
                            setIsCustomCategory(false);
                            setNewMaterial({...newMaterial, category: 'Dry'});
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Select 
                        value={newMaterial.category} 
                        onValueChange={v => {
                          if (v === 'new') {
                            setIsCustomCategory(true);
                            setNewMaterial({...newMaterial, category: ''});
                          } else {
                            setNewMaterial({...newMaterial, category: v});
                          }
                        }}
                      >
                        <SelectTrigger id="category">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from(new Set(['Dry', 'Dairy', 'Liquid', 'Cold', 'Other', ...categories])).map(cat => (
                            <SelectItem key={cat} value={cat}>
                              {cat === 'Dry' ? 'Dry Goods' : cat === 'Cold' ? 'Cold Storage' : cat}
                            </SelectItem>
                          ))}
                          <SelectItem value="new" className="text-primary font-medium border-t mt-1">
                            + Add New Category
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">Base Unit</Label>
                    <Select value={newMaterial.unit} onValueChange={v => setNewMaterial({...newMaterial, unit: v})}>
                      <SelectTrigger id="unit">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">kilograms (kg)</SelectItem>
                        <SelectItem value="grams">grams (g)</SelectItem>
                        <SelectItem value="liters">liters (L)</SelectItem>
                        <SelectItem value="pcs">pieces (pcs)</SelectItem>
                        <SelectItem value="bags">bags</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minStock">Min. Level</Label>
                    <Input 
                      id="minStock" 
                      type="number" 
                      value={newMaterial.minStockLevel}
                      onChange={e => setNewMaterial({...newMaterial, minStockLevel: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cost">Cost/Unit</Label>
                    <Input 
                      id="cost" 
                      type="number" 
                      value={newMaterial.costPerUnit}
                      onChange={e => setNewMaterial({...newMaterial, costPerUnit: parseFloat(e.target.value)})}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" /> Add Material
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-info/10 shadow-sm overflow-hidden">
            <div className="h-1 bg-info w-full" />
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="h-4 w-4 text-info" />
                Stock Adjustment
              </CardTitle>
              <CardDescription>Manually update inventory levels</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAdjustment} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="adj-material">Select Material</Label>
                  <Select value={adjustment.materialId} onValueChange={v => setAdjustment({...adjustment, materialId: v})}>
                    <SelectTrigger id="adj-material">
                      <SelectValue placeholder="Choose a material..." />
                    </SelectTrigger>
                    <SelectContent>
                      {rawMaterials.filter(m => m.isActive).map(m => (
                        <SelectItem key={m.id} value={m.id}>{m.name} ({m.currentStock} {m.unit})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Tabs value={adjustment.type} onValueChange={(v: any) => setAdjustment({...adjustment, type: v})} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="in" className="flex items-center gap-2">
                      <ArrowUpRight className="h-4 w-4 text-success" /> Stock IN
                    </TabsTrigger>
                    <TabsTrigger value="out" className="flex items-center gap-2">
                      <ArrowDownRight className="h-4 w-4 text-destructive" /> Stock OUT
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="space-y-2">
                  <Label htmlFor="adj-qty">Quantity</Label>
                  <Input 
                    id="adj-qty" 
                    type="number" 
                    placeholder="Enter amount..."
                    value={adjustment.quantity || ''}
                    onChange={e => setAdjustment({...adjustment, quantity: parseFloat(e.target.value)})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adj-reason">Reason / Note</Label>
                  <Input 
                    id="adj-reason" 
                    placeholder="e.g. Weekly restock, Production use"
                    value={adjustment.reason}
                    onChange={e => setAdjustment({...adjustment, reason: e.target.value})}
                  />
                </div>

                <Button 
                  type="submit" 
                  variant={adjustment.type === 'in' ? 'default' : 'destructive'} 
                  className="w-full"
                >
                  {adjustment.type === 'in' ? <Plus className="h-4 w-4 mr-2" /> : <Minus className="h-4 w-4 mr-2" />}
                  {adjustment.type === 'in' ? 'Add to Stock' : 'Remove from Stock'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Table */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <div>
                <CardTitle className="text-xl font-bold">Live Inventory</CardTitle>
                <CardDescription>Current status of all raw materials</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative w-48 hidden sm:block">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    className="pl-9 h-9"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-32 h-9">
                    <Filter className="h-3 w-3 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-[200px]">Material</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Current Stock</TableHead>
                      <TableHead className="text-right">Min. Level</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMaterials.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground font-medium">
                          No materials found matching your criteria.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredMaterials.map((m) => {
                        const isLow = m.currentStock <= m.minStockLevel;
                        return (
                          <TableRow key={m.id} className={isLow ? "bg-destructive/5" : ""}>
                            <TableCell className="font-semibold py-4">
                              <div className="flex flex-col">
                                {m.name}
                                <span className="text-[10px] text-muted-foreground uppercase tracking-tight">ID: {m.id}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-normal text-[11px] bg-muted/30">
                                {m.category}
                              </Badge>
                            </TableCell>
                            <TableCell className={`text-right font-mono font-bold ${isLow ? "text-destructive" : "text-primary"}`}>
                              {m.currentStock} {m.unit}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground font-mono">
                              {m.minStockLevel} {m.unit}
                            </TableCell>
                            <TableCell className="text-center">
                              {isLow ? (
                                <Badge variant="destructive" className="text-[10px] px-2 h-5">
                                  LOW STOCK
                                </Badge>
                              ) : (
                                <Badge className="bg-success text-success-foreground hover:bg-success text-[10px] px-2 h-5">
                                  OPTIMAL
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                                  <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  onClick={() => deleteRawMaterial(m.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Recent History Log Snippet */}
          <Card className="border-border/50 shadow-sm opacity-80 backdrop-blur-sm">
            <CardHeader className="py-4">
              <CardTitle className="text-base flex items-center gap-2 font-semibold">
                <History className="h-4 w-4" /> Recent Activities
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="space-y-3">
                {rawMaterialAdjustments.slice(-5).reverse().map((adj, i) => {
                  const material = rawMaterials.find(m => m.id === adj.materialId);
                  return (
                    <div key={adj.id} className={`flex items-center justify-between text-xs p-2 rounded-lg ${i % 2 === 0 ? "bg-muted/50" : ""}`}>
                      <div className="flex items-center gap-3">
                        {adj.type === 'in' ? (
                          <div className="h-7 w-7 rounded-full bg-success/20 flex items-center justify-center">
                            <ArrowUpRight className="h-3.5 w-3.5 text-success" />
                          </div>
                        ) : (
                          <div className="h-7 w-7 rounded-full bg-destructive/20 flex items-center justify-center">
                            <ArrowDownRight className="h-3.5 w-3.5 text-destructive" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold">{material?.name || 'Unknown'}</p>
                          <p className="text-muted-foreground italic text-[10px]">{adj.reason || 'Manual adjustment'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={adj.type === 'in' ? "text-success font-bold" : "text-destructive font-bold"}>
                          {adj.type === 'in' ? "+" : "-"}{adj.quantity} {material?.unit}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{adj.date}</p>
                      </div>
                    </div>
                  );
                })}
                {rawMaterialAdjustments.length === 0 && (
                  <p className="text-center py-4 text-xs text-muted-foreground italic">No recent stock activities recorded.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
