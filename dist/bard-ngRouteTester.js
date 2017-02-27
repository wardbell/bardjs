/**
 * bardjs - Spec helpers for testing angular v.1.x apps with Mocha, Jasmine or QUnit
 * @authors John Papa,Ward Bell
 * @version v0.1.10
 * @link https://github.com/wardbell/bardjs
 * @license MIT
 */
/* jshint -W117, -W030 */
(function() {
    window.bard = window.bard || {};
    /**
     * Creates the global ngRouteTester function
     * to help test ngRoute changes in the DOM
     *
     * Usage:
     *
     *     beforeEach(function() {
     *        module('app.module', ngRouteTester(options));
     *        ... other config ...
     *        ... ready to roll; inject! ...
     *        bard.inject('ngRouteTester', ...);
     *     });
     *
     * @function ngRouteTester
     * @param {Object} [opts]
     * @param {Object} [opts.document=document] The document node of the page
     * @param {Object} [opts.templateUrl] The template file for the HTML layout of the tester
     * @param {Object} [opts.template] The template string for the HTML layout of the tester
     * @param {Object} [opts.mockLocationPaths=true] Whether or not to fake the URL change in the browser address bar
     *
     * Thanks to Matias Niemelä and his ngMidwayTester from
     * which most of this code is lifted.
     * See http://www.yearofmoo.com/2013/01/full-spectrum-testing-with-angularjs-and-karma.html
     */
    window.bard.ngRouteTester = function(opts) {

        ngRouteTester.$inject = ['$provide'];

        return ngRouteTester;
        ///////////////////

        function ngRouteTester($provide) {
            var options = {
                document: document
            };

            angular.extend(options, opts);
            configure();

            $provide.factory('ngRouteTester', tester);

            ///////////////////////
            var $rootElement,
                $timers = [],
                $viewContainer,
                $terminalElement,
                $viewCounter = 0,
                doc,
                noop = angular.noop;

            var viewSelector = 'ng-view, [ng-view], .ng-view, [x-ng-view], [data-ng-view]';

            function configure() {

                doc = options.document;

                $rootElement = angular.element(doc.createElement('div'));
                $provide.value('$rootElement', $rootElement);

                var mockPaths = options.mockLocationPaths;
                if (mockPaths == null ? true : mockPaths) {
                    $provide.decorator('$location', LocationDecorator);
                }

                if (options.templateUrl) { getTemplate(); }

                if (options.template) {
                    $rootElement.html(options.template);
                    var view = angular.element($rootElement[0].querySelector(viewSelector));
                    $viewContainer = view.parent();
                } else {
                    $viewContainer = angular.element('<div><div ng-view></div></div>');
                    $rootElement.append($viewContainer);
                }
            }

            LocationDecorator.$inject = ['$delegate', '$rootScope'];

            function LocationDecorator($delegate, $rootScope) {
                var _path = $delegate.path();
                $delegate.path = function(path) {
                    if (path) {
                        // sometimes the broadcast triggers a new request for same path
                        // added this conditional to mitigate risk of this infinite loop
                        if (_path !== path) {
                            _path = path;
                            $rootScope.$broadcast('$locationChangeSuccess', path);
                        }
                        return this;
                    } else {
                        return _path;
                    }
                };
                return $delegate;
            }

            // get the template from the server synchronously
            function getTemplate() {
                var request = new XMLHttpRequest();
                request.open('GET', options.templateUrl, false);
                request.send(null);

                if (request.status !== 200) {
                    throw new Error('ngRouteTester: Unable to download template file');
                }

                options.template = request.responseText;
            }

            // ngRouteTester factory
            tester.$inject = ['$compile', '$injector', '$rootScope', '$route'];

            function tester($compile, $injector, $rootScope, $route) {

                bootstrap();

                // Arrange for mocha/jasmine to destroy after each test
                afterEach && afterEach(destroy);

                return {
                    $injector: $injector,
                    $rootScope: $rootScope,
                    $route: $route,
                    path: path,
                    rootElement: $rootElement,
                    until: until,
                    viewElement : viewElement,
                    visit : visit
                };
                ///////////////////

                function bootstrap() {
                    $terminalElement = angular.element(
                        '<div status="{{__VIEW_STATUS}}"></div>');

                    $rootElement.append($terminalElement);
                    $rootScope.$apply(function() {
                        $rootElement.data('$injector', $injector);
                        $compile($rootElement)($rootScope);
                        angular.element(doc.body).append($rootElement);
                    });
                }

                /**
                 * Removes the $rootElement and clears the module from the page.
                 * This is done automatically for mocha tests
                 *
                 * @method destroy
                 */
                function destroy() {
                    angular.forEach($timers, function(timer) {
                        clearTimeout(timer);
                    });

                    var body = angular.element(document.body);
                    body.removeData();
                    $rootElement.remove();
                    $rootScope.$destroy();
                }

                /**
                 * @method path
                 * @return {String} Returns the path of the current route
                 */
                function path() {
                    return $injector.get('$location').path();
                }

                /**
                 * @method viewElement
                 * @return {Element} The current element that has ng-view attached to it
                 */
                function viewElement() {
                    return angular.element($viewContainer[0].querySelector(viewSelector));
                }

                /**
                 * Changes the current route of the page and then fires the callback when the page has loaded
                 *
                 * @param {String} path The given path that the current route will be changed to
                 * @param {function} [callback] The given callback to fire once the view has been fully loaded
                 * @method visit
                 */
                function visit(path, callback) {

                    // wait until view shows up
                    /* jshint -W106 */
                    $rootScope.__VIEW_STATUS = ++$viewCounter;
                    /* jshint +W106 */
                    until(function() {
                        return parseInt($terminalElement.attr('status')) >= $viewCounter;
                    }, function() {
                        // give it another tick to settle
                        setTimeout(callback || noop, 0);
                    });

                    // tell router to visit the view
                    var fn = function() {
                        $injector.get('$location').path(path);
                    };
                    $rootScope.$$phase ? fn() : $rootScope.$apply(fn);
                }

                /**
                 * Keeps checking an expression until it returns a truthy value and then runs the provided callback
                 *
                 * @param {function} exp The given function to poll
                 * @param {function} callback The given callback to fire once the exp function returns a truthy value
                 * @method until
                 */
                function until(exp, callback) {
                    var timer, delay = 50;
                    timer = setInterval(function() {
                        if (exp()) {
                            clearTimeout(timer);
                            callback();
                        }
                    }, delay);
                    $timers.push(timer);
                }
            }
        }
    };

})();
