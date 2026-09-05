import type { User } from '@/types/models'

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: {
                user: User,
                has_new_notifications: boolean;
            };
            sidebarOpen: boolean;
            [key: string]: unknown;
        };
    }
}
