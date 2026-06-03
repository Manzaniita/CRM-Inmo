import {
  LayoutDashboard,
  Users,
  Home,
  Calendar,
  CheckSquare,
  BarChart3,
  Settings,
  Menu,
  X,
  Bell,
  LogOut,
  Sofa,
  ShoppingCart,
  Briefcase,
  Store,
  Gauge,
  Moon,
  Sun,
  Loader2
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from './lib/utils';
import { useAppContext } from './context/AppContext';

// Pages
import GlobalSearch from './components/GlobalSearch';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Properties from './pages/Properties';
import Agenda from './pages/Agenda';
import Tasks from './pages/Tasks';
import Reports from './pages/Reports';
import Configuration from './pages/Configuration';
import WaitingRoom from './pages/WaitingRoom';
import Buyers from './pages/Buyers';
import ReferredColleagues from './pages/ReferredColleagues';
import Marketplace from './pages/Marketplace';
import Reservometro from './pages/Reservometro';
import EntityRelationsDrawer from './components/EntityRelationsDrawer';
import LoginPage from './pages/LoginPage';
import ResetPassword from './pages/ResetPassword';

const MENU_ITEMS = [
  { id: 'dashboard', label: 'Panel', icon: LayoutDashboard, path: '/dashboard' },
  { id: 'clientes', label: 'Clientes', icon: Users, path: '/clientes' },
  { id: 'propiedades', label: 'Propiedades', icon: Home, path: '/propiedades' },
  { id: 'agenda', label: 'Agenda', icon: Calendar, path: '/agenda' },
  { id: 'tareas', label: 'Tareas', icon: CheckSquare, path: '/tareas' },
  { id: 'sala-espera', label: 'Sala de Espera', icon: Sofa, path: '/sala-espera' },
  { id: 'compradores', label: 'Compradores', icon: ShoppingCart, path: '/compradores' },
  { id: 'colegas-referidos', label: 'Colegas Referidos', icon: Briefcase, path: '/colegas-referidos' },
  { id: 'marketplace', label: 'Marketplace', icon: Store, path: '/marketplace' },
  { id: 'reservometro', label: 'Reservómetro', icon: Gauge, path: '/reservometro' },
  { id: 'reportes', label: 'Reportes', icon: BarChart3, path: '/reportes' },
  { id: 'configuracion', label: 'Configuración', icon: Settings, path: '/configuracion' },
];

function ThemeToggle({ isDark, toggle }: { isDark: boolean; toggle: () => void }) {
  return (
    <button
      onClick={toggle}
      className={cn(
        "relative p-2 rounded-xl transition-all duration-300 magnetic-btn",
        "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300",
        "hover:bg-slate-200 dark:hover:bg-slate-700"
      )}
      aria-label="Cambiar tema"
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.div
            key="moon"
            initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.2 }}
          >
            <Moon size={18} strokeWidth={1.5} />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.2 }}
          >
            <Sun size={18} strokeWidth={1.5} />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}

function HeaderProfile() {
  const { profile, signOut } = useAppContext();
  const initials = profile.name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="flex items-center space-y-0 space-x-4">
      <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 relative transition-colors">
        <Bell size={20} strokeWidth={1.5} />
        <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900"></span>
      </button>
      <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-700 mx-2"></div>
      <button onClick={signOut} className="flex items-center cursor-pointer group" id="user-profile">
        <div className="text-right mr-3 hidden sm:block">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{profile.name}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Agente Pro</p>
        </div>
        <div className="w-9 h-9 rounded-full bg-accent/10 dark:bg-dark-accent/20 border border-accent/20 dark:border-dark-accent/30 flex items-center justify-center text-accent dark:text-dark-accent font-bold overflow-hidden ring-2 ring-transparent group-hover:ring-accent/20 dark:group-hover:ring-dark-accent/30 transition-all">
          {initials}
        </div>
      </button>
    </div>
  );
}

function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function SidebarFooter({ sidebarOpen }: { sidebarOpen: boolean }) {
  const { signOut } = useAppContext();
  return (
    <div className="p-4 border-t border-slate-100/60 dark:border-white/5">
      <button
        className={cn(
          "flex items-center w-full px-3 py-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 transition-colors group magnetic-btn",
          !sidebarOpen && "justify-center"
        )}
        onClick={signOut}
        id="nav-logout"
      >
        <LogOut size={20} strokeWidth={1.5} />
        {sidebarOpen && <span className="ml-3 font-medium text-sm">Cerrar Sesión</span>}
      </button>
    </div>
  );
}

function SplashScreen() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#020617]">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20 mb-5">
          <Home className="text-white" size={32} strokeWidth={1.5} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white mb-3">
          Estate<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">CRM</span>
        </h1>
        <Loader2 size={20} className="animate-spin text-slate-500" strokeWidth={1.5} />
      </motion.div>
    </div>
  );
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('estatecrm_theme');
      if (stored) return stored === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  const location = useLocation();
  const { user, profile, isCloudReady } = useAppContext();

  // Log de seguridad temporal para detectar recargas involuntarias
  useEffect(() => {
    const handler = () => {
      console.warn('DEBUG: Intento de recarga detectado');
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('estatecrm_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('estatecrm_theme', 'light');
    }
  }, [isDark]);

  // No autenticado: solo login accesible
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Esperar a cargar los datos de la nube antes de decidir la ruta
  if (!isCloudReady) {
    return <SplashScreen />;
  }

  // Si debe cambiar la contraseña, bloquear todo lo demás
  if (profile?.must_change_password) {
    return (
      <Routes>
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<Navigate to="/reset-password" replace />} />
      </Routes>
    );
  }

  // Autenticado: app completa
  return (
    <div className="flex h-screen bg-bg-primary dark:bg-dark-bg-primary text-text-primary dark:text-dark-text-primary font-sans overflow-hidden">
      {/* Sidebar Overlay for Mobile */}
      {!sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(true)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "relative z-50 flex flex-col transition-all duration-300 ease-out",
          "bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl",
          "border-r border-slate-200/60 dark:border-white/10",
          sidebarOpen ? "w-64" : "w-20"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100/60 dark:border-white/5 overflow-hidden">
          <div className="bg-accent dark:bg-dark-accent p-1.5 rounded-lg flex-shrink-0">
            <Home className="text-white dark:text-slate-900" size={20} strokeWidth={1.5} />
          </div>
          {sidebarOpen && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="ml-3 font-bold text-xl tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap"
            >
              Estate<span className="text-accent dark:text-dark-accent">CRM</span>
            </motion.span>
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
                  "flex items-center w-full px-3 py-2.5 rounded-xl transition-all group relative overflow-hidden",
                  isActive
                    ? "bg-accent/10 text-accent dark:bg-dark-accent/15 dark:text-dark-accent"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                )}
                id={`nav-${item.id}`}
              >
                <item.icon
                  size={20}
                  strokeWidth={1.5}
                  className={cn(
                    "shrink-0 transition-transform duration-200",
                    isActive
                      ? "text-accent dark:text-dark-accent"
                      : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                  )}
                />
                {sidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="ml-3 font-medium text-sm whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
                {/* Organic slide label for collapsed sidebar */}
                {!sidebarOpen && (
                  <div className="absolute left-14 top-1/2 -translate-y-1/2 z-50 pointer-events-none">
                    <div className={cn(
                      "bg-slate-900 dark:bg-slate-800 text-white dark:text-slate-100 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap",
                      "opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0",
                      "transition-all duration-200 ease-out shadow-lg"
                    )}>
                      {item.label}
                    </div>
                  </div>
                )}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-accent dark:bg-dark-accent rounded-r-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User / Logout */}
        <SidebarFooter sidebarOpen={sidebarOpen} />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-200/60 dark:border-white/10 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 transition-colors magnetic-btn"
              id="toggle-sidebar"
            >
              {sidebarOpen ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
            </button>
            <GlobalSearch />
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle isDark={isDark} toggle={() => setIsDark(d => !d)} />
            <HeaderProfile />
          </div>
        </header>

        {/* Dynamic Content */}
        <main className="flex-1 overflow-y-auto p-6 scroll-smooth scrollbar-thin">
          <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <div key={location.pathname}>
                <Routes location={location}>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/login" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/reset-password" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/documentos" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/alquileres" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<PageTransition><Dashboard /></PageTransition>} />
                  <Route path="/clientes" element={<PageTransition><Clients /></PageTransition>} />
                  <Route path="/clientes/:id" element={<PageTransition><Clients /></PageTransition>} />
                  <Route path="/propiedades" element={<PageTransition><Properties /></PageTransition>} />
                  <Route path="/propiedades/:id" element={<PageTransition><Properties /></PageTransition>} />
                  <Route path="/agenda" element={<PageTransition><Agenda /></PageTransition>} />
                  <Route path="/tareas" element={<PageTransition><Tasks /></PageTransition>} />
                  <Route path="/reportes" element={<PageTransition><Reports /></PageTransition>} />
                  <Route path="/configuracion" element={<PageTransition><Configuration /></PageTransition>} />
                  <Route path="/sala-espera" element={<PageTransition><WaitingRoom /></PageTransition>} />
                  <Route path="/compradores" element={<PageTransition><Buyers /></PageTransition>} />
                  <Route path="/colegas-referidos" element={<PageTransition><ReferredColleagues /></PageTransition>} />
                  <Route path="/marketplace" element={<PageTransition><Marketplace /></PageTransition>} />
                  <Route path="/reservometro" element={<PageTransition><Reservometro /></PageTransition>} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </div>
            </AnimatePresence>
          </div>
        </main>
      </div>
      <EntityRelationsDrawer />
    </div>
  );
}
