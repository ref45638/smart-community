import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { createPoll, getActivePolls, getPollResults } from '@/lib/polls'
import { Poll, PollResult } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Send, QrCode, LogOut, CheckCircle, XCircle } from 'lucide-react'

export default function PollManager() {
    const navigate = useNavigate()
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [timeMode, setTimeMode] = useState<'duration' | 'datetime'>('duration')
    const [duration, setDuration] = useState('60')
    const [datetime, setDatetime] = useState('')
    const [polls, setPolls] = useState<Poll[]>([])
    const [pollResults, setPollResults] = useState<Record<string, PollResult>>({})
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        checkAuth()
        loadPolls()

        // 訂閱新投票
        const channel = supabase
            .channel('polls')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'polls' }, () => {
                loadPolls()
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'votes' }, () => {
                loadPollResults()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const checkAuth = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            navigate('/admin/login')
        }
    }

    const loadPolls = async () => {
        const activePolls = await getActivePolls()
        setPolls(activePolls)
        loadPollResults()
    }

    const loadPollResults = async () => {
        const results: Record<string, PollResult> = {}
        for (const poll of polls) {
            const result = await getPollResults(poll.id)
            if (result) {
                results[poll.id] = result
            }
        }
        setPollResults(results)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!title || !content) {
            alert('請填寫標題和內容')
            return
        }

        setLoading(true)

        try {
            let expiresAt: Date | undefined
            let durationMinutes: number | undefined

            if (timeMode === 'duration') {
                durationMinutes = parseInt(duration)
            } else {
                expiresAt = new Date(datetime)
                if (expiresAt <= new Date()) {
                    alert('投票結束時間必須在未來')
                    setLoading(false)
                    return
                }
            }

            const poll = await createPoll(title, content, durationMinutes, expiresAt)

            if (poll) {
                alert('投票已成功推播！')
                setTitle('')
                setContent('')
                setDuration('60')
                setDatetime('')
                loadPolls()
            } else {
                alert('建立投票失敗')
            }
        } catch (error) {
            console.error('Failed to create poll:', error)
            alert('建立投票失敗')
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        navigate('/admin/login')
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
            <div className="max-w-6xl mx-auto space-y-6 py-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-gray-900">投票管理</h1>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => navigate('/admin/qrcode')}>
                            <QrCode className="w-4 h-4 mr-2" />
                            QR Code
                        </Button>
                        <Button variant="outline" onClick={handleLogout}>
                            <LogOut className="w-4 h-4 mr-2" />
                            登出
                        </Button>
                    </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Create Poll */}
                    <Card className="shadow-lg">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                    <Send className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <CardTitle>建立新投票</CardTitle>
                                    <CardDescription>設定投票內容並推播給所有住戶</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">投票標題</Label>
                                    <Input
                                        id="title"
                                        placeholder="例：是否同意社區大樓外牆整修"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="content">投票內容</Label>
                                    <textarea
                                        id="content"
                                        className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="詳細說明投票事項..."
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>投票時間設定</Label>
                                    <Select value={timeMode} onValueChange={(v) => setTimeMode(v as 'duration' | 'datetime')}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="duration">推播後 N 分鐘</SelectItem>
                                            <SelectItem value="datetime">投票到指定時間</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {timeMode === 'duration' ? (
                                    <div className="space-y-2">
                                        <Label htmlFor="duration">持續時間（分鐘）</Label>
                                        <Input
                                            id="duration"
                                            type="number"
                                            min="1"
                                            value={duration}
                                            onChange={(e) => setDuration(e.target.value)}
                                            required
                                        />
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <Label htmlFor="datetime">結束時間</Label>
                                        <Input
                                            id="datetime"
                                            type="datetime-local"
                                            value={datetime}
                                            onChange={(e) => setDatetime(e.target.value)}
                                            required
                                        />
                                    </div>
                                )}

                                <Button type="submit" className="w-full" disabled={loading}>
                                    <Send className="w-4 h-4 mr-2" />
                                    {loading ? '推播中...' : '推播投票'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Active Polls */}
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle>進行中的投票</CardTitle>
                            <CardDescription>即時投票結果統計</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {polls.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <p>目前沒有進行中的投票</p>
                                    </div>
                                ) : (
                                    polls.map((poll) => {
                                        const result = pollResults[poll.id]
                                        const agreePercent = result && result.total_votes > 0
                                            ? Math.round((result.agree_count / result.total_votes) * 100)
                                            : 0
                                        const disagreePercent = result && result.total_votes > 0
                                            ? Math.round((result.disagree_count / result.total_votes) * 100)
                                            : 0

                                        return (
                                            <div key={poll.id} className="p-4 border rounded-lg space-y-3 bg-white">
                                                <div>
                                                    <h3 className="font-semibold text-lg">{poll.title}</h3>
                                                    <p className="text-sm text-muted-foreground mt-1">{poll.content}</p>
                                                </div>

                                                {result && (
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between text-sm">
                                                            <div className="flex items-center gap-2 text-green-600">
                                                                <CheckCircle className="w-4 h-4" />
                                                                <span>同意：{result.agree_count} ({agreePercent}%)</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-red-600">
                                                                <XCircle className="w-4 h-4" />
                                                                <span>不同意：{result.disagree_count} ({disagreePercent}%)</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex h-2 rounded-full overflow-hidden bg-gray-200">
                                                            <div
                                                                className="bg-green-500"
                                                                style={{ width: `${agreePercent}%` }}
                                                            />
                                                            <div
                                                                className="bg-red-500"
                                                                style={{ width: `${disagreePercent}%` }}
                                                            />
                                                        </div>
                                                        <p className="text-xs text-muted-foreground text-center">
                                                            總投票數：{result.total_votes}
                                                        </p>
                                                    </div>
                                                )}

                                                <p className="text-xs text-muted-foreground">
                                                    結束時間：{new Date(poll.expires_at).toLocaleString('zh-TW')}
                                                </p>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
