import { useForm } from '@inertiajs/react'
import { Upload } from 'lucide-react'
import { type ChangeEvent, useMemo, useRef, useState } from 'react'
import Cropper, { type Area } from 'react-easy-crop'

import { Photo } from '@/components/photo'
import { Button } from '@/components/ui/button'

export function ImageUploader({ src }: { src: string }) {
    const [image, setImage] = useState<File | null>(null)
    const rect = useForm({ x: 0, y: 0, width: 0, height: 0 })
    const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
    const [zoom, setZoom] = useState<number>(1)
    const modal = useRef<HTMLDialogElement>(null)
    const preview = useMemo(() => image ? URL.createObjectURL(image) : null, [image])

    function upload(event: ChangeEvent<HTMLInputElement>) {
        const file = (event.target.files as FileList)[0]

        setImage(file)

        modal.current?.showModal()
    }

    function set() {
        rect.transform(data => ({
            image,
            crop: data,
            _method: 'PATCH',
        }))

        rect.post('/settings/change-profile-photo', {
            onSuccess() {
                reset()
                cancel()
            },
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
        if (image) {
            URL.revokeObjectURL(preview as string)
            setImage(null)
        }

        modal.current?.close()
    }

    return (
        <>
            <div className='flex items-center gap-4'>
                <Photo
                    src={src}
                    size={120}
                    className='size-30 rounded-full'
                />

                <Button type='button' size='sm' className='px-0'>
                    <label className='flex items-center gap-2 size-full rounded-md px-3'>
                        <input
                            type='file'
                            name='image'
                            accept='image/jpeg, image/png, image/webp'
                            className='hidden'
                            onChange={upload}
                        />
                        <Upload />
                        <span>Upload</span>
                    </label>
                </Button>
            </div>

            <dialog ref={modal} className='backdrop:opacity-90 backdrop:bg-black m-auto'>
                {!!image && (
                    <div className='min-w-full max-w-[90vw] max-h-[90vh] min-h-full overflow-auto space-y-4 p-4'>
                        <Cropper
                            image={preview as string}
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

                        <div className='text-right'>
                            <Button
                                variant='outline'
                                size='sm'
                                disabled={rect.processing}
                                onClick={cancel}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant='outline'
                                size='sm'
                                disabled={rect.processing}
                                onClick={reset}
                            >
                                Reset
                            </Button>
                            <Button size='sm' disabled={rect.processing} onClick={set}>
                                Set as profile photo
                            </Button>
                        </div>
                    </div>
                )}
            </dialog>
        </>
    )
}
