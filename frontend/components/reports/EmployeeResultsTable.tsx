'use client'

import { useState } from 'react'
import { Eye, ChevronLeft, ChevronRight } from 'lucide-react'
import { EmployeeResult, PaginationMeta, EmployeeLeaveBalance } from '@/hooks/use-employee-search'
import { Button } from '@/ui/button'
import { Badge } from '@/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/table'
import { Avatar, AvatarFallback } from '@/ui/avatar'
import { getRoleBadgeVariant, normalizeRole } from '@/lib/utils/status-badge'
import { EmployeeDetailModal } from '@/components/reports/EmployeeDetailModal'

interface EmployeeResultsTableProps {
  employees: EmployeeResult[]
  isLoading: boolean
  pagination: PaginationMeta
  onPageChange: (page: number) => void
}

type ModalOnOpenChange = (open: boolean) => void

export function EmployeeResultsTable({
  employees,
  isLoading,
  pagination,
  onPageChange
}: EmployeeResultsTableProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeResult | null>(null)

  const formatLeaveBalance = (balance: EmployeeLeaveBalance) => {
    const isOverdrawn = balance.used > balance.allocated
    return `${balance.remaining} days remaining (${balance.used}/${balance.allocated})`
  }

  const renderLeaveBalanceContent = (balances: EmployeeLeaveBalance[]) => {
    if (!balances || balances.length === 0) {
      return <span className="text-muted-foreground">No leave types</span>
    }

    if (balances.length === 1) {
      const balance = balances[0]
      if (!balance) {
        return <span className="text-muted-foreground">No leave data</span>
      }
      return (
        <div className="text-sm">
          <div className="font-medium">{balance.leave_type}</div>
          <div className="text-muted-foreground">
            {formatLeaveBalance(balance)}
          </div>
        </div>
      )
    }

    // Multiple leave types - show summary
    const totalRemaining = balances.reduce((sum: number, balance: EmployeeLeaveBalance) => {
      return sum + Math.max(0, balance.remaining)
    }, 0)
    const hasOverdrawn = balances.some((balance: EmployeeLeaveBalance) => balance.used > balance.allocated)

    return (
      <div className="text-sm">
        <div className="font-medium">{balances.length} leave types</div>
        <div className={`text-muted-foreground ${hasOverdrawn ? 'text-red-600' : ''}`}>
          {totalRemaining} days total remaining
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3">Loading employees...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Search Results</CardTitle>
          <CardDescription>
            Click on a row to view detailed employee information and full leave balances.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Leave Balance</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead className="w-[50px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => (
                <TableRow
                  key={employee.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedEmployee(employee)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {employee.first_name?.charAt(0)}{employee.last_name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{employee.full_name}</div>
                        <div className="text-sm text-muted-foreground">{employee.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(normalizeRole(employee.role))}>
                      {employee.role}
                    </Badge>
                  </TableCell>
                  <TableCell>{employee.department}</TableCell>
                  <TableCell>
                    {renderLeaveBalanceContent(employee.leave_balance)}
                  </TableCell>
                  <TableCell>
                    {new Date(employee.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedEmployee(employee)
                      }}
                      title="View employee details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {pagination.total_pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(pagination.current_page - 1)}
                disabled={pagination.current_page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                  const pageNumber = Math.max(1, pagination.current_page - 2) + i
                  if (pageNumber > pagination.total_pages) return null

                  return (
                    <Button
                      key={pageNumber}
                      variant={pageNumber === pagination.current_page ? "default" : "outline"}
                      size="sm"
                      onClick={() => onPageChange(pageNumber)}
                    >
                      {pageNumber}
                    </Button>
                  )
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(pagination.current_page + 1)}
                disabled={pagination.current_page >= pagination.total_pages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Employee Detail Modal */}
      {selectedEmployee && (
        <EmployeeDetailModal
          employee={selectedEmployee}
          open={!!selectedEmployee}
          onOpenChange={(open: boolean) => {
            if (!open) setSelectedEmployee(null)
          }}
        />
      )}
    </>
  )
}
