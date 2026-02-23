
export interface EmployeeMetrics {
  "Full name": string;
  "ASR/Hrs Target": number | string;
  "ASR/Hrs": number | string;
  "ASR/Hrs Fill": number | string;
  "ASR Services/Hrs Target": number | string;
  "ASR_Services/Hrs": number | string;
  "ASR Services/Hrs Fill": number | string;
}

export interface FeedbackData {
  comment: string;
  nvc: string;
  praise: string;
  development: string;
  goals: string[];
}

export interface ValidationError {
  missing: string[];
  expected: string[];
  found: string[];
}
