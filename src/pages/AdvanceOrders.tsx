import { useState, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, ClipboardList, Printer, CheckCircle2, Clock, Package, Trash2, Search } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';
import ReceiptDialog from '@/components/ReceiptDialog';
import type { SaleItem, AdvanceOrder } from '@/types';

export default function AdvanceOrders() {
  const { 
    products, advanceOrders, addAdvanceOrder, updateAdvanceOrderStatus,
    selectedProfile, getProductById, receiptSettings, createSale
  } = useApp();

  const branch = selectedProfile?.branchId || 'branch_1';
  const branchLabel = branch === 'branch_1' ? 'Branch 1' : 'Branch 2';

  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [orderItems, setOrderItems] = useState<SaleItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [searchTerm, setSearchTerm] = useState('');
  const [printOrderId, setPrintOrderId] = useState<string | null>(null);
  const [completedReceiptOrder, setCompletedReceiptOrder] = useState<AdvanceOrder | null>(null);

  const printRef = useRef<HTMLDivElement>(null);

  const activeProducts = products.filter(p => p.isActive);
  const filteredProducts = activeProducts.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const branchOrders = advanceOrders.filter(o => o.branch === branch);
  const pendingOrders = branchOrders.filter(o => o.status === 'pending');
  const receivedOrders = branchOrders.filter(o => o.status === 'received');
  const completedOrders = branchOrders.filter(o => o.status === 'completed');

  const handleAddItem = () => {
    if (!selectedProduct || !quantity || parseFloat(quantity) <= 0) {
      toast.error("Select a product and valid quantity");
      return;
    }
    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;

    setOrderItems(prev => {
      const existing = prev.find(i => i.productId === selectedProduct);
      if (existing) {
        return prev.map(i => i.productId === selectedProduct 
          ? { ...i, quantity: i.quantity + parseFloat(quantity) }
          : i
        );
      }
      return [...prev, { productId: selectedProduct, quantity: parseFloat(quantity), unitPrice: product.price }];
    });
    setSelectedProduct('');
    setQuantity('1');
    setSearchTerm('');
  };

  const handleRemoveItem = (productId: string) => {
    setOrderItems(prev => prev.filter(i => i.productId !== productId));
  };

  const orderTotal = orderItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  const handleCreateOrder = async () => {
    if (!customerName.trim()) {
      toast.error("Customer name is required");
      return;
    }
    if (orderItems.length === 0) {
      toast.error("Add at least one item to the order");
      return;
    }

    const orderId = await addAdvanceOrder({
      branch: branch as any,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      items: orderItems,
      total: orderTotal,
      deliveryDate,
      notes: notes.trim() || undefined,
    });

    toast.success(`Advance Order created! AOT-${orderId.slice(-6).toUpperCase()}`);
    setPrintOrderId(orderId);
    
    // Reset form
    setCustomerName('');
    setCustomerPhone('');
    setDeliveryDate(new Date().toISOString().slice(0, 10));
    setNotes('');
    setOrderItems([]);
    setIsNewOrderOpen(false);
  };

  const handleCompleteOrder = async (id: string) => {
    if (confirm("Mark this order as completed and handed over to customer? This will automatically add the final amount to today's POS sales and profit.")) {
      const order = advanceOrders.find(o => o.id === id);
      if (order) {
         await createSale('branch', order.branch as any, order.items, 'cash', order.customerName, order.customerPhone, order.total);
      }
      await updateAdvanceOrderStatus(id, 'completed');
      toast.success("Order marked as completed and added to Sales History!");
    }
  };

  const handlePrint = (orderId: string) => {
    setPrintOrderId(orderId);
    setTimeout(() => {
      const printContent = document.getElementById('advance-order-print');
      if (printContent) {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <html><head><title>Advance Order</title>
            <style>
              body { font-family: 'Courier New', monospace; width: 80mm; margin: 0 auto; padding: 10px; font-size: 14px; }
              .center { text-align: center; }
              .bold { font-weight: bold; }
              .line { border-top: 1px dashed #000; margin: 5px 0; }
              table { width: 100%; border-collapse: collapse; }
              td { padding: 2px 0; }
              .right { text-align: right; }
              h2 { margin: 5px 0; font-size: 18px; }
              h3 { margin: 3px 0; font-size: 15px; }
              p { margin: 2px 0; }
              @media print { body { width: 80mm; } }
            </style>
            </head><body>${printContent.innerHTML}</body></html>
          `);
          printWindow.document.close();
          printWindow.focus();
          printWindow.onafterprint = () => printWindow.close();
          printWindow.print();
        }
      }
      setPrintOrderId(null);
    }, 300);
  };

  const renderOrderReceipt = (orderId: string) => {
    const order = advanceOrders.find(o => o.id === orderId);
    if (!order) return null;
    const aotNumber = `AOT-${order.id.slice(-6).toUpperCase()}`;
    
    return (
      <div id="advance-order-print" style={{ fontFamily: "'Courier New', monospace", width: '80mm', margin: '0 auto', padding: '10px', fontSize: '14px' }}>
        <div className="center" style={{ textAlign: 'center' }}>
          <h2 style={{ margin: '5px 0', fontSize: '18px' }}>{receiptSettings?.brandName || "BakeryOS"}</h2>
          <p style={{ margin: '2px 0', fontSize: '12px' }}>{receiptSettings?.tagline || ''}</p>
          <div style={{ borderTop: '1px dashed #000', margin: '5px 0' }} />
          <h3 style={{ margin: '3px 0', fontSize: '16px', fontWeight: 'bold' }}>ADVANCE ORDER TOKEN</h3>
          <h2 style={{ margin: '5px 0', fontSize: '24px', fontWeight: 'bold' }}>{aotNumber}</h2>
          <div style={{ borderTop: '1px dashed #000', margin: '5px 0' }} />
        </div>
        
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr><td style={{ padding: '2px 0' }}>Customer:</td><td style={{ padding: '2px 0', textAlign: 'right', fontWeight: 'bold' }}>{order.customerName}</td></tr>
            {order.customerPhone && <tr><td style={{ padding: '2px 0' }}>Phone:</td><td style={{ padding: '2px 0', textAlign: 'right' }}>{order.customerPhone}</td></tr>}
            <tr><td style={{ padding: '2px 0' }}>Branch:</td><td style={{ padding: '2px 0', textAlign: 'right' }}>{order.branch === 'branch_1' ? 'Branch 1' : 'Branch 2'}</td></tr>
            <tr><td style={{ padding: '2px 0' }}>Delivery:</td><td style={{ padding: '2px 0', textAlign: 'right', fontWeight: 'bold' }}>{order.deliveryDate}</td></tr>
            <tr><td style={{ padding: '2px 0' }}>Created:</td><td style={{ padding: '2px 0', textAlign: 'right' }}>{new Date(order.createdAt).toLocaleString()}</td></tr>
          </tbody>
        </table>
        
        <div style={{ borderTop: '1px dashed #000', margin: '5px 0' }} />
        
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #000' }}>
              <td style={{ padding: '3px 0', fontWeight: 'bold' }}>Item</td>
              <td style={{ padding: '3px 0', textAlign: 'center', fontWeight: 'bold' }}>Qty</td>
              <td style={{ padding: '3px 0', textAlign: 'right', fontWeight: 'bold' }}>Price</td>
              <td style={{ padding: '3px 0', textAlign: 'right', fontWeight: 'bold' }}>Total</td>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, idx) => {
              const product = getProductById(item.productId);
              return (
                <tr key={idx}>
                  <td style={{ padding: '2px 0', fontSize: '13px' }}>{product?.name || 'Unknown'}</td>
                  <td style={{ padding: '2px 0', textAlign: 'center' }}>{item.quantity}</td>
                  <td style={{ padding: '2px 0', textAlign: 'right' }}>{item.unitPrice}</td>
                  <td style={{ padding: '2px 0', textAlign: 'right' }}>{(item.quantity * item.unitPrice).toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        <div style={{ borderTop: '1px dashed #000', margin: '5px 0' }} />
        <table style={{ width: '100%' }}>
          <tbody>
            <tr><td style={{ fontWeight: 'bold', fontSize: '16px' }}>TOTAL:</td><td style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '16px' }}>Rs. {order.total.toLocaleString()}</td></tr>
            <tr><td>Items:</td><td style={{ textAlign: 'right' }}>{order.items.length} items ({order.items.reduce((s, i) => s + i.quantity, 0)} pcs)</td></tr>
          </tbody>
        </table>
        
        {order.notes && (
          <>
            <div style={{ borderTop: '1px dashed #000', margin: '5px 0' }} />
            <p style={{ fontSize: '12px' }}>Notes: {order.notes}</p>
          </>
        )}
        
        <div style={{ borderTop: '1px dashed #000', margin: '5px 0' }} />
        <div style={{ textAlign: 'center', fontSize: '12px' }}>
          <p>Status: {order.status.toUpperCase()}</p>
          <p>{receiptSettings?.footerMessage2 || 'Powered by GenX Systems'}</p>
        </div>
      </div>
    );
  };

  const getStatusBadge = (status: string) => {
    if (status === 'pending') return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
    if (status === 'received') return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20"><Package className="h-3 w-3 mr-1" /> Received</Badge>;
    return <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle2 className="h-3 w-3 mr-1" /> Completed</Badge>;
  };

  const renderOrderTable = (orders: typeof branchOrders, showComplete = false) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>AOT #</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Items</TableHead>
          <TableHead>Delivery</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead className="text-center">Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.length === 0 ? (
          <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No orders found</TableCell></TableRow>
        ) : orders.slice().reverse().map(order => (
          <TableRow key={order.id}>
            <TableCell className="font-mono font-bold text-primary">AOT-{order.id.slice(-6).toUpperCase()}</TableCell>
            <TableCell>
              <div>
                <p className="font-medium">{order.customerName}</p>
                {order.customerPhone && <p className="text-xs text-muted-foreground">{order.customerPhone}</p>}
              </div>
            </TableCell>
            <TableCell>
              <div className="space-y-0.5">
                {order.items.slice(0, 2).map((item, idx) => {
                  const p = getProductById(item.productId);
                  return <p key={idx} className="text-xs">{p?.name || '?'} × {item.quantity}</p>;
                })}
                {order.items.length > 2 && <p className="text-xs text-muted-foreground">+{order.items.length - 2} more</p>}
              </div>
            </TableCell>
            <TableCell>
              <p className="font-medium">{order.deliveryDate}</p>
              <p className="text-xs text-muted-foreground">Created: {new Date(order.createdAt).toLocaleDateString()}</p>
            </TableCell>
            <TableCell className="text-right font-bold">Rs. {order.total.toLocaleString()}</TableCell>
            <TableCell className="text-center">{getStatusBadge(order.status)}</TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-1">
                <Button size="sm" variant="outline" onClick={() => {
                  if (order.status === 'completed') {
                    setCompletedReceiptOrder(order);
                  } else {
                    handlePrint(order.id);
                  }
                }}>
                  <Printer className="h-3 w-3 mr-1" /> Print
                </Button>
                {showComplete && order.status === 'received' && (
                  <Button size="sm" onClick={() => handleCompleteOrder(order.id)}>
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Complete
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Advance Orders — {branchLabel}</h1>
          <p className="text-sm text-muted-foreground">Create and manage advance/pre-orders for customers</p>
        </div>
        <div className="flex gap-2 items-center">
          {pendingOrders.length > 0 && (
            <Badge variant="secondary" className="text-amber-600 bg-amber-500/10 border-amber-500/20 text-sm px-3 py-1">
              <Clock className="h-4 w-4 mr-1" /> {pendingOrders.length} Pending
            </Badge>
          )}
          {receivedOrders.length > 0 && (
            <Badge variant="secondary" className="text-blue-600 bg-blue-500/10 border-blue-500/20 text-sm px-3 py-1">
              <Package className="h-4 w-4 mr-1" /> {receivedOrders.length} Ready
            </Badge>
          )}
          <Dialog open={isNewOrderOpen} onOpenChange={setIsNewOrderOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" /> New Advance Order
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Advance Order — {branchLabel}</DialogTitle>
                <DialogDescription>Fill in customer details and add items to the order.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Customer Name *</Label>
                    <Input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="e.g. Ahmed Ali" />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="e.g. 0300-1234567" />
                  </div>
                  <div className="space-y-2">
                    <Label>Delivery Date *</Label>
                    <Input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Special instructions..." />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <Label className="text-sm font-bold mb-2 block">Add Products</Label>
                  <div className="flex gap-2 items-end">
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs">Search & Select Product</Label>
                      <Input 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                        placeholder="Search products..." 
                      />
                      {searchTerm && filteredProducts.length > 0 && (
                        <div className="max-h-32 overflow-y-auto border rounded-md bg-background">
                          {filteredProducts.slice(0, 8).map(p => (
                            <button
                              key={p.id}
                              className="w-full text-left px-3 py-1.5 hover:bg-muted text-sm flex justify-between"
                              onClick={() => { setSelectedProduct(p.id); setSearchTerm(p.name); }}
                            >
                              <span>{p.name}</span>
                              <span className="text-muted-foreground">Rs. {p.price}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="w-20 space-y-1">
                      <Label className="text-xs">Qty</Label>
                      <Input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} min="1" />
                    </div>
                    <Button onClick={handleAddItem} size="sm" className="mb-0.5">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {orderItems.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead className="text-center">Qty</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                          <TableHead className="text-right">Subtotal</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orderItems.map(item => {
                          const p = getProductById(item.productId);
                          return (
                            <TableRow key={item.productId}>
                              <TableCell className="font-medium">{p?.name || '?'}</TableCell>
                              <TableCell className="text-center">{item.quantity}</TableCell>
                              <TableCell className="text-right">Rs. {item.unitPrice}</TableCell>
                              <TableCell className="text-right font-bold">Rs. {(item.quantity * item.unitPrice).toLocaleString()}</TableCell>
                              <TableCell>
                                <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => handleRemoveItem(item.productId)}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        <TableRow className="bg-muted/50">
                          <TableCell colSpan={3} className="font-bold text-right">Total:</TableCell>
                          <TableCell className="text-right font-bold text-lg text-primary">Rs. {orderTotal.toLocaleString()}</TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsNewOrderOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateOrder} disabled={orderItems.length === 0 || !customerName.trim()}>
                  Create Order & Print AOT
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="pending">
            Pending ({pendingOrders.length})
          </TabsTrigger>
          <TabsTrigger value="received">
            Ready for Pickup ({receivedOrders.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedOrders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Clock className="h-5 w-5 text-amber-500" /> Pending Orders (Sent to Production)</CardTitle></CardHeader>
            <CardContent>{renderOrderTable(pendingOrders)}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="received">
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Package className="h-5 w-5 text-blue-500" /> Ready for Customer Pickup</CardTitle></CardHeader>
            <CardContent>{renderOrderTable(receivedOrders, true)}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed">
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-green-500" /> Completed Orders</CardTitle></CardHeader>
            <CardContent>{renderOrderTable(completedOrders)}</CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Hidden print area */}
      {printOrderId && (
        <div className="fixed left-[-9999px]" ref={printRef}>
          {renderOrderReceipt(printOrderId)}
        </div>
      )}

      {/* Auto-print after creating */}
      {printOrderId && (
        <Dialog open={!!printOrderId} onOpenChange={() => setPrintOrderId(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Order Created!</DialogTitle>
              <DialogDescription>Print the Advance Order Token for the customer.</DialogDescription>
            </DialogHeader>
            <div className="border rounded-lg p-4 bg-muted/30 max-h-[60vh] overflow-y-auto">
              {renderOrderReceipt(printOrderId)}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPrintOrderId(null)}>Close</Button>
              <Button onClick={() => handlePrint(printOrderId)}>
                <Printer className="h-4 w-4 mr-2" /> Print AOT
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Print Completed Order Final Bill */}
      {completedReceiptOrder && (
        <ReceiptDialog
          open={!!completedReceiptOrder}
          onClose={() => setCompletedReceiptOrder(null)}
          items={completedReceiptOrder.items.map(i => {
            const p = getProductById(i.productId);
            return { name: p?.name || 'Unknown', quantity: i.quantity, unitPrice: i.unitPrice };
          })}
          total={completedReceiptOrder.total}
          paymentMethod="cash"
          branch={completedReceiptOrder.branch}
          saleId={`AOT-${completedReceiptOrder.id.slice(-6).toUpperCase()}`}
          date={completedReceiptOrder.createdAt}
          customerName={completedReceiptOrder.customerName}
          customerPhone={completedReceiptOrder.customerPhone}
          autoPrint={true}
        />
      )}
    </div>
  );
}
