module.exports = function() {
    var service = {
        getConfig: getConfig
    };
    return service;

    function getConfig() {
        var config = {
            specs: ['./tests/**/*.spec.js'],
            js: [
                './bard.js',
                './bard-ngRouteTester.js'
            ],
            packages: [
                './package.json',
                './bower.json'
            ],
            build: './dist/',
            report: './report/'
        };

        return config;
    }
};
