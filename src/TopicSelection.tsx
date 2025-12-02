import { useEffect, useState } from 'react'

import {getNativeLang, type Language} from './LanguageProvider.tsx'

type TopicSelectionProps = {
    // topic_groups: Map<string, WordGroup>;
    selected_topics: string[]
    setSelectedTopics: (topics: string[]) => void;
    setAppState: (state: number) => void;
};


type ExerciseRegistryEntry = {
    name: Record<Language, string>,
    url: string,
};
type ExerciseRegistry = {
    entries: ExerciseRegistryEntry[];
    cacheStates: boolean[];
};

async function loadExerciseRegistry() {
    const exec_metadata: ExerciseRegistry = { entries: [], cacheStates: [] };

    await fetch("/Vocabular/Exercises/exerciseRegistry.json").then(response => { return response.json() })
        .then(json => {
            exec_metadata.entries = json as ExerciseRegistryEntry[];

        }).catch((err) => {
            console.log("Failed to fetch exerciseRegistry.json: ", err);
        });

    //! save into IDBFS

    return exec_metadata;
};

function TopicSelection({ selected_topics, setSelectedTopics, setAppState }: TopicSelectionProps) {

    useEffect(() => {
    }, [selected_topics]);

    const [execRegistry, setExecRegistry] = useState<ExerciseRegistry>(
        { entries: [], cacheStates: [] }
    );

    useEffect(() => {
        loadExerciseRegistry().then((registry) => {
            setExecRegistry(registry);
        }
        );
    }, []);


    const onSelection = (e: React.MouseEvent<HTMLDivElement, MouseEvent>, topic: string) => {
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
                {execRegistry.entries.map((entry: ExerciseRegistryEntry, index: number) => {
                    const name = entry.name[getNativeLang()];
                    const selected = selected_topics.includes(entry.url);
                    return (
                        <div
                            key={name}
                            className="topicSelectionRect"
                            style={{ borderColor: selected ? "green" : "gray" }}
                            onClick={(e) => onSelection(e, entry.url)}>
                            {name}
                        </div>
                    )
                }
                )}
            </div>
        </>
    );
}

export default TopicSelection;