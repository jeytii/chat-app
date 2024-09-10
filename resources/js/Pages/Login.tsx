import { type ChangeEvent, type FormEvent, useState } from 'react'
import { router, usePage } from '@inertiajs/react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Fields {
  username: string;
  password: string;
}

export default function LoginPage() {
  const [values, setValues] = useState<Fields>({
    username: '',
    password: '',
  })
  const [submitting, setSubmitting] = useState<boolean>(false)
  const { errors } = usePage().props

  function handleValue(event: ChangeEvent<HTMLInputElement>) {
    setValues(prev => ({
      ...prev,
      [event.target.name]: event.target.value,
    }))
  }

  function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    router.post(
      '/login',
      values as Record<keyof Fields, string>,
      {
        onStart() {
          setSubmitting(true)
        },
        onError() {
          setSubmitting(false)
        },
      }
    )
  }

  return (
    <main className='flex min-h-screen items-center justify-center bg-primary-foreground px-4 sm:px-0'>
      <Card className='w-full max-w-sm shadow-lg'>
        <CardHeader>
          <CardTitle className='text-xl font-bold text-primary'>Welcome to Chat App</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={login}>
            <div>
              <Label
                htmlFor='username'
                className='font-semibold'
              >
                Username
              </Label>
              <Input
                id='username'
                className='mt-1'
                type='text'
                name='username'
                disabled={submitting}
                autoFocus
                onChange={handleValue}
              />
              { errors.username && <p className='mt-1 text-sm text-destructive'>{errors.username}</p> }
            </div>
            <div className='mt-8'>
              <Label
                htmlFor='password'
                className='font-semibold'
              >
                Password
              </Label>
              <Input
                id='password'
                className='mt-1'
                type='password'
                name='password'
                disabled={submitting}
                onChange={handleValue}
              />
              { errors.password && <p className='mt-1 text-sm text-destructive'>{errors.password}</p> }
            </div>

            {submitting ? (
              <Button
                className='mt-8 w-full'
                disabled
              >
                <Loader2 className='animate-spin' />
              </Button>
            ) : (
              <Button className='mt-8 w-full'>Sign in</Button>
            )}
          </form>
        </CardContent>
      </Card>
    </main>
  )
}