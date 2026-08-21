import { createContext, type Dispatch, type ReactNode, type SetStateAction, useEffect, useMemo, useState } from 'react'

type Str = string | null
type Image = File | Str
type Context = {
    content: Str;
    image: Image;
    gif: Str;
    reference: Str;
    previewImage: Str;
    editId: Str;
    setContent: Dispatch<SetStateAction<Str>>;
    setImage: Dispatch<SetStateAction<Image>>;
    setGif: Dispatch<SetStateAction<Str>>;
    setReference: Dispatch<SetStateAction<Str>>;
    setEditId: Dispatch<SetStateAction<Str>>;
    revokePreviewImage: CallableFunction;
}

export const MessageContext = createContext<Context>({} as Context)

export default function MessageProvider({ children }: { children: ReactNode }) {
    const [content, setContent] = useState<Str>(null)
    const [image, setImage] = useState<Image>(null)
    const [gif, setGif] = useState<Str>(null)
    const [reference, setReference] = useState<Str>(null)
    const [editId, setEditId] = useState<Str>(null)

    const previewImage = useMemo(() => {
        if (image) {
            return image instanceof File
                ? URL.createObjectURL(image)
                : image
        }

        if (gif) {
            return gif
        }

        return null
    }, [image, gif])

    useEffect(() => {
        const keydownCancel = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault()

                setEditId(null)
                setContent(null)
                setReference(null)

                if (image instanceof File && previewImage) {
                    URL.revokeObjectURL(previewImage)
                }

                setImage(null)
                setGif(null)
            }
        }

        document.addEventListener('keydown', keydownCancel)

        return () => {
            document.removeEventListener('keydown', keydownCancel)
        }
    }, [image, previewImage])

    function revokePreviewImage() {
        if (image instanceof File && previewImage) {
            URL.revokeObjectURL(previewImage)
        }
    }

    return (
        <MessageContext value={{
            content, image, gif, reference, editId, previewImage,
            setContent, setImage, setGif, setReference, setEditId, revokePreviewImage,
        }}>
            {children}
        </MessageContext>
    )
}
