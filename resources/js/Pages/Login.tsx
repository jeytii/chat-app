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
        onBefore() {
          setSubmitting(true)
        },
        onFinish() {
          setSubmitting(false)
        },
      }
    )
  }

  return (
    <main className='min-h-screen flex items-center justify-center bg-gray-100'>
      <Card className='max-w-lg w-full shadow-lg'>
        <CardHeader>
          <CardTitle className='text-primary text-xl font-bold'>Welcome to Chat App</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={login}>
            <div>
              <Label
                htmlFor='username'
                className='text-base font-semibold'
              >
                Username
              </Label>
              <Input
                id='username'
                className='text-base mt-1'
                type='text'
                name='username'
                disabled={submitting}
                onChange={handleValue}
              />
              { errors.username && <p className='text-destructive mt-1'>{errors.username}</p> }
            </div>
            <div className='mt-8'>
              <Label
                htmlFor='password'
                className='text-base font-semibold'
              >
                Password
              </Label>
              <Input
                id='password'
                className='text-base mt-1'
                type='password'
                name='password'
                disabled={submitting}
                onChange={handleValue}
              />
              { errors.password && <p className='text-destructive mt-1'>{errors.password}</p> }
            </div>

            {submitting ? (
              <Button
                className='text-base mt-8'
                disabled
              >
                <Loader2 className='animate-spin' />
                <span className='ml-2'>Signing in</span>
              </Button>
            ) : (
              <Button className='text-base mt-8'>Sign in</Button>
            )}
          </form>
        </CardContent>
      </Card>
    </main>
  )
}