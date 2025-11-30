'use client'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { FcGoogle } from 'react-icons/fc'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function SignupPage() {
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const signUpWithGoogle = async () => {
    try {
      setIsLoading(true)
      setError('')
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          },
          redirectTo: process.env.NEXT_PUBLIC_CALLBACK_URL
        }
      })

      if (error) {
        throw error
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to sign in with Google')
      toast.error('Failed to sign in with Google')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="min-h-screen flex box-border justify-center items-center">
      <div className="bg-card rounded-2xl flex max-w-3xl p-5 items-center">
        <div className="md:w-1/2 px-8">
          <h2 className="font-bold text-2xl">Sign Up</h2>
          <p className="text-sm mt-4">Create an account to get started</p>

          <Button onClick={signUpWithGoogle} variant="outline" className="w-full mt-5 gap-2" disabled={isLoading}>
            <FcGoogle className="text-2xl" />
            Sign up with Google
          </Button>

          <div className="mt-5 text-xs flex justify-between items-center">
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
