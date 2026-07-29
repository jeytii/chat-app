import { Form, Head, usePage } from '@inertiajs/react'
import { useRef } from 'react'

// import DeleteUser from '@/components/delete-user'
import Heading from '@/components/heading'
import { ImageUploader } from '@/components/image-uploader'
import InputError from '@/components/input-error'
import PasswordInput from '@/components/password-input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function Profile() {
    const { user } = usePage().props.auth
    const passwordInput = useRef<HTMLInputElement>(null)
    const currentPasswordInput = useRef<HTMLInputElement>(null)

    return (
        <>
            <Head title='Settings' />

            <Heading
                title='Settings'
                description='Update your personal information and account'
            />

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
                                        placeholder='Current password'
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
                                        placeholder='New password'
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
                                        placeholder='Confirm password'
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
