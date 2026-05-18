import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  ArrowLeft,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  Calendar,
  MessageCircle,
  Globe,
  UserPlus,
  X,
  FileText
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Client, ClientType, ClientStatus, ClientOrigin, EntityNote, Document, Sale, Rental } from '../types';
import Badge from '../components/Badge';
import Button from '../components/Button';
import { Card } from '../components/Card';
import { cn, formatCurrency, formatDate, normalizeSearchText } from '../lib/utils';
import EntityNotesPanel from '../components/EntityNotesPanel';
import DocumentModal from '../components/DocumentModal';
import SaleModal from '../components/SaleModal';
import RentalModal from '../components/RentalModal';

export default function Clients() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { clients, properties, sales, rentals, documents, addClient, updateClient, addSale, updateSale, deleteSale, addRental, updateRental, deleteRental, addDocument, updateDocument, deleteDocument, showToast } = useAppContext();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [docModalMode, setDocModalMode] = useState<'create' | 'edit' | 'view'>('view');
  const [selectedDocForModal, setSelectedDocForModal] = useState<Document | undefined>(undefined);
  
  // Operation Modals State
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [saleModalMode, setSaleModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedSaleForModal, setSelectedSaleForModal] = useState<Sale | undefined>(undefined);
  const [isRentalModalOpen, setIsRentalModalOpen] = useState(false);
  const [rentalModalMode, setRentalModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedRentalForModal, setSelectedRentalForModal] = useState<Rental | undefined>(undefined);

  // Form State
  const [formData, setFormData] = useState<Partial<Client>>({
    name: '',
    phone: '',
    email: '',
    type: 'comprador',
    status: 'nuevo',
    origin: 'WhatsApp',
    budget: 0,
    currency: 'USD',
    interestZone: '',
    propertyTypeInterest: '',
    lastContact: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const selectedClient = clients.find(c => c.id === id);

  const lowerSearch = normalizeSearchText(searchTerm);

  const filteredClients = clients.filter(c => 
    normalizeSearchText(c.name).includes(lowerSearch) || 
    c.phone.includes(searchTerm) || 
    normalizeSearchText(c.email).includes(lowerSearch)
  );

  const handleOpenForm = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData(client);
    } else {
      setEditingClient(null);
      setFormData({
        name: '',
        phone: '',
        email: '',
        type: 'comprador',
        status: 'nuevo',
        origin: 'WhatsApp',
        budget: 0,
        currency: 'USD',
        interestZone: '',
        propertyTypeInterest: '',
        lastContact: new Date().toISOString().split('T')[0],
        notes: '',
      });
    }
    setIsFormModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return alert('El nombre es obligatorio');
    
    if (editingClient) {
      updateClient(formData as Client);
    } else {
      const newClient: Client = {
        ...(formData as Client),
        id: `c${Date.now()}`,
        createdAt: new Date().toISOString().split('T')[0],
      };
      addClient(newClient);
    }
    setIsFormModalOpen(false);
  };

  const getTypeBadgeVariant = (type: ClientType): any => {
    switch (type) {
      case 'comprador': return 'green';
      case 'vendedor': return 'blue';
      case 'inquilino': return 'orange';
      case 'propietario': return 'purple';
      case 'inversor': return 'yellow';
      case 'interesado': return 'gray';
      default: return 'gray';
    }
  };

  const getStatusBadgeVariant = (status: ClientStatus): any => {
    switch (status) {
      case 'nuevo': return 'green';
      case 'contactado': return 'blue';
      case 'interesado': return 'orange';
      case 'en seguimiento': return 'purple';
      case 'negociación': return 'yellow';
      case 'cerrado': return 'gray';
      case 'perdido': return 'red';
      default: return 'gray';
    }
  };

  if (selectedClient) {
    const clientSales = sales.filter(s => s.clientCompradorId === id);
    const clientRentals = rentals.filter(r => r.inquilinoId === id);

    return (
      <div className="animate-in slide-in-from-right duration-300">
        <button 
          onClick={() => navigate('/clientes')}
          className="flex items-center text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft size={16} className="mr-1" /> Volver al listado
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-blue-100 border-2 border-blue-200 flex items-center justify-center text-blue-700 text-xl font-bold">
                    {selectedClient.name.charAt(0)}
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">{selectedClient.name}</h1>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={getTypeBadgeVariant(selectedClient.type)}>{selectedClient.type}</Badge>
                      <Badge variant={getStatusBadgeVariant(selectedClient.status)}>{selectedClient.status}</Badge>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleOpenForm(selectedClient)}>
                  <Plus size={16} className="mr-1" /> Editar
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 py-6 border-y border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Phone size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Teléfono</p>
                    <p className="text-sm font-bold text-gray-900">{selectedClient.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Mail size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Email</p>
                    <p className="text-sm font-bold text-gray-900">{selectedClient.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Globe size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Origen</p>
                    <p className="text-sm font-bold text-gray-900">{selectedClient.origin}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <DollarSign size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Presupuesto</p>
                    <p className="text-sm font-bold text-gray-900">
                      {selectedClient.budget ? formatCurrency(selectedClient.budget, selectedClient.currency) : 'Sin especificar'}
                    </p>
                  </div>
                </div>
                {selectedClient.interestZone && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                      <MapPin size={18} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Zona de Interés</p>
                      <p className="text-sm font-bold text-gray-900">{selectedClient.interestZone}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Calendar size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Último Contacto</p>
                    <p className="text-sm font-bold text-gray-900">{formatDate(selectedClient.lastContact)}</p>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="font-bold text-gray-900 mb-3">Notas Internas</h3>
                <p className="text-gray-600 leading-relaxed italic border-l-4 border-gray-100 pl-4">
                  "{selectedClient.notes || 'Sin notas adicionales.'}"
                </p>
              </div>

              <div className="mt-8">
                <EntityNotesPanel
                  notes={selectedClient.historyNotes}
                  onAddNote={(content) => {
                    const newNote: EntityNote = {
                      id: `n${Date.now()}${Math.random().toString(36).slice(2, 9)}`,
                      content,
                      createdAt: new Date().toISOString()
                    };
                    updateClient({
                      ...selectedClient,
                      historyNotes: [...(selectedClient.historyNotes || []), newNote]
                    });
                  }}
                  onDeleteNote={(noteId) => {
                    updateClient({
                      ...selectedClient,
                      historyNotes: (selectedClient.historyNotes || []).filter(n => n.id !== noteId)
                    });
                  }}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900 text-lg">Operaciones Relacionadas</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setSaleModalMode('create'); setSelectedSaleForModal(undefined); setIsSaleModalOpen(true); }}>
                    <Plus size={14} className="mr-1" /> Nueva Venta
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setRentalModalMode('create'); setSelectedRentalForModal(undefined); setIsRentalModalOpen(true); }}>
                    <Plus size={14} className="mr-1" /> Nuevo Alquiler
                  </Button>
                </div>
              </div>
              {clientSales.length === 0 && clientRentals.length === 0 ? (
                <p className="text-sm text-gray-400 italic py-4">Sin operaciones relacionadas.</p>
              ) : (
                <>
                  {clientSales.map(sale => (
                    <React.Fragment key={sale.id}>
                      <Card className="border-blue-100 cursor-pointer hover:shadow-md transition-all">
                        <div onClick={() => { setSelectedSaleForModal(sale); setSaleModalMode('view'); setIsSaleModalOpen(true); }}>
                          <div className="flex items-center justify-between">
                            <div>
                              <Badge variant="blue">Venta</Badge>
                              <span className="ml-2 text-sm font-medium text-gray-700">{sale.estado}</span>
                              <p className="text-sm text-gray-500 mt-1">Propiedad: {sale.propiedadId}</p>
                            </div>
                            <ChevronRight size={16} className="text-gray-300" />
                          </div>
                        </div>
                      </Card>
                    </React.Fragment>
                  ))}
                  {clientRentals.map(rental => (
                    <React.Fragment key={rental.id}>
                      <Card className="border-green-100 cursor-pointer hover:shadow-md transition-all">
                        <div onClick={() => { setSelectedRentalForModal(rental); setRentalModalMode('view'); setIsRentalModalOpen(true); }}>
                          <div className="flex items-center justify-between">
                            <div>
                              <Badge variant="green">Alquiler</Badge>
                              <span className="ml-2 text-sm font-medium text-gray-700">{rental.estado}</span>
                              <p className="text-sm text-gray-500 mt-1">Propiedad: {rental.propiedadId}</p>
                            </div>
                            <ChevronRight size={16} className="text-gray-300" />
                          </div>
                        </div>
                      </Card>
                    </React.Fragment>
                  ))}
                </>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <Card title="Documentos Relacionados">
              <div className="space-y-3">
                {documents.filter(d => d.clientId === id).length > 0 ? (
                  documents.filter(d => d.clientId === id).slice(0, 4).map(doc => (
                    <div key={doc.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => { setSelectedDocForModal(doc); setDocModalMode('view'); setIsDocModalOpen(true); }}>
                      <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100">
                        <FileText size={18} className="text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">{doc.name}</p>
                        <Badge size="sm" variant={doc.status === 'revisado' ? 'green' : doc.status === 'cargado' ? 'blue' : doc.status === 'vencido' ? 'red' : 'orange'}>{doc.status}</Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-center text-gray-400 py-2 italic">Sin documentos relacionados.</p>
                )}
                {documents.filter(d => d.clientId === id).length > 4 && (
                  <Button variant="ghost" size="sm" className="w-full" onClick={() => { setSelectedDocForModal(undefined); setDocModalMode('create'); setIsDocModalOpen(true); }}>
                    Ver todos ({documents.filter(d => d.clientId === id).length})
                  </Button>
                )}
                <Button variant="outline" size="sm" className="w-full" onClick={() => { setSelectedDocForModal(undefined); setDocModalMode('create'); setIsDocModalOpen(true); }}>
                  <Plus size={14} className="mr-1" /> Subir Documento
                </Button>
              </div>
            </Card>

            <Card title="Acciones Rápidas">
              <div className="space-y-3">
                <Button 
                  variant="primary" 
                  className="w-full"
                  onClick={() => navigate('/agenda', { state: { prefillClientId: id } })}
                >
                  <Calendar size={18} className="mr-2" /> Programar Cita
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/tareas', { state: { prefillClientId: id } })}
                >
                  <MessageCircle size={18} className="mr-2" /> Crear Tarea
                </Button>
              </div>
            </Card>

            <Card title="Información del Cliente">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Creado</span>
                  <span className="font-medium">{formatDate(selectedClient.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tipo</span>
                  <Badge variant={getTypeBadgeVariant(selectedClient.type)}>{selectedClient.type}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Origen</span>
                  <span className="font-medium">{selectedClient.origin}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
        {isFormModalOpen && renderFormModal()}
        <DocumentModal
          isOpen={isDocModalOpen}
          mode={docModalMode}
          document={selectedDocForModal}
          clients={clients}
          properties={properties}
          sales={sales}
          rentals={rentals}
          defaultClientId={id}
          onClose={() => { setIsDocModalOpen(false); setSelectedDocForModal(undefined); }}
          onSave={(doc) => {
            const existing = documents.find(d => d.id === doc.id);
            if (existing) {
              updateDocument(doc);
            } else {
              addDocument(doc);
            }
          }}
          onDelete={(docId) => {
            deleteDocument(docId);
          }}
          onDownload={(doc) => {
            if (doc.fileName) {
              showToast('Descarga simulada: "' + doc.fileName + '". La descarga real se implementará cuando exista almacenamiento de archivos.', 'info');
            } else {
              showToast('Descarga simulada. La descarga real se implementará cuando exista almacenamiento de archivos.', 'info');
            }
          }}
        />
        
        {/* Sale Modal */}
        <SaleModal
          isOpen={isSaleModalOpen}
          mode={saleModalMode}
          sale={selectedSaleForModal}
          clients={clients}
          properties={properties}
          defaultClientId={id}
          onClose={() => { setIsSaleModalOpen(false); setSelectedSaleForModal(undefined); }}
          onSave={(sale) => {
            const existing = sales.find(s => s.id === sale.id);
            if (existing) {
              updateSale(sale);
            } else {
              addSale(sale);
            }
          }}
          onDelete={(saleId) => {
            deleteSale(saleId);
          }}
        />

        {/* Rental Modal */}
        <RentalModal
          isOpen={isRentalModalOpen}
          mode={rentalModalMode}
          rental={selectedRentalForModal}
          clients={clients}
          properties={properties}
          defaultClientId={id}
          onClose={() => { setIsRentalModalOpen(false); setSelectedRentalForModal(undefined); }}
          onSave={(rental) => {
            const existing = rentals.find(r => r.id === rental.id);
            if (existing) {
              updateRental(rental);
            } else {
              addRental(rental);
            }
          }}
          onDelete={(rentalId) => {
            deleteRental(rentalId);
          }}
        />
      </div>
    );
  }

  function renderFormModal() {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsFormModalOpen(false)}></div>
        <div className="bg-white rounded-2xl w-full max-w-2xl relative z-10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white">
            <h2 className="font-bold text-xl text-gray-900">{editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
            <button onClick={() => setIsFormModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[70vh]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-1">Nombre *</label>
                <input 
                  required
                  type="text" 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Teléfono</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                <input 
                  type="email" 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Tipo *</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value as ClientType})}
                >
                  <option value="comprador">Comprador</option>
                  <option value="vendedor">Vendedor</option>
                  <option value="inquilino">Inquilino</option>
                  <option value="propietario">Propietario</option>
                  <option value="inversor">Inversor</option>
                  <option value="interesado">Interesado</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Estado</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value as ClientStatus})}
                >
                  <option value="nuevo">Nuevo</option>
                  <option value="contactado">Contactado</option>
                  <option value="interesado">Interesado</option>
                  <option value="en seguimiento">En Seguimiento</option>
                  <option value="negociación">Negociación</option>
                  <option value="cerrado">Cerrado</option>
                  <option value="perdido">Perdido</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Origen</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={formData.origin}
                  onChange={e => setFormData({...formData, origin: e.target.value as ClientOrigin})}
                >
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Web">Web</option>
                  <option value="Referido">Referido</option>
                  <option value="Llamada">Llamada</option>
                  <option value="Oficina">Oficina</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Presupuesto</label>
                <input 
                  type="number" 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={formData.budget || 0}
                  onChange={e => setFormData({...formData, budget: Number(e.target.value)})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Moneda</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={formData.currency}
                  onChange={e => setFormData({...formData, currency: e.target.value as 'USD' | 'ARS'})}
                >
                  <option value="USD">USD</option>
                  <option value="ARS">ARS</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Zona de Interés</label>
                <input 
                  type="text" 
                  placeholder="Ej: Palermo, Belgrano..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={formData.interestZone || ''}
                  onChange={e => setFormData({...formData, interestZone: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Tipo de Propiedad de Interés</label>
                <input 
                  type="text" 
                  placeholder="Ej: departamento, casa..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={formData.propertyTypeInterest || ''}
                  onChange={e => setFormData({...formData, propertyTypeInterest: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Último Contacto</label>
                <input 
                  type="date" 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={formData.lastContact || ''}
                  onChange={e => setFormData({...formData, lastContact: e.target.value})}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-1">Notas</label>
                <textarea 
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={formData.notes || ''}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                />
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsFormModalOpen(false)}>Cancelar</Button>
              <Button type="submit" variant="primary">{editingClient ? 'Guardar Cambios' : 'Crear Cliente'}</Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-500">Gestión de la cartera de clientes.</p>
        </div>
        <Button variant="primary" onClick={() => handleOpenForm()}>
          <UserPlus size={20} className="mr-2" /> Nuevo Cliente
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar por nombre, teléfono o email..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-10"><Filter size={16} className="mr-2" /> Filtros</Button>
          </div>
        </div>

        <div className="divide-y divide-gray-50">
          {filteredClients.map((client) => (
            <div 
              key={client.id} 
              className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors cursor-pointer group"
              onClick={() => navigate(`/clientes/${client.id}`)}
            >
              <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 text-sm font-bold flex-shrink-0">
                {client.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">{client.name}</p>
                <p className="text-xs text-gray-500 flex items-center gap-3 mt-0.5">
                  <span className="flex items-center"><Phone size={12} className="mr-1" />{client.phone}</span>
                  <span className="flex items-center"><Mail size={12} className="mr-1" />{client.email}</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={getTypeBadgeVariant(client.type)}>{client.type}</Badge>
                <Badge variant={getStatusBadgeVariant(client.status)}>{client.status}</Badge>
                <Badge variant="gray">{client.origin}</Badge>
              </div>
              <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
            </div>
          ))}
        </div>

        {filteredClients.length === 0 && (
          <div className="py-20 text-center">
            <Users size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-500 font-medium">No se encontraron clientes.</p>
          </div>
        )}
      </div>

      {isFormModalOpen && renderFormModal()}
    </div>
  );
}
