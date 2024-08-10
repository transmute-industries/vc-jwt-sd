// https://stackoverflow.com/questions/17575790/environment-detection-node-js-or-browser

var isBrowser = new Function("try {return this===window;}catch(e){return false;}");

// // tests if global scope is bound to window
// if(isBrowser()) console.log("running under browser");

var isNode = new Function("try {return this===global;}catch(e){return false;}");

// // tests if global scope is bound to "global"
// if(isNode()) console.log("running under node.js");

const runtime = { isBrowser, isNode }

export default runtime