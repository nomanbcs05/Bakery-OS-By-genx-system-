import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Wifi, WifiOff, Clock, Calendar, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    <div className="w-full bg-white px-4 py-1.5 flex items-center justify-between border-b border-slate-100 select-none">
      {/* Left: Connectivity & Shift Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
           {isOnline ? (
             <Wifi className="h-3.5 w-3.5 text-green-600" />
           ) : (
             <WifiOff className="h-3.5 w-3.5 text-red-600" />
           )}
           <span className={cn(
             "text-[10px] font-black uppercase tracking-widest",
             isOnline ? "text-green-700" : "text-red-700"
           )}>
             {isOnline ? 'Online' : 'Offline'}
           </span>
        </div>
        
        <div className="h-3 w-[1px] bg-slate-200" />

        <div className="flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">
           <CheckCircle2 className="h-3 w-3 text-green-600" />
           <span className="text-[10px] font-black text-green-700 uppercase tracking-tighter">Active Shift</span>
        </div>
      </div>

      {/* Right: Time & Date */}
      <div className="flex items-center gap-4 text-slate-900">
        <div className="flex items-center gap-1.5">
           <Calendar className="h-3.5 w-3.5 text-slate-400" />
           <span className="text-[10px] font-black uppercase tracking-wider">{formatDate(time)}</span>
        </div>
        <div className="h-3 w-[1px] bg-slate-200" />
        <div className="flex items-center gap-1.5">
           <Clock className="h-3.5 w-3.5 text-slate-400" />
           <span className="text-[10px] font-black text-slate-900 tabular-nums">{formatTime(time)}</span>
        </div>
      </div>
    </div>
  );
}
