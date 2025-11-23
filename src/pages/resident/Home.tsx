import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSession, clearSession } from '@/lib/auth'
import { getActivePolls } from '@/lib/polls'
import { supabase } from '@/lib/supabase'
import { Poll } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Vote, LogOut, Clock, Home } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { zhTW } from 'date-fns/locale'

export default function ResidentHome() {
    const navigate = useNavigate()
    const [session, setSession] = useState(getSession())
    const [polls, setPolls] = useState<Poll[]>([])
    const [timeRemaining, setTimeRemaining] = useState('')

    useEffect(() => {
        // 檢查登入狀態
        const currentSession = getSession()
        if (!currentSession) {
            navigate('/login?token=')
            return
        }
        setSession(currentSession)

        // 載入投票
        loadPolls()

        // 訂閱新投票
        const channel = supabase
            .channel('polls')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'polls' }, () => {
                loadPolls()
            })
            .subscribe()

        // 更新倒數計時
        const timer = setInterval(() => {
            const session = getSession()
            if (!session) {
                navigate('/login?token=')
                return
            }

            const expiresAt = new Date(session.tokenExpiresAt)
            const remaining = formatDistanceToNow(expiresAt, { locale: zhTW, addSuffix: true })
            setTimeRemaining(remaining)
        }, 1000)

        return () => {
            supabase.removeChannel(channel)
            clearInterval(timer)
        }
    }, [navigate])

    const loadPolls = async () => {
        const activePolls = await getActivePolls()
        setPolls(activePolls)
    }

    const handleLogout = () => {
        clearSession()
        navigate('/login?token=')
    }

    if (!session) {
        return null
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
            <div className="max-w-4xl mx-auto space-y-6 py-8">
                {/* Header */}
                <Card className="shadow-lg bg-white/80 backdrop-blur">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                                    <Home className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl">社區投票系統</CardTitle>
                                    <CardDescription>
                                        {session.building} 棟 {session.unitNumber} 號 {session.floor} 樓
                                    </CardDescription>
                                </div>
                            </div>
                            <Button variant="outline" size="sm" onClick={handleLogout}>
                                <LogOut className="w-4 h-4 mr-2" />
                                登出
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            <span>登入有效期：{timeRemaining}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Polls */}
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-gray-900">進行中的投票</h2>

                    {polls.length === 0 ? (
                        <Card className="shadow-lg">
                            <CardContent className="py-12">
                                <div className="text-center text-muted-foreground space-y-2">
                                    <Vote className="w-16 h-16 mx-auto opacity-20" />
                                    <p>目前沒有進行中的投票</p>
                                    <p className="text-sm">請等待管理員推播投票</p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        polls.map((poll) => (
                            <Card key={poll.id} className="shadow-lg hover:shadow-xl transition-shadow">
                                <CardHeader>
                                    <CardTitle className="text-xl">{poll.title}</CardTitle>
                                    <CardDescription>{poll.content}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                                        <span>結束時間：{new Date(poll.expires_at).toLocaleString('zh-TW')}</span>
                                    </div>
                                    <Button
                                        className="w-full"
                                        onClick={() => navigate(`/vote/${poll.id}`)}
                                    >
                                        <Vote className="w-4 h-4 mr-2" />
                                        前往投票
                                    </Button>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
