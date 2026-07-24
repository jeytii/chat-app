import type { User } from '@/types/models'

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: { user: User };
            sidebarOpen: boolean;
            [key: string]: unknown;
        };
    }
}
