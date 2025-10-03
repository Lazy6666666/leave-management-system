import { useState } from 'react'
import { useLeaveTypes, useUpsertLeaveType, useDeleteLeaveType } from '@/hooks/use-admin'
import type { UpsertLeaveTypePayload } from '@/lib/schemas/admin'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'
import { Card } from '@/ui/card'
import { Badge } from '@/ui/badge'

export default function AdminLeaveTypesPage() {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<UpsertLeaveTypePayload>>({
    name: '',
    code: '',
    description: '',
    default_allocation_days: 0,
    max_carryover_days: 0,
    requires_approval: true,
    is_active: true,
  })

  const { data, isLoading, isError, error } = useLeaveTypes({ includeInactive: true })
  const upsertLeaveType = useUpsertLeaveType()
  const deleteLeaveType = useDeleteLeaveType()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await upsertLeaveType.mutateAsync({
        id: editingId ?? undefined,
        name: formData.name!,
        code: formData.code!,
        description: formData.description,
        default_allocation_days: formData.default_allocation_days!,
        max_carryover_days: formData.max_carryover_days!,
        requires_approval: formData.requires_approval ?? true,
        is_active: formData.is_active ?? true,
      })
      alert(editingId ? 'Leave type updated' : 'Leave type created')
      setShowForm(false)
      setEditingId(null)
      setFormData({
        name: '',
        code: '',
        description: '',
        default_allocation_days: 0,
        max_carryover_days: 0,
        requires_approval: true,
        is_active: true,
      })
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save leave type')
    }
  }

  const handleEdit = (leaveType: any) => {
    setEditingId(leaveType.id)
    setFormData({
      name: leaveType.name,
      code: leaveType.code,
      description: leaveType.description,
      default_allocation_days: leaveType.default_allocation_days,
      max_carryover_days: leaveType.max_carryover_days,
      requires_approval: leaveType.requires_approval,
      is_active: leaveType.is_active,
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this leave type?')) return

    try {
      await deleteLeaveType.mutateAsync(id)
      alert('Leave type deleted')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete leave type')
    }
  }

  if (isLoading) {
    return <p>Loading leave types...</p>
  }

  if (isError) {
    return <p className="text-destructive">{error instanceof Error ? error.message : 'Failed to load leave types'}</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Leave Types</h2>
          <p className="text-sm text-muted-foreground">Manage leave type configurations and policies.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Add Leave Type'}
        </Button>
      </div>

      {showForm && (
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="allocation">Default Allocation (days) *</Label>
                <Input
                  id="allocation"
                  type="number"
                  value={formData.default_allocation_days}
                  onChange={(e) => setFormData({ ...formData, default_allocation_days: Number(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="carryover">Max Carryover (days) *</Label>
                <Input
                  id="carryover"
                  type="number"
                  value={formData.max_carryover_days}
                  onChange={(e) => setFormData({ ...formData, max_carryover_days: Number(e.target.value) })}
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.requires_approval}
                  onChange={(e) => setFormData({ ...formData, requires_approval: e.target.checked })}
                />
                <span className="text-sm">Requires Approval</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
                <span className="text-sm">Active</span>
              </label>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={upsertLeaveType.isPending}>
                {upsertLeaveType.isPending ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false)
                  setEditingId(null)
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Code</th>
                <th className="px-4 py-3 text-left font-medium">Allocation</th>
                <th className="px-4 py-3 text-left font-medium">Carryover</th>
                <th className="px-4 py-3 text-left font-medium">Approval</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.leaveTypes.map((lt) => (
                <tr key={lt.id} className="border-b">
                  <td className="px-4 py-3">{lt.name}</td>
                  <td className="px-4 py-3">
                    <code className="rounded bg-muted px-1 py-0.5">{lt.code}</code>
                  </td>
                  <td className="px-4 py-3">{lt.default_allocation_days} days</td>
                  <td className="px-4 py-3">{lt.max_carryover_days} days</td>
                  <td className="px-4 py-3">{lt.requires_approval ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-3">
                    <Badge variant={lt.is_active ? 'default' : 'secondary'}>
                      {lt.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(lt)}>
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(lt.id)}
                        disabled={deleteLeaveType.isPending}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {data?.leaveTypes.length === 0 && (
        <p className="text-center text-sm text-muted-foreground">No leave types found.</p>
      )}
    </div>
  )
}
