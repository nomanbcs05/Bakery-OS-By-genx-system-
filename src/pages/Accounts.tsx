import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
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
    addExpense
  } = useApp();

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
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="overview">Staff Overview</TabsTrigger>
          <TabsTrigger value="vouchers">Salary Vouchers</TabsTrigger>
          <TabsTrigger value="deductions">Deductions/Advances</TabsTrigger>
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
      </Tabs>
    </div>
  );
}
