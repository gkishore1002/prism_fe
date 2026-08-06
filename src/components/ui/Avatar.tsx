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
  'bg-gradient-to-br from-indigo-500 to-indigo-700',
  'bg-gradient-to-br from-violet-400 to-indigo-600',
  'bg-gradient-to-br from-sky-400 to-sky-600',
  'bg-gradient-to-br from-indigo-400 to-violet-600',
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