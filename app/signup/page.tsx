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
    <section className="auth-page">
      <div className="auth-card">
        <div className="auth-form">
          <div>
            <h2 className="auth-title">Sign Up</h2>
            <p className="auth-copy">Create an account to get started.</p>
          </div>

          <Button onClick={signUpWithGoogle} variant="outline" className="auth-google-button" disabled={isLoading}>
            <FcGoogle className="auth-google-icon" />
            Sign up with Google
          </Button>

          <div className="auth-footer">
            <span>Already have an account?</span>
            <Link href="/login" className="auth-link">
              Login
            </Link>
          </div>
        </div>
        <div className="auth-visual">
          <img
            src="https://tecdn.b-cdn.net/img/Photos/new-templates/bootstrap-login-form/draw2.svg"
            alt="Sign Up"
          />
        </div>
      </div>
    </section>
  )
}
