import { useEffect, useState, useRef, useContext } from 'react'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowUp } from '@fortawesome/free-solid-svg-icons'
import { faArrowDown } from '@fortawesome/free-solid-svg-icons'
import type { ExerciseLine } from './Exercise.tsx';
import { TexRect, type TextureLocation } from './exerciseLoader.ts';

import './style/Summary.css'
import './style/Exercise.css'
import { ExercisesContext } from './App.tsx';

type SummaryProps = {
  exercises: Array<ExerciseLine>;
  setExercises: (exers : Array<ExerciseLine>) => void;
};


function drawSprite(father_el : HTMLElement, cavnas_id: string, canvas_w: number, canvas_h: number, texLoc: TextureLocation) {
    var canvas = document.getElementById("tableCanvas" + cavnas_id) as HTMLCanvasElement;
    if (!canvas) {
        canvas = document.createElement("canvas");
        canvas.id = "tableCanvas" + cavnas_id;
        canvas.width = canvas_w;
        canvas.height = canvas_h;
        father_el.appendChild(canvas);
    }

    const ctx = canvas.getContext("2d");

    const image_id = texLoc.atlasLocation;
    var atlas = document.getElementById(image_id.toString()) as HTMLImageElement; 
    if(!atlas)
    {
        atlas = new Image();
        atlas.id = image_id.toString();
        atlas.src = image_id.toString();
    }

    const rect = texLoc.texRect;

    atlas.onload = () => {
        ctx?.drawImage(
            atlas,
            rect.left, rect.top, rect.width, rect.height, // FROM atlas
            0, 0, canvas_w, canvas_h              // TO screen
        );
    };
}

type TableSpriteProps = {
  table_id: string;
  exer: ExerciseLine;
}

function TableSprite({table_id, exer} : TableSpriteProps) {

   const tableRef = useRef<HTMLTableCellElement>(null);

   useEffect(() =>  {
     const tableEl = tableRef.current 
    if (!tableEl) return;

    const tableSizeX = 50;
    const tableSizeY = 100;

    // if (exer.image_id) {
    const image_id : TextureLocation = {texRect: new TexRect(0, 100, 200, 200), atlasLocation: new URL('../Textures/Atlases/Werkzeug.png', import.meta.url)};  
    // drawSprite(tableEl, table_id, tableSizeX, tableSizeY, image_id);
    // }
  }, []);
 

  // const tableEl = document.getElementById(table_id);
  // const tableSizeX = 100; //tableEl.style.width;
  // const tableSizeY = 200; //tableEl.style.height;
  return (
    <td ref={tableRef} id={table_id} className="summaryTableRow" style={{ height: "40px" }}>
      {/* <canvas width={50} height={100} id={"tableCanvas" + table_id} ></canvas> */}
    </td>
  );
}
function Summary({ exercises }: SummaryProps) {

  const [sortAscending, setSortAscending] = useState<boolean>(true);

  const ctx = useContext(ExercisesContext);
  if(!ctx){throw new Error("ExerciseContext used outside provide!");}
  const {exercises2, setExercises2} = ctx;

  exercises.sort((ex1, ex2) => {
    const sc1 = ex1.score;
    const sc2 = ex2.score;
    return (2 * Number(sortAscending) - 1) * (sc2 - sc1);
  });

  return (
    <table style={{ borderCollapse: "collapse", width: "90vw", margin: "auto" }}>
      <thead>
        <tr>
          <th className="summaryTableHeader">
            Word
          </th>
          <th className="summaryTableHeader">
            Translation
          </th>
          <th className="summaryTableHeader">
            Image
          </th>
          <th className="summaryTableHeader">
            Score <button onClick={() => { setSortAscending(!sortAscending) }}>
              {sortAscending ? <FontAwesomeIcon icon={faArrowUp} /> : <FontAwesomeIcon icon={faArrowDown} />}
            </button>
          </th>
        </tr>
      </thead>
      <tbody>
        {exercises2.selected.map((exerId, index) => (
        
          <tr key={index}>
            <td className="summaryTableRow">
              {exercises2.pool[exerId].correct_word}
            </td>
            <td className="summaryTableRow">
              {exercises2.pool[exerId].translation}
            </td>
            <TableSprite table_id={"TableImage" + index} exer={exercises2.pool[exerId]} />
            <td className="summaryTableRow">
              {exercises2.pool[exerId].score}
            </td>
          </tr>
        )
                       )}
      </tbody>
    </table >
  );
}

export default Summary;