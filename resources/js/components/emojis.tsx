import EmojiPicker, { EmojiClickData, EmojiStyle, Theme } from 'emoji-picker-react'
import { ReactNode, useState } from 'react'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useAppearance } from '@/hooks/use-appearance'

export default function Emojis({ onInsert, children }: { onInsert: (data: EmojiClickData) => void; children: ReactNode }) {
    const [open, setOpen] = useState<boolean>(false)
    const { appearance } = useAppearance()

    function insert(data: EmojiClickData) {
        onInsert(data)
        setOpen(true)
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                {children}
            </PopoverTrigger>
            <PopoverContent align='start' className='w-auto p-2'>
                <EmojiPicker
                    open={open}
                    theme={
                        {
                            light: Theme.LIGHT,
                            dark: Theme.DARK,
                            system: Theme.AUTO,
                        }[appearance]
                    }
                    emojiStyle={EmojiStyle.GOOGLE}
                    autoFocusSearch={false}
                    previewConfig={{ showPreview: false }}
                    skinTonesDisabled
                    lazyLoadEmojis
                    onEmojiClick={insert}
                />
            </PopoverContent>
        </Popover>
    )
}
