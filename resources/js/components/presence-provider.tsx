import { createContext, Dispatch, ReactNode, SetStateAction, useState } from 'react'

type Context = {
    onlineIds: number[];
    setOnlineIds: Dispatch<SetStateAction<number[]>>;
}

export const PresenceContext = createContext<Context>({
    onlineIds: [],
    setOnlineIds: () => { },
})

export default function PresenceProvider({ children }: { children: ReactNode }) {
    const [onlineIds, setOnlineIds] = useState<number[]>([])

    return (
        <PresenceContext value={{ onlineIds, setOnlineIds }}>
            {children}
        </PresenceContext>
    )
}
