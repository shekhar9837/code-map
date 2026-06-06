'use client'
import { Button } from '@/components/ui/button'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { FcGoogle } from 'react-icons/fc'

export default function LoginPage() {
  const supabase = createClient()

  const signInWithGoogle = async () => {
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
      toast.error('Failed to sign in with Google')
      console.error('Google sign in error:', error)
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <div className="auth-form">
          <div>
            <h2 className="auth-title">Login</h2>
            <p className="auth-copy">If you already have an account, easily log in.</p>
          </div>
          <Button onClick={signInWithGoogle} variant="outline" className="auth-google-button">
            <FcGoogle className="auth-google-icon" />
            Login with Google
          </Button>
          <div className="auth-footer">
            <span>If you do not have an account...</span>
            <Link href="/signup" className="auth-link">
              Register
            </Link>
          </div>
        </div>
        <div className="auth-visual">
          <img
            src="https://tecdn.b-cdn.net/img/Photos/new-templates/bootstrap-login-form/draw2.webp"
            alt="Login"
          />
        </div>
      </div>
    </section>
  )
}
