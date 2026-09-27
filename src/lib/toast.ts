import { toast } from 'sonner'

export const showToast = {
  success: (message: string, description?: string) => {
    toast.success(message, {
      description,
      className: 'border-green-200 bg-green-50',
      duration: 4000,
    })
  },

  error: (message: string, description?: string) => {
    toast.error(message, {
      description,
      className: 'border-red-200 bg-red-50',
      duration: 5000,
    })
  },

  info: (message: string, description?: string) => {
    toast.info(message, {
      description,
      className: 'border-blue-200 bg-blue-50',
      duration: 4000,
    })
  },

  warning: (message: string, description?: string) => {
    toast.warning(message, {
      description,
      className: 'border-amber-200 bg-amber-50',
      duration: 4000,
    })
  },

  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string
      error: string
    }
  ) => {
    return toast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
    })
  },
}
