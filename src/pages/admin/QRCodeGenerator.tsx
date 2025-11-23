import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { supabase } from '@/lib/supabase'
import { generateQRToken } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { QrCode, LogOut, Vote } from 'lucide-react'

// 根據社區配置圖定義的棟別和門牌
const BUILDINGS = ['A', 'B', 'C', 'D', 'E']
const UNIT_NUMBERS: Record<string, string[]> = {
    'A': ['26', '28', '30'],
    'B': ['20', '22', '24'],
    'C': ['16', '18'],
    'D': ['8', '10', '12', '14'],
    'E': ['2', '6'],
}
const FLOORS = Array.from({ length: 15 }, (_, i) => (i + 1).toString())

export default function QRCodeGenerator() {
    const navigate = useNavigate()
    const [building, setBuilding] = useState('')
    const [unitNumber, setUnitNumber] = useState('')
    const [floor, setFloor] = useState('')
    const [qrCodeUrl, setQrCodeUrl] = useState('')
    const [availableUnits, setAvailableUnits] = useState<string[]>([])

    useEffect(() => {
        checkAuth()
    }, [])

    useEffect(() => {
        if (building) {
            setAvailableUnits(UNIT_NUMBERS[building] || [])
            setUnitNumber('')
        }
    }, [building])

    const checkAuth = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            navigate('/admin/login')
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        navigate('/admin/login')
    }

    const handleGenerate = async () => {
        if (!building || !unitNumber || !floor) {
            alert('請選擇完整的住戶資訊')
            return
        }

        const token = await generateQRToken(building, unitNumber, parseInt(floor))
        const loginUrl = `${window.location.origin}${import.meta.env.BASE_URL}#/login?token=${token}`
        setQrCodeUrl(loginUrl)
    }

    const handleReset = () => {
        setBuilding('')
        setUnitNumber('')
        setFloor('')
        setQrCodeUrl('')
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
            <div className="max-w-4xl mx-auto space-y-6 py-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-gray-900">管理員後台</h1>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => navigate('/admin/polls')}>
                            <Vote className="w-4 h-4 mr-2" />
                            投票管理
                        </Button>
                        <Button variant="outline" onClick={handleLogout}>
                            <LogOut className="w-4 h-4 mr-2" />
                            登出
                        </Button>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* QR Code Generator */}
                    <Card className="shadow-lg">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                    <QrCode className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <CardTitle>生成 QR Code</CardTitle>
                                    <CardDescription>為住戶生成登入用的 QR Code</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>棟別</Label>
                                <Select value={building} onValueChange={setBuilding}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="選擇棟別" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {BUILDINGS.map((b) => (
                                            <SelectItem key={b} value={b}>
                                                {b} 棟
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>門牌號碼</Label>
                                <Select value={unitNumber} onValueChange={setUnitNumber} disabled={!building}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="選擇門牌號碼" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableUnits.map((unit) => (
                                            <SelectItem key={unit} value={unit}>
                                                {unit} 號
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>樓層</Label>
                                <Select value={floor} onValueChange={setFloor}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="選擇樓層" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {FLOORS.map((f) => (
                                            <SelectItem key={f} value={f}>
                                                {f} 樓
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button onClick={handleGenerate} className="flex-1">
                                    生成 QR Code
                                </Button>
                                <Button onClick={handleReset} variant="outline">
                                    重置
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* QR Code Display */}
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle>QR Code 預覽</CardTitle>
                            <CardDescription>
                                {qrCodeUrl ? '住戶掃描此 QR Code 即可登入（有效期 2 小時）' : '請先選擇住戶資訊並生成 QR Code'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {qrCodeUrl ? (
                                <div className="space-y-4">
                                    <div className="flex justify-center p-8 bg-white rounded-lg border-2 border-dashed">
                                        <QRCodeSVG value={qrCodeUrl} size={256} level="H" />
                                    </div>
                                    <div className="text-center space-y-2">
                                        <p className="text-sm font-medium text-gray-700">
                                            {building} 棟 {unitNumber} 號 {floor} 樓
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            有效期限：2 小時
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-64 text-muted-foreground">
                                    <div className="text-center space-y-2">
                                        <QrCode className="w-16 h-16 mx-auto opacity-20" />
                                        <p>尚未生成 QR Code</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
