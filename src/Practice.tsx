import { useRef, useEffect, useState, type JSX } from 'react'
import LineExercise, { type ExerciseLine, type AnswerStatus } from './Exercise.tsx';
import { type ExerciseProps } from './Exam.tsx';

type SmallExerciseProps = ExerciseProps & {
    inputChecked: boolean,
    exc_selection: Array<number>;
};


function addScore(correct_score: number, word: string, scores: Map<string, number>) {
    scores?.has(word) ? scores.set(word, + correct_score) : scores.set(word, correct_score);
};

function SmallExercise({ excercises, words_score, setWordsScore, inputChecked, exc_selection }: SmallExerciseProps) {

    const containerRef = useRef<HTMLDivElement>(null);
    const [correctStates, setCorrectStates] = useState<AnswerStatus[]>(
        Array(excercises.length).fill("UNCHECKED"));

    //! check input and update AnswerStates when parent wants to
    useEffect(() => {
        if (!containerRef.current) { return; }

        const new_states = Array<AnswerStatus>(correctStates.length);
        const inputs = containerRef.current.querySelectorAll<HTMLInputElement>("input");
        if (inputChecked) {
            const values = Array.from(inputs).map((i) => i.value);
            const new_scores = words_score;
            values.forEach((value, index) => {
                const correct_word = excercises[exc_selection[index]].correct_word;
                const is_correct = value === correct_word;
                new_states[index] = is_correct ? "CORRECT" : "INCORRECT";
                excercises[exc_selection[index]].score += (2 * Number(is_correct) - 1);
                addScore(is_correct ? 1 : 0, correct_word, new_scores);
            });
            setWordsScore(new_scores);
        } else {
            inputs.forEach((input, index) => inputs[index].value = "");
            new_states.fill("UNCHECKED");
            setTimeout(() => { inputs[0].focus(); }, 100);
        }
        setCorrectStates(new_states);
    }, [inputChecked]);

    return (
        <>
            <div ref={containerRef}
                style={{
                    display: "flex", flexWrap: "wrap",
                    gap: "1rem", justifyContent: "center"
                }}>
                {
                    exc_selection.map((exc_id, index) => (
                        <LineExercise key={index}
                            line_text={excercises[exc_id]}
                            status={correctStates[index]}
                            style={{ flex: "1 1 200px", alignItems: "center", minWidth: "200px", maxWidth: "100%" }}
                            focused={index === 0}
                        />
                    ))
                }
            </div>
        </>
    )
};


function binarySearchCumWeights(cum_weights: number[], value: number): number {
    let low = 0;
    let high = cum_weights.length - 1;

    while (low < high) {
        const mid = Math.floor((low + high) / 2);
        if (value < cum_weights[mid]) {
            high = mid;
        } else {
            low = mid + 1;
        }
    }
    return low;
}

function getCumulativeSum(weights: Array<number>): Array<number> {
    const cum_sum = new Array<number>(weights.length);
    cum_sum[0] = weights[0];
    for (var i = 1; i < weights.length; i++) {
        cum_sum[i] = cum_sum[i - 1] + weights[i];
    }
    return cum_sum;
}

function randomWeightedIndex(weights: Array<number>) {
    const cum_weights = getCumulativeSum(weights);;
    const random_id = Math.random() * cum_weights[cum_weights.length - 1];
    return binarySearchCumWeights(cum_weights, random_id);
};

function selectRandomWord(
    excercises: Array<ExerciseLine>,
    first: number,
    excercise_weights: Array<number>) {
    return excercises[first + randomWeightedIndex(excercise_weights)];
}

function generateExercise(
    excercises: Array<ExerciseLine>,
    words_score: Map<string, number>,
    first: number = 0,
    selection_count: number = excercises.length,
    generate_count: number = 3
): Array<ExerciseLine> {

    const excercise_weights = excercises.slice(first, first + selection_count).map((exc) => {
        const score = (words_score.get(exc.correct_word) ?? 0);
        return Math.max(1, 5 - score);
    });

    const new_excercises = new Array<ExerciseLine>();
    if (excercises.length < generate_count) {
        return excercises;
    }
    for (let i = 0; i < generate_count; i++) {
        let new_exc = selectRandomWord(excercises, first, excercise_weights);
        while (new_excercises.includes(new_exc)) {
            new_exc = selectRandomWord(excercises, first, excercise_weights);
        }
        new_excercises.push(new_exc);
    }

    return new_excercises;
}


function generateExerciseIds(
    excercises: Array<ExerciseLine>,
    first: number = 0,
    selection_count: number = excercises.length,
    generate_count: number = 3
): Array<number> {

    const excercise_weights = excercises.slice(first, first + selection_count).map((exc) => {
        return Math.max(1, 5 - exc.score);
    });

    const new_excercises = new Array<number>();
    if (excercises.length < generate_count) {
        return [];
    }

    for (let i = 0; i < generate_count; i++) {
        let new_exc = first + randomWeightedIndex(excercise_weights);
        while (new_excercises.includes(new_exc)) {
            new_exc = first + randomWeightedIndex(excercise_weights);
        }
        new_excercises.push(new_exc);
    }
    return new_excercises;
}


interface GeneratorI {
    generate(count: number): Array<number>;
}

class ContinualGenerator implements GeneratorI {
    excercise_pool: Array<ExerciseLine>;
    progress: number;
    batch_size: number;
    training_new_batch: boolean;
    generation_pool: Array<number>;

    generate(count: number): Array<number> {
        const generated_exs = new Array<number>(count);
        const weights = this.excercise_pool.slice(0, this.progress).map((exc) => {
            return Math.max(1, 5 - exc.score);
        });
        if (this.excercise_pool.length < count) {
            return generated_exs.map((i, index) => Math.min(index, this.excercise_pool.length));
        }

        generated_exs.forEach((v, index) => {
            generated_exs[index] = randomWeightedIndex(weights);
        });
        return generated_exs;
    }

    constructor(excercises: Array<ExerciseLine>, progress: number = 0, batch_size: number = 6) {
        this.excercise_pool = excercises;
        this.progress = progress;
        this.batch_size = batch_size;
        this.training_new_batch = true;
        this.generation_pool = [];
    };

};

const SmallExerciseState = {
    NewSet: "NewSet" as const,
    Practicing: "Practicing" as const,
};
type SmallExerciseState = typeof SmallExerciseState[keyof typeof SmallExerciseState]

export default function Exercise2({ excercises, words_score, setWordsScore }: ExerciseProps) {

    const [shuffledLines, setShuffledLines] = useState<ExerciseLine[]>([]);
    const [progress, setProgress] = useState<number>(5);
    const [inputChecked, setInputChecked] = useState<boolean>(false);
    const [excerciseState, setExerciseState] = useState<SmallExerciseState>("Practicing");
    const [generatedExercises, setGeneratedExercises] = useState<Array<ExerciseLine>>(
        excercises.length > 3 ? generateExercise(excercises, words_score, 0, progress) : []
    );
    const [selection, setSelection] = useState<Array<number>>(
        generateExerciseIds(excercises, 0, progress)
    );

    useEffect(() => {
        setGeneratedExercises(generateExercise(excercises, words_score, 0, progress));
        setShuffledLines(excercises);
    }, [excercises]);

    function changeCard(count: number) {
        const cards_count = shuffledLines.length;
        const next_progress = Math.min(progress + 5, excercises.length);
        if (excerciseState === "NewSet") {
            // setGeneratedExercises(generateExercise(excercises, words_score, progress, 5));
            setSelection(generateExerciseIds(excercises, progress, 5));
        } else {
            setSelection(generateExerciseIds(excercises, 0, progress));
        }
    };


    function onCheck() { //! decide whether the user knows the NewSet well enough
        const next_progress = Math.min(progress + 5, excercises.length);
        var all_scores_good: boolean = true;
        if (excerciseState === "NewSet") {
            for (var i = progress; i < next_progress; i++) {
                all_scores_good = all_scores_good && (words_score.get(excercises[i].correct_word) ?? 0) >= 2;
            }
            if (all_scores_good) {
                setProgress(next_progress);
                setExerciseState("Practicing");
            }
        } else if (excerciseState === "Practicing") {
            for (var i = 0; i < progress; i++) {
                all_scores_good = all_scores_good && (words_score.get(excercises[i].correct_word) ?? 0) >= 1;
            }
            if (all_scores_good) {
                setExerciseState("NewSet");
            }
        }
    };

    return (
        <div>
            {excercises.length > 1 &&
                <SmallExercise
                    excercises={excercises}
                    words_score={words_score}
                    setWordsScore={setWordsScore}
                    inputChecked={inputChecked}
                    exc_selection={selection}
                ></SmallExercise>
            }
            {inputChecked ?
                <button onClick={() => { setInputChecked(false); changeCard(3) }}>Next</button>
                :
                <button onClick={() => { setInputChecked(true); onCheck() }}>Check</button>
            }
        </div>
    );
}

