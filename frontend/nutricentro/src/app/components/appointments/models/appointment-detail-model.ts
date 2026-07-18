export interface TimelineViewItem {
  title: string;
  detail: string;
  date: string;
  icon: string;
  tone: string;
}

export interface ConsultationDraft {
  reason: string;
  evolution: string;
  indications: string;
  nextConsultation: string;
  observations: string;
}
