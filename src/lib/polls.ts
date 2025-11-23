import { supabase } from './supabase'
import { Poll, Vote, PollResult } from '@/types'

/**
 * 建立新投票
 */
export async function createPoll(
    title: string,
    content: string,
    durationMinutes?: number,
    expiresAt?: Date
): Promise<Poll | null> {
    try {
        const expirationDate = expiresAt || new Date(Date.now() + (durationMinutes || 60) * 60 * 1000)

        const { data, error } = await supabase
            .from('polls')
            .insert({
                title,
                content,
                expires_at: expirationDate.toISOString(),
                is_active: true,
                created_by: 'admin',
            })
            .select()
            .single()

        if (error) throw error
        return data
    } catch (error) {
        console.error('Failed to create poll:', error)
        return null
    }
}

/**
 * 取得所有進行中的投票
 */
export async function getActivePolls(): Promise<Poll[]> {
    try {
        const { data, error } = await supabase
            .from('polls')
            .select('*')
            .eq('is_active', true)
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false })

        if (error) throw error
        return data || []
    } catch (error) {
        console.error('Failed to get active polls:', error)
        return []
    }
}

/**
 * 取得單一投票
 */
export async function getPoll(pollId: string): Promise<Poll | null> {
    try {
        const { data, error } = await supabase
            .from('polls')
            .select('*')
            .eq('id', pollId)
            .single()

        if (error) throw error
        return data
    } catch (error) {
        console.error('Failed to get poll:', error)
        return null
    }
}

/**
 * 提交投票
 */
export async function submitVote(
    pollId: string,
    residentId: string,
    vote: 'agree' | 'disagree'
): Promise<boolean> {
    try {
        // 檢查是否已投票
        const { data: existingVote } = await supabase
            .from('votes')
            .select('id')
            .eq('poll_id', pollId)
            .eq('resident_id', residentId)
            .single()

        if (existingVote) {
            console.error('Already voted')
            return false
        }

        const { error } = await supabase
            .from('votes')
            .insert({
                poll_id: pollId,
                resident_id: residentId,
                vote,
            })

        if (error) throw error
        return true
    } catch (error) {
        console.error('Failed to submit vote:', error)
        return false
    }
}

/**
 * 取得投票結果
 */
export async function getPollResults(pollId: string): Promise<PollResult | null> {
    try {
        const { data, error } = await supabase
            .from('votes')
            .select('vote')
            .eq('poll_id', pollId)

        if (error) throw error

        const agreeCount = data?.filter(v => v.vote === 'agree').length || 0
        const disagreeCount = data?.filter(v => v.vote === 'disagree').length || 0

        return {
            poll_id: pollId,
            agree_count: agreeCount,
            disagree_count: disagreeCount,
            total_votes: agreeCount + disagreeCount,
        }
    } catch (error) {
        console.error('Failed to get poll results:', error)
        return null
    }
}

/**
 * 檢查是否已投票
 */
export async function hasVoted(pollId: string, residentId: string): Promise<boolean> {
    try {
        const { data, error } = await supabase
            .from('votes')
            .select('id')
            .eq('poll_id', pollId)
            .eq('resident_id', residentId)
            .single()

        if (error && error.code !== 'PGRST116') throw error
        return !!data
    } catch (error) {
        console.error('Failed to check vote status:', error)
        return false
    }
}
