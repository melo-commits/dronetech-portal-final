import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
  LayoutDashboard, DollarSign, Briefcase, Wallet, Plus, ArrowUpRight, 
  ArrowDownRight, Filter, Download, Upload, LogOut, Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- CONFIGURAÇÃO SUPABASE ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');

  // Simulação de dados para o visual (Substituir por fetch real depois)
  const data = [
    { name: 'Jan', receitas: 4000, despesas: 2400 },
    { name: 'Fev', receitas: 3000, despesas: 1398 },
    { name: 'Mar', receitas: 2000, despesas: 9800 },
  ];

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
        <form onSubmit={(e) => { e.preventDefault(); if(user === 'admin' && pass === 'drone2026') setIsLoggedIn(true) }} className="bg-[#0f172a] p-8 rounded-3xl border border-slate-800 w-full max-w-md shadow-2xl">
          <h1 className="text-white text-2xl font-bold mb-6 text-center">DroneTech Login</h1>
          <input type="text" placeholder="Usuário" onChange={e => setUser(e.target.value)} className="w-full mb-4 p-4 bg-[#1e293b] text-white rounded-xl outline-none border border-transparent focus:border-blue-500" />
          <input type="password" placeholder="Senha" onChange={e => setPass(e.target.value)} className="w-full mb-6 p-4 bg-[#1e293b] text-white rounded-xl outline-none border border-transparent focus:border-blue-500" />
          <button className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-500 transition-all">ACESSAR SISTEMA</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans">
      {/* Barra Lateral / Header Superior Mobile */}
      <nav className="flex items-center justify-between p-6 border-b border-slate-800 bg-[#020617]/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20"><TrendingUp size={24} /></div>
          <span className="text-xl font-bold tracking-tight uppercase">DroneTech</span>
        </div>
        <button onClick={() => setIsLoggedIn(false)} className="text-slate-500 hover:text-white transition-colors"><LogOut size={24}/></button>
      </nav>

      <main className="p-6 lg:p-10 max-w-7xl mx-auto space-y-10">
        {/* Cabeçalho de Ações */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-bold">Visão Geral</h2>
            <p className="text-slate-400">Acompanhe o desempenho da Dronetech em tempo real.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all border border-slate-700"><Upload size={16}/> Importar</button>
            <button className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all border border-slate-700"><Download size={16}/> Exportar</button>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-500" size={18}/>
              <input type="text" placeholder="Buscar..." className="bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2 outline-none focus:border-blue-500 w-40 md:w-64" />
            </div>
            <button className="bg-slate-800 p-2.5 rounded-lg border border-slate-700"><Filter size={18}/></button>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-[#0f172a] p-8 rounded-[32px] border border-slate-800 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><ArrowUpRight size={80} className="text-emerald-500"/></div>
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mb-6"><TrendingUp size={24}/></div>
            <p className="text-slate-400 font-medium">Receitas Totais</p>
            <h3 className="text-4xl font-bold text-emerald-400 mt-2">R$ 0,00</h3>
            <div className="mt-4 inline-flex items-center text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full uppercase tracking-wider">Receitas</div>
          </div>

          <div className="bg-[#0f172a] p-8 rounded-[32px] border border-slate-800 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><ArrowDownRight size={80} className="text-pink-500"/></div>
            <div className="w-12 h-12 bg-pink-500/10 text-pink-500 rounded-2xl flex items-center justify-center mb-6"><TrendingDown size={24}/></div>
            <p className="text-slate-400 font-medium">Despesas Totais</p>
            <h3 className="text-4xl font-bold text-pink-400 mt-2">R$ 0,00</h3>
            <div className="mt-4 inline-flex items-center text-xs font-bold text-pink-500 bg-pink-500/10 px-3 py-1 rounded-full uppercase tracking-wider">Despesas</div>
          </div>

          <div className="bg-[#0f172a] p-8 rounded-[32px] border border-slate-800 relative overflow-hidden group">
            <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center mb-6"><Wallet size={24}/></div>
            <p className="text-slate-400 font-medium">Saldo em Caixa</p>
            <h3 className="text-4xl font-bold text-white mt-2">R$ 0,00</h3>
            <div className="mt-4 inline-flex items-center text-xs font-bold text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full uppercase tracking-wider">Saldo</div>
          </div>
        </div>

        {/* Gráfico */}
        <div className="bg-[#0f172a] p-8 rounded-[32px] border border-slate-800">
          <h3 className="text-xl font-bold mb-8">Desempenho Mensal</h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" axisLine={false} tickLine={false} />
                <YAxis stroke="#64748b" axisLine={false} tickLine={false} tickFormatter={(value) => `R$${value}`} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="receitas" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRec)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>

      {/* Navegação Inferior Mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#020617]/80 backdrop-blur-xl border-t border-slate-800 flex justify-around p-4 lg:hidden">
        <button onClick={() => setActiveTab('dashboard')} className="flex flex-col items-center gap-1 text-blue-500">
          <LayoutDashboard size={20}/>
          <span className="text-[10px] font-bold uppercase">Dashboard</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-slate-500">
          <DollarSign size={20}/>
          <span className="text-[10px] font-bold uppercase">Comissões</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-slate-500">
          <Wallet size={20}/>
          <span className="text-[10px] font-bold uppercase">Financeiro</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-slate-500">
          <Briefcase size={20}/>
          <span className="text-[10px] font-bold uppercase">Projetos</span>
        </button>
      </div>
    </div>
  );
}

// Subcomponentes de Ícone que faltaram
function TrendingUp(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg> }
function TrendingDown(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline></svg> }
