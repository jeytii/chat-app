import { CheckIcon, ChevronRightIcon } from 'lucide-react'
import { CheckboxItem, Content, Group, Item, ItemIndicator, Label, Portal, RadioGroup, RadioItem, Root, Separator, Sub, SubContent, SubTrigger, Trigger } from 'radix-ui/context-menu'
import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

function ContextMenu(props: ComponentProps<typeof Root>) {
    return <Root data-slot='context-menu' {...props} />
}

function ContextMenuTrigger({ className, ...props }: ComponentProps<typeof Trigger>) {
    return <Trigger data-slot='context-menu-trigger' className={cn('select-none', className)} {...props} />
}

function ContextMenuGroup(props: ComponentProps<typeof Group>) {
    return <Group data-slot='context-menu-group' {...props} />
}

function ContextMenuPortal(props: ComponentProps<typeof Portal>) {
    return <Portal data-slot='context-menu-portal' {...props} />
}

function ContextMenuSub(props: ComponentProps<typeof Sub>) {
    return <Sub data-slot='context-menu-sub' {...props} />
}

function ContextMenuRadioGroup(props: ComponentProps<typeof RadioGroup>) {
    return <RadioGroup data-slot='context-menu-radio-group' {...props} />
}

function ContextMenuContent({ className, ...props }: ComponentProps<typeof Content> & { side?: 'top' | 'right' | 'bottom' | 'left' }) {
    return (
        <Portal>
            <Content
                data-slot='context-menu-content'
                className={cn('z-50 max-h-(--radix-context-menu-content-available-height) min-w-36 origin-(--radix-context-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95', className)}
                {...props}
            />
        </Portal>
    )
}

function ContextMenuItem({
    className,
    inset,
    variant = 'default',
    ...props
}: ComponentProps<typeof Item> & {
    inset?: boolean
    variant?: 'default' | 'destructive'
}) {
    return (
        <Item
            data-slot='context-menu-item'
            data-inset={inset}
            data-variant={variant}
            className={cn(
                'group/context-menu-item relative flex cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 data-inset:pl-7 data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive dark:data-[variant=destructive]:focus:bg-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=\'size-\'])]:size-4 focus:*:[svg]:text-accent-foreground data-[variant=destructive]:*:[svg]:text-destructive',
                className,
            )}
            {...props}
        />
    )
}

function ContextMenuSubTrigger({
    className,
    inset,
    children,
    ...props
}: ComponentProps<typeof SubTrigger> & { inset?: boolean }) {
    return (
        <SubTrigger
            data-slot='context-menu-sub-trigger'
            data-inset={inset}
            className={cn(
                'flex cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-inset:pl-7 data-[state=open]:bg-accent data-[state=open]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=\'size-\'])]:size-4',
                className,
            )}
            {...props}
        >
            {children}
            <ChevronRightIcon className='cn-rtl-flip ml-auto' />
        </SubTrigger>
    )
}

function ContextMenuSubContent({ className, ...props }: ComponentProps<typeof SubContent>) {
    return (
        <SubContent
            data-slot='context-menu-sub-content'
            className={cn('z-50 min-w-32 origin-(--radix-context-menu-content-transform-origin) overflow-hidden rounded-lg border bg-popover p-1 text-popover-foreground shadow-lg duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95', className)}
            {...props}
        />
    )
}

function ContextMenuCheckboxItem({
    className,
    children,
    checked,
    inset,
    ...props
}: ComponentProps<typeof CheckboxItem> & { inset?: boolean }) {
    return (
        <CheckboxItem
            data-slot='context-menu-checkbox-item'
            data-inset={inset}
            className={cn(
                'relative flex cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 data-inset:pl-7 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=\'size-\'])]:size-4',
                className,
            )}
            checked={checked}
            {...props}
        >
            <span className='pointer-events-none absolute right-2'>
                <ItemIndicator>
                    <CheckIcon />
                </ItemIndicator>
            </span>

            {children}
        </CheckboxItem>
    )
}

function ContextMenuRadioItem({
    className,
    children,
    inset,
    ...props
}: ComponentProps<typeof RadioItem> & { inset?: boolean }) {
    return (
        <RadioItem
            data-slot='context-menu-radio-item'
            data-inset={inset}
            className={cn(
                'relative flex cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 data-inset:pl-7 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=\'size-\'])]:size-4',
                className,
            )}
            {...props}
        >
            <span className='pointer-events-none absolute right-2'>
                <ItemIndicator>
                    <CheckIcon />
                </ItemIndicator>
            </span>

            {children}
        </RadioItem>
    )
}

function ContextMenuLabel({ className, inset, ...props }: ComponentProps<typeof Label> & { inset?: boolean }) {
    return (
        <Label
            data-slot='context-menu-label'
            data-inset={inset}
            className={cn(
                'px-1.5 py-1 text-xs font-medium text-muted-foreground data-inset:pl-7',
                className,
            )}
            {...props}
        />
    )
}

function ContextMenuSeparator({ className, ...props }: ComponentProps<typeof Separator>) {
    return (
        <Separator
            data-slot='context-menu-separator'
            className={cn('-mx-1 my-1 h-px bg-border', className)}
            {...props}
        />
    )
}

function ContextMenuShortcut({ className, ...props }: ComponentProps<'span'>) {
    return (
        <span
            data-slot='context-menu-shortcut'
            className={cn(
                'ml-auto text-xs tracking-widest text-muted-foreground group-focus/context-menu-item:text-accent-foreground',
                className,
            )}
            {...props}
        />
    )
}

export {
    ContextMenu,
    ContextMenuCheckboxItem,
    ContextMenuContent,
    ContextMenuGroup,
    ContextMenuItem,
    ContextMenuLabel,
    ContextMenuPortal,
    ContextMenuRadioGroup,
    ContextMenuRadioItem,
    ContextMenuSeparator,
    ContextMenuShortcut,
    ContextMenuSub,
    ContextMenuSubContent,
    ContextMenuSubTrigger,
    ContextMenuTrigger,
}
