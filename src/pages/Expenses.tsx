import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Receipt, Filter, Building2, Edit, Trash2 } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const categories = ['Raw Materials', 'Utilities', 'Rent', 'Salaries', 'Equipment', 'Transport', 'Marketing', 'Maintenance', 'Other'];

export default function Expenses() {
  const { currentUser, selectedProfile, expenses, addExpense, updateExpense, deleteExpense, loadModuleData } = useApp();

  useEffect(() => {
    loadModuleData('finance');
  }, [loadModuleData]);

  if (!currentUser || !selectedProfile) return <Navigate to="/login" replace />;
  
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Raw Materials');
  const [branchFilter, setBranchFilter] = useState<'all' | 'branch_1' | 'branch_2' | 'factory'>('all');

  // Edit Expense States
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editExpenseItem, setEditExpenseItem] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState('Raw Materials');
  const [editBranchId, setEditBranchId] = useState<'branch_1' | 'branch_2' | 'factory'>('factory');

  const handleEditClick = (e: any) => {
    setEditExpenseItem(e);
    setEditTitle(e.title);
    setEditAmount(e.amount.toString());
    setEditCategory(e.category);
    setEditBranchId(e.branchId || 'factory');
    setIsEditOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editExpenseItem || !editTitle || !editAmount || parseFloat(editAmount) <= 0) {
      toast.error("Please fill all fields with valid data");
      return;
    }
    updateExpense(editExpenseItem.id, {
      title: editTitle,
      amount: parseFloat(editAmount),
      category: editCategory,
      branchId: editBranchId
    });
    setIsEditOpen(false);
    setEditExpenseItem(null);
    toast.success("Expense updated successfully");
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this expense? This action cannot be undone.")) {
      deleteExpense(id);
      toast.success("Expense deleted successfully");
    }
  };

  // For admin to choose, or auto-set for staff
  const initialBranch = selectedProfile.role === 'branch_staff' ? selectedProfile.branchId : 'factory';
  const [targetBranch, setTargetBranch] = useState<'branch_1' | 'branch_2' | 'factory'>(initialBranch || 'factory');

  const handleAdd = () => {
    if (!title || !amount || parseFloat(amount) <= 0) {
      toast.error("Please provide valid title and amount");
      return;
    }
    
    addExpense({ 
      title, 
      amount: parseFloat(amount), 
      category, 
      date: new Date().toISOString().slice(0, 10),
      branchId: targetBranch
    });
    
    setTitle('');
    setAmount('');
    toast.success("Expense recorded successfully");
  };

  const isStaff = selectedProfile.role === 'branch_staff';
  const filteredExpenses = expenses.filter(e => {
    // If staff, only show their branch
    if (isStaff) {
      return e.branchId === selectedProfile.branchId;
    }
    // If admin/accountant, use filter
    if (branchFilter === 'all') return true;
    return e.branchId === branchFilter;
  });

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  const getBranchLabel = (id?: string) => {
    if (id === 'branch_1') return 'Branch 1';
    if (id === 'branch_2') return 'Branch 2';
    if (id === 'factory') return 'Factory';
    return 'Global';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Expense Management</h1>
          <p className="text-sm text-muted-foreground">
            {isStaff ? `Tracking local expenses for ${getBranchLabel(selectedProfile.branchId)}` : 'Full system expense tracking and audits'}
          </p>
        </div>
        {!isStaff && (
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={branchFilter} onValueChange={(v: any) => setBranchFilter(v)}>
              <SelectTrigger className="w-40 h-9">
                <SelectValue placeholder="All Branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                <SelectItem value="branch_1">Branch 1</SelectItem>
                <SelectItem value="branch_2">Branch 2</SelectItem>
                <SelectItem value="factory">Factory/Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <Card className="border-primary/10 shadow-sm overflow-hidden">
        <div className="h-1 bg-primary w-full" />
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" />
            Record New Expense
          </CardTitle>
          <CardDescription>Enter details of the expenditure spent at this location</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="title">Reason / Item Name</Label>
              <Input 
                id="title" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                placeholder="e.g. Daily transport, Sugar emergency" 
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount (Rs.)</Label>
              <Input 
                id="amount" 
                type="number" 
                min="0" 
                step="0.01" 
                value={amount} 
                onChange={e => setAmount(e.target.value)} 
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {!isStaff ? (
              <div className="space-y-1.5">
                <Label>Location</Label>
                <Select value={targetBranch} onValueChange={(v: any) => setTargetBranch(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="branch_1">Branch 1</SelectItem>
                    <SelectItem value="branch_2">Branch 2</SelectItem>
                    <SelectItem value="factory">Factory</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="flex items-end">
                <Button onClick={handleAdd} className="w-full bg-primary hover:bg-primary/90" disabled={!title || !amount}>
                  Add Expense
                </Button>
              </div>
            )}
            {!isStaff && (
              <div className="md:col-span-5 flex justify-end">
                <Button onClick={handleAdd} className="w-full md:w-48 bg-primary hover:bg-primary/90" disabled={!title || !amount}>
                  Add Expense
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="h-4 w-4 text-muted-foreground" /> 
              Recent Expenditures
            </CardTitle>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Total Period Expense</p>
              <p className="text-lg font-bold text-destructive">Rs. {totalExpenses.toFixed(2)}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader className="bg-muted/50 text-[11px] uppercase tracking-wider">
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground italic">
                      No expenses recorded for this selection.
                    </TableCell>
                  </TableRow>
                ) : (
                  [...filteredExpenses].reverse().map(e => (
                    <TableRow key={e.id} className="hover:bg-muted/20">
                      <TableCell className="text-xs whitespace-nowrap">{e.date}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs font-medium">{getBranchLabel(e.branchId)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-sm">{e.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-normal tracking-tight h-5">
                          {e.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-destructive">
                        -Rs. {e.amount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/20"
                            onClick={() => handleEditClick(e)}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                            onClick={() => handleDelete(e.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Expense Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
          <DialogHeader className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-5 py-4 text-white">
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-white">
              <Building2 className="h-5 w-5 text-indigo-200" />
              Edit Expenditure
            </DialogTitle>
          </DialogHeader>
          
          <div className="px-5 py-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-title">Reason / Item Name</Label>
              <Input 
                id="edit-title" 
                value={editTitle} 
                onChange={e => setEditTitle(e.target.value)} 
                placeholder="e.g. Daily transport" 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-amount">Amount (Rs.)</Label>
                <Input 
                  id="edit-amount" 
                  type="number" 
                  min="0" 
                  step="0.01" 
                  value={editAmount} 
                  onChange={e => setEditAmount(e.target.value)} 
                  placeholder="0.00"
                />
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="edit-category">Category</Label>
                <Select value={editCategory} onValueChange={editCategory => setEditCategory(editCategory)}>
                  <SelectTrigger id="edit-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {!isStaff && (
              <div className="space-y-1.5">
                <Label>Location</Label>
                <Select value={editBranchId} onValueChange={(v: any) => setEditBranchId(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="branch_1">Branch 1</SelectItem>
                    <SelectItem value="branch_2">Branch 2</SelectItem>
                    <SelectItem value="factory">Factory</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 px-5 py-3 flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setIsEditOpen(false)} className="rounded-lg px-4 text-xs">
              Cancel
            </Button>
            <Button 
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-5 text-xs font-bold gap-1.5" 
              onClick={handleSaveEdit}
              disabled={!editTitle || !editAmount}
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
