
export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  TEAM_LEAD = 'TEAM_LEAD',
  AGENT = 'AGENT',
  USER = 'USER'
}

export enum TicketStatus {
  OPEN = 'Open',
  IN_PROGRESS = 'In Progress',
  HOLD = 'Hold',
  COMPLETED = 'Completed',
  CLOSED = 'Closed'
}

export enum TicketPriority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  URGENT = 'Urgent'
}

export enum RegistrationStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected'
}

export enum SubscriptionTier {
  FREE = 'Free',
  PRO = 'Pro',
  ENTERPRISE = 'Enterprise',
  CUSTOM = 'Custom'
}

export enum EscalationLevel {
  NONE = 0,
  TEAM_LEAD = 1,
  MANAGER = 2
}

export interface AppFeatures {
  neuralTriage: boolean;
  neuralSummary: boolean;
  autoRouting: boolean;
  knowledgeBase: boolean;
}

export interface Company {
  id: string;
  name: string;
  domain: string;
  createdAt: string;
  status: RegistrationStatus;
  features: AppFeatures;
  subscriptionTier: SubscriptionTier;
  billingEmail?: string;
  nextBillingDate?: string;
}

export interface CompanyRegistrationRequest {
  id: string;
  companyName: string;
  domain: string;
  adminName: string;
  adminEmail: string;
  status: RegistrationStatus;
  requestedAt: string;
  tier: SubscriptionTier;
}

export interface Category {
  id: string;
  name: string;
  description: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyId: string;
  avatar?: string;
  isActive?: boolean;
}

export interface TicketComment {
  id: string;
  authorId: string;
  text: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: string;
  requesterId: string;
  assigneeId?: string;
  companyId: string;
  createdAt: string;
  updatedAt: string;
  comments: TicketComment[];
  escalationLevel: EscalationLevel;
  lastEscalationAt?: string;
}

export interface Notification {
  id: string;
  recipientEmail: string;
  subject: string;
  content: string;
  timestamp: string;
  type: 'ASSIGNMENT' | 'COMMENT' | 'ESCALATION';
  ticketId: string;
}
