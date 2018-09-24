# dr-server

[![i:npm]][l:npm]
[![i:size]][l:size]
[![i:lint]][l:lint]
[![i:npm-dev]][l:npm]

A collection of strange functions, for server

[i:npm]: https://img.shields.io/npm/v/dr-server.svg?colorB=blue
[i:npm-dev]: https://img.shields.io/npm/v/dr-server/dev.svg
[l:npm]: https://www.npmjs.com/package/dr-server
[i:size]: https://packagephobia.now.sh/badge?p=dr-server
[l:size]: https://packagephobia.now.sh/result?p=dr-server
[i:lint]: https://img.shields.io/badge/code_style-standard_ES6+-yellow.svg
[l:lint]: https://standardjs.com

[//]: # (NON_PACKAGE_CONTENT)

- 📁 [source/](source/)
  - main source code, in output package will be:
    - `dr-server/library`: for direct use, use `require() / exports.*=`
    - `dr-server/module`: for re-pack, keep `import / export` and readability
- 📁 [source-bin/](source-bin/)
  - bin source code, in output package will be `dr-server/bin`
- 📁 [source-sample/](source-sample/)
  - sample server source code, in output package will be `dr-server/sample`
- 📁 [example/](example/)
  - some example (unsorted tests)
- 📄 [SPEC.md](SPEC.md)
  - list of all directly accessible codes, sort of an API lockfile
