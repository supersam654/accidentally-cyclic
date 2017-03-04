# Sample Project

This folder contains several "sample" Node.js projects for testing AC.

The projects are:

* `absolute`: Project with absolute path dependencies.
* `basic`: Basic project with no circular dependencies.
* `cyclic`: Project with a cirular dependency.
* `exit`: Project that called `process.exit`.
* `fs_read`: Project that reads a file from a relative path with `fs.readFile`.
* `nested`: Project with a nested require (ensure relative paths work).
* `third-party`: Project that imports third-party modules (and core modules).

All of the projects should be tested by calling `cyclic.require('./sample/<project>/a')`.
