import React, { useState, useRef, useEffect, useReducer } from 'react';
import { createPortal } from 'react-dom';
import SearchableSelect from '../components/SearchableSelect';
import { 
  Home, 
  Plus, 
  PlusCircle,
  Search, 
  Filter, 
  Maximize2, 
  MapPin, 
  BedDouble, 
  Bath, 
  Square, 
  ExternalLink, 
  ArrowLeft,
  ChevronRight,
  Clipboard,
  Calendar,
  Link as LinkIcon,
  X,
  TrendingUp,
  Key,
  FileText,
  Loader2,
  CheckCircle2,
  MoreVertical,
  Camera,
  Trash2,
  Clock,
  Link2,
  MessageCircle
} from 'lucide-react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import Badge from '../components/Badge';
import Button from '../components/Button';
import { Card } from '../components/Card';
import { cn, formatCurrency, generateWhatsAppLink, formatWhatsAppTemplate, parseRichText } from '../lib/utils';
import { contractTimeRemaining } from '../lib/dates';
import { generateId } from '../lib/id';
import { validateProperty } from '../lib/validators';
import { scrapeProperty } from '../lib/scraper';
import EntityNotesPanel from '../components/EntityNotesPanel';
import DocumentModal from '../components/DocumentModal';
import SaleModal from '../components/SaleModal';
import RentalModal from '../components/RentalModal';
import { Property, PropertyType, PropertyStatus, PropertyOperation, EntityNote, Document, Sale, Rental, Client } from '../types';
import RelationsPanel from '../components/RelationsPanel';
import { getPropertyRelations } from '../lib/relations';
import { useRelationsDrawer } from '../context/RelationsDrawerContext';

export default function Properties() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const propertyIdFromQuery = searchParams.get('propertyId');
  const effectivePropertyId = id || propertyIdFromQuery || undefined;
  const { properties, clients, events, tasks, sales, rentals, documents, referredColleagues, waitingRoom, buyers, activityLogs, profile, addProperty, updateProperty, addSale, updateSale, deleteSale, addRental, updateRental, deleteRental, addDocument, updateDocument, deleteDocument, showToast, addClient, addActivityLog } = useAppContext();
  const { openRelations } = useRelationsDrawer();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOperation, setFilterOperation] = useState<'venta' | 'alquiler' | 'ambas' | ''>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [sortPrice, setSortPrice] = useState<'asc' | 'desc' | ''>('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [saleModalMode, setSaleModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedSaleForModal, setSelectedSaleForModal] = useState<Sale | undefined>(undefined);
  const [isRentalModalOpen, setIsRentalModalOpen] = useState(false);
  const [rentalModalMode, setRentalModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedRentalForModal, setSelectedRentalForModal] = useState<Rental | undefined>(undefined);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [docModalMode, setDocModalMode] = useState<'create' | 'edit' | 'view'>('view');
  const [selectedDocForModal, setSelectedDocForModal] = useState<Document | undefined>(undefined);

  // Quick upload (simple modal)
  const [isQuickUploadOpen, setIsQuickUploadOpen] = useState(false);
  const [quickUploadTitle, setQuickUploadTitle] = useState('');
  const [quickUploadFile, setQuickUploadFile] = useState<File | null>(null);
  const [openMenuPropertyId, setOpenMenuPropertyId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);

  // Captar desde Link states
  const [captureUrl, setCaptureUrl] = useState('');
  const [captureStep, setCaptureStep] = useState<'idle' | 'analyzing' | 'error' | 'manual' | 'preview'>('idle');
  const [captureProgressStep, setCaptureProgressStep] = useState(0);
  const [capturePreview, setCapturePreview] = useState<Partial<Property> | null>(null);
  const [captureManualText, setCaptureManualText] = useState('');
  const [captureErrorMsg, setCaptureErrorMsg] = useState('');

  // Form State
  const [formData, setFormData] = useState<Partial<Property>>({
    title: '',
    type: 'departamento',
    operation: 'venta',
    status: 'disponible',
    address: '',
    zone: '',
    city: '',
    price: 0,
    currency: 'USD',
    bedrooms: 1,
    bathrooms: 1,
    rooms: 1,
    surface: 0,
    externalLink: '',
    propertyLink: '',
    externalSource: '',
    notes: '',
    ownerId: '',
    images: ['https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'],
    code: `P${Math.floor(Math.random() * 1000)}`,
    propertyCode: ''
  });

  // Force re-render every 60s to update contract remaining time
  const [, forceUpdate] = useReducer(x => x + 1, 0);
  useEffect(() => {
    const interval = setInterval(() => forceUpdate(), 60000);
    return () => clearInterval(interval);
  }, []);

  // New owner mini-form state
  const [showNewOwnerForm, setShowNewOwnerForm] = useState(false);
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newOwnerPhone, setNewOwnerPhone] = useState('');
  const [newOwnerEmail, setNewOwnerEmail] = useState('');
  const [newOwnerNotes, setNewOwnerNotes] = useState('');

  const clientOptions = React.useMemo(() => clients.map(c => ({
    value: c.id,
    label: c.name,
    subtitle: c.type
  })), [clients]);

  const selectedProp = properties.find(p => p.id === effectivePropertyId);

  const filteredProps = properties.filter(p => {
    const matchesSearch = 
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.address.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesOperation = !filterOperation || p.operation === filterOperation || (filterOperation === 'ambas' && p.operation === 'ambas') || (filterOperation === 'venta' && p.operation === 'ambas') || (filterOperation === 'alquiler' && p.operation === 'ambas');
    const matchesStatus = !filterStatus || p.status === filterStatus;
    return matchesSearch && matchesOperation && matchesStatus;
  }).sort((a, b) => {
    if (sortPrice === 'asc') return a.price - b.price;
    if (sortPrice === 'desc') return b.price - a.price;
    return 0;
  });

  const handleOpenForm = (prop?: Property) => {
    if (prop) {
      setEditingProperty(prop);
      setFormData(prop);
    } else {
      setEditingProperty(null);
      setFormData({
        title: '',
        type: 'departamento',
        operation: 'venta',
        status: 'disponible',
        address: '',
        zone: '',
        city: '',
        price: 0,
        currency: 'USD',
        bedrooms: 1,
        bathrooms: 1,
        rooms: 1,
        surface: 0,
        externalLink: '',
        propertyLink: '',
        externalSource: '',
        notes: '',
        images: ['https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'],
        code: `P${Math.floor(Math.random() * 1000)}`,
        propertyCode: ''
      });
    }
    setShowNewOwnerForm(false);
    setNewOwnerName('');
    setNewOwnerPhone('');
    setNewOwnerEmail('');
    setNewOwnerNotes('');
    setIsFormModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...formData };
    if (!data.title || !data.title.trim()) {
      data.title = 'Propiedad sin nombre';
    }
    const result = validateProperty(data);
    if (!result.valid) {
      showToast(result.message || 'Error de validación', 'error');
      return;
    }
    if (!data.status) data.status = 'disponible';
    if (!data.operation) data.operation = 'venta';
    if (!data.currency) data.currency = 'USD';

    if (editingProperty) {
      updateProperty(data as Property);
    } else {
      const newProp: Property = {
        ...(data as Property),
        id: generateId('p'),
      };
      addProperty(newProp);
    }
    setIsFormModalOpen(false);
  };

  const handleCreateOwnerFromForm = () => {
    if (!newOwnerName.trim()) {
      showToast('El nombre del dueño es obligatorio', 'error');
      return;
    }
    const newClient: Client = {
      id: generateId('c'),
      name: newOwnerName.trim(),
      phone: newOwnerPhone.trim(),
      email: newOwnerEmail.trim(),
      type: 'propietario',
      types: ['propietario'],
      status: 'nuevo',
      origin: 'Oficina',
      lastContact: new Date().toISOString().split('T')[0],
      notes: newOwnerNotes.trim(),
      createdAt: new Date().toISOString().split('T')[0],
    };
    addClient(newClient);
    setFormData(prev => ({ ...prev, ownerId: newClient.id }));
    addActivityLog({
      type: 'client',
      action: 'created',
      title: `Cliente creado desde propiedad: ${newClient.name}`,
      description: 'Creado como nuevo dueño',
      entityId: newClient.id
    });
    addActivityLog({
      type: 'property',
      action: 'updated',
      title: `Dueño asignado: ${newClient.name}`,
      description: 'Se asignó un nuevo dueño a la propiedad',
      entityId: editingProperty?.id || newClient.id
    });
    showToast('Dueño creado y asignado', 'success');
    setShowNewOwnerForm(false);
    setNewOwnerName('');
    setNewOwnerPhone('');
    setNewOwnerEmail('');
    setNewOwnerNotes('');
  };

  const getStatusVariant = (status: string): any => {
    switch (status) {
      case 'disponible': return 'green';
      case 'reservada': return 'orange';
      case 'vendida': return 'red';
      case 'alquilada': return 'blue';
      case 'pausada': return 'gray';
      case 'vencida': return 'purple';
      case 'en_seguimiento': return 'purple';
      default: return 'gray';
    }
  };

  const getPropertyStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      disponible: 'Disponible',
      reservada: 'Reservada',
      vendida: 'Vendida',
      alquilada: 'Alquilada',
      pausada: 'Pausada',
      vencida: 'Vencida',
      en_seguimiento: 'En seguimiento'
    };
    return labels[status] || status;
  };

  if (selectedProp) {
    const propSales = sales.filter(s => s.propiedadId === id);
    
    // Find interested clients based on zone and budget
    const interestedClients = clients.filter(c => 
      (c.interestZone && selectedProp.zone.toLowerCase().includes(c.interestZone.toLowerCase())) ||
      (c.budget > 0 && Math.abs(c.budget - selectedProp.price) / selectedProp.price < 0.2)
    ).slice(0, 5);

    return (
      <div className="animate-in slide-in-from-right duration-300">
        <button 
          onClick={() => navigate('/propiedades')}
          className="flex items-center text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100 mb-6 transition-colors"
        >
          <ArrowLeft size={16} className="mr-1" /> Volver al listado
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="relative group rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              {(selectedProp.imageUrl || selectedProp.images?.[0]) ? (
                <img src={selectedProp.imageUrl || selectedProp.images?.[0]} alt={selectedProp.title} className="w-full h-[400px] object-cover" />
              ) : (
                <div className="w-full h-[400px] bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Home size={64} className="text-slate-300 dark:text-slate-600" />
                </div>
              )}
              <div className="absolute top-4 left-4 flex gap-2">
                <Badge variant={getStatusVariant(selectedProp.status)} size="md">{getPropertyStatusLabel(selectedProp.status)}</Badge>
                <Badge variant="blue" size="md">{selectedProp.operation}</Badge>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{selectedProp.title}</h1>
                  <p className="flex items-center text-slate-500 dark:text-slate-400 mt-2 font-medium">
                    <MapPin size={18} className="mr-1 text-slate-400 dark:text-slate-500" />
                    {selectedProp.address}, {selectedProp.zone}, {selectedProp.city}
                  </p>
                  {selectedProp.ownerId && (
                    <p className="text-sm text-blue-700 font-medium mt-1">
                      Dueño: {clients.find(c => c.id === selectedProp.ownerId)?.name || 'ID: ' + selectedProp.ownerId}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-4xl font-black text-blue-600">
                    {formatCurrency(selectedProp.price, selectedProp.currency)}
                  </p>
                  <p className="text-sm font-semibold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wider font-black">Ref: {selectedProp.code}</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 mt-8 py-6 border-y border-slate-100 dark:border-slate-800">
                <div className="text-center">
                  <div className="flex items-center justify-center text-slate-400 dark:text-slate-500 mb-1"><BedDouble size={20} /></div>
                  <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{selectedProp.bedrooms}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Dormitorios</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center text-slate-400 dark:text-slate-500 mb-1"><Bath size={20} /></div>
                  <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{selectedProp.bathrooms}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Baños</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center text-slate-400 dark:text-slate-500 mb-1"><Maximize2 size={20} /></div>
                  <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{selectedProp.rooms}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Ambientes</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center text-slate-400 dark:text-slate-500 mb-1"><Square size={20} /></div>
                  <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{selectedProp.surface} m²</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Superficie</p>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-3">Descripción / Notas Internas</h3>
                <div
                  className="text-slate-600 dark:text-slate-400 leading-relaxed italic border-l-4 border-slate-100 dark:border-slate-800 pl-4"
                  dangerouslySetInnerHTML={{ __html: parseRichText(selectedProp.notes || 'Sin descripción adicional.') }}
                />
              </div>

              <div className="mt-8">
                <EntityNotesPanel
                  notes={selectedProp.historyNotes}
                  onAddNote={(content) => {
                    const newNote: EntityNote = {
                      id: generateId('n'),
                      content,
                      createdAt: new Date().toISOString()
                    };
                    updateProperty({
                      ...selectedProp,
                      historyNotes: [...(selectedProp.historyNotes || []), newNote]
                    });
                  }}
                  onDeleteNote={(noteId) => {
                    updateProperty({
                      ...selectedProp,
                      historyNotes: (selectedProp.historyNotes || []).filter(n => n.id !== noteId)
                    });
                  }}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">Operaciones Relacionadas</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setSaleModalMode('create'); setSelectedSaleForModal(undefined); setIsSaleModalOpen(true); }}>
                    <Plus size={14} className="mr-1" /> Nueva Venta
                  </Button>
                </div>
              </div>
              {propSales.length === 0 ? (
                <p className="text-sm text-slate-400 dark:text-slate-500 italic py-4">Sin operaciones relacionadas.</p>
              ) : (
                <>
                  {propSales.map(sale => (
                    <React.Fragment key={sale.id}>
                      <Card className="border-blue-100 cursor-pointer hover:shadow-md transition-all">
                        <div onClick={() => { setSelectedSaleForModal(sale); setSaleModalMode('view'); setIsSaleModalOpen(true); }}>
                          <div className="flex items-center justify-between">
                            <div>
                              <Badge variant="blue">Venta</Badge>
                              <span className="ml-2 text-sm font-medium text-slate-700 dark:text-slate-300">{sale.estado}</span>
                              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Cliente: {clients.find(c => c.id === sale.clientCompradorId)?.name || 'Desconocido'}</p>
                            </div>
                            <ChevronRight size={16} className="text-slate-300 dark:text-slate-600" />
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
            <Card title="Acciones de Propiedad">
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full border-green-200 text-green-700 hover:bg-green-50 dark:hover:bg-slate-800 hover:text-green-800"
                  onClick={() => {
                    const propertyLink = selectedProp.externalLink || selectedProp.propertyLink || '';
                    const msg = formatWhatsAppTemplate(profile.templateProperty, {
                      title: selectedProp.title,
                      address: selectedProp.address,
                      zone: selectedProp.zone,
                      price: formatCurrency(selectedProp.price, selectedProp.currency),
                      link: propertyLink,
                      agentName: profile.name,
                      name: ''
                    });
                    const link = generateWhatsAppLink(profile.phone, msg);
                    window.open(link, '_blank');
                  }}
                >
                  <MessageCircle size={18} className="mr-2" /> Enviar Ficha por WhatsApp
                </Button>
                <Button 
                  variant="primary" 
                  className="w-full"
                  onClick={() => navigate('/agenda', { state: { prefillPropertyId: id } })}
                >
                  <Calendar size={18} className="mr-2" /> Programar Visita
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/tareas', { state: { prefillPropertyId: id } })}
                >
                  <PlusCircle size={18} className="mr-2 text-blue-600" /> Crear Tarea
                </Button>
                <Button variant="ghost" className="w-full border border-slate-100 dark:border-slate-800" onClick={() => handleOpenForm(selectedProp)}>
                  <PlusCircle size={18} className="mr-2" /> Editar Datos
                </Button>
                <div className="grid grid-cols-1 gap-3 pt-2">
                  <Button variant="outline" size="sm" onClick={() => { setSaleModalMode('create'); setSelectedSaleForModal(undefined); setIsSaleModalOpen(true); }}>
                    <Plus size={14} className="mr-1" /> Nueva Venta
                  </Button>
                  <Button variant="ghost" size="sm" className="border border-slate-100 dark:border-slate-800" onClick={() => selectedProp.externalLink && window.open(selectedProp.externalLink, '_blank')}>
                    <ExternalLink size={16} className="mr-2" /> Ver Publicación
                  </Button>
                </div>
              </div>
            </Card>

            <Card title="Agenda Relacionada">
               <div className="space-y-3">
                {events.filter(e => e.propertyId === id).slice(0, 3).map(event => (
                  <div key={event.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer" onClick={() => navigate('/agenda')}>
                    <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800/50 rounded-lg flex flex-col items-center justify-center border border-slate-100 dark:border-slate-800 shrink-0">
                      <span className="text-[8px] font-black uppercase">{event.time}</span>
                      <span className="text-[10px] font-bold">{event.date.split('-')[2]}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{event.title}</p>
                      <Badge variant="blue" size="xs">{event.type}</Badge>
                    </div>
                  </div>
                ))}
                {events.filter(e => e.propertyId === id).length === 0 && (
                  <p className="text-xs text-center text-slate-400 dark:text-slate-500 py-2 italic">Sin eventos.</p>
                )}
              </div>
            </Card>



            <Card title="Clientes con Perfil de Interés">
              <div className="space-y-4">
                {interestedClients.map(client => (
                  <div key={client.id} className="flex items-center gap-3 active:scale-95 transition-transform cursor-pointer group" onClick={() => navigate(`/clientes/${client.id}`)}>
                    <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 flex items-center justify-center text-blue-700 dark:text-blue-400 text-xs font-bold">
                      {client.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 transition-colors">{client.name}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase">{client.status} • {client.type}</p>
                    </div>
                    <ChevronRight size={14} className="text-slate-300 dark:text-slate-600" />
                  </div>
                ))}
                {interestedClients.length === 0 && (
                   <p className="text-xs text-center text-slate-400 dark:text-slate-500 italic">No hay clientes que coincidan con el perfil.</p>
                )}
              </div>
            </Card>

            <Button variant="outline" className="w-full" onClick={() => openRelations('property', selectedProp.id)}>
              <Link2 size={16} className="mr-2" /> Ver vínculos (Vista 360°)
            </Button>
            <RelationsPanel groups={getPropertyRelations(selectedProp.id, { clients, properties, sales, tasks, events, documents, referredColleagues, waitingRoom, buyers, activityLogs })} />
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
          defaultPropertyId={id}
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
          defaultPropertyId={id}
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
          defaultPropertyId={id}
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

        {/* Quick Upload Modal */}
        {isQuickUploadOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setIsQuickUploadOpen(false); setQuickUploadTitle(''); setQuickUploadFile(null); }}></div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md relative z-10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h2 className="font-bold text-lg text-slate-900 dark:text-slate-100">Subir Documento</h2>
                <button onClick={() => { setIsQuickUploadOpen(false); setQuickUploadTitle(''); setQuickUploadFile(null); }} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:text-slate-400"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Título del documento *</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={quickUploadTitle}
                    onChange={e => setQuickUploadTitle(e.target.value)}
                    placeholder="Ej: Escritura, Contrato..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Archivo *</label>
                  <input 
                    type="file" 
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    onChange={e => setQuickUploadFile(e.target.files?.[0] || null)}
                  />
                  {quickUploadFile && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{quickUploadFile.name} ({(quickUploadFile.size / 1024).toFixed(1)} KB)</p>
                  )}
                </div>
              </div>
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <Button variant="ghost" onClick={() => { setIsQuickUploadOpen(false); setQuickUploadTitle(''); setQuickUploadFile(null); }}>Cancelar</Button>
                <Button variant="primary" onClick={() => {
                  if (!quickUploadTitle.trim()) {
                    showToast('El título del documento es obligatorio', 'error');
                    return;
                  }
                  if (!quickUploadFile) {
                    showToast('Debe seleccionar un archivo', 'error');
                    return;
                  }
                  if (!selectedProp) {
                    showToast('No se encontró la propiedad de referencia', 'error');
                    return;
                  }
                  const ext = quickUploadFile.name.includes('.') ? quickUploadFile.name.split('.').pop()?.toLowerCase() || '' : '';
                  const newDoc: Document = {
                    id: generateId('d'),
                    name: quickUploadTitle.trim(),
                    type: 'Otro',
                    status: 'cargado',
                    propertyId: selectedProp.id,
                    uploadDate: new Date().toISOString(),
                    notes: '',
                    fileName: quickUploadFile.name,
                    fileSize: quickUploadFile.size,
                    fileExtension: ext,
                  };
                  addDocument(newDoc);
                  showToast('Documento subido correctamente', 'success');
                  setQuickUploadTitle('');
                  setQuickUploadFile(null);
                  setIsQuickUploadOpen(false);
                }}>Guardar</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderFormModal() {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsFormModalOpen(false)}></div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl relative z-10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-800">
            <h2 className="font-bold text-xl text-slate-900 dark:text-slate-100">{editingProperty ? 'Editar Propiedad' : 'Nueva Propiedad'}</h2>
            <button onClick={() => setIsFormModalOpen(false)} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:text-slate-400"><X size={20} /></button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[70vh]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Nombre</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Tipo *</label>
                <select 
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value as PropertyType})}
                >
                  <option value="departamento">Departamento</option>
                  <option value="casa">Casa</option>
                  <option value="ph">PH</option>
                  <option value="lote">Lote</option>
                  <option value="local">Local</option>
                  <option value="oficina">Oficina</option>
                  <option value="campos">Campos</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Operación</label>
                <select 
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={formData.operation}
                  onChange={e => setFormData({...formData, operation: e.target.value as PropertyOperation})}
                >
                  <option value="venta">Venta</option>
                  <option value="alquiler">Alquiler</option>
                  <option value="ambas">Ambas</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Estado</label>
                <select 
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value as PropertyStatus})}
                >
                  <option value="disponible">Disponible</option>
                  <option value="reservada">Reservada</option>
                  <option value="vendida">Vendida</option>
                  <option value="alquilada">Alquilada</option>
                  <option value="pausada">Pausada</option>
                  <option value="vencida">Vencida</option>
                  <option value="en_seguimiento">En seguimiento</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Precio</label>
                <input 
                  type="number" 
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Zona / Dirección</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Ciudad</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={formData.city}
                  onChange={e => setFormData({...formData, city: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-3 gap-2 md:col-span-2">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Dorm.</label>
                  <input type="number" className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" value={formData.bedrooms} onChange={e => setFormData({...formData, bedrooms: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Baños</label>
                  <input type="number" className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" value={formData.bathrooms} onChange={e => setFormData({...formData, bathrooms: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Superficie</label>
                  <input type="number" className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" value={formData.surface} onChange={e => setFormData({...formData, surface: Number(e.target.value)})} />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Imagen principal</label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center overflow-hidden">
                    {formData.imageUrl || (formData.images && formData.images[0]) ? (
                      <img src={formData.imageUrl || formData.images?.[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Camera size={24} className="text-slate-300 dark:text-slate-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 2 * 1024 * 1024) {
                          showToast('La imagen es demasiado pesada. Máximo 2 MB.', 'error');
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = () => {
                          setFormData({...formData, imageUrl: reader.result as string});
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Máximo 2 MB. Se guarda como base64.</p>
                  </div>
                  {(formData.imageUrl || formData.images?.[0]) && (
                    <button
                      type="button"
                      className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      onClick={() => setFormData({...formData, imageUrl: undefined, images: []})}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Link</label>
                <input 
                  type="text" 
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={formData.propertyLink || ''}
                  onChange={e => setFormData({...formData, propertyLink: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">ID / Código</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={formData.propertyCode || ''}
                  onChange={e => setFormData({...formData, propertyCode: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4 md:col-span-2">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Inicio de contrato</label>
                  <input type="date" className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20" value={formData.contractStartDate || ''} onChange={e => setFormData({...formData, contractStartDate: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Fin de contrato</label>
                  <input type="date" className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20" value={formData.contractEndDate || ''} onChange={e => setFormData({...formData, contractEndDate: e.target.value})} />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Notas Internas</label>
                <textarea 
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Dueño (cliente propietario)</label>
                <SearchableSelect
                  placeholder="Seleccionar dueño..."
                  value={formData.ownerId || ''}
                  onChange={value => setFormData({...formData, ownerId: value})}
                  options={clientOptions}
                />
                {!showNewOwnerForm ? (
                  <button
                    type="button"
                    className="mt-2 text-xs font-bold text-blue-600 hover:text-blue-800"
                    onClick={() => setShowNewOwnerForm(true)}
                  >
                    + Crear nuevo dueño
                  </button>
                ) : (
                  <div className="mt-3 p-3 border border-blue-100 rounded-xl bg-blue-50/50 space-y-3">
                    <p className="text-xs font-bold text-blue-700">Nuevo Dueño</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Nombre *"
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                        value={newOwnerName}
                        onChange={e => setNewOwnerName(e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Teléfono"
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                        value={newOwnerPhone}
                        onChange={e => setNewOwnerPhone(e.target.value)}
                      />
                      <input
                        type="email"
                        placeholder="Email"
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                        value={newOwnerEmail}
                        onChange={e => setNewOwnerEmail(e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Notas"
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                        value={newOwnerNotes}
                        onChange={e => setNewOwnerNotes(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button type="button" className="px-3 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700" onClick={handleCreateOwnerFromForm}>Agregar dueño</button>
                      <button type="button" className="px-3 py-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300" onClick={() => setShowNewOwnerForm(false)}>Cancelar</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsFormModalOpen(false)}>Cancelar</Button>
              <Button type="submit" variant="primary">{editingProperty ? 'Guardar Cambios' : 'Crear Propiedad'}</Button>
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Propiedades</h1>
          <p className="text-slate-500">Cartera de propiedades de referencia y captación.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
            <Plus size={20} className="mr-2 text-blue-600" /> Captar desde Link
          </Button>
          <Button variant="primary" onClick={() => handleOpenForm()}>
            <Plus size={20} className="mr-2" /> Nueva Propiedad
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input 
              type="text" 
              placeholder="Buscar por dirección, zona o título..." 
              className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none bg-white dark:bg-slate-800"
              value={filterOperation}
              onChange={e => setFilterOperation(e.target.value as 'venta' | 'alquiler' | 'ambas' | '')}
            >
              <option value="">Todas las operaciones</option>
              <option value="venta">Venta</option>
              <option value="alquiler">Alquiler</option>
              <option value="ambas">Ambas</option>
            </select>
            <div className="flex gap-1 flex-wrap">
              {[
                { value: '', label: 'Todas' },
                { value: 'disponible', label: 'Disponible' },
                { value: 'reservada', label: 'Reservada' },
                { value: 'vendida', label: 'Vendida' },
                { value: 'alquilada', label: 'Alquilada' },
                { value: 'pausada', label: 'Pausada' },
                { value: 'vencida', label: 'Vencida' },
                { value: 'en_seguimiento', label: 'En seguimiento' }
              ].map(st => (
                <button
                  key={st.value || 'all'}
                  type="button"
                  onClick={() => setFilterStatus(st.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-bold border transition-all",
                    filterStatus === st.value
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-blue-300"
                  )}
                >
                  {st.label}
                </button>
              ))}
            </div>
            <select
              className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none bg-white dark:bg-slate-800"
              value={sortPrice}
              onChange={e => setSortPrice(e.target.value as 'asc' | 'desc' | '')}
            >
              <option value="">Ordenar por precio</option>
              <option value="asc">Precio: menor a mayor</option>
              <option value="desc">Precio: mayor a menor</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 p-6">
          {filteredProps.map((prop) => {
            const remaining = contractTimeRemaining(prop.contractEndDate);
            const imgSrc = prop.imageUrl || (prop.images && prop.images[0]) || '';
            return (
              <div
                key={prop.id}
                className="group bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden hover:shadow-lg transition-all cursor-pointer relative"
                onClick={() => navigate(`/propiedades/${prop.id}`)}
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  {imgSrc ? (
                    <img
                      src={imgSrc}
                      alt=""
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <Home size={32} className="text-slate-300 dark:text-slate-600" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2 shadow-sm">
                    <Badge variant={getStatusVariant(prop.status)}>{getPropertyStatusLabel(prop.status)}</Badge>
                  </div>
                  {/* 3-dots menu + 360 button + WhatsApp */}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button
                      className="p-1.5 bg-white/90 backdrop-blur rounded-md shadow-sm hover:bg-green-50 dark:hover:bg-slate-800 transition-colors"
                      onClick={e => {
                        e.stopPropagation();
                        const propertyLink = prop.externalLink || prop.propertyLink || '';
                        const msg = formatWhatsAppTemplate(profile.templateProperty, {
                          title: prop.title,
                          address: prop.address,
                          zone: prop.zone,
                          price: formatCurrency(prop.price, prop.currency),
                          link: propertyLink,
                          agentName: profile.name,
                          name: ''
                        });
                        const link = generateWhatsAppLink(profile.phone, msg);
                        window.open(link, '_blank');
                      }}
                      title="Enviar por WhatsApp"
                    >
                      <MessageCircle size={16} className="text-green-600" />
                    </button>
                    <button
                      className="p-1.5 bg-white/90 backdrop-blur rounded-md shadow-sm hover:bg-white dark:hover:bg-slate-800 transition-colors text-[10px] font-bold text-blue-700"
                      onClick={e => {
                        e.stopPropagation();
                        openRelations('property', prop.id);
                      }}
                      title="Ver vínculos"
                    >
                      360°
                    </button>
                    <button
                      className="p-1.5 bg-white/90 backdrop-blur rounded-md shadow-sm hover:bg-white dark:hover:bg-slate-800 transition-colors"
                      onClick={e => {
                        e.stopPropagation();
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        const menuHeight = 280; // aprox height for 7 items + header
                        const spaceBelow = window.innerHeight - rect.bottom;
                        const top = spaceBelow >= menuHeight ? rect.bottom + 4 : Math.max(4, rect.top - menuHeight - 4);
                        const left = Math.min(rect.left - 120, window.innerWidth - 180);
                        setMenuPos({ top, left });
                        setOpenMenuPropertyId(openMenuPropertyId === prop.id ? null : prop.id);
                      }}
                    >
                      <MoreVertical size={16} className="text-slate-600 dark:text-slate-400" />
                    </button>
                    {openMenuPropertyId === prop.id && menuPos && createPortal(
                      <>
                        <div
                          className="fixed inset-0 z-[150]"
                          onClick={e => {
                            e.stopPropagation();
                            setOpenMenuPropertyId(null);
                            setMenuPos(null);
                          }}
                        />
                        <div
                          className="fixed z-[160] w-44 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden max-h-64 overflow-y-auto"
                          style={{ top: menuPos.top, left: menuPos.left }}
                        >
                          <div className="px-3 py-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-gray-50 sticky top-0 bg-white dark:bg-slate-800">
                            Cambiar estado
                          </div>
                          {(['disponible','reservada','vendida','alquilada','pausada','vencida','en_seguimiento'] as PropertyStatus[]).map(st => (
                            <button
                              key={st}
                              className={cn(
                                "w-full text-left px-3 py-2 text-xs font-medium transition-colors",
                                prop.status === st ? "bg-blue-50 text-blue-700" : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                              )}
                              onClick={e => {
                                e.stopPropagation();
                                if (prop.status !== st) {
                                  updateProperty({ ...prop, status: st });
                                  addActivityLog({
                                    type: 'property',
                                    action: 'status_changed',
                                    title: `Estado cambiado: ${prop.title} pasó a ${getPropertyStatusLabel(st)}`,
                                    entityId: prop.id
                                  });
                                  showToast(`Estado cambiado a ${getPropertyStatusLabel(st)}`, 'success');
                                }
                                setOpenMenuPropertyId(null);
                                setMenuPos(null);
                              }}
                            >
                              {getPropertyStatusLabel(st)}
                            </button>
                          ))}
                        </div>
                      </>,
                      document.body
                    )}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 via-black/30 to-transparent">
                    <p className="text-white font-black text-lg drop-shadow-sm">{formatCurrency(prop.price, prop.currency)}</p>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">{prop.type} • {prop.operation}</p>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate group-hover:text-blue-600 transition-colors">{prop.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center mt-1 truncate">
                    <MapPin size={12} className="mr-1 text-slate-400 dark:text-slate-500" /> {prop.zone}, {prop.city}
                  </p>
                  {(prop.propertyCode || prop.code) && (
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-medium">Ref: {prop.propertyCode || prop.code}</p>
                  )}
                  {(prop.propertyLink || prop.externalLink) && (
                    <a
                      href={prop.propertyLink || prop.externalLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-blue-600 hover:underline mt-0.5 block truncate"
                      onClick={e => e.stopPropagation()}
                    >
                      Ver link
                    </a>
                  )}
                  {prop.notes && (
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 truncate">{prop.notes}</p>
                  )}
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                    Dueño: {clients.find(c => c.id === prop.ownerId)?.name || 'Sin dueño asignado'}
                  </p>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50 text-slate-400 dark:text-slate-500">
                    <div className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {getPropertyStatusLabel(prop.status)}
                    </div>
                    <div className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", remaining.expired ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700")}>
                      {remaining.text}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredProps.length === 0 && (
          <div className="py-20 text-center">
            <Home size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              {searchTerm || filterOperation || filterStatus
                ? 'No se encontraron propiedades con los filtros actuales.'
                : 'Todavía no hay propiedades cargadas.'}
            </p>
          </div>
        )}
      </div>

      {isImportModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setIsImportModalOpen(false); setCaptureStep('idle'); setCapturePreview(null); setCaptureUrl(''); setCaptureManualText(''); setCaptureErrorMsg(''); }}></div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl relative z-10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <h2 className="font-bold text-xl text-slate-900 dark:text-slate-100">Captar desde Link</h2>
              <button onClick={() => { setIsImportModalOpen(false); setCaptureStep('idle'); setCapturePreview(null); setCaptureUrl(''); setCaptureManualText(''); setCaptureErrorMsg(''); }} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:text-slate-400"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700 font-medium">
                Extracción automática desde portales inmobiliarios. El sistema detecta precio, zona, ambientes y fotos directamente del link.
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">URL de la publicación</label>
                <div className="relative">
                  <LinkIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  <input 
                    type="text" 
                    placeholder="https://www.zonaprop.com.ar/propiedades/..." 
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={captureUrl}
                    onChange={(e) => setCaptureUrl(e.target.value)}
                    disabled={captureStep !== 'idle'}
                  />
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wider font-bold">Compatible con Zonaprop, Argenprop y Mercado Libre</p>
              </div>
              {captureStep === 'idle' && (
                <Button variant="primary" className="w-full" onClick={async () => {
                  if (!captureUrl || !captureUrl.startsWith('http')) {
                    showToast('Ingresa una URL válida que comience con http', 'error');
                    return;
                  }
                  setCaptureStep('analyzing');
                  setCaptureProgressStep(0);
                  const steps = [
                    'Intentando conexión segura...',
                    'Descargando publicación...',
                    'Extrayendo datos estructurados...',
                    'Detectando imágenes...',
                    'Casi listo...'
                  ];
                  steps.forEach((_, i) => {
                    setTimeout(() => setCaptureProgressStep(i + 1), (i + 1) * 500);
                  });
                  try {
                    const res = await fetch(`/api/scrape?url=${encodeURIComponent(captureUrl)}`);
                    const data = await res.json();
                    if (!res.ok || !data.success) {
                      setCaptureErrorMsg(data.error || `Error ${res.status}: El portal bloqueó la conexión.`);
                      setCaptureStep('error');
                      setCaptureProgressStep(0);
                      return;
                    }
                    const scraped = scrapeProperty(data.html, captureUrl);
                    setCapturePreview({
                      ...scraped,
                      code: `P${Math.floor(Math.random() * 1000)}`,
                      status: 'disponible',
                      notes: `Captada automáticamente desde ${scraped.externalSource || 'portal'} el ${new Date().toLocaleDateString('es-AR')}.`,
                    });
                    setCaptureStep('preview');
                  } catch (err: any) {
                    setCaptureErrorMsg(err?.message || 'Error de conexión con el servidor. El portal puede estar bloqueando solicitudes automáticas.');
                    setCaptureStep('error');
                    setCaptureProgressStep(0);
                  }
                }}>
                  Analizar Link
                </Button>
              )}
              {captureStep === 'analyzing' && (
                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                  <div className="flex items-center gap-3 text-sm font-bold text-blue-700">
                    <Loader2 size={20} className="animate-spin" /> Analizando publicación...
                  </div>
                  <div className="space-y-2">
                    {['Intentando conexión segura...', 'Descargando publicación...', 'Extrayendo datos estructurados...', 'Detectando imágenes...', 'Casi listo...'].map((label, i) => (
                      <div key={label} className="flex items-center gap-3">
                        {captureProgressStep > i ? (
                          <CheckCircle2 size={16} className="text-green-500" />
                        ) : captureProgressStep === i ? (
                          <Loader2 size={16} className="animate-spin text-blue-500" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-slate-200 dark:border-slate-700" />
                        )}
                        <span className={cn("text-sm", captureProgressStep > i ? "text-green-700 font-medium" : captureProgressStep === i ? "text-blue-700 font-bold" : "text-slate-400 dark:text-slate-500")}>
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {captureStep === 'error' && (
                <div className="p-6 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-800/30 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-red-100 dark:bg-red-800/30 rounded-lg shrink-0">
                      <X size={20} className="text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-red-800 dark:text-red-300">El portal bloqueó la conexión automática</h4>
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1 leading-relaxed">
                        {captureErrorMsg || 'No se pudo acceder al link automáticamente. Algunos portales (como Zonaprop) protegen sus publicaciones contra bots.'}
                      </p>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-800/50 rounded-lg p-3 border border-red-100 dark:border-slate-700 space-y-2">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">¿Qué podés hacer?</p>
                    <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1 list-disc list-inside">
                      <li>Verificá que el link sea una publicación activa y pública.</li>
                      <li>Probá de nuevo en unos segundos.</li>
                      <li>Usá el <strong>Modo Manual</strong> como fallback infalible.</li>
                    </ul>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => { setCaptureStep('idle'); setCaptureErrorMsg(''); }}>
                      Reintentar
                    </Button>
                    <Button variant="primary" className="flex-1" onClick={() => { setCaptureStep('manual'); setCaptureManualText(''); }}>
                      Modo Manual
                    </Button>
                  </div>
                </div>
              )}
              {captureStep === 'manual' && (
                <div className="space-y-4">
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl">
                    <p className="text-xs text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
                      <strong>Modo de Captación Manual.</strong> Abrí el link en tu navegador, seleccioná todo (<kbd className="px-1 py-0.5 bg-white dark:bg-slate-800 rounded border border-amber-200 dark:border-amber-700 font-mono text-[10px]">Ctrl+A</kbd> + <kbd className="px-1 py-0.5 bg-white dark:bg-slate-800 rounded border border-amber-200 dark:border-amber-700 font-mono text-[10px]">Ctrl+C</kbd> en Zonaprop) y pegalo acá abajo. El sistema extraerá los datos directamente del contenido.
                    </p>
                  </div>
                  <textarea
                    rows={8}
                    placeholder="Pegá acá todo el contenido copiado de la página (Ctrl+V)..."
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50 dark:bg-slate-800/50 font-mono text-xs leading-relaxed resize-y"
                    value={captureManualText}
                    onChange={e => setCaptureManualText(e.target.value)}
                  />
                  <Button
                    variant="primary"
                    className="w-full"
                    disabled={captureManualText.trim().length < 50}
                    onClick={() => {
                      try {
                        const scraped = scrapeProperty(captureManualText, captureUrl);
                        setCapturePreview({
                          ...scraped,
                          code: `P${Math.floor(Math.random() * 1000)}`,
                          status: 'disponible',
                          notes: `Captada manualmente desde ${scraped.externalSource || 'portal'} el ${new Date().toLocaleDateString('es-AR')}.`,
                        });
                        setCaptureStep('preview');
                      } catch (err: any) {
                        showToast('No se pudieron extraer datos del texto pegado. Verificá que sea el contenido completo de la publicación.', 'error');
                      }
                    }}
                  >
                    Procesar contenido pegado
                  </Button>
                </div>
              )}
              {captureStep === 'preview' && capturePreview && (
                <div className="space-y-4 border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50 dark:bg-slate-800/50">
                  <h3 className="font-bold text-slate-900 dark:text-slate-100">Vista Previa de la Propiedad</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">Título</label>
                      <input className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold" value={capturePreview.title || ''} onChange={e => setCapturePreview({...capturePreview, title: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">Tipo</label>
                      <select className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" value={capturePreview.type || 'departamento'} onChange={e => setCapturePreview({...capturePreview, type: e.target.value as PropertyType})}>
                        <option value="departamento">Departamento</option>
                        <option value="casa">Casa</option>
                        <option value="lote">Lote</option>
                        <option value="local">Local</option>
                        <option value="oficina">Oficina</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">Operación</label>
                      <select className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" value={capturePreview.operation || 'venta'} onChange={e => setCapturePreview({...capturePreview, operation: e.target.value as PropertyOperation})}>
                        <option value="venta">Venta</option>
                        <option value="alquiler">Alquiler</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">Precio</label>
                      <input type="number" className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" value={capturePreview.price || 0} onChange={e => setCapturePreview({...capturePreview, price: Number(e.target.value)})} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">Moneda</label>
                      <select className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" value={capturePreview.currency || 'USD'} onChange={e => setCapturePreview({...capturePreview, currency: e.target.value as 'USD' | 'ARS'})}>
                        <option value="USD">USD</option>
                        <option value="ARS">ARS</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">Zona / Dirección</label>
                      <input className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" value={capturePreview.address || ''} onChange={e => setCapturePreview({...capturePreview, address: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">Ciudad</label>
                      <input className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" value={capturePreview.city || ''} onChange={e => setCapturePreview({...capturePreview, city: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">Dormitorios</label>
                      <input type="number" className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" value={capturePreview.bedrooms || 1} onChange={e => setCapturePreview({...capturePreview, bedrooms: Number(e.target.value)})} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">Baños</label>
                      <input type="number" className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" value={capturePreview.bathrooms || 1} onChange={e => setCapturePreview({...capturePreview, bathrooms: Number(e.target.value)})} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">Ambientes</label>
                      <input type="number" className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" value={capturePreview.rooms || 1} onChange={e => setCapturePreview({...capturePreview, rooms: Number(e.target.value)})} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">Superficie (m²)</label>
                      <input type="number" className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" value={capturePreview.surface || 0} onChange={e => setCapturePreview({...capturePreview, surface: Number(e.target.value)})} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">Link Externo</label>
                      <input className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" value={capturePreview.externalLink || ''} onChange={e => setCapturePreview({...capturePreview, externalLink: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">Fuente Externa</label>
                      <input className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" value={capturePreview.externalSource || ''} onChange={e => setCapturePreview({...capturePreview, externalSource: e.target.value})} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">Imágenes detectadas ({(capturePreview.images || []).length})</label>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        {(capturePreview.images || []).map((img, i) => (
                          <img key={i} src={img} alt={`Preview ${i+1}`} className="w-20 h-20 rounded-lg object-cover border border-slate-200 dark:border-slate-700" />
                        ))}
                      </div>
                      {(capturePreview.images || []).length === 0 && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">No se detectaron imágenes automáticamente.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2 shrink-0">
              <Button variant="ghost" onClick={() => { setIsImportModalOpen(false); setCaptureStep('idle'); setCapturePreview(null); setCaptureUrl(''); setCaptureManualText(''); setCaptureErrorMsg(''); }}>Cancelar</Button>
              <Button 
                variant="primary" 
                disabled={captureStep !== 'preview' || !capturePreview}
                onClick={() => {
                  if (!capturePreview) return;
                  const newProp: Property = {
                    ...(capturePreview as Property),
                    id: generateId('p')
                  };
                  addProperty(newProp);
                  showToast('Propiedad captada correctamente', 'success');
                  setIsImportModalOpen(false);
                  setCaptureStep('idle');
                  setCapturePreview(null);
                  setCaptureUrl('');
                  setCaptureManualText('');
                  setCaptureErrorMsg('');
                }}
              >
                Guardar Propiedad
              </Button>
            </div>
          </div>
        </div>
      )}

      {isFormModalOpen && renderFormModal()}
    </div>
  );
}

