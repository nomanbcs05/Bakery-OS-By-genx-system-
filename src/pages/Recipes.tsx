import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Plus, Trash2, TestTube2, AlertCircle } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Recipe, RecipeIngredient } from '@/types';

export default function Recipes() {
  const { currentUser, products, rawMaterials, recipes, addRecipe, updateRecipe, deleteRecipe } = useApp();

  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [editingRecipe, setEditingRecipe] = useState<RecipeIngredient[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  if (!currentUser) return <Navigate to="/login" replace />;

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(p => {
    if (!p.isActive) return false;
    if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;
    return true;
  });

  const handleSelectProduct = (productId: string) => {
    setSelectedProduct(productId);
    const existingRecipe = (recipes || []).find(r => r.productId === productId && r.isActive);
    if (existingRecipe) {
      setEditingRecipe(existingRecipe.ingredients);
    } else {
      setEditingRecipe([]);
    }
  };

  const currentProduct = products.find(p => p.id === selectedProduct);

  const handleAddIngredient = () => {
    if (rawMaterials.length === 0) {
      toast.error('No raw materials available. Please add some first.');
      return;
    }
    const unselectedMaterial = rawMaterials.find(m => !editingRecipe.find(e => e.materialId === m.id));
    if (unselectedMaterial) {
      setEditingRecipe([...editingRecipe, { materialId: unselectedMaterial.id, quantity: 0 }]);
    } else {
      toast.error('All raw materials are already added.');
    }
  };

  const handleUpdateIngredient = (index: number, field: 'materialId' | 'quantity', value: any) => {
    const updated = [...editingRecipe];
    if (field === 'materialId') {
      // Prevent duplicates
      if (editingRecipe.find((e, i) => i !== index && e.materialId === value)) {
        toast.error('Material already exists manually change it.');
        return;
      }
    }
    updated[index] = { ...updated[index], [field]: value };
    setEditingRecipe(updated);
  };

  const handleRemoveIngredient = (index: number) => {
    const updated = [...editingRecipe];
    updated.splice(index, 1);
    setEditingRecipe(updated);
  };

  const handleSaveRecipe = async () => {
    if (!selectedProduct) return;
    
    // Validate
    const invalid = editingRecipe.find(r => !r.materialId || r.quantity <= 0);
    if (invalid) {
      toast.error('Please ensure all ingredients have a valid material and quantity > 0');
      return;
    }

    const existingRecipe = (recipes || []).find(r => r.productId === selectedProduct && r.isActive);

    if (existingRecipe) {
      if (editingRecipe.length === 0) {
        await deleteRecipe(existingRecipe.id);
        toast.success('Recipe completely removed');
      } else {
        await updateRecipe(existingRecipe.id, { ingredients: editingRecipe });
      }
    } else {
      if (editingRecipe.length > 0) {
        await addRecipe({
          productId: selectedProduct,
          ingredients: editingRecipe,
          isActive: true
        });
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TestTube2 className="h-6 w-6 text-primary" /> Recipe Builder (BOM)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Map finished products to raw materials for automatic stock deduction during production.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Products List Panel */}
        <div className="md:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base">Products</CardTitle>
              <div className="pt-2">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full h-8 text-xs">
                    <SelectValue placeholder="Category filter" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[calc(100vh-280px)] overflow-y-auto">
                <ul className="divide-y">
                  {(filteredProducts || []).map(p => {
                    const hasRecipe = (recipes || []).some(r => r.productId === p.id && r.isActive && (r.ingredients || []).length > 0);
                    return (
                      <li key={p.id}>
                        <button
                          className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-center justify-between ${
                            selectedProduct === p.id ? 'bg-primary/5 border-l-2 border-primary' : ''
                          }`}
                          onClick={() => handleSelectProduct(p.id)}
                        >
                          <div>
                            <div className="text-sm font-medium">{p.name}</div>
                            <div className="text-[10px] text-muted-foreground">{p.category}</div>
                          </div>
                          {hasRecipe && (
                            <Badge variant="outline" className="text-[9px] bg-green-50 text-green-700 border-green-200">
                              Configured
                            </Badge>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
                {filteredProducts.length === 0 && (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No products found.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recipe Editor Panel */}
        <div className="md:col-span-2">
          {selectedProduct ? (
            <Card className="h-full flex flex-col">
              <CardHeader className="border-b bg-slate-50/50">
                <div className="flex items-start justify-between">
                  <div>
                    <Badge variant="outline" className="mb-2">{currentProduct?.category}</Badge>
                    <CardTitle className="text-xl">{currentProduct?.name}</CardTitle>
                    <CardDescription className="mt-1">
                      Define exactly what goes into <strong>1 {currentProduct?.unit}</strong> of this product.
                    </CardDescription>
                  </div>
                  <Button onClick={handleSaveRecipe} className="gap-2 bg-green-600 hover:bg-green-700">
                    <Save className="h-4 w-4" /> Save Recipe
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 flex-1">
                
                {editingRecipe.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed mt-4">
                    <TestTube2 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-slate-700">No Recipe Defined</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                      Whenever you log production for this product, no raw materials will be automatically deducted.
                    </p>
                    <Button onClick={handleAddIngredient} variant="outline" className="mt-4 gap-2 border-dashed">
                      <Plus className="h-4 w-4" /> Start Adding Ingredients
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4 pb-2 border-b">
                      <h3 className="font-medium flex items-center gap-2">
                        Formula for 1 {currentProduct?.unit}
                      </h3>
                      <Button onClick={handleAddIngredient} variant="outline" size="sm" className="gap-1.5 h-8">
                        <Plus className="h-3.5 w-3.5" /> Add Ingredient
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {editingRecipe.map((ing, i) => {
                        const mat = rawMaterials.find(m => m.id === ing.materialId);
                        return (
                          <div key={i} className="flex gap-3 items-end bg-white p-3 rounded-lg border shadow-sm">
                            <div className="flex-1 space-y-1.5">
                              <Label className="text-xs">Raw Material</Label>
                              <Select 
                                value={ing.materialId} 
                                onValueChange={v => handleUpdateIngredient(i, 'materialId', v)}
                              >
                                <SelectTrigger className="h-9">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {rawMaterials.filter(m => m.isActive).map(m => (
                                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="w-32 space-y-1.5">
                              <Label className="text-xs">Required Qty <span className="text-muted-foreground font-normal">({mat?.unit || '-'})</span></Label>
                              <Input 
                                type="number" 
                                className="h-9"
                                min="0" 
                                step="0.001"
                                value={ing.quantity || ''} 
                                onChange={e => handleUpdateIngredient(i, 'quantity', parseFloat(e.target.value))}
                                placeholder="0.0"
                              />
                            </div>

                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-9 w-9 text-slate-400 hover:text-red-500 hover:bg-red-50"
                              onClick={() => handleRemoveIngredient(i)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200 flex gap-3 text-amber-800 text-sm">
                      <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
                      <p>
                        Ensure quantities match your raw material units. If your flour is tracked in <strong>kg</strong> and you need 500 grams, enter <strong>0.5</strong>.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="h-full border border-dashed rounded-lg flex items-center justify-center p-8 bg-slate-50/50">
              <div className="text-center">
                <TestTube2 className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-slate-600">Select a Product</h3>
                <p className="text-sm text-slate-400 mt-1">Choose a product from the list to view or edit its recipe formula.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
