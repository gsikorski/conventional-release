__Automatically release your npm module__

This command line script allows you to automatically release your npm module from the git repository. It assumes you follow these rules:
* You have initial tag on `master` branch matching your initial version of the version in `package.json`
* You use [Angular commit message](https://github.com/angular/angular.js/blob/master/CONTRIBUTING.md#-git-commit-guidelines) convention
* You only release on `master` branch

To make a release you need to commit (or merge from other branches) something on top of your initial tag. You _SHOULD NOT_ modify your version in `package.json` manually. Then you can simply do clean clone from your origin and on `master` branch call:
```bash
$ conventional-release
```

The tool will automatically calculate new version number of your module (using [mversion](https://github.com/mikaelbr/mversion) and [conventional-recommended-bump](https://github.com/conventional-changelog/conventional-recommended-bump), generate new `CHANGELOG.md` file (using [conventional-changelog](https://github.com/conventional-changelog/conventional-changelog), update version in your `package.json` (and `bower.json`, if you have one) file, commit all changes to the repository and tag the new commit. At the end the tool will prompt you wether or not you want to push your changes to remote `origin` and automatically publish your new version to your default NPM registry.
