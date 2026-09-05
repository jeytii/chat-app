import { Link, usePage } from '@inertiajs/react'
import { ReactNode } from 'react'

import AppLogo from '@/components/app-logo'
import Contact from '@/components/contact'
import Notifications from '@/components/notifications'
import Photo from '@/components/photo'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UserMenuContent } from '@/components/user-menu-content'
import useChats from '@/hooks/use-chats'
import type { Chat, Notification, User } from '@/types/models'

type Props = {
    tab: Notification['tab'];
    chats_count: number;
    sent_requests_count: number;
    received_requests_count: number;
}

export default function Home({ tab = 'chats', ...props }: Props) {
    const { name, auth } = usePage().props

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
                        className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-t-none rounded-b-lg'
                        align='end'
                        sideOffset={16}
                    >
                        <UserMenuContent />
                    </DropdownMenuContent>
                </DropdownMenu>
            </header>

            <Separator />

            <section className='mx-auto max-w-2xl p-4'>
                <Tabs defaultValue={tab} className='gap-4'>
                    <TabsList className='h-auto! w-full'>
                        <TabsTrigger value='chats' className='cursor-pointer py-2 text-xs sm:text-sm'>
                            <span className='font-semibold'>Contacts</span>
                            {!!props.chats_count && <span>({props.chats_count})</span>}
                        </TabsTrigger>
                        <TabsTrigger value='received-requests' className='cursor-pointer py-2 text-xs sm:text-sm'>
                            <span className='font-semibold'>Received requests</span>
                            {!!props.received_requests_count && <span>({props.received_requests_count})</span>}
                        </TabsTrigger>
                        <TabsTrigger value='sent-requests' className='cursor-pointer py-2 text-xs sm:text-sm'>
                            <span className='font-semibold'>Sent requests</span>
                            {!!props.sent_requests_count && <span>({props.sent_requests_count})</span>}
                        </TabsTrigger>
                    </TabsList>

                    {/* CONTACTS */}
                    <TabsContent value='chats'>
                        <Tab<Chat> tab='chats' emptyMessage="You haven't added anyone to your contacts yet.">
                            {data => (
                                <div className='space-y-4'>
                                    {data.map(chat => <Contact key={chat.id} chat={chat} isOutsideSidebar />)}
                                </div>
                            )}
                        </Tab>
                    </TabsContent>

                    {/* RECEIVED REQUESTS */}
                    <TabsContent value='received-requests'>
                        <Tab<Pick<User, 'id' | 'name' | 'image_url'>> tab='received-requests'>
                            {data => (
                                <div className='space-y-4'>
                                    {data.map(user => <AppUser key={user.id} user={user} tab='received-requests' />)}
                                </div>
                            )}
                        </Tab>
                    </TabsContent>

                    {/* SENT REQUESTS */}
                    <TabsContent value='sent-requests'>
                        <Tab<Pick<User, 'id' | 'name' | 'image_url'>> tab='sent-requests'>
                            {data => (
                                <div className='space-y-4'>
                                    {data.map(user => <AppUser key={user.id} user={user} tab='sent-requests' />)}
                                </div>
                            )}
                        </Tab>
                    </TabsContent>
                </Tabs>
            </section>
        </div>
    )
}

function Tab<T>({
    tab,
    emptyMessage = 'You\'re all caught up.',
    children,
}: { tab: Notification['tab']; emptyMessage?: string; children: (data: T[]) => ReactNode }) {
    const { data, isLoading } = useChats<T>(tab)

    if (isLoading || !data) {
        return (
            <div className='space-y-4'>
                <Skeleton className='h-20.75 w-full' />
                <Skeleton className='h-20.75 w-full' />
                <Skeleton className='h-20.75 w-full' />
                <Skeleton className='h-20.75 w-full' />
                <Skeleton className='h-20.75 w-full' />
                <Skeleton className='h-20.75 w-full' />
            </div>
        )
    }

    if (!data.length) {
        return <p className='text-center text-muted-foreground'>{emptyMessage}</p>
    }

    return children(data)
}

function AppUser({ tab, user }: { tab: Notification['tab']; user: Pick<User, 'id' | 'name' | 'image_url'> }) {
    return (
        <Card>
            <CardContent className='flex items-center gap-3'>
                <div className='rounded-full'>
                    <Photo
                        src={user.image_url || undefined}
                        alt='Image'
                        className='size-13'
                        skeletonClassName='size-13'
                    />
                </div>

                <div className='space-y-2'>
                    <h1 className='truncate font-semibold'>{user.name}</h1>
                    {tab === 'received-requests' ? (
                        <div className='space-x-2'>
                            <Button size='xs'>Accept</Button>
                            <Button variant='outline' size='xs'>Decline</Button>
                        </div>
                    ) : (
                        <Button variant='destructive' size='xs'>Cancel</Button>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
