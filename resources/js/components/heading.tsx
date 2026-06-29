import clsx from 'clsx'

export default function Heading({
    title,
    description,
    variant = 'default',
}: {
    title: string;
    description?: string;
    variant?: 'default' | 'small';
}) {
    return (
        <header className={clsx(variant !== 'small' && 'space-y-0.5')}>
            <h2 className={clsx({
                'mb-0.5 text-base font-medium': variant === 'small',
                'text-xl font-semibold tracking-tight': variant === 'default',
            })}>
                {title}
            </h2>

            {description && (
                <p className='text-sm text-muted-foreground'>{description}</p>
            )}
        </header>
    )
}
