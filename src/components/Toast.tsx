'use client'

import { useState, useEffect } from 'react'
import { Heart, CheckCircle, X } from 'lucide-react'

interface ToastProps {
  message: string
  type: 'success' | 'error' | 'info' | 'save'
  duration?: number
  onClose?: () => void
}

export default function Toast({ message, type, duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => onClose?.(), 300) // Wait for animation to complete
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'save':
        return <Heart className="w-5 h-5 text-red-500 fill-current" />
      case 'error':
        return <X className="w-5 h-5 text-red-500" />
      default:
        return <CheckCircle className="w-5 h-5 text-blue-500" />
    }
  }

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-900 border-green-700'
      case 'save':
        return 'bg-red-900 border-red-700'
      case 'error':
        return 'bg-red-900 border-red-700'
      default:
        return 'bg-blue-900 border-blue-700'
    }
  }

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      } ${getBackgroundColor()}`}
    >
      {getIcon()}
      <span className="text-white font-medium">{message}</span>
      <button
        onClick={() => {
          setIsVisible(false)
          setTimeout(() => onClose?.(), 300)
        }}
        className="text-white hover:text-gray-300 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

// Toast Manager Component
interface ToastManagerProps {
  toasts: Array<{
    id: string
    message: string
    type: 'success' | 'error' | 'info' | 'save'
    duration?: number
  }>
  onRemoveToast: (id: string) => void
}

export function ToastManager({ toasts, onRemoveToast }: ToastManagerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => onRemoveToast(toast.id)}
        />
      ))}
    </div>
  )
}

// Hook for managing toasts
export function useToast() {
  const [toasts, setToasts] = useState<Array<{
    id: string
    message: string
    type: 'success' | 'error' | 'info' | 'save'
    duration?: number
  }>>([])

  const addToast = (message: string, type: 'success' | 'error' | 'info' | 'save' = 'info', duration?: number) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts(prev => [...prev, { id, message, type, duration }])
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const showSuccess = (message: string, duration?: number) => addToast(message, 'success', duration)
  const showError = (message: string, duration?: number) => addToast(message, 'error', duration)
  const showInfo = (message: string, duration?: number) => addToast(message, 'info', duration)
  const showSave = (message: string, duration?: number) => addToast(message, 'save', duration)

  return {
    toasts,
    addToast,
    removeToast,
    showSuccess,
    showError,
    showInfo,
    showSave
  }
}
