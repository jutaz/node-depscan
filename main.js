var detective = require('detective');
var path = require('path');
var fs = require('fs');

function depscan(files, base) {
    this.deps = [];
    this.parsed = [];
    this.processedDeps = [];
    if (base) {
        this.base = path.resolve('.', base);
    } else {
        this.base = path.resolve('.');
    }
    if (!fs.existsSync(this.base + '/package.json')) {
        throw new Error('Project must have a package.json file. Aborting');
    }
    this.package = JSON.parse(fs.readFileSync(this.base + '/package.json'));
    this.packageDeps = Object.keys(this.package.dependencies);
    if (!file) {
        this.file = path.resolve(this.base, this.package.main || 'index.js');
    } else {
        this.file = files;
    }
    this.go();
}

module.exports = depscan;

depscan.prototype.defaultModules = [
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

depscan.prototype.go = function() {
    var self = this;
    if (Array.isArray(this.file) && this.file.length > 1) {
        this.file.forEach(function(f) {
            self.check([f], this.base);
        });
    } else {
        this.check([this.file], this.base);
    }
};

depscan.prototype.get = function(items) {
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
};

depscan.prototype.check = function(files, dirname, sup) {
    var self = this;
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
            throw new Error(e, sup);
        }
        self.parsed.push(path.resolve(dirname, file));
        var requires = detective(src);
        items = self.get(requires);
        self.deps = items.deps.concat(self.deps);
        items.files.forEach(function(file) {
            if (file.indexOf('.js') === -1) {
                file += '.js';
            }
            if (self.parsed.indexOf(path.resolve(dirname, file)) === -1) {
                files.push(file);
            }
        });
        if (files.length < 1) {
            return;
        }
        self.check(files, path.dirname(path.resolve(dirname, file)), path.resolve(dirname, file));
    });
};

depscan.prototype.answer = function() {
    var self = this;
    this.deps.forEach(function(dep) {
        if (self.processedDeps.indexOf(dep) === -1) {
            self.processedDeps.push(dep.toLowerCase());
        }
    });

    var dependencies = {
        unused: [],
        missing: []
    };

    this.packageDeps.forEach(function(dep) {
        if (self.processedDeps.indexOf(dep.toLowerCase()) === -1) {
            dependencies.unused.push(dep.toLowerCase());
        }
    });

    this.processedDeps.forEach(function(dep) {
        if (self.packageDeps.indexOf(dep.toLowerCase()) === -1 && self.defaultModules.indexOf(dep.toLowerCase()) === -1) {
            dependencies.missing.push(dep.toLowerCase());
        }
    });

    var answer = '';

    if (dependencies.unused.length === 0 && dependencies.missing.length === 0) {
        return 'Hooray. All dependencies are in place!';
    }

    if (dependencies.unused.length > 0) {
        answer += 'These dependencies are not used:\n\n';
        dependencies.unused.forEach(function(dep) {
            answer += dep + '\n';
        });
    } else {
        answer += 'All deps are used.';
    }

    if (dependencies.missing.length > 0) {
        answer += '\nThese dependencies are missing in package.json:\n\n';
        dependencies.missing.forEach(function(dep) {
            answer += dep + '\n';
        });
    } else {
        answer += 'No missing dependencies.';
    }

    return answer;
};
