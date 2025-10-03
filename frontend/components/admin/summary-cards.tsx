'use client'

import { Card } from '@/ui/card'

interface SummaryCardProps {
  title: string
  value: number | string
  description?: string
}

export function SummaryCard({ title, value, description }: SummaryCardProps) {
  return (
    <Card className="flex flex-col gap-2 p-4">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="text-3xl font-bold">{value}</p>
      {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
    </Card>
  )
}
