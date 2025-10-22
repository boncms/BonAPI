
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Modal from '@/components/admin/Modal'

interface BackupMeta {
  folder: string
  hasDb: boolean
  size: number
  createdAt: string
  file: string
  meta?: any
}

export default function BackupPage() {
  const [loading, setLoading] = useState(false)
  const [backups, setBackups] = useState<BackupMeta[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [message, setMessage] = useState<string>('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [targetDelete, setTargetDelete] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('')
  const [modalMsg, setModalMsg] = useState('')
  const [modalType, setModalType] = useState<'success' | 'error' | 'info' | 'warning'>('info')

  const fetchBackups = async () => {
    const res = await fetch('/api/backup/list', { cache: 'no-store' })
    const data = await res.json()
    if (data.success) setBackups(data.backups)
  }

  useEffect(() => { fetchBackups() }, [])

  const handleCreate = async () => {
    setLoading(true)
    setMessage('Creating backup...')
    try {
      const res = await fetch('/api/backup/create', { method: 'POST' })
      const data = await res.json()
      if (!data.success) throw new Error(data.message || 'Backup creation failed')
      setMessage('Backup created successfully')
      await fetchBackups()
    } catch (e: any) {
      setMessage(e?.message || 'Error creating backup')
    } finally {
      setLoading(false)
    }
  }

  const downloadChunked = async (file: string) => {
    // Download by chunks using Range header, then assemble and trigger save
    try {
      const headRes = await fetch(`/api/backup/download?file=${encodeURIComponent(file)}`, { method: 'GET' })
      const totalSize = Number(headRes.headers.get('Content-Length') || '0')
      const chunkSize = 2 * 1024 * 1024 // 2MB per chunk
      const chunks: Uint8Array[] = []
      let downloaded = 0
      while (downloaded < totalSize) {
        const start = downloaded
        const end = Math.min(downloaded + chunkSize - 1, totalSize - 1)
        const res = await fetch(`/api/backup/download?file=${encodeURIComponent(file)}`, {
          headers: { Range: `bytes=${start}-${end}` },
        })
        if (!(res.status === 206 || res.status === 200)) throw new Error('Chunk download failed')
        const buf = new Uint8Array(await res.arrayBuffer())
        chunks.push(buf)
        downloaded = end + 1
      }
      // Merge chunks
      const merged = new Uint8Array(totalSize)
      let offset = 0
      for (const c of chunks) { merged.set(c, offset); offset += c.length }
      const blob = new Blob([merged], { type: 'application/octet-stream' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = file.split('/').pop() || 'database.sqlite'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(a.href)
    } catch (e: any) {
      setMessage(e?.message || 'Error loading backup')
    }
  }

  const handleRestoreFromServer = async (file: string) => {
    setLoading(true)
    setMessage('Restoring from backup...')
    try {
      const res = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.message || 'Restore failed')
      setMessage('Restore successfully')
      setModalTitle('Restore completed')
      setModalMsg('Database restored successfully. Please restart the server to apply changes.')
      setModalType('success')
      setModalOpen(true)
    } catch (e: any) {
      const errMsg = e?.message || 'Restore error'
      setMessage(errMsg)
      setModalTitle('Restore failed')
      setModalMsg(errMsg)
      setModalType('error')
      setModalOpen(true)
    } finally {
      setLoading(false)
    }
  }

  const handleUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleRestoreUpload = async () => {
    if (!selectedFile) { setMessage('No file selected'); return }
    setLoading(true)
    setMessage('Restoring from uploaded file...')
    try {
      const form = new FormData()
      form.append('file', selectedFile)
      const res = await fetch('/api/backup/restore', { method: 'POST', body: form })
      const data = await res.json()
      if (!data.success) throw new Error(data.message || 'Restore failed')
      setMessage('Restore successfully')
      setModalTitle('Restore completed')
      setModalMsg('Database restored successfully. Please restart the server to apply changes.')
      setModalType('success')
      setModalOpen(true)
    } catch (e: any) {
      const errMsg = e?.message || 'Restore error'
      setMessage(errMsg)
      setModalTitle('Restore failed')
      setModalMsg(errMsg)
      setModalType('error')
      setModalOpen(true)
    } finally {
      setLoading(false)
    }
  }

  const requestDelete = (folder: string) => {
    setTargetDelete(folder)
    setConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!targetDelete) return
    setLoading(true)
    setMessage('Deleting backup...')
    try {
      const res = await fetch('/api/backup/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ folder: targetDelete }) })
      const data = await res.json()
      if (!data.success) throw new Error(data.message || 'Delete failed')
      setMessage('Delete successfully')
      setConfirmOpen(false)
      setTargetDelete(null)
      await fetchBackups()
    } catch (e: any) {
      setMessage(e?.message || 'Delete error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-4">Backup & Restore</h1>
      <div className="mb-4 rounded border border-amber-600 bg-amber-900/20 text-amber-200 px-4 py-3">
        Note: After restoring the database, you need to restart the service (restart server) to apply the changes.
      </div>

      <div className="flex items-center gap-3 mb-6">
        <button onClick={handleCreate} disabled={loading} className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded">
          {loading ? 'Processing...' : 'Create backup'}
        </button>
        <span className="text-sm text-gray-300">{message}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-dark-800 rounded-lg p-4 border border-dark-600">
          <h2 className="text-lg font-semibold text-white mb-3">Backup list</h2>
          <div className="space-y-3">
            {backups.length === 0 && (
              <div className="text-gray-400 text-sm">No backup</div>
            )}
            {backups.map(b => (
              <div key={b.folder} className="flex items-center justify-between bg-dark-700 rounded p-3 border border-dark-600">
                <div>
                  <div className="text-white font-medium">{b.folder}</div>
                  <div className="text-xs text-gray-400">{new Date(b.createdAt).toLocaleString()} • {(b.size / (1024*1024)).toFixed(2)} MB</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => downloadChunked(b.file)} className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded">Download</button>
                  <button onClick={() => handleRestoreFromServer(b.file)} className="px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded">Restore</button>
                  <button onClick={() => requestDelete(b.folder)} className="px-3 py-1.5 text-xs bg-red-600 hover:bg-red-500 text-white rounded">Xoá</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-dark-800 rounded-lg p-4 border border-dark-600">
          <h2 className="text-lg font-semibold text-white mb-3">Restore from file</h2>
          <input type="file" onChange={handleUploadChange} className="text-sm text-gray-300 file:mr-3 file:px-3 file:py-1.5 file:rounded file:border-0 file:bg-dark-600 file:text-white hover:file:bg-dark-500" />
          <div className="mt-3">
            <button onClick={handleRestoreUpload} disabled={loading || !selectedFile} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded">
              {loading ? 'Processing...' : 'Restore from uploaded file'}
            </button>
          </div>
        </div>
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-dark-800 border border-dark-600 rounded-lg p-5 w-full max-w-sm">
            <h3 className="text-white font-semibold text-lg mb-2">Confirm delete</h3>
            <p className="text-gray-300 text-sm mb-4">Are you sure you want to delete the backup <span className="font-mono">{targetDelete}</span>? This action cannot be undone.</p>
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => { setConfirmOpen(false); setTargetDelete(null) }} className="px-3 py-1.5 text-sm bg-dark-600 hover:bg-dark-500 text-white rounded">Cancel</button>
              <button onClick={confirmDelete} className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-500 text-white rounded">Delete</button>
            </div>
          </div>
        </div>
      )}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalTitle}
        message={modalMsg}
        type={modalType}
      />
    </div>
  )
}


