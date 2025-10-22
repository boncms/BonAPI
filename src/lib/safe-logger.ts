// Safe logging utility to prevent sensitive data exposure

const SENSITIVE_KEYS = [
  'password',
  'passwordHash',
  'adminPassword',
  'token',
  'secret',
  'key',
  'auth',
  'credential',
  'hash',
  'salt'
]

export function sanitizeForLogging(obj: any): any {
  if (obj === null || obj === undefined) return obj
  if (typeof obj !== 'object') return obj
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForLogging(item))
  }
  
  const sanitized: any = {}
  
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase()
    const isSensitive = SENSITIVE_KEYS.some(sensitiveKey => 
      lowerKey.includes(sensitiveKey.toLowerCase())
    )
    
    if (isSensitive) {
      sanitized[key] = '[REDACTED]'
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeForLogging(value)
    } else {
      sanitized[key] = value
    }
  }
  
  return sanitized
}

export function safeLog(message: string, data?: any) {
  if (data) {
    console.log(message, sanitizeForLogging(data))
  } else {
    console.log(message)
  }
}

export function safeError(message: string, error?: any) {
  if (error) {
    console.error(message, sanitizeForLogging(error))
  } else {
    console.error(message)
  }
}
