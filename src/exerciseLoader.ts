import { type WordGroup } from './Game.tsx';
import { getLanguagesJson, getNativeLang, getStudiedLang, type Language } from './LanguageProvider.tsx';
import { type ExerciseLine } from './Exercise.tsx';
import { faT } from '@fortawesome/free-solid-svg-icons';


async function fetchAtlases() {
    const textureRegistry = new Map<string, string[]>()
    await fetch("Textures/Atlases/TextureRegistry.json").then((response) => response.json()).then((atlases_data) => {
        atlases_data["atlases"].forEach((atlas_id: string) => {
            console.log(atlas_id);
            textureRegistry.set(atlas_id, new Array<string>());
        });
    }).catch((err: any) => console.log("ERROR Loading TextureRegistry.json", err));
    return textureRegistry;
}

export class TexRect {
    left: number;
    top: number;
    width: number;
    height: number;

    constructor(left: number, top: number, width: number, height: number) {
        this.left = left;
        this.top = top;
        this.width = width;
        this.height = height;
    }
};

export type TextureLocation = {
    texRect: TexRect,
    atlasLocation: URL,
};

function extractTopicName(atlas_name: string) {
    atlas_name = atlas_name.replace("_", "");
    atlas_name = atlas_name.replace(/[0-9]/, "");
    return atlas_name;
}

async function loadTextureAtlases() {
    const textureLocations = new Map<string, TextureLocation>();
    await fetchAtlases().then((textureRegistry) => {

        //! find texture rects from jsons
        textureRegistry.forEach((meanings, atlas_id) => {
            fetch("Textures/Atlases/" + atlas_id + ".json").then(response => response.json())
                .then((atlas_data) => {
                    const tex_size = atlas_data["meta"]["size"];
                    atlas_data["frames"].forEach((frame_data: any) => {
                        const word_text = frame_data["filename"];
                        const frame = frame_data["frame"];
                        const texRect = new TexRect(frame["x"], frame["y"], frame["w"], frame["h"]);
                        const location = new URL("../Textures/Atlases/" + atlas_id + ".png", import.meta.url);
                        textureLocations.set(atlas_id + "_" + word_text, { texRect: texRect, atlasLocation: location });
                    })

                    const topicName = extractTopicName(atlas_id);
                    const db_json_path = "/execDb/" + topicName + ".json";
                    const FS = (window as any).FS;
                    if (FS.analyzePath(db_json_path).exists) {
                        const json = JSON.parse(FS.readFile(db_json_path, { encoding: 'utf8' }));
                        //! write image location to a corresponding spot in db under 
                        // "atlas_id + word_text"
                        const location = new URL("../Textures/Atlases/" + atlas_id + ".png", import.meta.url);
                        atlas_data["frames"].forEach((frame_data: any) => {
                            json[atlas_id + "_" + frame_data["filename"]] = location.toString();
                        });
                        // FS.writeFile(db_json_path, { encoding: 'utf8' });
                    }
                })
                ;
        });
    });

    return textureLocations;
}

export async function reLoadWordGroups(exc_filenames: Array<string>, studiedLang: Language, nativeLang: Language)
    : Promise<Map<string, WordGroup>> {
    const groups = new Map<string, WordGroup>();
    const FS = (window as any).FS;

    await Promise.all(
        exc_filenames.map((filename, index) => {
            return fetch("Exercises/" + filename + ".csv")
                .then((response) => response.text())
                .then((data) => {
                    const exec_lines = data.split(/\r\n|\r|\n/);
                    const header = exec_lines[0].split(',');
                    const studied_col_id = header.findIndex((entry) => entry === studiedLang.toString());
                    const native_col_id = header.findIndex((entry) => entry === nativeLang.toString());
                    //! if exercise does not have any of our languages, skip it
                    if (studied_col_id !== -1 && native_col_id !== -1) {
                        const exercises = exec_lines.slice(1, exec_lines.length - 1).map((line, index) => {
                            return parseExerciseLine(filename, line, native_col_id, studied_col_id);
                        });
                        const group: WordGroup = {
                            exercises: exercises, group_id: 0,
                            group_name: filename, words_score: new Map<string, number>(), progress: 0
                        };
                        groups.set(filename, group);
                    }
                }).catch((error) => console.error("Error loading file:", error));
        })
    );

    await loadTextureAtlases().then((textureRegistry) => {
        //! write the info into IDBFS 

        if (textureRegistry.has("Tools2_chain")) {
            const texLoc = textureRegistry.get("Tools2_chain");
            if (texLoc) {
                // drawSprite("Penis", 300, 300, texLoc);
            }
        }
    });
    return groups;
};

function deserializeGroup(group_name: string, group_json: any) {
    const exercises = (group_json[group_name] as ExerciseLine[]);
    const group: WordGroup = {
        exercises: exercises,
        group_id: 0,
        group_name: group_name,
        words_score: new Map<string, number>(),
        progress: 0
    }
    return group;
}

function parseExerciseLine2(tex_loc : TextureLocation, topicName: string, line: string, native_col_id: number, target_col_id: number): ExerciseLine {
    const split_line = line.split(",");
    //! include image if it exists 

    const meaning_id = split_line[3].replace(' ', '');
    const image_filename = meaning_id + ".png";
    //   const image_url = image_names.includes(image_filename) ? String(`${import.meta.env.BASE_URL}Images/` + image_filename) : null;
    const image_url = null;

    return {
        type: split_line[0],
        meaning_id: meaning_id,
        correct_word: split_line[target_col_id], translation: split_line[native_col_id],
        image_src: image_url,  score: 0
    };
}


function parseExerciseLine(topicName: string, line: string, native_col_id: number, target_col_id: number): ExerciseLine {
    const split_line = line.split(",");
    //! include image if it exists 
    const meaning_id = split_line[3].replace(' ', '');
    const image_filename = meaning_id + ".png";
    //   const image_url = image_names.includes(image_filename) ? String(`${import.meta.env.BASE_URL}Images/` + image_filename) : null;
    const image_url = null;
    var image_id : TextureLocation;

    return {
        type: split_line[0], 
        meaning_id: meaning_id,
        correct_word: split_line[target_col_id], translation: split_line[native_col_id],
        image_src: image_url,  score: 0
    };
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

            return fetch("Exercises/" + filename + ".csv")
                .then((response) => response.text())
                .then((data) => {
                    const exec_lines = data.split(/\r\n|\r|\n/);
                    const header = exec_lines[0].split(',');
                    const studied_col_id = header.findIndex((entry) => entry === studiedLang.toString());
                    const native_col_id = header.findIndex((entry) => entry === nativeLang.toString());
                    //! if exercise does not have any of our languages, skip ip
                    if (studied_col_id !== -1 && native_col_id !== -1) {
                        const exercises = exec_lines.slice(1, exec_lines.length - 1).map((line, index) => {
                            return parseExerciseLine(filename, line, native_col_id, studied_col_id);
                        });
                        const group: WordGroup = {
                            exercises: exercises, group_id: 0,
                            group_name: filename, words_score: new Map<string, number>(), progress: 0
                        };
                        groups.set(filename, group);
                    }
                }).catch((error) => console.error("Error loading file:", error));
        })
    );

    return groups;
};

export async function loadWordGroupsAndSynchronizeDb(selectedTopics: string[])
    : Promise<Array<ExerciseLine>> {
    const studiedLang = getStudiedLang();
    const nativeLang = getNativeLang();
    var new_exercises = new Array<ExerciseLine>();

    await loadWordGroups(selectedTopics, studiedLang, nativeLang).then((groups) => {

        const FS = (window as any).FS;
        var needs_sync = false; //! will sync MEMFS only when the file does not exist in IDBFS

        var new_exercises = new Array<ExerciseLine>();
        groups.forEach((group, group_name) => {
            new_exercises.push(...group.exercises);
            const json_path = "/execDb/" + group_name + ".json";
            if (!FS.analyzePath(json_path).exists) {
                needs_sync = true;
                FS.writeFile(json_path, JSON.stringify({ [group_name]: [...group.exercises] }));
            }
            console.log(group);
        });

        if (needs_sync) {

            FS.syncfs(false, (err: any) => {
                if (err) { console.log(err); return; }
                console.log("Loaded topics to FS");
            });
        }
    });

    return new_exercises;
}


export async function reLoadGroupsAndSynchronizeDb(selectedTopics: string[])
    : Promise<Array<ExerciseLine>> {

    const studiedLang = getStudiedLang();
    const nativeLang = getNativeLang();
    const newExercises: ExerciseLine[] = [];

    try {
        // Reload word groups
        var groups;
        if(window.navigator.onLine)
        {
            groups = await reLoadWordGroups(selectedTopics, studiedLang, nativeLang);
        }else{
            groups = await loadWordGroups(selectedTopics, studiedLang, nativeLang);
        }
            

        const FS = (window as any).FS;

        // Save selected languages
        FS.writeFile('/execDb/SelectedLanguages.json', getLanguagesJson());
        

        // Save each group
        groups.forEach((group, groupName) => {
            newExercises.push(...group.exercises);

            const jsonPath = `/execDb/${groupName}.json`;
            FS.writeFile(jsonPath, JSON.stringify({ [groupName]: [...group.exercises] }));
        }); 

        // Wait for FS to sync
        await new Promise<void>((resolve, reject) => {
            FS.syncfs(false, (err: any) => {
                if (err) {
                    console.error(err);
                    reject(err);
                    return;
                }
                console.log("Loaded topics to FS");
                resolve();
            });
        });

    } catch (err) {
        console.error("Error reloading groups:", err);
    }

    return newExercises;
}