import { Link, router, usePage } from '@inertiajs/react'
import { useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Search, UserMinus, UserPlus } from 'lucide-react'
import { type ChangeEvent, Fragment, ReactNode, useEffect, useState } from 'react'
import { toast } from 'sonner'

import AppLogo from '@/components/app-logo'
import Contact from '@/components/contact'
import Notifications from '@/components/notifications'
import Photo from '@/components/photo'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UserMenuContent } from '@/components/user-menu-content'
import useChats from '@/hooks/use-chats'
import { useDebounce } from '@/hooks/use-limit'
import type { Chat, User } from '@/types/models'

type Props = {
    tab: TabKey;
    chatsCount: number;
    receivedRequestsCount: number;
    sentRequestsCount: number;
}

type TabKey = 'chats' | 'sent-requests' | 'received-requests'

type TabProps<T> = {
    queryKey: TabKey;
    emptyMessage?: string;
    children: (data: T[]) => ReactNode;
}

type UserRequest = Pick<User, 'id' | 'name' | 'image_url'>

export default function Home({ tab = 'chats', chatsCount, receivedRequestsCount, sentRequestsCount }: Props) {
    const { name, auth } = usePage().props

    return (
        <div>
            <header className='mx-auto flex max-w-2xl items-center gap-4 py-2 pr-4 pl-2'>
                <Link href='/' className='inline-flex h-12 items-center gap-3 p-2'>
                    <AppLogo className='size-6!' />
                    <h1 className='truncate text-sm leading-tight font-semibold'>{name}</h1>
                </Link>

                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant='ghost' size='icon-sm' className='relative ml-auto data-[state=open]:bg-accent data-[state=open]:text-accent-foreground data-[state=open]:hover:bg-accent! data-[state=open]:hover:text-accent-foreground!'>
                            <Search />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className='top-[10%] translate-y-0 overflow-hidden p-0 [&>button]:top-[21px] [&>button]:right-5 [&>button]:rounded-full'>
                        <SearchBox />
                    </DialogContent>
                </Dialog>

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
                            {!!chatsCount && <span>({chatsCount})</span>}
                        </TabsTrigger>
                        <TabsTrigger value='received-requests' className='cursor-pointer py-2 text-xs sm:text-sm'>
                            <span className='font-semibold'>Received requests</span>
                            {!!receivedRequestsCount && <span>({receivedRequestsCount})</span>}
                        </TabsTrigger>
                        <TabsTrigger value='sent-requests' className='cursor-pointer py-2 text-xs sm:text-sm'>
                            <span className='font-semibold'>Sent requests</span>
                            {!!sentRequestsCount && <span>({sentRequestsCount})</span>}
                        </TabsTrigger>
                    </TabsList>

                    {/* CONTACTS */}
                    <TabsContent value='chats'>
                        <Tab<Chat> queryKey='chats' emptyMessage="You haven't added anyone to your contacts yet.">
                            {data => (
                                <div className='space-y-4'>
                                    {data.map(chat => <Contact key={chat.id} chat={chat} isOutsideSidebar />)}
                                </div>
                            )}
                        </Tab>
                    </TabsContent>

                    {/* RECEIVED REQUESTS */}
                    <TabsContent value='received-requests'>
                        <Tab<UserRequest> queryKey='received-requests'>
                            {data => (
                                <div className='space-y-4'>
                                    {data.map(user => <AppUser key={user.id} user={user} isRequesting />)}
                                </div>
                            )}
                        </Tab>
                    </TabsContent>

                    {/* SENT REQUESTS */}
                    <TabsContent value='sent-requests'>
                        <Tab<UserRequest> queryKey='sent-requests'>
                            {data => (
                                <div className='space-y-4'>
                                    {data.map(user => <AppUser key={user.id} user={user} />)}
                                </div>
                            )}
                        </Tab>
                    </TabsContent>
                </Tabs>
            </section>
        </div>
    )
}

function SearchBox() {
    const [results, setResults] = useState<(User & { request_sent: boolean; is_added: boolean })[]>([])
    const { debounce } = useDebounce()

    function getUsers(name: string = '') {
        fetch(`/users?name=${name}`)
            .then(response => response.json())
            .then(users => setResults(users))
    }

    function search(event: ChangeEvent<HTMLInputElement>) {
        debounce(getUsers.bind(null, event.target.value))
    }

    useEffect(() => {
        getUsers()
    }, [])

    return (
        <div className='space-y-4'>
            <div className='space-y-2 px-4 pt-4'>
                <h2>Search</h2>
                <Input placeholder='Enter a name or username...' onChange={search} />
            </div>

            {results.length ? (
                <div className='max-h-[50vh] overflow-y-auto'>
                    {results.map(result => <SearchResult key={result.id} result={result} />)}
                </div>
            ) : (
                <div className='pb-4'>
                    <p className='text-center text-sm text-muted-foreground'>No records found.</p>
                </div>
            )}
        </div>
    )
}

function SearchResult({ result }: { result: User & { request_sent: boolean; is_added: boolean } }) {
    const [added, setAdded] = useState<boolean>(result.request_sent)
    const { debounce, canStopDebounce, stopDebounce } = useDebounce(1000)
    const queryClient = useQueryClient()

    function add() {
        if (result.is_added) {
            return
        }

        setAdded(true)

        debounce(async () => {
            try {
                await axios.post(`/requests/${result.id}/add`)
                await queryClient.invalidateQueries({ queryKey: ['sent-requests'] })
                router.reload({ only: ['sentRequestsCount'] })
            } catch (e) {
                console.log(e)

                toast.error('Something went wrong', {
                    position: 'bottom-right',
                    closeButton: true,
                })
            }
        })
    }

    function cancel() {
        if (result.is_added) {
            return
        }

        setAdded(false)

        if (canStopDebounce) {
            stopDebounce()
        } else {
            axios.delete(`/requests/${result.id}/cancel`)
        }
    }

    return (
        <div className='flex items-center gap-3 px-4 py-2 hover:bg-card'>
            <Photo
                src={result.image_url || undefined}
                alt={result.name}
                className='size-10'
                skeletonClassName='size-10'
            />

            <div className='space-y-1'>
                <h1 className='truncate text-sm font-semibold'>{result.name}</h1>
                <h6 className='text-xs text-foreground/80'>{result.username}</h6>
            </div>

            {!result.is_added && (
                <Fragment>
                    {added ? (
                        <Button
                            variant='ghost'
                            size='icon-sm'
                            className='ml-auto hover:text-[initial]'
                            onClick={cancel}
                        >
                            <UserMinus />
                        </Button>
                    ) : (
                        <Button
                            variant='ghost'
                            size='icon-sm'
                            className='ml-auto text-accent-foreground/80 dark:hover:bg-accent'
                            onClick={add}
                        >
                            <UserPlus />
                        </Button>
                    )}
                </Fragment>
            )}
        </div>
    )
}

function Tab<T>({ queryKey, emptyMessage = 'You\'re all caught up.', children }: TabProps<T>) {
    const { data, isLoading } = useChats<T>(queryKey)

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

function AppUser({ user, isRequesting = false }: { user: UserRequest; isRequesting?: boolean }) {
    const queryClient = useQueryClient()
    const [isLoading, setIsLoading] = useState<boolean>(false)

    async function accept() {
        setIsLoading(true)

        try {
            const { data: chat } = await axios.post<Chat>(`/requests/${user.id}/accept`)

            queryClient.setQueryData<Chat[]>(['chats'], current => (
                current ? [chat, ...current] : current
            ))

            await queryClient.invalidateQueries({ queryKey: ['received-requests'] })
            router.reload({ only: ['receivedRequestsCount'] })
        } catch (e) {
            console.log(e)

            setIsLoading(false)

            toast.error('Something went wrong', {
                position: 'bottom-right',
                closeButton: true,
            })
        }
    }

    async function decline() {
        setIsLoading(true)

        try {
            await axios.delete(`/requests/${user.id}/decline`)
            await queryClient.invalidateQueries({ queryKey: ['received-requests'] })
            router.reload({ only: ['receivedRequestsCount'] })
        } catch (e) {
            console.log(e)

            setIsLoading(false)

            toast.error('Something went wrong', {
                position: 'bottom-right',
                closeButton: true,
            })
        }
    }

    async function cancel() {
        setIsLoading(true)

        try {
            await axios.delete(`/requests/${user.id}/cancel`)
            await queryClient.invalidateQueries({ queryKey: ['sent-requests'] })
            router.reload({ only: ['sentRequestsCount'] })
        } catch (e) {
            console.log(e)

            setIsLoading(false)

            toast.error('Something went wrong', {
                position: 'bottom-right',
                closeButton: true,
            })
        }
    }

    return (
        <Card>
            <CardContent className='flex items-center gap-3'>
                <Photo
                    src={user.image_url || undefined}
                    alt='Image'
                    className='size-13'
                    skeletonClassName='size-13'
                />

                <div className='space-y-2'>
                    <h1 className='truncate font-semibold'>{user.name}</h1>
                    {isRequesting ? (
                        <div className='space-x-2'>
                            <Button
                                size='xs'
                                disabled={isLoading}
                                onClick={accept}
                            >
                                Accept
                            </Button>
                            <Button
                                variant='outline'
                                size='xs'
                                disabled={isLoading}
                                onClick={decline}
                            >
                                Decline
                            </Button>
                        </div>
                    ) : (
                        <Button
                            variant='destructive'
                            size='xs'
                            disabled={isLoading}
                            onClick={cancel}
                        >
                            Cancel
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
