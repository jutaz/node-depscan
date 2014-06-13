Depscan
============

This finds unused dependencies in your node project.

# Installation

`npm install -g depscan`

# Usage

* go to target dir and run `depscan` or do `depscan ../source.js`
* You can also scan multiple entry points by doing `depscan ../source1.js ../source2.js`

# Output

Output looks like this: 

```
These dependencies are not used:

imap
mailparser
mail-listener2
mailstrip

These dependencies are missing in package.json:

msgpack
policyfile

```

# Programmatic Usage

```javascript
var depscan = require('depscan');
var scan = depscan('./index.js', __dirname);

var report = scan.report();
console.log(report);
```
`report` is an object like this:
```javascript
{
  unused: ['foo'],
  missing: ['bar','baz']
}
```