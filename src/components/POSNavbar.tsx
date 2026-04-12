import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Factory, Truck, ShoppingCart, Store, Package, 
  BarChart3, Receipt, Settings, ChefHat, Layers, List, Wallet, CreditCard, ShoppingBag
} from 'lucide-react';

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
  const { selectedProfile } = useApp();
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
    <div className="flex-shrink-0 w-full bg-white border-b border-slate-100 px-4 py-2.5 flex items-center gap-4 overflow-x-auto scrollbar-hide no-scrollbar">
      <div className="flex items-center gap-2 mr-4 bg-primary/5 px-3 py-1.5 rounded-2xl">
         <ChefHat className="h-4 w-4 text-primary" />
         <span className="text-xs font-black text-slate-800 tracking-tight">Bakewise POS</span>
      </div>
      
      <div className="flex items-center gap-1.5">
        {allLinks.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            end={item.url === '/'}
            className="px-4 py-1.5 rounded-full text-[11px] font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all whitespace-nowrap flex items-center gap-2 border border-transparent"
            activeClassName="bg-slate-900 border-slate-900 text-white shadow-lg shadow-black/5"
          >
            <item.icon className="h-3.5 w-3.5" />
            {item.title}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
