'use client'

import * as React from 'react'
import { Calendar } from '@/ui/calendar'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/ui/card'
import { Badge } from '@/ui/badge'
import { Skeleton } from '@/ui/skeleton'
import { useTeamCalendar, type CalendarLeave } from '@/hooks/use-team-calendar'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/ui/tooltip'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/ui/dialog'
import type { DayProps } from 'react-day-picker'

interface TeamCalendarProps {
  className?: string
}

// Mobile detection (very lightweight heuristic)
const isTouch = () => typeof window !== 'undefined' && (window.matchMedia('(hover: none)').matches || 'ontouchstart' in window)

export function TeamCalendar({ className }: TeamCalendarEnhancedProps) {
  const [currentMonth, setCurrentMonth] = React.useState<Date>(new Date())
  const [mobileDialogDay, setMobileDialogDay] = React.useState<{ date: Date; data: CalendarLeave } | null>(null)

  const { data: calendarLeaves, isLoading, error } = useTeamCalendar({ currentMonth })

  // Map date -> leave data for O(1) lookup
  const leavesMap = React.useMemo(() => {
    const map = new Map<string, CalendarLeave>()
    calendarLeaves?.forEach(l => map.set(l.date, l))
    return map
  }, [calendarLeaves])

  const renderDay = React.useCallback((props: DayProps) => {
    const { day } = props
    const dateObj = day.date
    const dateKey = dateObj?.toISOString().split('T')[0]
    const leaveData = dateKey ? leavesMap.get(dateKey) : undefined

    if (!leaveData || leaveData.employees.length === 0) {
      return <span>{dateObj.getDate()}</span>
    }

    const approved = leaveData.employees.filter(e => e.status === 'approved')
    const pending = leaveData.employees.filter(e => e.status === 'pending')
    const total = leaveData.employees.length

    const cellVisual = (
      <div className="relative w-full h-full flex items-center justify-center">
        <span className="relative z-10 text-[0.75rem] font-medium leading-none">
          {dateObj.getDate()}
        </span>
        {/* Overlays */}
        <div className="absolute inset-0 rounded-md overflow-hidden">
          {approved.length > 0 && (
            <div className={cn('absolute inset-y-0 left-0', pending.length > 0 ? 'w-1/2' : 'w-full', 'bg-primary/15 border border-primary/40')} />
          )}
          {pending.length > 0 && (
            <div className={cn('absolute inset-y-0', approved.length > 0 ? 'right-0 w-1/2' : 'inset-x-0 w-full', 'bg-amber-500/15 border border-amber-500/40', approved.length > 0 && 'border-l-0')} />
          )}
        </div>
        {/* Count badge */}
        <div className="absolute top-0.5 right-0.5 h-4 min-w-[1rem] px-1 rounded-full bg-background/90 dark:bg-background/80 border border-border flex items-center justify-center">
          <span className="text-[0.6rem] font-medium leading-none">
            {total}
          </span>
        </div>
      </div>
    )

    const content = (
      <div className="space-y-2">
        <div className="text-xs font-semibold">
          {total} {total === 1 ? 'person' : 'people'} on leave
        </div>
        <div className="space-y-1 max-h-48 overflow-auto pr-1">
          {leaveData.employees.map(emp => (
            <div key={emp.id + emp.name + emp.leaveType + emp.status} className="flex items-center justify-between gap-2 text-[11px]">
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{emp.name}</div>
                <div className="truncate text-muted-foreground">{emp.leaveType}</div>
              </div>
              <Badge variant={emp.status === 'approved' ? 'default' : 'secondary'} className="text-[10px] px-1 py-0 leading-tight">
                {emp.status}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    )

    // Mobile: open dialog on tap
    if (isTouch()) {
      return (
        <button
          type="button"
            aria-label={`${total} on leave: ${approved.length} approved, ${pending.length} pending`}
          onClick={() => setMobileDialogDay({ date: dateObj, data: leaveData })}
          className="w-full h-full cursor-pointer"
        >
          {cellVisual}
        </button>
      )
    }

    // Desktop: tooltip
    return (
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              aria-label={`${total} on leave: ${approved.length} approved, ${pending.length} pending`}
              className="w-full h-full"
            >
              {cellVisual}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={6} className="p-3 w-60">
            {content}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }, [leavesMap])

  const legend = (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded border border-primary/50 bg-primary/15" />
        <span>Approved</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded border border-amber-500/50 bg-amber-500/15" />
        <span>Pending</span>
      </div>
    </div>
  )

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Team Calendar</CardTitle>
          <CardDescription>View team leave dates at a glance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8 text-sm text-muted-foreground">
            Failed to load calendar data. Please try again.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="p-4 md:p-6">
        <CardTitle className="text-lg md:text-xl">Team Calendar</CardTitle>
        <CardDescription className="text-sm">Team availability with leave overlays</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center p-3 md:p-4">
        {isLoading ? (
          <div className="w-full max-w-sm space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <>
            <div className="w-full max-w-sm">
              <Calendar
                mode="single"
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                className="rounded-md border-0"
                components={{
                  Day: renderDay,
                }}
              />
            </div>
            {legend}
          </>
        )}
      </CardContent>

      {/* Mobile dialog */}
      {mobileDialogDay && (
        <Dialog open={!!mobileDialogDay} onOpenChange={() => setMobileDialogDay(null)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>
                {mobileDialogDay.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="text-sm font-medium">
                {mobileDialogDay.data.employees.length}{' '}
                {mobileDialogDay.data.employees.length === 1 ? 'person' : 'people'} on leave
              </div>
              <div className="space-y-2 max-h-60 overflow-auto pr-1">
                {mobileDialogDay.data.employees.map(emp => (
                  <div key={emp.id + emp.name + emp.leaveType + emp.status} className="flex items-center justify-between gap-2 text-xs p-2 rounded-md border bg-muted/40">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{emp.name}</div>
                      <div className="text-muted-foreground truncate">{emp.leaveType}</div>
                    </div>
                    <Badge variant={emp.status === 'approved' ? 'default' : 'secondary'} className="text-[10px] px-1 py-0 leading-tight">
                      {emp.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  )
}

export default TeamCalendar
