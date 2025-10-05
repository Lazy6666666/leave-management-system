import { useState } from 'react';
import { useRouter } from 'next/router';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/ui/card';
import { Button } from '@/ui/button';
import { Skeleton } from '@/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/dialog';
import { Label } from '@/ui/label';
import { Input } from '@/ui/input';
import { Textarea } from '@/ui/textarea';
import {
  useLeaveTypes,
  useCreateLeaveType,
  useUpdateLeaveType,
  useDeleteLeaveType,
} from '@/hooks/use-leave-types';
import { Plus, Edit, Trash2, FileWarning, CheckCircle2, XCircle } from 'lucide-react';
import type { LeaveType } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface LeaveTypeFormData {
  name: string;
  description: string;
  default_allocation_days: number;
  is_active: boolean;
}

export default function LeaveTypesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingLeaveType, setEditingLeaveType] = useState<LeaveType | null>(null);
  const [deletingLeaveType, setDeletingLeaveType] = useState<LeaveType | null>(null);
  const [formData, setFormData] = useState<LeaveTypeFormData>({
    name: '',
    description: '',
    default_allocation_days: 0,
    is_active: true,
  });

  const { data: leaveTypes, isLoading, isError, error } = useLeaveTypes(true);
  const createMutation = useCreateLeaveType();
  const updateMutation = useUpdateLeaveType();
  const deleteMutation = useDeleteLeaveType();

  const handleOpenCreateDialog = () => {
    setEditingLeaveType(null);
    setFormData({
      name: '',
      description: '',
      default_allocation_days: 0,
      is_active: true,
    });
    setShowFormDialog(true);
  };

  const handleOpenEditDialog = (leaveType: LeaveType) => {
    setEditingLeaveType(leaveType);
    setFormData({
      name: leaveType.name,
      description: leaveType.description || '',
      default_allocation_days: leaveType.default_allocation_days,
      is_active: leaveType.is_active,
    });
    setShowFormDialog(true);
  };

  const handleOpenDeleteDialog = (leaveType: LeaveType) => {
    setDeletingLeaveType(leaveType);
    setShowDeleteDialog(true);
  };

  const handleCloseFormDialog = () => {
    setShowFormDialog(false);
    setEditingLeaveType(null);
  };

  const handleCloseDeleteDialog = () => {
    setShowDeleteDialog(false);
    setDeletingLeaveType(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingLeaveType) {
        await updateMutation.mutateAsync({
          id: editingLeaveType.id,
          data: formData,
        });
        toast({
          title: 'Success',
          description: 'Leave type updated successfully',
        });
      } else {
        await createMutation.mutateAsync(formData);
        toast({
          title: 'Success',
          description: 'Leave type created successfully',
        });
      }
      handleCloseFormDialog();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingLeaveType) return;

    try {
      await deleteMutation.mutateAsync(deletingLeaveType.id);
      toast({
        title: 'Success',
        description: 'Leave type deleted successfully',
      });
      handleCloseDeleteDialog();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete leave type',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (leaveType: LeaveType) => {
    try {
      await updateMutation.mutateAsync({
        id: leaveType.id,
        data: { is_active: !leaveType.is_active },
      });
      toast({
        title: 'Success',
        description: `Leave type ${!leaveType.is_active ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 md:space-y-8 page-transition">
        <div className="space-y-3">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6 md:space-y-8 page-transition">
        <PageHeader
          title="Leave Types Management"
          description="Configure and manage leave types for your organization"
        />
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-destructive/10 p-2">
                <FileWarning className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="font-medium text-destructive">Failed to load leave types</p>
                <p className="text-sm text-destructive/80 mt-1">
                  {error instanceof Error ? error.message : 'An error occurred'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 page-transition">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Leave Types Management"
          description="Configure and manage leave types for your organization"
        />
        <Button onClick={handleOpenCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Leave Type
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-center">Default Days</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaveTypes && leaveTypes.length > 0 ? (
                leaveTypes.map((leaveType) => (
                  <TableRow key={leaveType.id}>
                    <TableCell className="font-medium">{leaveType.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {leaveType.description || '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      {leaveType.default_allocation_days}
                    </TableCell>
                    <TableCell className="text-center">
                      <button
                        onClick={() => handleToggleActive(leaveType)}
                        className="inline-flex items-center gap-1.5 text-sm"
                        disabled={updateMutation.isPending}
                      >
                        {leaveType.is_active ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-success" />
                            <span className="text-success">Active</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Inactive</span>
                          </>
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEditDialog(leaveType)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDeleteDialog(leaveType)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <FileWarning className="h-12 w-12 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">No leave types found</p>
                      <Button onClick={handleOpenCreateDialog} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Leave Type
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingLeaveType ? 'Edit Leave Type' : 'Add Leave Type'}
              </DialogTitle>
              <DialogDescription>
                {editingLeaveType
                  ? 'Update the leave type details below'
                  : 'Create a new leave type for your organization'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Annual Leave"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this leave type"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="default_allocation_days">Default Allocation Days *</Label>
                <Input
                  id="default_allocation_days"
                  type="number"
                  min="0"
                  value={formData.default_allocation_days}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      default_allocation_days: parseInt(e.target.value) || 0,
                    })
                  }
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseFormDialog}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={createMutation.isPending || updateMutation.isPending}
              >
                {editingLeaveType ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Leave Type</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingLeaveType?.name}"? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
            <p className="font-medium">Warning</p>
            <p className="mt-1">
              This leave type can only be deleted if it's not currently used in any leave
              requests. Consider deactivating it instead if it's in use.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseDeleteDialog}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              loading={deleteMutation.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
