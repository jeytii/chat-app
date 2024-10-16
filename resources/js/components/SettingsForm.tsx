import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { usePage } from '@inertiajs/react'
import axios, { type AxiosError } from 'axios'
import { Camera } from 'lucide-react'
import Avatar from './Avatar'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import type { PageProps } from '@inertiajs/core'
import type { User } from '@/types'

interface Props extends PageProps {
  user: User;
}

interface UserDataErrors {
  first_name?: string[];
  last_name?: string[];
  profile_photo?: string[];
}

export default function SettingsForm() {
  const { user } = usePage<Props>().props
  const [firstName, setFirstName] = useState<string>(user.first_name)
  const [lastName, setLastName] = useState<string>(user.last_name)
  const [profilePhoto, setProfilePhoto] = useState<Blob|null>(null)
  const [preview, setPreview] = useState<string|undefined>(user.profile_photo_url)
  const imageNote = useRef<HTMLParagraphElement>(null)
  const abortController = useRef(new AbortController())

  const { mutate: upload } = useMutation<unknown, Error, Blob>({
    mutationFn: (file) => validateImageDimensions(file),
    onSuccess(data, file) {
      setPreview(URL.createObjectURL(file))
      setProfilePhoto(file)
      imageNote.current?.classList.replace('text-destructive', 'text-gray-500')
    },
    onError() {
      imageNote.current?.classList.replace('text-gray-500', 'text-destructive')
    }
  })

  const { mutate: update, isPending: isUpdating, error } = useMutation<unknown, AxiosError<{ errors: UserDataErrors }>, FormData>({
    mutationFn: (data) => axios.post('/users/update', data, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      signal: abortController.current.signal,
    }),
    onSuccess() {
      location.reload()
    },
  })

  useEffect(() => {
    return () => {
      abortController.current.abort()
    }
  }, [])

  function validateImageDimensions(file: Blob) {
    return new Promise((resolve, reject) => {
      const img = new Image()
  
      img.onload = () => {
        if (img.width <= 500 && img.height <= 500) {
          resolve(true)
        } else {
          reject()
        }
      }
  
      img.onerror = reject
  
      const reader = new FileReader()

      reader.onload = (event: ProgressEvent<FileReader>) => {
        img.src = event.target?.result?.toString() ?? ''
      }

      reader.onerror = reject
      
      reader.readAsDataURL(file)
    })
  }

  function handleValue(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target

    if (name === 'first_name') {
      setFirstName(value)
    } else {
      setLastName(value)
    }
  }

  function handleUploadedFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.item(0)

    if (file) {
      upload(file)
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault()

    const formData = new FormData()

    formData.append('first_name', firstName)
    formData.append('last_name', lastName)

    if (profilePhoto) {
      formData.append('profile_photo', profilePhoto)
    }
    
    update(formData)
  }

  return (
    <form onSubmit={submit}>
      <div className='text-center'>
        <div className='relative inline-block overflow-hidden rounded-full'>
          <Avatar
            url={preview}
            imageSize={120}
          />
          <label className='absolute inset-x-0 bottom-0  w-full cursor-pointer bg-black/40 pb-2 pt-1 text-white dark:bg-white/20'>
            <Camera
              className='mx-auto'
              size={20}
              color='white'
            />
            <input
              className='hidden'
              type='file'
              accept='.jpg,.png'
              onChange={handleUploadedFile}
            />
          </label>
        </div>
        <p
          ref={imageNote}
          className='text-sm text-gray-500'
        >
          Max: 500x500
        </p>
        {error?.response?.data.errors.profile_photo && (
          <p className='mt-1 text-sm text-destructive'>{error.response.data.errors.profile_photo[0]}</p>
        )}
      </div>
      <div className='mt-2'>
        <Label
          className='font-semibold'
          htmlFor='first_name'
        >
          First name
        </Label>
        <Input
          type='text'
          id='first_name'
          name='first_name'
          value={firstName}
          onChange={handleValue}
        />
        {error?.response?.data.errors.first_name && (
          <p className='mt-1 text-sm text-destructive'>{error.response.data.errors.first_name[0]}</p>
        )}
      </div>
      <div className='mt-2'>
        <Label
          className='font-semibold'
          htmlFor='last_name'
        >
          Last name
        </Label>
        <Input
          type='text'
          id='last_name'
          name='last_name'
          value={lastName}
          onChange={handleValue}
        />
        {error?.response?.data.errors.last_name && (
          <p className='mt-1 text-sm text-destructive'>{error.response.data.errors.last_name[0]}</p>
        )}
      </div>

      <Button
        className='mt-4'
        disabled={isUpdating}
      >
        Update
      </Button>
    </form>
  )
}