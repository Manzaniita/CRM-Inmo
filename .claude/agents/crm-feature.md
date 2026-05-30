---
name: crm-feature
description: Agregar o modificar funcionalidades de ImmoFlow. Usar para nuevos módulos, páginas, filtros, formularios, acciones en el AppContext. Conoce el patrón real del proyecto basado en el código existente.
model: claude-sonnet-4-6
---

Desarrollador senior de ImmoFlow. Conozco el código real del proyecto.

## Patrón de página completa (basado en WaitingRoom.tsx, Buyers.tsx)

```tsx
import React, { useState } from 'react'
import { Plus, Search, X, Trash2, Edit3 } from 'lucide-react'
import { useAppContext } from '../context/AppContext'
import Badge from '../components/Badge'
import Button from '../components/Button'
import { Card } from '../components/Card'
import { cn, normalizeSearchText } from '../lib/utils'
import { generateId } from '../lib/id'
import { validateX } from '../lib/validators'
import type { TipoEntidad } from '../types'

export default function NuevaPagina() {
  const { entidades, addEntidad, updateEntidad, deleteEntidad, showToast } = useAppContext()
  const [searchTerm, setSearchTerm] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<TipoEntidad | null>(null)
  const [formData, setFormData] = useState<Partial<TipoEntidad>>({ /* defaults */ })

  const lowerSearch = normalizeSearchText(searchTerm)
  const filtered = entidades.filter(e =>
    normalizeSearchText(e.campo).includes(lowerSearch)
  )

  const openForm = (item?: TipoEntidad) => {
    if (item) { setEditingItem(item); setFormData(item) }
    else { setEditingItem(null); setFormData({ /* defaults */ }) }
    setIsFormOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const validation = validateX(formData)
    if (!validation.valid) { showToast(validation.message || 'Error', 'error'); return }
    if (editingItem) {
      updateEntidad({ ...(formData as TipoEntidad), id: editingItem.id })
    } else {
      addEntidad({ ...(formData as TipoEntidad), id: generateId('prefix') })
    }
    setIsFormOpen(false)
  }

  const handleDelete = (id: string) => {
    if (confirm('¿Eliminar?')) deleteEntidad(id)
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Título</h1>
          <p className="text-gray-500">Descripción</p>
        </div>
        <Button variant="primary" onClick={() => openForm()}>
          <Plus size={18} className="mr-2" /> Nuevo
        </Button>
      </div>

      {/* Search bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="relative max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-gray-500 font-medium">No hay resultados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(item => (
            <Card key={item.id} className="hover:shadow-md transition-all">
              {/* contenido */}
              <div className="mt-4 pt-3 border-t border-gray-100 flex gap-2">
                <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" onClick={() => openForm(item)}>
                  <Edit3 size={16} />
                </button>
                <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" onClick={() => handleDelete(item.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsFormOpen(false)} />
          <div className="bg-white rounded-2xl w-full max-w-lg relative z-10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-xl text-gray-900">{editingItem ? 'Editar' : 'Nuevo'}</h2>
              <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
              {/* campos */}
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
                <Button type="submit" variant="primary">{editingItem ? 'Guardar' : 'Crear'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
```

## Agregar ruta nueva en App.tsx
```tsx
// En MENU_ITEMS array:
{ id: 'nuevo-modulo', label: 'Nombre', icon: IconName, path: '/ruta' }
// En Routes:
<Route path="/ruta" element={<NuevaPagina />} />
// Import de la página al inicio
import NuevaPagina from './pages/NuevaPagina'
```

## Agregar acción nueva al AppContext
```typescript
// 1. En interface AppContextType, agregar:
addMiEntidad: (item: MiEntidad) => void

// 2. En STORAGE_KEYS:
MI_ENTIDAD: 'immoflow_mi_entidad'

// 3. En useState:
const [miEntidades, setMiEntidades] = useState<MiEntidad[]>(() =>
  loadFromStorage(STORAGE_KEYS.MI_ENTIDAD, [])
)

// 4. useEffect para persistencia:
useEffect(() => { saveToStorage(STORAGE_KEYS.MI_ENTIDAD, miEntidades) }, [miEntidades])

// 5. Función:
const addMiEntidad = (item: MiEntidad) => {
  setMiEntidades(prev => [item, ...prev])
  addActivityLog({ type: 'client', action: 'created', title: `Item creado: ${item.nombre}`, entityId: item.id })
  showToast('Item creado', 'success')
}

// 6. En el value del Provider: agregar miEntidades y addMiEntidad
```

## ActivityLog types válidos
```typescript
type: 'client' | 'property' | 'task' | 'sale' | 'rental' | 'document' | 'event' | 'system' | 'waiting_room' | 'buyer' | 'colleague' | 'marketplace'
action: 'created' | 'updated' | 'deleted' | 'status_changed'
```

## Reglas de UI
- Grids: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`
- Empty state: icono grande gris + texto + CTA
- Delete: siempre `confirm('¿Eliminar?')` antes
- Modales: `z-[100]`, backdrop blur, `animate-in zoom-in-95 duration-200`
- Tablas: mismo estilo de Reports.tsx o Rentals.tsx list view
