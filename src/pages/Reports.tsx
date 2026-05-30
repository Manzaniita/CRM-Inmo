import React, { useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Home, 
  DollarSign, 
  Calendar,
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { useAppContext } from '../context/AppContext';
import { Card } from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { cn, formatCurrency } from '../lib/utils';

export default function Reports() {
  const { clients, sales, properties, events } = useAppContext();

  // Calculate Metrics
  const totalSalesEstimated = useMemo(() => 
    sales
      .filter(s => s.moneda === 'USD')
      .reduce((acc, s) => acc + (s.valorCierre || s.precioAcordado || s.precioPublicado || 0), 0)
  , [sales]);

  const monthlyVisits = events.filter(e => e.type === 'visita' && e.date.startsWith(new Date().toISOString().slice(0, 7))).length;
  
  // Conversion rate: vendida / (total excluding caída)
  const activeOps = sales.filter(s => s.estado !== 'caída');
  const closedOps = sales.filter(s => s.estado === 'vendida');
  const conversionRate = activeOps.length > 0 ? Math.round((closedOps.length / activeOps.length) * 100) : 0;

  const reservedSales = sales.filter(s => s.estado === 'reserva').length;

  const collectedCommissions = useMemo(() => 
    sales
      .filter(s => s.isCollected && s.grossCommissionUsd)
      .reduce((acc, s) => acc + (s.grossCommissionUsd || 0), 0)
  , [sales]);

  // Chart Data: Clients by Month
  const clientsByMonth = useMemo(() => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const data = months.map(m => ({ name: m, value: 0 }));
    
    clients.forEach(c => {
      const monthIdx = new Date(c.fechaCreacion).getMonth();
      if (!isNaN(monthIdx)) data[monthIdx].value++;
    });
    
    return data.slice(0, new Date().getMonth() + 1); // Current year up to now
  }, [clients]);

  // Chart Data: Commissions by Month (Simplified)
  const commissionsByMonth = useMemo(() => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const data = months.map(m => ({ name: m, value: 0 }));
    
    sales.forEach(s => {
      const monthIdx = new Date(s.fechaCreacion).getMonth();
      if (!isNaN(monthIdx) && s.moneda === 'USD') data[monthIdx].value += s.comisionEstimada;
    });
    
    return data.slice(0, new Date().getMonth() + 1);
  }, [sales]);

  // Chart Data: Origin Breakdown
  const originBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    clients.forEach(c => {
      counts[c.origin] = (counts[c.origin] || 0) + 1;
    });
    
    const colors = ['#2563eb', '#7c3aed', '#10b981', '#f59e0b', '#ef4444', '#6366f1'];
    return Object.entries(counts).map(([name, value], idx) => ({
      name,
      value: Math.round((value / clients.length) * 100),
      color: colors[idx % colors.length]
    }));
  }, [clients]);

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Reportes</h1>
          <p className="text-slate-500 dark:text-slate-400">Visualiza el rendimiento de tu negocio inmobiliario.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Personalizar</Button>
          <Button variant="primary">Exportar PDF</Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
         <ReportStat label="Ventas Totales Est. (USD)" value={formatCurrency(totalSalesEstimated, 'USD')} trend="+8.5%" trendType="up" />
         <ReportStat label="Ventas Reservadas" value={reservedSales.toString()} trend="+2" trendType="up" />
         <ReportStat label="Visitas del Mes" value={monthlyVisits.toString()} trend="-4%" trendType="down" />
         <ReportStat label="Tasa de Cierre" value={`${conversionRate}%`} trend="+2%" trendType="up" />
         <ReportStat label="Comisiones Brutas Cobradas (USD)" value={formatCurrency(collectedCommissions, 'USD')} trend="+12%" trendType="up" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Charts */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Nuevos Clientes por Mes" className="h-[400px]">
             <div className="h-[300px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={clientsByMonth}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        cursor={{ fill: '#f9fafb' }}
                      />
                      <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={40} />
                   </BarChart>
                </ResponsiveContainer>
             </div>
          </Card>

          <Card title="Evolución de Comisiones Est. (USD)" className="h-[400px]">
             <div className="h-[300px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                   <LineChart data={commissionsByMonth}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                      <Line type="monotone" dataKey="value" stroke="#7c3aed" strokeWidth={3} dot={{ r: 4, fill: '#7c3aed' }} activeDot={{ r: 6 }} />
                   </LineChart>
                </ResponsiveContainer>
             </div>
          </Card>
        </div>

        {/* Breakdown Charts */}
        <div className="space-y-6">
          <Card title="Origen de Clientes">
             <div className="h-[250px] relative">
                <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                      <Pie 
                        data={originBreakdown} 
                        innerRadius={60} 
                        outerRadius={80} 
                        paddingAngle={5} 
                        dataKey="value"
                      >
                        {originBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                   </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                   <p className="text-2xl font-black text-slate-900 dark:text-slate-100">100%</p>
                   <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 tracking-widest uppercase">Canales</p>
                </div>
             </div>
             <div className="space-y-2 mt-4">
                {originBreakdown.map((item) => (
                   <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                         <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 capitalize">{item.name}</span>
                      </div>
                      <span className="text-xs font-black text-slate-900 dark:text-slate-100">{item.value}%</span>
                   </div>
                ))}
             </div>
          </Card>

          <Card title="Estado de Propiedades">
             <div className="space-y-4">
                <ProgressItem label="Venta" value={Math.round((properties.filter(p => p.operation === 'venta').length / properties.length) * 100) || 0} color="bg-orange-500" />
                <ProgressItem label="Disponibles" value={Math.round((properties.filter(p => p.status === 'disponible').length / properties.length) * 100) || 0} color="bg-green-500" />
                <ProgressItem label="Ventas Reservadas" value={Math.round((sales.filter(s => s.estado === 'reserva').length / sales.length) * 100) || 0} color="bg-purple-500" />
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ReportStat({ label, value, trend, trendType }: { label: string, value: string, trend: string, trendType: 'up' | 'down' }) {
  return (
    <Card className="p-5 flex flex-col">
       <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{label}</p>
       <h4 className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-2">{value}</h4>
       <div className={cn("flex items-center text-xs font-bold", trendType === 'up' ? "text-green-600" : "text-red-600")}>
          {trendType === 'up' ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
          {trend} <span className="text-slate-400 dark:text-slate-500 ml-1 font-medium italic">vs mes ant.</span>
       </div>
    </Card>
  );
}

function ProgressItem({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div className="space-y-1">
       <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
          <span className="text-slate-500 dark:text-slate-400">{label}</span>
          <span className="text-slate-900 dark:text-slate-100">{value}%</span>
       </div>
       <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className={cn("h-full rounded-full transition-all duration-1000", color)} style={{ width: `${value}%` }} />
       </div>
    </div>
  );
}

