# Reactive `require`
This package provides a variant of Node's `require` module loader, that loads modules as reactive streams.

## Installation
```shell
$ npm i reactive-require
```

## Usage
```js
const require$ = require('reactive-require')(module);

const myModule$ = require$(require.resolve('./path/to/my-module'));

myModule$.subscribe(myModule => {
    myModule.doStuff();
});
```