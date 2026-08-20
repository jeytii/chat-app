import { EmojiClickData } from 'emoji-picker-react'
import { useRef } from 'react'

export default function useEmojiPicker() {
    const textarea = useRef<HTMLTextAreaElement>(null)

    const insertEmoji = ({ emoji }: EmojiClickData) => {
        const input = textarea.current as HTMLTextAreaElement
        const start = input.selectionStart
        const end = input.selectionEnd
        const value = input.value

        input.value = value.substring(0, start) + emoji + value.substring(end)

        input.focus()

        setTimeout(() => {
            input.selectionStart = start + emoji.length
            input.selectionEnd = start + emoji.length
        }, 0)
    }

    return { textarea, insertEmoji }
}
