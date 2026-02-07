
import useLanguage, { type Language } from "./LanguageProvider";
import  {AppState, type AppStateT} from "./shared.ts";

const availableLanguages = ["en", "de", "cz"];
type LanguageSelectorProps = {
    setAppState: (state: AppStateT) => void;
};
export function LanguageSelector({ setAppState }: LanguageSelectorProps) {
    const { nativeLanguage, studiedLanguage, setNativeLanguage, setStudiedLanguage } = useLanguage();
    
    
    return (
        <>
            <div className="navigationContainer">
                <button onClick={() => { setAppState(AppState.Practice) }}>Back</button>
            </div>
            <div className="flex items-center justify-center h-full w-full">
                <div className="flex flex-col space-y-4 p-4 border rounded bg-gray-800 text-white w-64">
                    <div className="flex flex-col">
                        <label className="mb-1">Native Language:</label>
                        <select
                            className="p-2 rounded bg-gray-700 text-white"
                            value={nativeLanguage}
                            onChange={(e) => setNativeLanguage(e.target.value as Language)}
                        >
                            {availableLanguages.map((lang) => (
                                <option key={lang} value={lang}>
                                    {lang.toUpperCase()}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col">
                        <label className="mb-1">Studied Language:</label>
                        <select
                            className="p-2 rounded bg-gray-700 text-white"
                            value={studiedLanguage}
                            onChange={(e) => setStudiedLanguage(e.target.value as Language)}
                        >
                            {availableLanguages.map((lang) => (
                                <option key={lang} value={lang}>
                                    {lang.toUpperCase()}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        </>
    );
}