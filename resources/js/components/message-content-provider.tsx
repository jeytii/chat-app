import { createContext, type Dispatch, type ReactNode, type SetStateAction, useState } from 'react'

type ProviderContext = {
    message: string;
    editId: number | null;
    setMessage: Dispatch<SetStateAction<string>>;
    setEditId: Dispatch<SetStateAction<number | null>>;
}

export const MessageContentContext = createContext<ProviderContext>({
    message: '',
    editId: null,
    setMessage: () => { },
    setEditId: () => { },
})

export function MessageContentProvider({ children }: { children: ReactNode }) {
    const [message, setMessage] = useState<string>('')
    const [editId, setEditId] = useState<number | null>(null)

    return (
        <MessageContentContext value={{ message, editId, setMessage, setEditId }}>
            {children}
        </MessageContentContext>
    )
}
