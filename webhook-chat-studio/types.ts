
export type Role = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
}

export interface WebhookResponse {
  answer?: string;
  output?: string;
  text?: string;
  response?: string;
}
