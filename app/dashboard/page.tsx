'use client'
import { useAuth } from '@/hooks/useAuth'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'

export default function Dashboard() {
  const { user, loading } = useAuth()
  const supabase = createClientComponentClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Welcome, {user?.email}</h1>
        <Button onClick={handleLogout} variant="outline">
          Logout
        </Button>
      </div>
      {/* Your dashboard content */}
    </div>
  )
}