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

        if (start !== value.length) {
            const position = start + emoji.length

            input.selectionStart = position
            input.selectionEnd = position
        }
    }

    return { textarea, insertEmoji }
}
