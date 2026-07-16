export type User = {
    name: string;
    image_url: string | null;
}

export type Conversation = {
    id: number;
    user: User & {
        is_online: boolean;
    };
}

export type Message = {
    id: number;
    reference?: {
        id: number;
        content: string | null;
        gif: string | null;
        image_url: string | null;
        from_self: boolean;
    } | null;
    content: string | null;
    gif: string | null;
    image_url: string | null;
    from_self: boolean;
    date: string;
}

export type MessageResponse = {
    items: Message[];
    next_cursor: string | null;
}
