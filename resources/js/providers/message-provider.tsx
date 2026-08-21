import { createContext, type Dispatch, type ReactNode, type SetStateAction, useMemo, useState } from 'react'

type Image = File | string | null
type Gif = string | null
type Context = {
    image: Image;
    gif: Gif;
    reference: string | null;
    previewImage: Image | Gif;
    setImage: Dispatch<SetStateAction<Image>>;
    setGif: Dispatch<SetStateAction<Gif>>;
    setReference: Dispatch<SetStateAction<string | null>>;
    revokePreviewImage: CallableFunction;
}

export const MessageContext = createContext<Context>({} as Context)

export default function MessageProvider({ children }: { children: ReactNode }) {
    const [image, setImage] = useState<Image>(null)
    const [gif, setGif] = useState<Gif>(null)
    const [reference, setReference] = useState<string | null>(null)

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

    function revokePreviewImage() {
        if (image instanceof File && previewImage) {
            URL.revokeObjectURL(previewImage)
        }
    }

    return (
        <MessageContext value={{
            image,
            gif,
            reference,
            previewImage,
            setImage,
            setGif,
            setReference,
            revokePreviewImage,
        }}>
            {children}
        </MessageContext>
    )
}
