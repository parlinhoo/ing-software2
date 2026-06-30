import { useState, useCallback, useEffect } from 'react'
import './App.scss'
import { LoginScreen } from './screens/LoginScreen.tsx'
import { IncidentListScreen } from './screens/IncidentListScreen.tsx'
import { IncidentFormScreen } from './screens/IncidentFormScreen.tsx'
import { IncidentDetailScreen } from './screens/IncidentDetailScreen.tsx'
import { IncidentEditScreen } from './screens/IncidentEditScreen.tsx'
import { InterventionFormScreen } from './screens/InterventionFormScreen.tsx'
import { UserManagementScreen } from './screens/UserManagementScreen.tsx'
import { Toast } from './components/Toast.tsx'
import { TopBar } from './components/TopBar.tsx'
import { RequirePermission } from './components/RequirePermission.tsx'
import { usePermissions } from './hooks/usePermissions.ts'
import { useAuth } from './context/authContext.tsx'
import type { InterventionAPI } from './services/incidentService.ts'

type Screen = 'login' | 'list' | 'form' | 'detail' | 'edit' | 'intervention' | 'users'

function App() {
  const [screen, setScreen] = useState<Screen>('login')
  const [toast, setToast] = useState({ visible: false, message: '' })
  const [activeIncidentId, setActiveIncidentId] = useState<string>('')
  const [activeIncidentDesc, setActiveIncidentDesc] = useState<string>('')
  const [editingIntervention, setEditingIntervention] = useState<InterventionAPI | undefined>(undefined)
  const [detailShowSuccess, setDetailShowSuccess] = useState(false)
  const [pendingRoute, setPendingRoute] = useState(false)
  const [formKey, setFormKey] = useState(0)

  const { can } = usePermissions()
  const { user } = useAuth()

  const showToast = (message: string) => setToast({ visible: true, message })
  const hideToast = useCallback(() => setToast(t => ({ ...t, visible: false })), [])

  // Redirección post-login según el rol (se dispara solo tras un login real)
  useEffect(() => {
    if (pendingRoute && user) {
      if (can('ver_listado_incidentes')) setScreen('list')
      else if (can('crear_incidente')) setScreen('form')
      else if (can('crear_cuentas')) setScreen('users')
      else setScreen('list')
      setPendingRoute(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingRoute, user])

  if (screen === 'login') {
    return (
      <div className="main">
        <div className="login-wrapper">
          <LoginScreen onSuccess={() => setPendingRoute(true)} />
        </div>
      </div>
    )
  }

  return (
    <div className="main">
      <Toast message={toast.message} visible={toast.visible} onHide={hideToast} />
      <TopBar onLogout={() => setScreen('login')} />

      <div key={screen} className="screen-fade">

      {screen === 'list' && (
        <RequirePermission permission="ver_listado_incidentes">
          <IncidentListScreen
            onNew={() => setScreen('form')}
            onDetail={(id) => { setActiveIncidentId(id); setDetailShowSuccess(false); setScreen('detail') }}
          />
        </RequirePermission>
      )}

      {screen === 'form' && (
        <RequirePermission permission="crear_incidente">
          <IncidentFormScreen
            key={formKey}
            onSave={() => {
              showToast('Incidente registrado correctamente')
              // Quien no puede ver el listado (Inspector) se queda en el form, ya limpio.
              if (can('ver_listado_incidentes')) setScreen('list')
              else setFormKey(k => k + 1)
            }}
            onCancel={() => {
              if (can('ver_listado_incidentes')) setScreen('list')
              else setFormKey(k => k + 1)
            }}
          />
        </RequirePermission>
      )}

      {screen === 'detail' && (
        <IncidentDetailScreen
          incidentId={activeIncidentId}
          showSuccess={detailShowSuccess}
          onClose={() => setScreen('list')}
          onEdit={() => setScreen('edit')}
          onIntervention={(desc) => { setActiveIncidentDesc(desc); setEditingIntervention(undefined); setScreen('intervention') }}
          onEditIntervention={(desc, intv) => { setActiveIncidentDesc(desc); setEditingIntervention(intv); setScreen('intervention') }}
        />
      )}

      {screen === 'edit' && (
        <IncidentEditScreen
          incidentId={activeIncidentId}
          onSave={() => { setDetailShowSuccess(true); setScreen('detail') }}
          onCancel={() => setScreen('detail')}
        />
      )}

      {screen === 'intervention' && (
        <RequirePermission permission="agregar_seguimientos">
          <InterventionFormScreen
            incidentId={activeIncidentId}
            incidentDescription={activeIncidentDesc}
            editingIntervention={editingIntervention}
            onSave={() => { setEditingIntervention(undefined); setDetailShowSuccess(false); setScreen('detail') }}
            onCancel={() => { setEditingIntervention(undefined); setScreen('detail') }}
          />
        </RequirePermission>
      )}

      {screen === 'users' && (
        <RequirePermission permission="crear_cuentas">
          <UserManagementScreen />
        </RequirePermission>
      )}

      </div>
    </div>
  )
}

export default App