export interface Commission {
  id: string;
  company: string;
  description?: string;
  amount: number;
  launchDate: string; // ISO string
  paymentDate: string; // ISO string (launchDate + 90 days)
  status: 'pending' | 'paid';
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string; // ISO string
  type: 'personal' | 'business';
  kind: 'income' | 'expense';
}

export interface Project {
  id: string;
  client: string;
  title: string;
  description: string;
  status: 'proposal' | 'approved' | 'delivered';
  value?: number; // Only set when approved
  deadline: string; // ISO string
}

export type Tab = 'dashboard' | 'commissions' | 'expenses' | 'projects';
