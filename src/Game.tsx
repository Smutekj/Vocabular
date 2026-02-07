import { useEffect, useState } from 'react'
import './style/Game.css'
import { type ExerciseLine } from './Exercise.js';
import { PracticeExam } from './Exam.tsx'
import LoadingScreen from './LoadingScreen.tsx';
import { MainMenu, GameSelection, PauseState, Settings } from './MainMenu.tsx';
import  Lobby  from './Lobby.tsx';
import type { AppStateT } from './shared.ts';

export const GameState = {
    LoadingAssets: "LOADING" as const,
    Running: "RUNNING" as const,
    Lobby: "LOBBY" as const,
    Paused: "PAUSED" as const,
    Exam: "EXAM" as const,
    Menu: "MENU" as const,
    Settings: "SETTINGS" as const,
    NewGame: "NEWGAME" as const,
};
export type GameStateT = typeof GameState[keyof typeof GameState];

export type WordGroup = {
    group_name: string;
    group_id: number;
    exercises: Array<ExerciseLine>;
    words_score: Map<string, number>;
    progress: number;
};

async function uploadExercisesToDb(topics: Array<string>) {
    const FS = (window as any).FS;
    const Module = (window as any).Module;
    if (!Module) { return; }
    if (!FS?.analyzePath('/execDb').exists) {
        FS?.mkdir("/execDb");
    }

    topics.forEach((topic) => {
/*         getItem<Array<ExerciseLine>>(topic).then((exercises) => {
            if (exercises) {
                FS?.writeFile("/execDb/" + topic + ".json", JSON.stringify({ [topic]: [...exercises] }));
            }
        }
        ) */;
    });

    await new Promise<void>((resolve, reject) => {
        FS?.syncfs(false, (err: any) => { err ? reject(err) : resolve() });
    });
}

type GameProps = {
    setAppState: (state: AppStateT) => void;
    visible: boolean;
    selectedTopics: string[];
    Module: any;
};

function isMobile(): boolean {
    var ua = navigator.userAgent || navigator.vendor;
    // Check for common mobile identifiers
    var isMobileDevice = /Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(ua);
    // isMobileDevice = isMobileDevice;
    return isMobileDevice ? true : false;
}

function ensureCanvasHasSize(Module: any, canvas: HTMLCanvasElement) {
    // Wait for browser to apply fullscreen layout
    requestAnimationFrame(() => {
        let width = canvas.clientWidth || window.innerWidth;
        let height = canvas.clientHeight || window.innerHeight;

        // Sometimes layout isn’t done yet — wait one more frame if zero
        if (width === 0 || height === 0) {
            requestAnimationFrame(() => {
                width = canvas.clientWidth || window.innerWidth;
                height = canvas.clientHeight || window.innerHeight;
                applyCanvasSize(Module, canvas, width, height);
            });
        } else {
            applyCanvasSize(Module, canvas, width, height);
        }
    });
}

function applyCanvasSize(Module: any, canvas: HTMLCanvasElement, width: number, height: number) {
    console.log(`Applying canvas size: ${width} x ${height}`);
    // canvas.width = width;
    // canvas.height = height;
    Module?._setCanvasSize?.(width, height);
}

function Game({ setAppState, visible, selectedTopics, Module }: GameProps) {

    const [gameStarted, setGameStarted] = useState<boolean>(false);
    const [gameState, setGameState] = useState<GameStateT>(GameState.LoadingAssets);
    const [questionCount, setQuestionCount] = useState<number>(3);

    //! set canvas size when it changes to visible
    useEffect(() => {

        if (!Module) { console.log("Module does not exist!"); return; }

        Module._disableInput?.(!visible);

        if (!visible) {

            // Disable Emscripten's global keyboard event capture
            if (Module["SDL"] && Module["SDL"].events) {
                document.removeEventListener('keydown', Module["SDL"].events.keydownCapture, true);
                document.removeEventListener('keyup', Module["SDL"].events.keyupCapture, true);
                document.removeEventListener('keypress', Module["SDL"].events.keypressCapture, true);
            }
        } else {
            // Re-enable when showing again
            if (Module["SDL"] && Module["SDL"].events) {
                document.addEventListener('keydown', Module["SDL"].events.keydownCapture, true);
                document.addEventListener('keyup', Module["SDL"].events.keyupCapture, true);
                document.addEventListener('keypress', Module["SDL"].events.keypressCapture, true);
            }
        }

        const canvas = (document.getElementById("canvas") as HTMLCanvasElement);
        if (visible && canvas) {
            // canvas.scrollIntoView({ behavior: "instant" })
            document.addEventListener("touchstart", () => {
                if (!Module.sfxCtx) {
                    Module.sfxCtx = new AudioContext({
                        latencyHint: "interactive"
                    });
                    console.log("baseLatency:", Module.sfxCtx.baseLatency);
                    console.log("outputLatency:", Module.sfxCtx.outputLatency);
                }
            }, { once: true });

            if (!gameStarted) {// If first time running the game, we have to load assets and call main
               

                if (canvas) {
                    setGameStarted(true);
                    // screen.orientation.("landscape");
                    screen.orientation.addEventListener("change", () => {
                        console.log(`The orientation of the screen is: ${screen.orientation}`);
                    });
                    // if (!window)
                    Module["sfxCtx"] = new AudioContext({ "latencyHint": "interactive" });
                    Module["soundBuffers"] = {};
                    uploadExercisesToDb(selectedTopics).then(() => {
                        fetch("Resources.json")
                            .then((response) => {
                                response.json().then((resource_registry) => {

                                    for (const sound_key in resource_registry["Sound"]) {
                                        const sound_json = resource_registry["Sound"][sound_key];
                                        fetch(sound_json["path"])
                                            .then(res => res.arrayBuffer())
                                            .then(buf => Module.sfxCtx.decodeAudioData(buf))
                                            .then(decoded => Module.soundBuffers[sound_key] = decoded);
                                    }
                                });
                            });
                        // Module.requestFullscreen(false, false);
                        Module.callMain();
                    });
                }
            } else { //! otherwise just make it visible by resizing canvas
                console.log("changed canvas from browser to:\nw: " + canvas.width + " h " + canvas.height)
                Module._setCanvasSize?.(canvas.clientWidth, canvas.clientHeight);

                // Module.requestFullscreen(false, false);
                Module._emscripten_resume_main_loop?.();
            }
        } else if (canvas) {
            //! reenable scrolling of root
            document.body.classList.remove("no_scrolling");
            if (Module._emscripten_pause_main_loop) {
                console.log("PAUSED MAIN LOOP!");
                Module._emscripten_pause_main_loop();
            }
        }
    }, [visible])

    useEffect(() => {
        const canvas = document.getElementById("canvas");
        const container = document.getElementById("canvasContainer");
        if (!canvas) return;

        if (!gameStarted) {

            const events = ['keydown', 'keypress', 'keyup'];
            events.forEach((eventName) => {
                window.addEventListener(eventName, (e) => {
                    const active = document.activeElement;
                    if (active && !['CANVAS'].includes(active.tagName)) {
                        e.stopImmediatePropagation();  // stops SDL’s listener before it runs
                    }
                }, true);
            });

            if (canvas && container && canvas.parentNode !== container) {
                container.appendChild(canvas);  // move canvas inside React layout
            }
            Module.canvas = canvas; //Set canvas to module

            //! allows us to change state from withing c++ app
            Module.setAppState = (state: number) => {
                var appstate : AppStateT;
                setAppState((state as AppStateT));
            };

            Module.setAssetsLoaded = () => {
                setGameState("MENU");
                setGameStarted(true);
            }; //! this will be called by game to know when it can start
;
            Module.pauseGame = (state: GameStateT) => {

                requestAnimationFrame(() => {
                    if (!document.fullscreenElement) {
                        setGameState(state);
                    } else {
                        document.exitFullscreen();
                        requestAnimationFrame(() => {
                            setGameState(state);
                        })
                    }
                    requestAnimationFrame(() => {
                        console.log("PAUSING MAIN LOOP");
                        Module._emscripten_pause_main_loop();
                    });
                });
            };
            Module.startExam = (question_count : number ) => {

                console.log(question_count);
                setQuestionCount(question_count);
                requestAnimationFrame(() => {
                    if (!document.fullscreenElement) {
                        setGameState(GameState.Exam);
                    } else {
                        document.exitFullscreen();
                        requestAnimationFrame(() => {
                            setGameState(GameState.Exam);
                        })
                    }
                    requestAnimationFrame(() => {
                        console.log("PAUSING MAIN LOOP");
                        console.log("QUESTION COUNT: ", questionCount);
                        Module._emscripten_pause_main_loop();
                    });
                });
            };
        }

        return () => { };
    }, []);

    useEffect(() => {
        window.history.pushState(gameState, "", "");
        const handleBack = (e: PopStateEvent) => {
            queueMicrotask(() => {
                const prevState = gameState;
                if (prevState === "MENU") { setAppState(0); }
                else if (prevState === "RUNNING") { setGameState("PAUSED"); Module._emscripten_pause_main_loop(); }
                else if (prevState === "PAUSED") { setAppState(0); }
                else { window.history.back(); }
            });
        };
        window.addEventListener("popstate", handleBack);

        if (gameState === GameState.Running) {
            Module._emscripten_resume_main_loop();
        }
        return () => window.removeEventListener("popstate", handleBack);
    }, [gameState])


    useEffect(() => {
        const canvas = document.getElementById("canvas") as HTMLCanvasElement;
        if (!canvas) { return; }

        if (gameState === GameState.Running) {
            canvas.focus();
            canvas.style.position = '';
            canvas.style.left = '';
        }
        else {
            canvas.style.position = 'absolute';
            canvas.style.left = window.innerWidth.toString() + "px";
            Module._emscripten_pause_main_loop();
        }
    }, [gameState]);

    return (

        <div style={{ display: visible ? "block" : "none" }}>

            {gameState === GameState.Menu &&
                <MainMenu setAppState={setAppState} setGameState={setGameState} Module={Module} />}

            {gameState === GameState.Lobby && <Lobby setAppState={setAppState} setGameState={setGameState} Module={Module} />}
            {gameState === GameState.LoadingAssets && <LoadingScreen Module={Module} />}
            {gameState === GameState.NewGame && <GameSelection setGameState={setGameState} Module={Module} />}
            {gameState === GameState.Paused && <PauseState setGameState={setGameState} />}
            {gameState === GameState.Settings && <Settings setGameState={setGameState} entryState={"MENU"} Module={Module} />}
            {gameState === GameState.Exam && <PracticeExam setGameState={setGameState} questions_count={questionCount}  />}

            <div id="canvasContainer" style={{ width: "100%", height: "100%" }}></div>
        </div >
    )
}

export default Game;