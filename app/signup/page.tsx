'use client'
import { Button } from '@/components/ui/button'
import { signup } from './actions'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { FcGoogle } from 'react-icons/fc'
import Link from 'next/link'
import toast from 'react-hot-toast'

const formSchema = z.object({
  userName: z.string().min(3, {
    message: "Username must be at least 3 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
})

export default function SignupPage() {
  const supabase = createClientComponentClient()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userName: "",
      email: "",
      password: "",
    },
  })

  const onSignup = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true)
      setError('')
      const formData = new FormData()
      formData.append('userName', values.userName)
      formData.append('email', values.email)
      formData.append('password', values.password)
      await signup(formData)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Something went wrong')
      toast.error(error instanceof Error ? error.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

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
          redirectTo: 'https://codemap.shekharcodes.tech/auth/callback'
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

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSignup)} className="space-y-4 mt-8">
              <FormField
                control={form.control}
                name="userName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter your email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter your password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? 'Signing up...' : 'Sign Up'}
              </Button>
            </form>
          </Form>

          <div className="mt-6 grid grid-cols-3 items-center text-gray-400">
            <hr className="border-gray-400" />
            <p className="text-center text-sm">OR</p>
            <hr className="border-gray-400" />
          </div>

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
