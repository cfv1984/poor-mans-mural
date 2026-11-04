import type { KeyboardEvent } from "react";

export function blurOnKeys
    (...keys: string[]) {
    return (e: KeyboardEvent<HTMLElement>) => {
        if (keys.includes(e.key)) {
            e.currentTarget.blur();
        }
    };
}

export function overlapsTrash(rect: DOMRect) {
    const trash = document.getElementById("trash")?.getBoundingClientRect();
    return (
        !!trash &&
        rect.left < trash.right &&
        rect.right > trash.left &&
        rect.top < trash.bottom &&
        rect.bottom > trash.top
    );
};