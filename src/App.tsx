/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';
import { 
  LayoutDashboard, 
  DollarSign, 
  Briefcase, 
  CreditCard, 
  Plus, 
  Trash2, 
  Edit2,
  CheckCircle, 
  Clock, 
  Calendar as CalendarIcon,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  PieChart as PieChartIcon,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  Printer,
  FileText,
  Menu,
  X
} from 'lucide-react';
import { format, addDays, parseISO, startOfMonth, endOfMonth, isWithinInterval, addMonths, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { Commission, Transaction, Project, Tab } from './types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function App() {
  // --- State ---
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [commissions, setCommissions] = useState<Commission[]>(() => {
    const saved = localStorage.getItem('dronetech_commissions');
    return saved ? JSON.parse(saved) : [];
  });
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('dronetech_expenses');
    return saved ? JSON.parse(saved) : [];
  });
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('dronetech_projects');
    return saved ? JSON.parse(saved) : [];
  });
  const [searchPartner, setSearchPartner] = useState('');
  const [editingCommission, setEditingCommission] = useState<Commission | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const exportData = () => {
    const data = {
      commissions,
      transactions,
      projects,
      version: '1.0',
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dronetech_backup_${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.commissions) setCommissions(data.commissions);
        if (data.transactions) setTransactions(data.transactions);
        if (data.expenses) setTransactions(data.expenses); // Backward compatibility
        if (data.projects) setProjects(data.projects);
        alert('Dados importados com sucesso!');
      } catch (err) {
        alert('Erro ao importar arquivo. Verifique se o formato é válido.');
      }
    };
    reader.readAsText(file);
  };

  // --- Persistence ---
  useEffect(() => {
    localStorage.setItem('dronetech_commissions', JSON.stringify(commissions));
  }, [commissions]);

  useEffect(() => {
    localStorage.setItem('dronetech_expenses', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('dronetech_projects', JSON.stringify(projects));
  }, [projects]);

  // --- Calculations ---
  const monthlyPredictability = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => addMonths(new Date(), i));
    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      const total = commissions
        .filter(c => {
          const pDate = parseISO(c.paymentDate);
          return c.status === 'pending' && isWithinInterval(pDate, { start: monthStart, end: monthEnd });
        })
        .reduce((sum, c) => sum + c.amount, 0);
      
      return {
        name: format(month, 'MMM/yy', { locale: ptBR }),
        valor: total
      };
    });
  }, [commissions]);

  const totalCommissionsPaid = useMemo(() => 
    commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0), 
  [commissions]);

  const expenseCategories = useMemo(() => {
    const categories: Record<string, number> = {};
    transactions.filter(t => t.kind === 'expense').forEach(e => {
      categories[e.category] = (categories[e.category] || 0) + e.amount;
    });
    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  const incomeCategories = useMemo(() => {
    const categories: Record<string, number> = {};
    transactions.filter(t => t.kind === 'income').forEach(e => {
      categories[e.category] = (categories[e.category] || 0) + e.amount;
    });
    if (totalCommissionsPaid > 0) {
      categories['Comissões'] = (categories['Comissões'] || 0) + totalCommissionsPaid;
    }
    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }, [transactions, totalCommissionsPaid]);

  const totalReceivables = useMemo(() => 
    commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0), 
  [commissions]);

  const totalIncome = useMemo(() => 
    transactions.filter(t => t.kind === 'income').reduce((sum, t) => sum + t.amount, 0) + totalCommissionsPaid, 
  [transactions, totalCommissionsPaid]);

  const totalExpenses = useMemo(() => 
    transactions.filter(t => t.kind === 'expense').reduce((sum, t) => sum + t.amount, 0), 
  [transactions]);

  // --- Handlers ---
  const addCommission = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amount = Number(formData.get('amount'));
    const launchDate = formData.get('launchDate') as string;
    const paymentDate = addDays(parseISO(launchDate), 90).toISOString();

    if (editingCommission) {
      setCommissions(commissions.map(c => c.id === editingCommission.id ? {
        ...c,
        company: formData.get('company') as string,
        description: formData.get('description') as string,
        amount,
        launchDate,
        paymentDate,
        status: formData.get('status') as 'pending' | 'paid' || c.status
      } : c));
      setEditingCommission(null);
    } else {
      const newCommission: Commission = {
        id: crypto.randomUUID(),
        company: formData.get('company') as string,
        description: formData.get('description') as string,
        amount,
        launchDate,
        paymentDate,
        status: 'pending'
      };
      setCommissions([...commissions, newCommission]);
    }
    e.currentTarget.reset();
  };

  const addTransaction = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amount = Number(formData.get('amount'));
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const date = formData.get('date') as string;
    const type = formData.get('type') as 'personal' | 'business';
    const kind = formData.get('kind') as 'income' | 'expense';

    if (editingTransaction) {
      setTransactions(transactions.map(t => t.id === editingTransaction.id ? {
        ...t,
        description,
        amount,
        category,
        date,
        type,
        kind
      } : t));
      setEditingTransaction(null);
    } else {
      const newTransaction: Transaction = {
        id: crypto.randomUUID(),
        description,
        amount,
        category,
        date,
        type,
        kind
      };
      setTransactions([...transactions, newTransaction]);
    }
    e.currentTarget.reset();
  };

  const addProject = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const client = formData.get('client') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const deadline = formData.get('deadline') as string;

    if (editingProject) {
      setProjects(projects.map(p => p.id === editingProject.id ? {
        ...p,
        client,
        title,
        description,
        deadline
      } : p));
      setEditingProject(null);
    } else {
      const newProject: Project = {
        id: crypto.randomUUID(),
        client,
        title,
        description,
        status: 'proposal',
        deadline
      };
      setProjects([...projects, newProject]);
    }
    e.currentTarget.reset();
  };

  const handlePrintExtrato = () => {
    const filtered = commissions.filter(c => 
      c.company.toLowerCase().includes(searchPartner.toLowerCase())
    );

    if (filtered.length === 0) {
      alert("Nenhuma comissão encontrada para este parceiro.");
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const total = filtered.reduce((sum, c) => sum + c.amount, 0);
    const partnerName = searchPartner || "Todos os Parceiros";

    printWindow.document.write(`
      <html>
        <head>
          <title>Extrato de Cobrança - ${partnerName}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #1e293b; }
            .header { border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { margin: 0; color: #1e293b; }
            .header p { margin: 5px 0 0; color: #64748b; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { text-align: left; background: #f8fafc; padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; text-transform: uppercase; color: #64748b; }
            td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
            .total-row { background: #f8fafc; font-weight: bold; }
            .footer { text-align: center; font-size: 12px; color: #94a3b8; margin-top: 50px; }
            .status { font-weight: bold; text-transform: uppercase; font-size: 10px; }
            .status-pending { color: #b45309; }
            .status-paid { color: #047857; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Dronetech - Extrato de Cobrança</h1>
            <p>Parceiro: ${partnerName}</p>
            <p>Data de Emissão: ${format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Lançamento</th>
                <th>Descrição</th>
                <th>Vencimento (90d)</th>
                <th>Status</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(c => `
                <tr>
                  <td>${format(parseISO(c.launchDate), 'dd/MM/yyyy')}</td>
                  <td>${c.description || '-'}</td>
                  <td>${format(parseISO(c.paymentDate), 'dd/MM/yyyy')}</td>
                  <td class="status ${c.status === 'pending' ? 'status-pending' : 'status-paid'}">
                    ${c.status === 'pending' ? 'Pendente' : 'Recebido'}
                  </td>
                  <td>R$ ${c.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="4" style="text-align: right;">Total a Receber:</td>
                <td>R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>
          <div class="footer">
            <p>Dronetech Management Portal - Relatório Gerencial</p>
          </div>
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const approveProject = (id: string, value: number) => {
    setProjects(projects.map(p => p.id === id ? { ...p, status: 'approved', value } : p));
  };

  const deleteItem = (type: Tab, id: string) => {
    if (type === 'commissions') {
      setCommissions(commissions.filter(c => c.id !== id));
      if (editingCommission?.id === id) setEditingCommission(null);
    }
    if (type === 'expenses') {
      setTransactions(transactions.filter(t => t.id !== id));
      if (editingTransaction?.id === id) setEditingTransaction(null);
    }
    if (type === 'projects') {
      setProjects(projects.filter(p => p.id !== id));
      if (editingProject?.id === id) setEditingProject(null);
    }
  };

  // --- Components ---
  const SidebarItem = ({ tab, icon: Icon, label }: { tab: Tab, icon: any, label: string }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={cn(
        "flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200",
        activeTab === tab 
          ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
          : "text-slate-500 hover:bg-slate-800/40 hover:text-slate-200"
      )}
    >
      <Icon size={18} />
      <span className="font-medium text-sm">{label}</span>
    </button>
  );

  const MobileNavItem = ({ tab, icon: Icon, label }: { tab: Tab, icon: any, label: string }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={cn(
        "flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-all duration-200",
        activeTab === tab 
          ? "text-blue-400" 
          : "text-slate-500"
      )}
    >
      <Icon size={20} className={cn(activeTab === tab && "drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]")} />
      <span className="text-[10px] font-medium">{label}</span>
      {activeTab === tab && (
        <motion.div 
          layoutId="activeTab"
          className="absolute bottom-0 w-8 h-1 bg-blue-500 rounded-t-full"
        />
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col lg:flex-row font-sans text-slate-100 relative overflow-hidden">
      {/* Background Circuitry Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 10 L90 10 L90 90 L10 90 Z M10 50 L90 50 M50 10 L50 90' stroke='%233b82f6' stroke-width='0.5' fill='none'/%3E%3Ccircle cx='10' cy='10' r='1' fill='%233b82f6'/%3E%3Ccircle cx='90' cy='10' r='1' fill='%233b82f6'/%3E%3Ccircle cx='90' cy='90' r='1' fill='%233b82f6'/%3E%3Ccircle cx='10' cy='90' r='1' fill='%233b82f6'/%3E%3Ccircle cx='50' cy='50' r='1' fill='%233b82f6'/%3E%3C/svg%3E")`, backgroundSize: '150px 150px' }}></div>
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600/5 via-transparent to-purple-600/5 pointer-events-none"></div>

      {/* Mobile Top Header */}
      <div className="lg:hidden bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50 p-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-[0_0_8px_rgba(59,130,246,0.4)]">
            <TrendingUp size={16} />
          </div>
          <h1 className="text-base font-bold tracking-tight text-white">Dronetech</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-slate-800/40 rounded-lg border border-slate-700/50">
            <AlertCircle size={14} className="text-blue-400" />
          </div>
        </div>
      </div>

      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-56 bg-slate-950/40 backdrop-blur-2xl border-r border-slate-800/50 p-5 flex-col gap-6 sticky top-0 h-screen z-20">
        <div className="flex items-center gap-3 px-1">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-[0_0_10px_rgba(59,130,246,0.4)]">
            <TrendingUp size={20} />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-white">Dronetech</h1>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          <SidebarItem tab="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <SidebarItem tab="commissions" icon={DollarSign} label="Comissões" />
          <SidebarItem tab="expenses" icon={CreditCard} label="Financeiro" />
          <SidebarItem tab="projects" icon={Briefcase} label="Projetos" />
        </nav>

        <div className="p-3 bg-slate-800/30 rounded-xl border border-slate-700/50">
          <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <AlertCircle size={12} />
            <span>Status da Conta</span>
          </div>
          <p className="text-xs font-medium text-slate-300">Plano Premium Ativo</p>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800/50 flex items-center justify-around px-2 z-50 h-16 pb-safe">
        <MobileNavItem tab="dashboard" icon={LayoutDashboard} label="Dashboard" />
        <MobileNavItem tab="commissions" icon={DollarSign} label="Comissões" />
        <MobileNavItem tab="expenses" icon={CreditCard} label="Financeiro" />
        <MobileNavItem tab="projects" icon={Briefcase} label="Projetos" />
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 pb-24 lg:pb-6 overflow-y-auto relative z-10">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="max-w-full">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight capitalize text-white">
              {activeTab === 'dashboard' ? 'Visão Geral' : 
               activeTab === 'commissions' ? 'Gestão de Comissões' :
               activeTab === 'expenses' ? 'Controle Financeiro' : 'Meus Projetos'}
            </h2>
            <p className="text-slate-400 mt-0.5 text-[10px] md:text-xs leading-relaxed max-w-md">
              {activeTab === 'dashboard' ? 'Acompanhe o desempenho da Dronetech em tempo real.' : 
               activeTab === 'commissions' ? 'Previsibilidade de 90 dias para seus recebimentos.' :
               activeTab === 'expenses' ? 'Controle de receitas e despesas da Dronetech.' : 'Gerencie suas entregas e propostas comerciais.'}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <label className="cursor-pointer px-2 py-1.5 bg-slate-900/30 hover:bg-slate-800/50 text-slate-400 rounded-lg text-[9px] md:text-[10px] transition-colors border border-slate-700/50 flex items-center gap-1.5 backdrop-blur-md">
                <ArrowDownRight size={10} className="rotate-180" />
                Importar
                <input type="file" accept=".json" onChange={importData} className="hidden" />
              </label>
              <button 
                onClick={exportData}
                className="px-2 py-1.5 bg-slate-900/30 hover:bg-slate-800/50 text-slate-400 rounded-lg text-[9px] md:text-[10px] transition-colors border border-slate-700/50 flex items-center gap-1.5 backdrop-blur-md"
              >
                <ArrowUpRight size={10} />
                Exportar
              </button>
            </div>
            <div className="relative flex-1 md:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
              <input 
                type="text" 
                placeholder="Buscar..." 
                className="pl-8 pr-3 py-1.5 bg-slate-900/30 border border-slate-700/50 rounded-full text-[10px] md:text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all w-full md:w-48 backdrop-blur-md"
              />
            </div>
            <button className="p-1.5 bg-slate-900/30 border border-slate-700/50 rounded-full hover:bg-slate-800/50 transition-colors text-slate-300 backdrop-blur-md">
              <Filter size={14} />
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                <div className="bg-slate-900/20 backdrop-blur-sm p-4 md:p-5 rounded-2xl border border-slate-800/40 shadow-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                      <TrendingUp size={18} />
                    </div>
                    <span className="flex items-center gap-1 text-emerald-400 text-[9px] font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                      <ArrowUpRight size={10} />
                      Receitas
                    </span>
                  </div>
                  <h3 className="text-slate-400 text-[10px] md:text-xs font-medium">Receitas Totais</h3>
                  <p className="text-lg md:text-xl font-bold mt-0.5 text-emerald-400">R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>

                <div className="bg-slate-900/20 backdrop-blur-sm p-4 md:p-5 rounded-2xl border border-slate-800/40 shadow-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div className="p-2 bg-rose-500/10 text-rose-400 rounded-xl">
                      <TrendingDown size={18} />
                    </div>
                    <span className="flex items-center gap-1 text-rose-400 text-[9px] font-medium bg-rose-500/10 px-1.5 py-0.5 rounded-md">
                      <ArrowDownRight size={10} />
                      Despesas
                    </span>
                  </div>
                  <h3 className="text-slate-400 text-[10px] md:text-xs font-medium">Despesas Totais</h3>
                  <p className="text-lg md:text-xl font-bold mt-0.5 text-rose-400">R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>

                <div className="bg-slate-900/20 backdrop-blur-sm p-4 md:p-5 rounded-2xl border border-slate-800/40 shadow-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
                      <DollarSign size={18} />
                    </div>
                    <div className={cn(
                      "text-[9px] font-medium px-1.5 py-0.5 rounded-md",
                      (totalIncome - totalExpenses) >= 0 ? "text-emerald-400 bg-emerald-500/10" : "text-rose-400 bg-rose-500/10"
                    )}>
                      Saldo
                    </div>
                  </div>
                  <h3 className="text-slate-400 text-[10px] md:text-xs font-medium">Saldo em Caixa</h3>
                  <p className={cn(
                    "text-lg md:text-xl font-bold mt-0.5",
                    (totalIncome - totalExpenses) >= 0 ? "text-white" : "text-rose-400"
                  )}>
                    R$ {(totalIncome - totalExpenses).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-900/20 backdrop-blur-sm p-6 rounded-2xl border border-slate-800/40 shadow-lg">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-base text-white">Previsibilidade de Recebimento (90 dias)</h3>
                    <TrendingUp size={18} className="text-blue-400" />
                  </div>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyPredictability}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                        <Tooltip 
                          cursor={{ fill: '#1e293b' }}
                          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#f1f5f9', fontSize: '12px' }}
                          itemStyle={{ color: '#3b82f6' }}
                        />
                        <Bar dataKey="valor" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-slate-900/20 backdrop-blur-sm p-6 rounded-2xl border border-slate-800/40 shadow-lg">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-base text-white">Fontes de Receita</h3>
                    <PieChartIcon size={18} className="text-emerald-400" />
                  </div>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={incomeCategories}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {incomeCategories.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#f1f5f9', fontSize: '12px' }}
                        />
                        <Legend verticalAlign="bottom" height={36} wrapperStyle={{ color: '#94a3b8', fontSize: '10px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-slate-900/20 backdrop-blur-sm p-6 rounded-2xl border border-slate-800/40 shadow-lg lg:col-span-2">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-base text-white">Distribuição de Gastos</h3>
                    <PieChartIcon size={18} className="text-amber-400" />
                  </div>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expenseCategories}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {expenseCategories.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#f1f5f9', fontSize: '12px' }}
                        />
                        <Legend verticalAlign="bottom" height={36} wrapperStyle={{ color: '#94a3b8', fontSize: '10px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'commissions' && (
            <motion.div
              key="commissions"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Form */}
              <div className="lg:col-span-1">
                <div className="bg-slate-900/20 backdrop-blur-sm p-6 rounded-2xl border border-slate-800/40 shadow-lg sticky top-6">
                  <h3 className="font-bold text-base mb-5 flex items-center gap-2 text-white">
                    {editingCommission ? <Edit2 size={18} className="text-blue-400" /> : <Plus size={18} className="text-blue-400" />}
                    {editingCommission ? 'Editar Comissão' : 'Nova Comissão'}
                  </h3>
                  <form onSubmit={addCommission} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Empresa Parceira</label>
                      <input name="company" defaultValue={editingCommission?.company} key={editingCommission?.id} required className="w-full px-3.5 py-1.5 bg-slate-800/30 border border-slate-700/50 rounded-xl text-xs text-white focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all" placeholder="Ex: DJI Brasil" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Descrição</label>
                      <textarea name="description" defaultValue={editingCommission?.description} key={editingCommission?.id} className="w-full px-3.5 py-1.5 bg-slate-800/30 border border-slate-700/50 rounded-xl text-xs text-white focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all resize-none h-16" placeholder="Detalhes da comissão..." />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Valor da Comissão (R$)</label>
                      <input name="amount" type="number" step="0.01" defaultValue={editingCommission?.amount} key={editingCommission?.id} required className="w-full px-3.5 py-1.5 bg-slate-800/30 border border-slate-700/50 rounded-xl text-xs text-white focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all" placeholder="0,00" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Data de Lançamento</label>
                      <input name="launchDate" type="date" defaultValue={editingCommission?.launchDate} key={editingCommission?.id} required className="w-full px-3.5 py-1.5 bg-slate-800/30 border border-slate-700/50 rounded-xl text-xs text-white focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all" />
                    </div>
                    {editingCommission && (
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Status</label>
                        <select name="status" defaultValue={editingCommission.status} className="w-full px-3.5 py-1.5 bg-slate-800/30 border border-slate-700/50 rounded-xl text-xs text-white focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all">
                          <option value="pending" className="bg-slate-900 text-white">Pendente</option>
                          <option value="paid" className="bg-slate-900 text-white">Pago</option>
                        </select>
                      </div>
                    )}
                    <div className="p-3 bg-blue-500/5 rounded-xl border border-blue-500/10 flex items-start gap-2.5">
                      <Clock size={16} className="text-blue-400 mt-0.5" />
                      <p className="text-[10px] text-blue-300/80 leading-relaxed">
                        O pagamento será automaticamente calculado para <strong>90 dias</strong> após a data de lançamento.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {editingCommission && (
                        <button 
                          type="button" 
                          onClick={() => setEditingCommission(null)}
                          className="flex-1 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-700 transition-colors"
                        >
                          Cancelar
                        </button>
                      )}
                      <button type="submit" className="flex-[2] py-2.5 bg-blue-600/90 text-white rounded-xl text-sm font-bold hover:bg-blue-600 transition-colors shadow-md">
                        {editingCommission ? 'Salvar Alterações' : 'Adicionar Comissão'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* List */}
              <div className="lg:col-span-2 space-y-3">
                <div className="flex flex-col sm:flex-row gap-3 mb-5">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input 
                      type="text" 
                      placeholder="Filtrar por empresa parceira..." 
                      value={searchPartner}
                      onChange={(e) => setSearchPartner(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-900/20 backdrop-blur-sm border border-slate-800/40 rounded-xl text-xs text-white focus:ring-1 focus:ring-blue-500/50 outline-none transition-all"
                    />
                  </div>
                  <button 
                    onClick={handlePrintExtrato}
                    className="flex items-center justify-center gap-2 px-5 py-2 bg-slate-800/40 hover:bg-slate-800/60 text-slate-300 rounded-xl border border-slate-700/50 transition-all group text-xs"
                  >
                    <Printer size={16} className="text-blue-400 group-hover:scale-110 transition-transform" />
                    <span>Gerar Extrato</span>
                  </button>
                </div>

                {commissions.length === 0 ? (
                  <div className="bg-slate-900/20 backdrop-blur-sm p-10 rounded-2xl border border-dashed border-slate-700/50 flex flex-col items-center justify-center text-slate-500">
                    <DollarSign size={40} className="mb-3 opacity-20" />
                    <p className="text-sm">Nenhuma comissão registrada ainda.</p>
                  </div>
                ) : (
                  commissions
                    .filter(c => c.company.toLowerCase().includes(searchPartner.toLowerCase()))
                    .sort((a, b) => parseISO(a.paymentDate).getTime() - parseISO(b.paymentDate).getTime())
                    .map(c => (
                    <div key={c.id} className="bg-slate-900/20 backdrop-blur-sm p-4 md:p-5 rounded-2xl border border-slate-800/40 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group hover:border-blue-500/30 transition-all">
                      <div className="flex items-center gap-3.5 w-full sm:w-auto">
                        <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0">
                          {c.company.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-sm text-white break-words">{c.company}</h4>
                          {c.description && <p className="text-[10px] text-slate-500 mt-0.5 italic break-words">{c.description}</p>}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400 mt-1">
                            <span className="flex items-center gap-1">
                              <CalendarIcon size={12} />
                              {format(parseISO(c.launchDate), 'dd/MM/yyyy')}
                            </span>
                            <span className="flex items-center gap-1 font-medium text-blue-400/80">
                              <Clock size={12} />
                              {format(parseISO(c.paymentDate), 'dd/MM/yyyy')}
                            </span>
                          </div>
                        </div>
                      </div>
                        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto border-t sm:border-0 border-slate-800/50 pt-3 sm:pt-0">
                          <div className="text-left sm:text-right mr-3">
                            <p className="text-sm md:text-base font-bold text-white">R$ {c.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            <span className={cn(
                              "text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full border inline-block",
                              c.status === 'pending' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            )}>
                              {c.status === 'pending' ? 'Pendente' : 'Pago'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {c.status === 'pending' && (
                              <button 
                                onClick={() => {
                                  setCommissions(commissions.map(item => item.id === c.id ? { ...item, status: 'paid' } : item));
                                }}
                                className="p-1.5 text-slate-600 hover:text-emerald-400 transition-colors sm:opacity-0 group-hover:opacity-100"
                                title="Confirmar Recebimento"
                              >
                                <CheckCircle size={16} />
                              </button>
                            )}
                            <button 
                              onClick={() => setEditingCommission(c)}
                              className="p-1.5 text-slate-600 hover:text-blue-400 transition-colors sm:opacity-0 group-hover:opacity-100"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => deleteItem('commissions', c.id)}
                              className="p-1.5 text-slate-600 hover:text-red-400/80 transition-colors sm:opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'expenses' && (
            <motion.div
              key="expenses"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Form */}
              <div className="lg:col-span-1">
                <div className="bg-slate-900/20 backdrop-blur-sm p-6 rounded-2xl border border-slate-800/40 shadow-lg sticky top-6">
                  <h3 className="font-bold text-base mb-5 flex items-center gap-2 text-white">
                    {editingTransaction ? <Edit2 size={18} className="text-amber-400" /> : <Plus size={18} className="text-amber-400" />}
                    {editingTransaction ? 'Editar Lançamento' : 'Novo Lançamento'}
                  </h3>
                  <form onSubmit={addTransaction} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Tipo de Lançamento</label>
                      <select 
                        name="kind" 
                        defaultValue={editingTransaction?.kind || 'expense'}
                        key={editingTransaction?.id}
                        required 
                        className="w-full px-3.5 py-1.5 bg-slate-800/30 border border-slate-700/50 rounded-xl text-xs text-white focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50 outline-none transition-all"
                        onChange={(e) => {
                          const categorySelect = e.currentTarget.form?.elements.namedItem('category') as HTMLSelectElement;
                          if (categorySelect) {
                            categorySelect.innerHTML = '';
                            const options = e.target.value === 'income' 
                              ? ['3M', 'Dronetech', 'Outros']
                              : ['Carro', 'Lazer', 'Casa', 'Saude', 'Pessoal', 'Investimento', 'Empresa', 'Estudo'];
                            options.forEach(opt => {
                              const option = document.createElement('option');
                              option.value = opt;
                              option.text = opt;
                              option.className = "bg-slate-900 text-white";
                              categorySelect.add(option);
                            });
                          }
                        }}
                      >
                        <option value="expense" className="bg-slate-900 text-white">Despesa</option>
                        <option value="income" className="bg-slate-900 text-white">Receita</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Descrição</label>
                      <input name="description" defaultValue={editingTransaction?.description} key={editingTransaction?.id} required className="w-full px-3.5 py-1.5 bg-slate-800/30 border border-slate-700/50 rounded-xl text-xs text-white focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50 outline-none transition-all" placeholder="Ex: Aluguel Escritório, Venda Drone..." />
                    </div>
                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Valor (R$)</label>
                        <input name="amount" type="number" step="0.01" defaultValue={editingTransaction?.amount} key={editingTransaction?.id} required className="w-full px-3.5 py-1.5 bg-slate-800/30 border border-slate-700/50 rounded-xl text-xs text-white focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50 outline-none transition-all" placeholder="0,00" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Data</label>
                        <input name="date" type="date" defaultValue={editingTransaction?.date} key={editingTransaction?.id} required className="w-full px-3.5 py-1.5 bg-slate-800/30 border border-slate-700/50 rounded-xl text-xs text-white focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50 outline-none transition-all" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Categoria / Fonte</label>
                      <select name="category" defaultValue={editingTransaction?.category} key={editingTransaction?.id} required className="w-full px-3.5 py-1.5 bg-slate-800/30 border border-slate-700/50 rounded-xl text-xs text-white focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50 outline-none transition-all">
                        {(editingTransaction?.kind === 'income' || (!editingTransaction && false)) ? (
                          <>
                            <option value="3M" className="bg-slate-900 text-white">3M</option>
                            <option value="Dronetech" className="bg-slate-900 text-white">Dronetech</option>
                            <option value="Outros" className="bg-slate-900 text-white">Outros</option>
                          </>
                        ) : (
                          <>
                            <option value="Carro" className="bg-slate-900 text-white">Carro</option>
                            <option value="Lazer" className="bg-slate-900 text-white">Lazer</option>
                            <option value="Casa" className="bg-slate-900 text-white">Casa</option>
                            <option value="Saude" className="bg-slate-900 text-white">Saude</option>
                            <option value="Pessoal" className="bg-slate-900 text-white">Pessoal</option>
                            <option value="Investimento" className="bg-slate-900 text-white">Investimento</option>
                            <option value="Empresa" className="bg-slate-900 text-white">Empresa</option>
                            <option value="Estudo" className="bg-slate-900 text-white">Estudo</option>
                          </>
                        )}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Classificação</label>
                      <div className="grid grid-cols-2 gap-2">
                        <label className="flex items-center justify-center gap-2 p-2.5 border border-slate-700/50 rounded-xl cursor-pointer hover:bg-slate-800/30 transition-all has-[:checked]:bg-amber-500/10 has-[:checked]:border-amber-500/30 has-[:checked]:text-amber-400">
                          <input type="radio" name="type" value="personal" defaultChecked={!editingTransaction || editingTransaction.type === 'personal'} key={editingTransaction?.id + 'p'} className="hidden" />
                          <span className="text-xs font-bold">Pessoal</span>
                        </label>
                        <label className="flex items-center justify-center gap-2 p-2.5 border border-slate-700/50 rounded-xl cursor-pointer hover:bg-slate-800/30 transition-all has-[:checked]:bg-blue-500/10 has-[:checked]:border-blue-500/30 has-[:checked]:text-blue-400">
                          <input type="radio" name="type" value="business" defaultChecked={editingTransaction?.type === 'business'} key={editingTransaction?.id + 'b'} className="hidden" />
                          <span className="text-xs font-bold">Empresa</span>
                        </label>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {editingTransaction && (
                        <button 
                          type="button" 
                          onClick={() => setEditingTransaction(null)}
                          className="flex-1 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-700 transition-colors"
                        >
                          Cancelar
                        </button>
                      )}
                      <button type="submit" className="flex-[2] py-2.5 bg-amber-600/90 text-white rounded-xl text-sm font-bold hover:bg-amber-600 transition-colors shadow-md">
                        {editingTransaction ? 'Salvar Alterações' : 'Confirmar Lançamento'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* List */}
              <div className="lg:col-span-2 space-y-3">
                {transactions.length === 0 ? (
                  <div className="bg-slate-900/20 backdrop-blur-sm p-10 rounded-2xl border border-dashed border-slate-700/50 flex flex-col items-center justify-center text-slate-500">
                    <CreditCard size={40} className="mb-3 opacity-20" />
                    <p className="text-sm">Nenhum lançamento registrado ainda.</p>
                  </div>
                ) : (
                  transactions.sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()).map(t => (
                    <div key={t.id} className="bg-slate-900/20 backdrop-blur-sm p-4 md:p-5 rounded-2xl border border-slate-800/40 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group hover:border-amber-500/30 transition-all">
                      <div className="flex items-center gap-3.5 w-full sm:w-auto">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold border flex-shrink-0",
                          t.kind === 'income' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        )}>
                          {t.kind === 'income' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-sm text-white break-words">{t.description}</h4>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400 mt-1">
                            <span className={cn(
                              "px-1.5 py-0.5 rounded-md text-[9px] font-medium border",
                              t.kind === 'income' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-slate-800/50 text-slate-400 border-slate-700/50"
                            )}>
                              {t.category}
                            </span>
                            <span className="flex items-center gap-1">
                              <CalendarIcon size={12} />
                              {format(parseISO(t.date), 'dd/MM/yyyy')}
                            </span>
                            <span className="bg-slate-800/50 px-1.5 py-0.5 rounded-md text-[9px] font-medium border border-slate-700/50">
                              {t.type === 'personal' ? 'Pessoal' : 'Empresa'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto border-t sm:border-0 border-slate-800/50 pt-3 sm:pt-0">
                        <p className={cn(
                          "text-sm md:text-base font-bold mr-3",
                          t.kind === 'income' ? "text-emerald-400" : "text-rose-400"
                        )}>
                          {t.kind === 'income' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => setEditingTransaction(t)}
                            className="p-1.5 text-slate-600 hover:text-blue-400 transition-colors sm:opacity-0 group-hover:opacity-100"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => deleteItem('expenses', t.id)}
                            className="p-1.5 text-slate-600 hover:text-red-400/80 transition-colors sm:opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'projects' && (
            <motion.div
              key="projects"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Form */}
              <div className="lg:col-span-1">
                <div className="bg-slate-900/20 backdrop-blur-sm p-6 rounded-2xl border border-slate-800/40 shadow-lg sticky top-6">
                  <h3 className="font-bold text-base mb-5 flex items-center gap-2 text-white">
                    {editingProject ? <Edit2 size={18} className="text-emerald-400" /> : <Plus size={18} className="text-emerald-400" />}
                    {editingProject ? 'Editar Projeto' : 'Novo Projeto'}
                  </h3>
                  <form onSubmit={addProject} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Cliente</label>
                      <input name="client" defaultValue={editingProject?.client} key={editingProject?.id} required className="w-full px-3.5 py-1.5 bg-slate-800/30 border border-slate-700/50 rounded-xl text-xs text-white focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 outline-none transition-all" placeholder="Nome do Cliente" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Título do Projeto</label>
                      <input name="title" defaultValue={editingProject?.title} key={editingProject?.id} required className="w-full px-3.5 py-1.5 bg-slate-800/30 border border-slate-700/50 rounded-xl text-xs text-white focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 outline-none transition-all" placeholder="Ex: Mapeamento Fazenda X" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Descrição</label>
                      <textarea name="description" defaultValue={editingProject?.description} key={editingProject?.id} rows={3} className="w-full px-3.5 py-1.5 bg-slate-800/30 border border-slate-700/50 rounded-xl text-xs text-white focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 outline-none transition-all resize-none" placeholder="Detalhes do serviço..." />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Prazo de Entrega</label>
                      <input name="deadline" type="date" defaultValue={editingProject?.deadline} key={editingProject?.id} required className="w-full px-3.5 py-1.5 bg-slate-800/30 border border-slate-700/50 rounded-xl text-xs text-white focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 outline-none transition-all" />
                    </div>
                    <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10 flex items-start gap-2.5">
                      <AlertCircle size={16} className="text-emerald-400 mt-0.5" />
                      <p className="text-[10px] text-emerald-300/80 leading-relaxed">
                        Os valores financeiros só serão exibidos após a <strong>aprovação da proposta</strong>.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {editingProject && (
                        <button 
                          type="button" 
                          onClick={() => setEditingProject(null)}
                          className="flex-1 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-700 transition-colors"
                        >
                          Cancelar
                        </button>
                      )}
                      <button type="submit" className="flex-[2] py-2.5 bg-emerald-600/90 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-colors shadow-md">
                        {editingProject ? 'Salvar Alterações' : 'Criar Proposta'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* List */}
              <div className="lg:col-span-2 space-y-5">
                {projects.length === 0 ? (
                  <div className="bg-slate-900/20 backdrop-blur-sm p-10 rounded-2xl border border-dashed border-slate-700/50 flex flex-col items-center justify-center text-slate-500">
                    <Briefcase size={40} className="mb-3 opacity-20" />
                    <p className="text-sm">Nenhum projeto registrado ainda.</p>
                  </div>
                ) : (
                  projects.sort((a, b) => parseISO(a.deadline).getTime() - parseISO(b.deadline).getTime()).map(p => (
                    <div key={p.id} className="bg-slate-900/20 backdrop-blur-sm p-5 md:p-6 rounded-2xl border border-slate-800/40 shadow-lg group hover:border-emerald-500/30 transition-all">
                      <div className="flex justify-between items-start mb-3 gap-4">
                        <div className="min-w-0 flex-1">
                          <span className={cn(
                            "text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full border inline-block",
                            p.status === 'proposal' ? "bg-slate-800/50 text-slate-400 border-slate-700/50" : 
                            p.status === 'approved' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          )}>
                            {p.status === 'proposal' ? 'Proposta Enviada' : 
                             p.status === 'approved' ? 'Aprovado / Em Execução' : 'Entregue'}
                          </span>
                          <h4 className="text-base md:text-lg font-bold mt-1.5 text-white break-words">{p.title}</h4>
                          <p className="text-slate-400 text-xs mt-0.5">Cliente: <span className="font-semibold text-slate-300">{p.client}</span></p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button 
                            onClick={() => setEditingProject(p)}
                            className="p-1.5 text-slate-600 hover:text-blue-400 transition-colors sm:opacity-0 group-hover:opacity-100"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => deleteItem('projects', p.id)}
                            className="p-1.5 text-slate-600 hover:text-red-400/80 transition-colors sm:opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-slate-400 text-xs leading-relaxed mb-5 break-words">
                        {p.description || 'Sem descrição adicional.'}
                      </p>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-slate-800/40">
                        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <CalendarIcon size={14} />
                            <span>Prazo: {format(parseISO(p.deadline), 'dd/MM/yyyy')}</span>
                          </div>
                          {p.status !== 'proposal' && (
                            <div className="flex items-center gap-1.5 text-sm md:text-base font-bold text-emerald-400">
                              <DollarSign size={16} />
                              <span>R$ {p.value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                          )}
                        </div>

                        {p.status === 'proposal' ? (
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <input 
                              id={`val-${p.id}`}
                              type="number" 
                              placeholder="Valor R$" 
                              className="flex-1 sm:w-28 px-2.5 py-1.5 bg-slate-800/30 border border-slate-700/50 rounded-xl text-xs text-white focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 outline-none"
                            />
                            <button 
                              onClick={() => {
                                const input = document.getElementById(`val-${p.id}`) as HTMLInputElement;
                                if (input.value) approveProject(p.id, Number(input.value));
                              }}
                              className="px-3.5 py-1.5 bg-emerald-600/90 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-colors flex items-center gap-1.5 shadow-md flex-shrink-0"
                            >
                              <CheckCircle size={14} />
                              Aprovar
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                            <CheckCircle size={16} />
                            Proposta Aprovada
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
