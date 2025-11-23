import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getSession } from '@/lib/auth'
import { getPoll, submitVote, getPollResults, hasVoted } from '@/lib/polls'
import { supabase } from '@/lib/supabase'
import { Poll, PollResult } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, XCircle, ArrowLeft, Loader2 } from 'lucide-react'

export default function VotePage() {
    const navigate = useNavigate()
    const { pollId } = useParams<{ pollId: string }>()
    const [session] = useState(getSession())
    const [poll, setPoll] = useState<Poll | null>(null)
    const [result, setResult] = useState<PollResult | null>(null)
    const [voted, setVoted] = useState(false)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        if (!session) {
            navigate('/login?token=')
            return
        }

        if (!pollId) {
            navigate('/')
            return
        }

        loadPoll()
        checkVoteStatus()

        // 訂閱投票更新
        const channel = supabase
            .channel(`poll-${pollId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'votes',
                filter: `poll_id=eq.${pollId}`
            }, () => {
                loadResults()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [pollId, session, navigate])

    const loadPoll = async () => {
        if (!pollId) return

        const pollData = await getPoll(pollId)
        setPoll(pollData)
        setLoading(false)

        if (pollData) {
            loadResults()
        }
    }

    const loadResults = async () => {
        if (!pollId) return
        const resultData = await getPollResults(pollId)
        setResult(resultData)
    }

    const checkVoteStatus = async () => {
        if (!pollId || !session) return
        const residentId = `${session.building}-${session.unitNumber}-${session.floor}`
        const hasVotedStatus = await hasVoted(pollId, residentId)
        setVoted(hasVotedStatus)
    }

    const handleVote = async (vote: 'agree' | 'disagree') => {
        if (!pollId || !session || voted) return

        setSubmitting(true)
        const residentId = `${session.building}-${session.unitNumber}-${session.floor}`

        const success = await submitVote(pollId, residentId, vote)

        if (success) {
            setVoted(true)
            loadResults()
        } else {
            alert('投票失敗，您可能已經投過票了')
        }

        setSubmitting(false)
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
        )
    }

    if (!poll) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
                <Card className="w-full max-w-md">
                    <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground">找不到此投票</p>
                        <Button className="mt-4" onClick={() => navigate('/')}>
                            返回首頁
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const agreePercent = result && result.total_votes > 0
        ? Math.round((result.agree_count / result.total_votes) * 100)
        : 0
    const disagreePercent = result && result.total_votes > 0
        ? Math.round((result.disagree_count / result.total_votes) * 100)
        : 0

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
            <div className="max-w-2xl mx-auto space-y-6 py-8">
                <Button variant="outline" onClick={() => navigate('/')}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    返回首頁
                </Button>

                <Card className="shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-2xl">{poll.title}</CardTitle>
                        <CardDescription className="text-base">{poll.content}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {!voted ? (
                            <div className="space-y-4">
                                <p className="text-center text-sm text-muted-foreground">請選擇您的意見</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <Button
                                        size="lg"
                                        className="h-24 flex-col gap-2 bg-green-600 hover:bg-green-700"
                                        onClick={() => handleVote('agree')}
                                        disabled={submitting}
                                    >
                                        <CheckCircle className="w-8 h-8" />
                                        <span className="text-lg">同意</span>
                                    </Button>
                                    <Button
                                        size="lg"
                                        className="h-24 flex-col gap-2 bg-red-600 hover:bg-red-700"
                                        onClick={() => handleVote('disagree')}
                                        disabled={submitting}
                                    >
                                        <XCircle className="w-8 h-8" />
                                        <span className="text-lg">不同意</span>
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-4 space-y-2">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                    <CheckCircle className="w-10 h-10 text-green-600" />
                                </div>
                                <p className="text-lg font-semibold">您已完成投票</p>
                                <p className="text-sm text-muted-foreground">感謝您的參與</p>
                            </div>
                        )}

                        {result && result.total_votes > 0 && (
                            <div className="space-y-4 pt-6 border-t">
                                <h3 className="font-semibold text-center">即時投票結果</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2 text-green-600">
                                            <CheckCircle className="w-4 h-4" />
                                            <span>同意</span>
                                        </div>
                                        <span className="font-semibold">{result.agree_count} 票 ({agreePercent}%)</span>
                                    </div>
                                    <div className="flex h-3 rounded-full overflow-hidden bg-gray-200">
                                        <div
                                            className="bg-green-500 transition-all duration-500"
                                            style={{ width: `${agreePercent}%` }}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2 text-red-600">
                                            <XCircle className="w-4 h-4" />
                                            <span>不同意</span>
                                        </div>
                                        <span className="font-semibold">{result.disagree_count} 票 ({disagreePercent}%)</span>
                                    </div>
                                    <div className="flex h-3 rounded-full overflow-hidden bg-gray-200">
                                        <div
                                            className="bg-red-500 transition-all duration-500"
                                            style={{ width: `${disagreePercent}%` }}
                                        />
                                    </div>

                                    <p className="text-center text-sm text-muted-foreground pt-2">
                                        總投票數：{result.total_votes}
                                    </p>
                                </div>
                            </div>
                        )}

                        <p className="text-xs text-muted-foreground text-center">
                            投票結束時間：{new Date(poll.expires_at).toLocaleString('zh-TW')}
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
