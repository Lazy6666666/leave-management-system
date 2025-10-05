"use client"

import * as React from "react"

import { Calendar } from "@/ui/calendar"
import { Label } from "@/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select"

// Calendar13: variant calendar with dynamic caption layout controls (month/year dropdown options)
// Based on provided snippet; adjusted import paths to match project alias structure.
export function Calendar13() {
  const [captionLayout, setCaptionLayout] = React.useState<React.ComponentProps<typeof Calendar>["captionLayout"]>(
    "dropdown"
  )
  const [date, setDate] = React.useState<Date | undefined>(new Date())

  return (
    <div className="flex flex-col gap-4">
      <Calendar
        mode="single"
        defaultMonth={date}
        selected={date}
        onSelect={setDate}
        captionLayout={captionLayout}
        className="rounded-lg border shadow-sm p-2"
      />
      <div className="flex flex-col gap-3">
        <Label htmlFor="caption-layout" className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Caption Layout
        </Label>
        <Select
          value={captionLayout}
          onValueChange={(value) =>
            setCaptionLayout(
              value as React.ComponentProps<typeof Calendar>["captionLayout"]
            )
          }
        >
          <SelectTrigger
            id="caption-layout"
            size="sm"
            className="bg-background w-full h-9"
          >
            <SelectValue placeholder="Caption Layout" />
          </SelectTrigger>
          <SelectContent align="center">
            <SelectItem value="dropdown">Month and Year</SelectItem>
            <SelectItem value="dropdown-months">Month Only</SelectItem>
            <SelectItem value="dropdown-years">Year Only</SelectItem>
            <SelectItem value="buttons">Prev / Next Buttons</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

export default Calendar13
