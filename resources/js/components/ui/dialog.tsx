import { XIcon } from 'lucide-react'
import { Close, Content, Description, Overlay, Portal, Root, Title, Trigger } from 'radix-ui/dialog'
import type { ComponentProps } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function Dialog(props: ComponentProps<typeof Root>) {
    return <Root data-slot='dialog' {...props} />
}

function DialogTrigger(props: ComponentProps<typeof Trigger>) {
    return <Trigger data-slot='dialog-trigger' {...props} />
}

function DialogPortal(props: ComponentProps<typeof Portal>) {
    return <Portal data-slot='dialog-portal' {...props} />
}

function DialogClose(props: ComponentProps<typeof Close>) {
    return <Close data-slot='dialog-close' {...props} />
}

function DialogOverlay({ className, ...props }: ComponentProps<typeof Overlay>) {
    return (
        <Overlay
            data-slot='dialog-overlay'
            className={cn(
                'fixed inset-0 isolate z-50 bg-black/10 duration-100 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 supports-backdrop-filter:backdrop-blur-xs',
                className,
            )}
            {...props}
        />
    )
}

function DialogContent({
    className,
    children,
    showCloseButton = true,
    ...props
}: ComponentProps<typeof Content> & { showCloseButton?: boolean }) {
    return (
        <DialogPortal>
            <DialogOverlay />
            <Content
                data-slot='dialog-content'
                className={cn(
                    'fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-1/2 gap-4 rounded-xl bg-popover p-4 text-sm text-popover-foreground ring-1 ring-foreground/10 duration-100 outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 sm:max-w-sm',
                    className,
                )}
                {...props}
            >
                {children}

                {showCloseButton && (
                    <Close data-slot='dialog-close' asChild>
                        <Button
                            variant='ghost'
                            className='absolute top-2 right-2'
                            size='icon-xs'
                        >
                            <XIcon size={16} />
                            <span className='sr-only'>Close</span>
                        </Button>
                    </Close>
                )}
            </Content>
        </DialogPortal>
    )
}

function DialogHeader({ className, ...props }: ComponentProps<'div'>) {
    return (
        <div
            data-slot='dialog-header'
            className={cn('flex flex-col gap-2', className)}
            {...props}
        />
    )
}

function DialogFooter({
    className,
    showCloseButton = false,
    children,
    ...props
}: ComponentProps<'div'> & { showCloseButton?: boolean }) {
    return (
        <div
            data-slot='dialog-footer'
            className={cn(
                '-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 sm:flex-row sm:justify-end',
                className,
            )}
            {...props}
        >
            {children}
            {showCloseButton && (
                <Close asChild>
                    <Button variant='outline'>Close</Button>
                </Close>
            )}
        </div>
    )
}

function DialogTitle({ className, ...props }: ComponentProps<typeof Title>) {
    return (
        <Title
            data-slot='dialog-title'
            className={cn(
                'cn-font-heading text-base leading-none font-medium',
                className,
            )}
            {...props}
        />
    )
}

function DialogDescription({ className, ...props }: ComponentProps<typeof Description>) {
    return (
        <Description
            data-slot='dialog-description'
            className={cn(
                'text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground',
                className,
            )}
            {...props}
        />
    )
}

export {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogOverlay,
    DialogPortal,
    DialogTitle,
    DialogTrigger,
}
