import React from "react";
import {
  FileText,
  Search,
  Filter,
  Plus,
  Download,
  MoreHorizontal,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  LayoutGrid,
  List,
  X,
  Edit3,
  Trash2,
  File,
  Paperclip,
  ChevronLeft,
  Calendar,
  User,
  Home,
  Tag,
  FileSignature,
  FileCheck,
} from "lucide-react";
import { useDocuments } from "../hooks/useDocuments";
import { useRentals } from "../hooks/useRentals";
import { useSales } from "../hooks/useSales";
import { useUIStore } from "../stores/uiStore";
import { Document, DocumentType, DocumentStatus } from "../types";
import Badge from "../components/Badge";
import Button from "../components/Button";
import { Card } from "../components/Card";
import { cn, formatDate } from "../lib/utils";
import { generateId } from "../lib/id";
import { validateDocument } from "../lib/validators";
import { useProperties } from "../hooks/useProperties";
import { useClients } from "../hooks/useClients";

const DOCUMENT_TYPES: DocumentType[] = [
  "DNI",
  "Escritura",
  "Contrato",
  "Reserva",
  "Boleto",
  "Garantía",
  "Recibo",
  "Comprobante",
  "Otro",
];

const DOCUMENT_STATUSES: DocumentStatus[] = [
  "pendiente",
  "cargado",
  "revisado",
  "vencido",
];

interface FormData {
  name: string;
  type: DocumentType;
  status: DocumentStatus;
  clientId: string;
  propertyId: string;
  saleId: string;
  rentalId: string;
  notes: string;
}

const emptyFormData: FormData = {
  name: "",
  type: "Otro",
  status: "pendiente",
  clientId: "",
  propertyId: "",
  saleId: "",
  rentalId: "",
  notes: "",
};

function getStatusVariant(status: string): any {
  switch (status) {
    case "revisado":
      return "green";
    case "cargado":
      return "blue";
    case "vencido":
      return "red";
    case "pendiente":
      return "orange";
    default:
      return "gray";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "revisado":
      return CheckCircle2;
    case "cargado":
      return FileCheck;
    case "vencido":
      return AlertCircle;
    case "pendiente":
      return Clock;
    default:
      return FileText;
  }
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return "-";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export default function Documents() {
  const { rentals } = useRentals();
  const { documents, isLoading, addDocument, updateDocument, deleteDocument } =
    useDocuments();
  const { sales } = useSales();
  const { clients } = useClients();
  const { properties } = useProperties();

  const showToast = useUIStore((state) => state.showToast);

  const [view, setView] = React.useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filterType, setFilterType] = React.useState<string>("todos");
  const [filterStatus, setFilterStatus] = React.useState<string>("todos");
  const [isFormModalOpen, setIsFormModalOpen] = React.useState(false);
  const [editingDoc, setEditingDoc] = React.useState<Document | null>(null);
  const [formData, setFormData] = React.useState<FormData>(emptyFormData);
  const [selectedDoc, setSelectedDoc] = React.useState<Document | null>(null);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [deleteConfirmDocId, setDeleteConfirmDocId] = React.useState<
    string | null
  >(null);

  // Filtered documents
  const filteredDocs = documents.filter((d) => {
    const matchesSearch = d.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesType = filterType === "todos" || d.type === filterType;
    const matchesStatus = filterStatus === "todos" || d.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  // Helper functions to get related entity names
  const getClientName = (clientId?: string) => {
    if (!clientId) return null;
    const client = clients.find((c) => c.id === clientId);
    return client ? client.name : null;
  };

  const getPropertyAddress = (propertyId?: string) => {
    if (!propertyId) return null;
    const property = properties.find((p) => p.id === propertyId);
    return property ? property.address + ", " + property.zone : null;
  };

  const getOperationLabel = (saleId?: string, rentalId?: string) => {
    if (saleId) {
      const sale = sales.find((s) => s.id === saleId);
      if (sale) return "Venta #" + sale.id.toUpperCase();
    }
    if (rentalId) {
      const rental = rentals.find((r) => r.id === rentalId);
      if (rental) return "Alquiler #" + rental.id.toUpperCase();
    }
    return null;
  };

  // Open form modal for create/edit
  const openCreateModal = () => {
    setEditingDoc(null);
    setFormData(emptyFormData);
    setSelectedFile(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (doc: Document) => {
    setEditingDoc(doc);
    setFormData({
      name: doc.name,
      type: doc.type,
      status: doc.status,
      clientId: doc.clientId || "",
      propertyId: doc.propertyId || "",
      saleId: doc.saleId || "",
      rentalId: doc.rentalId || "",
      notes: doc.notes || "",
    });
    setIsFormModalOpen(true);
  };

  // Save document (create or update)
  const handleSave = () => {
    const validation = validateDocument({
      name: formData.name,
      type: formData.type,
      status: formData.status,
    });
    if (!validation.valid) {
      showToast(validation.message || "Error de validación", "error");
      return;
    }

    const now = new Date().toISOString().split("T")[0];

    if (editingDoc) {
      updateDocument({
        ...editingDoc,
        name: formData.name.trim(),
        type: formData.type,
        status: formData.status,
        clientId: formData.clientId || undefined,
        propertyId: formData.propertyId || undefined,
        saleId: formData.saleId || undefined,
        rentalId: formData.rentalId || undefined,
        notes: formData.notes || undefined,
      });
    } else {
      const newId = generateId("d");
      const newDoc: Document = {
        id: newId,
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
        fileExtension: selectedFile
          ? selectedFile.name.split(".").pop() || undefined
          : undefined,
        simulatedUrl: selectedFile ? "/documents/" + newId : undefined,
      };
      addDocument(newDoc);
    }

    setIsFormModalOpen(false);
    setFormData(emptyFormData);
    setSelectedFile(null);
    setEditingDoc(null);
  };

  // Delete document
  const handleDelete = (docId: string) => {
    deleteDocument(docId);
    setDeleteConfirmDocId(null);
    if (selectedDoc?.id === docId) setSelectedDoc(null);
  };

  // Simulated download
  const handleSimulatedDownload = (doc: Document) => {
    if (doc.fileName) {
      showToast(
        'Descarga simulada: "' +
          doc.fileName +
          '" (' +
          formatFileSize(doc.fileSize) +
          "). La descarga real se implementará cuando exista almacenamiento de archivos.",
        "info",
      );
    } else {
      showToast(
        "Descarga simulada. La descarga real se implementará cuando exista almacenamiento de archivos.",
        "info",
      );
    }
  };

  const StatusBadgeIcon = selectedDoc
    ? getStatusIcon(selectedDoc.status)
    : FileText;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Documentos
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Repositorio central de archivos y documentación.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-white dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setView("grid")}
              className={cn(
                "p-1.5 rounded-md transition-all",
                view === "grid"
                  ? "bg-blue-100 text-blue-700"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-800/50",
              )}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setView("list")}
              className={cn(
                "p-1.5 rounded-md transition-all",
                view === "list"
                  ? "bg-blue-100 text-blue-700"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-800/50",
              )}
            >
              <List size={18} />
            </button>
          </div>
          <Button variant="primary" onClick={openCreateModal}>
            <Plus size={18} className="mr-2" /> Nuevo Documento
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden p-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
            />
            <input
              type="text"
              placeholder="Buscar por nombre de archivo..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-slate-50 dark:bg-slate-800/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 outline-none min-w-[140px]"
            >
              <option value="todos">Todos los tipos</option>
              {DOCUMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 outline-none min-w-[130px]"
            >
              <option value="todos">Todos los estados</option>
              {DOCUMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      {view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDocs.map((doc) => (
            <div key={doc.id}>
              <div
                onClick={() => setSelectedDoc(doc)}
                className="cursor-pointer"
              >
                <Card
                  className={cn(
                    "p-4 hover:border-blue-200 transition-all group",
                    selectedDoc?.id === doc.id &&
                      "ring-2 ring-blue-500 border-blue-300",
                  )}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                      <FileText size={24} />
                    </div>
                    <div
                      className="flex gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-blue-600 rounded-lg"
                        onClick={() => setSelectedDoc(doc)}
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-blue-600 rounded-lg"
                        onClick={() => handleSimulatedDownload(doc)}
                      >
                        <Download size={16} />
                      </button>
                    </div>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors truncate mb-1">
                    {doc.name}
                  </h4>
                  <div className="flex flex-col gap-2 mb-4">
                    <Badge size="sm" variant="gray" className="w-fit">
                      {doc.type}
                    </Badge>
                    <Badge
                      size="sm"
                      variant={getStatusVariant(doc.status)}
                      className="w-fit"
                    >
                      {doc.status}
                    </Badge>
                  </div>
                  <div className="pt-3 border-t border-gray-50 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock size={10} /> {formatDate(doc.uploadDate)}
                    </span>
                    <span className="text-blue-600/60">
                      {getClientName(doc.clientId)?.split(" ")[0] || "-"}
                    </span>
                  </div>
                </Card>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card className="p-0 overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">
                  Nombre
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">
                  Tipo
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">
                  Relacionado
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">
                  Estado
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">
                  Fecha
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase text-right">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDocs.map((doc) => (
                <tr
                  key={doc.id}
                  className={cn(
                    "hover:bg-slate-50 dark:bg-slate-800/50 transition-colors group cursor-pointer text-sm",
                    selectedDoc?.id === doc.id && "bg-blue-50/50",
                  )}
                  onClick={() => setSelectedDoc(doc)}
                >
                  <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600">
                    {doc.name}
                  </td>
                  <td className="px-6 py-4">
                    <Badge size="sm" variant="gray">
                      {doc.type}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-slate-700 dark:text-slate-300 font-semibold">
                        {getClientName(doc.clientId) || "-"}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        {getPropertyAddress(doc.propertyId) || ""}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={getStatusVariant(doc.status)}>
                      {doc.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">
                    {formatDate(doc.uploadDate)}
                  </td>
                  <td
                    className="px-6 py-4 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <button
                        className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-blue-600 rounded-lg"
                        onClick={() => {
                          setSelectedDoc(doc);
                        }}
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-green-600 rounded-lg"
                        onClick={() => openEditModal(doc)}
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-600 rounded-lg"
                        onClick={() => setDeleteConfirmDocId(doc.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      {filteredDocs.length === 0 && (
        <div className="text-center py-16">
          <FileText
            size={48}
            className="mx-auto text-slate-300 dark:text-slate-600 mb-4"
          />
          <h3 className="text-lg font-bold text-slate-400 dark:text-slate-500 mb-1">
            No hay documentos
          </h3>
          <p className="text-slate-400 dark:text-slate-500 text-sm">
            {searchTerm || filterType !== "todos" || filterStatus !== "todos"
              ? "No se encontraron documentos con los filtros actuales."
              : "Crea tu primer documento para empezar."}
          </p>
        </div>
      )}

      {/* Detail Modal */}
      {selectedDoc && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedDoc(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Detalle del Documento
              </h2>
              <button
                onClick={() => setSelectedDoc(null)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                <X size={20} className="text-slate-500 dark:text-slate-400" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Header info */}
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "w-16 h-16 rounded-2xl flex items-center justify-center",
                    selectedDoc.status === "revisado"
                      ? "bg-green-50 text-green-600"
                      : selectedDoc.status === "cargado"
                        ? "bg-blue-50 text-blue-600"
                        : selectedDoc.status === "vencido"
                          ? "bg-red-50 text-red-600"
                          : "bg-orange-50 text-orange-600",
                  )}
                >
                  <StatusBadgeIcon size={32} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 truncate">
                    {selectedDoc.name}
                  </h3>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="gray">{selectedDoc.type}</Badge>
                    <Badge variant={getStatusVariant(selectedDoc.status)}>
                      {selectedDoc.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Metadata grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* File info */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <File
                      size={14}
                      className="text-slate-400 dark:text-slate-500"
                    />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      Archivo
                    </span>
                  </div>
                  {selectedDoc.fileName ? (
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                        {selectedDoc.fileName}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {formatFileSize(selectedDoc.fileSize)} · .
                        {selectedDoc.fileExtension}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 dark:text-slate-500 italic">
                      Sin archivo adjunto
                    </p>
                  )}
                </div>

                {/* Date info */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar
                      size={14}
                      className="text-slate-400 dark:text-slate-500"
                    />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      Fecha de carga
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {formatDate(selectedDoc.uploadDate)}
                  </p>
                </div>

                {/* Client */}
                {selectedDoc.clientId && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <User
                        size={14}
                        className="text-slate-400 dark:text-slate-500"
                      />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                        Cliente
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {getClientName(selectedDoc.clientId)}
                    </p>
                  </div>
                )}

                {/* Property */}
                {selectedDoc.propertyId && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Home
                        size={14}
                        className="text-slate-400 dark:text-slate-500"
                      />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                        Propiedad
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                      {getPropertyAddress(selectedDoc.propertyId)}
                    </p>
                  </div>
                )}

                {/* Operation */}
                {(selectedDoc.saleId || selectedDoc.rentalId) && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <FileSignature
                        size={14}
                        className="text-slate-400 dark:text-slate-500"
                      />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                        Operación
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {getOperationLabel(
                        selectedDoc.saleId,
                        selectedDoc.rentalId,
                      )}
                    </p>
                  </div>
                )}
              </div>

              {/* Notes */}
              {selectedDoc.notes && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Tag
                      size={14}
                      className="text-slate-400 dark:text-slate-500"
                    />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      Notas
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                    {selectedDoc.notes}
                  </p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleSimulatedDownload(selectedDoc)}
                >
                  <Download size={16} className="mr-2" />
                  Descargar (simulado)
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    openEditModal(selectedDoc);
                    setSelectedDoc(null);
                  }}
                >
                  <Edit3 size={16} className="mr-2" />
                  Editar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {isFormModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setIsFormModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {editingDoc ? "Editar Documento" : "Nuevo Documento"}
              </h2>
              <button
                onClick={() => {
                  setIsFormModalOpen(false);
                  setEditingDoc(null);
                }}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                <X size={20} className="text-slate-500 dark:text-slate-400" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nombre del documento *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Ej: DNI Juan Pérez"
                  className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Type and Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Tipo de documento
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value as DocumentType,
                      })
                    }
                    className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {DOCUMENT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Estado
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as DocumentStatus,
                      })
                    }
                    className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {DOCUMENT_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Related entities */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Cliente relacionado
                  </label>
                  <select
                    value={formData.clientId}
                    onChange={(e) =>
                      setFormData({ ...formData, clientId: e.target.value })
                    }
                    className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Sin cliente</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Propiedad relacionada
                  </label>
                  <select
                    value={formData.propertyId}
                    onChange={(e) =>
                      setFormData({ ...formData, propertyId: e.target.value })
                    }
                    className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Sin propiedad</option>
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} - {p.address}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Venta relacionada
                  </label>
                  <select
                    value={formData.saleId}
                    onChange={(e) =>
                      setFormData({ ...formData, saleId: e.target.value })
                    }
                    className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Sin venta</option>
                    {sales.map((s) => {
                      const clientName =
                        getClientName(s.clientCompradorId) || "Cliente";
                      return (
                        <option key={s.id} value={s.id}>
                          Venta {s.id.toUpperCase()} - {clientName}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Alquiler relacionado
                  </label>
                  <select
                    value={formData.rentalId}
                    onChange={(e) =>
                      setFormData({ ...formData, rentalId: e.target.value })
                    }
                    className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Sin alquiler</option>
                    {rentals.map((r) => {
                      const clientName =
                        getClientName(r.inquilinoId) || "Inquilino";
                      return (
                        <option key={r.id} value={r.id}>
                          Alquiler {r.id.toUpperCase()} - {clientName}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* File selection (simulated) */}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Archivo (simulado)
                </label>
                <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center hover:border-blue-300 transition-colors">
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <Paperclip size={20} className="text-blue-600" />
                      <div className="text-left">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {formatFileSize(selectedFile.size)}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedFile(null)}
                        className="p-1 ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                      >
                        <X
                          size={16}
                          className="text-slate-400 dark:text-slate-500"
                        />
                      </button>
                    </div>
                  ) : (
                    <React.Fragment>
                      <Paperclip
                        size={24}
                        className="mx-auto text-slate-300 dark:text-slate-600 mb-2"
                      />
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                        <span className="text-blue-600 font-semibold cursor-pointer hover:underline">
                          Seleccionar archivo
                        </span>{" "}
                        o arrastrar aquí
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        Solo metadatos simulados - sin almacenamiento real
                      </p>
                      <input
                        type="file"
                        className="hidden"
                        id="fileInput"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setSelectedFile(file);
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() =>
                          document.getElementById("fileInput")?.click()
                        }
                      >
                        Elegir archivo
                      </Button>
                    </React.Fragment>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Notas
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Notas adicionales sobre el documento..."
                  rows={3}
                  className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsFormModalOpen(false);
                    setEditingDoc(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button variant="primary" onClick={handleSave}>
                  {editingDoc ? "Guardar Cambios" : "Crear Documento"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirmDocId && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setDeleteConfirmDocId(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={24} className="text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
                Eliminar Documento
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                ¿Estás seguro de que deseas eliminar este documento? Esta acción
                no se puede deshacer.
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => setDeleteConfirmDocId(null)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="danger"
                  onClick={() => handleDelete(deleteConfirmDocId)}
                >
                  Eliminar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
