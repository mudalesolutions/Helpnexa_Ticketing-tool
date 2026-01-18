
import React from 'react';
/* Added EscalationLevel to imports */
import { Company, User, UserRole, Ticket, TicketStatus, TicketPriority, Category, RegistrationStatus, AppFeatures, SubscriptionTier, EscalationLevel } from './types';

export const DEFAULT_FEATURES: AppFeatures = {
  neuralTriage: true,
  neuralSummary: true,
  autoRouting: true,
  knowledgeBase: true,
};

export const TIER_FEATURES: Record<SubscriptionTier, AppFeatures> = {
  [SubscriptionTier.FREE]: {
    neuralTriage: false,
    neuralSummary: false,
    autoRouting: false,
    knowledgeBase: true,
  },
  [SubscriptionTier.PRO]: {
    neuralTriage: true,
    neuralSummary: false,
    autoRouting: true,
    knowledgeBase: true,
  },
  [SubscriptionTier.ENTERPRISE]: {
    neuralTriage: true,
    neuralSummary: true,
    autoRouting: true,
    knowledgeBase: true,
  },
  [SubscriptionTier.CUSTOM]: {
    neuralTriage: false,
    neuralSummary: false,
    autoRouting: false,
    knowledgeBase: true,
  }
};

export const ICONS = {
  Dashboard: (props: any) => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1 13.5 18v-2.25Z" />
    </svg>
  ),
  Ticket: (props: any) => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z" />
    </svg>
  ),
  Users: (props: any) => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  ),
  Building: (props: any) => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.375m-.375 3h.375m-.375 3h.375" />
    </svg>
  ),
  Category: (props: any) => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581a2.25 2.25 0 0 0 3.182 0l4.318-4.318a2.25 2.25 0 0 0 0-3.182L11.16 3.659A2.25 2.25 0 0 0 9.568 3Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
    </svg>
  ),
  Logout: (props: any) => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
    </svg>
  ),
  Plus: (props: any) => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  ),
  Check: (props: any) => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  ),
  XMark: (props: any) => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  ),
  Sparkles: (props: any) => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09-3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
    </svg>
  ),
  ChevronDown: (props: any) => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  ),
  ChevronRight: (props: any) => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
  ),
  Sun: (props: any) => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M3 12h2.25m.386-4.773 1.591-1.591M12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z" />
    </svg>
  ),
  Moon: (props: any) => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 12a9.75 9.75 0 0 1-9.375 9.75 9.75 9.75 0 0 1-9.375-9.75 9.75 9.75 0 0 1 9.375-9.75c.414 0 .814.027 1.206.079a.75.75 0 0 1 .592.592 9.75 9.75 0 0 0 12.926 12.926.75.75 0 0 1 .592.592c.052.392.079.792.079 1.206Z" />
    </svg>
  ),
  Bell: (props: any) => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
    </svg>
  ),
  Cog6Tooth: (props: any) => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 1 1 15 0 7.5 7.5 0 0 1-15 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9" />
    </svg>
  ),
};

export const MOCK_COMPANIES: Company[] = [
  { id: 'comp-1', name: 'Acme Corp', domain: 'acme.com', createdAt: new Date(Date.now() - 31536000000).toISOString(), status: RegistrationStatus.APPROVED, features: TIER_FEATURES[SubscriptionTier.ENTERPRISE], subscriptionTier: SubscriptionTier.ENTERPRISE },
  { id: 'comp-2', name: 'Global Tech', domain: 'globaltech.io', createdAt: new Date(Date.now() - 15768000000).toISOString(), status: RegistrationStatus.APPROVED, features: TIER_FEATURES[SubscriptionTier.PRO], subscriptionTier: SubscriptionTier.PRO },
  { id: 'comp-3', name: 'Cyberdyne Systems', domain: 'cyberdyne.jp', createdAt: new Date(Date.now() - 864000000).toISOString(), status: RegistrationStatus.APPROVED, features: TIER_FEATURES[SubscriptionTier.FREE], subscriptionTier: SubscriptionTier.FREE },
];

export const MOCK_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Hardware', description: 'Monitors, Laptops, Keyboards, etc.' },
  { id: 'cat-2', name: 'Software', description: 'OS issues, App crashes, Licenses.' },
  { id: 'cat-3', name: 'Networking', description: 'VPN, WiFi, Internet access.' },
  { id: 'cat-4', name: 'Access Control', description: 'Passwords, Permissions, Onboarding.' },
];

export const MOCK_USERS: User[] = [
  { id: 'user-0', name: 'Zen Admin', email: 'admin@zen.com', role: UserRole.ADMIN, companyId: 'comp-1', avatar: 'https://picsum.photos/seed/zenadmin/100', isActive: true },
  { id: 'user-1', name: 'Super Admin', email: 'admin@helpnexa.com', role: UserRole.ADMIN, companyId: 'comp-1', avatar: 'https://picsum.photos/seed/helpnexaadmin/100', isActive: true },
  { id: 'user-2', name: 'Sarah Acme Manager', email: 'manager@acme.com', role: UserRole.MANAGER, companyId: 'comp-1', avatar: 'https://picsum.photos/seed/acme_m/100', isActive: true },
  { id: 'user-3', name: 'Alice Acme Agent', email: 'alice@acme.com', role: UserRole.AGENT, companyId: 'comp-1', avatar: 'https://picsum.photos/seed/acme_a/100', isActive: true },
  { id: 'user-7', name: 'Mark Acme User', email: 'user@acme.com', role: UserRole.USER, companyId: 'comp-1', avatar: 'https://picsum.photos/seed/acme_u/100', isActive: true },
  { id: 'user-4', name: 'Bob Global Manager', email: 'manager@globaltech.io', role: UserRole.MANAGER, companyId: 'comp-2', avatar: 'https://picsum.photos/seed/global_m/100', isActive: true },
  { id: 'user-5', name: 'John Global Agent', email: 'john@globaltech.io', role: UserRole.AGENT, companyId: 'comp-2', avatar: 'https://picsum.photos/seed/global_a/100', isActive: true },
  { id: 'user-6', name: 'David Cyber Manager', email: 'manager@cyberdyne.jp', role: UserRole.MANAGER, companyId: 'comp-3', avatar: 'https://picsum.photos/seed/cyber_m/100', isActive: true },
];

export const MOCK_TICKETS: Ticket[] = [
  {
    id: 'T-8821',
    title: 'Acme Server Outage',
    description: 'The production server in the west wing is unresponsive after the power surge. We need an on-site technician to inspect the motherboard.',
    status: TicketStatus.IN_PROGRESS,
    priority: TicketPriority.URGENT,
    category: 'Hardware',
    requesterId: 'user-7',
    companyId: 'comp-1',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date().toISOString(),
    comments: [
        { id: 'c1', authorId: 'user-7', text: 'Still no response from the console. Please hurry.', createdAt: new Date(Date.now() - 3000000).toISOString() },
        { id: 'c2', authorId: 'user-3', text: 'I am heading to the server room now with replacement parts.', createdAt: new Date(Date.now() - 2000000).toISOString() }
    ],
    /* Added missing escalationLevel */
    escalationLevel: EscalationLevel.NONE
  },
  {
    id: 'T-9902',
    title: 'Skynet Neural Drift',
    description: 'Neural net weights are drifting. Need manual recalibration of the Skynet core to prevent logical inconsistencies.',
    status: TicketStatus.OPEN,
    priority: TicketPriority.HIGH,
    category: 'Software',
    requesterId: 'user-6',
    companyId: 'comp-3',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date().toISOString(),
    comments: [],
    /* Added missing escalationLevel */
    escalationLevel: EscalationLevel.NONE
  },
];
