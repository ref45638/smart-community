import * as jose from 'jose'
import { ResidentInfo } from '@/types'

const JWT_SECRET = import.meta.env.VITE_JWT_SECRET || 'your-secret-key'
const secret = new TextEncoder().encode(JWT_SECRET)

export interface QRTokenPayload {
    building: string
    unitNumber: string
    floor: number
    exp: number
    [key: string]: any  // 允許其他 JWT 標準欄位
}

/**
 * 生成 QR Code token (2小時有效)
 */
export async function generateQRToken(building: string, unitNumber: string, floor: number): Promise<string> {
    const payload: QRTokenPayload = {
        building,
        unitNumber,
        floor,
        exp: Math.floor(Date.now() / 1000) + (2 * 60 * 60), // 2 hours
    }

    const token = await new jose.SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('2h')
        .sign(secret)

    return token
}

/**
 * 驗證 QR Code token
 */
export async function verifyQRToken(token: string): Promise<QRTokenPayload | null> {
    try {
        const { payload } = await jose.jwtVerify(token, secret)
        return payload as unknown as QRTokenPayload
    } catch (error) {
        console.error('Token verification failed:', error)
        return null
    }
}

/**
 * 儲存 session 到 localStorage
 */
export function saveSession(residentInfo: ResidentInfo): void {
    localStorage.setItem('resident_session', JSON.stringify(residentInfo))
}

/**
 * 取得當前 session
 */
export function getSession(): ResidentInfo | null {
    const sessionStr = localStorage.getItem('resident_session')
    if (!sessionStr) return null

    try {
        const session = JSON.parse(sessionStr) as ResidentInfo

        // 檢查是否過期
        const expiresAt = new Date(session.tokenExpiresAt)
        if (expiresAt < new Date()) {
            clearSession()
            return null
        }

        return session
    } catch (error) {
        console.error('Failed to parse session:', error)
        clearSession()
        return null
    }
}

/**
 * 清除 session
 */
export function clearSession(): void {
    localStorage.removeItem('resident_session')
}

/**
 * 檢查 session 是否有效
 */
export function isSessionValid(): boolean {
    return getSession() !== null
}
