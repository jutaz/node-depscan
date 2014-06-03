#!/usr/bin/env node
var depscan = require('../main');
var path = require('path');
var base = path.resolve('.');

if (process.argv.length > 3) {
    base = path.dirname(path.resolve(base, process.argv[2]));
    file = process.argv.slice(2);
} else if (process.argv[2]) {
    base = path.dirname(path.resolve(base, process.argv[2]));
    file = path.basename(process.argv[2]);
} else {
    file = false;
}

scan = new depscan(file);
process.stdout.write(scan.answer());
