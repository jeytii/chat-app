import inertia from '@inertiajs/vite'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import laravel from 'laravel-vite-plugin'
import { bunny } from 'laravel-vite-plugin/fonts'
import { defineConfig, loadEnv, type UserConfig } from 'vite'

export default defineConfig(({ mode }) => {
    const assetUrl = loadEnv(mode, process.cwd()).VITE_ASSET_URL
    const config: UserConfig = {
        plugins: [
            laravel({
                input: ['resources/css/app.css', 'resources/js/app.tsx'],
                refresh: true,
                fonts: [
                    bunny('Lato', {
                        weights: [400, 500, 600],
                    }),
                ],
            }),
            inertia(),
            react(),
            babel({
                presets: [reactCompilerPreset()],
            }),
            tailwindcss(),
        ],
    }

    if (mode === 'development' && assetUrl.startsWith('https://')) {
        config.server = {
            host: '0.0.0.0',
            cors: true,
            origin: assetUrl,
        }
    }

    return config
})
