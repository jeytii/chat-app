export interface User {
  first_name: string;
  last_name: string;
  name: string;
  username: string;
  profile_photo_url?: string;
  dark_mode: boolean;
}

export interface ChatContact extends User {
  is_online: boolean;
}

export interface Message {
  id: number;
  content: string;
  from_self: boolean;
  loading?: boolean;
}