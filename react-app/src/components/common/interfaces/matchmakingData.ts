
export interface PlayerData {
    username: string,
    eloRating: number,
    sid: string,
}

export interface MatchmakingData {
    you: PlayerData,
    opponent: PlayerData,
}
