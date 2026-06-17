import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { ChefHat, ArrowLeft, Loader2, Store, Shield, Factory, LogOut, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { User, UserRole } from '@/types';

const getProfileStyle = (role: string, branchId?: string) => {
  if (role === 'admin') {
    return {
      icon: Shield,
      gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      shadowColor: 'rgba(239,68,68,0.25)',
      bgTint: 'rgba(239,68,68,0.06)',
      borderTint: 'rgba(239,68,68,0.22)',
      dotColor: '#ef4444',
    };
  } else if (role === 'production_manager') {
    return {
      icon: Factory,
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      shadowColor: 'rgba(59,130,246,0.25)',
      bgTint: 'rgba(59,130,246,0.06)',
      borderTint: 'rgba(59,130,246,0.22)',
      dotColor: '#3b82f6',
    };
  } else if (role === 'accountant') {
    return {
      icon: Wallet,
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      shadowColor: 'rgba(16,185,129,0.25)',
      bgTint: 'rgba(16,185,129,0.06)',
      borderTint: 'rgba(16,185,129,0.22)',
      dotColor: '#10b981',
    };
  } else {
    const isBranch2 = branchId === 'branch_2';
    return {
      icon: Store,
      gradient: isBranch2 
        ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' 
        : 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
      shadowColor: isBranch2 ? 'rgba(34,197,94,0.25)' : 'rgba(249,115,22,0.25)',
      bgTint: isBranch2 ? 'rgba(34,197,94,0.06)' : 'rgba(249,115,22,0.06)',
      borderTint: isBranch2 ? 'rgba(34,197,94,0.22)' : 'rgba(249,115,22,0.22)',
      dotColor: isBranch2 ? '#22c55e' : '#f97316',
    };
  }
};

const getShortName = (name: string, role: string, branchId?: string) => {
  if (role === 'branch_staff') {
    return branchId === 'branch_2' ? 'B2' : 'B1';
  }
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

export default function ProfileSelection() {
  const { selectProfile, verifyPin, selectedProfile, logout, allUsers } = useApp();
  const [step, setStep] = useState<'select' | 'pin'>('select');
  const [pin, setPin] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [selectedProfileLocal, setSelectedProfileLocal] = useState<any>(null);

  // Define standard slots to make sure they are always present on the login screen
  const defaultSlots = [
    {
      id: 'default-branch-1-pos',
      defaultName: 'Branch 1 POS',
      role: 'branch_staff' as UserRole,
      branchId: 'branch_1',
      defaultPin: '0000',
    },
    {
      id: 'default-branch-2-pos',
      defaultName: 'Branch 2 POS',
      role: 'branch_staff' as UserRole,
      branchId: 'branch_2',
      defaultPin: '0000',
    },
    {
      id: 'default-admin',
      defaultName: 'Admin',
      role: 'admin' as UserRole,
      branchId: undefined,
      defaultPin: '1234',
    },
    {
      id: 'default-production-manager',
      defaultName: 'Production Manager',
      role: 'production_manager' as UserRole,
      branchId: undefined,
      defaultPin: '0000',
    }
  ];

  const usedUserIds = new Set<string>();
  const renderedProfiles: User[] = [];

  // Match default slots to real database users if they exist, otherwise use fallbacks
  defaultSlots.forEach(slot => {
    const dbUser = allUsers.find(u => 
      u.role === slot.role && 
      (slot.branchId ? u.branchId === slot.branchId : true) &&
      !usedUserIds.has(u.id)
    );

    if (dbUser) {
      usedUserIds.add(dbUser.id);
      renderedProfiles.push({
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email || '',
        role: dbUser.role,
        branchId: dbUser.branchId,
        pinCode: dbUser.pinCode || slot.defaultPin
      });
    } else {
      renderedProfiles.push({
        id: slot.id,
        name: slot.defaultName,
        email: '',
        role: slot.role,
        branchId: slot.branchId,
        pinCode: slot.defaultPin
      });
    }
  });

  // Add any other user profiles found in the database that are not one of the default core slots
  allUsers.forEach(u => {
    if (!usedUserIds.has(u.id)) {
      renderedProfiles.push({
        id: u.id,
        name: u.name,
        email: u.email || '',
        role: u.role,
        branchId: u.branchId,
        pinCode: u.pinCode || '0000'
      });
    }
  });

  const handleProfileClick = (user: User) => {
    const style = getProfileStyle(user.role, user.branchId);
    const shortName = getShortName(user.name, user.role, user.branchId);
    
    const userProfile = {
      id: user.id,
      name: user.name,
      email: user.email || '',
      role: user.role,
      branchId: user.branchId,
      pinCode: user.pinCode || '0000',
      shortName,
      ...style
    };
    setSelectedProfileLocal(userProfile);
    selectProfile(user);
    setStep('pin');
    setPin('');
  };

  const handleBack = () => {
    setStep('select');
    setPin('');
    setSelectedProfileLocal(null);
  };

  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

    .ps-page {
      height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: 'Inter', system-ui, sans-serif;
      overflow: hidden;
      position: relative;
      background: hsl(36, 33%, 97%);
    }

    /* Subtle mesh gradient background */
    .ps-page::before {
      content: '';
      position: absolute;
      inset: 0;
      background:
        radial-gradient(ellipse at 0% 0%, hsla(32, 95%, 44%, 0.07) 0%, transparent 50%),
        radial-gradient(ellipse at 100% 0%, hsla(142, 71%, 45%, 0.05) 0%, transparent 50%),
        radial-gradient(ellipse at 100% 100%, hsla(32, 95%, 44%, 0.06) 0%, transparent 50%),
        radial-gradient(ellipse at 0% 100%, hsla(210, 100%, 52%, 0.04) 0%, transparent 50%);
      pointer-events: none;
    }

    .ps-content {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
      max-width: 880px;
      padding: 0 2rem;
    }

    /* ─── HEADER ─── */
    .ps-header {
      text-align: center;
      margin-bottom: 2.25rem;
      animation: psFadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    .ps-logo {
      width: 50px;
      height: 50px;
      border-radius: 14px;
      background: linear-gradient(135deg, hsl(32, 95%, 44%) 0%, hsl(25, 90%, 48%) 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.25rem;
      box-shadow: 0 4px 18px hsla(32, 95%, 44%, 0.25);
    }

    .ps-title {
      font-size: 1.75rem;
      font-weight: 800;
      color: #1a1a1a;
      letter-spacing: -0.04em;
      margin: 0 0 0.4rem 0;
      line-height: 1.2;
    }

    .ps-title span {
      color: hsl(32, 95%, 44%);
    }

    .ps-subtitle {
      font-size: 0.9rem;
      color: #888;
      font-weight: 400;
      margin: 0 0 0.2rem 0;
      max-width: 460px;
      line-height: 1.5;
    }

    .ps-select-label {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      margin-top: 0.75rem;
      font-size: 0.78rem;
      font-weight: 600;
      color: hsl(32, 95%, 44%);
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .ps-select-label::before,
    .ps-select-label::after {
      content: '';
      width: 28px;
      height: 1.5px;
      background: hsla(32, 95%, 44%, 0.25);
      border-radius: 1px;
    }

    /* ─── PROFILE GRID ─── */
    .ps-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.125rem;
      width: 100%;
      animation: psFadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both;
    }

    @keyframes psFadeIn {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .ps-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1.5rem 1rem;
      background: white;
      border: 1.5px solid hsl(36, 20%, 90%);
      border-radius: 18px;
      cursor: pointer;
      transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      position: relative;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }

    .ps-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 16px 40px rgba(0,0,0,0.08);
    }

    .ps-card:active {
      transform: translateY(-1px) scale(0.98);
    }

    .ps-card-icon {
      width: 60px;
      height: 60px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 0.875rem;
      transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .ps-card:hover .ps-card-icon {
      transform: scale(1.1);
    }

    .ps-card-name {
      font-size: 0.85rem;
      font-weight: 650;
      color: #1a1a1a;
      text-align: center;
      margin-bottom: 0.2rem;
      transition: color 0.3s ease;
    }

    .ps-card-role {
      font-size: 0.68rem;
      color: #aaa;
      font-weight: 400;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .ps-card-dot {
      position: absolute;
      top: 0.75rem;
      right: 0.75rem;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .ps-card:hover .ps-card-dot {
      opacity: 1;
    }

    /* ─── FOOTER ─── */
    .ps-footer {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.625rem;
      margin-top: 2.25rem;
      animation: psFadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both;
    }

    .ps-logout-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.55rem 1.5rem;
      font-size: 0.76rem;
      font-weight: 500;
      font-family: 'Inter', system-ui, sans-serif;
      color: #999;
      background: white;
      border: 1.5px solid hsl(36, 20%, 90%);
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.3s ease;
      letter-spacing: 0.02em;
    }

    .ps-logout-btn:hover {
      color: #ef4444;
      border-color: rgba(239,68,68,0.25);
      background: rgba(239,68,68,0.04);
    }

    .ps-footer-brand {
      text-align: center;
      margin-top: 0.25rem;
    }

    .ps-footer-brand .ps-version {
      font-size: 0.72rem;
      font-weight: 500;
      color: #bbb;
      margin: 0 0 0.2rem 0;
    }

    .ps-footer-brand .ps-version strong {
      color: #999;
      font-weight: 700;
    }

    .ps-footer-brand .ps-powered {
      font-size: 0.7rem;
      color: #ccc;
      margin: 0;
      font-weight: 400;
    }

    .ps-footer-brand .ps-powered a {
      color: hsl(32, 95%, 44%);
      text-decoration: none;
      font-weight: 600;
      transition: color 0.2s ease;
    }

    .ps-footer-brand .ps-powered a:hover {
      color: hsl(32, 95%, 38%);
      text-decoration: underline;
    }

    /* ─── PIN STEP ─── */
    .ps-pin-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.5rem;
      animation: psFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    .ps-pin-back {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.82rem;
      font-family: 'Inter', system-ui, sans-serif;
      color: #aaa;
      background: none;
      border: none;
      cursor: pointer;
      transition: color 0.2s ease;
      margin-bottom: 0.25rem;
    }

    .ps-pin-back:hover {
      color: #555;
    }

    .ps-pin-avatar {
      width: 76px;
      height: 76px;
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.6rem;
      font-weight: 800;
      color: white;
      position: relative;
    }

    .ps-pin-avatar::after {
      content: '';
      position: absolute;
      inset: -3px;
      border-radius: 23px;
      border: 2px solid hsla(36, 20%, 88%, 1);
    }

    .ps-pin-name {
      font-size: 1.4rem;
      font-weight: 700;
      color: #1a1a1a;
      margin: 0;
      letter-spacing: -0.03em;
    }

    .ps-pin-label {
      font-size: 0.88rem;
      color: #999;
      margin: 0;
    }

    .ps-pin-input-wrapper {
      position: relative;
    }

    .ps-pin-input {
      width: 200px;
      height: 56px;
      text-align: center;
      font-size: 2rem;
      font-family: 'Inter', system-ui, sans-serif;
      font-weight: 700;
      letter-spacing: 0.75em;
      color: #1a1a1a;
      background: white;
      border: 1.5px solid hsl(36, 20%, 88%);
      border-radius: 14px;
      outline: none;
      transition: all 0.3s ease;
      caret-color: hsl(32, 95%, 44%);
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }

    .ps-pin-input:focus {
      border-color: hsl(32, 95%, 44%);
      box-shadow: 0 0 0 3px hsla(32, 95%, 44%, 0.1), 0 2px 8px rgba(0,0,0,0.06);
    }

    .ps-pin-dots {
      display: flex;
      gap: 0.65rem;
      margin-top: 0.65rem;
      justify-content: center;
    }

    .ps-pin-dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: hsl(36, 20%, 90%);
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .ps-pin-dot.filled {
      background: hsl(32, 95%, 44%);
      box-shadow: 0 0 8px hsla(32, 95%, 44%, 0.35);
      transform: scale(1.2);
    }

    .ps-pin-hint {
      font-size: 0.76rem;
      color: #ccc;
      margin: 0;
    }

    /* ─── RESPONSIVE ─── */
    @media (max-width: 768px) {
      .ps-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 0.875rem;
        max-width: 340px;
      }
      .ps-card { padding: 1.25rem 0.75rem; }
      .ps-card-icon { width: 48px; height: 48px; border-radius: 14px; }
      .ps-title { font-size: 1.4rem; }
      .ps-header { margin-bottom: 1.75rem; }
    }

    @media (max-height: 700px) {
      .ps-header { margin-bottom: 1.5rem; }
      .ps-logo { width: 42px; height: 42px; margin-bottom: 0.875rem; }
      .ps-title { font-size: 1.4rem; }
      .ps-card { padding: 1.125rem 0.75rem; }
      .ps-card-icon { width: 50px; height: 50px; }
      .ps-footer { margin-top: 1.5rem; }
    }
  `;

  if (step === 'pin') {
    const profile = selectedProfileLocal;
    return (
      <div className="ps-page">
        <style>{styles}</style>
        <div className="ps-content">
          <div className="ps-pin-container">
            <button className="ps-pin-back" onClick={handleBack}>
              <ArrowLeft size={16} />
              Back to profiles
            </button>

            <div
              className="ps-pin-avatar"
              style={{
                background: profile?.gradient || 'linear-gradient(135deg, #666, #444)',
                boxShadow: `0 8px 24px ${profile?.shadowColor || 'rgba(0,0,0,0.2)'}`,
              }}
            >
              {profile?.shortName || '?'}
            </div>

            <div style={{ textAlign: 'center' }}>
              <p className="ps-pin-name">{selectedProfileLocal?.name}</p>
              <p className="ps-pin-label">Enter your 4-digit PIN</p>
            </div>

            <div className="ps-pin-input-wrapper">
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setPin(val);
                  if (val.length === 4) {
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
                className="ps-pin-input"
                autoFocus
                disabled={isVerifying}
              />
              <div className="ps-pin-dots">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className={`ps-pin-dot ${pin.length > i ? 'filled' : ''}`} />
                ))}
              </div>
            </div>

            {isVerifying ? (
              <Loader2 style={{ width: 26, height: 26, color: 'hsl(32,95%,44%)', animation: 'spin 1s linear infinite' }} />
            ) : (
              <p className="ps-pin-hint">Forgot your PIN? Contact your administrator.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ps-page">
      <style>{styles}</style>
      <div className="ps-content">
        {/* Header */}
        <div className="ps-header">
          <div className="ps-logo">
            <ChefHat style={{ width: 26, height: 26, color: 'white' }} />
          </div>
          <h1 className="ps-title">
            Welcome Back to <span>Bakewise</span> ERP & POS
          </h1>
          <p className="ps-subtitle">
            Manage your business seamlessly across operations, production, and analytics
          </p>
          <div className="ps-select-label">
            Select your workspace to continue
          </div>
        </div>

        {/* Profile Grid */}
        <div className="ps-grid">
          {renderedProfiles.map((user, index) => {
            const style = getProfileStyle(user.role, user.branchId);
            const shortName = getShortName(user.name, user.role, user.branchId);
            const Icon = style.icon;
            
            return (
              <button
                key={user.id}
                className="ps-card"
                onClick={() => handleProfileClick(user)}
                style={{ animationDelay: `${0.1 + index * 0.08}s` }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget;
                  el.style.borderColor = style.borderTint;
                  el.style.background = style.bgTint;
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget;
                  el.style.borderColor = 'hsl(36, 20%, 90%)';
                  el.style.background = 'white';
                }}
              >
                <div
                  className="ps-card-dot"
                  style={{ background: style.dotColor }}
                />
                <div
                  className="ps-card-icon"
                  style={{
                    background: style.gradient,
                    boxShadow: `0 5px 18px ${style.shadowColor}`,
                  }}
                >
                  <Icon style={{ width: 26, height: 26, color: 'white' }} />
                </div>
                <span className="ps-card-name">{user.name}</span>
                <span className="ps-card-role">
                  {user.role === 'branch_staff' ? (user.branchId === 'branch_2' ? 'Branch 2 POS' : 'Branch 1 POS') :
                   user.role === 'admin' ? 'Full Access' :
                   user.role === 'accountant' ? 'Financials' : 'Production'}
                </span>
              </button>
            );
          })}
          {renderedProfiles.length === 0 && (
            <div className="col-span-full py-8 text-center text-slate-400 italic">
              No profiles initialized. Contact system administrator.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="ps-footer">
          <button className="ps-logout-btn" onClick={logout}>
            <LogOut size={13} />
            Sign Out
          </button>
          <div className="ps-footer-brand">
            <p className="ps-version">
              <strong>Bakewise ERP</strong> v1.0.4 — Secure Business Management System
            </p>
            <p className="ps-powered">
              Powered by <a href="tel:+923342826675">Genx Systems</a> +92 334 2826675
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
