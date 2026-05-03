import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Printer, CheckCircle2, Clock, Package, Bell, Eye } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';

export default function AdvanceOrdersProduction() {
  const { 
    advanceOrders, updateAdvanceOrderStatus, getProductById, receiptSettings 
  } = useApp();

  const [viewOrder, setViewOrder] = useState<string | null>(null);

  const pendingOrders = advanceOrders.filter(o => o.status === 'pending');
  const receivedOrders = advanceOrders.filter(o => o.status === 'received');
  const completedOrders = advanceOrders.filter(o => o.status === 'completed');

  const handleReceiveOrder = async (id: string) => {
    if (confirm("Mark this order as received/produced? The branch will be notified.")) {
      await updateAdvanceOrderStatus(id, 'received');
      toast.success("Order marked as received! Branch has been notified.");
    }
  };

  const handlePrint = (orderId: string) => {
    const order = advanceOrders.find(o => o.id === orderId);
    if (!order) return;

    const aotNumber = `AOT-${order.id.slice(-6).toUpperCase()}`;
    const itemsHtml = order.items.map(item => {
      const p = getProductById(item.productId);
      return `<tr>
        <td style="padding:3px 0;font-size:13px">${p?.name || 'Unknown'}</td>
        <td style="padding:3px 0;text-align:center">${item.quantity}</td>
        <td style="padding:3px 0;text-align:right">${item.unitPrice}</td>
        <td style="padding:3px 0;text-align:right">${(item.quantity * item.unitPrice).toLocaleString()}</td>
      </tr>`;
    }).join('');

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html><head><title>AOT ${aotNumber}</title>
        <style>
          body { font-family: 'Courier New', monospace; width: 80mm; margin: 0 auto; padding: 10px; font-size: 14px; }
          .center { text-align: center; }
          .line { border-top: 1px dashed #000; margin: 5px 0; }
          table { width: 100%; border-collapse: collapse; }
          @media print { body { width: 80mm; } }
        </style></head>
        <body>
          <div class="center">
            <h2 style="margin:5px 0;font-size:18px">${receiptSettings?.brandName || "BakeryOS"}</h2>
            <p style="margin:2px 0;font-size:12px">${receiptSettings?.tagline || ''}</p>
            <div class="line"></div>
            <h3 style="font-size:16px;margin:3px 0">ADVANCE ORDER - PRODUCTION</h3>
            <h2 style="font-size:24px;margin:5px 0;font-weight:bold">${aotNumber}</h2>
            <div class="line"></div>
          </div>
          <table>
            <tr><td>Customer:</td><td style="text-align:right;font-weight:bold">${order.customerName}</td></tr>
            ${order.customerPhone ? `<tr><td>Phone:</td><td style="text-align:right">${order.customerPhone}</td></tr>` : ''}
            <tr><td>Branch:</td><td style="text-align:right">${order.branch === 'branch_1' ? 'Branch 1' : 'Branch 2'}</td></tr>
            <tr><td>Delivery:</td><td style="text-align:right;font-weight:bold">${order.deliveryDate}</td></tr>
            <tr><td>Status:</td><td style="text-align:right;font-weight:bold">${order.status.toUpperCase()}</td></tr>
          </table>
          <div class="line"></div>
          <table>
            <tr style="border-bottom:1px solid #000">
              <td style="font-weight:bold;padding:3px 0">Item</td>
              <td style="font-weight:bold;text-align:center;padding:3px 0">Qty</td>
              <td style="font-weight:bold;text-align:right;padding:3px 0">Price</td>
              <td style="font-weight:bold;text-align:right;padding:3px 0">Total</td>
            </tr>
            ${itemsHtml}
          </table>
          <div class="line"></div>
          <table>
            <tr><td style="font-weight:bold;font-size:16px">TOTAL:</td><td style="text-align:right;font-weight:bold;font-size:16px">Rs. ${order.total.toLocaleString()}</td></tr>
            <tr><td>Items:</td><td style="text-align:right">${order.items.length} items (${order.items.reduce((s, i) => s + i.quantity, 0)} pcs)</td></tr>
          </table>
          ${order.notes ? `<div class="line"></div><p style="font-size:12px">Notes: ${order.notes}</p>` : ''}
          <div class="line"></div>
          <div class="center" style="font-size:12px">
            <p>${receiptSettings?.footerMessage2 || 'Powered by GenX Systems'}</p>
          </div>
        </body></html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.onafterprint = () => printWindow.close();
      printWindow.print();
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'pending') return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
    if (status === 'received') return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20"><Package className="h-3 w-3 mr-1" /> Received</Badge>;
    return <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle2 className="h-3 w-3 mr-1" /> Completed</Badge>;
  };

  const selectedOrder = viewOrder ? advanceOrders.find(o => o.id === viewOrder) : null;

  const renderOrderTable = (orders: typeof advanceOrders, showReceive = false) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>AOT #</TableHead>
          <TableHead>Branch</TableHead>
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
          <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No orders found</TableCell></TableRow>
        ) : orders.slice().reverse().map(order => (
          <TableRow key={order.id} className={order.status === 'pending' ? 'bg-amber-50/50 dark:bg-amber-950/10' : ''}>
            <TableCell className="font-mono font-bold text-primary">AOT-{order.id.slice(-6).toUpperCase()}</TableCell>
            <TableCell><Badge variant="outline">{order.branch === 'branch_1' ? 'B1' : 'B2'}</Badge></TableCell>
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
              <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
            </TableCell>
            <TableCell className="text-right font-bold">Rs. {order.total.toLocaleString()}</TableCell>
            <TableCell className="text-center">{getStatusBadge(order.status)}</TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-1">
                <Button size="sm" variant="outline" onClick={() => setViewOrder(order.id)}>
                  <Eye className="h-3 w-3 mr-1" /> View
                </Button>
                <Button size="sm" variant="outline" onClick={() => handlePrint(order.id)}>
                  <Printer className="h-3 w-3" />
                </Button>
                {showReceive && order.status === 'pending' && (
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => handleReceiveOrder(order.id)}>
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Receive
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
          <h1 className="text-2xl font-bold text-foreground">Advance Orders — Production</h1>
          <p className="text-sm text-muted-foreground">View and manage advance orders from branches</p>
        </div>
        <div className="flex gap-2 items-center">
          {pendingOrders.length > 0 && (
            <Badge variant="destructive" className="text-sm px-3 py-1 animate-pulse">
              <Bell className="h-4 w-4 mr-1" /> {pendingOrders.length} New Order{pendingOrders.length > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </div>

      {/* Notification Banner for new orders */}
      {pendingOrders.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/10">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Bell className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-amber-800 dark:text-amber-200">
                  {pendingOrders.length} Advance Order{pendingOrders.length > 1 ? 's' : ''} Awaiting Production
                </p>
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  {pendingOrders.map(o => `AOT-${o.id.slice(-6).toUpperCase()}`).join(', ')}
                </p>
              </div>
              <Button variant="outline" className="border-amber-500/50 text-amber-700" onClick={() => {
                pendingOrders.forEach(o => handlePrint(o.id));
              }}>
                <Printer className="h-4 w-4 mr-2" /> Print All
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="pending">
            <Bell className="h-4 w-4 mr-1" /> New Orders ({pendingOrders.length})
          </TabsTrigger>
          <TabsTrigger value="received">
            Produced ({receivedOrders.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedOrders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Clock className="h-5 w-5 text-amber-500" /> Orders to Produce</CardTitle></CardHeader>
            <CardContent>{renderOrderTable(pendingOrders, true)}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="received">
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Package className="h-5 w-5 text-blue-500" /> Produced & Sent to Branch</CardTitle></CardHeader>
            <CardContent>{renderOrderTable(receivedOrders)}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed">
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-green-500" /> Completed Orders</CardTitle></CardHeader>
            <CardContent>{renderOrderTable(completedOrders)}</CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Order Detail Dialog */}
      <Dialog open={!!viewOrder} onOpenChange={() => setViewOrder(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Order Detail — AOT-{selectedOrder?.id.slice(-6).toUpperCase()}
            </DialogTitle>
            <DialogDescription>Full details of the advance order.</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Customer:</span> <span className="font-bold">{selectedOrder.customerName}</span></div>
                <div><span className="text-muted-foreground">Phone:</span> <span>{selectedOrder.customerPhone || 'N/A'}</span></div>
                <div><span className="text-muted-foreground">Branch:</span> <span>{selectedOrder.branch === 'branch_1' ? 'Branch 1' : 'Branch 2'}</span></div>
                <div><span className="text-muted-foreground">Delivery:</span> <span className="font-bold">{selectedOrder.deliveryDate}</span></div>
                <div><span className="text-muted-foreground">Status:</span> {getStatusBadge(selectedOrder.status)}</div>
                <div><span className="text-muted-foreground">Created:</span> <span>{new Date(selectedOrder.createdAt).toLocaleString()}</span></div>
              </div>
              {selectedOrder.notes && (
                <div className="bg-muted/50 rounded p-3 text-sm">
                  <span className="font-bold">Notes:</span> {selectedOrder.notes}
                </div>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedOrder.items.map((item, idx) => {
                    const p = getProductById(item.productId);
                    return (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{p?.name || 'Unknown'}</TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right">Rs. {item.unitPrice}</TableCell>
                        <TableCell className="text-right font-bold">Rs. {(item.quantity * item.unitPrice).toLocaleString()}</TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow className="bg-muted/30">
                    <TableCell colSpan={3} className="text-right font-bold">Total:</TableCell>
                    <TableCell className="text-right font-bold text-lg text-primary">Rs. {selectedOrder.total.toLocaleString()}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewOrder(null)}>Close</Button>
            {selectedOrder && (
              <Button variant="outline" onClick={() => handlePrint(selectedOrder.id)}>
                <Printer className="h-4 w-4 mr-2" /> Print AOT
              </Button>
            )}
            {selectedOrder?.status === 'pending' && (
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => { handleReceiveOrder(selectedOrder.id); setViewOrder(null); }}>
                <CheckCircle2 className="h-4 w-4 mr-2" /> Mark as Received
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
