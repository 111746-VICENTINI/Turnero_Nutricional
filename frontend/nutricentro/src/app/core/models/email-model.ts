export interface AttachmentDTO {
  filename: string;
  contentType?: string | null;
  contentBase64?: string | null;
  sizeBytes?: number | null;
}

export interface EmailRequestDTO {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  htmlMessage?: string | null;
  textMessage?: string | null;
  replyTo?: string | null;
  fromName?: string | null;
  patientId?: number | null;
  historyId?: number | null;
  includeFoodPlan?: boolean;
  includeAnthropometry?: boolean;
  includeLaboratories?: boolean;
  includeClinicalFiles?: boolean;
  attachments?: AttachmentDTO[];
}

export interface EmailResponseDTO {
  auditId: number;
  status: 'PENDING' | 'SENT' | 'FAILED';
  provider: string;
  messageId?: string | null;
  errorMessage?: string | null;
  sentAt?: string | null;
}
