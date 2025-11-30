'use client'
import { Button } from '@/components/ui/button'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
// import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
// import { Input } from '@/components/ui/input'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { FcGoogle } from 'react-icons/fc'

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
})

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    })

    if (error) {
      toast.error(error.message || "An error occurred")
      return
    }

    router.refresh()
    router.push('/')
  }

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
    <section className="min-h-screen flex box-border justify-center items-center">
      <div className="bg-card rounded-2xl flex max-w-3xl p-5 items-center">
        <div className="md:w-1/2 px-8">
          <h2 className="font-bold text-2xl">Login</h2>
          <p className="text-sm mt-4">If you already have an account, easily log in</p>
          {/* <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-8">
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
              <Button className="w-full" type="submit">Login</Button>
            </form>
          </Form>
          <div className="mt-6 grid grid-cols-3 items-center text-gray-400">
            <hr className="border-gray-400" />
            <p className="text-center text-sm">OR</p>
            <hr className="border-gray-400" />
          </div> */}
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