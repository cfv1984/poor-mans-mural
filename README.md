# Poor man's Mural.ly

I made a toy version of the parts I use of murally. Several design and architecture decisions inform it, 
the first being it is relatively close to `react-flow`, with which I have some past experience. 

## Running the project

* `npm i` to install all dependencies
* `npm run start` to run the development environment, or
* `npm run develop` to run the built artifact -hereinafter 'production'-

## Usage

Once the project is up, click on the canvas to add a note. Notes can be resized from the bottom right handle.
Clicking on a note will bring it to the front of the stack, and you can click on note titles and contents to 
change what they say.

Color selection is random, if you don't like the color you got you can throw the note in the big trash can.

Clicking "Save" will make it such that all your notes are there by the next reload.

## Design decisions

The entire project revolves around a `World` object which allows panning and inserting things in itself, 
as well as some kind of store. Being strapped for resources, I simply used an `useReducer` as said store
due to it looking approximately close enough to `redux-toolkit`, with which I have worked in the past. 

Could have gone for a more atomic state manager, however at this point the thing is small enough that 
changing this layer wouldn't pose a problem. 

There is an `'api'` in place, but it works with localStorage only. This is async and includes some fake
song and dance 'loading' for the simple reason that a potential key-value store down the line could use 
a similar external interface and removing the facade is also small enough a change.

Finally, the project is _plastered_ with tests. The point of them is to codify behavior strictly, allowing
any changes that don't do *exactly* the same work as is specified to send alarms blaring everywhere before
any defined behavior stops working.

## The stack

I am using `vite`, `vitest`, `oxlint` and `oxfmt`, as this is pretty much state of the art by today's standards.

Practically no other dependency except for React and Lucide are mandatory, and I'm only using Lucide for a single
icon at the moment so even that is likely to go away in short notice. 
