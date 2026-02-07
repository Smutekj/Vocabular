import { createContext, useContext, useEffect, useState, type JSX } from 'react'
import './style/App.css'

import Summary from './Summary.tsx';
import Game from './Game.tsx'
import InstallButton from './InstallButton.tsx';
import FinalExam from './Exam.tsx';
import Exercise2 from './Practice.tsx';
import TopicSelection from './TopicSelection.tsx'
import WordSelection from './WordSelection.tsx'

import { AppState, type AppStateT } from './shared.ts';

import { getNativeLang, getStudiedLang } from './LanguageProvider.tsx';
import { type ExerciseLine } from './Exercise.tsx';

import { LanguageSelector } from './LanguageSelector.tsx';
import { loadWordGroupsAndSynchronizeDb, reLoadGroupsAndSynchronizeDb } from './exerciseLoader.ts';
import { loadAndInitializeEmscriptenModule } from './moduleLoader.ts';
import { useComposedRefs } from 'motion/react';
import { i } from 'motion/react-client';


const images = import.meta.glob("./assets/Images/*.png", { eager: true, import: 'default' });
const image_names = Array<string>();
const imageUrls = Object.values(images) as string[];


export const ActivityType = {
  Summary: "summary" as const,
  SmallExercise: "smallExercise" as const,
  Exam: "exam" as const,
};
type ActivityType = typeof ActivityType[keyof typeof ActivityType];

export const AnimationState = {
  FadingIn: "FadeIn" as const,
  Animating: "Animating" as const,
};
type AnimationState = typeof AnimationState[keyof typeof AnimationState];


type NavigationProps = {
  appState: AppStateT,
  setAppState: (state: AppStateT) => void,
};

function Navigation({ appState, setAppState }: NavigationProps) {

  const [animationState, setAnimationState] = useState<AnimationState>("FadeIn");

  function swapStateAnimated(target_state: AppStateT) {
    if (animationState === "FadeIn") {
      setAnimationState("Animating");
      setTimeout(() => { setAnimationState("FadeIn"); setAppState(target_state) }, 500);
    }
  }

  return
  <>
    <div className="navigationContainer">
      <button onClick={() => setAppState(AppState.Game)}>Game </button>
      <button onClick={() => setAppState(AppState.Exam)}>Final Exam</button>
      <button onClick={() => setAppState(AppState.SmallExam)}>Exercise</button>
      <button onClick={() => setAppState(AppState.TopicSelection)}>Select Topics</button>
      <button onClick={() => setAppState(AppState.LanguageSelection)}>Languages</button>
    </div>
  </>

};

type PracticeProps = {
  selectedTopics: Array<string>;
  setAppState: (state: AppStateT) => void;
  hidden: boolean;
};
function Practice({ selectedTopics, setAppState, hidden }: PracticeProps) {

  const [activity, setActivity] = useState<ActivityType>("summary");
  const [animationState, setAnimationState] = useState<AnimationState>("FadeIn");
  const [loaderState, setLoaderState] = useState<string>("loading");
  const [exercises, setExercises] = useState<Array<ExerciseLine>>([]);

  const exerCtx = useContext(ExercisesContext);
  if (!exerCtx) { throw new Error("ExerciseContext used outside provider!") }
  const { exercises2, setExercises2 } = exerCtx;

  const nativeLang = getNativeLang();
  const studiedLang = getStudiedLang();

  useEffect(() => {
    setLoaderState("loading");
    //! will fetch excercises for each exc_filename if they don't exist in IDBFS
    reLoadGroupsAndSynchronizeDb(selectedTopics).then((exers) => {
      setExercises(exers);
      var newExercises2: ExercisesContextT = { pool: [], selected: [] };
      newExercises2.pool = exers;
      //! load selected exercisesIds if in IDBFS
      newExercises2.selected = exers.map((v, index)=>index);
      const FS = (window as any).FS;
      if (FS.analyzePath("/execDb/SelectedIds.json").exists) {

        // newExercises2.selected = JSON.parse(FS.readFile("/execDb/SelectedIds.json", { encoding: 'utf8' }))["selectedIds"];
      }
      setExercises2(newExercises2);
      setLoaderState("finished");
    })
  }, [studiedLang, nativeLang]);

  useEffect(() => {
    setLoaderState("loading");
    //! will fetch excercises for each exc_filename if they don't exist in IDBFS
    reLoadGroupsAndSynchronizeDb(selectedTopics).then((exers) => {
      setExercises(exers);
      var newExercises2: ExercisesContextT = { pool: [], selected: [] };
      newExercises2.pool = exers;
      //! load selected exercisesIds if in IDBFS
      const FS = (window as any).FS;
      if (FS.analyzePath("/execDb/SelectedIds.json").exists) {
        // newExercises2.selected = JSON.parse(FS.readFile("/execDb/SelectedIds.json", { encoding: 'utf8' }))["selectedIds"];
      }
      newExercises2.selected = exers.map((v, index)=>index);
      setExercises2(newExercises2);
      setLoaderState("finished");
    })
  }, [selectedTopics]);
  // useEffect(() => {
    // setLoaderState("loading");
    // //! will fetch excercises for each exc_filename if they don't exist in IDBFS
    // console.log("CALLING SELECTEDTOPICS useEffect");
    // loadWordGroupsAndSynchronizeDb(selectedTopics).then((exers) => {
    //   setExercises(exers);
    //   var newExercises2: ExercisesContextT = { pool: [], selected: [] };
    //   newExercises2.pool = exers;
    //   //! load selected exercisesIds if in IDBFS
    //   const FS = (window as any).FS;
    //   if (FS.analyzePath("/execDb/SelectedIds.json").exists) {
        
    //     newExercises2.selected = JSON.parse(FS.readFile("/execDb/SelectedIds.json", { encoding: 'utf8' }))["selectedIds"];
    //   }
    //   newExercises2.selected = exers.map((v, index)=>index);
    //   console.warn(selectedTopics);
    //   console.warn(newExercises2.selected);

    //   setExercises2(newExercises2);
    //   setLoaderState("finished");
    // });
  // }, [selectedTopics]);

  function swapActivity(target_activity: ActivityType) {
    if (animationState === "FadeIn") {
      setAnimationState("Animating");
      setTimeout(() => { setAnimationState("FadeIn"); setActivity(target_activity) }, 500);
    }
  }

  function ActivitySwitcher(currentActivity: ActivityType) {
    const activityComps: Record<ActivityType, React.ComponentType<any>> = {
      smallExercise: Exercise2,
      summary: Summary,
      exam: FinalExam
    };
    const ActiveComp = activityComps[currentActivity];
    return <ActiveComp exercises={exercises2.pool} setExercises={setExercises} />
  }

  let content: JSX.Element;
  switch (activity) {
    case 'summary':
      content = (
        <>
          <div className="navigationContainer">
            <button onClick={() => setAppState(AppState.Game)}>Play Game</button>
            <button onClick={() => swapActivity("exam")}>FinalExam</button>
            <button onClick={() => swapActivity("smallExercise")}>Exercise</button>
            <button onClick={() => setAppState(AppState.TopicSelection)}>Select Topics</button>
            <button onClick={() => setAppState(AppState.LanguageSelection)}>Languages</button>
            {/* <button onClick={() => setAppState(AppState.WordSelection)}>Select Words</button> */}
          </div>
          {ActivitySwitcher(activity)}
          <button onClick={() => swapActivity("smallExercise")}>Exercise</button>
        </>
      );
      break;
    case 'smallExercise':
      content = (
        <>
          {ActivitySwitcher(activity)}
          <button onClick={() => swapActivity("summary")}>Finnish Exercise</button>
        </>
      )
      break;
    case 'exam':
      content = (
        <>
          {ActivitySwitcher(activity)}
          <button onClick={() => swapActivity("summary")}>Finnish Exercise</button>
        </>
      );
      break;
  }

  const stateClasses = { FadeIn: "fadeIn", Animating: "swapAnimationOut" };
  return (
    <div style={{ display: hidden ? 'none' : 'block' }}>
      {loaderState === "loading" ?
        <p>Loading</p>
        :
        <div
          key={animationState}
          className={stateClasses[animationState]} >
          {content}
        </div>
      }
    </div>
  );
}

export type ExercisesContextT = {
  pool: ExerciseLine[],
  selected: number[],
}
export const ExercisesContext = createContext<{
  exercises2: ExercisesContextT;
  setExercises2: React.Dispatch<React.SetStateAction<ExercisesContextT>>;
} | null>(null);

function App() {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [appState, setAppState] = useState<AppStateT>(AppState.TopicSelection);
  const [moduleLoaded, setModuleLoaded] = useState<boolean>(false);
  const [exercises2, setExercises2] = useState<ExercisesContextT>({ pool: [], selected: [] });


  useEffect(() => {
    const savedTopicSelection = localStorage.getItem("topics");
    if (selectedTopics.length === 0 && savedTopicSelection) {
      setSelectedTopics(savedTopicSelection.split(","))
      setAppState(AppState.Practice);
    }
  }, []);

  useEffect(() => {
    loadAndInitializeEmscriptenModule(setModuleLoaded, exercises2, setExercises2);
  }, []);


  return (
    <ExercisesContext.Provider value={{ exercises2, setExercises2 }}>
      {appState === AppState.Practice && <InstallButton />}
      {moduleLoaded && <Practice selectedTopics={selectedTopics} setAppState={setAppState} hidden={appState !== AppState.Practice} />}
      {
        appState === AppState.TopicSelection &&
        <TopicSelection
          selected_topics={selectedTopics}
          setSelectedTopics={setSelectedTopics}
          setAppState={setAppState} />
      }
      {appState === AppState.LanguageSelection && <LanguageSelector setAppState={setAppState} />}
      {/* {appState === AppState.WordSelection && <WordSelection setAppState={setAppState} />} */}
      {
        moduleLoaded &&
        <Game setAppState={setAppState}
          visible={appState === 1}
          selectedTopics={selectedTopics}
          Module={(window as any).Module}
        />
      }
      {moduleLoaded && <textarea style={{ position: 'absolute', top: -5000 }} id="output" rows={8}></textarea>}
    </ExercisesContext.Provider >
  )
}

export default App
