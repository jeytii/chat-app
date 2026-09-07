import { useQuery } from '@tanstack/react-query'

type KeyName = 'chats' | 'sent-requests' | 'received-requests'

export default function useChats<T>(key: KeyName = 'chats') {
    return useQuery<T[]>({
        queryKey: [key],
        queryFn: async () => {
            const url = {
                'chats': '/chats',
                'sent-requests': '/requests/sent',
                'received-requests': '/requests/received',
            }[key]

            return (await fetch(url)).json()
        },
    })
}
