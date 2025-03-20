export interface Email {
  id: number;
  fromEmail: string;
  toEmail: string;
  subject: string | null;
  body: string | null;
  bodyJson: Record<string, any> | null;
  isHtml: boolean;
  read: boolean;
  sentDate: Date;
  attachments?: any[];
}

export interface ActionPayload {
  email: Email;
  chainData?: any;
}

export interface SMTPServerConfig {
  port: number;
  host?: string;
  secure?: boolean;
  authOptional?: boolean;
}

export interface HandlebarsOptions {
  fn: (context: any) => string;
  inverse: (context: any) => string;
  data: { path: string };
} 