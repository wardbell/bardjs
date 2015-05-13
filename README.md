# bardjs Test Helpers
[![NPM version](https://img.shields.io/npm/v/bardjs.svg?style=flat)](https://www.npmjs.com/package/bardjs)

**bardjs** is a small library of functions to help you write **Angular v.1.x application tests** ... whether you write them in [mocha](http://mochajs.org/ "mochajs") or [jasmine](http://jasmine.github.io/ "jasmine") or [QUnit](http://qunitjs.com/ "QUnit").

What kind of help? Help with **routine tasks** that would otherwise clutter your tests and obscure their intent. 

The poster child in this respect is the [`inject` method](#inject).  It can easily remove 10 or more lines of boilerplate so you spend less time with setup and more time with your tests. Check it out.

The [bardjs repo](https://github.com/wardbell/bardjs/snippets/ "bard code snippets") also contains code snippets to make writing tests a little easier. See [separate instructions](#snippets) for those below.

# Installation

Most folks bardjs install it with [bower](http://bower.io/search/?q=bardjs "bard on bower") or [npm](https://www.npmjs.com/package/bardjs):

`bower install bardjs`

`npm install bardjs`

You can also clone [bardjs from github](https://github.com/wardbell/bardjs "bard on github") and extract *bard.js*itself.

>bard depends on [sinon.js](http://sinonjs.org/) so make sure you have that library available; bower and npm bring that down for you.

Almost all of bard is in the *bard.js* file within the *dist* folder.

If you're running tests in a browser, add the appropriate script tag *below* the script for your test framework library:

    <!-- when installed with bower -->
    <script src="/bower_components/bardjs/dist/bard.js"></script>

    <!-- when installed with npm -->
    <script src="/npm_modules/bardjs/dist/bard.js"></script>

You'll need to add *sinon.js* as well

    <!-- when installed with bower -->
    <script src="/bower_components/sinon/index.js"></script>

    <!-- when installed with npm -->
    <script src="/npm_modules/sinon/lib/sinon.js"></script>

## karma considerations

If you're running with [karma](http://karma-runner.github.io/0.12/index.html "karma"), reference *bard.js* in *karma.config.js* among the `files` to be loaded. See the [karma "Config" documentation](http://karma-runner.github.io/0.12/config/configuration-file.html "karma config") for details.

Be sure to include *sinon* among the karma frameworks as in this example extract:

    frameworks: ['mocha', 'chai', 'sinon', 'chai-sinon'],

In the *dist* folder you'll also find optional plug-in extensions such as the *bard-ngRouteTester.js* which adds the `bard.ngRouteTester` helper to manage tests of the [original Angular router](https://docs.angularjs.org/api/ngRoute/service/$route "Angular $route"). 

# bard methods

After loading `bard.js`, you'll find the global variable `bard` at your finger tips as you write your tests. 

The bard methods are listed right at the top of the *bard.js* file. 

We won't describe every method here. Each method is prefaced in the code with it own documentation in comments describing both purpose and usage.

But we will call out the methods that have proven most notable and useful:

* [appModule](#appModule) - identify the application module to test and also disable certain routine services.
* [asyncModule](#asyncModule) - enable async integration testing by restoring `$http` and `$q` while identifying the application module to test.
* [inject](#inject) - inject angular and application components and store them by name on the global `window` object.
* [fake services](#fakeServices) - register disabled services that you can spy on.
* [log](#log) - writes messages to `console` when bard debugging is turned on.
* [mockService](#mockService) - create a mock for any service with spies and return values for every service member.


<a name="appModule"></a>
## appModule

**Identify the application module to test and also disable certain routine services.**

You typically identify the application module that defines the component you want to test and its dependent services at the top of a test suite. You do this with the [`angular.mock.module` function](https://docs.angularjs.org/api/ngMock/function/angular.mock.module "mock module").

We found that we routinely disable certain services at the same time. 

For example, we don't want to see [**toastr**](https://github.com/CodeSeven/toastr "toastr") messages in our browser while our tests are running. We may need to assert that `toastr` was called in  a particular way but we'd prefer to hide the toasts themselves.

We also discovered that routing services can fire when the app module loads and trigger failures that have nothing to do with the subject of our tests. We just want routing to go away.

The bard `appModule` method is a quick way to both identify the module to test and disable the *toastr* and routing services. This one line ...

`beforeEach(bard.appModule('myModule'));`

does the work of these seven ...

    beforeEach(angular.mock.module(
		'myModule',
		bard.fakeToastr,
		bard.fakeRouteHelperProvider,
		bard.fakeRouteProvider,
		bard.fakeStateProvider)
    );

>The bard library offers [several methods](#fakeServices) (all beginning with the word "fake") that each disable a particular service. Don't worry if you haven't included all or any of these services in your app. Registering them will be harmless. Not using *toastr*? Not using the *UIRouter*? No problem.

Like the [`angular.mock.module` function](https://docs.angularjs.org/api/ngMock/function/angular.mock.module "mock module"), you can add configuration arguments to the call to decorate or mock other services:

`beforeEach(bard.appModule('myModule', someDecorator, someMock));`

### don't use *appModule* when testing routes

You can't use `bard.appModule` and test the router. For example, if you want to know that a controller would route the user to a particular view, you can't use `bard.appModule`. There is no way to "unfake" the router service once it's been faked.

Instead, simply fall back to `angular.mock.module`, adding specific fakes as desired:

`beforeEach(module('myModule', bard.fakeToastr));`

<a name="asyncModule"></a>
## asyncModule

**Enable async integration testing by restoring `$httpBackend` and `$q` while identifying the application module to test.**

The [`angular.mock.module` function](https://docs.angularjs.org/api/ngMock/function/angular.mock.module "mock module") replaces  `$httpBackend` and `$q` with mocked versions.

The mocked `$httpBackend` prevents `$http` from issuing the AJAX calls necessary to communicate with a remote service. The mocked `$q` requires a manual digest cycle to "flush" the promise queue and prevents event-driven promise fulfillment.

These mocks are great for testing *asynchronous* behaviors with fast *synchronous* tests. But you can't write integration tests that require interactions with a server while these mocks are in play. 

For example, you can't test that a `dataservice` works as expected when it sends requests to the remote data server. You can simulate how you *think* that server will respond. But what if the real server behaves differently than your simulation? How can you confirm that your `dataservice` continues working even after changes to the backend that you don't even know about?

You'll want at least a few cross-process, ***truly asynchronous integration tests*** for peace of mind. You can't have them while `$httpBackend` and `$q` are mocked.

The bard `asyncModule` method restores the original `$httpBackend` and `$q` at the same time that you identify the application module under test. Here's how you might call it:

`beforeEach(bard.asyncModule('app'));`

This is the equivalent of ...

    beforeEach(module('app', bard.$httpBackendReal, bard.$qReal, bard.fakeToastr));

>The bard library's `$httpBackendReal` and `$qReal` restore the original angular `$httpBackend` and `$q` implementations; they may be invoked independently.
>
>We're also faking *toastr* for the same reason we faked it in [`appModule`](#appModule).

Now you write asynchronous tests that look a lot like production code. Here's a mocha example:

    it('should get at least 6 Avengers', function (done) {
        dataservice
            .getAvengers()
            .then(function(data) {
                expect(data).to.have.length.above(6);
            })
            .then(done, done);
    });

You should see network traffic for the request and response to the  "Avengers" query. The promise succeeds (or fails) in real time, without stimulus from `$rootScope.$apply()`. The test framework pauses and waits until the server responds (or timesout) and the final `then` invokes the test harness' `done` function. Only then will it proceed to the next test in the suite.

Like the [`angular.mock.module` function](https://docs.angularjs.org/api/ngMock/function/angular.mock.module "mock module"), you can add configuration arguments to decorate or mock other services:

`beforeEach(bard.asyncModule('app', someDecorator, someMock));`



<a name="inject"></a>
## inject

**Inject angular and application components and store them by name on the global `window` object.**

The `bard.inject` method tells the Angular [mock dependency injector](https://docs.angularjs.org/api/ngMock/function/angular.mock.inject "mock inject") to inject components for the currently active test.

Here's how you might use `inject` within a `beforeEach` to get five dependent services while testing an Angular controller:

    bard.inject(this, '$controller', '$log', '$q', '$rootScope', 'dataservice');

Now you can refer to these services by name in subsequent test functions as in these examples:

    var controller = $controller('Avengers');
    sinon.stub(dataservice, 'getAvengers').returns($q.when(avengers));
    $rootScope.$apply();
    expect(dataservice.getAvengers).to.have.been.calledOnce;
    expect($log.error.logs[0]).to.match(/doomed/);

Compare the simplicity of 

    bard.inject(this, '$controller', '$log', '$q', '$rootScope', 'dataservice');

to the typical approach without bard:

    // declare local variables for use within subsequent test functions
    var $controller, $log, $q, $rootScope, dataservice;

    // inject the services using Angular "underscore wrapping"
    beforeEach(inject(function(_$controller_, _$log_, _$q_, _$rootScope_, _dataservice_) {
        // wire local vars to the injected services
        $controller = _$controller_;
        $log = _$log_;
        $q = _$q_;
        $rootScope = _$rootScope_;
        dataservice = _dataservice_;
    }));

Which would you rather write? As importantly, which would you rather *read* ... on your way to the important business of the tests themselves?

### "but globals are bad"

It's a terrible idea to toss variables into the global namespace *in production*. 

It's tactically smart, productive, and convenient to do so *in your tests*. Disagree? Do you write your test code with `beforeEach`, `it`, `expect`, and `module`? Or would you rather write with the annoyingly verbose equivalents: `mocha.beforeEach`, `jasmine.it`, `chai.expect` and `angular.mock.module`? 

the main risk of globals is ***cross-test pollution***, the risk that the values you set in one test will carry over to a later test. Fortunately, bard `inject` deletes these variables from the global namespace at the end of each test. Each new test gets a clean slate.

### what is `this`?

Notice the *`this`* argument in 

<code>bard.inject(</code><strong><code>this</code></strong><code>, '$controller', '$log', '$q', '$rootScope', 'dataservice');</code>

Test frameworks set `this` to the test context (the spec context) object when the test runs. If we pass the context to `inject`, it can tell the test framework to ignore the new injected variables that it adds to the global namespace (the `window` object).

Do you care? You will care if you fear that your application code is leaking variables to the global namespace. You might then configure the test framework to detect such leaks.

For example, mocha has a "checkLeaks" configuration option that you can turn on like so:

    <script>
        mocha.checkLeaks();
        var runner = mocha.run();
    </script>

Thus enabled, mocha fails any test that adds variables to the global namespace between the time the test starts and when it finishes.

That's a problem for `bard.inject` which ***always*** adds new variables to globals. We don't want the tests to fail because of `bard.inject`.

Fortunately, `inject` can tell mocha to ignore the injected variables if we give it the spec context via `this`.

>Internally `inject` calls another bard function, `addGlobals`. You should call this too if you deliberately extend globals yourself.

**You don't have to pass `this` to `inject` if you aren't checking for global leaks.** You are free to omit it as in:

    bard.inject('$controller', '$log', '$q', '$rootScope', 'dataservice');

Of course you'll regret the omission later should you decide to turn on mocha's global leak checking. We think it's prudent to include `this` in your call.

### *inject* a function

The [`angular.mock.inject`](https://docs.angularjs.org/api/ngMock/function/angular.mock.inject "mock inject") function can both retrieve injectable "services" and do things with them in the function body.

The bard `inject` method accepts the same kind of function which may be useful if you want to inject and do work at the same time. For example:

    beforeEach(bard.inject(function($controller, $log, $q, $rootScope, dataservice) { 
        ... do work ..
    }));

After the function completes, bard `inject` promotes the injected services to global variables.



<a name="fakeServices"></a>
## fake services

**Register disabled services that you can spy on.**

Our applications often depend on certain specific services that we like to disable during most of our tests.

Bard offers fake versions of these services. Their methods names begin with the word "fake" and include:

    fakeLogger
    fakeRouteHelperProvider
    fakeRouteProvider
    fakeStateProvider
    fakeToastr

Look for details in *bard.js*. They all have two features in common:

1. they do nothing
1. their function members are stubbed with [sinon spies](http://sinonjs.org/docs/#spies "sinon spies")

The spies allow a test to assert that one of the service methods was called in the expected manner.

`expect(toastr.error).to.have.been.calledWith('uh oh!');`

You typically register these faked services by including them among the arguments to the [`angular.mock.module` function](https://docs.angularjs.org/api/ngMock/function/angular.mock.module "mock module") or one of its bard substitutes:

    beforeEach(module('myMod', bard.fakeLogger));
    beforeEach(appModule('myMod', bard.fakeLogger));
    beforeEach(asyncModule('myMod', bard.fakeLogger));



<a name="log"></a>
## log

**The bard `log` method writes messages to `console` when bard debugging is turned on.**

Our tests generally don't write to the console because the console is usually hidden when running tests in the browser or is crowded with other messages when running in karma.

But it can be helpful to sprinkle a little console logging in our code when trying to understand and debug complex tests.

    it('should be good', function() {
        ... tricky stuff that might not work ...
        bard.log('we got the goods');    // conditional bard logging
        ... more tricky stuff ...
        expect(good).to.match(/good/);
    });

We may wish to leave such diagnostic logging behind ... inert for the most part but ready to go again in a future visit. We can turn conditional logging on with `bard.debugging(true)` and off again with `bard.debugging(false)`. When debugging is off, calls to `bard.log` do nothing.

Some of bard's own methods call `bard.log`.



<a name="mockService"></a>
## mockService

**Quickly create a mock for any service with spies and return values for every service member.**

It can be painful to mock a dependency with a large API. Suppose, for example, that our app has a `dataservice` with 30 members. We want to test a particular controller that depends on this service. 

That controller might call *any* of the service methods, either during initialization or when subjected to test conditions. For this round of tests, we only care when it calls the `dataservice.getAvengers` method.

No matter what the controller does, the `dataservice` must not dispatch requests to a server. It's obviously terrible if the controller calls a missing method and the mock blows up. We'll have to mock every `dataservice` member ... and remember to update it as the `dataservice` evolves.

Such a mock `dataservice` is tedious to write by hand, especially when we don't care what most of the members do. The bard `mockService` makes writing this fake a lot easier. The entire setup could be as simple as:

    beforeEach(function() {

        bard.appModule('app.avengers');
        bard.inject(this, '$controller', '$q', '$rootScope', 'dataservice');


        bard.mockService(dataservice, {
            getAvengers: $q.when(avengers),
            _default:    $q.when([])
        });


        controller = $controller('Avengers');
        $rootScope.$apply();
    });

The details of `mockService` configuration are described in *bard.js*. You'll find  usage examples in the test coverage (look for *~/tests/bard.mockService.spec.js*). 

We trust you can see the core ideas in this example:

* you give `mockService` an instance of the real `dataservice` to act as a template.
* the `mockService` replaces every `dataservice` member with a fake implementation.
* all methods are stubbed with [sinon spies](http://sinonjs.org/docs/#spies "sinon spies").
* you can supply return values (such as fulfilled promises) for *specific* methods.
* you determine default return values for the remaining *unspecified* methods.

In this case, we arranged for the `getAvengers` method to return a resolved promise with fake "avenger" objects. The other 29 methods return a resolved promise with an empty array.

That's easier to write and read than a mock `dataservice` with thirty hand-coded stub methods.

And here are two mocha/chai tests that could follow that setup:

    it('controller activation gets avengers', function() {
        controller.activate(); // calls `dataservice.getAvengers`
        $rootScope.$apply();   // flush pending promises
            
        expect(controller.avengers).to.have.length(avengers.length); // same number as mocked

        expect(dataservice.getAvengers).to.have.been.calledOnce; // it's a spy
    });

    // Call one of the default mock methods which should return 
    // a promise resolving to an empty array
    // Note that the controller would not have called this on its own
    it('can call fake `dataservice.getNews`', function() {

        dataservice.getNews().then(function(news) {
            expect(news).to.have.length(0);
        });

        $rootScope.$apply(); // flush pending promises

        // verify that `getNews` is actually a spy
        expect(dataservice.getNews).to.have.been.calledOnce;
    });

<a name="snippets"></a>
# Brackets code snippets

Code snippets make test authoring just a little easier. Here
are instructions for loading our snippets into the [Brackets editor](http://brackets.io/ "Brackets editor").

- Open the Brackets Extension manager ( File > Extension manager )
- Install ['Brackets Snippets (by edc)'](https://github.com/chuyik/brackets-snippets)
- Click the light bulb in Brackets' right gutter
- Click `Settings` and then `Import`
- Click `Choose File`
- Locate and download [*~/snippets/brackets-testing-snippets.yaml*](https://github.com/wardbell/bardjs/blob/master/snippets/brackets-testing-snippets.yaml "bard brackets snippets on github") from github.
- Choose either to `skip` or to `override`
- Click `Start Import`

Now try them in a JavaScript test file

* mocha/jasmine

    * `bdescribe` - mocha/jasmine `describe`
    * `bit`  - `it` test (synchronous)
    * `bait` - async `it` test
    * `bbeforeEach` - mocha/jasmine `beforeEach`
    * `bafterEach` - mocha/jasmine `afterEach`
    * `bdone` - tail of a mocha test promise chain: `.then(done, done);`


* chai expectations

    * `bexpect` - expect(...).to
    * `bcalled` - expect(...).to.have.been.called
    * `bequal` - expect(...).to.equal(...)
    * `blen` - expect(...).to.have.length(...)
    * `bmatch` - expect(...).to.match(/.../i)
    * `bprop` - expect(...).to.have.been.property(..., ...)
    * `bthrow` - expect function to throw


* bard.js

    * `binject` - bard.inject
    * `bcinject` - bard.inject for a controller
    * `bmodule` - bard.appModule
    * `basyncmod` - bard.asyncModule
    * `bverify` - bard.verifyNoOutstandingHttpRequests()


* angular.js

    * `bapply` - $rootScope.$apply();
    * `bwhen`  - $httpBackend.when('get', {url}).respond({status}, {data});
    * `bflush` - $httpBackend.flush();

* miscellaneous

    * `bfn`    - generates a function stub
