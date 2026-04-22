import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Users, Wallet, Receipt, Trash2, CheckCircle2, DollarSign, History } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';

export default function Accounts() {
  const { 
    staff, staffDeductions, salaryVouchers, 
    addStaffMember, deleteStaffMember,
    addStaffDeduction, deleteStaffDeduction,
    createSalaryVoucher, deleteSalaryVoucher,
    addExpense,
    sales, purchases, expenses, rawMaterials, ledgerEntries,
    addPurchase, createSale, clearSales, clearPurchases, clearExpenses, clearSalaryVouchers, clearStaffDeductions, addLedgerEntry, clearLedgerEntries
  } = useApp();

  const [ledgerType, setLedgerType] = useState('general');
  const [isAddEntryOpen, setIsAddEntryOpen] = useState(false);
  const [isClearOpen, setIsClearOpen] = useState(false);

  // Manual entry states
  const [manualEntry, setManualEntry] = useState({ 
    accountHead: '', 
    accountType: 'Expense' as any, 
    debit: '0', 
    credit: '0', 
    name: '', 
    station: '', 
    date: new Date().toISOString().slice(0, 10) 
  });

  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', department: '', baseSalary: '' });

  const [isAddDeductionOpen, setIsAddDeductionOpen] = useState(false);
  const [newDeduction, setNewDeduction] = useState({ staffId: '', amount: '', reason: '' });

  const handleAddStaff = async () => {
    if (!newStaff.name || !newStaff.department || !newStaff.baseSalary) {
      toast.error("Please fill all fields");
      return;
    }
    await addStaffMember({
      name: newStaff.name,
      department: newStaff.department,
      baseSalary: parseFloat(newStaff.baseSalary)
    });
    setNewStaff({ name: '', department: '', baseSalary: '' });
    setIsAddStaffOpen(false);
  };

  const handleAddDeduction = async () => {
    if (!newDeduction.staffId || !newDeduction.amount || !newDeduction.reason) {
      toast.error("Please fill all fields");
      return;
    }
    await addStaffDeduction({
      staffId: newDeduction.staffId,
      amount: parseFloat(newDeduction.amount),
      reason: newDeduction.reason,
      date: new Date().toISOString().slice(0, 10)
    });

    const member = staff.find(s => s.id === newDeduction.staffId);
    await addExpense({
      title: `Advance: ${member?.name || 'Staff'}`,
      amount: parseFloat(newDeduction.amount),
      category: 'Staff Advance',
      date: new Date().toISOString().slice(0, 10),
      branchId: 'factory'
    });

    setNewDeduction({ staffId: '', amount: '', reason: '' });
    setIsAddDeductionOpen(false);
  };

  const handlePaySalary = async (staffId: string) => {
    const member = staff.find(s => s.id === staffId);
    if (!member) return;

    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    const currentYear = new Date().getFullYear();

    // Check if already paid for this month
    const alreadyPaid = salaryVouchers.find(v => 
      v.staffId === staffId && v.month === currentMonth && v.year === currentYear
    );

    if (alreadyPaid) {
      toast.error(`Salary for ${currentMonth} ${currentYear} is already paid`);
      return;
    }

    const totalDeductions = staffDeductions
      .filter(d => d.staffId === staffId)
      .reduce((sum, d) => sum + d.amount, 0);

    const netAmount = member.baseSalary - totalDeductions;

    if (confirm(`Confirm salary payment of Rs. ${netAmount.toFixed(2)} for ${member.name} (${currentMonth} ${currentYear})?`)) {
      await createSalaryVoucher({
        staffId,
        amount: netAmount,
        month: currentMonth,
        year: currentYear,
        date: new Date().toISOString().slice(0, 10)
      });

      await addExpense({
        title: `Salary: ${member.name} (${currentMonth})`,
        amount: netAmount,
        category: 'Staff Salary',
        date: new Date().toISOString().slice(0, 10),
        branchId: 'factory'
      });
    }
  };

  const handleManualEntry = async () => {
    const debit = parseFloat(manualEntry.debit) || 0;
    const credit = parseFloat(manualEntry.credit) || 0;

    if (debit <= 0 && credit <= 0) {
      toast.error("Please enter a valid debit or credit amount");
      return;
    }

    await addLedgerEntry({
      date: manualEntry.date,
      accountHead: manualEntry.accountHead || (ledgerType === 'general' ? 'General Adjustment' : ledgerType === 'customer' ? 'Customer Adjustment' : 'Vendor Adjustment'),
      accountType: manualEntry.accountType,
      debit,
      credit,
      name: manualEntry.name,
      station: manualEntry.station,
      category: ledgerType as any
    });

    setIsAddEntryOpen(false);
    setManualEntry({ 
      accountHead: '', 
      accountType: 'Expense', 
      debit: '0', 
      credit: '0', 
      name: '', 
      station: '',
      date: new Date().toISOString().slice(0, 10) 
    });
    toast.success("Entry added to ledger from backend");
  };

  const handleClearLedger = async () => {
    if (ledgerType === 'vendor') {
      await Promise.all([clearPurchases(), clearLedgerEntries('vendor')]);
    } else if (ledgerType === 'customer') {
      await Promise.all([clearSales('all'), clearLedgerEntries('customer')]);
    } else {
      // General Ledger - Clear all financial records
      await Promise.all([
        clearSales('all'),
        clearPurchases(),
        clearExpenses(),
        clearSalaryVouchers(),
        clearStaffDeductions(),
        clearLedgerEntries('general'),
        clearLedgerEntries('customer'),
        clearLedgerEntries('vendor')
      ]);
    }
    
    setIsClearOpen(false);
    toast.success(`${ledgerType.charAt(0).toUpperCase() + ledgerType.slice(1)} ledger cleared from backend`);
  };

  const activeStaff = staff.filter(s => s.isActive);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Accounts & Staff</h1>
          <p className="text-sm text-muted-foreground">Manage bakery staff, salaries, and vouchers</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddStaffOpen} onOpenChange={setIsAddStaffOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Add Staff
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add New Staff Member</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} placeholder="e.g. Ahmad Ali" />
                </div>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select value={newStaff.department} onValueChange={val => setNewStaff({...newStaff, department: val})}>
                    <SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Kitchen">Kitchen</SelectItem>
                      <SelectItem value="Service">Service</SelectItem>
                      <SelectItem value="Counter">Counter</SelectItem>
                      <SelectItem value="Management">Management</SelectItem>
                      <SelectItem value="Delivery">Delivery</SelectItem>
                      <SelectItem value="Cleaning">Cleaning</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Monthly Base Salary (Rs.)</Label>
                  <Input type="number" value={newStaff.baseSalary} onChange={e => setNewStaff({...newStaff, baseSalary: e.target.value})} placeholder="e.g. 25000" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddStaffOpen(false)}>Cancel</Button>
                <Button onClick={handleAddStaff}>Add Member</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddDeductionOpen} onOpenChange={setIsAddDeductionOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Add Advance/Deduction
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Advance or Deduction</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Staff Member</Label>
                  <Select value={newDeduction.staffId} onValueChange={val => setNewDeduction({...newDeduction, staffId: val})}>
                    <SelectTrigger><SelectValue placeholder="Select Staff Member" /></SelectTrigger>
                    <SelectContent>
                      {activeStaff.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name} ({s.department})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Amount (Rs.)</Label>
                  <Input type="number" value={newDeduction.amount} onChange={e => setNewDeduction({...newDeduction, amount: e.target.value})} placeholder="e.g. 500" />
                </div>
                <div className="space-y-2">
                  <Label>Reason</Label>
                  <Input value={newDeduction.reason} onChange={e => setNewDeduction({...newDeduction, reason: e.target.value})} placeholder="e.g. Advance payment" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDeductionOpen(false)}>Cancel</Button>
                <Button onClick={handleAddDeduction}>Add Record</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="overview">Staff Overview</TabsTrigger>
          <TabsTrigger value="vouchers">Salary Vouchers</TabsTrigger>
          <TabsTrigger value="deductions">Deductions/Advances</TabsTrigger>
          <TabsTrigger value="ledgers">Account Ledgers</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Users className="h-5 w-5" /> Staff Directory</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-right">Base Salary</TableHead>
                    <TableHead className="text-right">Total Deductions</TableHead>
                    <TableHead className="text-right">Net Payable</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeStaff.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No staff members found</TableCell></TableRow>
                  ) : activeStaff.map(member => {
                    const totalDeductions = staffDeductions
                      .filter(d => d.staffId === member.id)
                      .reduce((sum, d) => sum + d.amount, 0);
                    
                    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
                    const currentYear = new Date().getFullYear();
                    const isPaid = salaryVouchers.find(v => 
                      v.staffId === member.id && v.month === currentMonth && v.year === currentYear
                    );

                    return (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">{member.name}</TableCell>
                        <TableCell><Badge variant="outline">{member.department}</Badge></TableCell>
                        <TableCell className="text-right">Rs. {member.baseSalary.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-destructive">-Rs. {totalDeductions.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-bold text-primary">Rs. {(member.baseSalary - totalDeductions).toFixed(2)}</TableCell>
                        <TableCell className="text-center">
                          {isPaid ? (
                            <Badge className="bg-success/10 text-success border-success/20 flex items-center gap-1 w-fit mx-auto">
                              <CheckCircle2 className="h-3 w-3" /> Paid ({currentMonth})
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Unpaid</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button size="sm" variant={isPaid ? "outline" : "default"} disabled={!!isPaid} onClick={() => handlePaySalary(member.id)}>
                              {isPaid ? "Paid" : "Pay Salary"}
                            </Button>
                            <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => {
                              if(confirm(`Are you sure you want to remove ${member.name}?`)) deleteStaffMember(member.id);
                            }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vouchers">
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Receipt className="h-5 w-5" /> Recent Salary Vouchers</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Voucher ID</TableHead>
                    <TableHead>Staff Name</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Date Paid</TableHead>
                    <TableHead className="text-right">Amount Paid</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salaryVouchers.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No vouchers found</TableCell></TableRow>
                  ) : salaryVouchers.slice().reverse().map(v => {
                    const member = staff.find(s => s.id === v.staffId);
                    return (
                      <TableRow key={v.id}>
                        <TableCell className="text-xs font-mono">{v.id}</TableCell>
                        <TableCell>{member?.name || 'Unknown'}</TableCell>
                        <TableCell>{v.month} {v.year}</TableCell>
                        <TableCell>{v.date}</TableCell>
                        <TableCell className="text-right font-semibold">Rs. {v.amount.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => deleteSalaryVoucher(v.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deductions">
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Wallet className="h-5 w-5" /> Deductions & Advances History</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff Name</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staffDeductions.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No records found</TableCell></TableRow>
                  ) : staffDeductions.slice().reverse().map(d => {
                    const member = staff.find(s => s.id === d.staffId);
                    return (
                      <TableRow key={d.id}>
                        <TableCell>{member?.name || 'Unknown'}</TableCell>
                        <TableCell>{d.reason}</TableCell>
                        <TableCell>{d.date}</TableCell>
                        <TableCell className="text-right text-destructive">-Rs. {d.amount.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => deleteStaffDeduction(d.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="ledgers">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="h-5 w-5" /> Account Ledgers
              </CardTitle>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Dialog open={isAddEntryOpen} onOpenChange={setIsAddEntryOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="h-9 gap-2">
                        <Plus className="h-4 w-4" /> Enter Detail
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Manual Ledger Entry - {ledgerType.toUpperCase()}</DialogTitle>
                        <DialogDescription>Add a manual transaction to this ledger.</DialogDescription>
                      </DialogHeader>
                      <div className="grid grid-cols-2 gap-4 py-4">
                        <div className="space-y-2 col-span-2">
                          <Label>Date</Label>
                          <Input type="date" value={manualEntry.date} onChange={e => setManualEntry({...manualEntry, date: e.target.value})} />
                        </div>
                        
                        <div className="space-y-2 col-span-2">
                          <Label>Account Head / Title</Label>
                          <Input value={manualEntry.accountHead} onChange={e => setManualEntry({...manualEntry, accountHead: e.target.value})} placeholder="e.g. Sales, Rent, Electricity" />
                        </div>

                        <div className="space-y-2">
                          <Label>Account Type</Label>
                          <Select value={manualEntry.accountType} onValueChange={v => setManualEntry({...manualEntry, accountType: v as any})}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Income">Income</SelectItem>
                              <SelectItem value="Expense">Expense</SelectItem>
                              <SelectItem value="Asset">Asset</SelectItem>
                              <SelectItem value="Liability">Liability</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Station / Location</Label>
                          <Input value={manualEntry.station} onChange={e => setManualEntry({...manualEntry, station: e.target.value})} placeholder="e.g. NWS" />
                        </div>

                        <div className="space-y-2 col-span-2 border-t pt-4">
                          <Label className="text-primary font-bold">Party / Customer / Vendor Name</Label>
                          <Input value={manualEntry.name} onChange={e => setManualEntry({...manualEntry, name: e.target.value})} placeholder="e.g. Ali Traders" />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-destructive font-bold">Debit (Out/Sale)</Label>
                          <Input type="number" value={manualEntry.debit} onChange={e => setManualEntry({...manualEntry, debit: e.target.value})} placeholder="0.00" />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-success font-bold">Credit (In/Payment)</Label>
                          <Input type="number" value={manualEntry.credit} onChange={e => setManualEntry({...manualEntry, credit: e.target.value})} placeholder="0.00" />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddEntryOpen(false)}>Cancel</Button>
                        <Button onClick={handleManualEntry}>Add to Ledger</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={isClearOpen} onOpenChange={setIsClearOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="destructive" className="h-9 gap-2">
                        <Trash2 className="h-4 w-4" /> Clear Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="text-destructive text-xl">Confirm Data Clear</DialogTitle>
                        <DialogDescription className="font-bold text-foreground">
                          WARNING: This will permanently delete ALL {ledgerType.toUpperCase()} data (Sales, Purchases, or Expenses).
                          This action cannot be undone.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/20 text-sm text-destructive font-medium">
                        Are you sure you want to proceed? All records for this ledger category will be wiped from the database.
                      </div>
                      <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setIsClearOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleClearLedger}>Yes, Clear All Data</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="h-8 w-px bg-border mx-2" />

                <div className="flex items-center gap-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase">View:</Label>
                  <Select value={ledgerType} onValueChange={setLedgerType}>
                    <SelectTrigger className="w-40 h-9 font-semibold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Ledger</SelectItem>
                      <SelectItem value="customer">Customer Ledger</SelectItem>
                      <SelectItem value="vendor">Vendor Ledger</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {ledgerType === 'vendor' && (
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Title of Account</TableHead>
                      <TableHead className="text-right">Debit (Paid)</TableHead>
                      <TableHead className="text-right">Credit (Purchases)</TableHead>
                      <TableHead className="text-right">Closing Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      const vendors = Array.from(new Set([...purchases.map(p => p.vendorName), ...ledgerEntries.filter(e => e.category === 'vendor').map(e => e.name)].filter(Boolean)));
                      if (vendors.length === 0) return <TableRow><TableCell colSpan={4} className="text-center py-8">No vendor data found</TableCell></TableRow>;
                      
                      return vendors.map(vendor => {
                        const vendorPurchases = purchases.filter(p => p.vendorName === vendor);
                        const vendorManual = ledgerEntries.filter(e => e.category === 'vendor' && e.name === vendor);
                        
                        const debit = vendorPurchases.reduce((sum, p) => sum + p.amountPaid, 0) + vendorManual.reduce((sum, e) => sum + e.debit, 0);
                        const credit = vendorPurchases.reduce((sum, p) => sum + p.totalCost, 0) + vendorManual.reduce((sum, e) => sum + e.credit, 0);
                        const balance = credit - debit;
                        
                        return (
                          <TableRow key={vendor}>
                            <TableCell className="font-medium">{vendor}</TableCell>
                            <TableCell className="text-right font-mono text-success">Rs. {debit.toLocaleString()}</TableCell>
                            <TableCell className="text-right font-mono text-destructive">Rs. {credit.toLocaleString()}</TableCell>
                            <TableCell className="text-right font-mono font-bold">Rs. {balance.toLocaleString()}</TableCell>
                          </TableRow>
                        );
                      });
                    })()}
                  </TableBody>
                </Table>
              )}

              {ledgerType === 'customer' && (
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Title of Account</TableHead>
                      <TableHead>Station</TableHead>
                      <TableHead className="text-right">Debit (Sales)</TableHead>
                      <TableHead className="text-right">Credit (Paid)</TableHead>
                      <TableHead className="text-right">Closing Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      const customers = Array.from(new Set([...sales.filter(s => s.customerName).map(s => s.customerName), ...ledgerEntries.filter(e => e.category === 'customer').map(e => e.name)].filter(Boolean)));
                      if (customers.length === 0) return <TableRow><TableCell colSpan={5} className="text-center py-8">No customer data found</TableCell></TableRow>;
                      
                      return customers.map(customer => {
                        const customerSales = sales.filter(s => s.customerName === customer);
                        const customerManual = ledgerEntries.filter(e => e.category === 'customer' && e.name === customer);

                        const debit = customerSales.reduce((sum, s) => sum + s.total, 0) + customerManual.reduce((sum, e) => sum + e.debit, 0);
                        // In this system, we consider credit paid sales as "Credit" in the ledger
                        const credit = customerSales.filter(s => s.paymentMethod !== 'credit' || s.isCreditPaid).reduce((sum, s) => sum + s.total, 0) + customerManual.reduce((sum, e) => sum + e.credit, 0);
                        const balance = debit - credit;
                        
                        const station = customerManual.length > 0 ? customerManual[0].station : 'NWS';
                        
                        return (
                          <TableRow key={customer as string}>
                            <TableCell className="font-medium">{customer}</TableCell>
                            <TableCell><Badge variant="outline" className="text-[10px]">NWS</Badge></TableCell>
                            <TableCell className="text-right font-mono text-destructive">Rs. {debit.toLocaleString()}</TableCell>
                            <TableCell className="text-right font-mono text-success">Rs. {credit.toLocaleString()}</TableCell>
                            <TableCell className="text-right font-mono font-bold">Rs. {balance.toLocaleString()}</TableCell>
                          </TableRow>
                        );
                      });
                    })()}
                  </TableBody>
                </Table>
              )}

              {ledgerType === 'general' && (
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Account Head</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Credit</TableHead>
                      <TableHead className="text-right">Closing Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      const totalSales = sales.reduce((sum, s) => sum + s.total, 0);
                      const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
                      const totalPurchases = purchases.reduce((sum, p) => sum + p.totalCost, 0);
                      const totalSalaries = salaryVouchers.reduce((sum, v) => sum + v.amount, 0);
                      const totalAdvances = staffDeductions.reduce((sum, d) => sum + d.amount, 0);
                      const totalCustomerCredit = sales.filter(s => s.paymentMethod === 'credit' && !s.isCreditPaid).reduce((sum, s) => sum + s.total, 0);
                      const totalVendorPayable = purchases.reduce((sum, p) => sum + (p.totalCost - p.amountPaid), 0);

                      const heads = [
                        { name: 'Sales Income', type: 'Income', debit: ledgerEntries.filter(e => e.category === 'general' && e.accountHead === 'Sales Income').reduce((sum, e) => sum + e.debit, 0), credit: totalSales + ledgerEntries.filter(e => e.category === 'general' && e.accountHead === 'Sales Income').reduce((sum, e) => sum + e.credit, 0), bal: totalSales, color: 'text-success' },
                        { name: 'Operating Expenses', type: 'Expense', debit: totalExpenses + ledgerEntries.filter(e => e.category === 'general' && e.accountHead === 'Operating Expenses').reduce((sum, e) => sum + e.debit, 0), credit: ledgerEntries.filter(e => e.category === 'general' && e.accountHead === 'Operating Expenses').reduce((sum, e) => sum + e.credit, 0), bal: totalExpenses, color: 'text-destructive' },
                        { name: 'Raw Material Purchases', type: 'Expense', debit: totalPurchases + ledgerEntries.filter(e => e.category === 'general' && e.accountHead === 'Raw Material Purchases').reduce((sum, e) => sum + e.debit, 0), credit: 0, bal: totalPurchases, color: 'text-destructive' },
                        { name: 'Staff Salaries', type: 'Expense', debit: totalSalaries, credit: 0, bal: totalSalaries, color: 'text-destructive' },
                        { name: 'Staff Advances', type: 'Asset', debit: totalAdvances, credit: 0, bal: totalAdvances, color: 'text-primary' },
                        { name: 'Accounts Receivable', type: 'Asset', debit: totalCustomerCredit, credit: 0, bal: totalCustomerCredit, color: 'text-primary' },
                        { name: 'Accounts Payable', type: 'Liability', debit: 0, credit: totalVendorPayable, bal: totalVendorPayable, color: 'text-destructive' },
                        ...ledgerEntries.filter(e => e.category === 'general' && !['Sales Income', 'Operating Expenses', 'Raw Material Purchases'].includes(e.accountHead)).map(e => ({
                          name: e.accountHead, type: e.accountType, debit: e.debit, credit: e.credit, bal: Math.abs(e.debit - e.credit), color: e.accountType === 'Income' ? 'text-success' : 'text-destructive'
                        }))
                      ];

                      return heads.map((head, idx) => (
                        <TableRow key={`${head.name}-${idx}`}>
                          <TableCell className="font-semibold">{head.name}</TableCell>
                          <TableCell><Badge variant="outline">{head.type}</Badge></TableCell>
                          <TableCell className="text-right font-mono">Rs. {head.debit.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-mono">Rs. {head.credit.toLocaleString()}</TableCell>
                          <TableCell className={`text-right font-mono font-bold ${head.color}`}>Rs. {(head.credit - head.debit || head.debit - head.credit).toLocaleString()}</TableCell>
                        </TableRow>
                      ));
                    })()}
                  </TableBody>
                  <tfoot className="bg-muted/20 font-bold">
                    <TableRow>
                      <TableCell colSpan={2}>Grand Totals</TableCell>
                      <TableCell className="text-right font-mono">
                        Rs. {(expenses.reduce((sum, e) => sum + e.amount, 0) + purchases.reduce((sum, p) => sum + p.totalCost, 0) + salaryVouchers.reduce((sum, v) => sum + v.amount, 0) + staffDeductions.reduce((sum, d) => sum + d.amount, 0)).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        Rs. {sales.reduce((sum, s) => sum + s.total, 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono text-primary">
                        Rs. {(sales.reduce((sum, s) => sum + s.total, 0) - (expenses.reduce((sum, e) => sum + e.amount, 0) + purchases.reduce((sum, p) => sum + p.totalCost, 0) + salaryVouchers.reduce((sum, v) => sum + v.amount, 0))).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  </tfoot>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
