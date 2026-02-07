
import { useEffect, useState, useRef, useContext } from 'react'
import type { ExerciseLine } from './Exercise.tsx';
import { AppState, type AppStateT } from './shared.ts';
import { ExercisesContext, type ExercisesContextT } from './App.tsx';
import './style/Summary.css'


type SelectableWordProps = {
    exer: ExerciseLine,
    action: () => void,
};

function SelectableWord({ exer, action }: SelectableWordProps) {

    function selectionAction() {
        action();
    }

    return (
        <tr
            style={{}}
            onClick={selectionAction}
            className='wordSelectionTableRow'
        >
            <td className={"summaryTableRow"}>
                {exer.correct_word}
            </td>
            <td className="summaryTableRow">
                {exer.translation}
            </td>
        </tr>
    );
}
type WordSelectorProps = {
    setAppState: (state: AppStateT) => void,
};

function WordSelector({ setAppState }: WordSelectorProps) {

    const ctx = useContext(ExercisesContext);
    if (!ctx) throw new Error("ExercisesContext used outside provider.");
    const { exercises2, setExercises2 } = ctx;

    function addExercise(newExer: ExerciseLine) {
        const exers: ExercisesContextT = { pool: [...exercises2.pool], selected: [...exercises2.selected] }
        exers.pool.push(newExer);
        exers.selected.push(exers.pool.length);
    };
    function selectExercise(exerId: number) {
        const exers: ExercisesContextT = { pool: [...exercises2.pool], selected: [...exercises2.selected] }
        exers.selected.push(exerId);
        setExercises2(exers);
    };

    function unselectExercise(exerId: number) {
        const exers: ExercisesContextT = { pool: [...exercises2.pool], selected: [...exercises2.selected] }
        const index = exers.selected.indexOf(exerId);
        if (index > -1) {
            exers.selected.splice(index, 1);
        }
        setExercises2(exers);
    };

    function onFinnish() {

        const FS = (window as any).FS;
        const selectionJsonPath = "/execDb/SelectedIds.json";
        FS.writeFile(selectionJsonPath, JSON.stringify({"selectedIds": [...exercises2.selected]}));
        FS.syncfs(false, (err: any) => {});
        
        setAppState(AppState.Practice);
    }

    return (
        <>
            <button onClick={onFinnish}>Finnish</button>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start' }}>
                <table style={{ borderCollapse: "collapse", width: "47vw", marginLeft: "auto", marginRight: "auto" }}>
                    <caption style={{ fontWeight: "bold", marginBottom: "8px", fontSize: "1.2rem" }}>
                        Selected Words
                    </caption>
                    <thead>
                        <tr>
                            <th className="summaryTableHeader">
                                Word
                            </th>
                            <th className="summaryTableHeader">
                                Translation
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {exercises2.selected.map((exerId: number, index: number) => (
                            <SelectableWord key={index} exer={exercises2.pool[exerId]} action={() => unselectExercise(exerId)} />
                        )
                        )}
                    </tbody>
                </table >
                <table style={{ borderCollapse: "collapse", width: "47vw", marginLeft: "auto", marginRight: "auto" }}>
                    <caption style={{ fontWeight: "bold", marginBottom: "8px", fontSize: "1.2rem" }}>
                        Available Words
                    </caption>
                    <thead>
                        <tr>
                            <th className="summaryTableHeader">
                                Word
                            </th>
                            <th className="summaryTableHeader">
                                Translation
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            //! render not selected exercises
                            exercises2.pool.map((ex, indexPool) => ({ ex, indexPool }))
                                .filter((ex, index) => !exercises2.selected.includes(index))
                                .map(({ ex, indexPool }) => (
                                    <SelectableWord key={indexPool} exer={ex} action={() => { selectExercise(indexPool) }} />
                                )
                                )}
                    </tbody>
                </table >
            </div>
        </>
    )

}


export default WordSelector;