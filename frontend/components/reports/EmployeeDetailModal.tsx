'use client'

import { Calendar, Mail, User, Building, Briefcase, Clock } from 'lucide-react'
import { EmployeeResult, EmployeeLeaveBalance } from '@/hooks/use-employee-search'
import { Badge } from '@/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/ui/dialog'
import { Avatar, AvatarFallback } from '@/ui/avatar'
import { getRoleBadgeVariant, normalizeRole } from '@/lib/utils/status-badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/table'

interface EmployeeDetailModalProps {
  employee: EmployeeResult
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EmployeeDetailModal({ employee, open, onOpenChange }: EmployeeDetailModalProps) {
  const formatLeaveBalance = (balance: EmployeeLeaveBalance) => {
    const isOverdrawn = balance.used > balance.allocated
    const remainingDays = Math.max(0, balance.remaining)

    return {
      isOverdrawn,
      text: `${remainingDays} days remaining`,
      subtext: `${balance.used}/${balance.allocated} used`
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>
                {employee.first_name?.charAt(0)}{employee.last_name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div>{employee.full_name}</div>
              <div className="text-sm font-normal text-muted-foreground">
                Employee Details
              </div>
            </div>
          </DialogTitle>
          <DialogDescription>
            Complete profile and leave balance information
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Basic Information */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">{employee.full_name}</div>
                  <div className="text-sm text-muted-foreground">Full Name</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">{employee.email}</div>
                  <div className="text-sm text-muted-foreground">Email Address</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Badge variant={getRoleBadgeVariant(normalizeRole(employee.role))}>
                    {employee.role}
                  </Badge>
                  <div className="text-sm text-muted-foreground">Role</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Building className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">{employee.department}</div>
                  <div className="text-sm text-muted-foreground">Department</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">
                    {new Date(employee.created_at).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Join Date</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Leave Balances */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Leave Balances (Current Year)
              </CardTitle>
              <CardDescription>
                Detailed breakdown of allocated, used, and remaining leave days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {employee.leave_balance && employee.leave_balance.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Leave Type</TableHead>
                      <TableHead className="text-right">Allocated</TableHead>
                      <TableHead className="text-right">Used</TableHead>
                      <TableHead className="text-right">Remaining</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employee.leave_balance.map((balance, index) => {
                      const { isOverdrawn, text, subtext } = formatLeaveBalance(balance)
                      const totalTaken = isOverdrawn ? balance.allocated : balance.used

                      return (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {balance.leave_type}
                          </TableCell>
                          <TableCell className="text-right">
                            {balance.allocated}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={isOverdrawn ? 'text-red-600 font-semibold' : ''}>
                              {totalTaken}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={isOverdrawn ? 'text-red-600 font-semibold' : ''}>
                              {Math.max(0, balance.remaining)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant={isOverdrawn ? "destructive" : balance.remaining < 5 ? "secondary" : "default"}>
                              {isOverdrawn ? 'Over limit' : balance.remaining < 5 ? 'Low' : 'Good'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No leave balances found for this employee.
                </div>
              )}

              {/* Summary */}
              {employee.leave_balance && employee.leave_balance.length > 0 && (
                <div className="mt-6 pt-4 border-t">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold">
                        {employee.leave_balance.reduce((sum, balance) => sum + balance.allocated, 0)}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Allocated</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {employee.leave_balance.reduce((sum, balance) => sum + balance.used, 0)}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Used</div>
                    </div>
                    <div>
                      <div className={`text-2xl font-bold ${
                        employee.leave_balance.some(b => b.used > b.allocated) ? 'text-red-600' : ''
                      }`}>
                        {employee.leave_balance.reduce((sum, balance) =>
                          sum + Math.max(0, balance.remaining), 0
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Remaining</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
