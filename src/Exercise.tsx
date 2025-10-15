import './App.css'

export type ExcerciseLine = {
    correct_word: string;
    translation: string;
    image_src: string | null;
    score: number;
};

const AnswerStatus = {
    Unchecked: "UNCHECKED" as const,
    Correct: "CORRECT" as const,
    Incorrect: "INCORRECT" as const,
};
export type AnswerStatus = typeof AnswerStatus[keyof typeof AnswerStatus];

type LineProps = {
    line_text: ExcerciseLine;
    status: AnswerStatus;
    style: any;
    focused: boolean;
};

function LineExercise({ line_text, status, style, focused }: LineProps) {

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