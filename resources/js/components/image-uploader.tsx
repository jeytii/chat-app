import { useForm } from '@inertiajs/react'
import { Upload } from 'lucide-react'
import { type ChangeEvent, useRef, useState } from 'react'
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

        const blob = URL.createObjectURL(file)
        let img: HTMLImageElement | null = new Image()
        let isBelowMinimum = false

        img.src = blob

        img.onload = () => {
            isBelowMinimum = (img?.naturalWidth as number) < 200 || (img?.naturalHeight as number) < 200
        }

        if (isBelowMinimum) {
            URL.revokeObjectURL(img.src)
        } else {
            setImage(file)

            preview.current = blob

            modal.current?.showModal()
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
        if (image && preview.current) {
            URL.revokeObjectURL(preview.current)
            setImage(null)
        }

        reset()

        modal.current?.close()
    }

    return (
        <>
            <div className='flex items-center gap-2'>
                <div className='min-w-30 min-h-30 relative inline-block'>
                    <Photo
                        src={src}
                        size={120}
                        className='size-30 rounded-full'
                    />

                    <Button type='button' size='icon-sm' className='absolute bottom-0 right-0 px-0'>
                        <label className='flex items-center justify-center size-full rounded-full'>
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

            <dialog ref={modal} className='backdrop:opacity-90 backdrop:bg-black m-auto'>
                {!!image && (
                    <div className='min-w-full max-w-[90vw] max-h-[90vh] min-h-full overflow-auto space-y-4 p-4'>
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
                                containerClassName: 'relative! max-w-[900px] max-h-[900px]',
                                cropAreaClassName: 'top-auto! left-auto! translate-1/2!',
                                mediaClassName: 'static!',
                            }}
                        />

                        <div className='text-right space-x-2'>
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
                )}
            </dialog>
        </>
    )
}
