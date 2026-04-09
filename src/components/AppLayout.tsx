import type { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { useApp } from '@/context/AppContext';
import { Loader2 } from 'lucide-react';

export function AppLayout({ children }: { children: ReactNode }) {
  const { isLoading, currentUser, selectedProfile, isProfileLocked } = useApp();

  if ((!currentUser || !selectedProfile || isProfileLocked) && !isLoading) {
    return (
      <main className="flex-1 min-h-screen">
        {children}
      </main>
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
