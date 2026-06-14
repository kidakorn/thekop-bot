import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'

// Use NEXTAUTH_SECRET as the base for the encryption key
function getKey() {
  const secret = process.env.NEXTAUTH_SECRET || 'fallback_secret_for_development_only_123'
  // Derive a robust 32-byte key using scrypt
  return crypto.scryptSync(secret, 'salt', 32)
}

export function encryptToken(text: string): string {
  if (!text) return text
  
  try {
    const iv = crypto.randomBytes(12)
    const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv)
    
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    const authTag = cipher.getAuthTag().toString('hex')
    
    // Format: iv:authTag:encryptedData
    return `${iv.toString('hex')}:${authTag}:${encrypted}`
  } catch (err) {
    console.error('Encryption error:', err)
    return text
  }
}

export function decryptToken(encryptedText: string): string {
  if (!encryptedText) return encryptedText
  
  try {
    const parts = encryptedText.split(':')
    // If it doesn't match our format, it might be an old plain-text token
    if (parts.length !== 3) {
      return encryptedText
    }
    
    const [ivHex, authTagHex, encryptedDataHex] = parts
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')
    
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv)
    decipher.setAuthTag(authTag)
    
    let decrypted = decipher.update(encryptedDataHex, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (err) {
    console.error('Decryption error (might be plain-text token):', err)
    // Fallback to returning the original string if decryption fails
    return encryptedText
  }
}
