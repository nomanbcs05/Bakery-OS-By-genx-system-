import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  Banknote, 
  Search, 
  ChefHat, 
  LayoutGrid, 
  ChevronLeft,
  X,
  Maximize2,
  Package,
  ArrowRight,
  History,
  ShoppingBag
} from 'lucide-react';
import type { SaleItem, PaymentMethod } from '@/types';
import { Navigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import ReceiptDialog from '@/components/ReceiptDialog';
import { motion, AnimatePresence } from 'framer-motion';

interface POSProps {
  branch: 'branch_1' | 'branch_2';
}

export default function POS({ branch }: POSProps) {
  const { currentUser, products, stock, createSale, getProductById } = useApp();

  if (!currentUser) return <Navigate to="/login" replace />;
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [receiptData, setReceiptData] = useState<{
    open: boolean;
    items: any[];
    total: number;
    paymentMethod: string;
    saleId: string;
    date: string;
  }>({
    open: false,
    items: [],
    total: 0,
    paymentMethod: 'cash',
    saleId: '',
    date: '',
  });

  const branchLabel = branch === 'branch_1' ? 'Branch 1' : 'Branch 2';
  
  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  const availableProducts = useMemo(() => {
    return products
      .filter(p => p.isActive)
      .filter(p => selectedCategory === 'All' || p.category === selectedCategory)
      .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .map(p => {
        const s = stock[p.id]?.[branch] || 0;
        return { ...p, stock: s };
      });
  }, [products, stock, branch, selectedCategory, searchQuery]);

  const addToCart = (productId: string) => {
    const product = getProductById(productId);
    if (!product) return;

    setCart(prev => {
      const existing = prev.find(i => i.productId === productId);
      if (existing) return prev.map(i => i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { productId, quantity: 1, unitPrice: product.price }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.productId !== productId) return i;
      const newQty = i.quantity + delta;
      if (newQty <= 0) return i;
      return { ...i, quantity: newQty };
    }));
  };

  const removeFromCart = (productId: string) => setCart(prev => prev.filter(i => i.productId !== productId));

  const subTotal = cart.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const tax = subTotal * 0.05; // 5% sample tax
  const total = subTotal + tax;

  const checkout = async (method: PaymentMethod) => {
    if (cart.length === 0) return;
    
    const receiptItems = cart.map(i => ({
      name: getProductById(i.productId)?.name || 'Unknown',
      quantity: i.quantity,
      unitPrice: i.unitPrice,
    }));
    const saleId = `RCP-${Date.now().toString(36).toUpperCase()}`;
    const date = new Date().toISOString();

    const success = await createSale('branch', branch, cart, method);
    if (success) {
      setCart([]);
      setReceiptData({
        open: true,
        items: receiptItems,
        total: total,
        paymentMethod: method,
        saleId,
        date,
      });
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden bg-slate-50">
      {/* Top Navigation Bar (Copy from image) */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-slate-100 flex-shrink-0">
         <div className="flex items-center gap-6">
            <Button variant="ghost" size="icon" className="rounded-xl bg-slate-900 text-white h-9 w-9">
               <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-4 text-sm">
               <span className="font-bold text-slate-800">Select Menu</span>
               <div className="h-4 w-[1px] bg-slate-200" />
               <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-xl font-bold">
                  <Package className="h-4 w-4" />
                  <span>Select Menu</span>
               </div>
               <div className="h-4 w-[1px] bg-slate-200" />
               <span className="text-slate-400 font-medium">Order Summary</span>
            </div>
         </div>
         <Button variant="ghost" size="icon" className="rounded-xl bg-slate-100 h-9 w-9">
            <X className="h-5 w-5 text-slate-500" />
         </Button>
      </div>

      <div className="flex-1 flex overflow-hidden p-4 lg:p-6 gap-6">
        {/* Menu Section */}
        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
           <Card className="border-none shadow-sm rounded-3xl bg-white p-6 flex-shrink-0">
              <div className="flex items-baseline justify-between mb-6">
                 <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                    Menu List
                    <Badge className="bg-primary/10 text-primary border-none text-[10px] uppercase font-black px-2 py-0.5">Bakewise</Badge>
                 </h2>
                 <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                       placeholder="Search Item Name" 
                       value={searchQuery}
                       onChange={e => setSearchQuery(e.target.value)}
                       className="pl-10 h-11 bg-slate-50 border-none rounded-xl text-sm"
                    />
                 </div>
              </div>
              
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                 {categories.map(c => (
                    <Button 
                       key={c}
                       variant={selectedCategory === c ? "default" : "ghost"}
                       onClick={() => setSelectedCategory(c)}
                       className={`rounded-xl h-10 px-5 text-xs font-bold transition-all ${
                          selectedCategory === c ? 'bg-primary shadow-lg shadow-orange-100' : 'bg-slate-50 text-slate-500'
                       }`}
                    >
                       {c} {c === 'All' && products.length}
                    </Button>
                 ))}
              </div>
           </Card>

           <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide">
              <div className="space-y-8">
                 <div className="space-y-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                       <ChefHat className="h-3 w-3" /> {selectedCategory} Selection
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                       {availableProducts.map(p => (
                          <motion.div 
                             key={p.id}
                             whileHover={{ y: -5 }}
                             className="bg-white rounded-[28px] p-2 shadow-sm hover:shadow-xl transition-all group"
                          >
                             <div className="aspect-[5/4] rounded-[22px] overflow-hidden bg-slate-50 relative">
                                {p.imageUrl ? (
                                   <img src={p.imageUrl} className="w-full h-full object-cover" alt={p.name} />
                                ) : (
                                   <div className="w-full h-full flex items-center justify-center text-slate-200">
                                      <LayoutGrid className="h-10 w-10" />
                                   </div>
                                )}
                                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md rounded-full px-2 py-1 flex items-center gap-1.5 shadow-sm">
                                   <div className={`h-1.5 w-1.5 rounded-full ${p.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                                   <span className="text-[10px] font-bold text-slate-800 uppercase tracking-tighter">
                                      {p.stock > 0 ? 'Available' : 'No Stock'}
                                   </span>
                                </div>
                                <button className="absolute top-3 right-3 h-8 w-8 bg-white/90 backdrop-blur-md rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                   <Maximize2 className="h-4 w-4 text-slate-400" />
                                </button>
                             </div>
                             <div className="p-3 pt-4">
                                <h4 className="text-sm font-black text-slate-800 line-clamp-1">{p.name}</h4>
                                <p className="text-[10px] font-medium text-slate-400 line-clamp-2 mt-1 min-h-[text-2.5em]">{p.description || "Freshly baked masterpiece prepared daily."}</p>
                                <div className="mt-4 flex items-center justify-between">
                                   <span className="text-sm font-black text-primary">Rs. {p.price.toLocaleString()}</span>
                                   <Button 
                                      size="sm" 
                                      onClick={() => addToCart(p.id)}
                                      className="rounded-xl px-4 h-9 bg-slate-50 hover:bg-primary text-slate-500 hover:text-white text-[10px] font-bold uppercase tracking-wider transition-colors"
                                   >
                                      Add to Cart
                                   </Button>
                                </div>
                             </div>
                          </motion.div>
                       ))}
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Sidebar Cart Area */}
        <div className="w-[380px] flex flex-col gap-6 flex-shrink-0 h-full">
           <Card className="flex-1 border-none shadow-sm rounded-3xl bg-white overflow-hidden flex flex-col">
              <CardHeader className="p-6 border-b border-slate-50 flex flex-row items-center justify-between flex-shrink-0">
                 <CardTitle className="text-base font-black text-slate-800 flex items-center gap-2">
                    <History className="h-4 w-4 text-primary" /> Order Details
                 </CardTitle>
                 <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setCart([])}
                    className="text-xs font-bold text-red-500 hover:bg-red-50 rounded-xl px-3"
                 >
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Reset Order
                 </Button>
              </CardHeader>
              
              <CardContent className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                 <AnimatePresence mode="popLayout">
                    {cart.length === 0 ? (
                       <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                          <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center">
                             <ShoppingCart className="h-8 w-8 text-slate-200" />
                          </div>
                          <div className="space-y-1">
                             <p className="text-sm font-black text-slate-800">No order found</p>
                             <p className="text-[10px] font-medium text-slate-400 leading-relaxed px-4">
                                Select items from menu list on left side and <span className="text-primary font-bold">Add to Cart</span>.
                             </p>
                          </div>
                       </div>
                    ) : (
                       <div className="space-y-4">
                          {cart.map(item => {
                             const product = getProductById(item.productId);
                             return (
                                <motion.div 
                                   key={item.productId}
                                   initial={{ opacity: 0, x: 20 }}
                                   animate={{ opacity: 1, x: 0 }}
                                   exit={{ opacity: 0, x: -20 }}
                                   className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl relative group"
                                >
                                   <div className="h-12 w-12 rounded-xl bg-white overflow-hidden flex-shrink-0">
                                      {product?.imageUrl ? <img src={product.imageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-200"><LayoutGrid className="h-5 w-5" /></div>}
                                   </div>
                                   <div className="flex-1 min-w-0">
                                      <p className="text-[11px] font-black text-slate-800 truncate">{product?.name}</p>
                                      <p className="text-[10px] font-bold text-primary">Rs. {item.unitPrice.toLocaleString()}</p>
                                   </div>
                                   <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm">
                                      <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:bg-slate-100" onClick={() => updateQty(item.productId, -1)}>
                                         <Minus className="h-3 w-3" />
                                      </Button>
                                      <span className="text-xs font-black min-w-[20px] text-center">{item.quantity}</span>
                                      <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:bg-slate-100" onClick={() => updateQty(item.productId, 1)}>
                                         <Plus className="h-3 w-3" />
                                      </Button>
                                   </div>
                                   <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      onClick={() => removeFromCart(item.productId)}
                                      className="h-6 w-6 rounded-md text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                   >
                                      <X className="h-3 w-3" />
                                   </Button>
                                </motion.div>
                             );
                          })}
                       </div>
                    )}
                 </AnimatePresence>
              </CardContent>

              <div className="p-6 bg-slate-50 border-t border-slate-100 space-y-4 flex-shrink-0">
                 <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-slate-400">
                       <span>Sub Total</span>
                       <span>Rs. {subTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-slate-400">
                       <span>Tax (5%)</span>
                       <span>Rs. {tax.toLocaleString()}</span>
                    </div>
                    <Separator className="bg-slate-200" />
                    <div className="flex justify-between text-lg font-black text-slate-900">
                       <span>Total Bill</span>
                       <span className="text-primary">Rs. {total.toLocaleString()}</span>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-3 mt-4">
                    <Button 
                       onClick={() => checkout('cash')} 
                       className="rounded-2xl h-12 bg-white hover:bg-slate-100 text-slate-800 font-bold border-none shadow-sm flex flex-col gap-0 leading-tight"
                    >
                       <Banknote className="h-4 w-4" />
                       <span className="text-[9px] uppercase tracking-widest mt-0.5">Cash Pay</span>
                    </Button>
                    <Button 
                       onClick={() => checkout('card')} 
                       className="rounded-2xl h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold border-none shadow-lg flex flex-col gap-0 leading-tight"
                    >
                       <CreditCard className="h-4 w-4" />
                       <span className="text-[9px] uppercase tracking-widest mt-0.5">Credit Card</span>
                    </Button>
                 </div>
                 
                 <Button 
                    className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/95 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-orange-100 flex items-center justify-center gap-3 transition-transform active:scale-95"
                    onClick={() => cart.length > 0 && checkout('cash')}
                    disabled={cart.length === 0}
                 >
                    Complete Transaction
                    <ArrowRight className="h-5 w-5" />
                 </Button>
              </div>
           </Card>
        </div>
      </div>

      <ReceiptDialog 
        open={receiptData.open}
        onClose={() => setReceiptData(prev => ({ ...prev, open: false }))}
        items={receiptData.items}
        total={receiptData.total}
        paymentMethod={receiptData.paymentMethod}
        branch={branchLabel}
        saleId={receiptData.saleId}
        date={receiptData.date}
        autoPrint={true}
      />
    </div>
  );
}
