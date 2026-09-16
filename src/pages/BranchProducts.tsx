import { safeLower } from "../lib/utils";
import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PackageMinus, Settings2, Search, Printer } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function BranchProducts() {
  const { currentUser, selectedProfile, products, stock, getBranchStock, adjustBranchStock, updateProduct, sales, getProductById } = useApp();

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
  const [showHidden, setShowHidden] = useState(false);

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  // Map to detailed product and group by category
  const groupedProducts = useMemo(() => {
    const groups: Record<string, any[]> = {};
    
    products.forEach(product => {
      if (!showHidden && !product.isActive) return;
      if (selectedCategory !== 'All' && product.category !== selectedCategory) return;
      if (searchQuery && !safeLower(product.name).includes(safeLower(searchQuery))) return;

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
  }, [products, stock, branchView, selectedCategory, searchQuery, showHidden]);

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

  // RED BUTTON: Print Products Summary (remaining products in each category of this branch)
  const handlePrintProductsSummary = () => {
    const branchName = branchView === 'branch_1' ? 'Branch 1' : 'Branch 2';
    const categoriesMap: Record<string, { product: typeof products[0]; remaining: number; value: number }[]> = {};
    
    products.filter(p => p.isActive).forEach(p => {
      const remaining = stock[p.id]?.[branchView] || 0;
      const cat = p.category || 'Other';
      if (!categoriesMap[cat]) categoriesMap[cat] = [];
      categoriesMap[cat].push({
        product: p,
        remaining,
        value: remaining * p.price
      });
    });

    let grandTotalUnits = 0;
    let grandTotalValue = 0;

    Object.values(categoriesMap).forEach(items => {
      items.forEach(item => {
        grandTotalUnits += item.remaining;
        grandTotalValue += item.value;
      });
    });

    const now = new Date();
    const printDate = now.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    const printTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

    const win = window.open('', '_blank', 'width=800,height=700');
    if (!win) return;

    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${branchName} - Products Summary</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 24px; color: #1f2937; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid #e5e7eb; padding-bottom: 12px; margin-bottom: 16px; }
          .header h1 { margin: 0 0 4px 0; font-size: 22px; color: #b91c1c; }
          .header h2 { margin: 0 0 6px 0; font-size: 16px; color: #374151; }
          .header p { margin: 2px 0; font-size: 12px; color: #6b7280; }
          .cat-section { margin-bottom: 20px; page-break-inside: avoid; }
          .cat-title { background: #fee2e2; color: #991b1b; padding: 6px 12px; font-size: 14px; font-weight: bold; border-radius: 4px; display: flex; justify-content: space-between; }
          table { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 13px; }
          th { background: #f9fafb; text-align: left; padding: 8px 10px; border-bottom: 2px solid #e5e7eb; font-weight: 600; color: #4b5563; }
          td { padding: 7px 10px; border-bottom: 1px solid #f3f4f6; }
          .right { text-align: right; }
          .center { text-align: center; }
          .subtotal-row { background: #fff5f5; font-weight: 600; border-top: 1px solid #fca5a5; }
          .badge-out { color: #dc2626; font-weight: bold; font-size: 11px; }
          .badge-ok { color: #15803d; font-weight: 600; }
          .grand-total-box { margin-top: 24px; padding: 16px; background: #fef2f2; border: 2px solid #f87171; border-radius: 8px; page-break-inside: avoid; }
          .grand-total-box table { margin: 0; font-size: 15px; font-weight: bold; }
          .footer { text-align: center; margin-top: 24px; font-size: 11px; color: #9ca3af; border-top: 1px dashed #e5e7eb; padding-top: 12px; }
          @media print {
            body { padding: 10px; }
            .header h1 { color: #000; }
            .cat-title { background: #eee !important; color: #000 !important; }
            .grand-total-box { background: #fafafa !important; border-color: #000 !important; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🍞 BakeryOS — ${branchName}</h1>
          <h2>REMAINING PRODUCTS SUMMARY BY CATEGORY</h2>
          <p><strong>Print Date & Time:</strong> ${printDate} at ${printTime}</p>
          <p>Branch: ${branchName} | Generated by: ${currentUser?.name || selectedProfile?.name || 'Staff'}</p>
        </div>

        ${Object.entries(categoriesMap).map(([catName, items]) => {
          const catUnits = items.reduce((sum, i) => sum + i.remaining, 0);
          const catVal = items.reduce((sum, i) => sum + i.value, 0);
          return `
            <div class="cat-section">
              <div class="cat-title">
                <span>📁 Category: ${catName}</span>
                <span>${catUnits} units remaining</span>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th class="right">Unit Price</th>
                    <th class="center">Unit</th>
                    <th class="right">Remaining Stock</th>
                    <th class="right">Total Value</th>
                  </tr>
                </thead>
                <tbody>
                  ${items.map(item => `
                    <tr>
                      <td><strong>${item.product.name}</strong></td>
                      <td class="right">Rs. ${item.product.price.toFixed(2)}</td>
                      <td class="center">${item.product.unit}</td>
                      <td class="right ${item.remaining === 0 ? 'badge-out' : 'badge-ok'}">
                        ${item.remaining} ${item.remaining === 0 ? '(Out of stock)' : ''}
                      </td>
                      <td class="right">Rs. ${item.value.toFixed(2)}</td>
                    </tr>
                  `).join('')}
                  <tr class="subtotal-row">
                    <td colspan="3"><strong>${catName} Subtotal</strong></td>
                    <td class="right"><strong>${catUnits} units</strong></td>
                    <td class="right"><strong>Rs. ${catVal.toFixed(2)}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          `;
        }).join('')}

        <div class="grand-total-box">
          <table>
            <tr>
              <td>Total Remaining Items Across All Categories:</td>
              <td class="right">${grandTotalUnits} units</td>
            </tr>
            <tr>
              <td>Total Inventory Stock Value:</td>
              <td class="right" style="color: #b91c1c;">Rs. ${grandTotalValue.toFixed(2)}</td>
            </tr>
          </table>
        </div>

        <div class="footer">
          BakeryOS Point of Sale — Branch Inventory System
        </div>
        <script>
          window.print();
        </script>
      </body>
      </html>
    `);
    win.document.close();
  };

  // GREEN BUTTON: Print Sales Summary (category-wise sales summary for this branch)
  const handlePrintSalesSummary = () => {
    const branchName = branchView === 'branch_1' ? 'Branch 1' : 'Branch 2';
    const branchSales = sales.filter(s => s.branch === branchView);

    const categorySales: Record<string, {
      category: string;
      products: Record<string, { name: string; quantity: number; unitPrice: number; revenue: number }>;
      totalUnits: number;
      totalRevenue: number;
    }> = {};

    let totalBranchRevenue = 0;
    let totalItemsSold = 0;
    let cashTotal = 0;
    let cardTotal = 0;

    branchSales.forEach(sale => {
      totalBranchRevenue += sale.total;
      if (sale.paymentMethod === 'cash') cashTotal += sale.total;
      else cardTotal += sale.total;

      sale.items.forEach(item => {
        const p = getProductById(item.productId);
        const cat = p?.category || 'Other';
        const pName = p?.name || 'Unknown Product';
        totalItemsSold += item.quantity;

        if (!categorySales[cat]) {
          categorySales[cat] = {
            category: cat,
            products: {},
            totalUnits: 0,
            totalRevenue: 0
          };
        }

        if (!categorySales[cat].products[item.productId]) {
          categorySales[cat].products[item.productId] = {
            name: pName,
            quantity: 0,
            unitPrice: item.unitPrice,
            revenue: 0
          };
        }

        categorySales[cat].products[item.productId].quantity += item.quantity;
        categorySales[cat].products[item.productId].revenue += item.quantity * item.unitPrice;
        categorySales[cat].totalUnits += item.quantity;
        categorySales[cat].totalRevenue += item.quantity * item.unitPrice;
      });
    });

    const now = new Date();
    const printDate = now.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    const printTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

    const win = window.open('', '_blank', 'width=800,height=700');
    if (!win) return;

    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${branchName} - Category-Wise Sales Summary</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 24px; color: #1f2937; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid #e5e7eb; padding-bottom: 12px; margin-bottom: 16px; }
          .header h1 { margin: 0 0 4px 0; font-size: 22px; color: #047857; }
          .header h2 { margin: 0 0 6px 0; font-size: 16px; color: #374151; }
          .header p { margin: 2px 0; font-size: 12px; color: #6b7280; }
          .cat-section { margin-bottom: 20px; page-break-inside: avoid; }
          .cat-title { background: #d1fae5; color: #065f46; padding: 6px 12px; font-size: 14px; font-weight: bold; border-radius: 4px; display: flex; justify-content: space-between; }
          table { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 13px; }
          th { background: #f9fafb; text-align: left; padding: 8px 10px; border-bottom: 2px solid #e5e7eb; font-weight: 600; color: #4b5563; }
          td { padding: 7px 10px; border-bottom: 1px solid #f3f4f6; }
          .right { text-align: right; }
          .center { text-align: center; }
          .subtotal-row { background: #ecfdf5; font-weight: 600; border-top: 1px solid #6ee7b7; }
          .grand-total-box { margin-top: 24px; padding: 16px; background: #f0fdf4; border: 2px solid #34d399; border-radius: 8px; page-break-inside: avoid; }
          .grand-total-box table { margin: 0; font-size: 14px; }
          .grand-row { font-size: 16px; font-weight: bold; color: #047857; }
          .footer { text-align: center; margin-top: 24px; font-size: 11px; color: #9ca3af; border-top: 1px dashed #e5e7eb; padding-top: 12px; }
          @media print {
            body { padding: 10px; }
            .header h1 { color: #000; }
            .cat-title { background: #eee !important; color: #000 !important; }
            .grand-total-box { background: #fafafa !important; border-color: #000 !important; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🍞 BakeryOS — ${branchName}</h1>
          <h2>CATEGORY-WISE SALES SUMMARY</h2>
          <p><strong>Print Date & Time:</strong> ${printDate} at ${printTime}</p>
          <p>Branch: ${branchName} | Operator: ${currentUser?.name || selectedProfile?.name || 'Staff'}</p>
        </div>

        ${Object.keys(categorySales).length === 0 ? `
          <div style="text-align: center; padding: 40px; color: #6b7280;">
            <p>No sales recorded yet for ${branchName}.</p>
          </div>
        ` : `
          ${Object.values(categorySales).map(cat => `
            <div class="cat-section">
              <div class="cat-title">
                <span>📁 Category: ${cat.category}</span>
                <span>${cat.totalUnits} sold · Rs. ${cat.totalRevenue.toFixed(2)}</span>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th class="right">Unit Price</th>
                    <th class="center">Qty Sold</th>
                    <th class="right">Total Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  ${Object.values(cat.products).map(p => `
                    <tr>
                      <td><strong>${p.name}</strong></td>
                      <td class="right">Rs. ${p.unitPrice.toFixed(2)}</td>
                      <td class="center">${p.quantity}</td>
                      <td class="right">Rs. ${p.revenue.toFixed(2)}</td>
                    </tr>
                  `).join('')}
                  <tr class="subtotal-row">
                    <td colspan="2"><strong>${cat.category} Category Total</strong></td>
                    <td class="center"><strong>${cat.totalUnits}</strong></td>
                    <td class="right"><strong>Rs. ${cat.totalRevenue.toFixed(2)}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          `).join('')}

          <div class="cat-section">
            <div class="cat-title" style="background: #e0e7ff; color: #3730a3;">
              <span>📊 Category Performance Breakdown</span>
              <span>All Categories</span>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th class="center">Items Sold</th>
                  <th class="right">Revenue</th>
                  <th class="right">% of Sales</th>
                </tr>
              </thead>
              <tbody>
                ${Object.values(categorySales).map(c => `
                  <tr>
                    <td><strong>${c.category}</strong></td>
                    <td class="center">${c.totalUnits}</td>
                    <td class="right">Rs. ${c.totalRevenue.toFixed(2)}</td>
                    <td class="right">${totalBranchRevenue > 0 ? ((c.totalRevenue / totalBranchRevenue) * 100).toFixed(1) : '0'}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}

        <div class="grand-total-box">
          <table>
            <tr>
              <td>Total Transactions:</td>
              <td class="right"><strong>${branchSales.length}</strong></td>
            </tr>
            <tr>
              <td>Total Items Sold:</td>
              <td class="right"><strong>${totalItemsSold}</strong></td>
            </tr>
            <tr>
              <td>Payment Breakdown:</td>
              <td class="right">Cash: <strong>Rs. ${cashTotal.toFixed(2)}</strong> | Card: <strong>Rs. ${cardTotal.toFixed(2)}</strong></td>
            </tr>
            <tr class="grand-row">
              <td style="padding-top: 8px;">GRAND TOTAL SALES:</td>
              <td class="right" style="padding-top: 8px;">Rs. ${totalBranchRevenue.toFixed(2)}</td>
            </tr>
          </table>
        </div>

        <div class="footer">
          BakeryOS Point of Sale — Branch Sales Summary
        </div>
        <script>
          window.print();
        </script>
      </body>
      </html>
    `);
    win.document.close();
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
        <div className="flex items-center gap-2 flex-wrap">
          {/* RED BUTTON: Print Products Summary */}
          <Button
            onClick={handlePrintProductsSummary}
            className="bg-red-600 hover:bg-red-700 text-white font-medium shadow-sm transition-all active:scale-95"
            size="sm"
          >
            <Printer className="h-4 w-4 mr-1.5" /> Print Products Summary
          </Button>

          {/* GREEN BUTTON: Print Sales Summary */}
          <Button
            onClick={handlePrintSalesSummary}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm transition-all active:scale-95"
            size="sm"
          >
            <Printer className="h-4 w-4 mr-1.5" /> Print Sales Summary
          </Button>

          <Label className="text-xs text-muted-foreground whitespace-nowrap ml-2">Show Hidden</Label>
          <Button 
            variant={showHidden ? "default" : "outline"} 
            size="sm" 
            className="h-8 px-3"
            onClick={() => setShowHidden(!showHidden)}
          >
            {showHidden ? "On" : "Off"}
          </Button>
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
                        <div className="flex items-center gap-1">
                          {!item.productDetails.isActive && <Badge variant="destructive" className="text-[8px] h-4 px-1">Hidden</Badge>}
                          <Badge variant="secondary" className="font-mono text-[10px] uppercase font-bold tracking-tight bg-background">
                            {item.stock} {item.productDetails.unit}s
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 bg-card flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        Price: Rs. {item.productDetails.price.toFixed(2)}
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className={`h-8 px-2 text-[10px] font-bold ${item.productDetails.isActive ? 'text-muted-foreground hover:text-destructive' : 'text-success hover:text-success'}`}
                          onClick={() => {
                            if (confirm(`${item.productDetails.isActive ? 'Hide' : 'Show'} this product on POS dashboard?`)) {
                              updateProduct(item.productDetails.id, { isActive: !item.productDetails.isActive });
                            }
                          }}
                        >
                          {item.productDetails.isActive ? 'Hide from POS' : 'Show on POS'}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 text-xs font-semibold text-destructive/80 hover:text-destructive border-destructive/20 hover:bg-destructive/5"
                          onClick={() => openAdjustmentDialog(item.productId)}
                        >
                          Adjust
                        </Button>
                      </div>
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
