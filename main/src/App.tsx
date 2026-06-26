import { useState, useCallback } from 'react'
import './App.scss'
import { LoginScreen } from './screens/LoginScreen.tsx'
import { IncidentListScreen } from './screens/IncidentListScreen.tsx'
import { IncidentFormScreen } from './screens/IncidentFormScreen.tsx'
import { IncidentDetailScreen } from './screens/IncidentDetailScreen.tsx'
import { IncidentEditScreen } from './screens/IncidentEditScreen.tsx'
import { InterventionFormScreen } from './screens/InterventionFormScreen.tsx'
import { UserFormScreen } from './screens/UserFormScreen.tsx'
import { Toast } from './components/Toast.tsx'
import { TopBar } from './components/TopBar.tsx'
import type { InterventionAPI } from './services/incidentService.ts'

type Screen = 'login' | 'list' | 'form' | 'detail' | 'edit' | 'intervention' | 'user-form'

function App() {
  const [screen, setScreen] = useState<Screen>('login')
  const [toast, setToast] = useState({ visible: false, message: '' })
  const [activeIncidentId, setActiveIncidentId] = useState<string>('')
  const [activeIncidentDesc, setActiveIncidentDesc] = useState<string>('')
  const [editingIntervention, setEditingIntervention] = useState<InterventionAPI | undefined>(undefined)
  const [detailShowSuccess, setDetailShowSuccess] = useState(false)

  const showToast = (message: string) => setToast({ visible: true, message })
  const hideToast = useCallback(() => setToast(t => ({ ...t, visible: false })), [])

  if (screen === 'login') {
    return (
      <div className="main">
        <div className="login-wrapper">
          <LoginScreen onSuccess={() => setScreen('list')} />
        </div>
      </div>
    )
  }

  return (
    <div className="main">
      <Toast message={toast.message} visible={toast.visible} onHide={hideToast} />
      <TopBar />

      <div key={screen} className="screen-fade">

      {screen === 'list' && (
        <IncidentListScreen
          onNew={() => setScreen('form')}
          onDetail={(id) => { setActiveIncidentId(id); setDetailShowSuccess(false); setScreen('detail') }}
          onNewUser={() => setScreen('user-form')}
        />
      )}

      {screen === 'form' && (
        <IncidentFormScreen
          onSave={() => { setScreen('list'); showToast('Incidente registrado correctamente') }}
          onCancel={() => setScreen('list')}
        />
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
        <InterventionFormScreen
          incidentId={activeIncidentId}
          incidentDescription={activeIncidentDesc}
          editingIntervention={editingIntervention}
          onSave={() => { setEditingIntervention(undefined); setScreen('detail') }}
          onCancel={() => { setEditingIntervention(undefined); setScreen('detail') }}
        />
      )}

      {screen === 'user-form' && (
        <UserFormScreen
          onSave={() => { setScreen('list'); showToast('Usuario creado correctamente') }}
          onCancel={() => setScreen('list')}
        />
      )}

      </div>
    </div>
  )
}

export default App
