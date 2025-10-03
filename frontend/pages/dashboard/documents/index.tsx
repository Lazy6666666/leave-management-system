import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card'
import { Button } from '@/ui/button'
import { Badge } from '@/ui/badge'
import { Upload, FileText, Download, Calendar, AlertTriangle } from 'lucide-react'

export default function DocumentsPage() {
  // Mock data - in real app this would come from API
  const documents = [
    {
      id: 1,
      name: 'Employee Handbook 2024.pdf',
      type: 'Policy Document',
      size: '2.4 MB',
      uploadedBy: 'HR Department',
      uploadDate: '2024-01-01',
      expiryDate: '2024-12-31',
      status: 'active',
      isExpiring: false
    },
    {
      id: 2,
      name: 'Safety Training Certificate.pdf',
      type: 'Certificate',
      size: '1.8 MB',
      uploadedBy: 'John Doe',
      uploadDate: '2023-12-15',
      expiryDate: '2024-02-15',
      status: 'active',
      isExpiring: true
    },
    {
      id: 3,
      name: 'Company Insurance Policy.pdf',
      type: 'Policy Document',
      size: '3.2 MB',
      uploadedBy: 'HR Department',
      uploadDate: '2023-11-20',
      expiryDate: null,
      status: 'active',
      isExpiring: false
    }
  ]

  const stats = {
    totalDocuments: 24,
    expiringSoon: 3,
    expired: 1,
    totalSize: '45.6 GB'
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground">
            Manage company documents and track expiry dates
          </p>
        </div>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDocuments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.expiringSoon}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSize}</div>
          </CardContent>
        </Card>
      </div>

      {/* Expiring Soon Alert */}
      {stats.expiringSoon > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium text-orange-800 dark:text-orange-200">
                  {stats.expiringSoon} documents are expiring soon
                </p>
                <p className="text-sm text-orange-600 dark:text-orange-300">
                  Please review and renew these documents before they expire.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle>All Documents</CardTitle>
          <CardDescription>
            View and manage all company documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {documents.map((document) => (
              <div key={document.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-medium">{document.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{document.type}</span>
                      <span>{document.size}</span>
                      <span>Uploaded by {document.uploadedBy}</span>
                      {document.expiryDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Expires: {document.expiryDate}
                          {document.isExpiring && (
                            <Badge variant="destructive" className="ml-2">Expiring</Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
