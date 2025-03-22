// import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
// import { useEffect, useState } from 'react'
// import { useRouter } from 'next/navigation'
// import { User } from '@supabase/supabase-js'

// export function useAuth() {
//   const [user, setUser] = useState<User | null>(null)
//   const [loading, setLoading] = useState(true)
//   const supabase = createClientComponentClient()
//   const router = useRouter()
// //   console.log("user", user)

//   useEffect(() => {
//     const { data: { subscription } } = supabase.auth.onAuthStateChange(
//       (event, session) => {
//         setUser(session?.user ?? null)
//         setLoading(false)
        
//         if (event === 'SIGNED_OUT') {
//           router.push('/login')
//         }
//       }
//     )

//     return () => {
//       subscription.unsubscribe()
//     }
//   }, [supabase, router])

  
//   return { user, loading }
// }


import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>({} as User) // Always return a non-null user
  const [loading, setLoading] = useState(false) // Set loading to false

  return { user, loading }
}