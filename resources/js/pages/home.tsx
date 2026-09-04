import { Link, usePage } from '@inertiajs/react'
import { useQuery } from '@tanstack/react-query'

import AppLogo from '@/components/app-logo'
import Contact from '@/components/contact'
import Notifications from '@/components/notifications'
import Photo from '@/components/photo'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { UserMenuContent } from '@/components/user-menu-content'
import type { Chat } from '@/types/models'

export default function Home() {
    const { name, auth } = usePage().props

    const { data, isLoading } = useQuery<Chat[]>({
        queryKey: ['chats'],
        queryFn: async () => (await fetch('/chats')).json(),
    })

    return (
        <div>
            <header className='mx-auto flex max-w-2xl items-center gap-4 py-2 pr-4 pl-2'>
                <Link href='/' className='inline-flex h-12 items-center gap-3 p-2'>
                    <AppLogo className='size-6!' />
                    <h1 className='truncate text-sm leading-tight font-semibold'>{name}</h1>
                </Link>

                <Notifications />

                <DropdownMenu>
                    <DropdownMenuTrigger>
                        <Photo
                            src={auth.user.image_url as string}
                            alt={auth.user.name}
                            className='size-8'
                            skeletonClassName='size-8'
                        />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
                        align='end'
                        sideOffset={16}
                    >
                        <UserMenuContent />
                    </DropdownMenuContent>
                </DropdownMenu>
            </header>

            <Separator />

            {(isLoading || !data) ? (
                <section className='mx-auto max-w-2xl space-y-4 p-4'>
                    <Skeleton className='h-6 w-20' />
                    <Skeleton className='h-20.75 w-full' />
                    <Skeleton className='h-20.75 w-full' />
                    <Skeleton className='h-20.75 w-full' />
                    <Skeleton className='h-20.75 w-full' />
                    <Skeleton className='h-20.75 w-full' />
                    <Skeleton className='h-20.75 w-full' />
                </section>
            ) : (
                <section className='mx-auto max-w-2xl space-y-4 p-4'>
                    <h1 className='space-x-2'>
                        <span className='font-semibold'>Contacts</span>
                        <span>&#8226;</span>
                        <span className='font-semibold'>{data.length}</span>
                    </h1>

                    {data.map(chat => <Contact key={chat.id} chat={chat} isOutsideSidebar />)}
                </section>
            )}
        </div>
    )
}
