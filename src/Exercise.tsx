import './style/Exercise.css'
import { type TextureLocation } from './exerciseLoader';

export type ExerciseLine = {
    type: string;
    meaning_id: string;
    correct_word: string;
    translation: string;
    image_src: string | null;
    // image_id: TextureLocation |null;
    score: number;
};

const AnswerStatus = {
    Unchecked: "UNCHECKED" as const,
    Correct: "CORRECT" as const,
    Incorrect: "INCORRECT" as const,
};
export type AnswerStatus = typeof AnswerStatus[keyof typeof AnswerStatus];

type LineProps = {
    line_text: ExerciseLine;
    status: AnswerStatus;
    style: any;
    focused: boolean;
};

function LineExercise({ line_text, status, style, focused }: LineProps) {

    const inputClass = "block mx-auto \
                        min-w-0 grow bg-gray-900 py-1.5 pr-3 pl-1\
                        text-base text-white  \
                        border border-white rounded-md\
                        focus:outline-none focus:ring-2 focus:ring-yellow\
                        sm:text-sm"


    return (
        <div style={style}>
            <div className="excerciseRect">
                {line_text.image_src ?
                    <img className="excerciseImage" src={line_text.image_src} /> :
                    line_text.translation
                }
            </div>

            <input
                type="text"
                autoFocus={focused}
                className={inputClass}
                disabled={status === "INCORRECT" || status === "CORRECT"}
            />
            <div key={status} className={status !== "UNCHECKED" ? "correct" : ""}>
                <span style={{ height: "20px", color: status === "CORRECT" ? "rgb(0,255,0)" : "red", marginLeft: "0.5rem" }}>
                    {status === "UNCHECKED" && " "}
                    {status === "CORRECT" && "✔ Correct!"}
                    {status === "INCORRECT" && "❌ " + line_text.correct_word}
                </span>
            </div>
        </div >
    )
}


export default LineExercise;