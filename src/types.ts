export type EmailCategory = 'support' | 'sales' | 'urgent' | 'spam' | 'newsletter' | 'internal';

export interface Email {
  id: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  body: string;
  timestamp: string;
  threadId: string;
  hasAttachments: boolean;
  status: 'pending' | 'processing' | 'awaiting_approval' | 'approved' | 'rejected' | 'sent' | 'archived';
  category?: EmailCategory;
  confidenceScore?: number;
  summary?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  extractedEntities?: {
    company?: string;
    product?: string;
    name?: string;
  };
  draftReply?: string;
  actionTaken?: string;
  errorReason?: string;
  logs: string[];
}

export interface NotionTicket {
  id: string;
  emailId: string;
  title: string;
  sender: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Open' | 'In Progress' | 'Resolved';
  summary: string;
  draftReply: string;
  dateReceived: string;
}

export interface NotionLead {
  id: string;
  emailId: string;
  company: string;
  contact: string;
  email: string;
  category: string;
  summary: string;
  followUpDate: string;
}

export interface SlackMessage {
  id: string;
  emailId: string;
  channel: '#email-review' | 'Direct Message' | '#n8n-errors';
  title: string;
  body: string;
  draftReply?: string;
  status: 'pending' | 'approved' | 'rejected' | 'edited';
  timestamp: string;
  interactiveButtons: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  emailSubject: string;
  category: string;
  confidenceScore: number;
  actionTaken: string;
  status: 'Success' | 'Warning' | 'Failed';
}

export interface SystemStats {
  totalProcessed: number;
  supportCount: number;
  salesCount: number;
  urgentCount: number;
  spamCount: number;
  newsletterCount: number;
  averageConfidence: number;
  successRate: number;
}
