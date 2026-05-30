import React, { useState } from 'react';
import {
  User,
  Save,
  CheckCircle2,
  RotateCcw,
  Download,
  Upload,
  AlertTriangle,
  Trash2,
  Database,
  MessageSquare
} from 'lucide-react';
import Button from '../components/Button';
import { Card } from '../components/Card';
import Badge from '../components/Badge';
import { cn } from '../lib/utils';
import { useAppContext, Profile } from '../context/AppContext';

type ConfigTabId = 'perfil' | 'plantillas' | 'datos';

export default function Configuration() {
  const { profile, updateProfile, resetData, exportData, importData, showToast, clearMockData } = useAppContext();
  const [activeTab, setActiveTab] = useState<ConfigTabId>('perfil');
  const [saveStatus, setSaveStatus] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmClearMock, setConfirmClearMock] = useState(false);

  const [form, setForm] = useState<Profile>(profile);

  const handleSave = () => {
    updateProfile(form);
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
        Array.isArray(parsed.documents)
      );
      if (!hasData) {
        showToast('El archivo no tiene la estructura esperada de un backup de EstateCRM.', 'error');
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

  const handleClearMock = () => {
    if (!confirmClearMock) {
      setConfirmClearMock(true);
      return;
    }
    clearMockData();
    setConfirmClearMock(false);
  };

  const initials = form.name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-500">Personaliza tu espacio de trabajo y perfil profesional.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Tabs */}
        <div className="lg:col-span-1 space-y-1">
          <ConfigTab
            icon={User}
            label="Perfil Profesional"
            active={activeTab === 'perfil'}
            onClick={() => setActiveTab('perfil')}
          />
          <ConfigTab
            icon={Database}
            label="Gestión de Datos"
            active={activeTab === 'datos'}
            onClick={() => setActiveTab('datos')}
          />
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-6 animate-in fade-in duration-500">
          {activeTab === 'perfil' && (
            <>
              <Card title="Perfil Profesional" subtitle="Esta información se usará para tus reportes y tarjetas de contacto.">
                <div className="space-y-6 pt-4">
                  <div className="flex items-center gap-6">
                    <div className="relative group">
                      <div className="w-24 h-24 rounded-full bg-blue-100 border-2 border-white shadow flex items-center justify-center text-blue-700 text-3xl font-black">
                        {initials}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{form.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{form.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Nombre Completo</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Email Profesional</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">WhatsApp / Teléfono</label>
                      <input
                        type="text"
                        value={form.phone}
                        onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Matrícula / Registro</label>
                      <input
                        type="text"
                        value={form.license}
                        onChange={e => setForm(f => ({ ...f, license: e.target.value }))}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </Card>

              <Card title="Plantillas de Mensajes" subtitle="Personalizá los mensajes que se envían por WhatsApp.">
                <div className="space-y-6 pt-4">
                  <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                    <p className="text-xs font-bold text-blue-800 mb-1">Placeholders disponibles</p>
                    <div className="flex flex-wrap gap-2">
                      {['{name}', '{title}', '{address}', '{price}', '{link}', '{agentName}'].map(p => (
                        <span key={p}>
                          <Badge variant="blue" size="sm">{p}</Badge>
                        </span>
                      ))}
                    </div>
                    <p className="text-[10px] text-blue-600/70 mt-1">Se reemplazan automáticamente al enviar el mensaje.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Mensaje para Propiedades</label>
                    <textarea
                      rows={4}
                      value={form.templateProperty}
                      onChange={e => setForm(f => ({ ...f, templateProperty: e.target.value }))}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-sm resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Mensaje para Clientes</label>
                    <textarea
                      rows={3}
                      value={form.templateClient}
                      onChange={e => setForm(f => ({ ...f, templateClient: e.target.value }))}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-sm resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Mensaje para Compradores</label>
                    <textarea
                      rows={3}
                      value={form.templateBuyer}
                      onChange={e => setForm(f => ({ ...f, templateBuyer: e.target.value }))}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-sm resize-none"
                    />
                  </div>
                </div>
              </Card>

              <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2">
                  <Save size={18} className="text-gray-400" />
                  <p className="text-xs text-gray-500 font-medium">Los cambios se guardan automáticamente en el navegador.</p>
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
            </>
          )}

          {activeTab === 'datos' && (
            <Card title="Gestión de Datos" subtitle="Controla la persistencia y copias de seguridad de tu información local.">
              <div className="space-y-6 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <div className="p-4 bg-amber-50/40 rounded-xl border border-amber-100/60">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <AlertTriangle size={18} className="text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-amber-900 mb-1">Eliminar Datos de Muestra</h4>
                      <p className="text-xs text-amber-700/70 mb-4">
                        Remueve únicamente los registros de demostración iniciales (clientes, propiedades, ventas, etc.) conservando todo lo que hayas creado.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          'w-full md:w-auto',
                          confirmClearMock
                            ? 'border-amber-500 text-amber-800 bg-amber-100'
                            : 'border-amber-300 text-amber-700 hover:bg-amber-50'
                        )}
                        onClick={handleClearMock}
                      >
                        <Trash2 size={14} className="mr-2" />
                        {confirmClearMock ? 'Confirmar — Esto no se puede deshacer' : 'Eliminar Datos de Muestra'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function ConfigTab({
  icon: Icon,
  label,
  active = false,
  onClick
}: {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm',
        active
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
      )}
    >
      <Icon size={18} />
      {label}
    </button>
  );
}
