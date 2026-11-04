import type { Props } from "./types";

export default function Note({id,contents,title,position,dimensions}:Props){
    const [left, top] = position;
    const [width, height] = dimensions;
    return <section id={id} className="notes note" data-pos={position} data-dimensions={dimensions} style={{position:"absolute",left,top,width,height,overflow:"hidden",background:"khaki"}}>
        {title && <header><h3>{title}</h3></header>}
        {contents && <section>{contents}</section>}
    </section>
}