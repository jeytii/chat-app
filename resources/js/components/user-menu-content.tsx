import { Link, router } from '@inertiajs/react'
import { LogOut, type LucideIcon, Monitor, Moon, Settings, Sun } from 'lucide-react'
import { Fragment } from 'react'

import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { useSidebar } from '@/components/ui/sidebar'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { type Appearance, useAppearance } from '@/hooks/use-appearance'

export function UserMenuContent() {
    const { appearance, updateAppearance } = useAppearance()
    const { setOpenMobile } = useSidebar()

    const cleanup = () => {
        // Remove pointer-events style from body...
        document.body.style.removeProperty('pointer-events')
    }

    const themes: { value: Appearance; icon: LucideIcon }[] = [
        { value: 'light', icon: Sun },
        { value: 'dark', icon: Moon },
        { value: 'system', icon: Monitor },
    ]

    const handleLogout = () => {
        cleanup()
        router.flushAll()
    }

    const leaveEchoChannels = () => {
        window.Echo.leaveAllChannels()
    }

    return (
        <>
            <DropdownMenuItem asChild className='p-0'>
                <ToggleGroup
                    value={appearance}
                    type='single'
                    size='sm'
                    className='w-full gap-0'
                    onValueChange={updateAppearance}
                >
                    {themes.map((theme, index, items) => (
                        <Fragment key={theme.value}>
                            <ToggleGroupItem value={theme.value} className='flex-1 cursor-pointer first:rounded-tl-sm! first:rounded-bl-none last:rounded-tr-sm! last:rounded-br-none data-[state=on]:[&>svg]:text-sidebar-accent-foreground!'>
                                <theme.icon size={16} />
                            </ToggleGroupItem>

                            {(index < items.length - 1) && <Separator orientation='vertical' />}
                        </Fragment>
                    ))}
                </ToggleGroup>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
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
                    onBefore={leaveEchoChannels}
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
