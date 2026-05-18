import { 
  LayoutDashboard, 
  Users, 
  Home, 
  Calendar, 
  CheckSquare, 
  TrendingUp, 
  Key, 
  FileText, 
  BarChart3, 
  Settings,
  Menu,
  X,
  Bell,
  LogOut
} from 'lucide-react';
import React, { useState } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { cn } from './lib/utils';

// Pages
import GlobalSearch from './components/GlobalSearch';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Properties from './pages/Properties';
import Agenda from './pages/Agenda';
import Tasks from './pages/Tasks';
import Sales from './pages/Sales';
import Rentals from './pages/Rentals';
import Documents from './pages/Documents';
import Reports from './pages/Reports';
import Configuration from './pages/Configuration';

const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { id: 'clientes', label: 'Clientes', icon: Users, path: '/clientes' },
  { id: 'propiedades', label: 'Propiedades', icon: Home, path: '/propiedades' },
  { id: 'agenda', label: 'Agenda', icon: Calendar, path: '/agenda' },
  { id: 'tareas', label: 'Tareas', icon: CheckSquare, path: '/tareas' },
  { id: 'ventas', label: 'Ventas', icon: TrendingUp, path: '/ventas' },
  { id: 'alquileres', label: 'Alquileres', icon: Key, path: '/alquileres' },
  { id: 'documentos', label: 'Documentos', icon: FileText, path: '/documentos' },
  { id: 'reportes', label: 'Reportes', icon: BarChart3, path: '/reportes' },
  { id: 'configuracion', label: 'Configuración', icon: Settings, path: '/configuracion' },
];

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <h2 className="text-4xl font-black text-gray-200 mb-4">404</h2>
      <p className="text-gray-500 font-medium mb-6">La página que buscas no existe.</p>
      <Link to="/dashboard" className="text-blue-600 font-bold hover:underline">Volver al Dashboard</Link>
    </div>
  );
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden">
      {/* Sidebar Overlay for Mobile */}
      {!sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 lg:hidden" 
          onClick={() => setSidebarOpen(true)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-white border-r border-gray-200 transition-all duration-300 z-50 flex flex-col",
          sidebarOpen ? "w-64" : "w-20"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-100 overflow-hidden">
          <div className="bg-blue-600 p-1.5 rounded-lg flex-shrink-0">
            <Home className="text-white" size={20} />
          </div>
          {sidebarOpen && (
            <span className="ml-3 font-bold text-xl tracking-tight text-gray-900 whitespace-nowrap">
              Immo<span className="text-blue-600">Flow</span>
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto overflow-x-hidden scrollbar-thin">
          {MENU_ITEMS.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.id}
                to={item.path}
                className={cn(
                  "flex items-center w-full px-3 py-2.5 rounded-lg transition-all group relative",
                  isActive 
                    ? "bg-blue-50 text-blue-700" 
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                )}
                id={`nav-${item.id}`}
              >
                <item.icon size={20} className={cn(isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600")} />
                {sidebarOpen && (
                  <span className="ml-3 font-medium text-sm whitespace-nowrap">{item.label}</span>
                )}
                {!sidebarOpen && (
                  <div className="absolute left-16 bg-gray-900 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity font-medium z-50">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User / Logout */}
        <div className="p-4 border-t border-gray-100">
          <button 
            className={cn(
              "flex items-center w-full px-3 py-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors group",
              !sidebarOpen && "justify-center"
            )}
            onClick={() => console.log('Logout')}
            id="nav-logout"
          >
            <LogOut size={20} />
            {sidebarOpen && <span className="ml-3 font-medium text-sm">Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
              id="toggle-sidebar"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <GlobalSearch />
          </div>

          <div className="flex items-center space-y-0 space-x-4">
            <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500 relative" id="notifications">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-[1px] bg-gray-200 mx-2"></div>
            <div className="flex items-center cursor-pointer group" id="user-profile">
              <div className="text-right mr-3 hidden sm:block">
                <p className="text-sm font-semibold text-gray-900">Martin Agente</p>
                <p className="text-xs text-gray-500 font-medium">Agente Pro</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold overflow-hidden ring-2 ring-transparent group-hover:ring-blue-100 transition-all">
                MA
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <main className="flex-1 overflow-y-auto p-6 scroll-smooth scrollbar-thin">
          <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/clientes" element={<Clients />} />
              <Route path="/clientes/:id" element={<Clients />} />
              <Route path="/propiedades" element={<Properties />} />
              <Route path="/propiedades/:id" element={<Properties />} />
              <Route path="/agenda" element={<Agenda />} />
              <Route path="/tareas" element={<Tasks />} />
              <Route path="/ventas" element={<Sales />} />
              <Route path="/alquileres" element={<Rentals />} />
              <Route path="/documentos" element={<Documents />} />
              <Route path="/reportes" element={<Reports />} />
              <Route path="/configuracion" element={<Configuration />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}
