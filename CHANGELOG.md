bardjs Change Log
===================
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
