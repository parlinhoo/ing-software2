type Props = {
  icon?: string
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon = '📭', title, description, action }: Props) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <p className="empty-state-title">{title}</p>
      {description && <p className="empty-state-desc">{description}</p>}
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  )
}
