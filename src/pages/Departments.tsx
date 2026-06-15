import { safeLower } from "../lib/utils";
import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { 
  ChefHat, 
  Plus, 
  Edit2, 
  Trash2, 
  Send, 
  CheckCircle, 
  RotateCcw, 
  TrendingUp, 
  BarChart3, 
  DollarSign, 
  ClipboardList, 
  Layers, 
  Search, 
  Clock,
  Layers3
} from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';

export default function Departments() {
  const { 
    currentUser, 
    departments, 
    departmentTransfers, 
    rawMaterials,
    addDepartment, 
    updateDepartment, 
    deleteDepartment, 
    sendMaterialToDepartment, 
    verifyDepartmentLeftover, 
    returnLeftoverToMainStore,
    adjustDepartmentLeftover,
    deleteDepartmentTransfer 
  } = useApp();

  // Selected Tab
  const [activeTab, setActiveTab] = useState('dashboard');

  // Clear filters and selections when navigating to Dashboard
  useEffect(() => {
    if (activeTab === 'dashboard') {
      setSearchTerm('');
      setDeptFilter('all');
      setDateFilter('');
      setSelectedTransferIds(new Set());
    }
  }, [activeTab]);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);

  // Modals state
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);
  const [deptNameInput, setDeptNameInput] = useState('');

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferDeptId, setTransferDeptId] = useState('');
  const [transferMatId, setTransferMatId] = useState('');
  const [transferQty, setTransferQty] = useState('');

  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [verifyingTransferId, setVerifyingTransferId] = useState('');
  const [verifyQty, setVerifyQty] = useState('');

  // Selection state for deleting transfer logs
  const [selectedTransferIds, setSelectedTransferIds] = useState<Set<string>>(new Set());

  // Return to store modal state
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returningTransferId, setReturningTransferId] = useState('');
  const [returnQty, setReturnQty] = useState('');
  const [keepQty, setKeepQty] = useState('');

  // Adjust leftover modal state
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustingTransferId, setAdjustingTransferId] = useState('');
  const [adjustQty, setAdjustQty] = useState('');

  if (!currentUser) return <Navigate to="/login" replace />;

  const activeDepartments = departments.filter(d => d.isActive);
  const activeMaterials = rawMaterials.filter(m => m.isActive);

  // Stats calculation
  const todayDate = new Date().toISOString().split('T')[0];
  const todayTransfers = departmentTransfers.filter(t => t.date === todayDate);

  const totalCostSentToday = todayTransfers.reduce((sum, t) => sum + (t.quantitySent * t.costPerUnit), 0);
  const totalCostLeftoverToday = todayTransfers
    .filter(t => t.isVerified)
    .reduce((sum, t) => sum + ((t.quantityLeftover || 0) * t.costPerUnit), 0);
  const totalCostUsedToday = todayTransfers.reduce((sum, t) => {
    const cost = t.quantitySent * t.costPerUnit;
    const leftover = t.isVerified ? (t.quantityLeftover || 0) * t.costPerUnit : 0;
    return sum + (cost - leftover);
  }, 0);

  // Department Table Filtered Transfers
  const filteredTransfers = departmentTransfers.filter(t => {
    const material = rawMaterials.find(m => m.id === t.materialId);
    
    const matchesSearch = material ? safeLower(material.name).includes(safeLower(searchTerm)) : false;
    const matchesDept = deptFilter === 'all' || t.departmentId === deptFilter;
    const matchesDate = !dateFilter || t.date === dateFilter;

    return matchesSearch && matchesDept && matchesDate;
  });

  // Chart 1: Department Cost Breakdown (Sent vs Leftover vs Used) for selected date or overall
  const deptCostChartData = activeDepartments.map(dept => {
    const transfers = departmentTransfers.filter(t => t.departmentId === dept.id && (dateFilter ? t.date === dateFilter : true));
    const sentVal = transfers.reduce((sum, t) => sum + (t.quantitySent * t.costPerUnit), 0);
    const leftoverVal = transfers.filter(t => t.isVerified).reduce((sum, t) => sum + ((t.quantityLeftover || 0) * t.costPerUnit), 0);
    const usedVal = transfers.reduce((sum, t) => {
      const cost = t.quantitySent * t.costPerUnit;
      const leftover = t.isVerified ? (t.quantityLeftover || 0) * t.costPerUnit : 0;
      return sum + (cost - leftover);
    }, 0);

    return {
      name: dept.name,
      Sent: Number(sentVal.toFixed(2)),
      Leftover: Number(leftoverVal.toFixed(2)),
      Used: Number(usedVal.toFixed(2))
    };
  }).filter(d => d.Sent > 0);

  // Chart 2: Top Raw Materials sent to Departments (Total Cost)
  const matPieChartData = activeMaterials.map(mat => {
    const transfers = departmentTransfers.filter(t => t.materialId === mat.id && (dateFilter ? t.date === dateFilter : true));
    const totalCost = transfers.reduce((sum, t) => sum + (t.quantitySent * t.costPerUnit), 0);
    return {
      name: mat.name,
      value: Number(totalCost.toFixed(2))
    };
  }).filter(d => d.value > 0).sort((a, b) => b.value - a.value).slice(0, 5);

  const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  // Add/Edit Department Actions
  const openAddDeptModal = () => {
    setEditingDeptId(null);
    setDeptNameInput('');
    setIsDeptModalOpen(true);
  };

  const openEditDeptModal = (id: string, name: string) => {
    setEditingDeptId(id);
    setDeptNameInput(name);
    setIsDeptModalOpen(true);
  };

  const handleDeptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptNameInput.trim()) {
      return toast.error("Department name cannot be empty");
    }

    if (editingDeptId) {
      await updateDepartment(editingDeptId, deptNameInput.trim());
      toast.success("Department name updated");
    } else {
      await addDepartment(deptNameInput.trim());
      toast.success("New department added successfully");
    }

    setIsDeptModalOpen(false);
  };

  const handleDeleteDeptClick = (id: string) => {
    if (confirm("Are you sure you want to delete this department? Any past transfers will still be kept for reports.")) {
      deleteDepartment(id);
      toast.success("Department removed");
    }
  };

  // Transfer Actions
  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferDeptId) return toast.error("Please select a department");
    if (!transferMatId) return toast.error("Please select a raw material");
    const qty = parseFloat(transferQty);
    if (isNaN(qty) || qty <= 0) return toast.error("Please enter a valid quantity greater than 0");

    // Check stock level
    const mat = rawMaterials.find(m => m.id === transferMatId);
    if (!mat) return toast.error("Material not found");
    if (mat.currentStock < qty) {
      return toast.error(`Insufficient stock! Only ${mat.currentStock} ${mat.unit} of ${mat.name} is available.`);
    }

    const success = await sendMaterialToDepartment(transferDeptId, transferMatId, qty);
    if (success) {
      toast.success(`Sent ${qty} ${mat.unit} of ${mat.name} successfully`);
      setIsTransferModalOpen(false);
      setTransferDeptId('');
      setTransferMatId('');
      setTransferQty('');
    }
  };

  // Verify Leftover Action
  const openVerifyModal = (transferId: string, maxQty: number) => {
    setVerifyingTransferId(transferId);
    setVerifyQty('');
    setIsVerifyModalOpen(true);
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(verifyQty);
    if (isNaN(qty) || qty < 0) return toast.error("Quantity must be a non-negative number");

    const trsf = departmentTransfers.find(t => t.id === verifyingTransferId);
    if (trsf && qty > trsf.quantitySent) {
      return toast.error(`Leftover quantity (${qty}) cannot be larger than the quantity sent (${trsf.quantitySent})`);
    }

    const success = await verifyDepartmentLeftover(verifyingTransferId, qty);
    if (success) {
      toast.success("Leftover stock verified successfully");
      setIsVerifyModalOpen(false);
    }
  };

  // Open Return Modal
  const openReturnModal = (transferId: string) => {
    const trsf = departmentTransfers.find(t => t.id === transferId);
    if (!trsf) return;
    setReturningTransferId(transferId);
    setReturnQty(String(trsf.quantityLeftover || 0));
    setKeepQty('0');
    setIsReturnModalOpen(true);
  };

  // Handle Return Submit
  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rQty = parseFloat(returnQty);
    if (isNaN(rQty) || rQty < 0) return toast.error('Please enter a valid return quantity');
    const success = await returnLeftoverToMainStore(returningTransferId, rQty);
    if (success) {
      setIsReturnModalOpen(false);
    }
  };

  // Open Adjust Modal
  const openAdjustModal = (transferId: string) => {
    const trsf = departmentTransfers.find(t => t.id === transferId);
    if (!trsf) return;
    setAdjustingTransferId(transferId);
    setAdjustQty(String(trsf.quantityLeftover || 0));
    setIsAdjustModalOpen(true);
  };

  // Handle Adjust Submit
  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const aQty = parseFloat(adjustQty);
    if (isNaN(aQty) || aQty < 0) return toast.error('Please enter a valid quantity');
    const success = await adjustDepartmentLeftover(adjustingTransferId, aQty);
    if (success) {
      setIsAdjustModalOpen(false);
    }
  };

  // Transfer Selection & Delete Actions
  const toggleSelectTransfer = (id: string) => {
    setSelectedTransferIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedTransferIds.size === filteredTransfers.length && filteredTransfers.length > 0) {
      setSelectedTransferIds(new Set());
    } else {
      setSelectedTransferIds(new Set(filteredTransfers.map(t => t.id)));
    }
  };

  const handleDeleteSelectedTransfers = async () => {
    if (selectedTransferIds.size === 0) {
      return toast.error('Please select at least one transfer log to delete');
    }
    if (confirm(`Are you sure you want to permanently delete ${selectedTransferIds.size} selected transfer log(s)? This action cannot be undone.`)) {
      await deleteDepartmentTransfer(Array.from(selectedTransferIds));
      toast.success(`${selectedTransferIds.size} transfer log(s) deleted successfully`);
      setSelectedTransferIds(new Set());
    }
  };

  // Export PDF function for Daily Transfers Log
  const exportTransfersPDF = () => {
    const doc = new jsPDF();
    const title = 'Daily Transfers Log';
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    const headers = [
      'Date',
      'Department',
      'Material',
      'Qty Sent',
      'Cost Value',
      'Leftover',
      'Status'
    ];
    const rows = filteredTransfers.map(t => {
      const mat = rawMaterials.find(m => m.id === t.materialId);
      const dept = departments.find(d => d.id === t.departmentId);
      const totalCost = t.quantitySent * t.costPerUnit;
      const leftover = t.isVerified ? `${t.quantityLeftover || 0} ${mat?.unit || ''}` : '-';
      const status = t.leftoverReturned ? 'Returned' : t.isVerified ? 'Verified' : 'Pending';
      return [
        new Date(t.date).toLocaleDateString(),
        dept?.name || 'Unknown',
        mat?.name || 'Raw Material',
        `${t.quantitySent} ${mat?.unit || ''}`,
        `Rs. ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        leftover,
        status
      ];
    });
    // @ts-ignore autoTable usage
    autoTable(doc, {
      startY: 30,
      head: [headers],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [48, 48, 48] },
    });
    doc.save('daily_transfers_log.pdf');
  };

  return (
    <div className="space-y-6 p-4 lg:p-6 bg-slate-50/50 min-h-screen pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2 border-b border-slate-100 pb-5">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <ChefHat className="h-6 w-6 text-primary" />
            Department Transfers
          </h1>
          <p className="text-slate-500 text-sm font-medium">Manage raw materials sent to specific bakery production lines and verify leftovers</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button 
            onClick={openAddDeptModal}
            variant="outline" 
            className="rounded-2xl border-slate-200 bg-white text-xs font-bold uppercase tracking-wider hover:bg-slate-55"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Manage Departments
          </Button>
          <Button 
            onClick={() => setIsTransferModalOpen(true)}
            className="rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-slate-900/20"
          >
            <Send className="mr-1.5 h-3.5 w-3.5" />
            Send Raw Materials
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-100 p-1 rounded-2xl grid grid-cols-3 max-w-md">
          <TabsTrigger value="dashboard" className="rounded-xl text-xs font-bold uppercase tracking-wider">
            <TrendingUp className="h-4 w-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="transfers" className="rounded-xl text-xs font-bold uppercase tracking-wider">
            <ClipboardList className="h-4 w-4 mr-2" />
            Transfers Logs
          </TabsTrigger>
          <TabsTrigger value="departments" className="rounded-xl text-xs font-bold uppercase tracking-wider">
            <Layers3 className="h-4 w-4 mr-2" />
            Departments
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: DASHBOARD / CHARTS */}
        <TabsContent value="dashboard" className="space-y-6 focus-visible:outline-none">
          {/* Daily Cost Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-0 shadow-xl shadow-slate-100 rounded-3xl overflow-hidden relative bg-white">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-500" />
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Total Value Sent (Today)</p>
                    <h3 className="text-3xl font-black text-slate-900">Rs. {totalCostSentToday.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                    <p className="text-xs text-slate-500 mt-1">Cost of raw materials transferred today</p>
                  </div>
                  <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl">
                    <Layers className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl shadow-slate-100 rounded-3xl overflow-hidden relative bg-white">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-green-500" />
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Estimated Cost Used (Today)</p>
                    <h3 className="text-3xl font-black text-slate-900">Rs. {totalCostUsedToday.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                    <p className="text-xs text-slate-500 mt-1">Cost of materials consumed by departments</p>
                  </div>
                  <div className="p-3 bg-green-50 text-green-500 rounded-2xl">
                    <DollarSign className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl shadow-slate-100 rounded-3xl overflow-hidden relative bg-white">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-amber-500" />
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Leftover / Remaining (Today)</p>
                    <h3 className="text-3xl font-black text-slate-900">Rs. {totalCostLeftoverToday.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                    <p className="text-xs text-slate-500 mt-1">Verified leftover materials still in departments</p>
                  </div>
                  <div className="p-3 bg-amber-50 text-amber-500 rounded-2xl">
                    <Clock className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Graphs Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border-0 shadow-xl shadow-slate-100 rounded-3xl bg-white">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-50 pb-5">
                <div>
                  <CardTitle className="text-lg font-black text-slate-900">Department-wise Material Costs</CardTitle>
                  <CardDescription>Value of materials sent, consumed, and leftover</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="dateSelect" className="sr-only">Select Date</Label>
                  <Input 
                    type="date" 
                    id="dateSelect"
                    className="max-w-[150px] rounded-xl text-xs bg-slate-50 border-slate-200"
                    value={dateFilter}
                    onChange={e => setDateFilter(e.target.value)}
                  />
                  {dateFilter && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900" onClick={() => setDateFilter('')}>
                      Clear
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {deptCostChartData.length > 0 ? (
                  <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={deptCostChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff' }} />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '15px', fontSize: '12px', fontWeight: 600 }} />
                        <Bar dataKey="Sent" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Value Sent (Rs)" />
                        <Bar dataKey="Used" fill="#10b981" radius={[4, 4, 0, 0]} name="Used Cost (Rs)" />
                        <Bar dataKey="Leftover" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Leftover Cost (Rs)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[320px] flex flex-col items-center justify-center text-slate-400 space-y-2">
                    <BarChart3 className="h-12 w-12 text-slate-300" />
                    <p className="text-sm font-semibold">No transfers data for this date filter</p>
                    <p className="text-xs text-slate-400">Try changing the date filter or send materials to departments first</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl shadow-slate-100 rounded-3xl bg-white">
              <CardHeader className="border-b border-slate-50 pb-5">
                <CardTitle className="text-lg font-black text-slate-900">Top Materials Sent</CardTitle>
                <CardDescription>Highest costing ingredients transferred</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 flex flex-col justify-center items-center">
                {matPieChartData.length > 0 ? (
                  <>
                    <div className="h-[220px] w-full relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={matPieChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {matPieChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => `Rs. ${value}`} contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="w-full space-y-2 mt-4">
                      {matPieChartData.map((item, index) => (
                        <div key={item.name} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 font-medium text-slate-600">
                            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                            <span>{item.name}</span>
                          </div>
                          <span className="font-bold text-slate-900">Rs. {item.value.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="h-[260px] flex flex-col items-center justify-center text-slate-400 space-y-2">
                    <ChefHat className="h-12 w-12 text-slate-300" />
                    <p className="text-sm font-semibold">No materials sent yet</p>
                    <p className="text-xs text-slate-400">Transfer raw materials to view breakdown</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 2: TRANSFER LOGS & ACTIONS */}
        <TabsContent value="transfers" className="space-y-6 focus-visible:outline-none">
          <Card className="border-0 shadow-xl shadow-slate-100 rounded-3xl bg-white overflow-hidden">
            <CardHeader className="border-b border-slate-50 pb-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-black text-slate-900">Daily Transfers Log</CardTitle>
                  <CardDescription>Track sent materials, leftover entries, and main store returns</CardDescription>
                </div>
                
                {/* Search & Filters */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      placeholder="Search material..."
                      className="pl-10 w-full sm:w-[200px] rounded-xl text-xs bg-slate-50 border-slate-200"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <Select value={deptFilter} onValueChange={setDeptFilter}>
                    <SelectTrigger className="w-full sm:w-[150px] rounded-xl text-xs bg-slate-50 border-slate-200">
                      <SelectValue placeholder="All Departments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {activeDepartments.map(d => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input 
                    type="date"
                    className="w-full sm:w-[150px] rounded-xl text-xs bg-slate-50 border-slate-200"
                    value={dateFilter}
                    onChange={e => setDateFilter(e.target.value)}
                  />
                  {dateFilter && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400" onClick={() => setDateFilter('')}>
                      Clear
                    </Button>
                  )}

                  {selectedTransferIds.size > 0 && (
                    <Button
                      variant="outline"
                      onClick={handleDeleteSelectedTransfers}
                      className="rounded-xl border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete Selected ({selectedTransferIds.size})
                    </Button>
                  )}

                  {/* Clear Filters Button */}
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm('');
                      setDeptFilter('all');
                      setDateFilter('');
                      setSelectedTransferIds(new Set());
                    }}
                    className="rounded-xl border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ml-2"
                  >
                    Clear Filters
                  </Button>

                  {/* Export PDF Button */}
                  {/* Export Options Dropdown */}
                  <Select value="" onValueChange={(value) => {
                    if (value === 'pdf') {
                      exportTransfersPDF();
                    } else if (value === 'csv') {
                      exportTransfersCSV();
                    }
                  }}>
                    <SelectTrigger className="w-[150px] rounded-xl text-xs bg-slate-50 border-slate-200">
                      <SelectValue placeholder="Export" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">Export PDF</SelectItem>
                      <SelectItem value="csv">Export CSV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {filteredTransfers.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-55/50">
                      <TableRow className="border-b border-slate-100">
                        <TableHead className="font-bold text-slate-800 py-4 px-3 w-[40px]">
                          <Checkbox
                            checked={filteredTransfers.length > 0 && selectedTransferIds.size === filteredTransfers.length}
                            onCheckedChange={toggleSelectAll}
                            aria-label="Select all transfers"
                            className="border-slate-300 data-[state=checked]:bg-slate-900 data-[state=checked]:border-slate-900"
                          />
                        </TableHead>
                        <TableHead className="font-bold text-slate-800 py-4 px-6 text-xs uppercase tracking-wider">Date</TableHead>
                        <TableHead className="font-bold text-slate-800 py-4 px-6 text-xs uppercase tracking-wider">Department</TableHead>
                        <TableHead className="font-bold text-slate-800 py-4 px-6 text-xs uppercase tracking-wider">Material</TableHead>
                        <TableHead className="font-bold text-slate-800 py-4 px-6 text-xs uppercase tracking-wider text-right">Qty Sent</TableHead>
                        <TableHead className="font-bold text-slate-800 py-4 px-6 text-xs uppercase tracking-wider text-right">Cost Value</TableHead>
                        <TableHead className="font-bold text-slate-800 py-4 px-6 text-xs uppercase tracking-wider text-right">Leftover</TableHead>
                        <TableHead className="font-bold text-slate-800 py-4 px-6 text-xs uppercase tracking-wider text-center">Status</TableHead>
                        <TableHead className="font-bold text-slate-800 py-4 px-6 text-xs uppercase tracking-wider text-center">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransfers.map((t) => {
                        const mat = rawMaterials.find(m => m.id === t.materialId);
                        const dept = departments.find(d => d.id === t.departmentId);
                        const totalCost = t.quantitySent * t.costPerUnit;

                        return (
                          <TableRow key={t.id} className={`border-b border-slate-100 hover:bg-slate-50/30 transition-colors ${selectedTransferIds.has(t.id) ? 'bg-slate-50/60' : ''}`}>
                            <TableCell className="py-4 px-3 w-[40px]">
                              <Checkbox
                                checked={selectedTransferIds.has(t.id)}
                                onCheckedChange={() => toggleSelectTransfer(t.id)}
                                aria-label={`Select transfer ${t.id}`}
                                className="border-slate-300 data-[state=checked]:bg-slate-900 data-[state=checked]:border-slate-900"
                              />
                            </TableCell>
                            <TableCell className="py-4 px-6 font-medium text-slate-900 text-xs">
                              {new Date(t.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </TableCell>
                            <TableCell className="py-4 px-6 text-slate-600 text-xs font-semibold">
                              {dept?.name || 'Unknown Department'}
                            </TableCell>
                            <TableCell className="py-4 px-6">
                              <div className="font-bold text-slate-900 text-xs">{mat?.name || 'Raw Material'}</div>
                              <div className="text-[10px] text-slate-400">Rs. {t.costPerUnit}/{mat?.unit}</div>
                            </TableCell>
                            <TableCell className="py-4 px-6 text-right font-semibold text-slate-900 text-xs">
                              {t.quantitySent} {mat?.unit}
                            </TableCell>
                            <TableCell className="py-4 px-6 text-right font-bold text-slate-900 text-xs">
                              Rs. {totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="py-4 px-6 text-right font-medium text-slate-500 text-xs">
                              {t.isVerified ? `${t.quantityLeftover} ${mat?.unit}` : '-'}
                            </TableCell>
                            <TableCell className="py-4 px-6 text-center">
                              <div className="flex flex-col items-center justify-center gap-1">
                                {(t.quantityReturned || 0) > 0 && (
                                  <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-100 rounded-lg text-[10px] py-1 px-2.5 font-bold">
                                    ✅ Returned {t.quantityReturned} {mat?.unit} to Store
                                  </Badge>
                                )}
                                
                                {t.isVerified ? (
                                  (t.quantityLeftover || 0) > 0 ? (
                                    <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-100 rounded-lg text-[10px] py-1 px-2.5 font-bold">
                                      📦 In Dept: {t.quantityLeftover} {mat?.unit}
                                    </Badge>
                                  ) : (
                                    !(t.quantityReturned && t.quantityReturned > 0) && (
                                      <Badge className="bg-slate-50 text-slate-500 hover:bg-slate-50 border-slate-200 rounded-lg text-[10px] py-1 px-2.5 font-bold">
                                        ✅ Fully Used
                                      </Badge>
                                    )
                                  )
                                ) : (
                                  <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-50 border-amber-100 rounded-lg text-[10px] py-1 px-2.5 font-bold animate-pulse">
                                    ⏳ Pending Verification
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="py-4 px-6 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {!t.isVerified ? (
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => openVerifyModal(t.id, t.quantitySent)}
                                    className="h-8 rounded-xl text-xs font-semibold px-2.5 border-slate-200 hover:bg-slate-50 flex items-center gap-1"
                                  >
                                    <CheckCircle className="h-3.5 w-3.5 text-blue-500" />
                                    Verify
                                  </Button>
                                ) : !t.leftoverReturned && (t.quantityLeftover || 0) > 0 ? (
                                  <>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => openReturnModal(t.id)}
                                      className="h-8 rounded-xl text-xs font-semibold px-2.5 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center gap-1"
                                    >
                                      <RotateCcw className="h-3.5 w-3.5" />
                                      Return Stock
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => openAdjustModal(t.id)}
                                      className="h-8 rounded-xl text-xs font-semibold px-2.5 border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 flex items-center gap-1"
                                    >
                                      <Edit2 className="h-3.5 w-3.5" />
                                      Adjust
                                    </Button>
                                  </>
                                ) : (
                                  <span className="text-slate-400 text-xs">-</span>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="p-12 text-center text-slate-400 space-y-3">
                  <ClipboardList className="h-16 w-16 text-slate-200 mx-auto" />
                  <p className="text-base font-bold text-slate-700">No transfers logged</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">No material transfers match your search queries or date filter.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: DEPARTMENTS CRUD */}
        <TabsContent value="departments" className="space-y-6 focus-visible:outline-none">
          <Card className="border-0 shadow-xl shadow-slate-100 rounded-3xl bg-white overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 pb-5">
              <div>
                <CardTitle className="text-lg font-black text-slate-900">Manage Departments</CardTitle>
                <CardDescription>Active bakery kitchen lines and dispatch targets</CardDescription>
              </div>
              <Button onClick={openAddDeptModal} className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider">
                <Plus className="h-4 w-4 mr-1" />
                Add Department
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {activeDepartments.length > 0 ? (
                <Table>
                  <TableHeader className="bg-slate-55/50">
                    <TableRow className="border-b border-slate-100">
                      <TableHead className="font-bold text-slate-800 py-4 px-6 text-xs uppercase tracking-wider">Department Name</TableHead>
                      <TableHead className="font-bold text-slate-800 py-4 px-6 text-xs uppercase tracking-wider">Created Date</TableHead>
                      <TableHead className="font-bold text-slate-800 py-4 px-6 text-xs uppercase tracking-wider text-center">Status</TableHead>
                      <TableHead className="font-bold text-slate-800 py-4 px-6 text-xs uppercase tracking-wider text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeDepartments.map((dept) => (
                      <TableRow key={dept.id} className="border-b border-slate-100 hover:bg-slate-50/30 transition-colors">
                        <TableCell className="py-4 px-6 font-bold text-slate-900 text-xs">
                          {dept.name}
                        </TableCell>
                        <TableCell className="py-4 px-6 text-slate-500 text-xs">
                          {new Date(dept.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="py-4 px-6 text-center">
                          <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-100 rounded-lg text-[10px] py-1 px-2.5 font-bold">
                            Active
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => openEditDeptModal(dept.id, dept.name)}
                              className="h-8 w-8 p-0 rounded-xl border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-900"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDeleteDeptClick(dept.id)}
                              className="h-8 w-8 p-0 rounded-xl border-slate-200 hover:bg-red-50 text-slate-550 hover:text-red-600"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-12 text-center text-slate-400 space-y-3">
                  <ChefHat className="h-16 w-16 text-slate-200 mx-auto" />
                  <p className="text-base font-bold text-slate-700">No departments configured</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">Create departments so you can track where material flows.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* DIALOG 1: ADD/EDIT DEPARTMENT */}
      <Dialog open={isDeptModalOpen} onOpenChange={setIsDeptModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6 bg-white border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900">
              {editingDeptId ? "Edit Department" : "Add New Department"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Specify the department name below. Names must be unique and descriptive.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleDeptSubmit} className="space-y-4 pt-3">
            <div className="space-y-2">
              <Label htmlFor="deptName" className="text-xs font-bold text-slate-700 uppercase tracking-wider">Department Name</Label>
              <Input 
                id="deptName" 
                placeholder="e.g. Pastry Kitchen, Baking Hall"
                value={deptNameInput}
                onChange={e => setDeptNameInput(e.target.value)}
                className="rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-primary"
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsDeptModalOpen(false)} className="rounded-xl text-xs font-semibold">
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold">
                {editingDeptId ? "Save Changes" : "Create Department"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: TRANSFER RAW MATERIAL */}
      <Dialog open={isTransferModalOpen} onOpenChange={setIsTransferModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6 bg-white border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900">
              Send Material to Department
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              This action will deduct raw material quantities directly from the main store warehouse inventory.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleTransferSubmit} className="space-y-4 pt-3">
            <div className="space-y-2">
              <Label htmlFor="transferDept" className="text-xs font-bold text-slate-700 uppercase tracking-wider">Target Department</Label>
              <Select value={transferDeptId} onValueChange={setTransferDeptId}>
                <SelectTrigger id="transferDept" className="rounded-xl bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Select Department..." />
                </SelectTrigger>
                <SelectContent>
                  {activeDepartments.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transferMat" className="text-xs font-bold text-slate-700 uppercase tracking-wider">Raw Material</Label>
              <Select value={transferMatId} onValueChange={setTransferMatId}>
                <SelectTrigger id="transferMat" className="rounded-xl bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Select Ingredient..." />
                </SelectTrigger>
                <SelectContent>
                  {activeMaterials.map(m => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name} (Stock: {m.currentStock} {m.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transferQty" className="text-xs font-bold text-slate-700 uppercase tracking-wider">Quantity to Transfer</Label>
              <div className="relative">
                <Input 
                  id="transferQty" 
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={transferQty}
                  onChange={e => setTransferQty(e.target.value)}
                  className="rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-primary pr-12"
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  {transferMatId ? rawMaterials.find(m => m.id === transferMatId)?.unit : ''}
                </div>
              </div>
            </div>

            {transferMatId && transferQty && (
              <div className="bg-slate-50 rounded-xl p-3 text-xs border border-slate-100">
                <div className="flex justify-between items-center text-slate-500">
                  <span>Unit Price:</span>
                  <span className="font-semibold text-slate-800">Rs. {rawMaterials.find(m => m.id === transferMatId)?.costPerUnit || 0}</span>
                </div>
                <div className="flex justify-between items-center text-slate-800 font-bold mt-1 pt-1 border-t border-slate-200/50">
                  <span>Total Cost:</span>
                  <span className="text-primary">Rs. {((rawMaterials.find(m => m.id === transferMatId)?.costPerUnit || 0) * (parseFloat(transferQty) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsTransferModalOpen(false)} className="rounded-xl text-xs font-semibold">
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold">
                Confirm & Transfer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG 3: VERIFY LEFTOVER STOCK */}
      <Dialog open={isVerifyModalOpen} onOpenChange={setIsVerifyModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6 bg-white border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900">
              Verify Remaining/Leftover stock
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Enter the leftovers from the department production line for the end-of-day audit.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleVerifySubmit} className="space-y-4 pt-3">
            <div className="space-y-2">
              <Label htmlFor="verifyQty" className="text-xs font-bold text-slate-700 uppercase tracking-wider">Leftover Quantity</Label>
              <div className="relative">
                <Input 
                  id="verifyQty" 
                  type="number"
                  step="any"
                  placeholder="Enter remaining stock..."
                  value={verifyQty}
                  onChange={e => setVerifyQty(e.target.value)}
                  className="rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-primary pr-12"
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  {verifyingTransferId ? rawMaterials.find(m => m.id === departmentTransfers.find(t => t.id === verifyingTransferId)?.materialId)?.unit : ''}
                </div>
              </div>
              <p className="text-[10px] text-slate-400">
                Max allowable: {verifyingTransferId ? departmentTransfers.find(t => t.id === verifyingTransferId)?.quantitySent : ''}
              </p>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsVerifyModalOpen(false)} className="rounded-xl text-xs font-semibold">
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold">
                Save & Verify
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* DIALOG 4: RETURN TO STORE */}
      <Dialog open={isReturnModalOpen} onOpenChange={setIsReturnModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6 bg-white border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-emerald-600" />
              Return Stock to Store
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Specify how much to return to the main warehouse and how much stays in the department for next-day use.
            </DialogDescription>
          </DialogHeader>
          {(() => {
            const trsf = departmentTransfers.find(t => t.id === returningTransferId);
            const mat = trsf ? rawMaterials.find(m => m.id === trsf.materialId) : null;
            const totalLeftover = trsf?.quantityLeftover || 0;
            const dept = trsf ? departments.find(d => d.id === trsf.departmentId) : null;
            return (
              <form onSubmit={handleReturnSubmit} className="space-y-4 pt-3">
                {/* Summary banner */}
                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 text-xs space-y-1.5">
                  <div className="flex justify-between text-slate-500">
                    <span>Material</span>
                    <span className="font-bold text-slate-900">{mat?.name}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Department</span>
                    <span className="font-bold text-slate-900">{dept?.name}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 pt-1 border-t border-slate-200">
                    <span>Total Leftover in Dept</span>
                    <span className="font-black text-blue-700">{totalLeftover} {mat?.unit}</span>
                  </div>
                </div>

                {/* Return qty input */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Return to Main Store ({mat?.unit})</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="any"
                      min="0"
                      max={totalLeftover}
                      placeholder="0"
                      value={returnQty}
                      onChange={e => {
                        const val = e.target.value;
                        setReturnQty(val);
                        const parsed = parseFloat(val);
                        if (!isNaN(parsed)) {
                          setKeepQty(String(Math.max(0, totalLeftover - parsed)));
                        }
                      }}
                      className="rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 pr-12"
                    />
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-600">{mat?.unit}</div>
                  </div>
                </div>

                {/* Keep qty (auto-calculated) */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Keep in Department for Next Day ({mat?.unit})</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="any"
                      min="0"
                      max={totalLeftover}
                      placeholder="0"
                      value={keepQty}
                      onChange={e => {
                        const val = e.target.value;
                        setKeepQty(val);
                        const parsed = parseFloat(val);
                        if (!isNaN(parsed)) {
                          setReturnQty(String(Math.max(0, totalLeftover - parsed)));
                        }
                      }}
                      className="rounded-xl bg-blue-50 border-blue-200 focus-visible:ring-blue-500 pr-12"
                    />
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-blue-600">{mat?.unit}</div>
                  </div>
                  <p className="text-[10px] text-slate-400">Return + Keep must equal {totalLeftover} {mat?.unit}</p>
                </div>

                <DialogFooter className="pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsReturnModalOpen(false)} className="rounded-xl text-xs font-semibold">
                    Cancel
                  </Button>
                  <Button type="submit" className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold">
                    <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                    Confirm Return
                  </Button>
                </DialogFooter>
              </form>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* DIALOG 5: ADJUST LEFTOVER */}
      <Dialog open={isAdjustModalOpen} onOpenChange={setIsAdjustModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6 bg-white border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-blue-600" />
              Adjust Leftover Quantity
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Update the leftover quantity recorded in this department. Use this to correct any entry errors or account for additional consumption.
            </DialogDescription>
          </DialogHeader>
          {(() => {
            const trsf = departmentTransfers.find(t => t.id === adjustingTransferId);
            const mat = trsf ? rawMaterials.find(m => m.id === trsf.materialId) : null;
            const dept = trsf ? departments.find(d => d.id === trsf.departmentId) : null;
            return (
              <form onSubmit={handleAdjustSubmit} className="space-y-4 pt-3">
                {/* Summary */}
                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 text-xs space-y-1.5">
                  <div className="flex justify-between text-slate-500">
                    <span>Material</span>
                    <span className="font-bold text-slate-900">{mat?.name}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Department</span>
                    <span className="font-bold text-slate-900">{dept?.name}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Qty Sent</span>
                    <span className="font-bold text-slate-900">{trsf?.quantitySent} {mat?.unit}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 pt-1 border-t border-slate-200">
                    <span>Current Leftover</span>
                    <span className="font-black text-blue-700">{trsf?.quantityLeftover} {mat?.unit}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">New Leftover Quantity ({mat?.unit})</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="any"
                      min="0"
                      max={trsf?.quantitySent}
                      placeholder="Enter new leftover amount..."
                      value={adjustQty}
                      onChange={e => setAdjustQty(e.target.value)}
                      className="rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-blue-500 pr-12"
                    />
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-blue-600">{mat?.unit}</div>
                  </div>
                  <p className="text-[10px] text-slate-400">Must be between 0 and {trsf?.quantitySent} {mat?.unit}</p>
                </div>

                <DialogFooter className="pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsAdjustModalOpen(false)} className="rounded-xl text-xs font-semibold">
                    Cancel
                  </Button>
                  <Button type="submit" className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold">
                    <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                    Save Adjustment
                  </Button>
                </DialogFooter>
              </form>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
