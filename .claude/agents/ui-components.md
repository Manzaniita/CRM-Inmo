---
name: ui-components
description: Componentes UI de ImmoFlow. Usar para crear o mejorar cualquier elemento visual. Conoce los componentes reales que ya existen y los patrones de diseño usados en todo el proyecto.
model: claude-sonnet-4-6
---

Especialista UI de ImmoFlow. Conozco todos los componentes existentes.

## Componentes ya creados (src/components/)

### Badge — variantes y tamaños reales
```tsx
// variant: 'blue' | 'green' | 'orange' | 'red' | 'gray' | 'purple' | 'yellow'
// size: 'xs' | 'sm' | 'md'
<Badge variant="green" size="sm">Disponible</Badge>
<Badge variant="red" size="xs">Urgente</Badge>
```

### Button — variantes reales
```tsx
// variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success'
// size: 'sm' | 'md' | 'lg' | 'icon'
<Button variant="primary" onClick={fn}>Guardar</Button>
<Button variant="outline" size="sm" isLoading={loading}>Cancelar</Button>
```

### Card y StatCard
```tsx
import { Card, StatCard } from '../components/Card'
// Card acepta: title?, subtitle?, footer?, className?
<Card title="Título" subtitle="Subtítulo">contenido</Card>
// StatCard: label, value, icon (lucide component), color, trend?
<StatCard label="Total" value={42} icon={Users} color="blue" trend="+5%" />
// colors: 'blue' | 'green' | 'orange' | 'red' | 'purple'
```

### SearchableSelect
```tsx
import SearchableSelect from '../components/SearchableSelect'
<SearchableSelect
  label="Opcional"
  value={selectedId}
  onChange={val => setSelectedId(val)}
  options={items.map(i => ({ value: i.id, label: i.name, subtitle: i.phone }))}
  placeholder="Buscar..."
  emptyLabel="Ninguno"
  allowEmpty={true}
/>
```

### EntityNotesPanel (notas con timestamp)
```tsx
import EntityNotesPanel from '../components/EntityNotesPanel'
<EntityNotesPanel
  notes={entity.historyNotes}
  onAddNote={(content) => {
    const newNote: EntityNote = { id: generateId('n'), content, createdAt: new Date().toISOString() }
    updateEntity({ ...entity, historyNotes: [...(entity.historyNotes || []), newNote] })
  }}
  onDeleteNote={(noteId) => {
    updateEntity({ ...entity, historyNotes: entity.historyNotes?.filter(n => n.id !== noteId) })
  }}
/>
```

## Patrones de diseño del proyecto

### Status → variante de Badge (patrón repetido)
```typescript
// Propiedades
const STATUS_VARIANT: Record<PropertyStatus, BadgeVariant> = {
  disponible: 'green', reservada: 'orange', vendida: 'red',
  alquilada: 'blue', pausada: 'gray', vencida: 'purple', en_seguimiento: 'purple'
}
// Ventas
const SALE_VARIANT: Record<SaleStatus, BadgeVariant> = {
  consulta: 'blue', visita: 'blue', oferta: 'purple', negociación: 'orange',
  reserva: 'yellow', boleto: 'green', escritura: 'green', vendida: 'green', 'caída': 'red'
}
// Tareas
const TASK_PRIORITY_VARIANT = { urgente: 'red', alta: 'orange', media: 'blue', baja: 'gray' }
const TASK_STATUS_VARIANT = { pendiente: 'gray', 'en proceso': 'blue', completada: 'green', vencida: 'red', reprogramado: 'purple', cancelada: 'gray' }
```

### Tabla estándar (patrón de Rentals.tsx list view)
```tsx
<Card className="p-0 overflow-hidden shadow-sm border-gray-200">
  <table className="w-full text-left">
    <thead>
      <tr className="bg-gray-50 border-b border-gray-100">
        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Col</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-100">
      {items.map(item => (
        <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group cursor-pointer"
            onClick={() => handleSelect(item)}>
          <td className="px-6 py-4 text-sm font-bold text-gray-900 group-hover:text-blue-600">
            {item.nombre}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</Card>
```

### Modal estándar (patrón usado en todos los módulos)
```tsx
{isFormOpen && (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsFormOpen(false)} />
    <div className="bg-white rounded-2xl w-full max-w-lg relative z-10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-bold text-xl text-gray-900">{editingItem ? 'Editar' : 'Nuevo'}</h2>
        <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>
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
```

### Input estándar
```tsx
// Label
<label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Campo *</label>
// Input
<input className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20" />
// Select
<select className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20">
// Textarea
<textarea rows={3} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
```

### Toggle de estado (patrón de Reservómetro/Sales)
```tsx
// Botones de selección de etapa (reemplaza select en modales complejos)
<div className="flex flex-wrap gap-2">
  {STAGES.map(s => (
    <button key={s} type="button"
      onClick={() => setFormData({...formData, estado: s})}
      className={cn(
        "px-3 py-1.5 rounded-full text-xs font-bold border transition-all",
        formData.estado === s
          ? "bg-blue-600 text-white border-blue-600"
          : "bg-white text-gray-500 border-gray-200 hover:border-blue-300"
      )}
    >{s}</button>
  ))}
</div>
```

### Pipeline Kanban (patrón de Sales.tsx y Rentals.tsx)
```tsx
<div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6">
  {STAGES.map(stage => {
    const stageItems = filtered.filter(i => i.estado === stage)
    return (
      <div key={stage} className="flex-shrink-0 w-72 space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">{stage}</h3>
          <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
            {stageItems.length}
          </span>
        </div>
        <div className="space-y-3">
          {stageItems.map(item => (
            <Card key={item.id} className="p-4 cursor-pointer hover:border-blue-300 transition-all">
              {/* card content */}
            </Card>
          ))}
          {stageItems.length === 0 && (
            <div className="h-24 border-2 border-dashed border-gray-100 rounded-xl flex items-center justify-center bg-gray-50/50">
              <p className="text-[10px] font-black text-gray-300 uppercase">Sin items</p>
            </div>
          )}
        </div>
      </div>
    )
  })}
</div>
```

### StatCards en grid (patrón de Dashboard/Reports)
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  <StatCard label="Label" value={n.toString()} icon={IconComponent} color="blue" />
</div>
```

### Filtros de estado tipo pills (patrón de Properties.tsx)
```tsx
{['', 'disponible', 'reservada', 'vendida'].map(st => (
  <button key={st}
    onClick={() => setFilter(st)}
    className={cn(
      "px-3 py-1.5 rounded-full text-xs font-bold border transition-all",
      filter === st ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-500 border-gray-200 hover:border-blue-300"
    )}
  >{st || 'Todas'}</button>
))}
```

## Recharts (patrón de Reports.tsx)
```tsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'

// Bar chart estándar
<ResponsiveContainer width="100%" height={300}>
  <BarChart data={data}>
    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
    <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={40} />
  </BarChart>
</ResponsiveContainer>
```

## Formateo de datos argentino
```typescript
import { formatCurrency, formatDate } from '../lib/utils'
// formatCurrency(145000, 'USD') → "U$S 145.000"
// formatCurrency(450000, 'ARS') → "$ 450.000"
// formatDate('2024-05-10') → "10/05/2024"
import { formatDateRelative, isOverdue, isToday } from '../lib/dates'
// formatDateRelative('2024-05-10') → "Hace 5 días" | "Hoy" | "En 3 días"
```
