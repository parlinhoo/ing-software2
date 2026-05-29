import { useEffect } from 'react'

type Props = {
  isOpen: boolean
  title: string
  onClose: () => void
  autoCloseDuration?: number
}

export function SuccessModal({ isOpen, title, onClose, autoCloseDuration = 2000 }: Props) {
  useEffect(() => {
    if (!isOpen) return
    const timer = setTimeout(onClose, autoCloseDuration)
    return () => clearTimeout(timer)
  }, [isOpen, onClose, autoCloseDuration])

  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-success">
        <div className="success-icon">✓</div>
        <h2 className="success-title">{title}</h2>
      </div>
    </div>
  )
}
