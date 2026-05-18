import React, { useState } from 'react';
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
  CheckCircle2
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Property, PropertyType, PropertyStatus, PropertyOperation, EntityNote, Document, Sale, Rental } from '../types';
import Badge from '../components/Badge';
import Button from '../components/Button';
import { Card } from '../components/Card';
import { cn, formatCurrency } from '../lib/utils';
import EntityNotesPanel from '../components/EntityNotesPanel';
import DocumentModal from '../components/DocumentModal';
import SaleModal from '../components/SaleModal';
import RentalModal from '../components/RentalModal';

export default function Properties() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { properties, clients, events, sales, rentals, documents, addProperty, updateProperty, addSale, updateSale, deleteSale, addRental, updateRental, deleteRental, addDocument, updateDocument, deleteDocument, showToast } = useAppContext();
  
  const [searchTerm, setSearchTerm] = useState('');
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

  // Captar desde Link states
  const [captureUrl, setCaptureUrl] = useState('');
  const [captureStep, setCaptureStep] = useState<'idle' | 'analyzing' | 'preview'>('idle');
  const [captureProgressStep, setCaptureProgressStep] = useState(0);
  const [capturePreview, setCapturePreview] = useState<Partial<Property> | null>(null);

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
    externalSource: '',
    notes: '',
    images: ['https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'],
    code: `P${Math.floor(Math.random() * 1000)}`
  });

  const selectedProp = properties.find(p => p.id === id);

  const filteredProps = properties.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.address.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        externalSource: '',
        notes: '',
        images: ['https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'],
        code: `P${Math.floor(Math.random() * 1000)}`
      });
    }
    setIsFormModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return alert('El título es obligatorio');
    
    if (editingProperty) {
      updateProperty(formData as Property);
    } else {
      const newProp: Property = {
        ...(formData as Property),
        id: `p${Date.now()}`,
      };
      addProperty(newProp);
    }
    setIsFormModalOpen(false);
  };

  const getStatusVariant = (status: string): any => {
    switch (status) {
      case 'disponible': return 'green';
      case 'reservada': return 'orange';
      case 'vendida': return 'red';
      case 'alquilada': return 'blue';
      case 'pausada': return 'gray';
      default: return 'gray';
    }
  };

  if (selectedProp) {
    const propSales = sales.filter(s => s.propiedadId === id);
    const propRentals = rentals.filter(r => r.propiedadId === id);
    
    // Find interested clients based on zone and budget
    const interestedClients = clients.filter(c => 
      (c.interestZone && selectedProp.zone.toLowerCase().includes(c.interestZone.toLowerCase())) ||
      (c.budget > 0 && Math.abs(c.budget - selectedProp.price) / selectedProp.price < 0.2)
    ).slice(0, 5);

    return (
      <div className="animate-in slide-in-from-right duration-300">
        <button 
          onClick={() => navigate('/propiedades')}
          className="flex items-center text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft size={16} className="mr-1" /> Volver al listado
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="relative group rounded-2xl overflow-hidden shadow-lg border border-gray-200 bg-white">
              <img src={selectedProp.images[0]} alt={selectedProp.title} className="w-full h-[400px] object-cover" />
              <div className="absolute top-4 left-4 flex gap-2">
                <Badge variant={getStatusVariant(selectedProp.status)} size="md">{selectedProp.status}</Badge>
                <Badge variant="blue" size="md">{selectedProp.operation}</Badge>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{selectedProp.title}</h1>
                  <p className="flex items-center text-gray-500 mt-2 font-medium">
                    <MapPin size={18} className="mr-1 text-gray-400" />
                    {selectedProp.address}, {selectedProp.zone}, {selectedProp.city}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-black text-blue-600">
                    {formatCurrency(selectedProp.price, selectedProp.currency)}
                  </p>
                  <p className="text-sm font-semibold text-gray-400 mt-1 uppercase tracking-wider font-black">Ref: {selectedProp.code}</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 mt-8 py-6 border-y border-gray-100">
                <div className="text-center">
                  <div className="flex items-center justify-center text-gray-400 mb-1"><BedDouble size={20} /></div>
                  <p className="text-lg font-bold text-gray-900">{selectedProp.bedrooms}</p>
                  <p className="text-xs text-gray-500 font-medium">Dormitorios</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center text-gray-400 mb-1"><Bath size={20} /></div>
                  <p className="text-lg font-bold text-gray-900">{selectedProp.bathrooms}</p>
                  <p className="text-xs text-gray-500 font-medium">Baños</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center text-gray-400 mb-1"><Maximize2 size={20} /></div>
                  <p className="text-lg font-bold text-gray-900">{selectedProp.rooms}</p>
                  <p className="text-xs text-gray-500 font-medium">Ambientes</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center text-gray-400 mb-1"><Square size={20} /></div>
                  <p className="text-lg font-bold text-gray-900">{selectedProp.surface} m²</p>
                  <p className="text-xs text-gray-500 font-medium">Superficie</p>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="font-bold text-gray-900 mb-3">Descripción / Notas Internas</h3>
                <p className="text-gray-600 leading-relaxed italic border-l-4 border-gray-100 pl-4">
                  "{selectedProp.notes || 'Sin descripción adicional.'}"
                </p>
              </div>

              <div className="mt-8">
                <EntityNotesPanel
                  notes={selectedProp.historyNotes}
                  onAddNote={(content) => {
                    const newNote: EntityNote = {
                      id: `n${Date.now()}${Math.random().toString(36).slice(2, 9)}`,
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
              {propSales.length === 0 && propRentals.length === 0 ? (
                <p className="text-sm text-gray-400 italic py-4">Sin operaciones relacionadas.</p>
              ) : (
                <>
                  {propSales.map(sale => (
                    <React.Fragment key={sale.id}>
                      <Card className="border-blue-100 cursor-pointer hover:shadow-md transition-all">
                        <div onClick={() => { setSelectedSaleForModal(sale); setSaleModalMode('view'); setIsSaleModalOpen(true); }}>
                          <div className="flex items-center justify-between">
                            <div>
                              <Badge variant="blue">Venta</Badge>
                              <span className="ml-2 text-sm font-medium text-gray-700">{sale.estado}</span>
                              <p className="text-sm text-gray-500 mt-1">Cliente: {clients.find(c => c.id === sale.clientCompradorId)?.name || 'Desconocido'}</p>
                            </div>
                            <ChevronRight size={16} className="text-gray-300" />
                          </div>
                        </div>
                      </Card>
                    </React.Fragment>
                  ))}
                  {propRentals.map(rental => (
                    <React.Fragment key={rental.id}>
                      <Card className="border-green-100 cursor-pointer hover:shadow-md transition-all">
                        <div onClick={() => { setSelectedRentalForModal(rental); setRentalModalMode('view'); setIsRentalModalOpen(true); }}>
                          <div className="flex items-center justify-between">
                            <div>
                              <Badge variant="green">Alquiler</Badge>
                              <span className="ml-2 text-sm font-medium text-gray-700">{rental.estado}</span>
                              <p className="text-sm text-gray-500 mt-1">Cliente: {clients.find(c => c.id === rental.inquilinoId)?.name || 'Desconocido'}</p>
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
            <Card title="Acciones de Propiedad">
              <div className="space-y-3">
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
                <Button variant="ghost" className="w-full border border-gray-100" onClick={() => handleOpenForm(selectedProp)}>
                  <PlusCircle size={18} className="mr-2" /> Editar Datos
                </Button>
                <div className="grid grid-cols-1 gap-3 pt-2">
                  <Button variant="outline" size="sm" onClick={() => { setSaleModalMode('create'); setSelectedSaleForModal(undefined); setIsSaleModalOpen(true); }}>
                    <Plus size={14} className="mr-1" /> Nueva Venta
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setRentalModalMode('create'); setSelectedRentalForModal(undefined); setIsRentalModalOpen(true); }}>
                    <Plus size={14} className="mr-1" /> Nuevo Alquiler
                  </Button>
                  <Button variant="ghost" size="sm" className="border border-gray-100" onClick={() => selectedProp.externalLink && window.open(selectedProp.externalLink, '_blank')}>
                    <ExternalLink size={16} className="mr-2" /> Ver Publicación
                  </Button>
                </div>
              </div>
            </Card>

            <Card title="Agenda Relacionada">
               <div className="space-y-3">
                {events.filter(e => e.propertyId === id).slice(0, 3).map(event => (
                  <div key={event.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate('/agenda')}>
                    <div className="w-10 h-10 bg-gray-50 rounded-lg flex flex-col items-center justify-center border border-gray-100 shrink-0">
                      <span className="text-[8px] font-black uppercase">{event.time}</span>
                      <span className="text-[10px] font-bold">{event.date.split('-')[2]}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">{event.title}</p>
                      <Badge variant="blue" size="xs">{event.type}</Badge>
                    </div>
                  </div>
                ))}
                {events.filter(e => e.propertyId === id).length === 0 && (
                  <p className="text-xs text-center text-gray-400 py-2 italic">Sin eventos.</p>
                )}
              </div>
            </Card>

            <Card title="Documentos Relacionados">
              <div className="space-y-3">
                {documents.filter(d => d.propertyId === id).length > 0 ? (
                  documents.filter(d => d.propertyId === id).slice(0, 4).map(doc => (
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
                {documents.filter(d => d.propertyId === id).length > 4 && (
                  <Button variant="ghost" size="sm" className="w-full" onClick={() => { setSelectedDocForModal(undefined); setDocModalMode('create'); setIsDocModalOpen(true); }}>
                    Ver todos ({documents.filter(d => d.propertyId === id).length})
                  </Button>
                )}
                <Button variant="outline" size="sm" className="w-full" onClick={() => { setSelectedDocForModal(undefined); setDocModalMode('create'); setIsDocModalOpen(true); }}>
                  <Plus size={14} className="mr-1" /> Subir Documento
                </Button>
              </div>
            </Card>

            <Card title="Clientes con Perfil de Interés">
              <div className="space-y-4">
                {interestedClients.map(client => (
                  <div key={client.id} className="flex items-center gap-3 active:scale-95 transition-transform cursor-pointer group" onClick={() => navigate(`/clientes/${client.id}`)}>
                    <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold">
                      {client.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">{client.name}</p>
                      <p className="text-[10px] text-gray-500 font-medium uppercase">{client.status} • {client.type}</p>
                    </div>
                    <ChevronRight size={14} className="text-gray-300" />
                  </div>
                ))}
                {interestedClients.length === 0 && (
                   <p className="text-xs text-center text-gray-400 italic">No hay clientes que coincidan con el perfil.</p>
                )}
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
      </div>
    );
  }

  function renderFormModal() {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsFormModalOpen(false)}></div>
        <div className="bg-white rounded-2xl w-full max-w-2xl relative z-10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white">
            <h2 className="font-bold text-xl text-gray-900">{editingProperty ? 'Editar Propiedad' : 'Nueva Propiedad'}</h2>
            <button onClick={() => setIsFormModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[70vh]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-1">Título *</label>
                <input 
                  required
                  type="text" 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Tipo *</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value as PropertyType})}
                >
                  <option value="departamento">Departamento</option>
                  <option value="casa">Casa</option>
                  <option value="lote">Lote</option>
                  <option value="local">Local</option>
                  <option value="oficina">Oficina</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Operación *</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={formData.operation}
                  onChange={e => setFormData({...formData, operation: e.target.value as PropertyOperation})}
                >
                  <option value="venta">Venta</option>
                  <option value="alquiler">Alquiler</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Estado</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value as PropertyStatus})}
                >
                  <option value="disponible">Disponible</option>
                  <option value="reservada">Reservada</option>
                  <option value="vendida">Vendida</option>
                  <option value="alquilada">Alquilada</option>
                  <option value="pausada">Pausada</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Precio</label>
                <input 
                  type="number" 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Zona / Dirección</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Ciudad</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={formData.city}
                  onChange={e => setFormData({...formData, city: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-3 gap-2 md:col-span-2">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Dorm.</label>
                  <input type="number" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" value={formData.bedrooms} onChange={e => setFormData({...formData, bedrooms: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Baños</label>
                  <input type="number" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" value={formData.bathrooms} onChange={e => setFormData({...formData, bathrooms: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Superficie</label>
                  <input type="number" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" value={formData.surface} onChange={e => setFormData({...formData, surface: Number(e.target.value)})} />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-1">Link Externo</label>
                <input 
                  type="text" 
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={formData.externalLink}
                  onChange={e => setFormData({...formData, externalLink: e.target.value})}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-1">Notas Internas</label>
                <textarea 
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                />
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
          <h1 className="text-2xl font-bold text-gray-900">Propiedades</h1>
          <p className="text-gray-500">Cartera de propiedades de referencia y captación.</p>
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

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar por dirección, zona o título..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-10"><Filter size={16} className="mr-2" /> Filtros</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
          {filteredProps.map((prop) => (
            <div 
              key={prop.id} 
              className="group bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-lg transition-all cursor-pointer relative"
              onClick={() => navigate(`/propiedades/${prop.id}`)}
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img 
                  src={prop.images[0]} 
                  alt="" 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                />
                <div className="absolute top-2 left-2 shadow-sm">
                  <Badge variant={getStatusVariant(prop.status)}>{prop.status}</Badge>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
                  <p className="text-white font-black text-lg">{formatCurrency(prop.price, prop.currency)}</p>
                </div>
              </div>
              <div className="p-4">
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">{prop.type} • {prop.operation}</p>
                <h3 className="font-bold text-gray-900 text-sm truncate group-hover:text-blue-600 transition-colors">{prop.title}</h3>
                <p className="text-xs text-gray-500 flex items-center mt-1 truncate">
                  <MapPin size={12} className="mr-1 text-gray-400" /> {prop.zone}, {prop.city}
                </p>
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-50 text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <BedDouble size={14} />
                    <span className="text-xs font-bold text-gray-700">{prop.bedrooms}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Bath size={14} />
                    <span className="text-xs font-bold text-gray-700">{prop.bathrooms}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Square size={14} />
                    <span className="text-xs font-bold text-gray-700">{prop.surface} m²</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProps.length === 0 && (
          <div className="py-20 text-center">
            <Home size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-500 font-medium">No se encontraron propiedades.</p>
          </div>
        )}
      </div>

      {isImportModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setIsImportModalOpen(false); setCaptureStep('idle'); setCapturePreview(null); setCaptureUrl(''); }}></div>
          <div className="bg-white rounded-2xl w-full max-w-2xl relative z-10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
              <h2 className="font-bold text-xl text-gray-900">Captar desde Link</h2>
              <button onClick={() => { setIsImportModalOpen(false); setCaptureStep('idle'); setCapturePreview(null); setCaptureUrl(''); }} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-xs text-yellow-700 font-medium">
                La extracción real desde portales requiere backend/API. Esta versión simula la captación para validar el flujo.
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">URL de la publicación</label>
                <div className="relative">
                  <LinkIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="https://www.zonaprop.com.ar/propiedades/..." 
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={captureUrl}
                    onChange={(e) => setCaptureUrl(e.target.value)}
                    disabled={captureStep !== 'idle'}
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-bold">Compatible con Zonaprop, Argenprop y Mercado Libre</p>
              </div>
              {captureStep === 'idle' && (
                <Button variant="primary" className="w-full" onClick={() => {
                  if (!captureUrl || !captureUrl.startsWith('http')) {
                    showToast('Ingresa una URL válida que comience con http', 'error');
                    return;
                  }
                  setCaptureStep('analyzing');
                  setCaptureProgressStep(0);
                  const steps = [
                    'Validando URL',
                    'Analizando publicación',
                    'Detectando datos principales',
                    'Detectando imágenes',
                    'Generando vista previa'
                  ];
                  steps.forEach((_, i) => {
                    setTimeout(() => setCaptureProgressStep(i + 1), (i + 1) * 600);
                  });
                  setTimeout(() => {
                    setCapturePreview({
                      title: 'Hermoso Departamento en Palermo',
                      type: 'departamento',
                      operation: 'venta',
                      price: 145000,
                      currency: 'USD',
                      address: 'Av. Santa Fe 3200',
                      zone: 'Palermo',
                      city: 'CABA',
                      bedrooms: 2,
                      bathrooms: 2,
                      rooms: 4,
                      surface: 85,
                      externalLink: captureUrl,
                      externalSource: 'Zonaprop',
                      notes: 'Publicación detectada automáticamente. Datos simulados para validación de flujo.',
                      images: [
                        'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
                      ],
                      code: `P${Math.floor(Math.random() * 1000)}`,
                      status: 'disponible'
                    });
                    setCaptureStep('preview');
                  }, steps.length * 600 + 300);
                }}>
                  Analizar Link
                </Button>
              )}
              {captureStep === 'analyzing' && (
                <div className="p-6 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
                  <div className="flex items-center gap-3 text-sm font-bold text-blue-700">
                    <Loader2 size={20} className="animate-spin" /> Analizando publicación...
                  </div>
                  <div className="space-y-2">
                    {['Validando URL', 'Analizando publicación', 'Detectando datos principales', 'Detectando imágenes', 'Generando vista previa'].map((label, i) => (
                      <div key={label} className="flex items-center gap-3">
                        {captureProgressStep > i ? (
                          <CheckCircle2 size={16} className="text-green-500" />
                        ) : captureProgressStep === i ? (
                          <Loader2 size={16} className="animate-spin text-blue-500" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-gray-200" />
                        )}
                        <span className={cn("text-sm", captureProgressStep > i ? "text-green-700 font-medium" : captureProgressStep === i ? "text-blue-700 font-bold" : "text-gray-400")}>
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {captureStep === 'preview' && capturePreview && (
                <div className="space-y-4 border border-gray-200 rounded-xl p-4 bg-gray-50/50">
                  <h3 className="font-bold text-gray-900">Vista Previa de la Propiedad</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase">Título</label>
                      <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold" value={capturePreview.title || ''} onChange={e => setCapturePreview({...capturePreview, title: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase">Tipo</label>
                      <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" value={capturePreview.type || 'departamento'} onChange={e => setCapturePreview({...capturePreview, type: e.target.value as PropertyType})}>
                        <option value="departamento">Departamento</option>
                        <option value="casa">Casa</option>
                        <option value="lote">Lote</option>
                        <option value="local">Local</option>
                        <option value="oficina">Oficina</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase">Operación</label>
                      <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" value={capturePreview.operation || 'venta'} onChange={e => setCapturePreview({...capturePreview, operation: e.target.value as PropertyOperation})}>
                        <option value="venta">Venta</option>
                        <option value="alquiler">Alquiler</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase">Precio</label>
                      <input type="number" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" value={capturePreview.price || 0} onChange={e => setCapturePreview({...capturePreview, price: Number(e.target.value)})} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase">Moneda</label>
                      <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" value={capturePreview.currency || 'USD'} onChange={e => setCapturePreview({...capturePreview, currency: e.target.value as 'USD' | 'ARS'})}>
                        <option value="USD">USD</option>
                        <option value="ARS">ARS</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase">Zona / Dirección</label>
                      <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" value={capturePreview.address || ''} onChange={e => setCapturePreview({...capturePreview, address: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase">Ciudad</label>
                      <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" value={capturePreview.city || ''} onChange={e => setCapturePreview({...capturePreview, city: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase">Dormitorios</label>
                      <input type="number" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" value={capturePreview.bedrooms || 1} onChange={e => setCapturePreview({...capturePreview, bedrooms: Number(e.target.value)})} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase">Baños</label>
                      <input type="number" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" value={capturePreview.bathrooms || 1} onChange={e => setCapturePreview({...capturePreview, bathrooms: Number(e.target.value)})} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase">Ambientes</label>
                      <input type="number" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" value={capturePreview.rooms || 1} onChange={e => setCapturePreview({...capturePreview, rooms: Number(e.target.value)})} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase">Superficie (m²)</label>
                      <input type="number" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" value={capturePreview.surface || 0} onChange={e => setCapturePreview({...capturePreview, surface: Number(e.target.value)})} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase">Link Externo</label>
                      <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" value={capturePreview.externalLink || ''} onChange={e => setCapturePreview({...capturePreview, externalLink: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase">Fuente Externa</label>
                      <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" value={capturePreview.externalSource || ''} onChange={e => setCapturePreview({...capturePreview, externalSource: e.target.value})} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase">Imágenes (placeholders)</label>
                      <div className="flex gap-2 mt-1">
                        {(capturePreview.images || []).map((img, i) => (
                          <img key={i} src={img} alt={`Preview ${i+1}`} className="w-20 h-20 rounded-lg object-cover border border-gray-200" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-2 shrink-0">
              <Button variant="ghost" onClick={() => { setIsImportModalOpen(false); setCaptureStep('idle'); setCapturePreview(null); setCaptureUrl(''); }}>Cancelar</Button>
              <Button 
                variant="primary" 
                disabled={captureStep !== 'preview' || !capturePreview}
                onClick={() => {
                  if (!capturePreview) return;
                  const newProp: Property = {
                    ...(capturePreview as Property),
                    id: `p${Date.now()}`
                  };
                  addProperty(newProp);
                  showToast('Propiedad captada correctamente', 'success');
                  setIsImportModalOpen(false);
                  setCaptureStep('idle');
                  setCapturePreview(null);
                  setCaptureUrl('');
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

