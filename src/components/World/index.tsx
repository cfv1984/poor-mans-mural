import { useContext } from "react";
import type { Props } from "./types";
import { Context } from "../../store";

export default function World(){
    const ctx = useContext(Context);
    if(!ctx){
        return <></>
    }
    const [store, dispatch] = ctx;
    console.log("Notes", store.notes);

    return <section>
        World
    </section>
}