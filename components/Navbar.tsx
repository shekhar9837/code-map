'use client'
import { BookOpen, LogOut } from 'lucide-react'
import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Button } from './ui/button'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useAuth } from '@/hooks/useAuth'
import { SidebarTrigger } from './ui/sidebar'

const Navbar = () => {
  const supabase = createClientComponentClient();
  const { user, loading } = useAuth();
  console.log(user, loading)

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.email) return "U";
    return user.email.substring(0, 2).toUpperCase();
  };
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };
  return (
    <header className="w-full backdrop-blur-xl z-10">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center h-16">
        <div className="flex items-center gap-2 sm:gap-4" >
        {!loading && (
        <>
        {user ? (
          <SidebarTrigger />
        ) : (
        <div></div>
        )}
        </>
        )
        }
        <div className='gap-1 sm:gap-2 flex items-center'>
          <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
          <h1 className="text-base sm:text-lg font-semibold truncate">Code-map</h1>
        </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
        {!loading && (
          <>
          {user ? (
            <>
              {/* Desktop view */}
              <div className="hidden sm:flex items-center gap-2 sm:gap-4">
          <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
            <AvatarImage src={user?.user_metadata?.avatar_url} />
            <AvatarFallback>{getUserInitials()}</AvatarFallback>
          </Avatar>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
              </div>
              
              {/* Mobile view */}
              <div className="sm:hidden">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => document.getElementById('profile-menu')?.classList.toggle('hidden')}
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback>{getUserInitials()}</AvatarFallback>
            </Avatar>
          </Button>
          <div id="profile-menu" className="hidden absolute right-4 top-16 bg-neutral-800 shadow-lg rounded-lg p-2">
            <div className="px-4 py-2 text-sm">{user.user_metadata.userName}</div>
            <Button variant="ghost" size="sm" className="w-full justify-start" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
              </div>
            </>
          ) : (
            <Button 
              className='px-4 sm:px-6 py-2 bg-neutral-800' 
              variant="ghost" 
              size="sm" 
              onClick={() => window.location.href = '/login'}
            >
              Login
            </Button>
          )}
          </>
        )}
        </div>
      </div>
      </nav>
    </header>
  )
}

export default Navbar