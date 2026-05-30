import React, { useState } from 'react';
import { X, FileText, Download, Edit3, Trash2, Paperclip, Calendar, User, Home, Tag, Clock, CheckCircle2, AlertCircle, FileCheck, FileSignature } from 'lucide-react';
import { Document, DocumentType, DocumentStatus, Client, Property, Sale, Rental } from '../types';
import Button from './Button';
import Badge from './Badge';
import SearchableSelect from './SearchableSelect';
import { cn, formatDate } from '../lib/utils';
import { useAppContext } from '../context/AppContext';
import { generateId } from '../lib/id';
import { validateDocument } from '../lib/validators';

type ModalMode = 'create' | 'edit' | 'view';

interface DocumentModalProps {
  isOpen: boolean;
  mode: ModalMode;
  document?: Document;
  clients: Client[];
  properties: Property[];
  sales: Sale[];
  rentals: Rental[];
  defaultClientId?: string;
  defaultPropertyId?: string;
  onClose: () => void;
  onSave: (doc: Document) => void;
  onDelete?: (docId: string) => void;
  onDownload?: (doc: Document) => void;
}

const DOCUMENT_TYPES: DocumentType[] = [
  'DNI', 'Escritura', 'Contrato', 'Reserva', 'Boleto', 'Garantía', 'Recibo', 'Comprobante', 'Otro'
];

const DOCUMENT_STATUSES: DocumentStatus[] = [
  'pendiente', 'cargado', 'revisado', 'vencido'
];

function getStatusVariant(status: string): any {
  switch (status) {
    case 'revisado': return 'green';
    case 'cargado': return 'blue';
    case 'vencido': return 'red';
    case 'pendiente': return 'orange';
    default: return 'gray';
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'revisado': return CheckCircle2;
    case 'cargado': return FileCheck;
    case 'vencido': return AlertCircle;
    case 'pendiente': return Clock;
    default: return FileText;
  }
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '-';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function DocumentModal({
  isOpen,
  mode,
  document,
  clients,
  properties,
  sales,
  rentals,
  defaultClientId,
  defaultPropertyId,
  onClose,
  onSave,
  onDelete,
  onDownload
}: DocumentModalProps) {
  const { showToast } = useAppContext();
  const [formData, setFormData] = useState({
    name: document?.name || '',
    type: document?.type || 'Otro' as DocumentType,
    status: document?.status || 'pendiente' as DocumentStatus,
    clientId: document?.clientId || defaultClientId || '',
    propertyId: document?.propertyId || defaultPropertyId || '',
    saleId: document?.saleId || '',
    rentalId: document?.rentalId || '',
    notes: document?.notes || ''
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isEditing, setIsEditing] = useState(mode === 'edit');

  const clientOptions = clients.map(c => ({
    value: c.id,
    label: c.name,
    subtitle: c.type || c.phone || undefined
  }));

  const propertyOptions = properties.map(p => ({
    value: p.id,
    label: p.title,
    subtitle: [p.address, p.zone].filter(Boolean).join(', ') || undefined
  }));

  React.useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && document) {
        setFormData({
          name: document.name,
          type: document.type,
          status: document.status,
          clientId: document.clientId || '',
          propertyId: document.propertyId || '',
          saleId: document.saleId || '',
          rentalId: document.rentalId || '',
          notes: document.notes || ''
        });
      } else if (mode === 'create') {
        setFormData({
          name: '',
          type: 'Otro',
          status: 'pendiente',
          clientId: defaultClientId || '',
          propertyId: defaultPropertyId || '',
          saleId: '',
          rentalId: '',
          notes: ''
        });
        setSelectedFile(null);
      }
      setIsEditing(mode === 'edit' || mode === 'create');
    }
  }, [isOpen, mode, document, defaultClientId, defaultPropertyId]);

  if (!isOpen) return null;

  const getClientName = (clientId?: string) => {
    if (!clientId) return null;
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : null;
  };

  const getPropertyAddress = (propertyId?: string) => {
    if (!propertyId) return null;
    const property = properties.find(p => p.id === propertyId);
    return property ? property.address + ', ' + property.zone : null;
  };

  const getOperationLabel = (saleId?: string, rentalId?: string) => {
    if (saleId) {
      const sale = sales.find(s => s.id === saleId);
      if (sale) return 'Venta #' + sale.id.toUpperCase();
    }
    if (rentalId) {
      const rental = rentals.find(r => r.id === rentalId);
      if (rental) return 'Alquiler #' + rental.id.toUpperCase();
    }
    return null;
  };

  const handleSubmit = () => {
    const validation = validateDocument({
      name: formData.name,
      type: formData.type,
      status: formData.status
    });
    if (!validation.valid) {
      showToast(validation.message || 'Error de validación', 'error');
      return;
    }

    const now = new Date().toISOString().split('T')[0];

    if (document && (mode === 'edit' || isEditing)) {
      onSave({
        ...document,
        name: formData.name.trim(),
        type: formData.type,
        status: formData.status,
        clientId: formData.clientId || undefined,
        propertyId: formData.propertyId || undefined,
        saleId: formData.saleId || undefined,
        rentalId: formData.rentalId || undefined,
        notes: formData.notes || undefined,
        fileName: selectedFile ? selectedFile.name : document.fileName,
        fileSize: selectedFile ? selectedFile.size : document.fileSize,
        fileExtension: selectedFile ? selectedFile.name.split('.').pop() || document.fileExtension : document.fileExtension,
        simulatedUrl: selectedFile ? '/documents/' + document.id : document.simulatedUrl
      });
    } else {
      const id = generateId('d');
      const newDoc: Document = {
        id,
        name: formData.name.trim(),
        type: formData.type,
        status: formData.status,
        clientId: formData.clientId || undefined,
        propertyId: formData.propertyId || undefined,
        saleId: formData.saleId || undefined,
        rentalId: formData.rentalId || undefined,
        uploadDate: now,
        notes: formData.notes || undefined,
        fileName: selectedFile ? selectedFile.name : undefined,
        fileSize: selectedFile ? selectedFile.size : undefined,
        fileExtension: selectedFile ? selectedFile.name.split('.').pop() || undefined : undefined,
        simulatedUrl: selectedFile ? '/documents/' + id : undefined
      };
      onSave(newDoc);
    }

    onClose();
  };

  const handleDelete = () => {
    if (document && onDelete) {
      if (window.confirm('¿Estás seguro de eliminar este documento?')) {
        onDelete(document.id);
        onClose();
      }
    }
  };

  const handleDownload = () => {
    if (document && onDownload) {
      onDownload(document);
    }
  };

  const StatusBadgeIcon = document ? getStatusIcon(document.status) : FileText;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {mode === 'create' ? 'Nuevo Documento' : isEditing && mode !== 'view' ? 'Editar Documento' : 'Detalle del Documento'}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
            <X size={20} className="text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {mode === 'view' && !isEditing ? (
          <div className="p-6 space-y-6">
            <div className="flex items-start gap-4">
              <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center",
                document?.status === 'revisado' ? 'bg-green-50 text-green-600' :
                document?.status === 'cargado' ? 'bg-blue-50 text-blue-600' :
                document?.status === 'vencido' ? 'bg-red-50 text-red-600' :
                'bg-orange-50 text-orange-600'
              )}>
                <StatusBadgeIcon size={32} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 truncate">{document?.name}</h3>
                <div className="flex gap-2 mt-2">
                  <Badge variant="gray">{document?.type}</Badge>
                  <Badge variant={document ? getStatusVariant(document.status) : 'gray'}>{document?.status}</Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Paperclip size={14} className="text-slate-400 dark:text-slate-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Archivo</span>
                </div>
                {document?.fileName ? (
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{document.fileName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {formatFileSize(document.fileSize)} · .{document.fileExtension}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 dark:text-slate-500 italic">Sin archivo adjunto</p>
                )}
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={14} className="text-slate-400 dark:text-slate-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Fecha de carga</span>
                </div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{document ? formatDate(document.uploadDate) : '-'}</p>
              </div>

              {document?.clientId && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <User size={14} className="text-slate-400 dark:text-slate-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Cliente</span>
                  </div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{getClientName(document.clientId)}</p>
                </div>
              )}

              {document?.propertyId && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Home size={14} className="text-slate-400 dark:text-slate-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Propiedad</span>
                  </div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{getPropertyAddress(document.propertyId)}</p>
                </div>
              )}

              {(document?.saleId || document?.rentalId) && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <FileSignature size={14} className="text-slate-400 dark:text-slate-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Operación</span>
                  </div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {getOperationLabel(document?.saleId, document?.rentalId)}
                  </p>
                </div>
              )}
            </div>

            {document?.notes && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Tag size={14} className="text-slate-400 dark:text-slate-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Notas</span>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">{document.notes}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleDownload}
              >
                <Download size={16} className="mr-2" />
                Descargar (simulado)
              </Button>
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setIsEditing(true)}
              >
                <Edit3 size={16} className="mr-2" />
                Editar
              </Button>
              {onDelete && (
                <Button
                  variant="danger"
                  className="flex-shrink-0"
                  onClick={handleDelete}
                >
                  <Trash2 size={16} />
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-400 dark:text-slate-500 mb-1.5">Nombre del documento *</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: DNI Juan Pérez"
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-400 dark:text-slate-500 mb-1.5">Tipo de documento</label>
                <select
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value as DocumentType })}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {DOCUMENT_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-400 dark:text-slate-500 mb-1.5">Estado</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value as DocumentStatus })}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {DOCUMENT_STATUSES.map(s => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-400 dark:text-slate-500 mb-1.5">Cliente relacionado</label>
                <SearchableSelect
                  placeholder="Seleccionar cliente..."
                  value={formData.clientId}
                  onChange={value => setFormData({ ...formData, clientId: value })}
                  options={clientOptions}
                  emptyLabel="Sin cliente"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-400 dark:text-slate-500 mb-1.5">Propiedad relacionada</label>
                <SearchableSelect
                  placeholder="Seleccionar propiedad..."
                  value={formData.propertyId}
                  onChange={value => setFormData({ ...formData, propertyId: value })}
                  options={propertyOptions}
                  emptyLabel="Sin propiedad"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-400 dark:text-slate-500 mb-1.5">Venta relacionada</label>
                <select
                  value={formData.saleId}
                  onChange={e => setFormData({ ...formData, saleId: e.target.value })}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Sin venta</option>
                  {sales.map(s => {
                    const client = clients.find(c => c.id === s.clientCompradorId);
                    return (
                      <option key={s.id} value={s.id}>Venta {s.id.toUpperCase()} - {client?.name || 'Cliente'}</option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-400 dark:text-slate-500 mb-1.5">Alquiler relacionado</label>
                <select
                  value={formData.rentalId}
                  onChange={e => setFormData({ ...formData, rentalId: e.target.value })}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Sin alquiler</option>
                  {rentals.map(r => {
                    const client = clients.find(c => c.id === r.inquilinoId);
                    return (
                      <option key={r.id} value={r.id}>Alquiler {r.id.toUpperCase()} - {client?.name || 'Inquilino'}</option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-400 dark:text-slate-500 mb-1.5">Archivo (simulado)</label>
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center hover:border-blue-300 transition-colors">
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <Paperclip size={20} className="text-blue-600" />
                    <div className="text-left">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{selectedFile.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{formatFileSize(selectedFile.size)}</p>
                    </div>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="p-1 ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                    >
                      <X size={16} className="text-slate-400 dark:text-slate-500" />
                    </button>
                  </div>
                ) : (
                  <React.Fragment>
                    <Paperclip size={24} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                      <span className="text-blue-600 font-semibold cursor-pointer hover:underline">Seleccionar archivo</span> o arrastrar aquí
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">Solo metadatos simulados - sin almacenamiento real</p>
                    <input
                      type="file"
                      className="hidden"
                      id="fileInputModal"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setSelectedFile(file);
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => window.document.getElementById('fileInputModal')?.click()}
                    >
                      Elegir archivo
                    </Button>
                  </React.Fragment>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-400 dark:text-slate-500 mb-1.5">Notas</label>
              <textarea
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notas adicionales sobre el documento..."
                rows={3}
                className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              {mode === 'view' && (
                <Button variant="ghost" onClick={() => setIsEditing(false)}>
                  Cancelar edición
                </Button>
              )}
              <Button variant="primary" onClick={handleSubmit} className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 border-none text-white shadow-lg shadow-blue-500/25">
                {document ? 'Guardar Cambios' : 'Crear Documento'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}