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

    const win = window.open('', '_blank', 'width=400,height=700');
    if (!win) return;

    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${branchName} - Products Summary</title>
        <meta charset="UTF-8">
        <style>
          @page { size: 80mm auto; margin: 0; }
          * { box-sizing: border-box; }
          body {
            font-family: Arial, 'Courier New', monospace;
            font-size: 11px;
            color: #000;
            background: #fff;
            margin: 0;
            padding: 4mm 3mm;
            width: 76mm;
          }
          .title1 { font-size: 13px; font-weight: bold; text-align: center; margin: 0 0 1px 0; }
          .title2 { font-size: 10px; font-weight: bold; text-align: center; margin: 0 0 4px 0; letter-spacing: 0.5px; }
          .meta { font-size: 9px; text-align: center; margin: 1px 0; }
          .dot-line { border: none; border-top: 1px dashed #000; margin: 4px 0; }
          .solid-line { border: none; border-top: 1px solid #000; margin: 4px 0; }
          .cat-label {
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            margin: 5px 0 2px 0;
            word-wrap: break-word;
          }
          .prod-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            font-size: 10px;
            margin: 2px 0;
            gap: 4px;
          }
          .prod-name {
            flex: 1;
            word-wrap: break-word;
            word-break: break-word;
            overflow-wrap: break-word;
            line-height: 1.3;
          }
          .prod-stock {
            white-space: nowrap;
            font-weight: bold;
            min-width: 28px;
            text-align: right;
          }
          .out-label { font-style: italic; font-size: 8px; font-weight: normal; }
          .cat-total-row {
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            font-weight: bold;
            margin-top: 3px;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            margin: 3px 0;
          }
          .summary-row.bold-row {
            font-weight: bold;
            font-size: 11px;
          }
          .footer-txt { font-size: 8px; text-align: center; margin-top: 6px; }
          @media print {
            body { width: 76mm; padding: 3mm 2mm; }
          }
        </style>
      </head>
      <body>
        <div class="title1">BakeryOS &mdash; ${branchName}</div>
        <div class="title2">REMAINING PRODUCTS SUMMARY BY CATEGORY</div>
        <hr class="solid-line">
        <div class="meta">Print Date &amp; Time: ${printDate} at ${printTime}</div>
        <div class="meta">Branch: ${branchName} | Generated by: ${currentUser?.name || selectedProfile?.name || 'Staff'}</div>
        <hr class="dot-line">

        ${Object.entries(categoriesMap).map(([catName, items]) => {
          const catUnits = items.reduce((sum, i) => sum + i.remaining, 0);
          return `
            <div class="cat-label">CATEGORY: ${catName}</div>
            <hr class="dot-line">
            ${items.map(item => `
              <div class="prod-row">
                <span class="prod-name">${item.product.name}${item.remaining === 0 ? ' <span class="out-label">(Out)</span>' : ''}</span>
                <span class="prod-stock">${Number.isInteger(item.remaining) ? item.remaining : Number(item.remaining).toFixed(2)}</span>
              </div>
            `).join('')}
            <hr class="dot-line">
            <div class="cat-total-row">
              <span>Category Total:</span>
              <span>${Number.isInteger(catUnits) ? catUnits : Number(catUnits).toFixed(2)}</span>
            </div>
          `;
        }).join('<hr class="solid-line">')}

        <hr class="solid-line">
        <div class="summary-row bold-row">
          <span>TOTAL REMAINING ITEMS:</span>
          <span>${grandTotalUnits}</span>
        </div>
        <div class="summary-row bold-row">
          <span>TOTAL INVENTORY STOCK VALUE:</span>
          <span>Rs. ${grandTotalValue.toFixed(2)}</span>
        </div>
        <hr class="dot-line">
        <div class="footer-txt">BakeryOS Point of Sale &mdash; Branch Inventory System</div>
        <script>
          window.onload = function() { window.print(); };
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

    const win = window.open('', '_blank', 'width=400,height=700');
    if (!win) return;

    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${branchName} - Category-Wise Sales Summary</title>
        <meta charset="UTF-8">
        <style>
          @page { size: 80mm auto; margin: 0; }
          * { box-sizing: border-box; }
          body {
            font-family: Arial, 'Courier New', monospace;
            font-size: 11px;
            color: #000;
            background: #fff;
            margin: 0;
            padding: 4mm 3mm;
            width: 76mm;
          }
          .title1 { font-size: 13px; font-weight: bold; text-align: center; margin: 0 0 1px 0; }
          .title2 { font-size: 10px; font-weight: bold; text-align: center; margin: 0 0 4px 0; letter-spacing: 0.5px; }
          .meta { font-size: 9px; text-align: center; margin: 1px 0; }
          .dot-line { border: none; border-top: 1px dashed #000; margin: 4px 0; }
          .solid-line { border: none; border-top: 1px solid #000; margin: 4px 0; }
          .cat-label {
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            margin: 5px 0 2px 0;
            word-wrap: break-word;
          }
          .prod-block { margin: 3px 0; }
          .prod-name {
            font-size: 10px;
            font-weight: bold;
            word-wrap: break-word;
            word-break: break-word;
            overflow-wrap: break-word;
            line-height: 1.3;
            margin-bottom: 1px;
          }
          .prod-detail { font-size: 9px; margin: 1px 0; }
          .cat-footer-row {
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            font-weight: bold;
            margin-top: 3px;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            margin: 3px 0;
          }
          .summary-row.bold-row {
            font-weight: bold;
            font-size: 11px;
          }
          .payment-block { font-size: 10px; margin: 2px 0; }
          .no-sales { font-size: 10px; text-align: center; margin: 10px 0; }
          .footer-txt { font-size: 8px; text-align: center; margin-top: 6px; }
          @media print {
            body { width: 76mm; padding: 3mm 2mm; }
          }
        </style>
      </head>
      <body>
        <div class="title1">BakeryOS &mdash; ${branchName}</div>
        <div class="title2">CATEGORY-WISE SALES SUMMARY</div>
        <hr class="solid-line">
        <div class="meta">Print Date &amp; Time: ${printDate} at ${printTime}</div>
        <div class="meta">Branch: ${branchName} | Operator: ${currentUser?.name || selectedProfile?.name || 'Staff'}</div>
        <hr class="dot-line">

        ${Object.keys(categorySales).length === 0 ? `
          <div class="no-sales">No sales recorded yet for ${branchName}.</div>
        ` : `
          ${Object.values(categorySales).map(cat => `
            <div class="cat-label">CATEGORY: ${cat.category}</div>
            <hr class="dot-line">
            ${Object.values(cat.products).map(p => `
              <div class="prod-block">
                <div class="prod-name">${p.name}</div>
                <div class="prod-detail">Unit Price: Rs. ${p.unitPrice.toFixed(2)}</div>
                <div class="prod-detail">Qty Sold: ${Number.isInteger(p.quantity) ? p.quantity : Number(p.quantity).toFixed(2)}</div>
                <div class="prod-detail">Total Revenue: Rs. ${p.revenue.toFixed(2)}</div>
              </div>
            `).join('')}
            <hr class="dot-line">
            <div class="cat-footer-row">
              <span>Category Qty:</span>
              <span>${cat.totalUnits}</span>
            </div>
            <div class="cat-footer-row">
              <span>Category Revenue:</span>
              <span>Rs. ${cat.totalRevenue.toFixed(2)}</span>
            </div>
          `).join('<hr class="solid-line">')}
        `}

        <hr class="solid-line">
        <div class="summary-row bold-row">
          <span>TOTAL TRANSACTIONS:</span>
          <span>${branchSales.length}</span>
        </div>
        <div class="summary-row bold-row">
          <span>TOTAL ITEMS SOLD:</span>
          <span>${totalItemsSold}</span>
        </div>
        <hr class="dot-line">
        <div class="payment-block">PAYMENT BREAKDOWN:</div>
        <div class="summary-row">
          <span>Cash:</span>
          <span>Rs. ${cashTotal.toFixed(2)}</span>
        </div>
        <div class="summary-row">
          <span>Card:</span>
          <span>Rs. ${cardTotal.toFixed(2)}</span>
        </div>
        <div class="summary-row">
          <span>Other:</span>
          <span>Rs. ${Math.max(0, totalBranchRevenue - cashTotal - cardTotal).toFixed(2)}</span>
        </div>
        <hr class="dot-line">
        <div class="summary-row bold-row">
          <span>GRAND TOTAL SALES:</span>
          <span>Rs. ${totalBranchRevenue.toFixed(2)}</span>
        </div>
        <hr class="dot-line">
        <div class="footer-txt">BakeryOS Point of Sale &mdash; Branch Sales Summary</div>
        <script>
          window.onload = function() { window.print(); };
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
