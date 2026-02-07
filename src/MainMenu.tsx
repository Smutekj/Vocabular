import { useRef, useEffect, useState, type JSX, type ChangeEvent, type ChangeEventHandler } from 'react'
import './style/App.css'
import { GameState, type GameStateT } from './Game';
import type { AppStateT } from './shared';


type GameSelectionProps = {
    setGameState: (state: GameStateT) => void;
    Module: any;
};

/* const menuButtonStyle = "w-full  py-3 px-4 \
                        bg-blue-600 \
                        text-white  text-lg rounded-xl shadow-md \
                        hover:bg-blue-500 hover:shadow-lg \
                        transition duration-200 "
 */
export function GameSelection({ setGameState, Module }: GameSelectionProps) {

    const onStartClick = (id: number) => {
        setGameState("RUNNING");
        Module._startGame(id);
    };

    const gameNames: Array<string> = new Array<string>("Snake", "Jump", "Castle Crawl" );

    return (
        <div className="flex flex-col items-center justify-center h-[90vh] space-y-6">
            <h1 className="text-3xl font-semibold text-yellow-400 mb-4">
                Select Game
            </h1>
            <div className="flex flex-col space-y-4 w-full max-w-xs">
                {gameNames.map((name, id) => (
                    <button
                        key={id}
                        onClick={() => onStartClick(id)}
                        >
                        {name}
                    </button>
                ))}
            </div>
        </div>
    )
}

type PauseState = {
    setGameState: (state: GameStateT) => void;
};

export function PauseState({ setGameState }: PauseState) {


    const menuTexts: Array<string> = new Array<string>("Resume", "New Game", "Exit To Menu");
    const menuActions = (buttonId: string) => {
        if (buttonId === 'Resume') {
            setGameState("RUNNING");
        }
        else if (buttonId === 'New Game') {

        }
        else if (buttonId === 'Exit To Menu') {
            setGameState("MENU");
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-[90vh] space-y-6">
            <h1 className="text-3xl font-semibold text-yellow-400 mb-4">
                Game Paused
            </h1>
            <div className="flex flex-col space-y-4 w-full max-w-xs">
                {menuTexts.map((name, id) => (
                    <button
                        key={id}
                        onClick={() => menuActions(name)}
                        >
                        {name}
                    </button>
                ))}
            </div>
        </div>
    )

}

type VolumeSliderProps = {
    volume: number;
    setVolume: (newVolume: number) => void;
};

function VolumeSlider({ volume, setVolume }: VolumeSliderProps) {
    return (
        <div className="w-64 flex items-center space-x-3">
            {/* <span>🔈</span> */}
            <input
                type="range" min="0" max="100" step="1" 
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className=" w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer
                    accent-blue-500"
            />

            {/* <span>🔊</span> */}
        </div>
    );
}

type SettingsProps = {
    setGameState: (state: GameStateT) => void;
    Module: any;
    entryState: GameStateT;
};

export function Settings({ setGameState, entryState, Module }: SettingsProps) {

    const [volume, setVolume] = useState<number>(50);

    const mainMenuTexts: Array<string> = new Array<string>("Play Game", "Settings", "Back");
    const mainMenuActions = (buttonId: string) => {
        if (buttonId === 'Play Game') {
            setGameState("NEWGAME");
        }
        else if (buttonId === 'Settings') {
        }
        else if (buttonId === 'Back') {
            setGameState(entryState);
        }
    };


    return (
        <div className="flex flex-col items-center justify-center h-[90vh] space-y-6">
            <VolumeSlider volume={volume} setVolume={setVolume} />
        </div>
    )
};


type MainMenuProps = {
    setAppState: (state: AppStateT) => void;
    setGameState: (state: GameStateT) => void;
    Module: any;
};
export function MainMenu({ setAppState, setGameState, Module }: MainMenuProps) {

    const [menuState, setMenuState] = useState<string>("MainMenu");

    // Module.pauseGame = () => { setMenuState("PauseState"); }; //! this will be called by game to know when it can start

    const mainMenuTexts: Array<string> = new Array<string>("Play Game", "Settings", "Back");
    const mainMenuActions = (buttonId: string) => {
        if (buttonId === 'MultiPlayer') {
            setGameState(GameState.Lobby);
        }
        if (buttonId === 'Play Game') {
            setGameState(GameState.NewGame);
        }
        else if (buttonId === 'Settings') {
            setGameState(GameState.Settings);
        }
        else if (buttonId === 'Back') {
            setAppState(0);
        }
    };

    return (

        <div className="flex flex-col items-center justify-center h-[90vh] space-y-6">
            {menuState === "MainMenu" &&
                <div className="flex flex-col space-y-4 w-full max-w-xs">

                    {mainMenuTexts.map((name, id) => (
                        <button
                            key={id}
                            onClick={() => mainMenuActions(name)}
                            >
                            {name}
                        </button>
                    ))}
                </div>
            }
        </div>
    );
}
