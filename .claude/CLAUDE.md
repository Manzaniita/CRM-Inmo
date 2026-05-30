# CLAUDE.md — ImmoFlow CRM
# CRM inmobiliario para agentes individuales
# Repo: EstateCRM/ | Branch: master | Deploy: Vercel



## STACK EXACTO
- React 19 + TypeScript + Vite 6
- Tailwind CSS v4 (SIN tailwind.config.js — solo `@import "tailwindcss"` en index.css)
- React Router v7
- lucide-react → íconos (SIEMPRE de acá, nunca emojis)
- motion/react → animaciones (import de "motion/react", no "framer-motion")
- recharts → gráficos (Reports.tsx tiene ejemplos reales)
- clsx + tailwind-merge → cn() en src/lib/utils.ts
- date-fns → fechas + helpers en src/lib/dates.ts
- @google/genai → Gemini (disponible, no implementado aún)
- localStorage → persistencia actual (prefijo "immoflow_")
- Supabase → AÚN NO INSTALADO (futuro)

## ESTADO ACTUAL
- Sin autenticación (single user, sin login)
- Datos en localStorage via loadFromStorage/saveToStorage (src/lib/storage.ts)
- Mock data inicial en src/mockData.ts
- 15 módulos funcionales: Dashboard, Clientes, Propiedades, Agenda, Tareas, Ventas, Alquileres, Documentos, Reportes, Configuración, Sala de Espera, Compradores, Colegas Referidos, Marketplace, Reservómetro

# REGLAS DE ORO DE DESARROLLO - ImmoFlow

## Stack & Estilo
- **Tailwind v4:** PROHIBIDO crear `tailwind.config.js`. Todo vía CSS `@theme` o clases directas.
- **TypeScript:** `strict: true`. NUNCA usar `any`. Interfaces siempre en `src/types.ts`.
- **Utilidades:** Usar siempre `cn()` de `@/lib/utils` para clases condicionales.
- **Iconos:** Únicamente `lucide-react`.
- **Fechas:** Usar `date-fns` con locale `es`.

## Arquitectura de Datos
- **Estado:** Todo pasa por `AppContext.tsx` y se persiste en `localStorage` (hasta migración a Supabase).
- **Componentes:** Reutilizar obligatoriamente `Button`, `Badge` y `Card`.

## Flujo de Trabajo
- Antes de crear una entidad, verificar `src/types.ts`.
- Mantener la lógica de "Vista 360°" al agregar nuevas relaciones.

## PATRÓN CENTRAL — useAppContext()
TODO el estado global pasa por src/context/AppContext.tsx.
```typescript
const { clients, properties, sales, rentals, tasks, events, documents,
        waitingRoom, buyers, referredColleagues, activityLogs,
        addClient, updateClient,
        addProperty, updateProperty,
        addTask, updateTask, completeTask, deleteTask,
        addSale, updateSale, deleteSale,
        addRental, updateRental, deleteRental,
        addDocument, updateDocument, deleteDocument,
        addWaitingRoomEntry, updateWaitingRoomEntry, deleteWaitingRoomEntry,
        addBuyer, updateBuyer, deleteBuyer,
        addReferredColleague, updateReferredColleague, deleteReferredColleague,
        addActivityLog, showToast, resetData, exportData, importData
} = useAppContext()
```

## HELPERS DISPONIBLES
- src/lib/utils.ts → cn(), formatCurrency(), formatDate(), normalizeSearchText()
- src/lib/dates.ts → isOverdue(), isToday(), isWithinNextDays(), daysUntil(), formatDateRelative(), contractTimeRemaining()
- src/lib/id.ts → generateId(prefix?) → usa crypto.randomUUID()
- src/lib/validators.ts → validateClient(), validateProperty(), validateSale(), validateRental(), validateDocument(), validateTask(), validateWaitingRoom(), validateBuyer(), validateReferredColleague()
- src/lib/storage.ts → loadFromStorage(), saveToStorage(), removeFromStorage()
- src/lib/search.ts → searchAll() para búsqueda global
- src/lib/relations.ts → getClientRelations(), getPropertyRelations(), etc.

## COMPONENTES EXISTENTES (src/components/)
Badge, Button, Card/StatCard, SearchableSelect, Toast,
EntityNotesPanel, RelationsPanel, EntityRelationsDrawer,
DocumentModal, SaleModal, RentalModal, GlobalSearch

## REGLAS DE CÓDIGO
- TypeScript estricto, nunca `any`
- Componentes funcionales, sin clases
- Formularios: useState con Partial<Tipo> + handleSubmit
- IDs: siempre generateId('prefijo')
- Validar con validateX() antes de guardar
- Log: addActivityLog({ type, action, title, entityId }) en mutaciones
- Toast: showToast('mensaje', 'success'|'error'|'info'|'warning')
- Íconos: siempre lucide-react
- Clases: siempre cn() para condicionales
- Fechas: date-fns con locale es de 'date-fns/locale'

## AGENTES DISPONIBLES
crm-feature · data-layer · ui-components · supabase · auth-roles

## TOKEN RULES
- /clear entre tareas no relacionadas
- Haiku para edits simples, Sonnet para features nuevas
