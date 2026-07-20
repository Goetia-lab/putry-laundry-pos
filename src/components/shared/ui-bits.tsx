'use client'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface StatCardProps {
  title: string
  value: string
  subtitle?: string
  icon: LucideIcon
  trend?: string
  trendUp?: boolean
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
  loading?: boolean
}

const variantStyles = {
  default: 'bg-card hover:shadow-md',
  primary: 'bg-gradient-to-br from-primary to-emerald-700 text-primary-foreground border-0 hover:shadow-lg hover:shadow-primary/20',
  success: 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0 hover:shadow-lg hover:shadow-emerald-500/20',
  warning: 'bg-gradient-to-br from-amber-400 to-orange-500 text-white border-0 hover:shadow-lg hover:shadow-amber-500/20',
  danger: 'bg-gradient-to-br from-rose-500 to-red-600 text-white border-0 hover:shadow-lg hover:shadow-rose-500/20',
}

export function StatCard({ title, value, subtitle, icon: Icon, trend, trendUp, variant = 'default', loading }: StatCardProps) {
  if (loading) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-5">
          <Skeleton className="mb-3 h-4 w-24" />
          <Skeleton className="mb-2 h-8 w-32" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    )
  }
  const isColored = variant !== 'default'
  return (
    <Card className={cn('card-hover relative overflow-hidden', variantStyles[variant])}>
      {/* Decorative circle in background */}
      {isColored && (
        <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
      )}
      <CardContent className="relative p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className={cn('text-xs font-medium leading-tight', isColored ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
              {title}
            </p>
            <p className={cn('mt-2 text-2xl font-bold leading-tight tracking-tight tabular-nums', isColored ? 'text-primary-foreground' : 'text-foreground')}>
              {value}
            </p>
            {subtitle && (
              <p className={cn('mt-1 truncate text-xs', isColored ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                {subtitle}
              </p>
            )}
          </div>
          <div className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center self-start rounded-xl',
            isColored ? 'bg-white/20 backdrop-blur-sm' : 'bg-primary/10'
          )}>
            <Icon className={cn('h-5 w-5', isColored ? 'text-primary-foreground' : 'text-primary')} strokeWidth={2.2} />
          </div>
        </div>
        {trend && (
          <div className="mt-3 flex items-center gap-1 text-xs">
            <span className={cn(
              'font-semibold',
              isColored ? 'text-primary-foreground' : trendUp ? 'text-emerald-600' : 'text-rose-600'
            )}>
              {trendUp ? '↑' : '↓'} {trend}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, description, action }: { icon: LucideIcon; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 py-16 px-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-emerald-100 dark:to-emerald-950">
        <Icon className="h-8 w-8 text-primary" strokeWidth={1.8} />
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
