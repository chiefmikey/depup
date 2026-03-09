// Types
import type { InjectionKey, Ref } from 'vue';
export interface SnackbarQueueItemState {
    height: number;
    width: number;
}
export interface SnackbarQueueProvide {
    register: (id: string) => void;
    unregister: (id: string) => void;
    setSize: (id: string, height: number, width: number) => void;
    getOffset: (id: string) => number | null;
    items: Ref<Map<string, SnackbarQueueItemState>>;
    gap: Ref<number>;
    lastItemSize: Ref<{
        height: number;
        width: number;
    }>;
}
export declare const VSnackbarQueueSymbol: InjectionKey<SnackbarQueueProvide>;
export declare function useSnackbarQueue(props: {
    gap: string | number;
}): SnackbarQueueProvide;
export declare function useSnackbarItem(isActive: Ref<boolean>, contentEl: () => HTMLElement | undefined): {
    id: string;
    offset: import("vue").ComputedRef<number | null>;
} | null;
