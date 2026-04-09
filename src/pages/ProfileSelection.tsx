import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChefHat, Lock, ArrowLeft, Loader2, User as UserIcon, Store, Shield, Factory } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { UserRole } from '@/types';

const VIRTUAL_PROFILES = [
  {
    id: 'branch-1-pos',
    name: 'Branch 1 POS',
    role: 'branch_staff' as UserRole,
    branchId: 'branch_1' as const,
    icon: Store,
    color: 'bg-orange-600'
  },
  {
    id: 'branch-2-pos',
    name: 'Branch 2 POS',
    role: 'branch_staff' as UserRole,
    branchId: 'branch_2' as const,
    icon: Store,
    color: 'bg-green-600'
  },
  {
    id: 'admin',
    name: 'ADMIN',
    role: 'admin' as UserRole,
    icon: Shield,
    color: 'bg-red-600'
  },
  {
    id: 'production-manager',
    name: 'PRODUCTION MANAGER',
    role: 'production_manager' as UserRole,
    icon: Factory,
    color: 'bg-blue-600'
  }
];

export default function ProfileSelection() {
  const { selectProfile, verifyPin, selectedProfile, logout } = useApp();
  const [step, setStep] = useState<'select' | 'pin'>('select');
  const [pin, setPin] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [selectedProfileLocal, setSelectedProfileLocal] = useState<any>(null);

  const handleProfileClick = (profile: any) => {
    // Create a user object for the context
    const userProfile = {
      id: profile.id,
      name: profile.name,
      email: '',
      role: profile.role,
      branchId: profile.branchId,
      pinCode: '0000'
    };
    setSelectedProfileLocal(userProfile);
    selectProfile(userProfile);
    setStep('pin');
    setPin('');
  };

  const handlePinSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pin.length !== 4) return;

    setIsVerifying(true);
    // Simulate a small delay for feel
    setTimeout(() => {
      const success = verifyPin(pin);
      if (success) {
        toast.success(`Welcome back, ${selectedProfileLocal?.name}!`);
      } else {
        toast.error('Invalid PIN code');
        setPin('');
      }
      setIsVerifying(false);
    }, 500);
  };

  const handleBack = () => {
    setStep('select');
    setPin('');
    setSelectedProfileLocal(null);
  };

  if (step === 'select') {
    return (
      <div className="min-h-screen bg-[#141414] text-white flex flex-col items-center justify-center p-4 animate-in fade-in duration-700">
        <div className="mb-12 text-center space-y-4">
          <ChefHat className="h-16 w-16 text-primary mx-auto mb-2 animate-bounce" />
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">Welcome</h1>
          <p className="text-gray-400 text-lg">Select a profile to continue</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 max-w-6xl px-4">
          {VIRTUAL_PROFILES.map((profile) => (
            <button
              key={profile.id}
              onClick={() => handleProfileClick(profile)}
              className="group flex flex-col items-center space-y-4 transition-all duration-300 hover:scale-110"
            >
              <div className="relative h-32 w-32 md:h-44 md:w-44 rounded-md overflow-hidden bg-[#222] flex items-center justify-center border-[3px] border-transparent group-hover:border-white transition-all duration-300 shadow-2xl">
                <div className={cn(
                  "h-full w-full flex flex-col items-center justify-center p-4 text-center",
                  profile.color,
                  "shadow-[inset_0_0_50px_rgba(0,0,0,0.3)]"
                )}>
                  <profile.icon className="h-12 w-12 md:h-16 md:w-16 mb-2 text-white/90" />
                  <span className="text-xs md:text-sm font-bold uppercase tracking-tighter text-white/80">
                    {profile.name}
                  </span>
                </div>
                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-300" />
              </div>
              <div className="text-center">
                <span className="block text-gray-400 group-hover:text-white transition-colors text-xl font-medium">
                  {profile.name}
                </span>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-8 flex flex-col items-center gap-4">
          <Button 
            variant="outline" 
            className="border-gray-600 text-gray-400 hover:bg-white hover:text-black transition-all rounded-none px-8 py-6 text-lg uppercase tracking-widest"
            onClick={logout}
          >
            Manage Account
          </Button>
          <p className="text-gray-600 text-xs">Bakewise ERP v1.0.4 - Secure Terminal</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md text-center space-y-8 animate-in zoom-in-95 duration-300">
        <button 
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 mx-auto transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to profiles
        </button>

        <div className="flex flex-col items-center space-y-4">
          <div className="h-32 w-32 rounded-md overflow-hidden bg-muted flex items-center justify-center border-2 border-white shadow-2xl">
            {selectedProfileLocal?.avatarUrl ? (
              <img src={selectedProfileLocal.avatarUrl} alt={selectedProfileLocal.name} className="h-full w-full object-cover" />
            ) : (
              <div className={cn(
                "h-full w-full flex items-center justify-center text-5xl font-bold capitalize",
                selectedProfileLocal?.role === 'admin' ? "bg-red-600" : 
                selectedProfileLocal?.role === 'production_manager' ? "bg-blue-600" :
                selectedProfileLocal?.role === 'accountant' ? "bg-green-600" : "bg-orange-600"
              )}>
                {selectedProfileLocal?.name[0]}
              </div>
            )}
          </div>
          <h2 className="text-3xl font-bold">Enter PIN</h2>
          <p className="text-gray-400">Enter the 4-digit PIN for {selectedProfileLocal?.name}</p>
        </div>

        <form onSubmit={handlePinSubmit} className="space-y-6">
          <div className="flex justify-center gap-4">
            <Input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                setPin(val);
                if (val.length === 4) {
                  // Auto submit
                  setTimeout(() => {
                    const success = verifyPin(val);
                    if (success) toast.success(`Welcome back, ${selectedProfile?.name}!`);
                    else {
                      toast.error('Invalid PIN code');
                      setPin('');
                    }
                  }, 100);
                }
              }}
              className="w-48 h-16 text-center text-4xl tracking-[1em] bg-transparent border-gray-600 focus:border-white transition-all rounded-none border-b-2 border-x-0 border-t-0 focus:ring-0"
              autoFocus
              disabled={isVerifying}
            />
          </div>

          <div className="pt-4">
            {isVerifying ? (
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            ) : (
              <div className="h-8" /> 
            )}
          </div>
        </form>

        <p className="text-gray-500 text-sm">
          Forgot your PIN? Contact your administrator.
        </p>
      </div>
    </div>
  );
}
