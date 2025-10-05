import { useRef, useEffect, useState, act } from 'react'

type GameProps = {
    setAppState: (state: number) => void;
    visible: boolean;
};

function Game({ setAppState, visible }: GameProps) {

    const canvasRef = useRef<HTMLCanvasElement>(null);

    //! set canvas size when it changes to visible
    useEffect(() => {

        const Module = (window as any).Module;
        if (!Module) { return; }

        Module?._disableInput?.(!visible);

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
        if (visible && canvasRef.current) {
            const canvas = canvasRef.current;
            canvas.width = 800;
            canvas.height = 600;

            Module?._setCanvasSize?.(canvas.width, canvas.height);
            Module?._emscripten_resume_main_loop?.();

        } else if (canvasRef.current) {
            // (window as any).Module?._emscripten_pause_main_loop?.();
        }
    }, [visible])

    useEffect(() => {
        if (!canvasRef.current) return;


        const canvasEl = document.getElementById("canvas");
        canvasEl?.focus();
        console.log(canvasEl);
        if (!document.getElementById("script")) {

            const events = ['keydown', 'keypress', 'keyup'];
            events.forEach((eventName) => {
                window.addEventListener(eventName, (e) => {
                    const active = document.activeElement;
                    if (active && !['CANVAS'].includes(active.tagName)) {
                        e.stopImmediatePropagation();  // stops SDL’s listener before it runs
                    }
                }, true);
            });

            //! create otput in Module
            (window as any).Module = {
                canvas: canvasRef.current,
                print: (text: string) => {
                    const output = document.getElementById("output") as HTMLTextAreaElement;
                    if (output) output.value += text + "\n";
                },
                printErr: (text: string) => console.error(text),
            };
            //! allows us to change state from withing c++ app
            (window as any).Module.setAppState = (state: number) => {
                setAppState(state);
            };
            (window as any).Module["onExit"] = () => {
                setAppState(0);
            };

            const script = document.createElement("script");
            script.id = "script";
            script.src = "projectx.js";
            script.async = true;
            document.body.appendChild(script);
        }

        return () => {
            // document.body.removeChild(script);
        };
    }, []);
    return (
        <div style={{ display: visible ? "block" : "none" }}>
            <div className="spinner" id='spinner'></div>
            <div className="emscripten" id="status">Downloading...</div>
            <span id='controls'>
                <span><input type="checkbox" id="resize" />Resize canvas</span>
                <span><input type="checkbox" id="pointerLock" defaultChecked />Lock/hide mouse pointer &nbsp;&nbsp;&nbsp;</span>
                {/* <span><input type="button" value="Fullscreen" onClick={Module.requestFullscreen(document.getElementById('pointerLock').checked, 
                                                                                  document.getElementById('resize').checked)}/> */}
                {/* </span> */}
            </span>
            <div className="emscripten_border">
                {/* onContextMenu={(event) => event.preventDefault()} */}
                <canvas className="emscripten" ref={canvasRef} id="canvas"
                    onContextMenu={(event) => event.preventDefault()} tabIndex={-1}></canvas>
            </div>
            <textarea id="output" rows={8}></textarea>
        </div>
    )
}

export default Game;