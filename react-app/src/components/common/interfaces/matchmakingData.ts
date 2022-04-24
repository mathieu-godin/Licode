
export interface PlayerData {
    username: string,
    eloRating: number,
    sid: string,
}

export interface MatchmakingData {
    you: PlayerData,
    opponent: PlayerData,
}

export interface QuestionData {
    question: string,
    function_signature: string,
    default_custom_input: string,
}
