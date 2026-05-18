import { useState, useCallback } from 'react'
import './App.scss'
import { LoginScreen } from './screens/LoginScreen.tsx'
import { IncidentListScreen } from './screens/IncidentListScreen.tsx'
import { IncidentFormScreen } from './screens/IncidentFormScreen.tsx'
import { IncidentDetailScreen } from './screens/IncidentDetailScreen.tsx'
import { Toast } from './components/Toast.tsx'

type Screen = 'login' | 'list' | 'form' | 'detail'

function App() {
  const [screen, setScreen] = useState<Screen>('login')
  const [toast, setToast] = useState({ visible: false, message: '' })

  const showToast = (message: string) => setToast({ visible: true, message })
  const hideToast = useCallback(() => setToast(t => ({ ...t, visible: false })), [])

  const handleSave = () => {
    setScreen('detail')
    showToast('Incidente registrado correctamente')
  }

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
          onDetail={() => setScreen('detail')}
        />
      )}
      {screen === 'form' && (
        <IncidentFormScreen
          onSave={handleSave}
          onCancel={() => setScreen('list')}
        />
      )}
      {screen === 'detail' && (
        <IncidentDetailScreen
          onClose={() => setScreen('list')}
          onEdit={() => setScreen('form')}
        />
      )}
    </div>
  )
}

export default App
