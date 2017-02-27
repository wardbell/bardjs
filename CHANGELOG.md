bardjs Change Log
===================
### 0.1.10
- no functional changes.
- sinon moved its release file so we are now using bower to get sinon directly. which is better, anyway

### 0.1.8
- no functional changes.
- reversed 0.1.7. Apparently [peerDependecies are a horrible idea](https://github.com/npm/npm/issues/5080) and have been deprecated. It also seems that bardjs is DIRECTLY dependent on sinon so it's back to being a dependency.

### 0.1.7
- no functional changes.
- made sinon a [peerDependency](http://blog.nodejs.org/2013/02/07/peer-dependencies/) in npm package.json rather than a dependency. This changes means sinon is installed side-by-side bardjs (where you need it) rather than within bardjs's
own node_modules folder.

### 0.1.6
- no functional changes
- updated package.json and bower.json descriptions to make clear that bardjs works w/ Jasmine and QUnit too
- removed package.json install script that invoked bower ... which might not be installed by those who load bard with npm

### 0.1.5
- no functional changes
- added explanatory comments to $state and $route router fakes

### 0.1.4
- updated dependency versioning

### 0.1.3
- documentation about dependence on sinon
- more robust handling of `this` when not using mocha; see [issue #5](https://github.com/wardbell/bardjs/issues/5).

### 0.1.2
- handle services that have prototype methods/attributes; see
[pr #4](https://github.com/wardbell/bardjs/pull/4).

### 0.1.1
- incorporate `Function.bind` polyfill (for testing in phantom.js)

### 0.1.0
- added brackets code snippets (draft)

### 0.0.9
- added comments to make clear that `bard.appModule` should NOT be used if you'll be testing router services because it fakes their providers and that can't be reversed. Use regular `angular.mock.module` instead as directed.

### 0.0.8
- bard.inject should work for QUnit too (removed mocha/jasmine limitation).
- Need QUnit tests.### 0.0.6
- heavily revamped bard.inject. added diagnostic bard.debug

### 0.0.7
- bard.inject no longer uses evil Function; added addGlobals, mochaRunnerListener

### Coming Soon
