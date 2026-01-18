
import React from 'react';
import { User, UserRole } from '../types';
import { ICONS } from '../constants';

interface SidebarProps {
  user: User;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  knowledgeBaseEnabled: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ user, activeTab, setActiveTab, onLogout, knowledgeBaseEnabled }) => {
  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: ICONS.Dashboard, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.TEAM_LEAD, UserRole.AGENT, UserRole.USER] },
    { id: 'tickets', label: 'Active Tickets', icon: ICONS.Ticket, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.TEAM_LEAD, UserRole.AGENT, UserRole.USER] },
    { id: 'performance', label: 'Performance', icon: ICONS.Sparkles, roles: [UserRole.ADMIN, UserRole.MANAGER] },
    { id: 'billing', label: 'Billing & Plans', icon: ICONS.Building, roles: [UserRole.ADMIN, UserRole.MANAGER] },
    { id: 'users', label: 'Team Directory', icon: ICONS.Users, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.TEAM_LEAD] },
    { id: 'companies', label: 'Organizations', icon: ICONS.Building, roles: [UserRole.ADMIN] },
    { 
      id: 'categories', 
      label: 'Knowledge Base', 
      icon: ICONS.Category, 
      roles: knowledgeBaseEnabled ? [UserRole.ADMIN, UserRole.MANAGER, UserRole.TEAM_LEAD] : [] 
    },
    { id: 'feature-management', label: 'Feature Control', icon: ICONS.Cog6Tooth, roles: [UserRole.ADMIN] },
  ];

  const filteredNav = navItems.filter(item => item.roles.includes(user.role));

  return (
    <div className="flex flex-col w-72 h-screen sidebar-gradient dark:bg-slate-950 text-white sticky top-0 shadow-2xl z-50 transition-colors duration-500 border-r dark:border-slate-800">
      <div className="flex items-center px-8 h-24 mb-4">
        <div className="w-10 h-10 bg-violet-500 rounded-xl flex items-center justify-center mr-3 shadow-lg shadow-violet-500/30">
           <ICONS.Sparkles className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-200">
          Helpnexa
        </h1>
      </div>
      
      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
        {filteredNav.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex items-center w-full px-5 py-3.5 text-sm font-semibold transition-all duration-200 rounded-2xl group ${
              activeTab === item.id 
                ? 'bg-white/10 text-white shadow-inner border border-white/5 dark:bg-violet-600 dark:border-violet-500' 
                : 'text-indigo-200/60 hover:text-white hover:bg-white/5 dark:hover:bg-slate-900'
            }`}
          >
            <item.icon className={`w-5 h-5 mr-3.5 transition-transform duration-300 group-hover:scale-110 ${activeTab === item.id ? 'text-violet-400 dark:text-white' : ''}`} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-6">
        <div className="bg-black/20 dark:bg-slate-900/50 rounded-[2rem] p-5 border border-white/5 dark:border-slate-800">
          <div className="flex items-center mb-5">
            <div className="relative">
              <img src={user.avatar} className="w-11 h-11 rounded-2xl object-cover ring-2 ring-violet-500/20 shadow-lg" alt="avatar" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-indigo-900 dark:border-slate-900 rounded-full"></div>
            </div>
            <div className="ml-3.5 overflow-hidden">
              <p className="text-sm font-bold truncate leading-none mb-1.5">{user.name}</p>
              <div className="inline-flex px-2 py-0.5 bg-violet-500/20 text-violet-300 rounded-full text-[10px] font-black uppercase tracking-wider border border-violet-500/30">
                {user.role.replace('_', ' ')}
              </div>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="flex items-center justify-center w-full px-4 py-3 text-xs font-black text-indigo-300 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all duration-300 border border-transparent hover:border-rose-500/20 dark:hover:border-rose-900 uppercase tracking-widest"
          >
            <ICONS.Logout className="w-4 h-4 mr-2.5" />
            Disconnect
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
