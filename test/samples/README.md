# Sample Project

This folder contains several "sample" Node.js projects for testing Dagger.

The projects are:

* `basic`: Basic project with no circular dependencies.
* `cyclic`: Project with a cirular dependency.
* `nested`: Project with a nested require (ensure relative paths work).

All of the projects should be tested by calling `dagger.spy('./sample/<project>/a')`.
