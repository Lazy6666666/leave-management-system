import { useRouter } from 'next/router'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card'

export default function UserDetailPage() {
  const router = useRouter()
  const { id } = router.query

  return (
    <div className="space-y-8 p-6 md:p-8">
      <PageHeader
        title="User Details"
        description={`Details for user ID: ${id}`}
      />
      <Card>
        <CardHeader>
          <CardTitle>User Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Display user profile details here...</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Leave History</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Display user leave history here...</p>
        </CardContent>
      </Card>
    </div>
  )
}
