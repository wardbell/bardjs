/* jshint -W117, -W030 */
describe('bard.mockService', function() {
    'use strict';

    var mockService = bard.mockService;
    var flush;
    var sandbox;

    beforeEach(function() {
        module();
        bard.inject(this, '$q', '$rootScope', '$window');
        sandbox = sinon.sandbox.create();
        flush = function() { $rootScope.$apply(); };
    });

    afterEach(function() {
        sandbox.restore();
    });

    describe('when execute the "real" DoWork service described in the usage example', function() {
        var service;

        beforeEach(function() {
            service = getDoWorkService();
        });

        it('`doWork1` returns a resolved promise with the "real" results', function() {
            service.doWork1(1, 2)
                .then(function(results) {
                    expect(results).to.deep.equal([1, 2]);
                });
            flush();
        });

        it('`doWork2` calls alert and returns the "real" results', function() {
            var alert = sandbox.stub($window, 'alert');
            bard.addGlobals(this, 'alert'); // because sinon adds it!
            var results = service.doWork2();
            expect(results).to.equal('pointless');
            expect(alert).to.have.been.calledWith('Hi there');
        });

        it('`doWork3` returns a resolved promise with the "real" results', function() {
            service.doWork3(1, 2)
                .then(function(results) {
                    expect(results).to.deep.equal(['a1', 'a2']);
                });
            flush();
        });

        it('`doWork4` returns the "real" results', function() {
            var results = service.doWork4(1, 2);
            expect(results).to.equal('Hi from doWork4');
        });

        it('does not have a `doWork5`', function() {
            expect(service).to.not.have.property('doWork5');
        });

        it('`isActive` should be true', function() {
            expect(service.isActive).to.be.true;
        });
    });

    describe('when mock the DoWork service as described in the usage example', function() {
        var service;

        beforeEach(function() {
            service = mockService(getDoWorkService(),
            {   // config in the usage example
                doWork1:  $q.when([{name: 'Bob'}, {name: 'Sally'}]),
                doWork2:  undefined,
                doWork4:  function() { return 'Now for a different kind of work';},
                doWork5:  $q.reject('bad boy!'),
                isActive: false,
                _default: $q.when([])
            });
        });

        it('`doWork1` returns a resolved promise with the fake results', function() {
            service.doWork1(1, 2)
                .then(function(results) {
                    expect(results).to.deep.equal([{name: 'Bob'}, {name: 'Sally'}]);
                });
            // verify `doWork1` is a spy
            expect(service.doWork1).to.have.been.calledWith(1, 2);
            flush();
        });

        it('`doWork2` returns nothing', function() {
            var results = service.doWork2(1, 2);
            expect(results).to.not.be.defined;
            // verify `doWork2` is a spy
            expect(service.doWork2).to.have.been.calledWith(1, 2);
        });

        it('`doWork3` returns a resolved promise with config._default (empty array)', function() {
            service.doWork3(1, 2).then(expectEmptyArray);
            // verify `doWork3` is a spy
            expect(service.doWork3).to.have.been.calledWith(1, 2);
            flush();
        });

        it('`doWork4` returns the fake results', function() {
            var results = service.doWork4(1, 2);
            expect(results).to.match(/different/);
            // verify `doWork4` is NOT a spy
            expect(service.doWork4).to.not.have.property('restore');
        });

        it('`doWork5` returns a rejected promise with the faked error', function() {
            service.doWork5()
                .then(function() {
                    // Should not come here!
                    expect('should have failed').to.be.true;
                })
                .catch(function(err) {
                    expect(err).to.match(/bad/);
                });
            // verify `doWork5` is a spy
            expect(service.doWork5).to.have.been.called;
            flush();
        });

        it('`isActive` should have changed to false', function() {
            expect(service.isActive).to.be.false;
        });
    });

    describe('when mock one async method of the DoWork service and default the rest', function() {
        // typical usage when mocking dataservice for a controller
        // mock the method(s) of interest; let the others do the minimum necessary
        var service;

        beforeEach(function() {
            service = mockService(getDoWorkService(),
            {   // config in the usage example
                doWork1:  $q.when([1, 2, 3]),
                _default: $q.when([])
            });
        });

        it('`doWork1` returns a resolved promise with the fake results', function() {
            service.doWork1('foo').then(function(results) {
                expect(results).to.deep.equal([1, 2, 3]);
            });
            flush();
        });

        it('`doWork2`-`doWork4` each return resolved promise with empty array', function() {
            service.doWork2('could').then(expectEmptyArray);
            service.doWork3('be').then(expectEmptyArray);
            service.doWork4('anything').then(expectEmptyArray);
            flush();
        });
    });

    describe('when mock one async method of the DoWork service and omit _default', function() {
        var service;

        beforeEach(function() {
            service = mockService(getDoWorkService(),
            {   // config in the usage example
                doWork1:  $q.when([1, 2, 3])
            });
        });

        it('`doWork1` returns a resolved promise with the fake results', function() {
            service.doWork1('foo').then(function(results) {
                expect(results).to.deep.equal([1, 2, 3]);
            });
            flush();
        });

        it('`doWork2`-`doWork4` are stubbed to return nothing', function() {
            expect(service.doWork2('could')).to.not.be.defined;
            expect(service.doWork3('be')).to.not.be.defined;
            expect(service.doWork4('anything')).to.not.be.defined;
            // but they are stubbed
            expect(service.doWork2).to.have.been.calledWith('could');
            expect(service.doWork3).to.have.been.calledWith('be');
            expect(service.doWork4).to.have.been.calledWith('anything');

            flush();
        });
    });

    ///// helpers /////

    // create the exampel DoWork service from bard.mockService usage doc
    function getDoWorkService() {
        return {
            doWork1:  function doWork1(a, b) {
                    return $q.when([].slice.apply(arguments));
                },
            doWork2:  function doWork2() {
                    $window.alert('Hi there'); // something we do NOT want to do in a test
                    return 'pointless';
                },
            doWork3:  function doWork3() {
                    var args = [].slice.apply(arguments);
                    // (1, 2) -> [a1, a2]
                    var results = args.map(function(a) { return 'a' + a;});
                    return $q.when(results);
                },
            doWork4:  function() {
                return 'Hi from doWork4';
            },
            isActive: true
        };
    }

    function expectEmptyArray(results) {
        expect(results).to.deep.equal([]);
    }
});
