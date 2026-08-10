export type User = {
    id: number;
    name: string;
    username: string;
    image_url: string | null;
}

export type Chat = {
    id: number;
    user: User & {
        is_online: boolean;
    };
    has_new_message?: boolean;
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
    raw_content?: string | null;
    content: string | null;
    gif: string | null;
    image_url: string | null;
    from_self: boolean;
    date: string;
    date_diff: string;
    time_diff: string;
    edited?: boolean;
    deleted?: boolean;
    is_fake?: boolean;
}

export type MessageResponse = {
    items: Message[];
    next_cursor: string | null;
}
