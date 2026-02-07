import { useRef, useEffect, useState, type JSX } from 'react'
import './style/App.css'
import type { ExerciseLine, AnswerStatus } from './Exercise.tsx';
import LineExercise from './Exercise.tsx';
import { type WordGroup } from './Game.tsx';
import { GameState, type GameStateT } from './Game.tsx';
import { permute } from './utils/randomUtils.ts'

export type ExerciseProps = {
  exercises: Array<ExerciseLine>;
  setExercises: (exers: Array<ExerciseLine>) => void;
}


function addScore(correct_score: number, word: string, scores: Map<string, number>) {
  scores?.has(word) ? scores.set(word, + correct_score) : scores.set(word, correct_score);
};


function FinalExam({ exercises, setExercises }: ExerciseProps) {

  const containerRef = useRef<HTMLDivElement>(null);

  const [correctStates, setCorrectStates] = useState<AnswerStatus[]>(
    Array(exercises.length).fill("UNCHECKED"));
  const [shuffledLines, setShuffledLines] = useState<ExerciseLine[]>([]);

  useEffect(() => {
    permute(exercises);
    setShuffledLines(exercises);
  }, [exercises]);

  const handleReadAllInputs = () => {
    if (containerRef.current) {
      const inputs = containerRef.current.querySelectorAll<HTMLInputElement>("input");
      const values = Array.from(inputs).map((i) => i.value);
      const new_states = Array<AnswerStatus>(correctStates.length);
      values.forEach((value, index) => {
        const exc_index = (index);
        const correct_word = shuffledLines[exc_index].correct_word;
        const is_correct = value === correct_word;
        new_states[index] = is_correct ? "CORRECT" : "INCORRECT";
        shuffledLines[exc_index].score += (is_correct ?  1: 0);
      });
      setCorrectStates(new_states);
      setExercises(shuffledLines);
    }
  };
  const resetAllInputs = () => {
    if (containerRef.current) {
      const inputs = containerRef.current.querySelectorAll<HTMLInputElement>("input");
      const values = Array.from(inputs).map((i) => i.value);
      const new_states = Array<AnswerStatus>(values.length);
      for (const i in values) {
        new_states[i] = "UNCHECKED";
        inputs[i].value = "";
      }
      setCorrectStates(new_states);
    }
  };

  return (
    <div>
      <div
        ref={containerRef}
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
        }}>
        {shuffledLines.map((line, index) => (
          line ? (
            <LineExercise key={index}
              line_text={line}
              status={correctStates[index]}
              style={{ flex: "1 1 200px", alignItems: "center", minWidth: "200px", maxWidth: "100%" }}
              focused={index === 0}
            />
          ) : null
        ))}
      </div>
      <button onClick={handleReadAllInputs}>Submit</button>
      <button onClick={resetAllInputs}>Try Again</button>

    </div>
  );
}
export default FinalExam;

const ExamState = {
  Succeeded: "SUCCEEDED" as const,
  Failed: "FAILED" as const,
  Running: "RUNNING" as const
};
type ExamState = typeof ExamState[keyof typeof ExamState];

const SUCCESS_THRESHOLD = 0.75;

type LoaderProps = {
  exc_filenames: Array<string>;
  setAppState: (state: number) => void;
};

function deserializeGroup(group_name: string, group_json: any) {
  const exercises = (group_json[group_name] as ExerciseLine[]);
  const group: WordGroup = {
    exercises: exercises,
    group_id: 0,
    group_name: group_name,
    words_score: new Map<string, number>(),
    progress: 0
  }
  return group;
}

async function loadExercisesFromDb(topics: string[], questions_count: number)
{
    const groups = new Map<string, WordGroup>()
    const FS = (window as any).FS;

    await Promise.all(
      topics.map((topic, index) => {

        const db_json_path = "/execDb/" + topic + ".json";
        if (FS.analyzePath(db_json_path).exists) {// if file exists in IDBFS do not fetch
          // needs_sync = true;
          const json = JSON.parse(FS.readFile(db_json_path, { encoding: 'utf8' }));
          groups.set(topic, deserializeGroup(topic, json));
          return Promise.resolve("done");
        }
      }
    ));

    const exercises : ExerciseLine[] = [];
    groups.forEach((group, topic) =>{
      exercises.push(...group.exercises);
    });

    return exercises;
}
type PracticeExamProps = {
  setGameState: (state: GameStateT)=>void 
  questions_count: number
};
//! this is run when playing a game to train active memory
export function PracticeExam({ setGameState, questions_count }: PracticeExamProps) {

  const containerRef = useRef<HTMLDivElement>(null);

  const [examState, setExamState] = useState<ExamState>(ExamState.Running);
  const [correctStates, setCorrectStates] = useState<AnswerStatus[]>([]);
  const [shuffledLines, setShuffledLines] = useState<ExerciseLine[]>([]);


  useEffect(() => {
    const topics = localStorage.getItem("topics")?.split(',');
    if (!topics) { return; }

    console.log("QC FROM COMP: ", questions_count)
    loadExercisesFromDb(topics, questions_count).then((exercises) => {
      permute(exercises);
      setShuffledLines(exercises.splice(0, questions_count));
      setCorrectStates(Array(exercises.length).fill("UNCHECKED"));
    });
  }, []);

  const handleReadAllInputs = () => {
    if (containerRef.current) {
      const inputs = containerRef.current.querySelectorAll<HTMLInputElement>("input");
      const values = Array.from(inputs).map((i) => i.value);
      const new_states = Array<AnswerStatus>(correctStates.length);
      // const new_scores = words_score;

      let total_score = 0.;
      const exercise_count = values.length;

      values.forEach((value, index) => {
        const exc_index = (index);
        const correct_word = shuffledLines[exc_index].correct_word;
        const is_correct = value === correct_word;
        new_states[index] = is_correct ? "CORRECT" : "INCORRECT";
        // addScore(is_correct ? 1 : 0, correct_word, new_scores);
        total_score += Number(is_correct);
      });
      setCorrectStates(new_states);
      // setWordsScore(new_scores);

      total_score / exercise_count > SUCCESS_THRESHOLD ? setExamState(ExamState.Succeeded) : setExamState(ExamState.Failed);
    }
  };
  const resetAllInputs = () => {
    if (containerRef.current) {
      const inputs = containerRef.current.querySelectorAll<HTMLInputElement>("input");
      const values = Array.from(inputs).map((i) => i.value);
      const new_states = Array<AnswerStatus>(values.length);
      for (const i in values) {
        new_states[i] = "UNCHECKED";
        inputs[i].value = "";
      }
      setCorrectStates(new_states);
      
      const new_lines = shuffledLines;
      permute(new_lines);
      setShuffledLines(new_lines);
      setExamState(ExamState.Running);
    }
  };

  const renderNavigation = (state: ExamState) => {
    switch (state) {
      case ExamState.Running:
        return <button onClick={handleReadAllInputs}>Submit</button>
      case ExamState.Succeeded:
        return <button onClick={()=>setGameState("RUNNING")}>Back To Game</button>
      case ExamState.Failed:
        return <button onClick={resetAllInputs}>Try Again</button>
    }
  };

  return (
    <div>
      <div
        ref={containerRef}
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
        }}>
        {shuffledLines.map((line, index) => (
          line ? (
            <LineExercise key={index}
              line_text={line}
              status={correctStates[index]}
              style={{ flex: "1 1 200px", alignItems: "center", minWidth: "200px", maxWidth: "100%" }}
              focused={index === 0}
            />
          ) : null
        ))}
      </div>

      {renderNavigation(examState)}
    </div>
  );
}