import { useQuery } from '@tanstack/react-query'

type KeyName = 'chats' | 'sent-requests' | 'received-requests'

export default function useChats<T>(key: KeyName = 'chats') {
    return useQuery<T[]>({
        queryKey: [key],
        queryFn: async () => {
            if (key === 'chats') {
                return (await fetch('/chats')).json()
            }

            return (await fetch(`/chats/${key}`)).json()
        },
    })
}
