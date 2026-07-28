import Photo from '@/components/photo'
import type { User } from '@/types/models'

export function UserInfo({
    user,
    showEmail = false,
}: {
    user: User;
    showEmail?: boolean;
}) {
    return (
        <>
            <Photo src={user.image_url as string} size={32} className='size-8 rounded-full' />
            <div className='grid flex-1 text-left text-sm leading-tight'>
                <span className='truncate font-medium'>{user.name}</span>
                {showEmail && (
                    <span className='truncate text-xs text-muted-foreground'>
                        {user.email}
                    </span>
                )}
            </div>
        </>
    )
}
