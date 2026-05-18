type IconSize = 'action' | 'sidebar' | 'role' | 'severity'

type Props = {
  src: string
  alt: string
  size?: IconSize
}

const sizeMap: Record<IconSize, number> = {
  action:   20,
  sidebar:  28,
  severity: 20,
  role:     40,
}

export function Icon({ src, alt, size = 'action' }: Props) {
  const px = sizeMap[size]
  return <img src={src} alt={alt} width={px} height={px} className="icon" />
}
