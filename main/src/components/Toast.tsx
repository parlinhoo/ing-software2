import { useEffect } from 'react'
import { Icon } from './Icon.tsx'
import checkIcon from '../assets/img/check.png'

type Props = {
  message: string
  visible: boolean
  onHide: () => void
}

export function Toast({ message, visible, onHide }: Props) {
  useEffect(() => {
    if (!visible) return
    const t = setTimeout(onHide, 4000)
    return () => clearTimeout(t)
  }, [visible, onHide])

  if (!visible) return null

  return (
    <div className="toast">
      <Icon src={checkIcon} alt="éxito" size="severity" />
      {message}
    </div>
  )
}
