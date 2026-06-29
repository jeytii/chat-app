export type User = {
    name: string;
    image_url: string | null;
}

export type Conversation = {
    id: number;
    user: User;
}

export type Message = {
    id: number;
    content: string | null;
    gif: string | null;
    image_url: string | null;
    from_self: boolean;
}
