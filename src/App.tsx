import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell
} from 'recharts';
import { 
  LayoutDashboard, DollarSign, Briefcase, CreditCard, Plus, Trash2, Edit2,
  CheckCircle, Clock, Calendar as CalendarIcon, TrendingUp, TrendingDown,
  PieChart as PieChartIcon, Search, Filter, ArrowUpRight, ArrowDownRight,
  AlertCircle, Printer, LogOut
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- DEFINIÇÕES DE TIPOS (Para evitar erro de importação) ---
interface Project {
  id: string;
  title: string;
  client: string;
  deadline: string;
  status: string;
}

interface Commission {
  id: string;
  amount: number;
  status: 'pending' | 'paid';
}

type Tab = 'dashboard' | 'projects';

// --- CONFIGURAÇÃO SUPABASE ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  // --- Estados ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Busca de Dados ---
  useEffect(() => {
    if (isLoggedIn) {
      fetchData();
    }
  }, [isLoggedIn]);

  async function fetchData() {
    setLoading(true);
    try {
      const { data: proj } = await supabase.from('projects').select('*');
      const { data: comm } = await supabase.from('commissions').select('*');
      if (proj) setProjects(proj);
      if (comm) setCommissions(comm);
    } catch (err) {
      console.error("Erro ao buscar dados:", err);
    }
    setLoading(false);
  }

  // --- Login ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (user === 'admin' && pass === 'drone2026') {
      setIsLoggedIn(true);
    } else {
      alert('Acesso negado!');
    }
  };

  // --- Adicionar Projeto ---
  const addProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newProject = {
      title: formData.get('title') as string,
      client: formData.get('client') as string,
      deadline: formData.get('deadline') as string,
      status: 'proposal'
    };

    const { data, error } = await supabase.from('projects').insert([newProject]).select();
    if (!error && data) {
      setProjects([...projects, data[0]]);
      e.currentTarget.reset();
    }
  };

  // --- Cálculos ---
  const totalReceivables = useMemo(() => 
    commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + (Number(c.amount) || 0), 0)
  , [commissions]);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-slate-900 p-8 rounded-3xl border border-slate-800 w-full max-w-md shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-4">
              <TrendingUp size={32} />
            </div>
            <h1 className="text-2xl font-bold text-white">DroneTech Portal</h1>
            <p className="text-slate-400 text-sm">Acesso Restrito</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="text" placeholder="Usuário" onChange={e => setUser(e.target.value)} className="w-full bg-slate-800 border-slate-700 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-blue-500" />
            <input type="password" placeholder="Senha" onChange={e => setPass(e.target.value)} className="w-full bg-slate-800 border-slate-700 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-blue-500" />
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all">ENTRAR</button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row font-sans">
      <aside className="hidden lg:flex w-64 bg-slate-900/50 border-r border-slate-800 p-6 flex-col gap-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white"><TrendingUp size={20} /></div>
          <h1 className="font-bold text-xl">Dronetech</h1>
        </div>
        <nav className="flex flex-col gap-2">
          <button onClick={() => setActiveTab('dashboard')} className={cn("flex items-center gap-3 p-3 rounded-xl transition-all", activeTab === 'dashboard' ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800")}>
            <LayoutDashboard size={20} /> Dashboard
          </button>
          <button onClick={() => setActiveTab('projects')} className={cn("flex items-center gap-3 p-3 rounded-xl transition-all", activeTab === 'projects' ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800")}>
            <Briefcase size={20} /> Projetos
          </button>
          <button onClick={() => setIsLoggedIn(false)} className="flex items-center gap-3 p-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 mt-auto">
            <LogOut size={20} /> Sair
          </button>
        </nav>
      </aside>

      <main className="flex-1 p-6 md:p-10 pb-24 lg:pb-10">
        {activeTab === 'dashboard' ? (
          <div className="space-y-8">
            <header>
              <h2 className="text-3xl font-bold">Visão Geral</h2>
              <p className="text-slate-400">Dados sincronizados em tempo real.</p>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
                <p className="text-slate-400 text-sm">A Receber</p>
                <p className="text-2xl font-bold text-blue-400">R$ {totalReceivables.toLocaleString('pt-BR')}</p>
              </div>
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
                <p className="text-slate-400 text-sm">Projetos Ativos</p>
                <p className="text-2xl font-bold text-emerald-400">{projects.length}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">Projetos</h2>
            <form onSubmit={addProject} className="bg-slate-900 p-6 rounded-2xl border border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
               <input name="title" placeholder="Título do Projeto" required className="bg-slate-800 border-none rounded-lg p-3 text-white" />
               <input name="client" placeholder="Cliente" required className="bg-slate-800 border-none rounded-lg p-3 text-white" />
               <input name="deadline" type="date" required className="bg-slate-800 border-none rounded-lg p-3 text-white text-slate-400" />
               <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg p-3 transition-colors">Criar Projeto</button>
            </form>

            <div className="grid gap-4 mt-8">
              {projects.map(p => (
                <div key={p.id} className="bg-slate-900 p-5 rounded-xl border border-slate-800 flex justify-between items-center hover:border-slate-700 transition-all">
                  <div>
                    <h4 className="font-bold text-white">{p.title}</h4>
                    <p className="text-xs text-slate-500">{p.client} • Prazo: {p.deadline}</p>
                  </div>
                  <span className="text-[10px] bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full border border-blue-500/20 uppercase font-bold tracking-wider">
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Nav Mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 flex justify-around p-5 z-50">
         <button onClick={() => setActiveTab('dashboard')} className={activeTab === 'dashboard' ? "text-blue-400" : "text-slate-500"}><LayoutDashboard /></button>
         <button onClick={() => setActiveTab('projects')} className={activeTab === 'projects' ? "text-blue-400" : "text-slate-500"}><Briefcase /></button>
         <button onClick={() => setIsLoggedIn(false)} className="text-slate-500"><LogOut /></button>
      </nav>
    </div>
  );
}
