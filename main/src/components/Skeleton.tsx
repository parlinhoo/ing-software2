type Props = {
  width?: string
  height?: string
  radius?: string
  className?: string
}

export function Skeleton({ width = '100%', height = '1rem', radius = '6px', className = '' }: Props) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius: radius }}
      aria-hidden="true"
    />
  )
}

/** Bloque de skeleton que imita una fila de tabla */
export function SkeletonRow({ cols = 6 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i}><Skeleton height="0.9rem" /></td>
      ))}
    </tr>
  )
}

/** Bloque de skeleton para una tarjeta/sección de detalle */
export function SkeletonCard() {
  return (
    <div className="seccion-card">
      <Skeleton width="40%" height="1.1rem" />
      <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
        <Skeleton height="0.85rem" />
        <Skeleton width="80%" height="0.85rem" />
        <Skeleton width="60%" height="0.85rem" />
        <Skeleton height="0.85rem" />
      </div>
    </div>
  )
}
