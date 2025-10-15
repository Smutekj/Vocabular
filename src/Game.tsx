import { useRef, useEffect, useState, act } from 'react'
import './Game.css'

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

            canvas.scrollIntoView({ behavior: "smooth" })
            canvas.focus();
            var scale = 1;//window.devicePixelRatio; // Get DPR

            // canvas.style = "width: 95vw; height: 95vh";
            // Set the canvas element's CSS size
            var elementWidth = canvas.clientWidth;
            var elementHeight = canvas.clientHeight;
            if (typeof Module !== 'undefined' && Module.canvas && Module.canvas === canvas) {
                canvas.width = elementWidth * scale;
                canvas.height = elementHeight * scale;
            }
            console.log("changed canvas from browser to:\nw: " + canvas.width + " h " + canvas.height)
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
            script.src = `${import.meta.env.BASE_URL}projectx.js`;
            script.async = true;
            document.body.appendChild(script);
        }

        return () => {
            // document.body.removeChild(script);
        };
    }, []);

    function onZoomOutClick() {
        const Module = (window as any).Module;
        Module?._zoomCamera(1. / 0.9);
    }
    function onZoomInClick() {
        const Module = (window as any).Module;
        Module?._zoomCamera(0.9);
    }
    function onFullScreenToggle() {
        const Module = (window as any).Module;
        Module?._toggleFullscreen();
        // Module?.requestFullscreen(false, true);
        console.log("TOGGLING FULLSCREEN!");
    }

    return (
        <div style={{ display: visible ? "block" : "none" }}>
            {/* <div className="spinner" id='spinner'></div> */}
            {/* <div className="emscripten" id="status">Downloading...</div> */}
            <div style={{ "display": "flex", "flexDirection": "row", "justifyContent": "center" }}>
                <div className="zoomButton" onClick={onZoomOutClick}>-</div>
                <div className="zoomButton" onClick={onZoomInClick}>+</div>
            </div>
            <span id='controls'>
                <span><input type="checkbox" id="resize" />Resize canvas</span>
                <span><input type="button" id="fullscreenButton" onClick={onFullScreenToggle} value="Fullscreen" /></span>
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