'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ChangePasswordPage() {
  const router = useRouter()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      })
      const data = await res.json()
      if (!res.ok || !data?.success) {
        setError(data?.message || 'Failed to change password')
      } else {
        setSuccess('Password changed successfully')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-900 p-8">
      <div className="max-w-lg mx-auto bg-dark-800 rounded-lg p-6 shadow">
        <h1 className="text-2xl font-bold text-white mb-6">Change Password</h1>
        {error && <div className="mb-4 rounded bg-red-900/40 text-red-200 px-3 py-2 text-sm">{error}</div>}
        {success && <div className="mb-4 rounded bg-green-900/40 text-green-200 px-3 py-2 text-sm">{success}</div>}
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-dark-300 mb-1">Current Password</label>
            <input
              type="password"
              className="w-full rounded bg-dark-700 border border-dark-600 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-primary-600"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm text-dark-300 mb-1">New Password</label>
            <input
              type="password"
              className="w-full rounded bg-dark-700 border border-dark-600 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-primary-600"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm text-dark-300 mb-1">Confirm Password</label>
            <input
              type="password"
              className="w-full rounded bg-dark-700 border border-dark-600 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-primary-600"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded bg-primary-600 hover:bg-primary-700 transition-colors px-4 py-2 text-white font-medium"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/admin00o1')}
              className="rounded bg-dark-700 hover:bg-dark-600 transition-colors px-4 py-2 text-white"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


