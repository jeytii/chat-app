import { useMemo, useState } from 'react'

export default function useAttachment(defaultImage: File | string | null = null, defaultGif: string | null = null) {
    const [image, setImage] = useState<File | string | null>(defaultImage)
    const [gif, setGif] = useState<string | null>(defaultGif)

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

    return { image, gif, previewImage, setImage, setGif, revokePreviewImage }
}
