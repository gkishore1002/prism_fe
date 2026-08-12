import { cn } from '@/lib/cn'

interface AvatarProps {
  name: string
  src?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  dark?: boolean
}

const sizeMap = {
  sm: 'w-9 h-9 text-[12px]',
  md: 'w-9 h-9 text-[12px]',
  lg: 'w-11 h-11 text-sm',
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

const gradients = [
  'bg-gradient-to-br from-[#2A7DFF] to-[#0065F3]',
  'bg-gradient-to-br from-[#FF950A] to-[#E88600]',
  'bg-gradient-to-br from-[#0FA96E] to-[#0C8F5C]',
  'bg-gradient-to-br from-[#7C6CF0] to-[#0065F3]',
]

export function Avatar({ name, src, size = 'md', className, dark }: AvatarProps) {
  const colorIndex = name.charCodeAt(0) % gradients.length

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('rounded-full object-cover', sizeMap[size], dark ? 'ring-2 ring-white/20' : 'ring-2 ring-white', className)}
      />
    )
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-display font-semibold text-white',
        sizeMap[size],
        gradients[colorIndex],
        dark ? 'ring-2 ring-white/20' : 'ring-2 ring-white',
        className,
      )}
    >
      {getInitials(name)}
    </div>
  )
}