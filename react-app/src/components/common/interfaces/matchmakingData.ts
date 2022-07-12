
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

//TODO - either move this or rename this file to Interfaces.ts and move it up to common
export interface TestCasesPassed {
    testCasesPassed: boolean[];
    standardOutput: string;
    standardError: string;
    output: string;
}
