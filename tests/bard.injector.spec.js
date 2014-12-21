/* jshint -W117, -W030 */
describe('bard#inject', function() {
    'use strict';

    beforeEach(module(function($provide) {
        // define a 'nutz' service for testing injector
        $provide.service('nutz', function() {});
    }));

    beforeEach(function() {
        // Confirm no window pollution from a prior inject() call
        expect(window.$log).to.not.exist;
        expect(window.nutz).to.not.exist;
        expect(window.baz).to.not.exist;
        expect(window.foo).to.not.exist;
    });

    describe('(describe #1):', function() {
        it('window.$log and window.nutz should not exist', function() {
            expect(window.$log).to.not.exist;
            expect(window.nutz).to.not.exist;
        });

    });

    describe('(describe #2):', function() {
        beforeEach(function() {
            // window.$log and window.nutz should not exist before any test
            expect(window.$log).to.not.exist;
            expect(window.nutz).to.not.exist;
        });

        // Although inject() puts injectables in the window,
        // it also removes them after each test by scheduling an afterEach
        // Notice ... no private vars for $log or nutz! ... no injecting of them either.

        it('should set window.$log and window.nutz when call inject with string params', function() {

            bard.inject('$log', 'nutz');

            expect($log).to.exist;
            expect(nutz).to.exist;

            // They are actually in the window
            expect(window.$log).to.exist;
            expect(window.nutz).to.exist;

            // THIS afterEach is registered AFTER the one created by bard.inject
            afterEach(function() {
                // Should have cleaned up after itself
                expect(window.$log).to.not.exist;
                expect(window.nutz).to.not.exist;
            });
        });

        it('should set window.$log and window.nutz when call inject with string array', function() {

            bard.inject(['$log', 'nutz']);

            expect($log).to.exist;
            expect(nutz).to.exist;
        });

        it('should set window.$log and window.nutz when call inject with a function', function() {

            bard.inject(function($log, nutz) {
                // do stuff just as if we called ngMocks.inject
                $log.info('use the injected $log');
            });

            expect($log).to.exist;
            expect(nutz).to.exist;

            expect($log.info.logs[0][0])
                .to.equal('use the injected $log',
                '$log.info should have been called: ');
        });

        // reinforcing the point that inject adds to globals, not local fn scope
        it('locally defined $log hides the $log injected by inject', function() {
            var $log; // declaration hides the one in window.$log created by inject

            bard.inject('$log');

            expect($log).to.not.exist;
            expect(window.$log).to.exist;
        });

        it('should set window.$log and window.foo when call inject("$log","block.foo")', function() {
            // register this ridiculous value for just this test
            module(function($provide) {
                $provide.value('block.foo', 'foo');
            });

            // Can inject a service with a dotted name!
            bard.inject('$log', 'block.foo');

            expect($log).to.exist;
            expect(foo).to.exist;
            expect(window.foo).to.exist;

            afterEach(function() {
                // Should have cleaned up after itself
                expect(window.$log).to.not.exist;
                expect(window.foo).to.not.exist;
            });
        });

        /*
         // Would fail because THIS afterEach is registered BEFORE the one created by bard.inject
         afterEach(function() {
         // Should have cleaned up after itself
         expect(window.$log).to.not.exist;
         expect(window.nutz).to.not.exist;
         });

         */
    });

    describe('(describe #3):', function() {
        it('window.$log and window.nutz should not exist', function() {
            expect(window.$log).to.not.exist;
            expect(window.nutz).to.not.exist;
        });
    });

    describe('(describe #4):', function() {
        beforeEach(function() {
            // register this ridiculous value for just this describe
            module(function($provide) {
                $provide.value('baz', 'baz');
            });

            bard.inject('baz'); // get baz in outer describe
        });

        describe('in nested describe', function() {
            it('baz is available from parent describe', function() {
                expect(baz).to.exist;
            });

            it('baz from inject() is same object as baz from direct injection', function() {

                bard.inject('baz');

                inject(function(_baz_) {
                    expect(baz).to.equal(_baz_);
                });
            });
        });
    });
});