
import React from 'react';
import { TicketStatus, TicketPriority } from '../types';

interface BadgeProps {
  type: 'status' | 'priority';
  value: string;
}

const Badge: React.FC<BadgeProps> = ({ type, value }) => {
  const getColors = () => {
    if (type === 'status') {
      switch (value) {
        case TicketStatus.OPEN: return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-900/50';
        case TicketStatus.IN_PROGRESS: return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50';
        case TicketStatus.HOLD: return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-900/50';
        case TicketStatus.COMPLETED: return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50';
        case TicketStatus.CLOSED: return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800';
        default: return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800';
      }
    } else {
      switch (value) {
        case TicketPriority.LOW: return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
        case TicketPriority.MEDIUM: return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50';
        case TicketPriority.HIGH: return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50';
        case TicketPriority.URGENT: return 'bg-rose-600 text-white border-rose-700 shadow-lg shadow-rose-200 dark:shadow-none animate-pulse';
        default: return 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700';
      }
    }
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 text-[11px] font-black uppercase tracking-wider rounded-full border transition-all ${getColors()}`}>
      <span className="w-1 h-1 rounded-full bg-current mr-1.5 opacity-60"></span>
      {value}
    </span>
  );
};

export default Badge;
