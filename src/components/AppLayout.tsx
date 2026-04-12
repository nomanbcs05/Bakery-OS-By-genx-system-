import type { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { useApp } from '@/context/AppContext';
import { Loader2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { POSNavbar } from '@/components/POSNavbar';
import { POSStatusBar } from '@/components/POSStatusBar';

export function AppLayout({ children }: { children: ReactNode }) {
  const { isLoading, currentUser, selectedProfile, isProfileLocked } = useApp();
  const location = useLocation();
  
  const isPosPage = !!(currentUser && selectedProfile && !isProfileLocked);

  if ((!currentUser || !selectedProfile || isProfileLocked) && !isLoading) {
    return (
      <main className="flex-1 min-h-screen">
        {children}
      </main>
    );
  }

  // If on a POS page, use full screen with top status bar & capsule navbar
  if (isPosPage && currentUser && selectedProfile && !isProfileLocked) {
    return (
      <div className="min-h-screen flex flex-col w-full bg-slate-50 overflow-hidden">
        <POSStatusBar />
        <POSNavbar />
        {/* Small space between navbar and content */}
        <div className="h-2 w-full flex-shrink-0" /> 
        <main className="flex-1 overflow-auto relative px-4 lg:px-6">
          {isLoading ? (
            <div className="h-full w-full flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground animate-pulse">Connecting to Supabase...</p>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full relative">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-border px-4 bg-card shrink-0">
            <SidebarTrigger className="mr-4" />
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6">
            {isLoading ? (
              <div className="h-full w-full flex flex-col items-center justify-center space-y-4">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground animate-pulse">Connecting to Supabase...</p>
              </div>
            ) : (
              children
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
