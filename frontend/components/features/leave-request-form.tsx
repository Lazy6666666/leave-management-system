"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/ui/button"
import { Calendar } from "@/ui/calendar"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/ui/popover"
import { Textarea } from "@/ui/textarea"
import { cn } from "@/lib/utils"
import { leaveRequestSchema, type LeaveRequestFormData } from "@/lib/schemas/leave"
import { DocumentUpload, type DocumentFile } from "@/components/features/document-upload"
import type { LeaveType } from "@/types"

export interface LeaveRequestFormSubmitData extends LeaveRequestFormData {
  documents?: DocumentFile[]
}

interface LeaveRequestFormProps {
  /** Available leave types */
  leaveTypes: LeaveType[]
  /** Form submission handler */
  onSubmit: (data: LeaveRequestFormSubmitData) => Promise<void>
  /** Cancel button handler */
  onCancel?: () => void
  /** Default form values */
  defaultValues?: Partial<LeaveRequestFormData>
  /** Form mode: create or edit */
  mode?: 'create' | 'edit'
  /** Initial documents (for edit mode) */
  initialDocuments?: DocumentFile[]
  /** Whether form is disabled */
  disabled?: boolean
}

export function LeaveRequestForm({
  leaveTypes,
  onSubmit,
  onCancel,
  defaultValues,
  mode = 'create',
  initialDocuments = [],
  disabled = false,
}: LeaveRequestFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [documents, setDocuments] = React.useState<DocumentFile[]>(initialDocuments)
  const [uploadProgress, setUploadProgress] = React.useState(0)

  const form = useForm<LeaveRequestFormData>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: {
      leave_type_id: defaultValues?.leave_type_id,
      start_date: defaultValues?.start_date,
      end_date: defaultValues?.end_date,
      reason: defaultValues?.reason || "",
    },
  })

  const handleSubmit = async (data: LeaveRequestFormData) => {
    try {
      setIsSubmitting(true)
      setUploadProgress(0)
      
      // Include documents in submission
      await onSubmit({
        ...data,
        documents,
      })
      
      // Only reset form in create mode
      if (mode === 'create') {
        form.reset()
        setDocuments([])
      }
      
      setUploadProgress(100)
    } catch (error) {
      // Error handling is done in the parent component
      // Just log it here for debugging
      console.error("Failed to submit leave request:", error)
      throw error // Re-throw to let parent handle it
    } finally {
      setIsSubmitting(false)
      setUploadProgress(0)
    }
  }

  const isFormDisabled = disabled || isSubmitting

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {/* Leave Type Field */}
        <FormField
          control={form.control}
          name="leave_type_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Leave Type *</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isFormDisabled}
              >
                <FormControl>
                  <SelectTrigger className={cn(
                    form.formState.errors.leave_type_id && "border-destructive focus-visible:ring-destructive"
                  )}>
                    <SelectValue placeholder="Select leave type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {leaveTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Choose the type of leave you want to request
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Date Range Fields */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Start Date Field */}
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground",
                          form.formState.errors.start_date && "border-destructive focus-visible:ring-destructive"
                        )}
                        disabled={isFormDisabled}
                      >
                        {field.value ? (
                          format(new Date(field.value), "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) => {
                        field.onChange(date ? format(date, "yyyy-MM-dd") : "")
                      }}
                      disabled={(date) => {
                        const today = new Date()
                        today.setHours(0, 0, 0, 0)
                        return date < today
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  The first day of your leave
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* End Date Field */}
          <FormField
            control={form.control}
            name="end_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>End Date *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground",
                          form.formState.errors.end_date && "border-destructive focus-visible:ring-destructive"
                        )}
                        disabled={isFormDisabled}
                      >
                        {field.value ? (
                          format(new Date(field.value), "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) => {
                        field.onChange(date ? format(date, "yyyy-MM-dd") : "")
                      }}
                      disabled={(date) => {
                        const today = new Date()
                        today.setHours(0, 0, 0, 0)
                        const startDate = form.getValues("start_date")
                        const minDate = startDate ? new Date(startDate) : today
                        return date < minDate
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  The last day of your leave
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Reason Field */}
        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reason *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Please provide a reason for your leave request..."
                  className={cn(
                    "resize-none",
                    form.formState.errors.reason && "border-destructive focus-visible:ring-destructive"
                  )}
                  rows={4}
                  disabled={isFormDisabled}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Provide a brief explanation for your leave request (10-500 characters)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Document Upload Field */}
        <FormItem>
          <FormLabel>Supporting Documents (Optional)</FormLabel>
          <FormControl>
            <DocumentUpload
              documents={documents}
              onDocumentsChange={setDocuments}
              maxFiles={5}
              disabled={isFormDisabled}
              uploading={isSubmitting}
              uploadProgress={uploadProgress}
            />
          </FormControl>
          <FormDescription>
            Upload supporting documents such as medical certificates (PDF, JPEG, PNG, DOC, DOCX - max 5MB each)
          </FormDescription>
        </FormItem>

        {/* Form Actions */}
        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isFormDisabled}
              className="sm:min-w-[100px]"
            >
              Cancel
            </Button>
          )}
          <Button 
            type="submit" 
            disabled={isFormDisabled}
            className="sm:min-w-[140px]"
          >
            {isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isSubmitting 
              ? mode === 'edit' ? "Updating..." : "Submitting..." 
              : mode === 'edit' ? "Update Request" : "Submit Request"
            }
          </Button>
        </div>
      </form>
    </Form>
  )
}
