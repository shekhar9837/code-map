'use client'
import { Button } from '@/components/ui/button'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { FcGoogle } from 'react-icons/fc'

export default function LoginPage() {
  const supabase = createClientComponentClient()
  const redirectTo = process.env.NODE_ENV === 'development' ? process.env.DEV_CALLBACK_URL : process.env.PROD_CALLBACK_URL
  
  const signInWithGoogle = async () => {
    console.log(window.location.origin)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        },
        redirectTo
      }
    })

    if (error) {
      toast.error('Failed to sign in with Google')
      console.error('Google sign in error:', error)
    }
  }

  return (
    <section className="min-h-screen flex box-border justify-center items-center p-5">
      <div className="bg-card rounded-2xl flex max-w-3xl py-5 items-center">
        <div className="md:w-1/2 px-8">
          <h2 className="font-bold text-2xl">Login</h2>
          <p className="text-sm mt-4">If you already have an account, easily log in</p>
         
          <Button onClick={signInWithGoogle} variant="outline" className="w-full mt-5 gap-2">
            <FcGoogle className="text-2xl" />
            Login with Google
          </Button>
          <p className="mt-5 text-xs border-b border-gray-400 py-4">Forgot your password?</p>
          <div className="mt-3 text-xs flex justify-between items-center">
            <p>If you do not have an account...</p>
            <Link href="/signup">
              <Button variant="link">Register</Button>
            </Link>
          </div>
        </div>
        <div className="w-1/2 md:block hidden">
          <img src="https://tecdn.b-cdn.net/img/Photos/new-templates/bootstrap-login-form/draw2.webp" alt="Login" />
        </div>
      </div>
    </section>
  )
}