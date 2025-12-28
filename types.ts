
export type MessageRole = 'user' | 'assistant' | 'system';

export interface UserProfile {
  displayName: string;
  avatarUrl?: string;
}

export interface MessageContent {
  text?: string;
  image?: string;
  chartData?: ChartDataPoint[];
  chartType?: 'bar' | 'line' | 'pie';
  attachments?: string[]; // base64 strings
}

export interface Message {
  id: string;
  role: MessageRole;
  content: MessageContent;
  timestamp: number;
  isLoading?: boolean;
  feedback?: 'up' | 'down';
}

export interface ChartDataPoint {
  name: string;
  value: number;
}

export interface Session {
  id: string;
  title: string;
  messages: Message[];
}
