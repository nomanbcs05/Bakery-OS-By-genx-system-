import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Factory, Truck, ShoppingCart, Store, Package, 
  BarChart3, Receipt, Settings, ChefHat, Layers, List, Wallet, CreditCard, ShoppingBag,
  UserCircle, LogOut, Cloud, CloudOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const mainNav = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Raw Materials', url: '/raw-materials', icon: Layers },
  { title: 'Purchases', url: '/purchases', icon: ShoppingBag },
  { title: 'Production', url: '/production', icon: Factory },
  { title: 'Production Stock', url: '/production-stock', icon: Package },
  { title: 'Dispatch', url: '/dispatch', icon: Truck },
];

const salesNav = [
  { title: 'POS 1', url: '/pos/branch-1', icon: ShoppingCart },
  { title: 'POS 2', url: '/pos/branch-2', icon: ShoppingCart },
  { title: 'Walk-in', url: '/walkin', icon: Store },
];

const managementNav = [
  { title: 'Branch Products', url: '/branch-products', icon: Package },
  { title: 'Sales History', url: '/sales-history', icon: BarChart3 },
  { title: 'Sales Details', url: '/sales-details', icon: List },
  { title: 'Inventory', url: '/inventory', icon: Package },
  { title: 'Reports', url: '/reports', icon: BarChart3 },
  { title: 'Expenses', url: '/expenses', icon: Receipt },
  { title: 'Accounts', url: '/accounts', icon: Wallet },
  { title: 'Credits', url: '/credits', icon: CreditCard },
  { title: 'Settings', url: '/settings', icon: Settings },
];

export function POSNavbar() {
  const { selectedProfile, lockProfile, logout, hasSupabaseConfig, isOnline } = useApp();
  const location = useLocation();

  if (!selectedProfile) return null;

  const isRole = (roles: string[]) => roles.includes(selectedProfile.role);

  const filteredMainNav = mainNav.filter(item => {
    if (isRole(['admin'])) return true;
    if (isRole(['production_manager'])) return ['Dashboard', 'Raw Materials', 'Purchases', 'Production', 'Production Stock', 'Dispatch'].includes(item.title);
    if (isRole(['accountant'])) return ['Dashboard', 'Raw Materials', 'Purchases'].includes(item.title);
    return false;
  });

  const filteredSalesNav = salesNav.filter(item => {
    if (isRole(['admin'])) return true;
    if (isRole(['branch_staff'])) {
      if (selectedProfile.branchId === 'branch_1') return item.title === 'POS 1';
      if (selectedProfile.branchId === 'branch_2') return item.title === 'POS 2';
      return false;
    }
    return false;
  });

  const filteredManagementNav = managementNav.filter(item => {
    if (isRole(['admin'])) return true;
    if (isRole(['production_manager'])) return ['Reports'].includes(item.title);
    if (isRole(['accountant'])) return ['Sales History', 'Sales Details', 'Inventory', 'Reports', 'Expenses', 'Accounts', 'Credits'].includes(item.title);
    if (isRole(['branch_staff'])) return ['Branch Products', 'Sales Details', 'Expenses'].includes(item.title);
    return false;
  });

  const allLinks = [...filteredMainNav, ...filteredSalesNav, ...filteredManagementNav];

  return (
    <div className="flex-shrink-0 w-full bg-white px-4 py-2 flex items-center justify-between border-b border-slate-100">
      <div className="flex items-center flex-1 overflow-x-auto no-scrollbar scrollbar-hide gap-1.5 py-1">
        <div className="flex items-center gap-2 mr-6 bg-slate-100 px-3 py-1.5 rounded-2xl shrink-0">
           <ChefHat className="h-4 w-4 text-primary" />
           <span className="text-[10px] font-black text-slate-900 uppercase tracking-wider">Bakewise</span>
        </div>
        
        <div className="flex items-center gap-1.5">
          {allLinks.map((item) => (
            <NavLink
              key={item.url}
              to={item.url}
              end={item.url === '/'}
              className="px-4 py-1.5 rounded-full text-[10px] font-black text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all whitespace-nowrap flex items-center gap-2 border border-transparent uppercase tracking-wider"
              activeClassName="bg-slate-900 text-white border-slate-900 shadow-xl"
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.title}
            </NavLink>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4 pl-4 ml-4 border-l border-slate-100 shrink-0">
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-black text-slate-900 leading-none">{selectedProfile.name}</span>
              {hasSupabaseConfig && (
                <Cloud className={cn("h-2.5 w-2.5", isOnline ? "text-green-500" : "text-amber-500")} />
              )}
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">
              {selectedProfile.role.replace('_', ' ')}
            </p>
          </div>
          <div className={cn(
            "h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-black text-white shadow-md",
            selectedProfile.role === 'admin' ? "bg-red-600" : 
            selectedProfile.role === 'production_manager' ? "bg-blue-600" :
            selectedProfile.role === 'accountant' ? "bg-green-600" : "bg-orange-600"
          )}>
            {selectedProfile.name.charAt(0)}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
            onClick={lockProfile}
            title="Switch Profile (Go Back)"
          >
            <UserCircle className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
            onClick={logout}
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
