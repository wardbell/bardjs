/**
 * bardjs - Mocha/chai spec helpers for testing angular apps
 * @authors John Papa,Ward Bell
 * @version v0.0.9
 * @link https://github.com/wardbell/bardjs
 * @license MIT
 */
/*jshint -W079, -W117 */
(function() {

    var bard = {
        $httpBackend: $httpBackendReal,
        $q: $qReal,
        addGlobals: addGlobals,
        appModule: appModule,
        assertFail: assertFail,
        asyncModule: asyncModule,
        debugging: bardDebugging,
        fakeLogger: fakeLogger,
        fakeRouteHelperProvider: fakeRouteHelperProvider,
        fakeRouteProvider: fakeRouteProvider,
        fakeStateProvider: fakeStateProvider,
        fakeToastr: fakeToastr,
        inject: bardInject,
        log: bardLog,
        mochaRunnerListener: mochaRunnerListener,
        mockService: mockService,
        replaceAccentChars: replaceAccentChars,
        verifyNoOutstandingHttpRequests: verifyNoOutstandingHttpRequests,
        wrapWithDone: wrapWithDone
    };

    var global = (function() { return this; })();

    // mocha/jasmine/QUnit fns
    var afterEach = global.afterEach || global.teardown;
    var beforeEach = global.beforeEach || global.setup;

    var clearInject = [];
    var currentSpec = null;
    var debugging = false;
    var logCounter = 0;
    var okGlobals = [];

    beforeEach(function bardTopBeforeEach() {
        currentSpec = this;
    });

    afterEach(function bardTopAfterEach() {
        currentSpec = null;
        bard.log('clearing injected globals: ' + clearInject);
        angular.forEach(clearInject, function(name) {
            delete global[name];
        });
        clearInject.length = 0;
        okGlobals.length = 0;
    });

    global.bard = angular.extend(global.bard || {}, bard);

    ////////////////////////

    /*jshint -W101 */
    /**
     *  Replaces the ngMock'ed $httpBackend with the real one from ng thus
     *  restoring the ability to issue AJAX calls to the backend with $http.
     *
     *  Note that $q remains ngMocked so you must flush $http calls ($rootScope.$digest).
     *  Use $rootScope.$apply() for this purpose.
     *
     *  Could restore $q with $qReal in which case don't need to flush.
     *
     *  Inspired by this StackOverflow answer:
     *    http://stackoverflow.com/questions/20864764/e2e-mock-httpbackend-doesnt-actually-passthrough-for-me/26992327?iemail=1&noredirect=1#26992327
     *
     *  Usage:
     *
     *    var myService;
     *
     *    beforeEach(module(bard.$httpBackend, 'app');
     *
     *    beforeEach(inject(function(_myService_) {
     *        myService = _myService_;
     *    }));
     *
     *    it('should return valid data', function(done) {
     *        myService.remoteCall()
     *            .then(function(data) {
     *                expect(data).toBeDefined();
     *            })
     *            .then(done, done);
     *
     *        // because not using $qReal, must flush the $http and $q queues
     *        $rootScope.$apply;
     *    });
     */
    /*jshint +W101 */
    function $httpBackendReal($provide) {
        $provide.provider('$httpBackend', function() {
            /*jshint validthis:true */
            this.$get = function() {
                return angular.injector(['ng']).get('$httpBackend');
            };
        });
    }

    /**
     *  Replaces the ngMock'ed $q with the real one from ng thus
     *  obviating the need to flush $http and $q queues
     *  at the expense of ability to control $q timing.
     *
     *  Usage:
     *
     *    var myService;
     *
     *    // Consider: beforeEach(bard.asyncModule('app'));
     *
     *    beforeEach(module(bard.$q, bard.$httpBackend, 'app');
     *
     *    beforeEach(inject(function(_myService_) {
     *        myService = _myService_;
     *    }));
     *
     *    it('should return valid data', function(done) {
     *        myService.remoteCall()
     *            .then(function(data) {
     *                expect(data).toBeDefined();
     *            })
     *            .then(done, done);
     *
     *        // not need to flush
     *    });
     */
    function $qReal($provide) {
        $provide.provider('$q', function() {
            /*jshint validthis:true */
            this.$get = function() {
                return angular.injector(['ng']).get('$q');
            };
        });
    }
    /**
     * Add names of globals to list of OK globals for this spec
     * usage:
     *    addGlobals(this, 'foo');        // where `this` is the spec context
     *    addGlobals(this, 'foo', bar);
     *    addGlobals.bind(this)('foo', 'bar');
     *    addGlobals(ctx, ['foo', 'bar']) // where ctx is the spec context
     */
    function addGlobals() {
        var args = Array.prototype.slice.call(arguments);
        var ctx = getCtxFromArgs.bind(this)(args);
        var globs = angular.isArray(args[0]) ? args[0] : args;
        angular.forEach(globs, function(g) {
            if (okGlobals.indexOf(g) === -1) {
                okGlobals.push(g);
            }
        });
        // if a mocha test, add the ok globals to it
        ctx && ctx.test.globals && ctx.test.globals(okGlobals);
    }

    /**
     * Prepare ngMocked application feature module
     * along with faked toastr, routehelper,
     * and faked router services.
     * Especially useful for controller testing
     * Use it as you would the ngMocks#module method
     *
     * DO NOT USE IF YOU NEED THE REAL ROUTER SERVICES!
     * Fall back to `angular.mock.module(...)` or just `module(...)`
     *
     * Useage:
     *     beforeEach(bard.appModule('app.avengers'));
     *
     *     Equivalent to:
     *       beforeEach(angular.mock.module(
     *          'app.avengers',
     *          bard.fakeToastr,
     *          bard.fakeRouteHelperProvider,
     *          bard.fakeRouteProvider,
     *          bard.fakeStateProvider)
     *       );
     */
    function appModule() {
        var args = Array.prototype.slice.call(arguments, 0);
        args = args.concat(fakeRouteHelperProvider, fakeRouteProvider,
                           fakeStateProvider, fakeToastr);
        return angular.mock.module.apply(angular.mock, args);
    }

    /**
     * Assert a failure in mocha, without condition
     *
     *  Useage:
     *     assertFail('you are hosed')
     *
     *     Responds:
     *       AssertionError: you are hosed
     *       at Object.assertFail (..../test/lib/bard.js:153:15)
     *       at Context.<anonymous> (.../....spec.js:329:15)
     *
     *  OR JUST THROW the chai.AssertionError  and treat this
     *  as a reminder of how to do it.
     */
    function assertFail(message) {
        throw new chai.AssertionError(message);
    }

    /**
     * Prepare ngMocked module definition that makes real $http and $q calls
     * Also adds fakeLogger to the end of the definition
     * Use it as you would the ngMocks#module method
     *
     *  Useage:
     *     beforeEach(bard.asyncModule('app'));
     *
     *     Equivalent to:
     *       beforeEach(module('app', bard.$httpBackend, bard.$q, bard.fakeToastr));
     */
    function asyncModule() {
        var args = Array.prototype.slice.call(arguments, 0);
        args = args.concat($httpBackendReal, $qReal, fakeToastr);
        // build and return the ngMocked test module
        return angular.mock.module.apply(angular.mock, args);
    }

    /**
     * get/set bard debugging flag
     */
    function bardDebugging(x) {
        if (typeof x !== 'undefined') { debugging = !!x; }
        return debugging;
    }

    /**
     * Write to console if bard debugging flag is on
     */
    function bardLog(msg) {
        if (debugging) {
            console.log('---bard (' + (logCounter += 1) + ') ' + msg);
        }
    }

    /**
     * inject selected services into the windows object during test
     * then remove them when test ends with an `afterEach`.
     *
     * spares us the repetition of creating common service vars and injecting them
     *
     * Option: the first argument may be the spec context (`this`)
     *         and MUST be if checking for global leaks
     *
     * remaining inject arguments may take one of 3 forms :
     *
     *    function    - This fn will be passed to ngMocks.inject.
     *                  Annotations extracted after inject does its thing.
     *    [strings]   - same string array you'd use to set fn.$inject
     *    (...string) - string arguments turned into a string array

     *
     * usage:
     *
     *    bard.inject(this, ...); // `this` === the spec context
     *
     *    bard.inject(this, '$log', 'dataservice');
     *    bard.inject(this, ['$log', 'dataservice']);
     *    bard.inject(this, function($log, dataservice) { ... });
     *
     */
    function bardInject () {
        var args = Array.prototype.slice.call(arguments);
        var ctx = getCtxFromArgs.bind(this)(args);
        var first = args[0];

        if (typeof first === 'function') {
            // use ngMocks.inject to execute the func in the arg
            angular.mock.inject(first);
            args = first.$inject;
            if (!args) {
                // unfortunately ngMocks.inject only prepares inject.$inject for us
                // if using strictDi as of v.1.3.8
                // therefore, apply its annotation extraction logic manually
                args = getinjectargs(first);
            }
        }
        else if (angular.isArray(first)) {
            args = first; // assume is an array of strings
        }
        // else assume all args are strings

        var $injector = currentSpec.$injector;
        if (!$injector) {
            angular.mock.inject(); // create the injector
            $injector = currentSpec.$injector;
        }

        var names = [];
        angular.forEach(args, function(name, ix) {

            var value = $injector.get(name);
            if (value == null) { return; }

            var pathName = name.split('.');

            if (pathName.length > 1) {
                // name is a path like 'block.foo'. Can't use as identifier
                // assume last segment should be identifier name, e.g. 'foo'
                name = pathName[pathName.length - 1];
                // todo: tolerate component names that are invalid JS identifiers, e.g. 'burning man'
            }
            global[name] = value;
            clearInject.push(name);
            names.push(name);
        });

        bard.addGlobals.bind(ctx)(names);
    }

    function fakeLogger($provide) {
        $provide.value('logger', sinon.stub({
            info: function() {},
            error: function() {},
            warning: function() {},
            success: function() {}
        }));
    }

    function fakeToastr($provide) {
        $provide.constant('toastr', sinon.stub({
            info: function() {},
            error: function() {},
            warning: function() {},
            success: function() {}
        }));
    }

    function fakeRouteHelperProvider($provide) {
        $provide.provider('routehelper', function() {
            /* jshint validthis:true */
            this.config = {
                $routeProvider: undefined,
                docTitle: 'Testing'
            };
            this.$get = function() {
                return {
                    configureRoutes: sinon.stub(),
                    getRoutes: sinon.stub().returns([]),
                    routeCounts: {
                        errors: 0,
                        changes: 0
                    }
                };
            };
        });
    }

    function fakeRouteProvider($provide) {
        /**
         * Stub out the $routeProvider so we avoid
         * all routing calls, including the default route
         * which runs on every test otherwise.
         * Make sure this goes before the inject in the spec.
         */
        $provide.provider('$route', function() {
            /* jshint validthis:true */
            this.when = sinon.stub();
            this.otherwise = sinon.stub();

            this.$get = function() {
                return {
                    // current: {},  // fake before each test as needed
                    // routes:  {}  // fake before each test as needed
                    // more? You'll know when it fails :-)
                    _faked: 'this is the faked $route service'
                };
            };
        });
    }

    function fakeStateProvider($provide) {
        /**
         * Stub out the $stateProvider so we avoid
         * all routing calls, including the default state
         * which runs on every test otherwise.
         * Make sure this goes before the inject in the spec.
         */
        $provide.provider('$state', function() {
            /* jshint validthis:true */
            this.state = sinon.stub();

            this.$get = function() {
                return {
                    // current: {},  // fake before each test as needed
                    // state:  {}  // fake before each test as needed
                    // more? You'll know when it fails :-)
                    _faked: 'this is the faked $state service'
                };
            };
        });
        $provide.provider('$urlRouter', function() {
            /* jshint validthis:true */
            this.otherwise = sinon.stub();

            this.$get = function() {
                return {
                    // current: {},  // fake before each test as needed
                    // states:  {}  // fake before each test as needed
                    // more? You'll know when it fails :-)
                    _faked: 'this is the faked $urlRouter service'
                };
            };
        });
    }

    /**
     * Get the spec context from parameters (if there)
     * of from `this` (if it is the ctx as a result of `bind`)
     */
    function getCtxFromArgs(args) {
        var ctx;
        var first = args[0];
        if (first && first.test) {
            // the first arg was `this`: the context for this spec
            // get it and strip it from args
            ctx = args.shift();
        } else if (this.test) {
            // alternative: caller can bind bardInject to the spec context
            ctx = this;
        }
        return ctx;
    }

    /**
     * Inspired by Angular; that's how they get the parms for injection
     * Todo: no longer used by `injector`. Remove?
     */
    function getFnParams(fn) {
        var fnText;
        var argDecl;

        var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
        var FN_ARG_SPLIT = /,/;
        var FN_ARG = /^\s*(_?)(\S+?)\1\s*$/;
        var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
        var params = [];
        if (fn.length) {
            fnText = fn.toString().replace(STRIP_COMMENTS, '');
            argDecl = fnText.match(FN_ARGS);
            angular.forEach(argDecl[1].split(FN_ARG_SPLIT), function(arg) {
                arg.replace(FN_ARG, function(all, underscore, name) {
                    params.push(name);
                });
            });
        }
        return params;
    }

    function isSpecRunning() { return !!currentSpec; }

    /**
     * Mocks out a service with sinon stubbed functions
     * that return the values specified in the config
     *
     * If the config value is `undefined`,
     * stub the service method with a dummy that doesn't return a value
     *
     * If the config value is a function, set service property with it
     *
     * If a service member is a property, not a function,
     * set it with the config value

     * If a service member name is not a key in config,
     * follow the same logic as above to set its members
     * using the config._default value (which is `undefined` if omitted)
     *
     * If there is a config entry that is NOT a member of the service
     * add mocked function to the service using the config value
     *
     * Usage:
     *   Given this DoWork service:
     *      {
     *          doWork1:  an async function,
     *          doWork2:  a function,
     *          doWork3:  an async function,
     *          doWork4:  a function,
     *          isActive: true
     *      }
     *
     *   Given this config:
     *      {
     *          doWork1:  $q.when([{name: 'Bob'}, {name: 'Sally'}]),
     *          doWork2:  undefined,
     *          //doWork3: not in config therefore will get _default value
     *          doWork4:  an alternate doWork4 function
     *          doWork5:  $q.reject('bad boy!')
     *          isActive: false,
     *          _default: $q.when([])
     *      }
     *
     *   Service becomes
     *      {
     *          doWork1:  a stub returning $q.when([{name: 'Bob'}, {name: 'Sally'}]),
     *          doWork2:  do-nothing stub,
     *          doWork3:  a stub returning $q.when([]),
     *          doWork4:  an alternate doWork4 function,
     *          doWork5:  a stub returning $q.reject('bad boy!'),
     *          isActive: false,
     *      }
     */
    function mockService(service, config) {

        var serviceKeys = Object.keys(service);
        var configKeys  = Object.keys(config);

        angular.forEach(serviceKeys, function(key) {
            var value = configKeys.indexOf(key) > -1 ?
                config[key] : config._default;

            if (typeof service[key] === 'function') {
                if (typeof value === 'function') {
                    service[key] = value;
                } else {
                    sinon.stub(service, key, function() {
                        return value;
                    });
                }
            } else {
                service[key] = value;
            }
        });

        // for all unused config entries add a sinon stubbed
        // async method that returns the config value
        angular.forEach(configKeys, function(key) {
            if (serviceKeys.indexOf(key) === -1) {
                var value = config[key];
                if (typeof value === 'function') {
                    service[key] = value;
                } else {
                    service[key] = sinon.spy(function() {
                        return value;
                    });
                }
            }
        });

        return service;
    }

    /**
     *  Listen to mocha test runner events
     *  Usage in browser:
     *     var runner = mocha.run();
     *     bard.mochaRunnerListener(runner);
     */
    function mochaRunnerListener(runner) {
        if (!global.mocha) { return; }
        if (!runner.ignoreLeaks) {
            runner.on('hook end', addOkGlobals);
        };

        // When checking global leaks with mocha.checkLeaks()
        // make sure mocha is aware of bard's okGlobals
        function addOkGlobals(hook) {
            // HACK: only way I've found so far to ensure that bard added globals
            // are always inspected. Using private mocha _allowedGlobals (shhhh!)
            if (okGlobals.length && !hook._allowedGlobals) {
                hook._allowedGlobals = okGlobals;
            }
        }
    }

    // Replaces the accented characters of many European languages w/ unaccented chars
    // Use it in JavaScript string sorts where such characters may be encountered
    // Matches the default string comparers of most databases.
    // Ex: replaceAccentChars(a.Name) < replaceAccentChars(b.Name)
    // instead of:            a.Name  <                    b.Name
    function replaceAccentChars(s) {
        var r = s.toLowerCase();
        r = r.replace(new RegExp(/[àáâãäå]/g), 'a');
        r = r.replace(new RegExp(/æ/g), 'ae');
        r = r.replace(new RegExp(/ç/g), 'c');
        r = r.replace(new RegExp(/[èéêë]/g), 'e');
        r = r.replace(new RegExp(/[ìíîï]/g), 'i');
        r = r.replace(new RegExp(/ñ/g), 'n');
        r = r.replace(new RegExp(/[òóôõö]/g), 'o');
        r = r.replace(new RegExp(/œ/g), 'oe');
        r = r.replace(new RegExp(/[ùúûü]/g), 'u');
        r = r.replace(new RegExp(/[ýÿ]/g), 'y');
        return r;
    }

    /**
     *  Assert that there are no outstanding HTTP requests after test is complete
     *  For use with ngMocks; doesn't work for async server integration tests
     */
    function verifyNoOutstandingHttpRequests () {
        afterEach(angular.mock.inject(function($httpBackend) {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        }));
    }

    /**
     * Returns a function that execute a callback function
     * (typically a fn making asserts) within a try/catch
     * The try/catch then calls the ambient "done" function
     * in the appropriate way for both success and failure
     *
     * Useage:
     *    // When the DOM is ready, assert got the dashboard view
     *    tester.until(elemIsReady, wrap(hasDashboardView, done));
     */
    function wrapWithDone(callback, done) {
        return function() {
            try {
                callback();
                done();
            } catch (err) {
                done(err);
            }
        };
    }
})();
