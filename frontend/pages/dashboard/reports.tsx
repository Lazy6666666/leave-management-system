'use client'

import { useState } from 'react'
import { Search, Download, Users, Building, Briefcase } from 'lucide-react'
import { useDebouncedValue } from '@/hooks/use-debounced'
import { useEmployeeSearch, useEmployeeExport, useDepartments, EmployeeSearchFilters } from '@/hooks/use-employee-search'
import { useUserProfile } from '@/hooks/use-user-profile'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card'
import { Badge } from '@/ui/badge'
import { Alert, AlertDescription } from '@/ui/alert'
import { EmployeeResultsTable } from '@/components/reports/EmployeeResultsTable'

export default function ReportsPage() {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState<string>('')
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)

  const { data: userProfile } = useUserProfile(user?.id)
  const { data: departments = [] } = useDepartments()
  const exportMutation = useEmployeeExport()

  // Check if user has permission to access reports
  const isAuthorized = userProfile?.role && ['hr', 'admin'].includes(userProfile.role.toLowerCase())

  // Debounce search to avoid too many API calls
  const debouncedQuery = useDebouncedValue(searchQuery, 300)

  const filters: EmployeeSearchFilters = {
    query: debouncedQuery || undefined,
    department: selectedDepartment || undefined,
    role: selectedRole || undefined,
    page: currentPage,
    limit: 20
  }

  const { data: searchData, isLoading, error } = useEmployeeSearch(filters)

  // Reset to page 1 when filters change
  const handleFilterChange = () => {
    setCurrentPage(1)
  }

  const handleExport = async () => {
    const exportFilters = {
      query: debouncedQuery || undefined,
      department: selectedDepartment || undefined,
      role: selectedRole || undefined,
    }
    await exportMutation.mutateAsync(exportFilters)
  }

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Alert className="max-w-md">
          <AlertDescription>
            You don't have permission to access this page. This feature is restricted to HR and Admin users.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Employee Reports</h1>
        <p className="text-muted-foreground">
          Search and manage employee information, view leave balances, and export reports.
        </p>
      </div>

      {/* Search Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Employees
          </CardTitle>
          <CardDescription>
            Find employees by name, department, or role. Search results are restricted to HR/Admin access only.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search Input */}
            <div className="space-y-2">
              <label htmlFor="search" className="text-sm font-medium">
                Search by name
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Type employee name..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    handleFilterChange()
                  }}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Department Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Building className="h-4 w-4" />
                Department
              </label>
              <Select value={selectedDepartment} onValueChange={(value) => {
                setSelectedDepartment(value === 'all' ? '' : value)
                handleFilterChange()
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="All departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All departments</SelectItem>
                  {departments.map((dept: { id: string; name: string }) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Role Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Role
              </label>
              <Select value={selectedRole} onValueChange={(value) => {
                setSelectedRole(value === 'all' ? '' : value)
                handleFilterChange()
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="hr">HR</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Export Button */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-transparent">Export</label>
              <Button
                onClick={handleExport}
                disabled={exportMutation.isPending}
                className="w-full"
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                {exportMutation.isPending ? 'Exporting...' : 'Export to Excel'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      {searchData && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {searchData.pagination.total_count === 0 ? (
                    'No employees found'
                  ) : (
                    `Showing ${((searchData.pagination.current_page - 1) * searchData.pagination.per_page) + 1}-${Math.min(searchData.pagination.current_page * searchData.pagination.per_page, searchData.pagination.total_count)} of ${searchData.pagination.total_count} employees`
                  )}
                </span>
              </div>
              <Badge variant="secondary">
                Page {searchData.pagination.current_page} of {searchData.pagination.total_pages}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Table */}
      {searchData && searchData.employees.length > 0 && (
        <EmployeeResultsTable
          employees={searchData.employees}
          isLoading={isLoading}
          pagination={searchData.pagination}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            Error loading employee data: {error.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Empty State */}
      {searchData && searchData.employees.length === 0 && !isLoading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No employees found</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Try adjusting your search criteria or filters to find the employees you're looking for.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
