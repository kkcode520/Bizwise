export type Contact = {
  id: string;
  userId?: string;
  name: string;
  company: string;
  title: string;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  note?: string;
  cardImage?: string;
  createdAt: string;
  recognizedAt: string;
};

export type ContactInsight = {
  companySummary: string;
  companyNews: string[];
  industryUpdates: string[];
  icebreakers: string[];
  followUps: string[];
  generatedAt: string;
  source: "mock" | "ai";
};

export type ScanResult = {
  name: string;
  company: string;
  title: string;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  note?: string;
};

export type SessionUser = {
  id: string;
  name: string;
  email: string;
};
