'use client'
import { Button } from '@/components/ui/button'
import { signup } from './actions'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { FcGoogle } from 'react-icons/fc'
import Link from 'next/link'

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
    } finally {
      setIsLoading(false)
    }
  }

  const signUpWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) {
      console.error('Error signing up with Google:', error.message)
    }
  }

  return (
    <section className=" min-h-screen flex box-border justify-center items-center">
      <div className="bg-card rounded-2xl flex max-w-3xl p-5 items-center">
        <div className="md:w-1/2 px-8">
          <h2 className="font-bold text-3xl ">Signup</h2>
          <p className="text-sm mt-4 ">Create your Account here</p>

          <form onSubmit={form.handleSubmit(onSignup)} className="flex flex-col gap-4">
            <input className="p-2 mt-8 rounded-xl border" type="text" placeholder="Enter your username..." {...form.register("userName")} />
            <input className="p-2 rounded-xl border" type="email" placeholder="Enter your email" {...form.register("email")} />
            <div className="relative">
              <input className="p-2 rounded-xl border w-full" type="password" placeholder="Enter your password" {...form.register("password")} />
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="gray" id="togglePassword"
                className="bi bi-eye absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer z-20 opacity-100"
                viewBox="0 0 16 16">
                <path
                  d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z">
                </path>
                <path
                  d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z">
                </path>
              </svg>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                className="bi bi-eye-slash-fill absolute top-1/2 right-3 -z-1 -translate-y-1/2 cursor-pointer hidden"
                id="mama" viewBox="0 0 16 16">
                <path
                  d="m10.79 12.912-1.614-1.615a3.5 3.5 0 0 1-4.474-4.474l-2.06-2.06C.938 6.278 0 8 0 8s3 5.5 8 5.5a7.029 7.029 0 0 0 2.79-.588zM5.21 3.088A7.028 7.028 0 0 1 8 2.5c5 0 8 5.5 8 5.5s-.939 1.721-2.641 3.238l-2.062-2.062a3.5 3.5 0 0 0-4.474-4.474L5.21 3.089z">
                </path>
                <path
                  d="M5.525 7.646a2.5 2.5 0 0 0 2.829 2.829l-2.83-2.829zm4.95.708-2.829-2.83a2.5 2.5 0 0 1 2.829 2.829zm3.171 6-12-12 .708-.708 12 12-.708.708z">
                </path>
              </svg>
            </div>
            <Button type="submit" className=" text-white py-2 rounded-xl hover:scale-105 duration-300 hover:bg-red-600 font-medium" disabled={isLoading}>
              {isLoading ? 'Signing up...' : 'Sign up'}
            </Button>
          </form>
          <div className="mt-6 items-center text-gray-100">
            <hr className="border" />
            <p className="text-center text-sm">OR</p>
            <hr className="border" />
          </div>
          <Button 
            type="button" 
            variant="outline" 
            className=" border py-2 w-full rounded-xl mt-5 flex justify-center items-center text-sm hover:scale-105 duration-300 hover:bg-[#60a8bc4f] font-medium" 
            onClick={signUpWithGoogle}
          >
            <FcGoogle className="mr-2 h-4 w-4" />
            Login with Google
          </Button>
          <div className="mt-10 text-sm border-b border-gray-500 py-5 playfair tooltip">Forget password?</div>
          <div className="mt-4 text-sm flex justify-between items-center container-mr">
            <p className="mr-3 md:mr-0">Already have an account?</p>
            <Link href="/login" className="hover:border register text-white bg-[#002D74] hover:border-gray-400 rounded-xl py-2 px-5 hover:scale-110 hover:bg-[#002c7424] font-semibold duration-300">Login</Link>
          </div>
        </div>
        <div className="md:block hidden w-1/2">
          <img className="rounded-2xl max-h-[1600px]" src="https://plus.unsplash.com/premium_vector-1738944996839-c5d427907100?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="login form image" />
        </div>
      </div>
    </section>
  )
}
