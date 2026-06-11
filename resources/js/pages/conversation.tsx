import { ImagePlay, Send, Smile } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Textarea } from '@/components/ui/textarea'

export default function Home() {
    return (
        <>
            {/* ===== HEADER ===== */}
            <header className='sticky top-0 left-0 flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border/50 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4'>
                <div className='flex items-center gap-2'>
                    <SidebarTrigger className='-ml-1' />
                    <Avatar className='size-10'>
                        <AvatarImage src='https://placehold.co/40x40' />
                        <AvatarFallback className='text-xs'>JD</AvatarFallback>
                    </Avatar>
                    <div>
                        <h1>John Doe</h1>
                        <p className='text-xs text-green-600 dark:text-green-400'>Online</p>
                        {/*<p className='text-xs text-muted-foreground'>Offline</p>*/}
                    </div>
                </div>
            </header>

            {/* ===== MESSAGES ===== */}
            <div className='flex h-full max-h-[100vh-64] flex-1 flex-col gap-4 overflow-y-auto rounded-xl p-4'>
                <div className='grid auto-rows-min gap-4 md:grid-cols-3'>
                    <div className='relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border'>
                        <PlaceholderPattern className='absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20' />
                    </div>
                    <div className='relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border'>
                        <PlaceholderPattern className='absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20' />
                    </div>
                    <div className='relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border'>
                        <PlaceholderPattern className='absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20' />
                    </div>
                    <div className='relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border'>
                        <PlaceholderPattern className='absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20' />
                    </div>
                </div>
            </div>

            {/* ===== MESSAGE BOX ===== */}
            <div className='sticky bottom-0 left-0 flex shrink-0 justify-center items-center gap-4 bg-background border-t border-sidebar-border/50 p-4 z-10'>
                <Textarea placeholder='Type a message...' className='min-h-auto text-sm' />
                <Button
                    variant='outline'
                    size='icon'
                    className='bg-accent text-accent-foreground'
                >
                    <Smile />
                </Button>
                <Button
                    variant='outline'
                    size='icon'
                    className='bg-accent text-accent-foreground text-xs'
                >
                    GIF
                </Button>
                <Button
                    variant='outline'
                    size='icon'
                    className='bg-accent text-accent-foreground'
                >
                    <ImagePlay />
                </Button>
                <Button
                    variant='outline'
                    size='icon'
                    className='bg-accent text-accent-foreground'
                    disabled
                >
                    <Send />
                </Button>
            </div>
        </>
    )
}
