import { useCallback, useContext, useRef } from "react";
import { Context } from "../../store";
import Note from "../Note";
import {world, viewport} from "./index.module.css";
import { usePan } from "../../hooks/usePan";
import { useWorldClick } from "../../hooks/useWorldClick";

function randomInt(min: number, max: number){
  return min + Math.floor(Math.random() * (max - min + 1));
}

export default function World(){
  const viewportRef = useRef<HTMLElement>(null);
  const { cam, dragged } = usePan(viewportRef);

  const ctx = useContext(Context);
    const addNote = useCallback(() => {
        if(!ctx){
            return;
        }
        const [,dispatch] = ctx;
        dispatch({
            "type":"add",
            "payload": {
                id: String(crypto.randomUUID()),
                dimensions: [randomInt(100, 300), randomInt(100, 300)],
                position: [randomInt(0, 250), randomInt(0, 250)],
                title: Math.random()>0.5? "Test" + crypto.randomUUID(): "",
                contents: Math.random()>0.5? "Test" : ""
            }
        })
    }, [ctx]);
    const onClick = useWorldClick(viewportRef, cam, dragged, addNote);
    if(!ctx){
        return <></>
    }
    const [store] = ctx;
    console.log("Notes", store.notes);
    return <main ref={viewportRef} onClick={onClick} className={viewport}>
        <section className={world} style={{transform:`translate(${cam.x}px, ${cam.y}px)`}}>
        {store.notes.map(n => <Note key={n.id} {...n} />)}
    </section>
    </main>
}