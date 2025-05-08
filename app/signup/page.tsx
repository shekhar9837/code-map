'use client'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { FcGoogle } from 'react-icons/fc'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function SignupPage() {
  const supabase = createClientComponentClient()
  const [isLoading, setIsLoading] = useState(false)
  const redirectTo = process.env.NODE_ENV === 'development' ? process.env.DEV_CALLBACK_URL : process.env.PROD_CALLBACK_URL;


  const signUpWithGoogle = async () => {
    try {
      setIsLoading(true)
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
      
    } catch (error) {
      toast.error('Failed to sign in with Google')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="min-h-screen  flex box-border justify-center items-center">
      <div className="bg-card rounded-2xl flex max-w-3xl p-5 items-center">
        <div className="md:w-1/2 px-8">
          <h2 className="font-bold text-2xl">Sign Up</h2>
          <p className="text-sm mt-4">Create an account to get started</p>

          <Button onClick={signUpWithGoogle} variant="outline" className="w-full mt-5 gap-2" disabled={isLoading}>
            <FcGoogle className="text-2xl" />
            Sign up with Google
          </Button>

          <div className="mt-8 text-xs border-t  flex justify-between items-center">
            <p>Already have an account?</p>
            <Link href="/login">
              <Button variant="link">Login</Button>
            </Link>
          </div>
        </div>
        <div className="w-1/2 md:block hidden">
          <img src="https://tecdn.b-cdn.net/img/Photos/new-templates/bootstrap-login-form/draw2.svg" alt="Sign Up" />
        </div>
      </div>
    </section>
  )
}
