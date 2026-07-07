import { safeLower } from "../lib/utils";
import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Banknote, Search, FileDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import ReceiptDialog from '@/components/ReceiptDialog';
import { Navigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { exportToPDF, exportToExcel } from '@/utils/exportUtils';
import type { Sale } from '@/types';

export default function CreditsPage() {
  const { currentUser, sales, getProductById, payCreditSale } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustName, setSelectedCustName] = useState<string | null>(null);
  const [isCustDetailOpen, setIsCustDetailOpen] = useState(false);
  const [custDetailStartDate, setCustDetailStartDate] = useState('');
  const [custDetailEndDate, setCustDetailEndDate] = useState('');

  if (!currentUser) return <Navigate to="/login" replace />;

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

  const handlePayFromLedger = async (sale: any) => {
    await handlePay(sale);
    toast.success(`Payment recorded for Rs. ${sale.total}`);
    // If no more unpaid sales for this customer exist, close the modal
    const key = safeLower(selectedCustName || '').trim();
    const remaining = sales.filter(
      s => s.paymentMethod === 'credit' && 
      !s.isCreditPaid && 
      s.customerName && 
      safeLower(s.customerName).trim() === key && 
      s.id !== sale.id
    );
    if (remaining.length === 0) {
      setIsCustDetailOpen(false);
    }
  };

  // Group unpaid credit sales by customer name (case-insensitive)
  const customerGroups: {
    [key: string]: {
      name: string;
      phone: string;
      sales: Sale[];
      totalOutstanding: number;
      lastDate: string;
      itemsList: string[];
    }
  } = {};

  sales.forEach(s => {
    if (s.paymentMethod === 'credit' && !s.isCreditPaid && s.customerName) {
      const key = safeLower(s.customerName).trim();
      if (!customerGroups[key]) {
        customerGroups[key] = {
          name: s.customerName, // Keep original case
          phone: s.customerPhone || 'N/A',
          sales: [],
          totalOutstanding: 0,
          lastDate: s.date,
          itemsList: []
        };
      }
      customerGroups[key].sales.push(s);
      customerGroups[key].totalOutstanding += s.total;
      
      // Update lastDate if this one is newer
      if (new Date(s.date) > new Date(customerGroups[key].lastDate)) {
        customerGroups[key].lastDate = s.date;
      }
      
      // Add products to itemsList
      s.items.forEach(item => {
        const pName = getProductById(item.productId)?.name || 'Unknown';
        if (!customerGroups[key].itemsList.includes(pName)) {
          customerGroups[key].itemsList.push(pName);
        }
      });
    }
  });

  // Filter the grouped customers by search term
  const groupedCredits = Object.values(customerGroups).filter(c => 
    safeLower(c.name).includes(safeLower(searchTerm)) || 
    c.phone.includes(searchTerm)
  );

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
                <TableHead>Last Credit Date</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Total Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groupedCredits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No unpaid credit records found
                  </TableCell>
                </TableRow>
              ) : (
                groupedCredits.map((customer) => (
                  <TableRow 
                    key={customer.name} 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => {
                      setSelectedCustName(customer.name);
                      setCustDetailStartDate('');
                      setCustDetailEndDate('');
                      setIsCustDetailOpen(true);
                    }}
                  >
                    <TableCell className="font-bold text-primary hover:underline">
                      {customer.name}
                    </TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell>{new Date(customer.lastDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="max-w-[200px] truncate text-xs text-muted-foreground">
                        {customer.itemsList.join(', ')}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold text-destructive">
                      Rs. {customer.totalOutstanding.toFixed(0)}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="border-primary/20 hover:bg-primary/5 text-primary"
                          onClick={() => {
                            setSelectedCustName(customer.name);
                            setCustDetailStartDate('');
                            setCustDetailEndDate('');
                            setIsCustDetailOpen(true);
                          }}
                        >
                          View Ledger
                        </Button>
                        <Button 
                          size="sm" 
                          variant="default"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={async () => {
                            if (confirm(`Mark all credits (Rs. ${customer.totalOutstanding.toFixed(0)}) as paid for ${customer.name}?`)) {
                              for (const sale of customer.sales) {
                                await payCreditSale(sale.id);
                              }
                              toast.success(`Cleared all credit for ${customer.name}`);
                            }
                          }}
                        >
                          <Banknote className="h-4 w-4 mr-2" /> Pay All
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Customer Detailed Statement Dialog */}
      <Dialog open={isCustDetailOpen} onOpenChange={setIsCustDetailOpen}>
        <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden bg-background">
          <DialogHeader className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-bold text-white">
                  Customer Detailed Statement
                </DialogTitle>
                <DialogDescription className="text-indigo-100 text-sm mt-0.5">
                  Account Ledger statement for <span className="font-bold underline">{selectedCustName}</span>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="px-6 py-5 space-y-6 max-h-[80vh] overflow-y-auto">
            {(() => {
              if (!selectedCustName) return null;
              
              const key = safeLower(selectedCustName).trim();
              const group = customerGroups[key];
              if (!group) {
                return (
                  <div className="text-center py-8 text-muted-foreground">
                    No transactions found for this customer
                  </div>
                );
              }

              // Filter transactions by date
              const filteredSales = group.sales.filter(sale => {
                if (custDetailStartDate || custDetailEndDate) {
                  const dateStr = sale.date.split('T')[0];
                  if (custDetailStartDate && dateStr < custDetailStartDate) return false;
                  if (custDetailEndDate && dateStr > custDetailEndDate) return false;
                }
                return true;
              }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

              const totalDebit = group.totalOutstanding;
              const totalCredit = 0; // Credit paid is 0 for currently unpaid sales in this list
              const balance = totalDebit - totalCredit;

              const modalDebit = filteredSales.reduce((sum, s) => sum + s.total, 0);
              const modalCredit = 0;
              const modalBalance = modalDebit - modalCredit;

              const station = group.sales[0]?.branch === 'branch_1' 
                ? 'Branch 1' 
                : group.sales[0]?.branch === 'branch_2' 
                ? 'Branch 2' 
                : 'Factory Gate';

              const exportSingleCustomer = (format: 'pdf' | 'excel') => {
                const title = `Statement of Account - ${selectedCustName}`;
                const fileBaseName = `statement_${(selectedCustName || '').toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

                if (format === 'pdf') {
                  const headers = ['Date', 'Details / Products', 'Debit (Sales)', 'Credit (Paid)', 'Balance'];
                  let runningBal = 0;
                  const pdfData = filteredSales.map(s => {
                    runningBal += s.total;
                    const itemsText = s.items.map(i => getProductById(i.productId)?.name || 'Unknown').join(', ');
                    return [
                      `${new Date(s.date).toLocaleDateString()} ${new Date(s.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
                      `POS Credit Sale - ${itemsText}`,
                      `Rs. ${s.total.toLocaleString()}`,
                      `Rs. 0`,
                      `Rs. ${runningBal.toLocaleString()}`
                    ];
                  });
                  pdfData.push([]);
                  pdfData.push(['', 'TOTAL DEBIT:', `Rs. ${modalDebit.toLocaleString()}`, '', '']);
                  pdfData.push(['', 'TOTAL CREDIT:', `Rs. ${modalCredit.toLocaleString()}`, '', '']);
                  pdfData.push(['', 'CLOSING BALANCE:', `Rs. ${modalBalance.toLocaleString()}`, '', '']);

                  exportToPDF(title, headers, pdfData, fileBaseName);
                } else {
                  let runningBal = 0;
                  const excelData = filteredSales.map(s => {
                    runningBal += s.total;
                    const itemsText = s.items.map(i => getProductById(i.productId)?.name || 'Unknown').join(', ');
                    return {
                      'Date': `${new Date(s.date).toLocaleDateString()} ${new Date(s.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
                      'Details': `POS Credit Sale - ${itemsText}`,
                      'Debit (Sales)': s.total,
                      'Credit (Paid)': 0,
                      'Running Balance': runningBal
                    };
                  });
                  excelData.push({
                    'Date': 'TOTAL DEBIT:',
                    'Details': modalDebit,
                    'Debit (Sales)': 'TOTAL CREDIT:',
                    'Credit (Paid)': modalCredit,
                    'Running Balance': `BALANCE: ${modalBalance}`
                  } as any);

                  exportToExcel(excelData, fileBaseName, 'Customer Ledger');
                }
                toast.success(`Exported statement for ${selectedCustName}`);
              };

              return (
                <>
                  {/* Customer Info & Summary Row */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-muted/40 p-4 rounded-lg border flex flex-col justify-center">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">City/Station</span>
                      <span className="text-lg font-bold text-foreground mt-1">{station}</span>
                    </div>
                    <div className="bg-destructive/5 dark:bg-destructive/10 p-4 rounded-lg border border-destructive/10 flex flex-col justify-center">
                      <span className="text-[10px] uppercase font-bold text-destructive tracking-wider">Total Sales (Debit)</span>
                      <span className="text-xl font-extrabold text-destructive font-mono mt-1">Rs. {totalDebit.toLocaleString()}</span>
                    </div>
                    <div className="bg-success/5 dark:bg-success/10 p-4 rounded-lg border border-success/10 flex flex-col justify-center">
                      <span className="text-[10px] uppercase font-bold text-success tracking-wider">Total Paid (Credit)</span>
                      <span className="text-xl font-extrabold text-success font-mono mt-1">Rs. {totalCredit.toLocaleString()}</span>
                    </div>
                    <div className="bg-indigo-50 dark:bg-indigo-950/30 p-4 rounded-lg border border-indigo-100 dark:border-indigo-900 flex flex-col justify-center">
                      <span className="text-[10px] uppercase font-bold text-indigo-700 dark:text-indigo-300 tracking-wider">Outstanding Balance</span>
                      <span className="text-xl font-extrabold text-indigo-700 dark:text-indigo-300 font-mono mt-1">Rs. {balance.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Filter & Export Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-4 bg-muted/30 p-3 rounded-lg border">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold uppercase text-muted-foreground">From:</span>
                        <input
                          type="date"
                          value={custDetailStartDate}
                          onChange={e => setCustDetailStartDate(e.target.value)}
                          className="h-8 px-2 text-xs w-32 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold uppercase text-muted-foreground">To:</span>
                        <input
                          type="date"
                          value={custDetailEndDate}
                          onChange={e => setCustDetailEndDate(e.target.value)}
                          className="h-8 px-2 text-xs w-32 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      {(custDetailStartDate || custDetailEndDate) && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => { setCustDetailStartDate(''); setCustDetailEndDate(''); }}
                          className="h-8 text-xs text-muted-foreground hover:text-foreground"
                        >
                          Clear Filter
                        </Button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" className="h-8 text-xs gap-1 border-primary/20 hover:bg-primary/5 shadow-sm" onClick={() => exportSingleCustomer('pdf')}>
                        <FileDown className="h-3.5 w-3.5 text-primary" /> Export PDF
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 text-xs gap-1 border-primary/20 hover:bg-primary/5 shadow-sm" onClick={() => exportSingleCustomer('excel')}>
                        <FileDown className="h-3.5 w-3.5 text-primary" /> Export Excel
                      </Button>
                    </div>
                  </div>

                  {/* Table View */}
                  <div className="border rounded-lg overflow-hidden shadow-sm bg-background">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead className="w-[150px]">Date &amp; Time</TableHead>
                          <TableHead>Details / Purchased Products</TableHead>
                          <TableHead className="text-right w-[120px]">Debit (Sales)</TableHead>
                          <TableHead className="text-right w-[120px]">Credit (Paid)</TableHead>
                          <TableHead className="text-right w-[120px]">Balance</TableHead>
                          <TableHead className="text-right w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSales.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                              No transactions found for the selected period
                            </TableCell>
                          </TableRow>
                        ) : (() => {
                          let rBal = 0;
                          return filteredSales.map((sale) => {
                            rBal += sale.total;
                            const itemsText = sale.items.map(i => getProductById(i.productId)?.name || 'Unknown').join(', ');
                            return (
                              <TableRow key={sale.id}>
                                <TableCell className="text-xs font-mono">
                                  {new Date(sale.date).toLocaleDateString()}<br/>
                                  <span className="text-muted-foreground text-[10px]">
                                    {new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                  </span>
                                </TableCell>
                                <TableCell className="font-medium">
                                  <div className="flex flex-col">
                                    <span className="text-xs text-foreground font-semibold">POS Credit Sale</span>
                                    <span className="text-[10px] text-muted-foreground mt-0.5">{itemsText}</span>
                                    <Badge variant="outline" className="w-fit text-[8px] h-3.5 px-1.5 mt-1">
                                      {sale.branch === 'branch_1' ? 'Branch 1' : sale.branch === 'branch_2' ? 'Branch 2' : 'Factory Gate'}
                                    </Badge>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right font-mono text-destructive text-xs">Rs. {sale.total.toLocaleString()}</TableCell>
                                <TableCell className="text-right font-mono text-success text-xs">Rs. 0</TableCell>
                                <TableCell className="text-right font-mono font-bold text-xs">Rs. {rBal.toLocaleString()}</TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-1.5">
                                    <Button 
                                      size="sm"
                                      variant="default"
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7 px-2.5"
                                      onClick={() => handlePayFromLedger(sale)}
                                    >
                                      Pay
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          });
                        })()}
                      </TableBody>
                    </Table>
                  </div>
                </>
              );
            })()}
          </div>

          <DialogFooter className="bg-slate-50 dark:bg-slate-900 px-6 py-3 border-t">
            <Button size="sm" onClick={() => setIsCustDetailOpen(false)} className="rounded-lg px-5">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
