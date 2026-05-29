import { useState, useCallback } from 'react'
import './App.scss'
import { LoginScreen } from './screens/LoginScreen.tsx'
import { IncidentListScreen } from './screens/IncidentListScreen.tsx'
import { IncidentFormScreen } from './screens/IncidentFormScreen.tsx'
import { IncidentDetailScreen } from './screens/IncidentDetailScreen.tsx'
import { IncidentEditScreen } from './screens/IncidentEditScreen.tsx'
import { Toast } from './components/Toast.tsx'

type Screen = 'login' | 'list' | 'form' | 'detail' | 'edit'

function App() {
  const [screen, setScreen] = useState<Screen>('login')
  const [toast, setToast] = useState({ visible: false, message: '' })
  const [activeIncidentId, setActiveIncidentId] = useState<string>('')
  const [detailShowSuccess, setDetailShowSuccess] = useState(false)

  const showToast = (message: string) => setToast({ visible: true, message })
  const hideToast = useCallback(() => setToast(t => ({ ...t, visible: false })), [])

  if (screen === 'login') {
    return (
      <div className="main">
        <div className="login-wrapper">
          <LoginScreen onLogin={() => setScreen('list')} />
        </div>
      </div>
    )
  }

  return (
    <div className="main">
      <Toast message={toast.message} visible={toast.visible} onHide={hideToast} />

      {screen === 'list' && (
        <IncidentListScreen
          onNew={() => setScreen('form')}
          onDetail={(id) => { setActiveIncidentId(id); setDetailShowSuccess(false); setScreen('detail') }}
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
        />
      )}

      {screen === 'edit' && (
        <IncidentEditScreen
          incidentId={activeIncidentId}
          onSave={() => { setDetailShowSuccess(true); setScreen('detail') }}
          onCancel={() => setScreen('detail')}
        />
      )}
    </div>
  )
}

export default App
