import { cn } from '@/lib/utils'
import * as Icons from 'lucide-react'
import type { Category } from '@notekori/types'

interface Props {
  category: Pick<Category, 'name' | 'icon' | 'color'>
  size?: 'sm' | 'md'
  className?: string
}

export function CategoryBadge({ category, size = 'md', className }: Props) {
  // Dynamically resolve lucide icon
  const iconName = category.icon
    .split('-')
    .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('')

  const IconComponent = (Icons as any)[iconName] ?? Icons.Tag

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
        size === 'sm' && 'px-1.5 py-0.5',
        className,
      )}
      style={{
        backgroundColor: category.color + '1a', // 10% opacity
        color: category.color,
        border: `1px solid ${category.color}33`,
      }}
    >
      <IconComponent className={cn('shrink-0', size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
      {category.name}
    </span>
  )
}
