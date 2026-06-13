import { ImagePlay, Send, Smile } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Textarea } from '@/components/ui/textarea'

export default function Home() {
    return (
        <>
            {/* ===== HEADER ===== */}
            <header className='sticky top-0 left-0 flex h-16 shrink-0 items-center gap-2 bg-background border-b border-sidebar-border/50 z-10 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4'>
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
            <div className='flex h-full max-h-[100vh-64] flex-1 flex-col gap-2 justify-end-safe overflow-y-auto rounded-xl p-4'>
                {/* Recipient - text */}
                <div>
                    <p className='inline-block max-w-[95%] bg-muted text-foreground text-sm rounded-lg py-2 px-4'>Hello</p>
                </div>
                {/* Recipient - landscape image */}
                <div>
                    <div className='max-w-[40%]'>
                        <img
                            src='https://i0.wp.com/photofocus.com/wp-content/uploads/2023/07/Unleashing-the-Beauty-of-Landscapes-16x9-Iceland_7042.jpeg?fit=2560%2C1440&ssl=1'
                            alt=''
                            className='rounded-lg'
                        />
                    </div>
                </div>
                {/* Recipient - portrait image */}
                <div>
                    <div className='max-w-[20%]'>
                        <img
                            src='https://cdn.shopify.com/s/files/1/0163/6622/files/Portrait-5_1024x1024.jpg?v=1660433857'
                            alt=''
                            className='rounded-lg'
                        />
                    </div>
                </div>
                {/* Recipient - GIF */}
                <div>
                    <div className='max-w-[20%]'>
                        <img
                            src='https://static.klipy.com/ii/935d7ab9d8c6202580a668421940ec81/14/af/y6iepZM7.gif'
                            alt=''
                            className='rounded-lg'
                        />
                    </div>
                </div>
                {/* Self - text */}
                <div className='flex justify-end-safe'>
                    <div className='relative inline-block max-w-[95%] text-right'>
                        <p className='bg-primary text-primary-foreground text-sm rounded-lg py-2 px-4'>Lorem ipsum</p>
                    </div>
                </div>
                {/* Self - landscape image */}
                <div className='flex justify-end-safe'>
                    <div className='max-w-[40%]'>
                        <img
                            src='https://i0.wp.com/photofocus.com/wp-content/uploads/2023/07/Unleashing-the-Beauty-of-Landscapes-16x9-Iceland_7042.jpeg?fit=2560%2C1440&ssl=1'
                            alt=''
                            className='rounded-lg'
                        />
                    </div>
                </div>
                {/* Self - portrait image */}
                <div className='flex justify-end-safe'>
                    <div className='max-w-[20%]'>
                        <img
                            src='https://cdn.shopify.com/s/files/1/0163/6622/files/Portrait-5_1024x1024.jpg?v=1660433857'
                            alt=''
                            className='rounded-lg'
                        />
                    </div>
                </div>
                {/* Self - GIF */}
                <div className='flex justify-end-safe'>
                    <div className='relative inline-block max-w-[20%] text-right'>
                        <img
                            src='https://static.klipy.com/ii/935d7ab9d8c6202580a668421940ec81/14/af/y6iepZM7.gif'
                            alt=''
                            className='rounded-lg'
                        />
                        <img
                            src='https://placehold.co/12x12'
                            alt=''
                            className='absolute -bottom-1 -left-px size-4 rounded-full'
                        />
                    </div>
                </div>
                {/*<p className='text-sm text-center text-muted-foreground'>Say hi to start a conversation with John Doe.</p>*/}
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
