import { BookOpen, LogOut } from 'lucide-react'
import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Button } from './ui/button'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useAuth } from '@/hooks/useAuth'

const Navbar = () => {
  const supabase = createClientComponentClient();
    const { user, loading } = useAuth();
    
    // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.email) return "U";
    return user.email.substring(0, 2).toUpperCase();
  };
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };
  return (
    <header className="w-full backdrop-blur-xl  z-10">
        <div className="w-full flex h-16 items-center justify-between py-4 px-4">
          <div className="flex items-center gap-2  text-slate-100">
            <BookOpen className="h-6 w-6 " />
            <h1 className="text-xl font-bold">CodePath</h1>
          </div>
           <div className="flex items-center gap-4">
            <div className="hidden md:flex">
              <p className="text-sm  text-slate-200">
                Signed in as {user?.user_metadata?.full_name} Shekhar
                {/* Signed in as {user?.user_metadata.email} */}
              </p>
            </div>
            <Avatar className="h-8 w-8 border">
              <AvatarImage
                src={user?.user_metadata?.avatar_url}
                alt={user?.email || ""}
              />
              <AvatarFallback>{getUserInitials()}</AvatarFallback>
            </Avatar>
            <Button onClick={handleLogout} variant="ghost" size="icon" className=' text-slate-100'>
              <LogOut className="h-5 w-5" />
              <span className="sr-only">Logout</span>
            </Button>
          </div> 
        </div>
      </header>
  )
}

export default Navbar