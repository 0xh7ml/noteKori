'use client'

import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-client'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { MobileNav } from './mobile-nav'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { initials } from '@/lib/utils'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { LogOut, Settings, User } from 'lucide-react'
import Link from 'next/link'

const TITLES: Record<string, string> = {
  '/dashboard':    'Dashboard',
  '/transactions': 'Transactions',
  '/analytics':    'Analytics',
  '/categories':   'Categories',
  '/settings':     'Settings',
}

export function Header() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  const title = Object.entries(TITLES).find(([k]) => pathname.startsWith(k))?.[1] ?? 'NoteKori'

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background/95 backdrop-blur px-4 md:px-6">
      <div className="flex items-center gap-3">
        <MobileNav />
        <h1 className="text-base font-semibold">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                  {user ? initials(user.name) : '?'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="font-medium">{user?.name}</span>
                <span className="text-xs font-normal text-muted-foreground">{user?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive cursor-pointer"
              onClick={signOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
