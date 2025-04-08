import { BookOpen, LogOut } from 'lucide-react'
import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Button } from './ui/button'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import {useAuth} from '@/hooks/useAuth'

const Navbar = () => {
  // const supabase = createClientComponentClient();
  //   const { user, loading } = useAuth();
  //   console.log(user, loading)
    
  //   // Get user initials for avatar
  // const getUserInitials = () => {
  //   if (!user?.email) return "U";
  //   return user.email.substring(0, 2).toUpperCase();
  // };
  // const handleLogout = async () => {
  //   await supabase.auth.signOut();
  // };
  return (
    <header className="w-full backdrop-blur-xl  z-10">
  
      </header>
  )
}

export default Navbar