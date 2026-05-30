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
  MessageSquare,
  Users,
  Plus,
  X,
  Loader2
} from 'lucide-react';
import Button from '../components/Button';
import { Card } from '../components/Card';
import Badge from '../components/Badge';
import { cn } from '../lib/utils';
import { useAppContext, Profile } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

type ConfigTabId = 'perfil' | 'plantillas' | 'datos' | 'usuarios';

export default function Configuration() {
  const { profile, updateProfile, resetData, exportData, importData, showToast, clearMockData, signOut } = useAppContext();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ConfigTabId>('perfil');
  const [saveStatus, setSaveStatus] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmClearMock, setConfirmClearMock] = useState(false);

  const [form, setForm] = useState<Profile>(profile);

  // Superadmin state
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: '', name: '', role: 'agent' });
  const [creatingUser, setCreatingUser] = useState(false);

  React.useEffect(() => {
    if (activeTab === 'usuarios' && profile.role === 'superadmin') {
      fetchUsers();
    }
  }, [activeTab, profile.role]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    const { data, error } = await supabase.from('profiles').select('*').order('name');
    if (!error && data) {
      setUsersList(data);
    }
    setLoadingUsers(false);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.email || !newUser.password || !newUser.name) {
      showToast('Completá todos los campos', 'warning');
      return;
    }
    setCreatingUser(true);
    const { data, error } = await supabase.auth.signUp({
      email: newUser.email,
      password: newUser.password,
    });

    if (error) {
      showToast(error.message, 'error');
      setCreatingUser(false);
      return;
    }

    if (data.user) {
      // Upsert profile
      await supabase.from('profiles').upsert({
        user_id: data.user.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        must_change_password: true,
      });

      setShowUserModal(false);
      setCreatingUser(false);
      setNewUser({ email: '', password: '', name: '', role: 'agent' });
      
      // Auto-login happens here, so we force sign out and redirect
      await signOut();
      showToast('Usuario creado con éxito. Por seguridad del sistema, por favor re-ingresa a tu cuenta de Administrador.', 'info');
      navigate('/login');
    }
  };

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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Configuración</h1>
        <p className="text-slate-500 dark:text-slate-400">Personaliza tu espacio de trabajo y perfil profesional.</p>
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
          {profile.role === 'superadmin' && (
            <ConfigTab
              icon={Users}
              label="Gestión de Usuarios"
              active={activeTab === 'usuarios'}
              onClick={() => setActiveTab('usuarios')}
            />
          )}
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
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{form.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{form.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Nombre Completo</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Email Profesional</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300">WhatsApp / Teléfono</label>
                      <input
                        type="text"
                        value={form.phone}
                        onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Matrícula / Registro</label>
                      <input
                        type="text"
                        value={form.license}
                        onChange={e => setForm(f => ({ ...f, license: e.target.value }))}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
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
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Mensaje para Propiedades</label>
                    <textarea
                      rows={4}
                      value={form.templateProperty}
                      onChange={e => setForm(f => ({ ...f, templateProperty: e.target.value }))}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-sm resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Mensaje para Clientes</label>
                    <textarea
                      rows={3}
                      value={form.templateClient}
                      onChange={e => setForm(f => ({ ...f, templateClient: e.target.value }))}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-sm resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Mensaje para Compradores</label>
                    <textarea
                      rows={3}
                      value={form.templateBuyer}
                      onChange={e => setForm(f => ({ ...f, templateBuyer: e.target.value }))}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-sm resize-none"
                    />
                  </div>
                </div>
              </Card>

              <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex items-center gap-2">
                  <Save size={18} className="text-slate-400 dark:text-slate-500" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Los cambios se guardan automáticamente en el navegador.</p>
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
                  <div className="flex-1 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">Copia de Seguridad</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Exporta todos tus clientes, propiedades, tareas y eventos en un archivo JSON.</p>
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
                        <div className="flex items-center justify-center h-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white hover:bg-slate-50 dark:bg-slate-800/50 cursor-pointer transition-all">
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

          {activeTab === 'usuarios' && profile.role === 'superadmin' && (
            <Card title="Gestión de Usuarios" subtitle="Administra los agentes y superadmins del sistema.">
              <div className="pt-4 space-y-4">
                <div className="flex justify-end mb-4">
                  <Button variant="primary" onClick={() => setShowUserModal(true)}>
                    <Plus size={18} className="mr-2" /> Crear Nuevo Usuario
                  </Button>
                </div>
                
                {loadingUsers ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="animate-spin text-slate-400" size={32} />
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Nombre</th>
                          <th className="px-4 py-3 font-semibold">Email</th>
                          <th className="px-4 py-3 font-semibold">Rol</th>
                          <th className="px-4 py-3 font-semibold text-center">Contraseña Mágica</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
                        {usersList.map((u) => (
                          <tr key={u.user_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{u.name}</td>
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{u.email}</td>
                            <td className="px-4 py-3">
                              <Badge variant={u.role === 'superadmin' ? 'purple' : 'blue'}>
                                {u.role === 'superadmin' ? 'Superadmin' : 'Agente'}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {u.must_change_password ? (
                                <Badge variant="warning" size="sm">Pendiente Reset</Badge>
                              ) : (
                                <Badge variant="success" size="sm">Actualizada</Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                        {usersList.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                              No se encontraron usuarios.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {showUserModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">Crear Nuevo Usuario</h3>
              <button onClick={() => setShowUserModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={newUser.name}
                  onChange={(e) => setNewUser(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser(p => ({ ...p, email: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Contraseña Provisoria</label>
                <input
                  type="password"
                  required
                  value={newUser.password}
                  onChange={(e) => setNewUser(p => ({ ...p, password: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Rol</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser(p => ({ ...p, role: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-slate-100"
                >
                  <option value="agent">Agente</option>
                  <option value="superadmin">Superadmin</option>
                </select>
              </div>
              <div className="pt-2 flex gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowUserModal(false)}>Cancelar</Button>
                <Button type="submit" variant="primary" className="flex-1" isLoading={creatingUser}>
                  {creatingUser ? 'Creando...' : 'Crear Usuario'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
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
          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:text-slate-100'
      )}
    >
      <Icon size={18} />
      {label}
    </button>
  );
}
