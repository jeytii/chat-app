import { Link, router } from '@inertiajs/react'
import { LogOut, Settings } from 'lucide-react'

import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { useSidebar } from '@/components/ui/sidebar'

export function UserMenuContent() {
    const { setOpenMobile } = useSidebar()

    const cleanup = () => {
        // Remove pointer-events style from body...
        document.body.style.removeProperty('pointer-events')
    }

    const handleLogout = () => {
        cleanup()
        window.Echo.leaveAllChannels()
        router.flushAll()
    }

    return (
        <>
            <DropdownMenuItem asChild className='rounded-xs hover:bg-muted! hover:text-foreground!'>
                <Link
                    className='block w-full cursor-pointer'
                    href='/settings'
                    prefetch
                    onClick={cleanup}
                    onSuccess={setOpenMobile.bind(null, false)}
                >
                    <Settings className='mr-2' />
                    Settings
                </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className='rounded-t-xs hover:bg-muted! hover:text-foreground!'>
                <Link
                    className='block w-full cursor-pointer'
                    href='/logout'
                    method='post'
                    as='button'
                    onClick={handleLogout}
                    data-test='logout-button'
                >
                    <LogOut className='mr-2' />
                    Log out
                </Link>
            </DropdownMenuItem>
        </>
    )
}
