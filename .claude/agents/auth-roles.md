---
name: auth-roles
description: Agregar autenticación y roles a ImmoFlow. Actualmente NO tiene login (single user). Usar cuando se quiera agregar: login/registro, protección de rutas, roles de usuario, panel de superadmin. Requiere Supabase instalado primero.
model: claude-sonnet-4-6
---

Especialista en auth de ImmoFlow. Estado actual: SIN autenticación.

## Estado actual del proyecto
- NO hay login, ni AuthContext, ni rutas protegidas
- Un solo usuario (agente único)
- App.tsx tiene directamente el layout con sidebar y rutas
- El botón "Cerrar Sesión" en el sidebar es solo `console.log('Logout')`

## Prerrequisito: Supabase debe estar instalado
Ver agente `/supabase` primero.

## Paso 1 — AuthContext
Crear `src/contexts/AuthContext.tsx`:
```tsx
import { createContext, useContext, useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export interface Profile {
  id: string; nombre: string; email: string
  role: 'agent' | 'admin' | 'superadmin'
}

interface AuthCtx {
  user: User | null; profile: Profile | null
  session: Session | null; loading: boolean
  isSuperAdmin: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthCtx | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session); setUser(session?.user ?? null)
      if (session?.user) loadProfile(session.user.id)
      else setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setSession(session); setUser(session?.user ?? null)
      if (session?.user) loadProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(id: string) {
    const { data } = await supabase.from('profiles').select('*').eq('id', id).single()
    setProfile(data); setLoading(false)
  }

  return (
    <AuthContext.Provider value={{
      user, profile, session, loading,
      isSuperAdmin: profile?.role === 'superadmin',
      signOut: async () => { await supabase.auth.signOut(); setProfile(null) }
    }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth fuera de AuthProvider')
  return ctx
}
```

## Paso 2 — Login page
Crear `src/pages/LoginPage.tsx`:
```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Button from '../components/Button'
import { Home } from 'lucide-react'

export function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
    else navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Home className="text-white" size={20} />
          </div>
          <span className="font-bold text-xl">Immo<span className="text-blue-600">Flow</span></span>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Email</label>
            <input type="email" value={email} required
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Contraseña</label>
            <input type="password" value={password} required
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
          <Button type="submit" variant="primary" className="w-full" isLoading={loading}>
            Ingresar
          </Button>
        </form>
      </div>
    </div>
  )
}
```

## Paso 3 — ProtectedRoute con React Router v7
Crear `src/components/ProtectedRoute.tsx`:
```tsx
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface Props { requiredRole?: 'agent' | 'admin' | 'superadmin' }

export function ProtectedRoute({ requiredRole }: Props) {
  const { user, profile, loading } = useAuth()
  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  if (requiredRole === 'superadmin' && profile?.role !== 'superadmin') {
    return <Navigate to="/dashboard" replace />
  }
  return <Outlet />
}
```

## Paso 4 — Modificar main.tsx
```tsx
// Envolver con AuthProvider
import { AuthProvider } from './contexts/AuthContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>          {/* AGREGAR */}
        <AppProvider>
          <RelationsDrawerProvider>
            <App />
          </RelationsDrawerProvider>
        </AppProvider>
      </AuthProvider>          {/* AGREGAR */}
    </BrowserRouter>
  </StrictMode>
)
```

## Paso 5 — Modificar App.tsx
```tsx
// Agregar rutas en Routes:
import { LoginPage } from './pages/LoginPage'
import { ProtectedRoute } from './components/ProtectedRoute'

// En Routes, envolver las rutas privadas:
<Route element={<ProtectedRoute />}>
  <Route path="/" element={<Navigate to="/dashboard" replace />} />
  <Route path="/dashboard" element={<Dashboard />} />
  {/* ... resto de rutas */}
</Route>
<Route path="/login" element={<LoginPage />} />

// Cambiar el botón de logout en el sidebar:
import { useAuth } from './contexts/AuthContext'
const { signOut } = useAuth()
// onClick={() => signOut()}
```

## Crear primer superadmin (Fernando)
```sql
-- En Supabase SQL Editor, después de registrarte con tu email:
UPDATE profiles SET role = 'superadmin' WHERE email = 'tu@email.com';
```

## Panel superadmin — ver todos los agentes
```tsx
// Componente solo visible para superadmin
import { useAuth } from '../contexts/AuthContext'
const { isSuperAdmin } = useAuth()

// En el sidebar, agregar condicional:
{isSuperAdmin && (
  <Link to="/admin" className="...">Panel Admin</Link>
)}
```
