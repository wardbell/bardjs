/* jshint -W117, -W030 */
describe('bard.inject', function() {
    'use strict';

    var origDebugging;

    before(function() {
        origDebugging = bard.debugging();
        // uncomment to turn bard debug logging on for this spec file
        // bard.debugging(true);
    });

    after(function() {
        bard.debugging(origDebugging); // restore bard debug logging
    });

    beforeEach(module(function($provide) {
        // define a 'nutz' service for testing injector
        $provide.service('nutz', function() {});
    }));

    beforeEach('bard.inject.spec top beforeEach', function() {
        // Confirm no window pollution from a prior bard.inject() call
        bard.log('bard.inject.spec top beforeEach');
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

        beforeEach('bard.inject.spec describe #2 beforeEach', function() {
            bard.log('bard.inject.spec (describe #2) beforeEach');
            bard.inject(this, ['$log', 'nutz']);
        });

        it('true is true', function() {
            expect(true).to.be.true;
        });

        it('$log exists', function() {
            expect($log).to.exist;
        });

        it('nutz exists', function() {
            expect(nutz).to.exist;
        });
    });

    describe('(describe #3):', function() {

        beforeEach('bard.inject.spec describe #3 beforeEach', function() {
            bard.log('bard.inject.spec (describe #3) beforeEach');
            // window.$log and window.nutz should not exist before any test
            expect(window.$log).to.not.exist;
            expect(window.nutz).to.not.exist;
        });

        // Although inject() puts injectables in the window,
        // it also removes them after each test
        // Notice ... no private vars for $log or nutz!
        // ... no injecting of them either.

        it('should set window.$log and window.nutz when call inject w/ string params', function() {

            bard.inject(this, '$log', 'nutz');

            expect($log).to.exist;
            expect(nutz).to.exist;

            // They are actually in the window
            expect(window.$log).to.exist;
            expect(window.nutz).to.exist;

        });

        it('should set window.$log and window.nutz when call inject with string array', function() {

            bard.inject(this, ['$log', 'nutz']);

            expect($log).to.exist;
            expect(nutz).to.exist;
        });

        it('should set window.$log and window.nutz when call inject with a function', function() {

            bard.inject(this, function($log, nutz) {
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

            bard.inject.bind(this)('$q', '$log');

            expect($log).to.not.exist;
            expect(window.$log).to.exist;
        });

        it('should set window.$log & window.foo when call inject("$log","block.foo")', function() {
            // register this ridiculous value for just this test
            module(function($provide) {
                $provide.value('block.foo', 'foo');
            });

            // Can inject a service with a dotted name!
            bard.inject(this, '$log', 'block.foo');

            expect($log).to.exist;
            expect(foo).to.exist;
            expect(window.foo).to.exist;
        });

         // This afterEach would fail because it is called BEFORE
         // the outer one created by bard to handle window cleaning
         // -----------------------------------------------------
         // afterEach('Describe #2 afterEach', function() {
         //     console.log('---Describe #2 afterEach');
         //     // Should have cleaned up after itself
         //     expect(window.$log).to.not.exist;
         //     expect(window.nutz).to.not.exist;
         // });
    });

    describe('(describe #4):', function() {
        it('window.$log and window.nutz should not exist', function() {
            expect(window.$log).to.not.exist;
            expect(window.nutz).to.not.exist;
        });
    });

    describe('(describe #5):', function() {
        beforeEach(function() {
            bard.log('bard.inject.spec (describe #5) beforeEach');
            // register this ridiculous value for just this describe
            module(function($provide) {
                $provide.value('baz', 'baz');
            });

            bard.inject(this, 'baz'); // get baz in outer describe
        });

        describe('in nested describe', function() {
            it('baz is available from parent describe', function() {
                expect(baz).to.exist;
            });

            it('baz from inject() is same object as baz from direct injection', function() {

                inject(function(_baz_) {
                    expect(baz).to.equal(_baz_);
                });
            });
        });
    });
});
