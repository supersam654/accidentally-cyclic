# Sample Project

This folder contains several "sample" Node.js projects for testing AC.

The projects are:

* `basic`: Basic project with no circular dependencies.
* `cyclic`: Project with a cirular dependency.
* `nested`: Project with a nested require (ensure relative paths work).
* `third-party`: Project that imports third-party modules (and core modules).
* `fs_read`: Project that reads a file from a relative path with `fs.readFile`.
* `absolute`: Project with absolute path dependencies.

All of the projects should be tested by calling `cyclic.require('./sample/<project>/a')`.
