export interface ResidentInfo {
    building: string
    unitNumber: string
    floor: number
    tokenExpiresAt: string
}

export interface Poll {
    id: string
    title: string
    content: string
    created_at: string
    expires_at: string
    is_active: boolean
    created_by: string
}

export interface Vote {
    id: string
    poll_id: string
    resident_id: string
    vote: 'agree' | 'disagree'
    voted_at: string
}

export interface PollResult {
    poll_id: string
    agree_count: number
    disagree_count: number
    total_votes: number
}
