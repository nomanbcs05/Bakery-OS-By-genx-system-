import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Settings as SettingsIcon, ShieldCheck, Database, Trash2, Globe, Wifi, WifiOff, LogOut, Users, UserPlus, Mail, Shield, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Navigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
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
    auditLogs
  } = useApp();

  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({ role: 'branch_staff' as UserRole, branchId: '', pin: '0000' });
  const [isCreating, setIsCreating] = useState(false);

  const [editingPinId, setEditingPinId] = useState<string | null>(null);
  const [tempPin, setTempPin] = useState('');

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
          <Badge variant={isOnline ? "outline" : "destructive"} className="flex gap-1.5 py-1 px-3">
            {isOnline ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
            {isOnline ? "System Online" : "Offline Mode"}
          </Badge>
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="h-4 w-4" /> Data Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              All data is synced with Supabase and stored locally for offline access.
            </p>
            <div className="grid grid-cols-1 gap-3">
              <Button 
                variant="outline" 
                className="w-full flex items-center gap-2"
                onClick={() => {
                  if (confirm('This will seed the initial products and batches into Supabase. Continue?')) {
                    seedDatabase();
                  }
                }}
              >
                <Database className="h-4 w-4" /> Seed Initial Data
              </Button>
              <Button 
                variant="destructive" 
                className="w-full flex items-center gap-2"
                onClick={() => {
                  if (confirm('Are you sure? This will delete all local sales, production, and expense data.')) {
                    clearAllReportData();
                  }
                }}
              >
                <Trash2 className="h-4 w-4" /> Reset All System Data
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
