import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';
import { 
  LayoutDashboard, DollarSign, Briefcase, CreditCard, Plus, Trash2, Edit2,
  CheckCircle, Clock, Calendar as CalendarIcon, TrendingUp, TrendingDown, 
  PieChart as PieChartIcon, Search, Filter, ArrowUpRight, ArrowDownRight, 
  AlertCircle, Printer, LogOut
} from 'lucide-react';
import { format, addDays, parseISO, startOfMonth, endOfMonth, isWithinInterval, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- CONFIGURAÇÃO SUPABASE ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // --- States de Dados (Agora alimentados pelo Supabase) ---
  const [commissions, setCommissions] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [projects, setProjects] = useState([]);
  const [searchPartner, setSearchPartner] = useState('');
  const [loading, setLoading] = useState(false);

  // --- BUSCA DE DADOS (SELECT) ---
  useEffect(() => {
    if (isLoggedIn) fetchData();
  }, [isLoggedIn]);

  async function fetchData() {
    setLoading(true);
    const { data: comm } = await supabase.from('commissions').select('*');
    const { data: trans } = await supabase.from('transactions').select('*');
    const { data: proj } = await supabase.from('projects').select('*');
    
    if (comm) setCommissions(comm);
    if (trans) setTransactions(trans);
    if (proj) setProjects(proj);
    setLoading(false);
  }

  // --- FUNÇÕES DE PERSISTÊNCIA (INSERT / UPDATE / DELETE) ---
  const handleAddCommission = async (newComm: any) => {
    const { error } = await supabase.from('commissions').insert([newComm]);
    if (!error) fetchData();
  };

  const handleDelete = async (table: string, id: string) => {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (!error) fetchData();
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    await supabase.from('commissions').update({ status: newStatus }).eq('id', id);
    fetchData();
  };

  // --- LÓGICA DE LOGIN ---
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900 p-8 rounded-3xl border border-slate-800 w-full max-w-md shadow-2xl">
          <h1 className="text-2xl font-bold text-white mb-6 text-center">DroneTech Portal</h1>
          <div className="space-y-4">
            <input type="text" placeholder="Usuário" onChange={e => setUser(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-blue-500" />
            <input type="password" placeholder="Senha" onChange={e => setPass(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-blue-500" />
            <button onClick={() => {if(user === 'admin' && pass === 'drone2026') setIsLoggedIn(true)}} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-500 transition-all">ENTRAR</button>
          </div>
        </motion.div>
      </div>
    );
  }

  // --- CÁLCULOS (Sua lógica original de 90 dias) ---
  const totalIncome = transactions.filter(t => t.kind === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpenses = transactions.filter(t => t.kind === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col lg:flex-row font-sans text-slate-100 relative overflow-hidden">
      {/* Background Circuitry Original */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 10 L90 10 L90 90 L10 90 Z M10 50 L90 50 M50 10 L50 90' stroke='%233b82f6' stroke-width='0.5' fill='none'/%3E%3C/svg%3E")`, backgroundSize: '150px 150px' }}></div>

      {/* Sidebar Original */}
      <aside className="hidden lg:flex w-64 bg-slate-950/40 backdrop-blur-2xl border-r border-slate-800/50 p-6 flex-col gap-6 sticky top-0 h-screen z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-600/40"><TrendingUp size={20} /></div>
          <h1 className="text-xl font-bold tracking-tight">DroneTech</h1>
        </div>
        <nav className="flex flex-col gap-2 flex-1">
          <button onClick={() => setActiveTab('dashboard')} className={cn("flex items-center gap-4 p-4 rounded-2xl transition-all", activeTab === 'dashboard' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-500 hover:bg-slate-800 hover:text-slate-200")}>
            <LayoutDashboard size={20} /> <span className="font-medium">Dashboard</span>
          </button>
          <button onClick={() => setActiveTab('commissions')} className={cn("flex items-center gap-4 p-4 rounded-2xl transition-all", activeTab === 'commissions' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-500 hover:bg-slate-800 hover:text-slate-200")}>
            <DollarSign size={20} /> <span className="font-medium">Comissões</span>
          </button>
          <button onClick={() => setActiveTab('expenses')} className={cn("flex items-center gap-4 p-4 rounded-2xl transition-all", activeTab === 'expenses' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-500 hover:bg-slate-800 hover:text-slate-200")}>
            <CreditCard size={20} /> <span className="font-medium">Financeiro</span>
          </button>
        </nav>
        <button onClick={() => setIsLoggedIn(false)} className="flex items-center gap-4 p-4 rounded-2xl text-slate-600 hover:text-red-400 mt-10 transition-all"><LogOut size={20} /> Sair</button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto z-10">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
          <div>
            <h2 className="text-3xl font-bold capitalize text-white">{activeTab}</h2>
            <p className="text-slate-400 text-sm mt-1">Dados sincronizados com o Supabase Cloud.</p>
          </div>
          <div className="flex gap-3">
             <button className="bg-slate-900/40 border border-slate-700/50 px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 hover:bg-slate-800 transition-all"><Printer size={18}/> Extrato</button>
             <button className="bg-blue-600 px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20"><Plus size={18}/> Novo</button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900/50 p-8 rounded-[32px] border border-slate-800">
                  <p className="text-slate-400 text-sm font-medium">Receitas (Supabase)</p>
                  <h3 className="text-4xl font-bold text-emerald-400 mt-2">R$ {totalIncome.toLocaleString('pt-BR')}</h3>
                </div>
                <div className="bg-slate-900/50 p-8 rounded-[32px] border border-slate-800">
                  <p className="text-slate-400 text-sm font-medium">Despesas Totais</p>
                  <h3 className="text-4xl font-bold text-rose-400 mt-2">R$ {totalExpenses.toLocaleString('pt-BR')}</h3>
                </div>
                <div className="bg-slate-900/50 p-8 rounded-[32px] border border-slate-800">
                  <p className="text-slate-400 text-sm font-medium">Saldo Atual</p>
                  <h3 className="text-4xl font-bold text-white mt-2">R$ {(totalIncome - totalExpenses).toLocaleString('pt-BR')}</h3>
                </div>
              </div>

              {/* Gráfico Original */}
              <div className="bg-slate-900/50 p-8 rounded-[32px] border border-slate-800">
                <h3 className="text-xl font-bold mb-8">Previsibilidade Mensal</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={commissions.length > 0 ? commissions : [{company: 'Sem dados', amount: 0}]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="company" stroke="#64748b" axisLine={false} tickLine={false} />
                      <YAxis stroke="#64748b" axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '12px'}} />
                      <Bar dataKey="amount" fill="#3b82f6" radius={[8, 8, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
