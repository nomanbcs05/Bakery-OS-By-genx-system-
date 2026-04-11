import { 
  LayoutDashboard, Factory, Truck, ShoppingCart, Store, Package, 
  BarChart3, Receipt, Settings, LogOut, ChefHat, UserCircle, Layers, List, Wallet, CreditCard, Cloud, CloudOff
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import { 
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter, useSidebar
} from '@/components/ui/sidebar';
import { useApp } from '@/context/AppContext';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const mainNav = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Raw Materials', url: '/raw-materials', icon: Layers },
  { title: 'Production', url: '/production', icon: Factory },
  { title: 'Production Stock', url: '/production-stock', icon: Package },
  { title: 'Dispatch', url: '/dispatch', icon: Truck },
];

const salesNav = [
  { title: 'Branch 1 POS', url: '/pos/branch-1', icon: ShoppingCart },
  { title: 'Branch 2 POS', url: '/pos/branch-2', icon: ShoppingCart },
  { title: 'Walk-in Sales', url: '/walkin', icon: Store },
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

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { currentUser, selectedProfile, lockProfile, hasSupabaseConfig, isOnline } = useApp();

  if (!currentUser || !selectedProfile) return null;

  const isRole = (roles: string[]) => roles.includes(selectedProfile.role);

  const filteredMainNav = mainNav.filter(item => {
    if (isRole(['admin'])) return true;
    if (isRole(['production_manager'])) return ['Raw Materials', 'Production', 'Production Stock', 'Dispatch'].includes(item.title);
    if (isRole(['accountant'])) return ['Dashboard', 'Raw Materials'].includes(item.title);
    if (isRole(['branch_staff'])) return false; // No main nav items for branch staff
    return false;
  });

  const filteredSalesNav = salesNav.filter(item => {
    if (isRole(['admin'])) return true;
    if (isRole(['branch_staff'])) {
      if (selectedProfile.branchId === 'branch_1') return item.title === 'Branch 1 POS';
      if (selectedProfile.branchId === 'branch_2') return item.title === 'Branch 2 POS';
      return false;
    }
    return false;
  });

  const filteredManagementNav = managementNav.filter(item => {
    if (isRole(['admin'])) return true;
    if (isRole(['accountant'])) return ['Sales History', 'Sales Details', 'Inventory', 'Reports', 'Expenses', 'Accounts', 'Credits'].includes(item.title);
    if (isRole(['branch_staff'])) return ['Branch Products', 'Sales Details', 'Expenses'].includes(item.title);
    return false;
  });

  const roleColors: Record<string, string> = {
    admin: 'bg-primary text-primary-foreground',
    production_manager: 'bg-info text-info-foreground',
    branch_staff: 'bg-success text-success-foreground',
    accountant: 'bg-warning text-warning-foreground',
  };

  const renderItems = (items: typeof mainNav) => (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton asChild>
            <NavLink
              to={item.url}
              end={item.url === '/'}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
              activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold"
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="text-sm">{item.title}</span>}
            </NavLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <ChefHat className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-bold text-sidebar-foreground text-base leading-tight">BakeryOS</h1>
              <p className="text-[11px] text-sidebar-foreground/50">Production & POS</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/40 text-[10px] uppercase tracking-wider px-3">
            {!collapsed && 'Main'}
          </SidebarGroupLabel>
          <SidebarGroupContent>{renderItems(filteredMainNav)}</SidebarGroupContent>
        </SidebarGroup>

        {filteredSalesNav.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/40 text-[10px] uppercase tracking-wider px-3">
              {!collapsed && 'Point of Sale'}
            </SidebarGroupLabel>
            <SidebarGroupContent>{renderItems(filteredSalesNav)}</SidebarGroupContent>
          </SidebarGroup>
        )}

        {filteredManagementNav.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/40 text-[10px] uppercase tracking-wider px-3">
              {!collapsed && 'Management'}
            </SidebarGroupLabel>
            <SidebarGroupContent>{renderItems(filteredManagementNav)}</SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4">
        {!collapsed && (
          <>
            <Separator className="mb-3 bg-sidebar-border" />
            <div className="flex items-center gap-3">
              <div className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold text-white",
                selectedProfile.role === 'admin' ? "bg-red-600" : 
                selectedProfile.role === 'production_manager' ? "bg-blue-600" :
                selectedProfile.role === 'accountant' ? "bg-green-600" : "bg-orange-600"
              )}>
                {selectedProfile.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">{selectedProfile.name}</p>
                  {hasSupabaseConfig ? (
                    <Cloud className={cn("h-3 w-3", isOnline ? "text-green-500" : "text-amber-500")} title={isOnline ? "Cloud Synced" : "Pending Sync"} />
                  ) : (
                    <CloudOff className="h-3 w-3 text-red-500" title="Local Only Mode" />
                  )}
                </div>
                <Badge className={`text-[10px] px-1.5 py-0 ${roleColors[selectedProfile.role]}`}>
                  {selectedProfile.role.replace('_', ' ')}
                </Badge>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-sidebar-foreground/50 hover:text-sidebar-foreground"
                onClick={lockProfile}
                title="Switch Profile"
              >
                <UserCircle className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
