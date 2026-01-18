import React, { useState, useEffect, useMemo, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Badge from './components/Badge';
import { 
  Ticket, User, Company, Category, UserRole, 
  TicketStatus, TicketPriority, RegistrationStatus, 
  CompanyRegistrationRequest, Notification, AppFeatures, SubscriptionTier, EscalationLevel, TicketComment
} from './types';
import { MOCK_COMPANIES, MOCK_USERS, MOCK_TICKETS, MOCK_CATEGORIES, ICONS, DEFAULT_FEATURES, TIER_FEATURES } from './constants';
import { triageTicket, summarizeComments } from './services/geminiService';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginError, setLoginError] = useState('');
  const [view, setView] = useState<'LANDING' | 'LOGIN' | 'APP'>('LANDING');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUserCreateModalOpen, setIsUserCreateModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [targetPlan, setTargetPlan] = useState<SubscriptionTier | null>(null);
  const [isTriageLoading, setIsTriageLoading] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [ticketSummary, setTicketSummary] = useState<string>('');
  const [newTicket, setNewTicket] = useState({ title: '', description: '', category: '', priority: TicketPriority.MEDIUM });
  const [newUserForm, setNewUserForm] = useState({ name: '', email: '', role: UserRole.USER });
  const [exportConfig, setExportConfig] = useState({ includeClosed: true, includeEscalations: true, format: 'csv' });
  
  const landingRefs = {
    home: useRef<HTMLDivElement>(null),
    features: useRef<HTMLDivElement>(null),
    about: useRef<HTMLDivElement>(null),
    support: useRef<HTMLDivElement>(null),
    pricing: useRef<HTMLDivElement>(null),
    contact: useRef<HTMLDivElement>(null),
  };

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('zen_theme');
    return saved ? saved === 'dark' : false;
  });

  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('zen_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('zen_theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const savedTickets = localStorage.getItem('zen_tickets');
    const savedUsers = localStorage.getItem('zen_users');
    const savedCompanies = localStorage.getItem('zen_companies');
    const savedCategories = localStorage.getItem('zen_categories');
    
    const loadedTickets: Ticket[] = savedTickets ? JSON.parse(savedTickets) : MOCK_TICKETS;
    const sanitizedTickets = loadedTickets.map(t => ({
      ...t,
      escalationLevel: t.escalationLevel ?? EscalationLevel.NONE
    }));

    setTickets(sanitizedTickets);
    setUsers(savedUsers ? JSON.parse(savedUsers) : MOCK_USERS);
    setCompanies(savedCompanies ? JSON.parse(savedCompanies) : MOCK_COMPANIES);
    setCategories(savedCategories ? JSON.parse(savedCategories) : MOCK_CATEGORIES);
  }, []);

  useEffect(() => {
    if (tickets.length > 0) localStorage.setItem('zen_tickets', JSON.stringify(tickets));
    if (users.length > 0) localStorage.setItem('zen_users', JSON.stringify(users));
    if (companies.length > 0) localStorage.setItem('zen_companies', JSON.stringify(companies));
  }, [tickets, users, companies]);

  const currentCompany = useMemo(() => {
    if (!currentUser) return null;
    return companies.find(c => c.id === currentUser.companyId) || null;
  }, [currentUser, companies]);

  const currentCompanyFeatures = useMemo(() => {
    return currentCompany?.features || DEFAULT_FEATURES;
  }, [currentCompany]);

  const planLimits = useMemo(() => {
    if (!currentCompany) return { agents: 1, leads: 0, users: 'Unlimited' };
    switch (currentCompany.subscriptionTier) {
      case SubscriptionTier.FREE: return { agents: 1, leads: 0, users: 'Unlimited' };
      case SubscriptionTier.PRO: return { agents: 5, leads: 1, users: 'Unlimited' };
      case SubscriptionTier.ENTERPRISE: return { agents: 'Unlimited', leads: 'Unlimited', users: 'Unlimited' };
      default: return { agents: 1, leads: 0, users: 'Unlimited' };
    }
  }, [currentCompany]);

  const currentUsage = useMemo(() => {
    if (!currentUser) return { agents: 0, leads: 0 };
    const companyUsers = users.filter(u => u.companyId === currentUser.companyId);
    return {
      agents: companyUsers.filter(u => u.role === UserRole.AGENT).length,
      leads: companyUsers.filter(u => u.role === UserRole.TEAM_LEAD).length
    };
  }, [users, currentUser]);

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.email.toLowerCase() === loginEmail.toLowerCase());
    if (user) {
      setCurrentUser(user);
      setView('APP');
      setLoginError('');
      setLoginEmail('');
    } else { setLoginError('Identity not found.'); }
  };

  const handleLogout = () => { setCurrentUser(null); setSelectedTicket(null); setView('LANDING'); };

  const filteredTickets = useMemo(() => {
    if (!currentUser) return [];
    let list = [...tickets];
    if (currentUser.role === UserRole.ADMIN) { }
    else if ([UserRole.MANAGER, UserRole.TEAM_LEAD, UserRole.AGENT].includes(currentUser.role)) { list = list.filter(t => t.companyId === currentUser.companyId); }
    else { list = list.filter(t => t.requesterId === currentUser.id); }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [tickets, currentUser]);

  const dashboardMetrics = useMemo(() => {
    if (!currentUser) return [];
    return [
      { label: 'Total Load', val: filteredTickets.length, icon: ICONS.Ticket, color: 'text-violet-600', bg: 'bg-violet-50/50' },
      { label: 'Escalations', val: filteredTickets.filter(t => t.escalationLevel > 0).length, icon: ICONS.Sparkles, color: 'text-rose-600', bg: 'bg-rose-50/50' },
      { label: 'Wait Quota', val: filteredTickets.filter(t => t.status === TicketStatus.OPEN).length, icon: ICONS.Dashboard, color: 'text-amber-600', bg: 'bg-amber-50/50' },
      { label: 'Solved', val: `${Math.round((filteredTickets.filter(t => t.status === TicketStatus.COMPLETED).length / (filteredTickets.length || 1)) * 100)}%`, icon: ICONS.Check, color: 'text-emerald-600', bg: 'bg-emerald-50/50' },
    ];
  }, [filteredTickets, currentUser]);

  const directoryHeads = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === UserRole.ADMIN) return users.filter(u => u.role === UserRole.MANAGER || u.role === UserRole.TEAM_LEAD);
    if (currentUser.role === UserRole.MANAGER || currentUser.role === UserRole.TEAM_LEAD) return [currentUser];
    return [];
  }, [users, currentUser]);

  const agentPerformanceData = useMemo(() => {
    if (!currentUser || ![UserRole.ADMIN, UserRole.MANAGER].includes(currentUser.role)) return [];
    const companyAgents = users.filter(u => u.role === UserRole.AGENT && (currentUser.role === UserRole.ADMIN || u.companyId === currentUser.companyId));
    return companyAgents.map(agent => {
      const agentTickets = tickets.filter(t => t.assigneeId === agent.id);
      return {
        agent,
        total: agentTickets.length,
        open: agentTickets.filter(t => t.status === TicketStatus.OPEN).length,
        inProgress: agentTickets.filter(t => t.status === TicketStatus.IN_PROGRESS).length,
        onHold: agentTickets.filter(t => t.status === TicketStatus.HOLD).length,
        completed: agentTickets.filter(t => t.status === TicketStatus.COMPLETED).length,
        escalated: agentTickets.filter(t => t.escalationLevel > 0).length,
      };
    });
  }, [users, tickets, currentUser]);

  const handleGlobalReport = () => {
    const reportData = agentPerformanceData.map(d => ({ Agent: d.agent.name, Total: d.total, Completed: d.completed, Escalated: d.escalated }));
    const csv = "data:text/csv;charset=utf-8,Agent,Total,Completed,Escalated\n" + reportData.map(r => `${r.Agent},${r.Total},${r.Completed},${r.Escalated}`).join('\n');
    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = "Agent_Performance.csv";
    link.click();
  };

  const initiateCheckout = (tier: SubscriptionTier) => {
    setTargetPlan(tier);
    setIsCheckoutModalOpen(true);
  };

  const handleConfirmUpgrade = () => {
    if (!currentCompany || !targetPlan) return;
    setCompanies(prev => prev.map(c => c.id === currentCompany.id ? { ...c, subscriptionTier: targetPlan, features: TIER_FEATURES[targetPlan] } : c));
    setIsCheckoutModalOpen(false);
    alert(`Node Successfully Re-Provisioned to ${targetPlan} Tier.`);
  };

  const handleUpdateStatus = (ticketId: string, newStatus: TicketStatus) => {
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus, updatedAt: new Date().toISOString() } : t));
    if (selectedTicket?.id === ticketId) { setSelectedTicket(prev => prev ? { ...prev, status: newStatus, updatedAt: new Date().toISOString() } : null); }
  };

  const toggleCompanyExpansion = (id: string) => { const n = new Set(expandedCompanies); n.has(id) ? n.delete(id) : n.add(id); setExpandedCompanies(n); };
  const toggleUserStatus = (userId: string) => { setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: !u.isActive } : u)); };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    const ticket: Ticket = {
      id: `T-${Math.floor(1000 + Math.random() * 9000)}`, ...newTicket,
      status: TicketStatus.OPEN, requesterId: currentUser.id, companyId: currentUser.companyId,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), escalationLevel: EscalationLevel.NONE,
      comments: [{ id: `sys-${Date.now()}`, authorId: 'system', text: `[PROTOCOL INIT] Signal synchronized. 12h Response SLA engaged.`, createdAt: new Date().toISOString() }]
    };
    setTickets([ticket, ...tickets]);
    setIsCreateModalOpen(false);
    setNewTicket({ title: '', description: '', category: categories[0]?.name || 'General', priority: TicketPriority.MEDIUM });
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    const newUser: User = {
      id: `user-${Math.floor(1000 + Math.random() * 9000)}`,
      ...newUserForm,
      companyId: currentUser.role === UserRole.ADMIN ? (companies[0]?.id || 'comp-1') : currentUser.companyId,
      avatar: `https://picsum.photos/seed/${newUserForm.email}/100`,
      isActive: true
    };
    setUsers(prev => [...prev, newUser]);
    setIsUserCreateModalOpen(false);
    setNewUserForm({ name: '', email: '', role: UserRole.USER });
  };

  const handleSmartTriage = async () => {
    if (!newTicket.title || !newTicket.description) return;
    setIsTriageLoading(true);
    try {
      const result = await triageTicket(newTicket.title, newTicket.description);
      setNewTicket(prev => ({ ...prev, priority: result.priority as TicketPriority, category: result.category }));
    } catch (error) { console.error(error); } finally { setIsTriageLoading(false); }
  };

  const handleAddComment = (text: string) => {
    if (!selectedTicket || !currentUser || !text.trim()) return;
    const newComment: TicketComment = { id: `c-${Date.now()}`, authorId: currentUser.id, text: text.trim(), createdAt: new Date().toISOString() };
    setTickets(prev => prev.map(t => t.id === selectedTicket.id ? { ...t, comments: [...t.comments, newComment], updatedAt: new Date().toISOString() } : t));
    setSelectedTicket(prev => prev ? { ...prev, comments: [...prev.comments, newComment], updatedAt: new Date().toISOString() } : null);
    setTicketSummary('');
  };

  const handleSummarizeThread = async () => {
    if (!selectedTicket || selectedTicket.comments.length === 0) return;
    setIsSummarizing(true);
    try {
      const summary = await summarizeComments(selectedTicket.comments.map(c => c.text));
      setTicketSummary(summary);
    } catch (e) { console.error(e); } finally { setIsSummarizing(false); }
  };

  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const Header = () => (
    <header className="glass-panel px-10 py-6 flex justify-between items-center sticky top-0 z-40 border-b dark:bg-slate-900/70">
      <div className="flex items-center space-x-6">
        <div className="md:hidden w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center"><ICONS.Sparkles className="w-5 h-5 text-white" /></div>
        <div>
           <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Fleet Node</h2>
           <p className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">{currentCompany?.name || "Central Nexus"}</p>
        </div>
      </div>
      <div className="flex items-center space-x-6">
        <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-500 dark:text-slate-400 hover:text-violet-600 border transition-all">
          {isDarkMode ? <ICONS.Sun className="w-5 h-5" /> : <ICONS.Moon className="w-5 h-5" />}
        </button>
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 p-[2px] shadow-lg shadow-violet-500/20">
           <img src={currentUser?.avatar} className="w-full h-full rounded-[14px] object-cover bg-white dark:bg-slate-800" alt="" />
        </div>
      </div>
    </header>
  );

  if (view === 'LANDING') return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#050508]' : 'bg-slate-50'} transition-colors duration-500 font-sans text-slate-900 dark:text-white`}>
        {/* Navigation Bar */}
        <nav className="fixed top-0 left-0 w-full z-[100] glass-panel px-8 py-4 border-b dark:bg-slate-900/80 border-slate-200/40 dark:border-slate-800 flex justify-between items-center">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => scrollToSection(landingRefs.home)}>
                <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center shadow-lg"><ICONS.Sparkles className="w-6 h-6 text-white" /></div>
                <h1 className="text-xl font-black tracking-tighter">Helpnexa</h1>
            </div>
            <div className="hidden lg:flex items-center space-x-8">
                {[
                  { label: 'About', ref: landingRefs.about },
                  { label: 'Protocols', ref: landingRefs.features },
                  { label: 'Support', ref: landingRefs.support },
                  { label: 'Tiers', ref: landingRefs.pricing },
                  { label: 'Contact', ref: landingRefs.contact },
                ].map(item => (
                    <button key={item.label} onClick={() => scrollToSection(item.ref)} className="text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-violet-600 transition-colors">{item.label}</button>
                ))}
            </div>
            <button onClick={() => setView('LOGIN')} className="px-6 py-2.5 bg-violet-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 transition-all">Secure Login</button>
        </nav>

        <main>
            {/* HERO SECTION */}
            <section ref={landingRefs.home} className="min-h-screen flex flex-col items-center justify-center text-center px-6 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vh] bg-violet-600/5 blur-[150px] -z-10"></div>
                <div className="mb-6 px-4 py-2 bg-violet-50 dark:bg-violet-900/20 text-violet-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-violet-100 dark:border-violet-800">Next-Gen IT Infrastructure</div>
                <h2 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[1.05]">The Future of <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-indigo-500">Support Ops.</span></h2>
                <p className="text-slate-500 dark:text-slate-400 max-w-2xl text-lg md:text-xl mb-12 font-medium">Built with Neural Triage, Autonomous Routing, and a hardwired 12h/24h Escalation Matrix for zero-latency IT resolution.</p>
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
                    <button onClick={() => setView('LOGIN')} className="px-12 py-5 bg-slate-950 text-white rounded-2xl font-black uppercase tracking-widest shadow-2xl hover:scale-105 transition-all dark:bg-white dark:text-black">Deploy Workspace</button>
                    <button onClick={() => scrollToSection(landingRefs.features)} className="px-12 py-5 bg-white border border-slate-200 text-slate-900 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-50 transition-all dark:bg-slate-900 dark:border-slate-800 dark:text-white">Learn Protocols</button>
                </div>
            </section>

            {/* ABOUT US SECTION */}
            <section ref={landingRefs.about} className="py-32 px-10 bg-white dark:bg-slate-900/50">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                    <div>
                        <span className="text-[10px] font-black text-violet-600 uppercase tracking-[0.4em] mb-4 block">Our Philosophy</span>
                        <h3 className="text-5xl font-black tracking-tight mb-8">Redefining Support Velocity.</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-lg mb-8 leading-relaxed font-medium">At Helpnexa, we believe that IT support should be as autonomous as the infrastructure it manages. Our platform eliminates the "waiting game" by integrating AI at every touchpoint.</p>
                        <ul className="space-y-4">
                            {[
                                { title: 'Self-Balancing Queues', desc: 'No more manual ticket assignment. Our Least-Busy protocol distributes load instantly.' },
                                { title: 'Escalation by Design', desc: 'SLA enforcement is built into the core, not added as an afterthought.' },
                                { title: 'Neural Intelligence', desc: 'Using Gemini to understand and categorize human issues faster than any human agent.' }
                            ].map((item, i) => (
                                <li key={i} className="flex space-x-4">
                                    <div className="w-6 h-6 bg-violet-100 dark:bg-violet-900/30 rounded-full flex items-center justify-center flex-shrink-0 text-violet-600"><ICONS.Check className="w-4 h-4" /></div>
                                    <div><p className="font-black text-slate-900 dark:text-slate-100 text-sm mb-1">{item.title}</p><p className="text-slate-500 text-sm">{item.desc}</p></div>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="relative h-[500px] bg-slate-100 dark:bg-slate-800 rounded-[4rem] overflow-hidden shadow-2xl">
                         <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 to-indigo-600/20 backdrop-blur-xl"></div>
                         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                             <div className="w-24 h-24 bg-violet-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl"><ICONS.Sparkles className="w-12 h-12 text-white" /></div>
                             <p className="text-2xl font-black tracking-tighter">Silicon Valley Native</p>
                             <p className="text-xs font-black uppercase tracking-widest text-violet-500">Established 2025</p>
                         </div>
                    </div>
                </div>
            </section>

            {/* FEATURES SECTION */}
            <section ref={landingRefs.features} className="py-32 px-10 bg-slate-50 dark:bg-slate-950">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-24">
                        <span className="text-[10px] font-black text-violet-600 uppercase tracking-[0.4em] mb-4 block">Core Protocols</span>
                        <h3 className="text-5xl font-black tracking-tight">Technological Infrastructure</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {[
                            { title: 'Neural Triage', icon: ICONS.Sparkles, desc: 'AI classification engine that predicts ticket priority and category upon signal initialization.' },
                            { title: 'Autonomous Routing', icon: ICONS.Dashboard, desc: 'Real-time Least-Busy load balancing ensures tickets are always directed to the most available operative.' },
                            { title: 'Escalation Matrix', icon: ICONS.Cog6Tooth, desc: 'Hardwired 12h/24h protocols that automatically move unhandled signals to Team Leads and Managers.' },
                            { title: 'Neural Summary', icon: ICONS.Check, desc: 'One-click AI summarization of complex ticket threads for rapid personnel handovers.' },
                            { title: 'Atomic Multi-Tenancy', icon: ICONS.Building, desc: 'Complete organizational isolation with bespoke feature toggles for high-compliance environments.' },
                            { title: 'Live Performance Hub', icon: ICONS.Users, desc: 'Manager-level oversight into agent-wise ticket streams and real-time operational status.' }
                        ].map((feat, i) => (
                            <div key={i} className="p-10 rounded-[3rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:-translate-y-2 transition-all duration-300">
                                <div className="w-14 h-14 bg-violet-600 rounded-2xl flex items-center justify-center text-white mb-8 shadow-lg shadow-violet-500/20"><feat.icon className="w-7 h-7" /></div>
                                <h4 className="text-xl font-black mb-4">{feat.title}</h4>
                                <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{feat.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* SUPPORT SECTION */}
            <section ref={landingRefs.support} className="py-32 px-10 bg-white dark:bg-slate-900/50">
                <div className="max-w-4xl mx-auto text-center">
                    <span className="text-[10px] font-black text-violet-600 uppercase tracking-[0.4em] mb-4 block">Knowledge Base</span>
                    <h3 className="text-5xl font-black tracking-tight mb-20">We've Got Your Back.</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                        {[
                            { q: 'How does the escalation matrix work?', a: 'If an agent does not take action within 12 hours, the ticket automatically moves to Level 1 (Team Lead). If unresolved after another 24 hours, it hits Level 2 (Manager).' },
                            { q: 'Is my data isolated?', a: 'Absolutely. Helpnexa uses atomic multi-tenancy, meaning your organization\'s tickets, users, and settings are logically separated at the database level.' },
                            { q: 'Can I customize AI triage?', a: 'Yes. Enterprise nodes have access to feature overrides to calibrate the neural triage model specifically for your company\'s jargon.' },
                            { q: 'How is the agent load calculated?', a: 'We use the Least-Busy protocol, which checks the current active "In Progress" ticket count of all online agents before routing new transmissions.' }
                        ].map((item, i) => (
                            <div key={i} className="p-8 bg-slate-50 dark:bg-slate-800 rounded-3xl">
                                <p className="font-black mb-2 text-slate-900 dark:text-white">{item.q}</p>
                                <p className="text-slate-500 text-sm leading-relaxed">{item.a}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* SUBSCRIPTION MATRIX */}
            <section ref={landingRefs.pricing} className="py-32 px-10 bg-slate-50 dark:bg-slate-950">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-24">
                        <span className="text-[10px] font-black text-violet-600 uppercase tracking-[0.4em] mb-4 block">Scalability Nodes</span>
                        <h3 className="text-5xl font-black tracking-tight">Deployment Tiers</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { 
                                tier: SubscriptionTier.FREE, price: '$0', desc: 'Manual ops for small fleets.', 
                                feats: ['Standard Ticketing', 'Manual Routing', 'Basic Knowledge Base', 'Max 1 Agent', 'Unlimited Users'], 
                                highlight: false 
                            },
                            { 
                                tier: SubscriptionTier.PRO, price: '$30', desc: 'Enhanced automation logic.', 
                                feats: ['Neural Triage (AI)', 'Autonomous Routing', '12h Team Lead Escalation', '5 Agents & 1 Team Lead', 'Unlimited Users', 'Live Performance Hub'], 
                                highlight: true 
                            },
                            { 
                                tier: SubscriptionTier.ENTERPRISE, price: '$49', desc: 'Unlimited AI infrastructure.', 
                                feats: ['Neural Summary (AI)', '24h Manager Escalation', 'Unlimited Agents & Leads', 'Unlimited Users', 'Full Feature Overrides', 'Priority SLA Support'], 
                                highlight: false 
                            }
                        ].map((plan, i) => (
                            <div key={i} className={`p-12 rounded-[4rem] border flex flex-col transition-all ${plan.highlight ? 'bg-white dark:bg-slate-900 border-violet-500 shadow-2xl shadow-violet-500/10 scale-105' : 'bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800'}`}>
                                <h4 className="text-2xl font-black mb-2">{plan.tier} Node</h4>
                                <p className="text-sm text-slate-400 font-bold mb-10">{plan.desc}</p>
                                <div className="mb-10"><span className="text-6xl font-black">{plan.price}</span><span className="text-slate-400 ml-2">/mo</span></div>
                                <div className="space-y-5 mb-12 flex-1">
                                    {plan.feats.map((f, j) => (
                                        <div key={j} className="flex items-center text-sm font-bold text-slate-600 dark:text-slate-300">
                                            <ICONS.Check className="w-4 h-4 mr-3 text-emerald-500" />
                                            {f}
                                        </div>
                                    ))}
                                </div>
                                <button onClick={() => setView('LOGIN')} className={`w-full py-5 rounded-2xl font-black uppercase text-xs tracking-widest transition-all ${plan.highlight ? 'bg-violet-600 text-white shadow-xl hover:bg-violet-700' : 'bg-slate-950 text-white dark:bg-white dark:text-black hover:opacity-80'}`}>Provision Node</button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CONTACT SECTION */}
            <section ref={landingRefs.contact} className="py-32 px-10">
                <div className="max-w-7xl mx-auto bg-slate-950 rounded-[4rem] p-16 md:p-24 relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-[50%] h-[100%] bg-violet-600/20 blur-[150px] rounded-full"></div>
                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-20">
                        <div>
                            <span className="text-[10px] font-black text-violet-400 uppercase tracking-[0.4em] mb-4 block">Connection established</span>
                            <h3 className="text-5xl font-black tracking-tight mb-8 text-white">Direct Transmission Node.</h3>
                            <p className="text-slate-400 text-lg mb-12 font-medium leading-relaxed">Connect with our infrastructure specialists for enterprise integration or technical inquiries.</p>
                            <div className="space-y-6">
                                <div className="flex items-center space-x-6">
                                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg></div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Email Node</p>
                                        <p className="text-xl font-black text-white">nexus@helpnexa.io</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-6">
                                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg></div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Deployment HQ</p>
                                        <p className="text-xl font-black text-white">Silicon Valley, CA</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/5 backdrop-blur-md rounded-[3rem] p-10 border border-white/10">
                            <form className="space-y-6" onSubmit={e => { e.preventDefault(); alert('Transmission Received. We will respond shortly.'); }}>
                                <div className="grid grid-cols-2 gap-6">
                                    <input required className="bg-transparent border-b border-white/20 py-4 text-white font-bold outline-none focus:border-violet-500 transition-colors placeholder:text-slate-600" placeholder="Identity Name" />
                                    <input required type="email" className="bg-transparent border-b border-white/20 py-4 text-white font-bold outline-none focus:border-violet-500 transition-colors placeholder:text-slate-600" placeholder="Email Channel" />
                                </div>
                                <textarea required className="bg-transparent border-b border-white/20 py-4 text-white font-bold outline-none focus:border-violet-500 transition-colors placeholder:text-slate-600 w-full min-h-[120px]" placeholder="Transmission Message"></textarea>
                                <button className="w-full py-5 bg-violet-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-violet-500/20 hover:bg-violet-500 transition-all">Send Transmission</button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>
        </main>

        <footer className="py-20 text-center opacity-40 text-[9px] font-black uppercase tracking-[0.4em]">Helpnexa Nexus • Silicon Valley • Quantum Encryption Active</footer>
    </div>
  );

  if (view === 'LOGIN') return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#050508]' : 'bg-[#0a0a0f]'} flex flex-col items-center justify-center p-6 text-center`}>
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[3.5rem] shadow-2xl overflow-hidden relative z-10 border dark:border-slate-800">
        <div className="p-12 text-center bg-slate-950 text-white">
          <div className="w-14 h-14 bg-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-6 cursor-pointer" onClick={() => setView('LANDING')}><ICONS.Sparkles className="w-8 h-8 text-white" /></div>
          <h1 className="text-3xl font-black tracking-tighter mb-2">Helpnexa HUB</h1>
          <p className="text-violet-400 text-[10px] font-black uppercase tracking-[0.4em]">Establish Secure Link</p>
        </div>
        <div className="p-12">
          <form onSubmit={handleEmailLogin} className="space-y-6">
            <input type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-center font-bold dark:text-white" placeholder="operative@zen.com" />
            {loginError && <p className="text-rose-500 text-xs font-black uppercase">{loginError}</p>}
            <button type="submit" className="w-full bg-violet-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-violet-700 transition-all shadow-xl">Authorize Access</button>
            <button type="button" onClick={() => setView('LANDING')} className="text-xs font-bold text-slate-400 hover:text-slate-900 mt-4 block mx-auto">Return to Nexus Landing</button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`flex min-h-screen ${isDarkMode ? 'bg-[#050508]' : 'bg-slate-50'} transition-colors duration-500`}>
      <Sidebar user={currentUser!} activeTab={activeTab} setActiveTab={t => { setActiveTab(t); setSelectedTicket(null); setSearchTerm(''); }} onLogout={handleLogout} knowledgeBaseEnabled={currentCompanyFeatures.knowledgeBase} />
      <div className="flex-1 flex flex-col overflow-hidden relative border-l dark:border-slate-800">
        <Header />
        <main className="flex-1 p-10 overflow-y-auto custom-scrollbar">
          <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12 space-y-4 lg:space-y-0 text-slate-900 dark:text-white">
            <div>
              <div className="flex items-center space-x-2 mb-2"><div className="w-2 h-2 rounded-full bg-violet-600 animate-pulse"></div><h2 className="text-[10px] font-black text-violet-600 dark:text-violet-400 uppercase tracking-[0.3em]">{activeTab} Monitor</h2></div>
              <h3 className="text-3xl font-black tracking-tighter">{activeTab === 'dashboard' ? `Welcome, ${currentUser?.name.split(' ')[0]}` : activeTab.toUpperCase()}</h3>
            </div>
            <div className="flex items-center space-x-4">
               <input type="text" className="w-64 px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold outline-none" placeholder="Search logs..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
               {activeTab === 'performance' && (
                 <>
                   <button onClick={handleGlobalReport} className="flex items-center px-8 py-3.5 bg-violet-50 dark:bg-slate-800 text-violet-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-violet-100 shadow-xl transition-all border border-violet-100 dark:border-slate-700">Audit Report</button>
                   <button onClick={() => setIsExportModalOpen(true)} className="flex items-center px-8 py-3.5 bg-slate-950 text-white dark:bg-white dark:text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:opacity-80 shadow-xl transition-all">Extract Data</button>
                 </>
               )}
               {activeTab === 'tickets' && <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center px-8 py-3.5 bg-violet-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-violet-700 shadow-xl active:scale-95 transition-all"><ICONS.Plus className="w-3.5 h-3.5 mr-2" /> Init Signal</button>}
               {activeTab === 'users' && (currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.MANAGER) && (
                 <button onClick={() => setIsUserCreateModalOpen(true)} className="flex items-center px-8 py-3.5 bg-violet-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-violet-700 shadow-xl active:scale-95 transition-all"><ICONS.Plus className="w-3.5 h-3.5 mr-2" /> Add Personnel</button>
               )}
            </div>
          </header>
          
          {activeTab === 'billing' && (
            <div className="animate-in fade-in duration-700 space-y-12">
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  <div className="lg:col-span-2 space-y-10">
                    <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] p-12 border dark:border-slate-800 shadow-xl">
                      <h4 className="text-2xl font-black mb-8 tracking-tight">Active Node Deployment</h4>
                      <div className="flex items-center justify-between p-8 bg-slate-50 dark:bg-slate-950 rounded-3xl border dark:border-slate-800 mb-8">
                         <div className="flex items-center space-x-6">
                            <div className="w-16 h-16 bg-violet-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><ICONS.Sparkles className="w-8 h-8" /></div>
                            <div>
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Tier</p>
                               <p className="text-2xl font-black">{currentCompany?.subscriptionTier} NODE</p>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cycle Renews</p>
                            <p className="text-lg font-bold">Oct 24, 2025</p>
                         </div>
                      </div>
                      <div className="space-y-6">
                         <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Resource Utilization</p>
                         <div className="space-y-4">
                            <div>
                               <div className="flex justify-between text-xs font-bold mb-2"><span>Agent Seats</span><span>{currentUsage.agents} / {planLimits.agents}</span></div>
                               <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-violet-600" style={{ width: `${(typeof planLimits.agents === 'number' ? (currentUsage.agents / planLimits.agents) * 100 : 0)}%` }}></div>
                               </div>
                            </div>
                            <div>
                               <div className="flex justify-between text-xs font-bold mb-2"><span>Team Leads</span><span>{currentUsage.leads} / {planLimits.leads}</span></div>
                               <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-indigo-500" style={{ width: `${(typeof planLimits.leads === 'number' && planLimits.leads > 0 ? (currentUsage.leads / planLimits.leads) * 100 : 0)}%` }}></div>
                               </div>
                            </div>
                         </div>
                      </div>
                    </div>
                  </div>
                  <div className="lg:col-span-1 space-y-8">
                    <div className="bg-slate-950 rounded-[3rem] p-10 text-white shadow-2xl border border-violet-500/10">
                       <h4 className="text-lg font-black mb-6">Upgrade Tier</h4>
                       <div className="space-y-4">
                          {[
                            { tier: SubscriptionTier.PRO, price: '$30/mo', desc: '5 Agents + Neural Triage' },
                            { tier: SubscriptionTier.ENTERPRISE, price: '$49/mo', desc: 'Unlimited + Neural Summary' }
                          ].map(plan => (
                             <button 
                                key={plan.tier}
                                onClick={() => initiateCheckout(plan.tier)}
                                className={`w-full p-6 rounded-2xl border text-left transition-all ${currentCompany?.subscriptionTier === plan.tier ? 'border-violet-600 bg-violet-600/10' : 'border-white/10 hover:border-white/30 bg-white/5'}`}
                             >
                                <div className="flex justify-between items-center mb-1">
                                   <span className="font-black text-sm">{plan.tier}</span>
                                   <span className="text-[10px] font-black text-violet-400">{plan.price}</span>
                                </div>
                                <p className="text-[10px] text-slate-400">{plan.desc}</p>
                             </button>
                          ))}
                       </div>
                    </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="animate-in fade-in duration-700 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {agentPerformanceData.map(data => (
                  <div key={data.agent.id} className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 border dark:border-slate-800 shadow-xl">
                    <div className="flex items-center space-x-4 mb-8">
                       <img src={data.agent.avatar} className="w-16 h-16 rounded-2xl" alt="" />
                       <div><p className="text-lg font-black">{data.agent.name}</p><p className="text-[10px] font-bold text-slate-400">{data.agent.email}</p></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl text-center">
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Total</p>
                          <p className="text-xl font-black">{data.total}</p>
                       </div>
                       <div className="bg-emerald-50 dark:bg-emerald-950 p-4 rounded-2xl text-center">
                          <p className="text-[9px] font-black text-emerald-600 uppercase mb-1">Solved</p>
                          <p className="text-xl font-black text-emerald-600">{data.completed}</p>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <div className="animate-in fade-in duration-700">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                  {dashboardMetrics.map((stat, i) => (
                    <div key={i} className={`${stat.bg} p-8 rounded-[2.5rem] border border-white dark:border-slate-800 shadow-xl group hover:-translate-y-1 transition-all`}>
                      <div className="flex justify-between items-start mb-6">
                         <div className={`p-3 rounded-2xl bg-white dark:bg-slate-800 shadow-sm ${stat.color}`}><stat.icon className="w-5 h-5" /></div>
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">LIVE DATA</span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase mb-1">{stat.label}</p>
                      <p className={`text-4xl font-black tracking-tighter ${stat.color}`}>{stat.val}</p>
                    </div>
                  ))}
               </div>
               <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border dark:border-slate-800">
                  <h4 className="text-xl font-black mb-6">Recent Fleet Operations</h4>
                  <div className="space-y-4">
                     {filteredTickets.slice(0, 5).map(t => (
                       <div key={t.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl">
                          <div className="flex items-center space-x-4">
                             <span className="font-mono text-[10px] text-violet-500 font-black">{t.id}</span>
                             <p className="text-sm font-bold">{t.title}</p>
                          </div>
                          <Badge type="status" value={t.status} />
                       </div>
                     ))}
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'tickets' && !selectedTicket && (
            <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-xl border dark:border-slate-800 overflow-hidden animate-in fade-in">
               <table className="w-full text-left border-collapse dark:text-white">
                  <thead className="bg-slate-50 dark:bg-slate-950 border-b dark:border-slate-800">
                    <tr>
                      <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Signal</th>
                      <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Payload</th>
                      <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Priority</th>
                      <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-slate-800">
                    {filteredTickets.map(t => (
                      <tr key={t.id} onClick={() => setSelectedTicket(t)} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/80 cursor-pointer transition-all">
                        <td className="px-10 py-6 font-mono font-black text-violet-500 text-xs">{t.id}</td>
                        <td className="px-10 py-6"><p className="font-bold">{t.title}</p></td>
                        <td className="px-10 py-6"><Badge type="priority" value={t.priority} /></td>
                        <td className="px-10 py-6"><Badge type="status" value={t.status} /></td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          )}

          {selectedTicket && (
            <div className="animate-in slide-in-from-right duration-500 space-y-8">
               <button onClick={() => setSelectedTicket(null)} className="flex items-center text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-violet-600 mb-8"><ICONS.XMark className="w-4 h-4 mr-2" /> Disconnect View</button>
               <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] p-12 border dark:border-slate-800">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h3 className="text-4xl font-black mb-4">{selectedTicket.title}</h3>
                      <div className="flex gap-4">
                        <Badge type="status" value={selectedTicket.status} />
                        <Badge type="priority" value={selectedTicket.priority} />
                      </div>
                    </div>
                    {currentCompanyFeatures.neuralSummary && (
                      <button onClick={handleSummarizeThread} disabled={isSummarizing} className="px-6 py-3 bg-violet-50 dark:bg-slate-800 text-violet-600 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center border dark:border-slate-700">
                        <ICONS.Sparkles className={`w-3.5 h-3.5 mr-2 ${isSummarizing ? 'animate-spin' : ''}`} /> Summary
                      </button>
                    )}
                  </div>
                  {ticketSummary && (
                    <div className="mb-10 p-6 bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-slate-800 rounded-3xl animate-in fade-in slide-in-from-top-4">
                       <p className="text-[10px] font-black text-violet-600 uppercase tracking-widest mb-2 flex items-center"><ICONS.Sparkles className="w-3 h-3 mr-1.5" /> AI Trace Summary</p>
                       <p className="text-sm font-bold text-slate-700 dark:text-slate-300 italic">"{ticketSummary}"</p>
                    </div>
                  )}
                  <p className="text-lg text-slate-600 dark:text-slate-300 font-medium leading-relaxed mb-12">{selectedTicket.description}</p>
                  <div className="space-y-8 border-t dark:border-slate-800 pt-10">
                     <h4 className="text-xl font-black">Signal Log</h4>
                     {selectedTicket.comments.map(c => (
                        <div key={c.id} className="flex space-x-4">
                           <img src={`https://picsum.photos/seed/${c.authorId}/100`} className="w-10 h-10 rounded-xl" alt="" />
                           <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-3xl border dark:border-slate-800 flex-1">
                              <p className="text-[10px] font-black uppercase text-slate-400 mb-2">{users.find(u => u.id === c.authorId)?.name || "System"}</p>
                              <p className="text-sm font-semibold">{c.text}</p>
                           </div>
                        </div>
                     ))}
                     <div className="relative pt-6">
                        <textarea className="w-full p-6 bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-3xl font-semibold outline-none focus:ring-4 focus:ring-violet-500/10 min-h-[120px]" placeholder="Broadcast Response..." onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment(e.currentTarget.value); e.currentTarget.value = ''; } }} />
                     </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="animate-in fade-in duration-500 text-slate-900 dark:text-white space-y-8">
               <div className="space-y-4">
                  {directoryHeads.map(head => {
                    const isExpanded = expandedCompanies.has(head.id);
                    const companyPersonnel = users.filter(u => u.companyId === head.companyId && u.id !== head.id && (currentUser?.role === UserRole.ADMIN || u.role !== UserRole.ADMIN));
                    return (
                      <div key={head.id} className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border dark:border-slate-800 overflow-hidden transition-all">
                        <div onClick={() => toggleCompanyExpansion(head.id)} className="p-8 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                          <div className="flex items-center space-x-6">
                            <img src={head.avatar} className="w-14 h-14 rounded-2xl shadow-sm" alt="" />
                            <div><p className="font-black text-lg">{head.name} <span className="text-xs font-black text-violet-600 uppercase tracking-widest ml-2">({head.role})</span></p><p className="text-[10px] font-black text-slate-400 uppercase mt-1">{head.email}</p></div>
                          </div>
                          <button className={`p-2 rounded-xl transition-all ${isExpanded ? 'bg-violet-600 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}>
                            {isExpanded ? <ICONS.ChevronDown className="w-5 h-5" /> : <ICONS.ChevronRight className="w-5 h-5" />}
                          </button>
                        </div>
                        {isExpanded && (
                          <div className="bg-slate-50/50 dark:bg-slate-950/50 border-t dark:border-slate-800 p-8 space-y-6">
                                {companyPersonnel.map(u => (
                                    <div key={u.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border dark:border-slate-800 flex items-center justify-between">
                                      <div className="flex items-center space-x-4">
                                        <img src={u.avatar} className="w-12 h-12 rounded-2xl" alt="" />
                                        <div><p className="text-sm font-black">{u.name}</p><p className="text-[10px] font-bold text-slate-400 uppercase">{u.role} • {u.email}</p></div>
                                      </div>
                                      <button onClick={(e) => { e.stopPropagation(); toggleUserStatus(u.id); }} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${u.isActive !== false ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-500'}`}>{u.isActive !== false ? 'Disable' : 'Enable'}</button>
                                    </div>
                                ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
               </div>
            </div>
          )}
        </main>
      </div>

      {/* MODALS */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-2xl p-6">
          <div className="bg-white dark:bg-slate-900 rounded-[4rem] shadow-2xl w-full max-w-lg overflow-hidden border dark:border-slate-800">
            <div className="p-10 text-center bg-slate-950 text-white border-b border-white/10">
               <div className="w-16 h-16 bg-violet-600 rounded-3xl flex items-center justify-center mx-auto mb-6"><ICONS.Check className="w-8 h-8 text-white" /></div>
               <h3 className="text-2xl font-black tracking-tight">Node Re-Provisioning</h3>
               <p className="text-[10px] font-black uppercase tracking-[0.4em] text-violet-400 mt-2">Target Plan: {targetPlan}</p>
            </div>
            <div className="p-10 space-y-8">
               <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-3xl border dark:border-slate-800 space-y-4">
                  <div className="flex justify-between text-sm font-bold"><span>Subscription Cycle</span><span>Monthly</span></div>
                  <div className="flex justify-between text-sm font-black border-t dark:border-slate-800 pt-4"><span className="text-slate-400">Total Charge</span><span className="text-xl text-violet-600">{targetPlan === SubscriptionTier.PRO ? '$30.00' : '$49.00'}</span></div>
               </div>
               <div className="flex space-x-4">
                  <button onClick={() => setIsCheckoutModalOpen(false)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl font-black uppercase text-[10px] tracking-widest">Cancel</button>
                  <button onClick={handleConfirmUpgrade} className="flex-[2] py-4 bg-violet-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-violet-500/20 hover:bg-violet-700">Authorize Payment</button>
               </div>
            </div>
          </div>
        </div>
      )}

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-2xl p-6">
          <div className="bg-white dark:bg-slate-900 rounded-[4rem] shadow-2xl w-full max-w-2xl overflow-hidden border dark:border-slate-800">
            <div className="p-12 border-b dark:border-slate-800 flex justify-between items-center"><h3 className="text-3xl font-black tracking-tight dark:text-white">Broadcast Signal</h3><button onClick={() => setIsCreateModalOpen(false)} className="w-12 h-12 flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-400 hover:text-rose-500 border dark:border-slate-700"><ICONS.XMark className="w-6 h-6" /></button></div>
            <form onSubmit={handleCreateTicket} className="p-12 space-y-8 bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
              <input required value={newTicket.title} onChange={e => setNewTicket({...newTicket, title: e.target.value})} className="w-full p-5 bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-2xl outline-none font-bold text-lg text-center" placeholder="Signal Subject" />
              <textarea required value={newTicket.description} onChange={e => setNewTicket({...newTicket, description: e.target.value})} className="w-full p-5 bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-2xl outline-none min-h-[180px] font-semibold" placeholder="Detailed Payload" />
              <div className="grid grid-cols-2 gap-6">
                {currentCompanyFeatures.neuralTriage && <button type="button" onClick={handleSmartTriage} disabled={isTriageLoading} className="py-5 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 transition-all dark:bg-slate-800"><ICONS.Sparkles className={`w-4 h-4 mr-2 inline ${isTriageLoading ? 'animate-spin' : ''}`} /> Neural Triage</button>}
                <button type="submit" className={`py-5 bg-violet-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-violet-700 shadow-2xl transition-all ${!currentCompanyFeatures.neuralTriage ? 'col-span-2' : ''}`}>Submit Signal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isUserCreateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-2xl p-6">
          <div className="bg-white dark:bg-slate-900 rounded-[4rem] shadow-2xl w-full max-w-xl overflow-hidden border dark:border-slate-800">
            <div className="p-12 border-b dark:border-slate-800 flex justify-between items-center"><h3 className="text-3xl font-black tracking-tight dark:text-white">Add Personnel</h3><button onClick={() => setIsUserCreateModalOpen(false)} className="w-12 h-12 flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-400 hover:text-rose-500 border dark:border-slate-700"><ICONS.XMark className="w-6 h-6" /></button></div>
            <form onSubmit={handleCreateUser} className="p-12 space-y-6 bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
              <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Full Name</label><input required value={newUserForm.name} onChange={e => setNewUserForm({...newUserForm, name: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-2xl outline-none font-bold" /></div>
              <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Email Address</label><input required type="email" value={newUserForm.email} onChange={e => setNewUserForm({...newUserForm, email: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-2xl outline-none font-bold" /></div>
              <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Role</label><select value={newUserForm.role} onChange={e => setNewUserForm({...newUserForm, role: e.target.value as UserRole})} className="w-full p-4 bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-2xl outline-none font-bold appearance-none"><option value={UserRole.USER}>End User</option><option value={UserRole.AGENT}>Support Agent</option><option value={UserRole.TEAM_LEAD}>Team Lead</option></select></div>
              <button type="submit" className="w-full py-5 bg-violet-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-violet-700 mt-4 shadow-xl">Initialize Personnel</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;