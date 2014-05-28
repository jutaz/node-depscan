var detective = require('detective');
var path = require('path');
var fs = require('fs');

var deps = [];
var parsed = [];
var base = path.resolve('.');
var file;

var defaultModules = [
    'assert',
    'buffer',
    'cluster',
    'domain',
    'child_process',
    'crypto',
    'dns',
    'events',
    'fs',
    'http',
    'https',
    'net',
    'os',
    'path',
    'punycode',
    'querystring',
    'readline',
    'string_decoder',
    'tls',
    'tty',
    'dgram',
    'url',
    'util',
    'vm'
];

if (process.argv.length > 3) {
    base = path.dirname(path.resolve(base, process.argv[2]));
    file = process.argv.slice(2);
} else {
    if (process.argv[2]) {
        base = path.dirname(path.resolve(base, process.argv[2]));
        file = path.basename(process.argv[2]);
    }
}

if (!fs.existsSync(base + '/package.json')) {
    console.error('Project must have a package.json file. Aborting');
    process.exit(1);
}

var package = JSON.parse(fs.readFileSync(base + '/package.json'));
var packageDeps = Object.keys(package.dependencies);

go(base, file);

var processedDeps = [];


deps.forEach(function(dep) {
    if (processedDeps.indexOf(dep) === -1) {
        processedDeps.push(dep.toLowerCase());
    }
});

var dependencies = {
    unused: [],
    missing: []
};

packageDeps.forEach(function(dep) {
    if (processedDeps.indexOf(dep.toLowerCase()) === -1) {
        dependencies.unused.push(dep.toLowerCase());
    }
});

processedDeps.forEach(function(dep) {
    if (packageDeps.indexOf(dep.toLowerCase()) === -1 && defaultModules.indexOf(dep.toLowerCase()) === -1) {
        dependencies.missing.push(dep.toLowerCase());
    }
});

console.log(dependencies);


function get(items) {
    var files = {
        deps: [],
        files: []
    };
    items.forEach(function(dep) {
        if (dep.indexOf('/') === -1 && dep.indexOf('.js') === -1) {
            files.deps.push(dep.toLowerCase());
        } else if (dep.indexOf('.json') === -1) {
            files.files.push(dep);
        }
    });
    return files;
}

function check(files, dirname, sup) {
    files.forEach(function(file) {
        if (file.indexOf('.js') === -1) {
            file += '.js';
        }
        var files = [];
        var src;
        try {
            if (fs.existsSync(path.resolve(dirname, file))) {
                src = fs.readFileSync(path.resolve(dirname, file));
            } else {
                file = file.substr(0, file.length - 3) + "/index.js";
                src = fs.readFileSync(path.resolve(dirname, file));
            }
        } catch (e) {
            console.error(e, sup);
            process.exit(1);
        }
        parsed.push(path.resolve(dirname, file));
        var requires = detective(src);
        items = get(requires);
        deps = items.deps.concat(deps);
        items.files.forEach(function(file) {
            if (file.indexOf('.js') === -1) {
                file += '.js';
            }
            if (parsed.indexOf(path.resolve(dirname, file)) === -1) {
                files.push(file);
            }
        });
        if (files.length < 1) {
            return;
        }
        check(files, path.dirname(path.resolve(dirname, file)), path.resolve(dirname, file));
    });
}


function go(basename, file) {
    if(Array.isArray(file) && file.length > 1) {
        file.forEach(function(f) {
            check([f], basename);
        });
    } else {
        check([file], basename);
    }
}
