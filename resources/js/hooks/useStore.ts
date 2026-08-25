import { create } from 'zustand'

type Properties = {
    editId: string | null;
    reference: string | null;
    content: string | null;
    image: File | string | null;
    gif: {
        md: string | null;
        sm: string | null;
    } | null;
    imagePreview: string | null;
}

type Store = {
    fields: Pick<Properties, 'reference' | 'content' | 'image' | 'gif'>;
    editId: Properties['editId'];
    imagePreview: Properties['imagePreview'];
    set: <K extends keyof Properties>(key: K, value: Properties[K]) => void
    revokeImagePreview: CallableFunction;
    clear: CallableFunction;
}

const defaultFields = {
    reference: null,
    content: null,
    image: null,
    gif: null,
}

export default create<Store>(set => ({
    fields: defaultFields,
    imagePreview: null,
    editId: null,
    set: (key, value) => set(state => {
        if (key in defaultFields) {
            return {
                fields: {
                    ...state.fields,
                    [key]: value,
                },
            }
        }

        return { [key]: value }
    }),
    revokeImagePreview: () => set(state => {
        if (state.imagePreview) {
            URL.revokeObjectURL(state.imagePreview)
        }

        return { imagePreview: null }
    }),
    clear: () => set(state => {
        if (state.imagePreview) {
            URL.revokeObjectURL(state.imagePreview)
        }

        return {
            fields: defaultFields,
            editId: null,
            imagePreview: null,
        }
    }),
}))
