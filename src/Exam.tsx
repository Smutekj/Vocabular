import { useRef, useEffect, useState, type JSX } from 'react'
import './App.css'
import type { ExcerciseLine, AnswerStatus } from './Exercise.tsx';
import  LineExercise  from './Exercise.tsx';
import {permute} from './randomUtils.ts'

export type ExcerciseProps = {
    excercises: Array<ExcerciseLine>;
    words_score: Map<string, number>;
    setWordsScore: (value: Map<string, number>) => void;
    // swapActivity: (target_activity: ActivityType) => void;
  }
  

function addScore(correct_score: number, word: string, scores: Map<string, number>) {
  scores?.has(word) ? scores.set(word, + correct_score) : scores.set(word, correct_score);
};


function FinalExam({ excercises, words_score, setWordsScore }: ExcerciseProps) {

  const containerRef = useRef<HTMLDivElement>(null);

  const [correctStates, setCorrectStates] = useState<AnswerStatus[]>(
    Array(excercises.length).fill("UNCHECKED"));
  const [shuffledLines, setShuffledLines] = useState<ExcerciseLine[]>([]);

  useEffect(() => {
    permute(excercises);
    setShuffledLines(excercises);
  }, [excercises]);

  const handleReadAllInputs = () => {
    if (containerRef.current) {
      const inputs = containerRef.current.querySelectorAll<HTMLInputElement>("input");
      const values = Array.from(inputs).map((i) => i.value);
      const new_states = Array<AnswerStatus>(correctStates.length);
      const new_scores = words_score;
      values.forEach((value, index) => {
        const exc_index = (index);
        const correct_word = shuffledLines[exc_index].correct_word;
        const is_correct = value === correct_word;
        new_states[index] = is_correct ? "CORRECT" : "INCORRECT";
        addScore(is_correct ? 1 : 0, correct_word, new_scores);
      });
      setCorrectStates(new_states);
      setWordsScore(new_scores);
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