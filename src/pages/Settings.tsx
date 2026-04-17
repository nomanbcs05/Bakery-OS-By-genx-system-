import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Settings as SettingsIcon, ShieldCheck, Database, Trash2, Globe, Wifi, WifiOff, LogOut, Users, UserPlus, Mail, Shield, Lock, Printer, Save, Cloud, CloudOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Navigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { UserRole } from '@/types';

export default function SettingsPage() {
  const { 
    currentUser, 
    allUsers, 
    updateUserRole, 
    updateUserPin,
    createStaffMember,
    clearAllReportData, 
    isOnline, 
    lastSyncTime, 
    forceSync, 
    seedDatabase, 
    logout,
    lockProfile,
    auditLogs,
    receiptSettings,
    updateReceiptSettings,
    hasSupabaseConfig
  } = useApp();

  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({ role: 'branch_staff' as UserRole, branchId: '', pin: '0000' });
  const [isCreating, setIsCreating] = useState(false);

  const [editingPinId, setEditingPinId] = useState<string | null>(null);
  const [tempPin, setTempPin] = useState('');

  const [formReceiptSettings, setFormReceiptSettings] = useState(receiptSettings);

  // Sync form settings when global settings change (e.g. after permanent save)
  useEffect(() => {
    setFormReceiptSettings(receiptSettings);
  }, [receiptSettings]);

  const handleSaveReceiptSettings = () => {
    updateReceiptSettings(formReceiptSettings);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 512 * 1024) {
      toast.error('Logo file too large. Please use an image under 512KB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormReceiptSettings(prev => ({ ...prev, logoUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role !== 'admin') return <Navigate to="/" replace />;

  const handleCreateUser = async () => {
    if (newUser.pin.length !== 4) {
      toast.error('PIN must be 4 digits');
      return;
    }
    
    // Auto-generate name and email based on role
    let name = '';
    let email = '';
    
    if (newUser.role === 'admin') {
      name = 'Admin User';
      email = `admin@bakery.com`;
    } else if (newUser.role === 'production_manager') {
      name = 'Bakery Manager';
      email = `manager@bakery.com`;
    } else if (newUser.role === 'branch_staff') {
      const bId = newUser.branchId || 'branch_1';
      const branchName = bId === 'branch_1' ? 'Branch 1' : 'Branch 2';
      name = `${branchName} POS`;
      email = `${bId}@bakery.com`;
      newUser.branchId = bId;
    } else if (newUser.role === 'accountant') {
      name = 'Accountant';
      email = `accountant@bakery.com`;
    }

    setIsCreating(true);
    await createStaffMember(
      name, 
      email, 
      'initial-password-123', // Secure default, they only use PIN to log in to profile
      newUser.role, 
      newUser.branchId || undefined,
      newUser.pin
    );
    setIsCreating(false);
    setIsAddUserOpen(false);
    setNewUser({ role: 'branch_staff' as UserRole, branchId: '', pin: '0000' });
  };

  const handleUpdatePin = async (userId: string) => {
    if (tempPin.length !== 4 || isNaN(Number(tempPin))) {
      toast.error('PIN must be 4 digits');
      return;
    }
    await updateUserPin(userId, tempPin);
    setEditingPinId(null);
    setTempPin('');
  };

  const handleUpdateRole = (userId: string, role: UserRole, branchId?: string) => {
    updateUserRole(userId, role, branchId as 'branch_1' | 'branch_2' | undefined);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">System configuration and audit logs</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-2">
            <Badge variant={hasSupabaseConfig ? "outline" : "destructive"} className="flex gap-1.5 py-1 px-3">
              {hasSupabaseConfig ? <Cloud className="h-3.5 w-3.5 text-green-600" /> : <CloudOff className="h-3.5 w-3.5" />}
              {hasSupabaseConfig ? "Database Linked" : "Local Only Mode"}
            </Badge>
            <Badge variant={isOnline ? "outline" : "destructive"} className="flex gap-1.5 py-1 px-3">
              {isOnline ? <Wifi className="h-3.5 w-3.5 text-blue-600" /> : <WifiOff className="h-3.5 w-3.5" />}
              {isOnline ? "System Online" : "Offline Mode"}
            </Badge>
          </div>
          {lastSyncTime && (
            <span className="text-[10px] text-muted-foreground italic">
              Last sync: {new Date(lastSyncTime).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2"><User className="h-4 w-4" /> System Control</span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 flex items-center gap-1.5" 
                  onClick={lockProfile}
                  title="Force Lock and switch to Profile selection"
                >
                  <Lock className="h-3.5 w-3.5" /> Lock Profiles
                </Button>
                <Button 
                  variant="default" 
                  size="sm" 
                  className="h-8 flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700" 
                  onClick={seedDatabase}
                  title="Seed Default Content"
                >
                  <Database className="h-3.5 w-3.5" /> Seed Menu
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => forceSync()} disabled={!isOnline} title="Force Sync">
                  <Globe className={`h-4 w-4 ${!isOnline ? 'text-muted-foreground' : 'text-primary'}`} />
                </Button>
              </div>
            </CardTitle>
            <CardDescription>Secure the POS terminal and manage your active account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="text-sm"><span className="text-muted-foreground">Admin:</span> <span className="font-medium">{currentUser.name}</span></div>
              <div className="text-sm"><span className="text-muted-foreground">Email:</span> <span className="font-medium">{currentUser.email}</span></div>
              <div className="text-sm flex items-center gap-2">
                <span className="text-muted-foreground">Current Status:</span> 
                <Badge className="bg-primary text-primary-foreground">Active Admin</Badge>
              </div>
            </div>
            
            <div className="pt-4 border-t space-y-3">
              <Button 
                variant="outline" 
                className="w-full flex items-center gap-2 text-destructive hover:text-destructive"
                onClick={logout}
              >
                <LogOut className="h-4 w-4" /> Full System Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>



        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" /> User Management
                </CardTitle>
                <CardDescription>Manage staff roles and system access</CardDescription>
              </div>
              <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" /> Add Staff Member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Staff Member</DialogTitle>
                    <DialogDescription>
                      Create a new account for bakery staff. They will receive an email to set their password.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Select value={newUser.role} onValueChange={(v: UserRole) => setNewUser({...newUser, role: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="production_manager">Prod. Manager</SelectItem>
                          <SelectItem value="branch_staff">Branch Staff</SelectItem>
                          <SelectItem value="accountant">Accountant</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {newUser.role === 'branch_staff' && (
                      <div className="space-y-2">
                        <Label>Select Branch</Label>
                        <Select value={newUser.branchId} onValueChange={(v) => setNewUser({...newUser, branchId: v})}>
                          <SelectTrigger><SelectValue placeholder="Branch 1" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="branch_1">Branch 1</SelectItem>
                            <SelectItem value="branch_2">Branch 2</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>Set 4-Digit PIN</Label>
                      <Input 
                        maxLength={4} 
                        placeholder="0000" 
                        className="text-center text-3xl tracking-[0.5em] font-mono h-14"
                        value={newUser.pin} 
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '');
                          if (val.length <= 4) setNewUser({...newUser, pin: val});
                        }} 
                      />
                    </div>
                  </div>
                </div>
                  <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddUserOpen(false)} disabled={isCreating}>Cancel</Button>
                  <Button onClick={handleCreateUser} disabled={isCreating}>
                    {isCreating ? 'Creating...' : 'Create Staff Account'}
                  </Button>
                </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Profile Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Assignment</TableHead>
                  <TableHead>PIN Code</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <span className="font-medium">{user.name}</span>
                    </TableCell>
                    <TableCell>
                      <Select 
                        value={user.role} 
                        onValueChange={(val: UserRole) => handleUpdateRole(user.id, val, user.branchId)}
                        disabled={user.id === currentUser.id}
                      >
                        <SelectTrigger className="w-[160px] h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="production_manager">Prod. Manager</SelectItem>
                          <SelectItem value="branch_staff">Branch Staff</SelectItem>
                          <SelectItem value="accountant">Accountant</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {user.role === 'branch_staff' ? (
                        <Select 
                          value={user.branchId || ''} 
                          onValueChange={(val) => handleUpdateRole(user.id, user.role, val)}
                        >
                          <SelectTrigger className="w-[140px] h-8 text-xs">
                            <SelectValue placeholder="No Branch" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="branch_1">Branch 1</SelectItem>
                            <SelectItem value="branch_2">Branch 2</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Factory / Global</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingPinId === user.id ? (
                        <div className="flex items-center gap-2">
                          <Input 
                            className="w-16 h-8 text-xs text-center" 
                            maxLength={4}
                            value={tempPin}
                            onChange={e => setTempPin(e.target.value.replace(/\D/g, ''))}
                            autoFocus
                          />
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleUpdatePin(user.id)}>
                            <ShieldCheck className="h-4 w-4 text-green-600" />
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          variant="ghost" 
                          className="h-8 text-xs font-mono tracking-widest hover:bg-muted"
                          onClick={() => {
                            setEditingPinId(user.id);
                            setTempPin(user.pinCode || '0000');
                          }}
                        >
                          ****
                        </Button>
                      )}
                    </TableCell>
                      <TableCell className="text-right">
                        {user.id !== currentUser.id && (
                          <Button variant="ghost" size="sm" className="text-destructive h-8 px-2" onClick={() => toast.info('Deletion must be done in Supabase Auth Dashboard for security.')}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Printer className="h-5 w-5" /> Receipt Configuration
                </CardTitle>
                <CardDescription>Manage business branding and branch-specific receipt information</CardDescription>
              </div>
              <Button onClick={handleSaveReceiptSettings} className="bg-green-600 hover:bg-green-700">
                <Save className="h-4 w-4 mr-2" /> Save Settings
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="branch_1" className="space-y-6">
              <TabsList className="grid grid-cols-3 w-full max-w-md">
                <TabsTrigger value="branch_1">Branch 1</TabsTrigger>
                <TabsTrigger value="branch_2">Branch 2</TabsTrigger>
                <TabsTrigger value="dispatch">Dispatch (Factory)</TabsTrigger>
              </TabsList>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* ─── Global Branding (editable from any tab) ─── */}
                <div className="space-y-4">
                  <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground border-b pb-1">Business Branding</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label>Brand Name</Label>
                      <Input 
                        value={formReceiptSettings.brandName} 
                        onChange={e => setFormReceiptSettings(s => ({ ...s, brandName: e.target.value }))} 
                        placeholder="M.A BAKER'S"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tagline</Label>
                      <Input 
                        value={formReceiptSettings.tagline} 
                        onChange={e => setFormReceiptSettings(s => ({ ...s, tagline: e.target.value }))} 
                        placeholder="Quality You Can Trust"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Business Logo</Label>
                      <div className="flex gap-4 items-center">
                        <Input type="file" accept="image/*" onChange={handleLogoUpload} className="cursor-pointer flex-1" />
                        {formReceiptSettings.logoUrl && (
                          <div className="h-10 w-10 border rounded p-1 bg-white">
                            <img src={formReceiptSettings.logoUrl} alt="Logo" className="max-h-full max-w-full object-contain filter grayscale" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ─── Tab Specific Settings ─── */}
                <TabsContent value="branch_1" className="mt-0 space-y-4">
                  <h3 className="font-bold text-sm uppercase tracking-wider text-primary border-b pb-1 border-primary/20">Branch 1 Details</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label>Branch Address</Label>
                      <Input 
                        value={formReceiptSettings.branch1Address} 
                        onChange={e => setFormReceiptSettings(s => ({ ...s, branch1Address: e.target.value }))} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Contact Number</Label>
                      <Input 
                        value={formReceiptSettings.branch1Phone} 
                        onChange={e => setFormReceiptSettings(s => ({ ...s, branch1Phone: e.target.value }))} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Cashier Display Name</Label>
                      <Input 
                        value={formReceiptSettings.branch1Cashier} 
                        onChange={e => setFormReceiptSettings(s => ({ ...s, branch1Cashier: e.target.value }))} 
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="branch_2" className="mt-0 space-y-4">
                  <h3 className="font-bold text-sm uppercase tracking-wider text-primary border-b pb-1 border-primary/20">Branch 2 Details</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label>Branch Address</Label>
                      <Input 
                        value={formReceiptSettings.branch2Address} 
                        onChange={e => setFormReceiptSettings(s => ({ ...s, branch2Address: e.target.value }))} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Contact Number</Label>
                      <Input 
                        value={formReceiptSettings.branch2Phone} 
                        onChange={e => setFormReceiptSettings(s => ({ ...s, branch2Phone: e.target.value }))} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Cashier Display Name</Label>
                      <Input 
                        value={formReceiptSettings.branch2Cashier} 
                        onChange={e => setFormReceiptSettings(s => ({ ...s, branch2Cashier: e.target.value }))} 
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="dispatch" className="mt-0 space-y-4">
                  <h3 className="font-bold text-sm uppercase tracking-wider text-primary border-b pb-1 border-primary/20">Factory Dispatch Info</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label>Dispatch Station Address</Label>
                      <Input 
                        value={formReceiptSettings.dispatchAddress} 
                        onChange={e => setFormReceiptSettings(s => ({ ...s, dispatchAddress: e.target.value }))} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Dispatch Contact</Label>
                      <Input 
                        value={formReceiptSettings.dispatchPhone} 
                        onChange={e => setFormReceiptSettings(s => ({ ...s, dispatchPhone: e.target.value }))} 
                      />
                    </div>
                  </div>
                </TabsContent>
              </div>

              <div className="pt-6 border-t grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground border-b pb-1">Receipt Footer</h3>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Footer Message 1</Label>
                      <Input 
                        value={formReceiptSettings.footerMessage1} 
                        onChange={e => setFormReceiptSettings(s => ({ ...s, footerMessage1: e.target.value }))} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Footer Message 2</Label>
                      <Input 
                        value={formReceiptSettings.footerMessage2} 
                        onChange={e => setFormReceiptSettings(s => ({ ...s, footerMessage2: e.target.value }))} 
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                   <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground border-b pb-1">System Info</h3>
                   <div className="space-y-2">
                      <Label>Software Credits (shown at bottom)</Label>
                      <Input 
                        value={formReceiptSettings.printedBy} 
                        onChange={e => setFormReceiptSettings(s => ({ ...s, printedBy: e.target.value }))} 
                      />
                    </div>
                </div>
              </div>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> Recent Audit Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {auditLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No logs recorded yet</p>
              ) : (
                <div className="border rounded-md divide-y max-h-[300px] overflow-y-auto">
                  {auditLogs.slice().reverse().map(log => (
                    <div key={log.id} className="p-3 text-sm flex justify-between items-start hover:bg-muted/50 transition-colors">
                      <div>
                        <p className="font-medium text-foreground capitalize">{log.action} {log.entity}</p>
                        <p className="text-muted-foreground text-xs">{log.details}</p>
                      </div>
                      <p className="text-[10px] text-muted-foreground whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
