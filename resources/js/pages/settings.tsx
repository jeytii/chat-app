import { Form, Head, usePage } from '@inertiajs/react'
import { CheckCircle2 } from 'lucide-react'
import { ChangeEvent, useRef, useState } from 'react'

// import DeleteUser from '@/components/delete-user'
import Heading from '@/components/heading'
import { ImageUploader } from '@/components/image-uploader'
import InputError from '@/components/input-error'
import PasswordInput from '@/components/password-input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

const colors = [
    {
        label: 'Default',
        value: 'default',
        classes: {
            primary: 'bg-[oklch(0.6723_0.1606_244.9955)] dark:bg-[oklch(0.6692_0.1607_245.0110)]',
            accent: 'bg-[oklch(0.9392_0.0166_250.8453)] dark:bg-[oklch(0.1928_0.0331_242.5459)]',
        },
    },
    {
        label: 'Mono',
        value: 'mono',
        classes: {
            primary: 'bg-[oklch(0.5555_0_0)] dark:bg-[oklch(0.5555_0_0)]',
            accent: 'bg-[oklch(0.9702_0_0)] dark:bg-[oklch(0.3715_0_0)]',
        },
    },
    {
        label: 'Sage',
        value: 'sage',
        classes: {
            primary: 'bg-[oklch(0.6333_0.0309_154.9039)] dark:bg-[oklch(0.6333_0.0309_154.9039)]',
            accent: 'bg-[oklch(0.8242_0.0221_136.6092)] dark:bg-[oklch(0.3709_0.0248_153.9823)]',
        },
    },
    {
        label: 'Graphite',
        value: 'graphite',
        classes: {
            primary: 'bg-[oklch(0.4891_0_0)] dark:bg-[oklch(0.7058_0_0)]',
            accent: 'bg-[oklch(0.8078_0_0)] dark:bg-[oklch(0.3715_0_0)]',
        },
    },
]

export default function Profile() {
    const { user } = usePage().props.auth
    const [colorScheme, setColorScheme] = useState<string>(localStorage.getItem('color-scheme') || 'default')
    const passwordInput = useRef<HTMLInputElement>(null)
    const currentPasswordInput = useRef<HTMLInputElement>(null)

    function changeColorScheme(event: ChangeEvent<HTMLInputElement>) {
        const { value } = event.target

        setColorScheme(value)
        document.documentElement.setAttribute('data-scheme', value)
        localStorage.setItem('color-scheme', value)
    }

    return (
        <>
            <Head title='Settings' />

            <div className='flex items-center gap-2'>
                <SidebarTrigger className='-ml-1' />
                <Heading title='Settings' />
            </div>

            <Card>
                <CardContent className='space-y-6'>

                    <Heading variant='small' title='Profile' />

                    <ImageUploader src={user.image_url as string} />

                    <Form
                        action='/settings/profile'
                        method='post'
                        transform={data => ({ ...data, _method: 'PATCH' })}
                        options={{
                            preserveScroll: true,
                        }}
                        className='space-y-6'
                    >
                        {({ processing, errors }) => (
                            <>
                                <div className='grid gap-2'>
                                    <Label htmlFor='name'>Name</Label>

                                    <Input
                                        id='name'
                                        className='mt-1 block w-full'
                                        defaultValue={user.name}
                                        name='name'
                                        required
                                        autoComplete='name'
                                        placeholder='Full name'
                                    />

                                    <InputError
                                        className='mt-2'
                                        message={errors.name}
                                    />
                                </div>

                                <div className='grid gap-2'>
                                    <Label htmlFor='username'>Username</Label>

                                    <Input
                                        id='username'
                                        type='text'
                                        className='mt-1 block w-full'
                                        defaultValue={user.username}
                                        name='username'
                                        required
                                        autoComplete='username'
                                        placeholder="Must be 8-40 characters long and not contain an '@'"
                                    />

                                    <InputError
                                        className='mt-2'
                                        message={errors.username}
                                    />
                                </div>

                                {/*{mustVerifyEmail && !user.is_verified && (
                                <div>
                                    <p className='-mt-4 text-sm text-muted-foreground'>
                                        Your email address is unverified.{' '}
                                        <Link
                                            href='/email/verification-notification'
                                            method='post'
                                            as='button'
                                            className='text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500'
                                        >
                                            Click here to resend the
                                            verification email.
                                        </Link>
                                    </p>

                                    {status === 'verification-link-sent' && (
                                        <div className='mt-2 text-sm font-medium text-green-600'>
                                            A new verification link has been
                                            sent to your email address.
                                        </div>
                                    )}
                                </div>
                            )}*/}

                                <div className='flex items-center gap-4'>
                                    <Button
                                        disabled={processing}
                                        data-test='update-profile-button'
                                    >
                                        Save
                                    </Button>
                                </div>
                            </>
                        )}
                    </Form>
                </CardContent>
            </Card>

            <Card>
                <CardContent className='space-y-6'>
                    <Heading variant='small' title='Theme' />

                    <div className='flex gap-8'>
                        {colors.map(color => (
                            <label key={color.value} className='flex-1 space-y-1'>
                                <div className='relative flex cursor-pointer overflow-hidden rounded-[8px] border-2'>
                                    <span className={cn('h-8 w-full', color.classes.primary)} />
                                    <span className={cn('h-8 w-full', color.classes.accent)} />

                                    {colorScheme === color.value && (
                                        <CheckCircle2 className='absolute top-1/2 left-1/2 -translate-1/2' />
                                    )}
                                </div>

                                <h6 className='text-center text-xs md:text-sm'>{color.label}</h6>

                                <input
                                    type='radio'
                                    name='scheme'
                                    value={color.value}
                                    className='hidden'
                                    onChange={changeColorScheme}
                                />
                            </label>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className='space-y-6'>
                    <Heading variant='small' title='Password' />

                    <Form
                        action='/settings/password?_method=PUT'
                        method='post'
                        options={{
                            preserveScroll: true,
                        }}
                        resetOnError={[
                            'password',
                            'password_confirmation',
                            'current_password',
                        ]}
                        resetOnSuccess
                        onError={errors => {
                            if (errors.password) {
                                passwordInput.current?.focus()
                            }

                            if (errors.current_password) {
                                currentPasswordInput.current?.focus()
                            }
                        }}
                        className='space-y-6'
                    >
                        {({ errors, processing }) => (
                            <>
                                <div className='grid gap-2'>
                                    <Label htmlFor='current_password'>
                                        Current password
                                    </Label>

                                    <PasswordInput
                                        id='current_password'
                                        ref={currentPasswordInput}
                                        name='current_password'
                                        className='mt-1 block w-full'
                                        autoComplete='current-password'
                                    />

                                    <InputError message={errors.current_password} />
                                </div>

                                <div className='grid gap-2'>
                                    <Label htmlFor='password'>New password</Label>

                                    <PasswordInput
                                        id='password'
                                        ref={passwordInput}
                                        name='password'
                                        className='mt-1 block w-full'
                                        autoComplete='new-password'
                                    />

                                    <InputError message={errors.password} />
                                </div>

                                <div className='grid gap-2'>
                                    <Label htmlFor='password_confirmation'>
                                        Confirm password
                                    </Label>

                                    <PasswordInput
                                        id='password_confirmation'
                                        name='password_confirmation'
                                        className='mt-1 block w-full'
                                        autoComplete='new-password'
                                    />

                                    <InputError
                                        message={errors.password_confirmation}
                                    />
                                </div>

                                <div className='flex items-center gap-4'>
                                    <Button
                                        disabled={processing}
                                        data-test='update-password-button'
                                    >
                                        Save password
                                    </Button>
                                </div>
                            </>
                        )}
                    </Form>
                </CardContent>
            </Card>

            {/*<DeleteUser />*/}
        </>
    )
}
