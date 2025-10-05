'use client'

import * as React from 'react'
import { Calendar } from '@/ui/calendar'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/ui/card'

interface TeamCalendarSimpleProps {
  className?: string
}

// A simplified Team Calendar using the base shadcn/ui Calendar component.
// This intentionally omits custom leave overlays, tooltips, and data fetching logic
// to provide a clean baseline calendar that can be extended later.
export function TeamCalendarSimple({ className }: TeamCalendarSimpleProps) {
  const [date, setDate] = React.useState<Date | undefined>(new Date())

  return (
    <Card className={className}>
      <CardHeader className="p-4 md:p-6">
        <CardTitle className="text-lg md:text-xl">Team Calendar</CardTitle>
        <CardDescription className="text-sm">Browse dates (leave overlays coming soon)</CardDescription>
      </CardHeader>
      <CardContent className="p-3 md:p-4">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-md"
        />
      </CardContent>
    </Card>
  )
}

export default TeamCalendarSimple
