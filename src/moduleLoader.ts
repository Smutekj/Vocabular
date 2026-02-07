import type { ExercisesContextT } from './App.tsx';
import { getLanguagesJson } from './LanguageProvider.tsx';

export function loadAndInitializeEmscriptenModule(
    setModuleLoaded: (state: boolean) => void,
    exercises2: ExercisesContextT, setExercises2: (newExers: ExercisesContextT) => void) {

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
        script.src = '/Vocabular/projectx_Client.js';
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
} 