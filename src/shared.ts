import type WordSelector from "./WordSelection";

export const AppState = {
    Practice: 0,
    Game: 1,
    TopicSelection: 2,
    LanguageSelection: 3,
    Exam: 4,
    SmallExam: 5,
    WordSelection : 6,
} as const;
export type AppStateT = typeof AppState[keyof typeof AppState];

