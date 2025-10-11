import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, FileText, Trash2, Edit, Search, Loader2, CalendarDays, UploadCloud } from 'lucide-react';
import { Button } from '@/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card';
import { Input } from '@/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/ui/dialog';
import { Label } from '@/ui/label';
import { Textarea } from '@/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getBrowserClient } from '@/lib/supabase-client';
import { uploadCompanyDocumentWithMetadata, deleteCompanyDocument, getCompanyDocumentDownloadUrl } from '@/lib/company-document-storage-utils';
import type { CompanyDocument } from '@/types';

// Placeholder for document type, will be defined in types.ts
// interface CompanyDocument {
//   id: string;
//   name: string;
//   document_type: string;
//   expiry_date: string | null;
//   uploaded_by: string;
//   storage_path: string;
//   is_public: boolean;
//   created_at: string;
//   updated_at: string;
// }

export default function AdminDocumentsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const supabase = getBrowserClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showConfirmDeleteDialog, setShowConfirmDeleteDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<CompanyDocument | null>(null);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // --- Data Fetching ---
  const { data: documents, isLoading, error } = useQuery<CompanyDocument[]>({
    queryKey: ['companyDocuments', searchQuery],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase client not available');
      let query = supabase.from('company_documents').select('*').order('created_at', { ascending: false });

      if (searchQuery) {
        query = query.ilike('name', `%{searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // --- Mutations ---
  const uploadMutation = useMutation({
    mutationFn: async ({ file, name, document_type, expiry_date, is_public }: { file: File, name: string, document_type: string, expiry_date: string | null, is_public: boolean }) => {
      if (!supabase) throw new Error('Supabase client not available');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      setUploading(true);
      const { success, error: uploadError } = await uploadCompanyDocumentWithMetadata(file, user.id, name, document_type, expiry_date, is_public);

      if (!success) throw new Error(uploadError || 'Failed to upload document to storage and save metadata');

      // The metadata is saved within uploadCompanyDocumentWithMetadata, so no need to insert here
      return { success: true };
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Document uploaded successfully.' });
      queryClient.invalidateQueries({ queryKey: ['companyDocuments'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: `Upload failed: ${error.message}`, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (doc: CompanyDocument) => {
      if (!supabase) throw new Error('Supabase client not available');
      const { data, error } = await supabase.from('company_documents').update({
        name: doc.name,
        document_type: doc.document_type,
        expiry_date: doc.expiry_date,
        is_public: doc.is_public,
      }).eq('id', doc.id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Document updated successfully.' });
      queryClient.invalidateQueries({ queryKey: ['companyDocuments'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: `Update failed: ${error.message}`, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (docId: string) => {
      if (!supabase) throw new Error('Supabase client not available');
      const docToDelete = documents?.find(d => d.id === docId);
      if (!docToDelete) throw new Error('Document not found');

      // Delete from storage first
      const success = await deleteCompanyDocument(docToDelete.storage_path);
      if (!success) throw new Error('Failed to delete document from storage');

      // Then delete from database
      const { error } = await supabase.from('company_documents').delete().eq('id', docId);
      if (error) throw error;
      return docId;
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Document deleted successfully.' });
      queryClient.invalidateQueries({ queryKey: ['companyDocuments'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: `Deletion failed: ${error.message}`, variant: 'destructive' });
    },
  });

  // --- Handlers ---
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFileToUpload(event.target.files[0]);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileToUpload) {
      toast({ title: 'Error', description: 'Please select a file to upload.', variant: 'destructive' });
      return;
    }
    const form = e.target as HTMLFormElement;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value;
    const document_type = (form.elements.namedItem('document_type') as HTMLInputElement).value;
    const expiry_date = (form.elements.namedItem('expiry_date') as HTMLInputElement).value || null;
    const is_public = (form.elements.namedItem('is_public') as HTMLInputElement)?.checked || false;

    uploadMutation.mutate({ file: fileToUpload, name, document_type, expiry_date, is_public });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocument) return;

    const form = e.target as HTMLFormElement;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value;
    const document_type = (form.elements.namedItem('document_type') as HTMLInputElement).value;
    const expiry_date = (form.elements.namedItem('expiry_date') as HTMLInputElement).value || null;
    const is_public = (form.elements.namedItem('is_public') as HTMLInputElement)?.checked || false;

    updateMutation.mutate({
      ...selectedDocument,
      name,
      document_type,
      expiry_date,
      is_public,
    });
  };

  const handleDeleteConfirm = () => {
    if (selectedDocument) {
      deleteMutation.mutate(selectedDocument.id);
    }
  };

  if (error) {
    return <div className="text-red-500">Error loading documents: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Documents</h1>
        <Button onClick={() => setShowUploadDialog(true)}>
          <Plus className="mr-2 h-4 w-4" /> Upload Document
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage Company Documents</CardTitle>
          <CardDescription>View, upload, edit, and delete company-wide documents.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Uploaded By</TableHead>
                  <TableHead>Public</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents?.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">
                      <a
                        href="#"
                        onClick={async (e) => {
                          e.preventDefault();
                          const { signedUrl, error: downloadError } = await getCompanyDocumentDownloadUrl(doc.storage_path);
                          if (downloadError) {
                            toast({ title: 'Error', description: `Failed to download: ${downloadError}`, variant: 'destructive' });
                          } else if (signedUrl) {
                            window.open(signedUrl, '_blank');
                          }
                        }}
                        className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <FileText className="h-4 w-4" /> {doc.name}
                      </a>
                    </TableCell>
                    <TableCell>{doc.document_type}</TableCell>
                    <TableCell>{doc.expiry_date ? new Date(doc.expiry_date).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell>{doc.uploaded_by}</TableCell>
                    <TableCell>{doc.is_public ? 'Yes' : 'No'}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedDocument(doc);
                          setShowEditDialog(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedDocument(doc);
                          setShowConfirmDeleteDialog(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Upload Document Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload New Document</DialogTitle>
            <DialogDescription>Upload a new company document to the system.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUploadSubmit} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="upload-name" className="text-right">Name</Label>
              <Input id="upload-name" name="name" className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="upload-type" className="text-right">Type</Label>
              <Input id="upload-type" name="document_type" className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="upload-expiry" className="text-right">Expiry Date</Label>
              <Input id="upload-expiry" name="expiry_date" type="date" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="upload-public" className="text-right">Public</Label>
              <input id="upload-public" name="is_public" type="checkbox" className="col-span-3 ml-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="file" className="text-right">File</Label>
              <Input id="file" type="file" className="col-span-3" onChange={handleFileChange} required />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={uploading}>
                {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Upload
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Document Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
            <DialogDescription>Edit the details of the selected document.</DialogDescription>
          </DialogHeader>
          {selectedDocument && (
            <form onSubmit={handleEditSubmit} className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">Name</Label>
                <Input id="edit-name" name="name" defaultValue={selectedDocument.name} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-type" className="text-right">Type</Label>
                <Input id="edit-type" name="document_type" defaultValue={selectedDocument.document_type || ''} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-expiry" className="text-right">Expiry Date</Label>
                <Input id="edit-expiry" name="expiry_date" type="date" defaultValue={selectedDocument.expiry_date ? selectedDocument.expiry_date.split('T')[0] : ''} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-public" className="text-right">Public</Label>
                <input id="edit-public" name="is_public" type="checkbox" defaultChecked={selectedDocument.is_public} className="col-span-3 ml-3" />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <Dialog open={showConfirmDeleteDialog} onOpenChange={setShowConfirmDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the document &quot;{selectedDocument?.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
