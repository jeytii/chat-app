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
            <DropdownMenuItem asChild className='rounded-b-xs'>
                <Link
                    className='flex w-full cursor-pointer items-center gap-1 p-2!'
                    href='/settings'
                    prefetch
                    onClick={cleanup}
                    onSuccess={setOpenMobile.bind(null, false)}
                >
                    <Settings size={16} className='mr-2' />
                    <span>Settings</span>
                </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className='rounded-t-xs' variant='destructive'>
                <Link
                    className='flex w-full cursor-pointer items-center gap-1 p-2!'
                    href='/logout'
                    method='post'
                    as='button'
                    onClick={handleLogout}
                    data-test='logout-button'
                >
                    <LogOut size={16} className='mr-2' />
                    <span>Log out</span>
                </Link>
            </DropdownMenuItem>
        </>
    )
}
