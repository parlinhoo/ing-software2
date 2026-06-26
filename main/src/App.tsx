import { useState, useCallback } from 'react'
import './App.scss'
import { LoginScreen } from './screens/LoginScreen.tsx'
import { IncidentListScreen } from './screens/IncidentListScreen.tsx'
import { IncidentFormScreen } from './screens/IncidentFormScreen.tsx'
import { IncidentDetailScreen } from './screens/IncidentDetailScreen.tsx'
import { IncidentEditScreen } from './screens/IncidentEditScreen.tsx'
import { InterventionFormScreen } from './screens/InterventionFormScreen.tsx'
import { UserFormScreen } from './screens/UserFormScreen.tsx'
import { UserManagementScreen } from './screens/UserManagementScreen.tsx'
import { UserDetailScreen } from './screens/UserDetailScreen.tsx'
import { Toast } from './components/Toast.tsx'
import { TopBar } from './components/TopBar.tsx'
import { useAuth } from './hooks/useAuth.ts'
import type { InterventionAPI } from './services/incidentService.ts'
import type { UserListItem } from './services/userService.ts'

type Screen = 'login' | 'list' | 'form' | 'detail' | 'edit' | 'intervention' | 'user-management' | 'user-form' | 'user-detail'

function App() {
  const [screen, setScreen] = useState<Screen>('login')
  const { canViewList, canCreateIncident, canManageInterventions, canCreateUsers } = useAuth()
  const [toast, setToast] = useState({ visible: false, message: '' })
  const [activeIncidentId, setActiveIncidentId] = useState<string>('')
  const [activeIncidentDesc, setActiveIncidentDesc] = useState<string>('')
  const [editingIntervention, setEditingIntervention] = useState<InterventionAPI | undefined>(undefined)
  const [detailShowSuccess, setDetailShowSuccess] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserListItem | undefined>(undefined)
  const [userMgmtRefresh, setUserMgmtRefresh] = useState(0)

  const showToast = (message: string) => setToast({ visible: true, message })
  const hideToast = useCallback(() => setToast(t => ({ ...t, visible: false })), [])

  function resolveScreen(): Screen {
    if (screen === 'login') return 'login'
    if (screen === 'list' && !canViewList) return canCreateUsers ? 'user-management' : 'login'
    if (screen === 'form' && !canCreateIncident) return 'list'
    if (screen === 'intervention' && !canManageInterventions) return 'detail'
    if ((screen === 'user-form' || screen === 'user-management' || screen === 'user-detail') && !canCreateUsers) return 'list'
    return screen
  }
  const activeScreen = resolveScreen()

  if (activeScreen === 'login') {
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
      <TopBar onLogout={() => setScreen('login')} />

      <div key={activeScreen} className="screen-fade">

      {activeScreen === 'list' && (
        <IncidentListScreen
          onNew={() => setScreen('form')}
          onDetail={(id) => { setActiveIncidentId(id); setDetailShowSuccess(false); setScreen('detail') }}
          onNewUser={() => setScreen('user-management')}
        />
      )}

      {activeScreen === 'form' && (
        <IncidentFormScreen
          onSave={() => { setScreen('list'); showToast('Incidente registrado correctamente') }}
          onCancel={() => setScreen('list')}
        />
      )}

      {activeScreen === 'detail' && (
        <IncidentDetailScreen
          incidentId={activeIncidentId}
          showSuccess={detailShowSuccess}
          onClose={() => setScreen('list')}
          onEdit={() => setScreen('edit')}
          onIntervention={(desc) => { setActiveIncidentDesc(desc); setEditingIntervention(undefined); setScreen('intervention') }}
          onEditIntervention={(desc, intv) => { setActiveIncidentDesc(desc); setEditingIntervention(intv); setScreen('intervention') }}
        />
      )}

      {activeScreen === 'edit' && (
        <IncidentEditScreen
          incidentId={activeIncidentId}
          onSave={() => { setDetailShowSuccess(true); setScreen('detail') }}
          onCancel={() => setScreen('detail')}
        />
      )}

      {activeScreen === 'intervention' && (
        <InterventionFormScreen
          incidentId={activeIncidentId}
          incidentDescription={activeIncidentDesc}
          editingIntervention={editingIntervention}
          onSave={() => { setEditingIntervention(undefined); setScreen('detail') }}
          onCancel={() => { setEditingIntervention(undefined); setScreen('detail') }}
        />
      )}

      {activeScreen === 'user-management' && (
        <UserManagementScreen
          onNewUser={() => setScreen('user-form')}
          onViewUser={(u) => { setSelectedUser(u); setScreen('user-detail') }}
          onEditUser={(u) => { setSelectedUser(u); setScreen('user-form') }}
          refreshKey={userMgmtRefresh}
        />
      )}

      {activeScreen === 'user-form' && (
        <UserFormScreen
          editingUser={selectedUser}
          onSave={(wasEditing) => {
            setSelectedUser(undefined)
            setUserMgmtRefresh(k => k + 1)
            setScreen('user-management')
            showToast(wasEditing ? 'Funcionario actualizado correctamente' : 'Usuario creado correctamente')
          }}
          onCancel={() => { setSelectedUser(undefined); setScreen('user-management') }}
        />
      )}

      {activeScreen === 'user-detail' && selectedUser && (
        <UserDetailScreen
          user={selectedUser}
          onEdit={() => setScreen('user-form')}
          onBack={() => { setSelectedUser(undefined); setScreen('user-management') }}
        />
      )}

      </div>
    </div>
  )
}

export default App
