import { useRef, useEffect, useState, type JSX } from 'react'
import './App.css'

import LineExercise, { type ExcerciseLine, type AnswerStatus } from './Exercise.tsx';
import Summary from './Summary.tsx';
import Game from './Game.tsx'
import InstallButton from './InstallButton.tsx';
import FinalExam, { type ExcerciseProps } from './Exam.tsx';

import { initDB, getItem, setItem } from './db';
import { faArrowsToCircle } from '@fortawesome/free-solid-svg-icons/faArrowsToCircle';


const images = import.meta.glob("./assets/Images/*.png", { eager: true, import: 'default' });
const image_names = Array<string>();
const imageUrls = Object.values(images) as string[];
const excercises_csv: Record<string, unknown> = import.meta.glob("./assets/Exercises/*.csv",
  {
    eager: true,
    import: 'default',
    query: '?raw',
  });
const exercisesUrls = Object.keys(excercises_csv) as string[];


type WordGroup = {
  group_name: string;
  group_id: number;
  excercises: Array<ExcerciseLine>;
  words_score: Map<string, number>;
  progress: number;
};


type SmallExcerciseProps = ExcerciseProps & {
  inputChecked: boolean,
  exc_selection: Array<number>;
};



function addScore(correct_score: number, word: string, scores: Map<string, number>) {
  scores?.has(word) ? scores.set(word, + correct_score) : scores.set(word, correct_score);
};

function SmallExcercise({ excercises, words_score, setWordsScore, inputChecked, exc_selection }: SmallExcerciseProps) {

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
  excercises: Array<ExcerciseLine>,
  first: number,
  excercise_weights: Array<number>) {
  return excercises[first + randomWeightedIndex(excercise_weights)];
}

function generateExcercise(
  excercises: Array<ExcerciseLine>,
  words_score: Map<string, number>,
  first: number = 0,
  selection_count: number = excercises.length,
  generate_count: number = 3
): Array<ExcerciseLine> {

  const excercise_weights = excercises.slice(first, first + selection_count).map((exc) => {
    const score = (words_score.get(exc.correct_word) ?? 0);
    return Math.max(1, 5 - score);
  });

  const new_excercises = new Array<ExcerciseLine>();
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


function generateExcerciseIds(
  excercises: Array<ExcerciseLine>,
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
  excercise_pool: Array<ExcerciseLine>;
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

  constructor(excercises: Array<ExcerciseLine>, progress: number = 0, batch_size: number = 6) {
    this.excercise_pool = excercises;
    this.progress = progress;
    this.batch_size = batch_size;
    this.training_new_batch = true;
    this.generation_pool = [];
  };

};

const SmallExcerciseState = {
  NewSet: "NewSet" as const,
  Practicing: "Practicing" as const,
};
type SmallExcerciseState = typeof SmallExcerciseState[keyof typeof SmallExcerciseState]

function Excercise2({ excercises, words_score, setWordsScore }: ExcerciseProps) {

  const [shuffledLines, setShuffledLines] = useState<ExcerciseLine[]>([]);
  const [progress, setProgress] = useState<number>(5);
  const [inputChecked, setInputChecked] = useState<boolean>(false);
  const [excerciseState, setExcerciseState] = useState<SmallExcerciseState>("Practicing");
  const [generatedExcercises, setGeneratedExcercises] = useState<Array<ExcerciseLine>>(
    excercises.length > 3 ? generateExcercise(excercises, words_score, 0, progress) : []
  );
  const [selection, setSelection] = useState<Array<number>>(
    generateExcerciseIds(excercises, 0, progress)
  );

  useEffect(() => {
    setGeneratedExcercises(generateExcercise(excercises, words_score, 0, progress));
    setShuffledLines(excercises);
  }, [excercises]);

  function changeCard(count: number) {
    const cards_count = shuffledLines.length;
    const next_progress = Math.min(progress + 5, excercises.length);
    if (excerciseState === "NewSet") {
      // setGeneratedExcercises(generateExcercise(excercises, words_score, progress, 5));
      setSelection(generateExcerciseIds(excercises, progress, 5));
    } else {
      setSelection(generateExcerciseIds(excercises, 0, progress));
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
        setExcerciseState("Practicing");
      }
    } else if (excerciseState === "Practicing") {
      for (var i = 0; i < progress; i++) {
        all_scores_good = all_scores_good && (words_score.get(excercises[i].correct_word) ?? 0) >= 1;
      }
      if (all_scores_good) {
        setExcerciseState("NewSet");
      }
    }
  };

  return (
    <div>
      {excercises.length > 1 &&
        <SmallExcercise
          excercises={excercises}
          words_score={words_score}
          setWordsScore={setWordsScore}
          inputChecked={inputChecked}
          exc_selection={selection}
        ></SmallExcercise>
      }
      {inputChecked ?
        <button onClick={() => { setInputChecked(false); changeCard(3) }}>Next</button>
        :
        <button onClick={() => { setInputChecked(true); onCheck() }}>Check</button>
      }
    </div>
  );
}


type LoaderProps = {
  exc_filenames: Array<string>;
  setAppState: (state: number) => void;
};

function parseExcerciseLine(line: string): ExcerciseLine {
  const split_line = line.split(",");
  //! include image if it exists 
  const image_filename = split_line[2].replace(' ', '') + ".png";
  const image = image_names.includes(image_filename) ? String(`${import.meta.env.BASE_URL}Images/` + image_filename) : null;
  return { correct_word: split_line[2], translation: split_line[1], image_src: image, score: 0 };
}

async function loadWordGroups(exc_filenames: Array<string>): Promise<Map<string, WordGroup>> {
  const groups = new Map<string, WordGroup>();

  await Promise.all(
    exc_filenames.map((filename, index) => {
      return fetch(filename + ".csv")
        .then((response) => response.text())
        .then((data) => {
          const excercises = data.split(/\r\n|\r|\n/).map((line, index) => {
            return parseExcerciseLine(line);
          });
          const group: WordGroup = {
            excercises: excercises, group_id: 0,
            group_name: filename, words_score: new Map<string, number>(), progress: 0
          };
          groups.set(filename, group);
        }).catch((error) => console.error("Error loading file:", error));

    })
  );

  return groups;
};

export const ActivityType = {
  Summary: "summary" as const,
  SmallExcercise: "smallExcercise" as const,
  Exam: "exam" as const,
};
type ActivityType = typeof ActivityType[keyof typeof ActivityType];

export const AnimationState = {
  FadingIn: "FadeIn" as const,
  Animating: "Animating" as const,
};
type AnimationState = typeof AnimationState[keyof typeof AnimationState];

async function uploadExercisesToDb(word_groups: Map<string, WordGroup>) {
  const FS = (window as any).FS;
  const Module = (window as any).Module;
  if (!Module) { return; }
  if (!FS?.analyzePath('/execDb').exists) {
    FS?.mkdir("/execDb");
  }

  word_groups.forEach((group, group_name) => {
    setItem(group_name, [...group.excercises]); //! write to Indexed database
    FS?.writeFile("/execDb/" + group_name + ".json", JSON.stringify({ [group_name]: [...group.excercises] }));
  });

  await new Promise<void>((resolve, reject) => {
    FS?.syncfs(false, (err: any) => { err ? reject(err) : resolve() });
  });
}

function ExcerciseLoader({ exc_filenames, setAppState }: LoaderProps) {

  const [activity, setActivity] = useState<ActivityType>("summary");
  const [animationState, setAnimationState] = useState<AnimationState>("FadeIn");
  const [loaderState, setLoaderState] = useState<string>("loading");
  const [wordGroups, setWordGroups] = useState<Map<string, WordGroup>>(new Map<string, WordGroup>);
  const [excercises, setExcercises] = useState<Array<ExcerciseLine>>([]);
  const [words_score, setWordsScore] = useState<Map<string, number>>(() => { //! load from local storage if exists
    const saved = localStorage.getItem("scores");
    initDB().then(async () => {
      const scores_object = getItem<Object>("scores");
      setWordsScore(new Map(Object.entries(scores_object)));
    });

    if (saved) {
      const parsed = JSON.parse(saved);
      return new Map(Object.entries(parsed));
    }
    localStorage.setItem("scores", JSON.stringify({}));
    return new Map();
  }
  );

  useEffect(() => {
    setLoaderState("loading");
    loadWordGroups(exc_filenames).then((groups) => {
      setWordGroups(groups);
      setLoaderState("finished");

      var new_excercises = new Array<ExcerciseLine>();
      groups.forEach((group, group_name) => {
        new_excercises.push(...group.excercises);
      });
      setExcercises(new_excercises);
    });
  }, [exc_filenames]);

  function swapActivity(target_activity: ActivityType) {
    if (animationState === "FadeIn") {
      setAnimationState("Animating");
      setTimeout(() => { setAnimationState("FadeIn"); setActivity(target_activity) }, 500);
    }
  }

  function ActivitySwitcher(currentActivity: ActivityType) {
    const activityComps: Record<ActivityType, React.ComponentType<any>> = {
      smallExcercise: Excercise2,
      summary: Summary,
      exam: FinalExam
    };
    const ActiveComp = activityComps[currentActivity];
    return <ActiveComp excercises={excercises} words_score={words_score} setWordsScore={setWordsScore} />
  }

  let content: JSX.Element;
  switch (activity) {
    case 'summary':
      content = (
        <>
          <button onClick={() => { uploadExercisesToDb(wordGroups); setAppState(1); }}>Game Practice</button>
          <button onClick={() => swapActivity("exam")}>FinalExam</button>
          <button onClick={() => swapActivity("smallExcercise")}>Excercise</button>
          <button onClick={() => setAppState(2)}>Select Topics</button>
          {ActivitySwitcher(activity)}
          <button onClick={() => swapActivity("smallExcercise")}>Excercise</button>
        </>
      );
      break;
    case 'smallExcercise':
      content = (
        <>
          {ActivitySwitcher(activity)}
          <button onClick={() => swapActivity("summary")}>Finnish Excercise</button>
        </>
      )
      break;
    case 'exam':
      content = (
        <>
          {ActivitySwitcher(activity)}
          <button onClick={() => swapActivity("summary")}>Finnish Excercise</button>
        </>
      );
      break;
  }

  const stateClasses = { FadeIn: "fadeIn", Animating: "swapAnimationOut" };
  return (
    <>
      {loaderState === "loading" ?
        <p>Loading</p>
        :
        <div
          key={animationState}
          className={stateClasses[animationState]} >
          {content}
        </div>
      }

    </>
  );
}

type TopicSelectionProps = {
  // topic_groups: Map<string, WordGroup>;
  selected_topics: string[]
  setSelectedTopics: (topics: string[]) => void;
  setAppState: (state: number) => void;
};

function TopicSelection({ selected_topics, setSelectedTopics, setAppState }: TopicSelectionProps) {


  useEffect(() => {

  }, [selected_topics]);

  const onSelection2 = (e: React.MouseEvent<HTMLDivElement, MouseEvent>, topic: string) => {
    let new_selection: string[] = [];
    if (!(e.shiftKey || e.ctrlKey)) {
      new_selection.push(topic);
    } else {
      if (selected_topics.includes(topic)) {
        new_selection = selected_topics.filter(t => t !== topic);
      } else {
        new_selection = [...selected_topics, topic];
      }
    }
    setSelectedTopics(new_selection);
    localStorage.setItem("topics", new_selection.toString());
  };


  return (
    <>
      <div style={{ fontWeight: "bolder", fontSize: "40px" }}>Select Topic</div>
      <div className='navigationContainer'>
        <button onClick={() => { setAppState(0) }}>Back</button>
      </div>
      <div className='topicSelectionContainer'>
        {exercisesUrls.map((csv_url: string, index: number) => {
          const sUrl = csv_url.split('/');
          const topic = sUrl[sUrl.length - 1].split('.')[0]
          const selected = selected_topics.includes(topic);
          return (
            <div
              key={csv_url}
              className="topicSelectionRect"
              style={{ borderColor: selected ? "green" : "gray" }}
              onClick={(e) => onSelection2(e, topic)}>
              {topic}
            </div>
          )
        }
        )}
      </div>
    </>
  );
}

function App() {
  const [selectedTopics, setSelectedTopics] = useState<string[]>(["Werkzeug"]);
  const [appState, setAppState] = useState<number>(0);

  localStorage.setItem("topics", selectedTopics.toString());

  image_names.length = 0;
  for (var v in images) {
    const split_path = v.split('/');
    image_names.push(split_path[split_path.length - 1]);
  }

  useEffect(() => {

    if(appState === 1 || appState == 2)
    {
      window.history.pushState(appState, "", "");
    }

    const handleBack = (e: PopStateEvent) => {
      queueMicrotask(() => {
        if (appState === 0) window.history.back();
        else if (appState === 1) setAppState(0);
        else if (appState === 2) setAppState(0);
        else window.history.back();
      });
    };
    window.addEventListener("popstate", handleBack);
    return () => window.removeEventListener("popstate", handleBack);
  }, [appState]);

  // window.history.replaceState(appState, "", "");

  // window.onpopstate = function (event) {
  //   if (event.state) { 
  //     alert("POPPED")
  //     var state = event.state; 
  //     setAppState(state); // See example render function in summary below
  //   }  
  // };

  return (
    <>
      {appState === 0 && <InstallButton></InstallButton>}
      {appState === 2 && <TopicSelection selected_topics={selectedTopics}
        setSelectedTopics={setSelectedTopics} setAppState={setAppState}></TopicSelection>}
      {appState === 0 && <ExcerciseLoader exc_filenames={selectedTopics} setAppState={setAppState}></ExcerciseLoader>}
      <Game setAppState={setAppState} visible={appState === 1}></Game>


    </>
  )
}

export default App

