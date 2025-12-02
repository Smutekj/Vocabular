import { useRef, useEffect, useState } from 'react'
import { initDB, getItem, setItem } from './utils/db.ts';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowUp } from '@fortawesome/free-solid-svg-icons'
import { faArrowDown } from '@fortawesome/free-solid-svg-icons'
import type { ExerciseLine } from './Exercise.tsx';

import './style/Exercise.css'

type SummaryProps = {
  excercises: Array<ExerciseLine>;
  words_score: Map<string, number>;
  setWordsScore: (scores: Map<string, number>) => void;
};

function Summary({ excercises, words_score, setWordsScore }: SummaryProps) {

  const [sortAscending, setSortAscending] = useState<boolean>(true);
  const saved_scores = JSON.parse(localStorage.getItem("scores") || "{}");
  const saved_exc = excercises.map((exc: ExerciseLine) => {
    return {
      "correct_word": exc.correct_word,
      "score": words_score.has(exc.correct_word) ? words_score.get(exc.correct_word) : 0
    };
  });
  initDB().then(async () => {
    await setItem("scores", saved_exc);
  }).then(() => {
  });


  excercises.forEach((ex) => {
    !words_score.has(ex.correct_word) && words_score.set(ex.correct_word, 0);
    saved_scores[ex.correct_word] = words_score.get(ex.correct_word);
  });
  localStorage.setItem("scores", JSON.stringify(saved_scores));


  excercises.sort((ex1, ex2) => {
    const sc1 = words_score.get(ex1.correct_word) ?? 0;
    const sc2 = words_score.get(ex2.correct_word) ?? 0;
    return (2 * Number(sortAscending) - 1) * (sc2 - sc1);
  });

  return (
    <table style={{ borderCollapse: "collapse", width: "90vw", margin: "auto" }}>
      <thead>
        <tr>
          <th className="summaryTableHeader">
            Word
          </th>
          <th className="summaryTableHeader">
            Translation
          </th>
          <th className="summaryTableHeader">
            Image
          </th>
          <th className="summaryTableHeader">
            Score <button onClick={() => { setSortAscending(!sortAscending) }}>
              {sortAscending ? <FontAwesomeIcon icon={faArrowUp} /> : <FontAwesomeIcon icon={faArrowDown} />}
            </button>
          </th>
        </tr>
      </thead>
      <tbody>
        {excercises.map((line, index) => (
          <tr key={index}>
            <td className="summaryTableRow">
              {line.correct_word}
            </td>
            <td className="summaryTableRow">
              {line.translation}
            </td>
            <td className="summaryTableRow" style={{ height: "40px" }} >
              {line.image_src && <img src={line.image_src} className='excerciseImage' />}
            </td>
            <td className="summaryTableRow">
              {words_score.has(line.correct_word) ? words_score.get(line.correct_word) : "0"}
            </td>
          </tr>
        ))}
      </tbody>
    </table >
  );
}

export default Summary;