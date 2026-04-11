import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Banknote, Printer, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import ReceiptDialog from '@/components/ReceiptDialog';
import { Navigate } from 'react-router-dom';

export default function CreditsPage() {
  const { currentUser, sales, getProductById, payCreditSale } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  if (!currentUser) return <Navigate to="/login" replace />;

  const creditSales = sales.filter(s => 
    s.paymentMethod === 'credit' && 
    !s.isCreditPaid &&
    (s.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     s.customerPhone?.includes(searchTerm))
  );

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

  const handlePay = async (sale: any) => {
    // Generate receipt data first
    const receiptItems = sale.items.map((i: any) => ({
      name: getProductById(i.productId)?.name || 'Unknown',
      quantity: i.quantity,
      unitPrice: i.unitPrice
    }));

    setReceiptData({
      open: true,
      items: receiptItems,
      total: sale.total,
      paymentMethod: 'cash', // Payment being made now
      saleId: sale.id,
      date: new Date().toISOString()
    });

    await payCreditSale(sale.id);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Credits (Baki)</h1>
          <p className="text-sm text-muted-foreground">Manage unpaid customer credit records</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or phone..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4" /> Unpaid Credits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Total Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {creditSales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No unpaid credit records found
                  </TableCell>
                </TableRow>
              ) : (
                creditSales.reverse().map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">{sale.customerName || 'N/A'}</TableCell>
                    <TableCell>{sale.customerPhone || 'N/A'}</TableCell>
                    <TableCell>{sale.date}</TableCell>
                    <TableCell>
                      <div className="max-w-[200px] truncate text-xs">
                        {sale.items.map(i => getProductById(i.productId)?.name).join(', ')}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold text-destructive">
                      Rs. {sale.total.toFixed(0)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        size="sm" 
                        variant="default"
                        className="bg-primary hover:bg-primary/90"
                        onClick={() => handlePay(sale)}
                      >
                        <Banknote className="h-4 w-4 mr-2" /> Pay
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ReceiptDialog 
        open={receiptData.open}
        onClose={() => setReceiptData(prev => ({ ...prev, open: false }))}
        items={receiptData.items}
        total={receiptData.total}
        paymentMethod="CASH (PAID CREDIT)"
        branch="FACTORY"
        saleId={receiptData.saleId}
        date={receiptData.date}
        autoPrint={true}
      />
    </div>
  );
}
