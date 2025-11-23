import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { verifyQRToken, saveSession } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function ResidentLogin() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
    const [message, setMessage] = useState('')
    const [residentInfo, setResidentInfo] = useState<{ building: string; unitNumber: string; floor: number } | null>(null)

    useEffect(() => {
        const verifyToken = async () => {
            const token = searchParams.get('token')

            if (!token) {
                setStatus('error')
                setMessage('無效的登入連結')
                return
            }

            // 驗證 token
            const payload = await verifyQRToken(token)

            if (!payload) {
                setStatus('error')
                setMessage('QR Code 已過期或無效，請重新掃描')
                return
            }

            // 儲存 session
            const expiresAt = new Date(payload.exp * 1000)
            saveSession({
                building: payload.building,
                unitNumber: payload.unitNumber,
                floor: payload.floor,
                tokenExpiresAt: expiresAt.toISOString(),
            })

            setResidentInfo({
                building: payload.building,
                unitNumber: payload.unitNumber,
                floor: payload.floor,
            })
            setStatus('success')
            setMessage('登入成功！')

            // 2 秒後導向首頁
            setTimeout(() => {
                navigate('/')
            }, 2000)
        }

        verifyToken()
    }, [searchParams, navigate])

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
            <Card className="w-full max-w-md shadow-xl">
                <CardHeader className="text-center">
                    <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4">
                        {status === 'loading' && (
                            <Loader2 className="w-12 h-12 text-primary animate-spin" />
                        )}
                        {status === 'success' && (
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-10 h-10 text-green-600" />
                            </div>
                        )}
                        {status === 'error' && (
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                                <XCircle className="w-10 h-10 text-red-600" />
                            </div>
                        )}
                    </div>
                    <CardTitle className="text-2xl">
                        {status === 'loading' && '驗證中...'}
                        {status === 'success' && '登入成功'}
                        {status === 'error' && '登入失敗'}
                    </CardTitle>
                    <CardDescription>{message}</CardDescription>
                </CardHeader>
                {status === 'success' && residentInfo && (
                    <CardContent>
                        <div className="bg-primary/5 rounded-lg p-4 space-y-2">
                            <p className="text-sm text-muted-foreground text-center">您的身份</p>
                            <p className="text-lg font-semibold text-center">
                                {residentInfo.building} 棟 {residentInfo.unitNumber} 號 {residentInfo.floor} 樓
                            </p>
                            <p className="text-xs text-muted-foreground text-center">
                                登入有效期：2 小時
                            </p>
                        </div>
                    </CardContent>
                )}
            </Card>
        </div>
    )
}
