import { useForm } from '@inertiajs/react'
import { Upload } from 'lucide-react'
import { type ChangeEvent, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Cropper, { type Area } from 'react-easy-crop'

import Photo from '@/components/photo'
import { Button } from '@/components/ui/button'

export function ImageUploader({ src }: { src: string }) {
    const [image, setImage] = useState<File | null>(null)
    const rect = useForm({ x: 0, y: 0, width: 0, height: 0 })
    const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
    const [zoom, setZoom] = useState<number>(1)
    const modal = useRef<HTMLDialogElement>(null)
    const preview = useRef<string>(null)

    async function upload(event: ChangeEvent<HTMLInputElement>) {
        const file = (event.target.files as FileList)[0]

        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            return
        }

        const temporaryUrl = URL.createObjectURL(file)
        let img: HTMLImageElement | null = new Image()
        let isBelowMinimum = false

        img.src = temporaryUrl

        img.onload = () => {
            isBelowMinimum = (img?.naturalWidth as number) < 200 || (img?.naturalHeight as number) < 200
        }

        if (isBelowMinimum) {
            URL.revokeObjectURL(img.src)
        } else {
            modal.current?.classList.add('animate-in', 'fade-in-0', 'zoom-in-95')

            setImage(file)

            preview.current = temporaryUrl

            modal.current?.showModal()

            document.body.classList.add('overflow-hidden')
        }

        img = null
    }

    function set() {
        rect.transform(data => ({
            image,
            crop: data,
            _method: 'PUT',
        }))

        rect.post('/settings/profile-photo', {
            onSuccess: cancel,
        })
    }

    function finish(area: Area) {
        rect.setData(area)
    }

    function reset() {
        setCrop({ x: 0, y: 0 })
        setZoom(1)
    }

    function cancel() {
        modal.current?.classList.replace('animate-in', 'animate-out')
        modal.current?.classList.replace('fade-in-0', 'fade-out-0')
        modal.current?.classList.replace('zoom-in-95', 'zoom-out-95')

        setTimeout(() => {
            if (image && preview.current) {
                URL.revokeObjectURL(preview.current)
                preview.current = null
                setImage(null)
            }

            reset()

            modal.current?.close()

            modal.current?.classList.remove('animate-out', 'fade-out-0', 'zoom-out-95')

            document.body.classList.remove('overflow-hidden')
        }, 120)
    }

    return (
        <>
            <div className='flex items-center gap-2'>
                <div className='relative inline-block min-h-30 min-w-30'>
                    <Photo src={src} className='size-30' skeletonClassName='size-30' />

                    <Button type='button' size='icon-sm' className='absolute right-0 bottom-0 px-0'>
                        <label className='flex size-full items-center justify-center rounded-full'>
                            <input
                                type='file'
                                name='image'
                                accept='image/jpeg, image/png, image/webp'
                                className='hidden'
                                onChange={upload}
                            />
                            <Upload />
                        </label>
                    </Button>
                </div>
                <div className='space-y-1'>
                    <p className='text-sm text-muted-foreground'><b>Dimensions</b>: at least 200x200</p>
                    <p className='text-sm text-muted-foreground'><b>Formats</b>: JPG, PNG, WEBP</p>
                </div>
            </div>

            {document instanceof Document && createPortal(
                <dialog ref={modal} className='m-auto bg-transparent backdrop:bg-black backdrop:opacity-90'>
                    <div className='space-y-4'>
                        <Cropper
                            image={preview.current as string}
                            crop={crop}
                            zoom={zoom}
                            aspect={1 / 1}
                            cropShape='round'
                            showGrid={false}
                            onCropChange={setCrop}
                            onZoomChange={setZoom}
                            onCropComplete={finish}
                            classes={{
                                containerClassName: 'relative! max-h-[calc(90vh-48px)] max-w-[90vw] border rounded-md',
                                mediaClassName: 'static! max-w-[90vw]! max-h-[calc(90vh-48px)]!',
                            }}
                        />

                        <div className='space-x-2 text-right'>
                            <Button
                                variant='outline'
                                size='sm'
                                disabled={rect.processing}
                                className='text-xs sm:text-sm'
                                onClick={cancel}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant='outline'
                                size='sm'
                                disabled={rect.processing}
                                className='text-xs sm:text-sm'
                                onClick={reset}
                            >
                                Reset
                            </Button>
                            <Button
                                size='sm'
                                disabled={rect.processing}
                                className='text-xs sm:text-sm'
                                onClick={set}
                            >
                                Set as profile photo
                            </Button>
                        </div>
                    </div>
                </dialog>,
                document.body,
            )}
        </>
    )
}
