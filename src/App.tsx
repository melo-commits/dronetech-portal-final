import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell
} from 'recharts';
import { 
  LayoutDashboard, DollarSign, Briefcase, CreditCard, Plus, Trash2,
  TrendingUp, TrendingDown, PieChart as PieChartIcon, LogOut,
  Clock, CheckCircle, AlertCircle
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- 1. DEFINIÇÕES DE TIPOS (Interfaces) ---
export interface Commission {
  id: string;
  company: string;
  description?: string;
  amount: number;
  launchDate: string;
  paymentDate: string;
  status: 'pending' | 'paid';
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  type: 'personal' | 'business';
  kind: 'income' | 'expense';
}

export interface Project {
  id: string;
  client: string;
  title: string;
  description: string;
  status: 'proposal' | 'approved' | 'delivered';
  value?: number;
  deadline: string;
}

export type Tab = 'dashboard' | 'commissions' | 'expenses' | 'projects';

// --- 2. CONFIGURAÇÃO SUPABASE ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Utilitário para classes Tailwind
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  // --- Estados do Sistema ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  
  // --- Estados de Dados ---
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Busca de Dados (Real-time ready) ---
  useEffect(() => {
    if (isLoggedIn) fetchData();
  }, [isLoggedIn]);

  async function fetchData() {
    setLoading(true);
    try {
      const { data: proj } = await supabase.from('projects').select('*').order('deadline', { ascending: true });
      const { data: comm } = await supabase.from('commissions').select('*').order('paymentDate', { ascending: true });
      
      if (proj) setProjects(proj);
      if (comm) setCommissions(comm);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
    setLoading(false);
  }

  // --- Lógica de Login ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (user === 'admin' && pass === 'drone2026') {
      setIsLoggedIn(true);
    } else {
      alert('Credenciais Inválidas!');
    }
  };

  // --- Cálculos Financeiros (Dashboard) ---
  const stats = useMemo(() => {
    const totalPending = commissions
      .filter(c => c.status === 'pending')
      .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
    
    const activeProjects = projects.filter(p => p.status !== 'delivered').length;
    
    return { totalPending, activeProjects };
  }, [commissions, projects]);

  // --- TELA DE LOGIN ---
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900 p-8 rounded-3xl border border-slate-800 w-full max-w-md shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-blue-600/20">
              <TrendingUp size={32} />
            </div>
            <h1 className="text-2xl font-bold text-white">DroneTech Portal</h1>
            <p className="text-slate-400 text-sm mt-1">Gestão de Projetos & Comissões</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="text" placeholder="Usuário" onChange={e => setUser(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
            <input type="password" placeholder="Senha" onChange={e => setPass(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20">ENTRAR</button>
          </form>
        </motion.div>
      </div>
    );
  }

  // --- DASHBOARD PRINCIPAL ---
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row font-sans">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-72 bg-slate-900/50 border-r border-slate-800 p-8 flex-col gap-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20"><TrendingUp size={24} /></div>
          <span className="font-bold text-xl tracking-tight">DroneTech</span>
        </div>
        
        <nav className="flex flex-col gap-3">
          {(['dashboard', 'commissions', 'projects'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={cn("flex items-center gap-4 p-4 rounded-2xl font-medium transition-all", activeTab === tab ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-400 hover:bg-slate-800 hover:text-white")}>
              {tab === 'dashboard' && <LayoutDashboard size={20} />}
              {tab === 'commissions' && <DollarSign size={20} />}
              {tab === 'projects' && <Briefcase size={20} />}
              <span className="capitalize">{tab}</span>
            </button>
          ))}
          <button onClick={() => setIsLoggedIn(false)} className="flex items-center gap-4 p-4 rounded-2xl text-slate-500 hover:bg-red-500/10 hover:text-red-400 mt-10 transition-all">
            <LogOut size={20} /> Sair
          </button>
        </nav>
      </aside>

      {/* Conteúdo */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
            
            {activeTab === 'dashboard' && (
              <div className="space-y-10">
                <header>
                  <h2 className="text-4xl font-bold">Olá, DroneTech 👋</h2>
                  <p className="text-slate-400 mt-2">Aqui está o resumo da sua operação hoje.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 hover:border-blue-500/50 transition-all group">
                    <p className="text-slate-400 text-sm font-medium mb-2">A Receber (Comissões)</p>
                    <p className="text-3xl font-bold text-blue-400 group-hover:scale-105 transition-transform origin-left">
                      R$ {stats.totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 hover:border-emerald-500/50 transition-all group">
                    <p className="text-slate-400 text-sm font-medium mb-2">Projetos em Andamento</p>
                    <p className="text-3xl font-bold text-emerald-400 group-hover:scale-105 transition-transform origin-left">
                      {stats.activeProjects} Ativos
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'projects' && (
              <div className="space-y-8">
                <div className="flex justify-between items-end">
                  <h2 className="text-3xl font-bold">Projetos</h2>
                  <span className="text-slate-500 text-sm">{projects.length} totais</span>
                </div>
                
                <div className="grid gap-4">
                  {projects.map(p => (
                    <div key={p.id} className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-800/50 transition-all">
                      <div>
                        <h4 className="font-bold text-lg text-white">{p.title}</h4>
                        <p className="text-sm text-slate-400">{p.client} • Prazo: {p.deadline}</p>
                      </div>
                      <div className={cn("px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest border", 
                        p.status === 'delivered' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                      )}>
                        {p.status}
                      </div>
                    </div>
                  ))}
                  {projects.length === 0 && <p className="text-slate-500 italic">Nenhum projeto encontrado no banco.</p>}
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </main>

      {/* Navegação Mobile */}
      <nav className="lg:hidden fixed bottom-6 left-6 right-6 bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl flex justify-around p-4 shadow-2xl z-50">
        <button onClick={() => setActiveTab('dashboard')} className={cn("p-2", activeTab === 'dashboard' ? "text-blue-400" : "text-slate-500")}><LayoutDashboard /></button>
        <button onClick={() => setActiveTab('projects')} className={cn("p-2", activeTab === 'projects' ? "text-blue-400" : "text-slate-500")}><Briefcase /></button>
        <button onClick={() => setIsLoggedIn(false)} className="p-2 text-slate-500"><LogOut /></button>
      </nav>
    </div>
  );
}
