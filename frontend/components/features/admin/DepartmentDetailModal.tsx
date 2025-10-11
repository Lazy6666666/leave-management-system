import { motion } from 'motion/react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/ui/dialog'
import { Badge } from '@/ui/badge'
import { Card, CardContent } from '@/ui/card'
import { Users, Clock, CheckCircle, XCircle, Calendar } from 'lucide-react'
import { Skeleton } from '@/ui/skeleton'

interface DepartmentEmployee {
  id: string
  name: string
  role: string
  leaveBalance: number
  pendingRequests: number
  approvedRequests: number
}

interface DepartmentDetailModalProps {
  isOpen: boolean
  onClose: () => void
  department: string | null
  employees?: DepartmentEmployee[]
  isLoading?: boolean
}

export function DepartmentDetailModal({
  isOpen,
  onClose,
  department,
  employees = [],
  isLoading = false
}: DepartmentDetailModalProps) {
  const totalPending = employees.reduce((sum, emp) => sum + emp.pendingRequests, 0)
  const totalApproved = employees.reduce((sum, emp) => sum + emp.approvedRequests, 0)
  const avgLeaveBalance = employees.length > 0
    ? (employees.reduce((sum, emp) => sum + emp.leaveBalance, 0) / employees.length).toFixed(1)
    : 0

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            {department} Department
          </DialogTitle>
          <DialogDescription>
            Detailed view of employees and leave statistics
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card>
                  <CardContent className="p-4 text-center">
                    <Users className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-2xl font-bold">{employees.length}</p>
                    <p className="text-xs text-muted-foreground">Employees</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <Card>
                  <CardContent className="p-4 text-center">
                    <Clock className="h-5 w-5 mx-auto mb-2 text-warning" />
                    <p className="text-2xl font-bold text-warning">{totalPending}</p>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <CardContent className="p-4 text-center">
                    <CheckCircle className="h-5 w-5 mx-auto mb-2 text-success" />
                    <p className="text-2xl font-bold text-success">{totalApproved}</p>
                    <p className="text-xs text-muted-foreground">Approved</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <Card>
                  <CardContent className="p-4 text-center">
                    <Calendar className="h-5 w-5 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold">{avgLeaveBalance}</p>
                    <p className="text-xs text-muted-foreground">Avg Balance</p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Employee List */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Team Members ({employees.length})
              </h3>

              {employees.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p className="text-sm text-muted-foreground">No employees found in this department</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {employees.map((employee, index) => (
                    <motion.div
                      key={employee.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate">{employee.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {employee.role}
                                </Badge>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 text-sm shrink-0">
                              <div className="text-center">
                                <p className="font-semibold text-primary">{employee.leaveBalance}</p>
                                <p className="text-xs text-muted-foreground">Balance</p>
                              </div>

                              <div className="text-center">
                                <p className="font-semibold text-warning">{employee.pendingRequests}</p>
                                <p className="text-xs text-muted-foreground">Pending</p>
                              </div>

                              <div className="text-center">
                                <p className="font-semibold text-success">{employee.approvedRequests}</p>
                                <p className="text-xs text-muted-foreground">Approved</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
