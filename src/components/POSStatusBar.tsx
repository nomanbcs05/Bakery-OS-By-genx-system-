import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Wifi, WifiOff, Clock, Calendar, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';

export function POSStatusBar() {
  const { isOnline } = useApp();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="w-full bg-[#0F172A] px-4 py-1.5 flex items-center justify-between border-b border-white/5 select-none">
      {/* Left: Connectivity & Shift Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
           {isOnline ? (
             <Wifi className="h-3 w-3 text-green-500 animate-pulse" />
           ) : (
             <WifiOff className="h-3 w-3 text-red-500" />
           )}
           <span className={cn(
             "text-[10px] font-bold uppercase tracking-widest",
             isOnline ? "text-green-500/80" : "text-red-500/80"
           )}>
             {isOnline ? 'Network Active' : 'Offline Mode'}
           </span>
        </div>
        
        <div className="h-3 w-[1px] bg-white/10" />

        <div className="flex items-center gap-2 px-2 py-0.5 rounded-md bg-green-500/10 border border-green-500/20">
           <CheckCircle2 className="h-3 w-3 text-green-500" />
           <span className="text-[10px] font-black text-green-500 uppercase tracking-tighter">Shift Active</span>
        </div>
      </div>

      {/* Right: Time & Date */}
      <div className="flex items-center gap-4 text-white/60">
        <div className="flex items-center gap-1.5">
           <Calendar className="h-3 w-3 text-primary/70" />
           <span className="text-[10px] font-bold uppercase tracking-wider">{formatDate(time)}</span>
        </div>
        <div className="h-3 w-[1px] bg-white/10" />
        <div className="flex items-center gap-1.5">
           <Clock className="h-3 w-3 text-primary/70" />
           <span className="text-[10px] font-black text-white/90 tabular-nums">{formatTime(time)}</span>
        </div>
      </div>
    </div>
  );
}
