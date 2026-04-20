import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Printer, Save, Lock, Trash2, Settings as SettingsIcon, Store } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function BranchSettings() {
  const { 
    selectedProfile,
    receiptSettings,
    updateReceiptSettings
  } = useApp();

  const [formSettings, setFormSettings] = useState(receiptSettings);

  useEffect(() => {
    setFormSettings(receiptSettings);
  }, [receiptSettings]);

  if (!selectedProfile) return <Navigate to="/login" replace />;
  
  const branch = selectedProfile.branchId;
  const branchLabel = branch === 'branch_1' ? 'Branch 1' : 'Branch 2';
  const branchNum = branch === 'branch_1' ? '1' : '2';

  const handleSave = () => {
    updateReceiptSettings(formSettings);
    toast.success(`${branchLabel} receipt settings saved successfully`);
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
      setFormSettings(prev => ({ ...prev, logoUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  // Get the branch-specific field values
  const branchLocation = branch === 'branch_1' ? formSettings.branch1Location : formSettings.branch2Location;
  const branchOnlineOrder = branch === 'branch_1' ? formSettings.branch1OnlineOrder : formSettings.branch2OnlineOrder;
  const branchCashier = branch === 'branch_1' ? formSettings.branch1Cashier : formSettings.branch2Cashier;

  const setBranchField = (field: string, value: string) => {
    if (branch === 'branch_1') {
      if (field === 'location') setFormSettings(s => ({ ...s, branch1Location: value }));
      if (field === 'onlineOrder') setFormSettings(s => ({ ...s, branch1OnlineOrder: value }));
      if (field === 'cashier') setFormSettings(s => ({ ...s, branch1Cashier: value }));
    } else {
      if (field === 'location') setFormSettings(s => ({ ...s, branch2Location: value }));
      if (field === 'onlineOrder') setFormSettings(s => ({ ...s, branch2OnlineOrder: value }));
      if (field === 'cashier') setFormSettings(s => ({ ...s, branch2Cashier: value }));
    }
  };

  const isLocked = false; // Branch staff can always edit branch settings

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <SettingsIcon className="h-6 w-6" /> {branchLabel} Settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Configure receipt information for {branchLabel}
          </p>
        </div>
        <Badge variant="outline" className="flex gap-1.5 py-1 px-3">
          <Store className="h-3.5 w-3.5 text-primary" />
          {branchLabel} · POS Terminal
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ─── Shared Business Info (editable) ─── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Printer className="h-4 w-4" /> Business Information
              </span>
              {isLocked && (
                <Badge variant="outline" className="flex gap-1.5 py-1 px-3 border-amber-500 text-amber-700 bg-amber-50">
                  <Lock className="h-3.5 w-3.5" /> Locked
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Shared business details shown on all receipts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Brand Name</Label>
              <Input 
                value={formSettings.brandName} 
                onChange={e => setFormSettings(s => ({ ...s, brandName: e.target.value }))} 
                placeholder="Bakewise"
                disabled={isLocked}
              />
            </div>
            <div className="space-y-2">
              <Label>Tagline</Label>
              <Input 
                value={formSettings.tagline} 
                onChange={e => setFormSettings(s => ({ ...s, tagline: e.target.value }))} 
                placeholder="Fresh Baked Daily"
                disabled={isLocked}
              />
            </div>
            <div className="space-y-2">
              <Label>Business Logo</Label>
              <div className="flex gap-4 items-center">
                <div className="flex-1 space-y-2">
                  <Input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleLogoUpload}
                    className="cursor-pointer"
                    disabled={isLocked}
                  />
                  <p className="text-[10px] text-muted-foreground italic">Max 512KB. Shown on printed receipts.</p>
                </div>
                {formSettings.logoUrl && (
                  <div className="relative group">
                    <div className="h-14 w-14 border rounded p-1 bg-white flex items-center justify-center shrink-0">
                      <img src={formSettings.logoUrl} alt="Preview" className="max-h-full max-w-full object-contain filter grayscale" />
                    </div>
                    {!isLocked && (
                      <button 
                        onClick={() => setFormSettings(s => ({ ...s, logoUrl: '' }))}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove Logo"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input 
                value={formSettings.address} 
                onChange={e => setFormSettings(s => ({ ...s, address: e.target.value }))} 
                placeholder="Nawabshah, Pakistan"
                disabled={isLocked}
              />
            </div>
            <div className="space-y-2">
              <Label>Main Phone</Label>
              <Input 
                value={formSettings.phone} 
                onChange={e => setFormSettings(s => ({ ...s, phone: e.target.value }))} 
                placeholder="03111855990"
                disabled={isLocked}
              />
            </div>
          </CardContent>
        </Card>

        {/* ─── Branch-Specific Receipt Info ─── */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Store className="h-4 w-4 text-primary" /> {branchLabel} Receipt Details
              </span>
              <Badge className="bg-primary text-primary-foreground">
                {branchLabel} Only
              </Badge>
            </CardTitle>
            <CardDescription>
              These settings only apply to {branchLabel} receipts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{branchLabel} Location / Name</Label>
              <Input 
                value={branchLocation} 
                onChange={e => setBranchField('location', e.target.value)} 
                placeholder={branch === 'branch_1' ? 'DHAMRA ROAD' : 'JAM SAHAB RD'}
                disabled={isLocked}
              />
            </div>
            <div className="space-y-2">
              <Label>{branchLabel} Order Number</Label>
              <Input 
                value={branchOnlineOrder} 
                onChange={e => setBranchField('onlineOrder', e.target.value)} 
                placeholder={branch === 'branch_1' ? '03297040402' : '03093660360'}
                disabled={isLocked}
              />
            </div>
            <div className="space-y-2">
              <Label>{branchLabel} Cashier Name</Label>
              <Input 
                value={branchCashier} 
                onChange={e => setBranchField('cashier', e.target.value)} 
                placeholder={branch === 'branch_1' ? 'M. Ali' : 'Faisal'}
                disabled={isLocked}
              />
            </div>

            <div className="pt-4 border-t space-y-4">
              <div className="space-y-2">
                <Label>Footer Message 1</Label>
                <Input 
                  value={formSettings.footerMessage1} 
                  onChange={e => setFormSettings(s => ({ ...s, footerMessage1: e.target.value }))} 
                  placeholder="Thank you for shopping with elegance."
                  disabled={isLocked}
                />
              </div>
              <div className="space-y-2">
                <Label>Footer Message 2</Label>
                <Input 
                  value={formSettings.footerMessage2} 
                  onChange={e => setFormSettings(s => ({ ...s, footerMessage2: e.target.value }))} 
                  placeholder="For quality assurance, cut pieces cannot be returned."
                  disabled={isLocked}
                />
              </div>
              <div className="space-y-2">
                <Label>Printed By (Software credits)</Label>
                <Input 
                  value={formSettings.printedBy} 
                  onChange={e => setFormSettings(s => ({ ...s, printedBy: e.target.value }))} 
                  placeholder="GENX CLOUD, NAWABSHAH +923342826675"
                  disabled={isLocked}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      {!isLocked && (
        <div className="flex justify-end">
          <Button 
            onClick={handleSave} 
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-8"
          >
            <Save className="h-4 w-4" /> Save {branchLabel} Settings
          </Button>
        </div>
      )}
    </div>
  );
}
