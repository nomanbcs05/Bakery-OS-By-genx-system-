import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Settings as SettingsIcon, ShieldCheck, Database, Trash2, Globe, Wifi, WifiOff, LogOut, Users, UserPlus, Mail, Shield, Lock, Printer, Save, Cloud, CloudOff, ChefHat, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Navigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';

export default function SettingsPage() {
  const { 
    currentUser, 
    allUsers, 
    updateUserPin,
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

  const [isPinManagementVerified, setIsPinManagementVerified] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState(currentUser?.email || '');
  const [verifyPassword, setVerifyPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [formReceiptSettings, setFormReceiptSettings] = useState(receiptSettings);

  useEffect(() => {
    setFormReceiptSettings(receiptSettings);
  }, [receiptSettings]);

  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role !== 'admin') return <Navigate to="/" replace />;

  const handleVerifyAdmin = async () => {
    if (!verifyPassword) {
      toast.error('Please enter your password');
      return;
    }
    
    setIsVerifying(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: verifyEmail,
        password: verifyPassword,
      });
      
      if (error) throw error;
      
      setIsPinManagementVerified(true);
      toast.success('Identity verified. You can now manage passcodes.');
      setVerifyPassword('');
    } catch (error: any) {
      toast.error(error.message || 'Verification failed. Please check your credentials.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleUpdatePin = async (userId: string, newPin: string) => {
    if (newPin.length !== 4 || isNaN(Number(newPin))) {
      toast.error('PIN must be 4 digits');
      return;
    }
    await updateUserPin(userId, newPin);
  };

  const { createStaffMember } = useApp();
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);

  const handleCreateProfile = async (role: UserRole) => {
    setIsCreatingProfile(true);
    try {
      let name = '';
      let email = '';
      let branchId: any = undefined;

      if (role === 'production_manager') {
        name = 'Production Manager';
        email = 'production@bakewise.com';
      } else if (role === 'accountant') {
        name = 'Accountant';
        email = 'accountant@bakewise.com';
      } else if (role === 'branch_staff') {
        const count = allUsers.filter(u => u.role === 'branch_staff').length;
        branchId = count === 0 ? 'branch_1' : 'branch_2';
        name = branchId === 'branch_1' ? 'Branch 1 POS' : 'Branch 2 POS';
        email = `${branchId}@bakewise.com`;
      } else if (role === 'admin') {
        name = 'Additional Admin';
        email = `admin${Date.now()}@bakewise.com`;
      }

      await createStaffMember(name, email, 'bakewise123', role, branchId, '0000');
      toast.success(`${name} profile created successfully`);
    } catch (error: any) {
      toast.error('Failed to create profile');
    } finally {
      setIsCreatingProfile(false);
    }
  };

  const handleSaveReceiptSettings = () => {
    updateReceiptSettings(formReceiptSettings);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">System configuration and security</p>
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

      <Tabs defaultValue="access" className="space-y-6">
        <TabsList className="bg-slate-100 p-1 rounded-xl h-auto flex flex-wrap gap-1">
          <TabsTrigger value="access" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
            <Lock className="h-3.5 w-3.5" /> Passcodes
          </TabsTrigger>
          <TabsTrigger value="general" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
            <SettingsIcon className="h-3.5 w-3.5" /> General Settings
          </TabsTrigger>
          <TabsTrigger value="receipt" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
            <Printer className="h-3.5 w-3.5" /> Receipts
          </TabsTrigger>
          <TabsTrigger value="logs" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5" /> Audit Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="access" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          {!isPinManagementVerified ? (
            <Card className="max-w-md mx-auto">
              <CardHeader className="text-center">
                <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Verify Admin Access</CardTitle>
                <CardDescription>Enter your admin credentials to manage user passcodes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Admin Email</Label>
                  <Input value={verifyEmail} onChange={e => setVerifyEmail(e.target.value)} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Admin Password</Label>
                  <Input type="password" value={verifyPassword} onChange={e => setVerifyPassword(e.target.value)} placeholder="••••••••" />
                </div>
                <Button className="w-full" onClick={handleVerifyAdmin} disabled={isVerifying}>
                  {isVerifying ? 'Verifying...' : 'Verify Identity'}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {['admin', 'production_manager', 'branch_staff', 'accountant'].map(role => {
                const userProfiles = allUsers.filter(u => u.role === role);
                return (
                  <Card key={role}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                          {role === 'admin' && <Shield className="h-4 w-4 text-red-500" />}
                          {role === 'production_manager' && <ChefHat className="h-4 w-4 text-blue-500" />}
                          {role === 'branch_staff' && <Users className="h-4 w-4 text-orange-500" />}
                          {role === 'accountant' && <Wallet className="h-4 w-4 text-green-500" />}
                          {role.replace('_', ' ')}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                           <Badge variant="outline" className="text-[9px] uppercase">{userProfiles.length} Total</Badge>
                           <Button 
                             variant="ghost" 
                             size="icon" 
                             className="h-6 w-6 rounded-full hover:bg-slate-100" 
                             onClick={() => handleCreateProfile(role as UserRole)}
                             disabled={isCreatingProfile}
                             title={`Add ${role.replace('_', ' ')} profile`}
                           >
                             <UserPlus className="h-3 w-3" />
                           </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {userProfiles.length === 0 && (
                        <div className="py-2 text-center">
                          <p className="text-[10px] text-muted-foreground italic mb-2">No profiles created for this role</p>
                        </div>
                      )}
                      {userProfiles.map(u => (
                        <div key={u.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 group transition-all hover:bg-white hover:shadow-sm">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-900">{u.name}</span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {u.branchId ? `Assigned to ${u.branchId.replace('_', ' ')}` : 'Global Access'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Input 
                              type="text" 
                              maxLength={4}
                              defaultValue={u.pinCode}
                              onBlur={(e) => {
                                if (e.target.value !== u.pinCode) {
                                  handleUpdatePin(u.id, e.target.value);
                                }
                              }}
                              className="w-16 h-8 text-center font-mono font-black text-xs tracking-widest bg-white"
                            />
                            <div className="h-8 w-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Save className="h-3.5 w-3.5 text-slate-300" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                );
              })}
              <div className="md:col-span-2 text-center py-4">
                <Button variant="ghost" size="sm" onClick={() => setIsPinManagementVerified(false)} className="text-muted-foreground">
                  <Lock className="h-3 w-3 mr-2" /> Session Secure - Logout from PIN Management
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="general" className="animate-in fade-in slide-in-from-bottom-2">
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
                    >
                      <Lock className="h-3.5 w-3.5" /> Lock Profiles
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => forceSync()} disabled={!isOnline}>
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
                </div>
                <div className="pt-4 border-t space-y-3">
                  <Button variant="outline" className="w-full flex items-center gap-2 text-destructive hover:text-destructive" onClick={logout}>
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
                <CardDescription>Reset or clear system data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2" 
                  onClick={seedDatabase}
                >
                  <Database className="h-4 w-4 text-blue-500" /> Reset to Defaults (Seed)
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2 text-destructive" 
                  onClick={() => {
                    if (confirm('Are you sure you want to clear ALL report data? This cannot be undone.')) {
                      clearAllReportData();
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" /> Clear All Sales & Reports
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="receipt" className="animate-in fade-in slide-in-from-bottom-2">
          <Card>
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
                  <div className="space-y-4">
                    <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground border-b pb-1">Business Branding</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label>Brand Name</Label>
                        <Input 
                          value={formReceiptSettings.brandName} 
                          onChange={e => setFormReceiptSettings(s => ({ ...s, brandName: e.target.value }))} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Tagline</Label>
                        <Input 
                          value={formReceiptSettings.tagline} 
                          onChange={e => setFormReceiptSettings(s => ({ ...s, tagline: e.target.value }))} 
                        />
                      </div>
                    </div>
                  </div>

                  <TabsContent value="branch_1" className="mt-0 space-y-4">
                    <h3 className="font-bold text-sm uppercase tracking-wider text-primary border-b pb-1 border-primary/20">Branch 1 Details</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2"><Label>Branch Address</Label><Input value={formReceiptSettings.branch1Address} onChange={e => setFormReceiptSettings(s => ({ ...s, branch1Address: e.target.value }))} /></div>
                      <div className="space-y-2"><Label>Contact Number</Label><Input value={formReceiptSettings.branch1Phone} onChange={e => setFormReceiptSettings(s => ({ ...s, branch1Phone: e.target.value }))} /></div>
                    </div>
                  </TabsContent>

                  <TabsContent value="branch_2" className="mt-0 space-y-4">
                    <h3 className="font-bold text-sm uppercase tracking-wider text-primary border-b pb-1 border-primary/20">Branch 2 Details</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2"><Label>Branch Address</Label><Input value={formReceiptSettings.branch2Address} onChange={e => setFormReceiptSettings(s => ({ ...s, branch2Address: e.target.value }))} /></div>
                      <div className="space-y-2"><Label>Contact Number</Label><Input value={formReceiptSettings.branch2Phone} onChange={e => setFormReceiptSettings(s => ({ ...s, branch2Phone: e.target.value }))} /></div>
                    </div>
                  </TabsContent>

                  <TabsContent value="dispatch" className="mt-0 space-y-4">
                    <h3 className="font-bold text-sm uppercase tracking-wider text-primary border-b pb-1 border-primary/20">Factory Dispatch Info</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2"><Label>Dispatch Station Address</Label><Input value={formReceiptSettings.dispatchAddress} onChange={e => setFormReceiptSettings(s => ({ ...s, dispatchAddress: e.target.value }))} /></div>
                      <div className="space-y-2"><Label>Dispatch Contact</Label><Input value={formReceiptSettings.dispatchPhone} onChange={e => setFormReceiptSettings(s => ({ ...s, dispatchPhone: e.target.value }))} /></div>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="animate-in fade-in slide-in-from-bottom-2">
          <Card>
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
                  <div className="border rounded-md divide-y max-h-[500px] overflow-y-auto">
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
