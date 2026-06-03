import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastState {
  message: string;
  type: ToastType;
  isVisible: boolean;
}

interface UIState {
  theme: 'light' | 'dark';
  toast: ToastState;
  showToast: (message: string, type: ToastType) => void;
  hideToast: () => void;
  toggleTheme: () => void;
}

let toastTimeout: ReturnType<typeof setTimeout> | null = null;

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'light',
      toast: {
        message: '',
        type: 'info',
        isVisible: false,
      },
      showToast: (message, type) => {
        if (toastTimeout) {
          clearTimeout(toastTimeout);
        }
        set({ toast: { message, type, isVisible: true } });
        toastTimeout = setTimeout(() => {
          set({ toast: { message, type, isVisible: false } });
        }, 3000);
      },
      hideToast: () => {
        if (toastTimeout) {
          clearTimeout(toastTimeout);
        }
        set({ toast: { message: '', type: 'info', isVisible: false } });
      },
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
    }),
    {
      name: 'estatecrm_theme',
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);
