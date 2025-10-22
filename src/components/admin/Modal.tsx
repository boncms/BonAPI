'use client'

import React from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  showCloseButton?: boolean
}

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'info',
  showCloseButton = true 
}: ModalProps) {
  if (!isOpen) return null

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-8 h-8 text-green-500" />
      case 'error':
        return <AlertCircle className="w-8 h-8 text-red-500" />
      case 'warning':
        return <AlertTriangle className="w-8 h-8 text-yellow-500" />
      case 'info':
      default:
        return <Info className="w-8 h-8 text-blue-500" />
    }
  }

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-900/20 border-green-500/30'
      case 'error':
        return 'bg-red-900/20 border-red-500/30'
      case 'warning':
        return 'bg-yellow-900/20 border-yellow-500/30'
      case 'info':
      default:
        return 'bg-blue-900/20 border-blue-500/30'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-dark-800 rounded-lg p-6 w-full max-w-md border ${getBackgroundColor()}`}>
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
            <p className="text-dark-300 text-sm leading-relaxed">{message}</p>
          </div>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="flex-shrink-0 text-dark-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        
        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )
}
