import React, { useState } from 'react';
import {
  Settings,
  User,
  Bell,
  Shield,
  Globe,
  Smartphone,
  MessageSquare,
  HelpCircle,
  Save,
  CheckCircle2,
  RotateCcw,
  Download,
  Upload,
  AlertTriangle
} from 'lucide-react';
import Button from '../components/Button';
import { Card } from '../components/Card';
import Badge from '../components/Badge';
import { cn } from '../lib/utils';
import { useAppContext } from '../context/AppContext';

export default function Configuration() {
  const { resetData, exportData, importData, showToast } = useAppContext();
  const [saveStatus, setSaveStatus] = React.useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleSave = () => {
    setSaveStatus(true);
    setTimeout(() => setSaveStatus(false), 2000);
  };

  const handleImport = (content: string) => {
    try {
      const parsed = JSON.parse(content);
      const hasData = parsed && typeof parsed === 'object' && (
        Array.isArray(parsed.clients) ||
        Array.isArray(parsed.properties) ||
        Array.isArray(parsed.tasks) ||
        Array.isArray(parsed.events) ||
        Array.isArray(parsed.sales) ||
        Array.isArray(parsed.rentals) ||
        Array.isArray(parsed.documents)
      );
      if (!hasData) {
        showToast('El archivo no tiene la estructura esperada de un backup de ImmoFlow.', 'error');
        return;
      }
      if (window.confirm('¿Estás seguro de importar este backup? Se reemplazarán todos los datos actuales.')) {
        const ok = importData(content);
        if (ok) {
          showToast('Datos importados correctamente', 'success');
        }
      }
    } catch {
      showToast('El archivo no es un JSON válido.', 'error');
    }
  };

  const handleReset = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    resetData();
    setConfirmReset(false);
  };

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-500">Personaliza tu espacio de trabajo y perfil profesional.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Tabs */}
        <div className="lg:col-span-1 space-y-1">
          <ConfigTab icon={User} label="Perfil del Agente" active />
          <ConfigTab icon={Bell} label="Notificaciones" />
          <ConfigTab icon={Shield} label="Seguridad & Acceso" />
          <ConfigTab icon={MessageSquare} label="Plantillas WhatsApp" />
          <ConfigTab icon={Settings} label="Personalización CRM" />
          <ConfigTab icon={Globe} label="Sitio Web Propio" />
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-6 animate-in fade-in duration-500">
           {/* Profile Section */}
           <Card title="Perfil Profesional" subtitle="Esta información se usará para tus reportes y tarjetas de contacto.">
              <div className="space-y-6 pt-4">
                 <div className="flex items-center gap-6">
                    <div className="relative group">
                       <div className="w-24 h-24 rounded-full bg-blue-100 border-2 border-white shadow flex items-center justify-center text-blue-700 text-3xl font-black">
                        MA
                       </div>
                       <button className="absolute bottom-0 right-0 p-1.5 bg-white rounded-full shadow-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                          <Smartphone size={14} className="text-gray-600" />
                       </button>
                    </div>
                    <div>
                       <Button variant="outline" size="sm">Cambiar Foto</Button>
                       <p className="text-[10px] text-gray-400 mt-2 uppercase font-black tracking-widest">JPG o PNG. Max 2MB.</p>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-sm font-bold text-gray-700">Nombre Completo</label>
                       <input type="text" defaultValue="Martin Agente" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-bold text-gray-700">Email Profesional</label>
                       <input type="email" defaultValue="martin@immoflow.com" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-bold text-gray-700">WhatsApp / Teléfono</label>
                       <input type="text" defaultValue="+54 9 11 1234 5678" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-bold text-gray-700">Matrícula / Registro</label>
                       <input type="text" defaultValue="CUCICBA 12345" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                 </div>
              </div>
           </Card>

           {/* CRM Settings */}
           <Card title="Preferencias del CRM" subtitle="Define cómo quieres que funcione tu sistema.">
              <div className="space-y-4 pt-4">
                 <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:shadow-sm transition-all">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                          <Bell size={20} />
                       </div>
                       <div>
                          <p className="text-sm font-bold text-gray-900">Recordatorios Automáticos</p>
                          <p className="text-xs text-gray-500">Notificar 24hs antes de cada firma o contrato.</p>
                       </div>
                    </div>
                    <Toggle active />
                 </div>

                 <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:shadow-sm transition-all">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600">
                          <Globe size={20} />
                       </div>
                       <div>
                          <p className="text-sm font-bold text-gray-900">Moneda por Defecto</p>
                          <p className="text-xs text-gray-500">Usar USD para ventas y ARS para alquileres.</p>
                       </div>
                    </div>
                    <Badge variant="purple">Manual</Badge>
                 </div>
              </div>
           </Card>

           {/* Data Management Section */}
           <Card title="Gestión de Datos" subtitle="Controla la persistencia y copias de seguridad de tu información local.">
              <div className="space-y-6 pt-4">
                 <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 p-4 bg-gray-50 rounded-xl border border-gray-100">
                       <h4 className="text-sm font-bold text-gray-900 mb-1">Copia de Seguridad</h4>
                       <p className="text-xs text-gray-500 mb-4">Exporta todos tus clientes, propiedades, tareas y eventos en un archivo JSON.</p>
                       <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => exportData()} className="flex-1">
                             <Download size={14} className="mr-2" /> Exportar JSON
                          </Button>
                          <label className="flex-1">
                             <input 
                                type="file" 
                                accept=".json" 
                                className="hidden" 
                                onChange={(e) => {
                                   const file = e.target.files?.[0];
                                   if (file) {
                                      const reader = new FileReader();
                                      reader.onload = (event) => {
                                         const content = event.target?.result as string;
                                         handleImport(content);
                                      };
                                      reader.readAsText(file);
                                   }
                                }}
                             />
                             <div className="flex items-center justify-center h-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-all">
                                <Upload size={14} className="mr-2" /> Importar
                             </div>
                          </label>
                       </div>
                    </div>
                    <div className="flex-1 p-4 bg-red-50/30 rounded-xl border border-red-100/50">
                       <h4 className="text-sm font-bold text-red-900 mb-1">Restablecer Sistema</h4>
                       <p className="text-xs text-red-600/70 mb-4">Borra todos los cambios locales y vuelve a los datos de prueba iniciales.</p>
                       <Button
                          variant="outline"
                          size="sm"
                          className={cn('w-full', confirmReset ? 'border-red-500 text-red-700 bg-red-50' : 'border-red-200 text-red-600 hover:bg-red-50')}
                          onClick={handleReset}
                       >
                          <RotateCcw size={14} className="mr-2" />
                          {confirmReset ? 'Confirmar Restablecimiento' : 'Restablecer Datos'}
                       </Button>
                    </div>
                 </div>
              </div>
           </Card>

           {/* Save Actions */}
           <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2">
                 <HelpCircle size={18} className="text-gray-400" />
                 <p className="text-xs text-gray-500 font-medium italic">Los cambios se guardarán solo en esta sesión (Mock Mode).</p>
              </div>
              <Button 
                variant="primary" 
                size="lg" 
                onClick={handleSave}
                isLoading={saveStatus}
              >
                {saveStatus ? <CheckCircle2 size={18} className="mr-2" /> : <Save size={18} className="mr-2" />}
                {saveStatus ? 'Guardado' : 'Guardar Perfil'}
              </Button>
           </div>
        </div>
      </div>
    </div>
  );
}

function ConfigTab({ icon: Icon, label, active = false }: { icon: any, label: string, active?: boolean }) {
  return (
    <button className={cn(
      "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm",
      active 
        ? "bg-blue-600 text-white shadow-lg shadow-blue-200" 
        : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
    )}>
      <Icon size={18} />
      {label}
    </button>
  );
}

function Toggle({ active = false }: { active?: boolean }) {
  return (
    <button className={cn(
      "w-12 h-6 rounded-full transition-colors relative",
      active ? "bg-blue-600" : "bg-gray-200"
    )}>
      <div className={cn(
        "absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm",
        active ? "right-1" : "left-1"
      )} />
    </button>
  );
}
