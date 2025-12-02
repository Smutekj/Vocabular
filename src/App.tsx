import { useEffect, useState, type JSX } from 'react'
import './style/App.css'

import Summary from './Summary.tsx';
import Game from './Game.tsx'
import InstallButton from './InstallButton.tsx';
import FinalExam from './Exam.tsx';
import Exercise2 from './Practice.tsx';
import TopicSelection from './TopicSelection.tsx'

import { type WordGroup } from './Game.tsx';
import { getLanguagesJson, getNativeLang, getStudiedLang, type Language } from './LanguageProvider.tsx';
import { type ExerciseLine } from './Exercise.tsx';

import { initDB, getItem, setItem } from './utils/db.ts';
import { LanguageSelector } from './LanguageSelector.tsx';


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


type LoaderProps = {
  exc_filenames: Array<string>;
  setAppState: (state: number) => void;
};

function deserializeGroup(group_name: string, group_json: any) {
  const exercises = (group_json[group_name] as ExerciseLine[]);
  const group: WordGroup = {
    excercises: exercises,
    group_id: 0,
    group_name: group_name,
    words_score: new Map<string, number>(),
    progress: 0
  }
  return group;
}

function parseExerciseLine(line: string, native_col_id: number, target_col_id: number): ExerciseLine {
  const split_line = line.split(",");
  //! include image if it exists 
  const meaning_id = split_line[3].replace(' ', '');
  const image_filename = meaning_id + ".png";
  console.log(meaning_id);
  const image_url = image_names.includes(image_filename) ? String(`${import.meta.env.BASE_URL}Images/` + image_filename) : null;
  return { meaning_id: meaning_id, correct_word: split_line[target_col_id], translation: split_line[native_col_id], image_src: image_url, score: 0 };
}



async function loadWordGroups(exc_filenames: Array<string>, studiedLang: Language, nativeLang: Language)
  : Promise<Map<string, WordGroup>> {
  const groups = new Map<string, WordGroup>();
  const FS = (window as any).FS;

  await Promise.all(
    exc_filenames.map((filename, index) => {

      const db_json_path = "/execDb/" + filename + ".json";
      if (FS.analyzePath(db_json_path).exists) {// if file exists in IDBFS do not fetch
        // needs_sync = true;
        const json = JSON.parse(FS.readFile(db_json_path, { encoding: 'utf8' }));
        groups.set(filename, deserializeGroup(filename, json));
        return Promise.resolve("done");
      }

      return fetch("Exercises/" + filename)
        .then((response) => response.text())
        .then((data) => {

          const exec_lines = data.split(/\r\n|\r|\n/);
          const header = exec_lines[0].split(',');
          const studied_col_id = header.findIndex((entry) => entry === studiedLang.toString());
          const native_col_id = header.findIndex((entry) => entry === nativeLang.toString());
          //! if exercise does not have any of our languages, skip ip
          if (studied_col_id !== -1 && native_col_id !== -1) {
            const exercises = exec_lines.slice(1, exec_lines.length - 1).map((line, index) => {
              return parseExerciseLine(line, native_col_id, studied_col_id);
            });
            const group: WordGroup = {
              excercises: exercises, group_id: 0,
              group_name: filename, words_score: new Map<string, number>(), progress: 0
            };
            groups.set(filename, group);
          }

        }).catch((error) => console.error("Error loading file:", error));
    })
  );

  return groups;
};

async function reLoadWordGroups(exc_filenames: Array<string>, studiedLang: Language, nativeLang: Language)
  : Promise<Map<string, WordGroup>> {
  const groups = new Map<string, WordGroup>();
  const FS = (window as any).FS;

  await Promise.all(
    exc_filenames.map((filename, index) => {
      return fetch("Exercises/" + filename)
        .then((response) => response.text())
        .then((data) => {
          const exec_lines = data.split(/\r\n|\r|\n/);
          const header = exec_lines[0].split(',');
          const studied_col_id = header.findIndex((entry) => entry === studiedLang.toString());
          const native_col_id = header.findIndex((entry) => entry === nativeLang.toString());
          //! if exercise does not have any of our languages, skip it
          if (studied_col_id !== -1 && native_col_id !== -1) {
            const exercises = exec_lines.slice(1, exec_lines.length - 1).map((line, index) => {
              return parseExerciseLine(line, native_col_id, studied_col_id);
            });
            const group: WordGroup = {
              excercises: exercises, group_id: 0,
              group_name: filename, words_score: new Map<string, number>(), progress: 0
            };
            groups.set(filename, group);
          }
        }).catch((error) => console.error("Error loading file:", error));
    })
  );
  return groups;
};

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


type GameStartProps = {
  wordGroups: Map<string, WordGroup>;
  setAppState: (state: number) => void;
};

function GameStartButton({ wordGroups, setAppState }: GameStartProps) {

  return (
    <>
      <button
        onClick={() => { setAppState(1); }}>
        <span className="button-text">Start Game</span>
      </button>
    </>
  );
}

function ExerciseLoader({ exc_filenames, setAppState }: LoaderProps) {

  const [activity, setActivity] = useState<ActivityType>("summary");
  const [animationState, setAnimationState] = useState<AnimationState>("FadeIn");
  const [loaderState, setLoaderState] = useState<string>("loading");
  const [wordGroups, setWordGroups] = useState<Map<string, WordGroup>>(new Map<string, WordGroup>);
  const [excercises, setExercises] = useState<Array<ExerciseLine>>([]);
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

  const nativeLang = getNativeLang();
  const studiedLang = getStudiedLang();

  useEffect(() => {
    setLoaderState("loading");
    //! will fetch excercises for each exc_filename if they don't exist in IDBFS
    reLoadWordGroups(exc_filenames, studiedLang, nativeLang).then((groups) => {
      setWordGroups(groups);
      
      const FS = (window as any).FS;
      FS.writeFile('/execDb/SelectedLanguages.json', getLanguagesJson());

      var new_excercises = new Array<ExerciseLine>();
      groups.forEach((group, group_name) => {
        new_excercises.push(...group.excercises);
        const json_path = "/execDb/" + group_name + ".json";
        FS.writeFile(json_path, JSON.stringify({ [group_name]: [...group.excercises] }));
        // localStorage.setItem("TestExec", JSON.stringify({ [group_name]: [...group.excercises] }));
      });

      FS.syncfs(false, (err: any) => {
        if (err) { console.log(err); return; }
        console.log("Loaded topics to FS");
      });

      setExercises(new_excercises);
      setLoaderState("finished");
    });
  }, [studiedLang, nativeLang]);


  useEffect(() => {
    setLoaderState("loading");
    //! will fetch excercises for each exc_filename if they don't exist in IDBFS
    loadWordGroups(exc_filenames, studiedLang, nativeLang).then((groups) => {
      setWordGroups(groups);

      const FS = (window as any).FS;
      var needs_sync = false; //! will sync MEMFS only when the file does not exist in IDBFS

      var new_excercises = new Array<ExerciseLine>();
      groups.forEach((group, group_name) => {
        new_excercises.push(...group.excercises);
        const json_path = "/execDb/" + group_name + ".json";
        if (!FS.analyzePath(json_path).exists) {
          needs_sync = true;
          FS.writeFile(json_path, JSON.stringify({ [group_name]: [...group.excercises] }));
        }
      });

      if (needs_sync) {

        FS.syncfs(false, (err: any) => {
          if (err) { console.log(err); return; }
          console.log("Loaded topics to FS");
        });
      }

      setExercises(new_excercises);
      setLoaderState("finished");
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
      smallExercise: Exercise2,
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
          <div className="navigationContainer">
            <GameStartButton wordGroups={wordGroups} setAppState={setAppState}></GameStartButton>
            <button onClick={() => swapActivity("exam")}>FinalExam</button>
            <button onClick={() => swapActivity("smallExercise")}>Exercise</button>
            <button onClick={() => setAppState(2)}>Select Topics</button>
            <button onClick={() => setAppState(3)}>Languages</button>
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

function App() {
  const [selectedTopics, setSelectedTopics] = useState<string[]>(["Werkzeug.csv"]);
  const [appState, setAppState] = useState<number>(0);
  const [moduleLoaded, setModuleLoaded] = useState<boolean>(false);


  localStorage.setItem("topics", selectedTopics.toString());

  image_names.length = 0;
  for (var v in images) {
    const split_path = v.split('/');
    image_names.push(split_path[split_path.length - 1]);
  }

  // useEffect(() => {

  //   if (appState === 1 || appState == 2) {
  //     window.history.pushState(appState, "", "");
  //   }

  //   const handleBack = (e: PopStateEvent) => {
  //     queueMicrotask(() => {
  //       if (appState === 0) window.history.back();
  //       else if (appState === 1) setAppState(0);
  //       else if (appState === 2) setAppState(0);
  //       else window.history.back();
  //     });
  //   };
  //   window.addEventListener("popstate", handleBack);
  //   return () => window.removeEventListener("popstate", handleBack);
  // }, [appState]);

  useEffect(() => {
    if (!document.getElementById("ModuleScript")) {
      (window as any).Module = {
        print: (text: string) => {
          const output = document.getElementById("output") as HTMLTextAreaElement;
          if (output) output.value += text + "\n";
        }
      };
      const script = document.createElement("script");
      script.id = "ModuleScript";
      script.async = false;
      script.src = '/Vocabular/projectx.js';
      script.onload = () => {
        (window as any).Module["onRuntimeInitialized"] = () => {
          //! initialize FS and mount execrcise DB
          const FS = (window as any).FS;
          FS.mkdir('/execDb');
          FS.mount(FS.filesystems.IDBFS, {}, '/execDb');
          FS.writeFile('/execDb/SelectedLanguages.json', getLanguagesJson())

          FS.syncfs(true, (err: any) => {
            setModuleLoaded(true);
            if (err) { console.error("Error syncing to IDBFS:", err); return; }
            console.log("IDBFS synced.");
          });
        }
      };
      document.body.appendChild(script);
    }
  }, []);

  return (
    <>
      {appState === 0 && <InstallButton></InstallButton>}
      {appState === 0 && moduleLoaded && <ExerciseLoader exc_filenames={selectedTopics} setAppState={setAppState}></ExerciseLoader>}
      {appState === 2 && <TopicSelection selected_topics={selectedTopics}
        setSelectedTopics={setSelectedTopics} setAppState={setAppState}></TopicSelection>}
      {appState === 3 && <LanguageSelector setAppState={setAppState} />}
      
      {
        moduleLoaded &&
        <Game setAppState={setAppState}
          visible={appState === 1}
          selectedTopics={selectedTopics}
          Module={(window as any).Module}
        />}
      {moduleLoaded && <textarea id="output" rows={8}></textarea>}
    </>
  )
}

export default App
