import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  LayoutDashboard, DollarSign, Briefcase, CreditCard, Plus, Trash2,
  TrendingUp, TrendingDown, Search, Filter, ArrowUpRight, ArrowDownRight, 
  LogOut, Printer, Clock, CheckCircle, Calendar as CalendarIcon
} from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion'; // Corrigido aqui

// --- CONFIGURAÇÃO SUPABASE ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [commissions, setCommissions] = useState([]);
  const [projects, setProjects] = useState([]);
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');

  // --- BUSCA DE DADOS (Substituindo LocalStorage por Supabase) ---
  useEffect(() => {
    if (isLoggedIn) fetchData();
  }, [isLoggedIn]);

  async function fetchData() {
    const { data: comm } = await supabase.from('commissions').select('*');
    const { data: proj } = await supabase.from('projects').select('*');
    if (comm) setCommissions(comm);
    if (proj) setProjects(proj);
  }

  // --- CÁLCULOS (Sua lógica original de 90 dias) ---
  const monthlyPredictability = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => addMonths(new Date(), i));
    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      const total = commissions
        .filter(c => c.status === 'pending' && isWithinInterval(parseISO(c.paymentDate), { start: monthStart, end: monthEnd }))
        .reduce((sum, c) => sum + Number(c.amount), 0);
      return { name: format(month, 'MMM', { locale: ptBR }), valor: total };
    });
  }, [commissions]);

  // --- LOGIN ---
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#0f172a] p-8 rounded-[32px] border border-slate-800 w-full max-w-md shadow-2xl">
          <div className="flex justify-center mb-6">
             <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20"><TrendingUp size={32} color="white"/></div>
          </div>
          <h1 className="text-white text-2xl font-bold mb-6 text-center">DroneTech Management</h1>
          <input type="text" placeholder="Usuário" onChange={e => setUser(e.target.value)} className="w-full mb-4 p-4 bg-[#1e293b] text-white rounded-xl outline-none border border-transparent focus:border-blue-500" />
          <input type="password" placeholder="Senha" onChange={e => setPass(e.target.value)} className="w-full mb-6 p-4 bg-[#1e293b] text-white rounded-xl outline-none border border-transparent focus:border-blue-500" />
          <button onClick={() => {if(user === 'admin' && pass === 'drone2026') setIsLoggedIn(true)}} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/30">ACESSAR PORTAL</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col lg:flex-row">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex w-64 bg-[#0f172a] border-r border-slate-800 p-8 flex-col gap-8">
        <div className="text-xl font-bold text-blue-500 tracking-tighter italic">DRONETECH</div>
        <nav className="flex flex-col gap-2">
          {['dashboard', 'commissions', 'projects'].map((t) => (
            <button key={t} onClick={() => setActiveTab(t)} className={`flex items-center gap-3 p-4 rounded-2xl transition-all ${activeTab === t ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
              {t === 'dashboard' ? <LayoutDashboard size={20}/> : t === 'commissions' ? <DollarSign size={20}/> : <Briefcase size={20}/>}
              <span className="capitalize">{t}</span>
            </button>
          ))}
          <button onClick={() => setIsLoggedIn(false)} className="flex items-center gap-3 p-4 rounded-2xl text-slate-500 hover:text-red-400 mt-10"><LogOut size={20}/> Sair</button>
        </nav>
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 p-6 lg:p-12 overflow-y-auto">
        <header className="flex justify-between items-center mb-10">
           <h2 className="text-3xl font-bold capitalize">{activeTab}</h2>
           <div className="flex gap-2">
              <button className="bg-slate-800 p-3 rounded-xl border border-slate-700"><Printer size={20}/></button>
              <button className="bg-blue-600 px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20 flex items-center gap-2"><Plus size={18}/> Novo Lançamento</button>
           </div>
        </header>

        {activeTab === 'dashboard' && (
          <div className="space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#0f172a] p-8 rounded-[32px] border border-slate-800">
                   <p className="text-slate-400 text-sm font-medium">Previsão 90 Dias</p>
                   <h3 className="text-3xl font-bold text-emerald-400 mt-2">R$ {monthlyPredictability.reduce((a,b) => a+b.valor, 0).toLocaleString('pt-BR')}</h3>
                </div>
                <div className="bg-[#0f172a] p-8 rounded-[32px] border border-slate-800">
                   <p className="text-slate-400 text-sm font-medium">Projetos Ativos</p>
                   <h3 className="text-3xl font-bold text-blue-400 mt-2">{projects.length} Ativos</h3>
                </div>
             </div>

             <div className="bg-[#0f172a] p-8 rounded-[32px] border border-slate-800">
                <h3 className="font-bold mb-6">Fluxo de Recebimento</h3>
                <div className="h-[300px]">
                   <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyPredictability}>
                        <defs><linearGradient id="color" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false}/>
                        <XAxis dataKey="name" stroke="#64748b" axisLine={false} tickLine={false}/>
                        <Tooltip contentStyle={{backgroundColor:'#0f172a', border:'none', borderRadius:'12px'}}/>
                        <Area type="monotone" dataKey="valor" stroke="#3b82f6" fillOpacity={1} fill="url(#color)" strokeWidth={3}/>
                      </AreaChart>
                   </ResponsiveContainer>
                </div>
             </div>
          </div>
        )}
      </main>
    </div>
  );
}
