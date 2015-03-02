bardjs Change Log
===================
### 0.0.6 
- heavily revamped bard.inject. added diagnostic bard.debug
### 0.0.7 
- bard.inject no longer uses evil Function; added addGlobals, mochaRunnerListener
### 0.0.8 
- bard.inject should work for QUnit too (removed mocha/jasmine limitation). 
- Need QUnit tests.
### 0.0.9 
- added comments to make clear that `bard.appModule` should NOT be used if you'll be testing router services because it fakes their providers and that can't be reversed. Use regular `angular.mock.module` instead as directed.