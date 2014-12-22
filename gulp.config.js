module.exports = function() {
    var service = {
        getConfig: getConfig
    };
    return service;

    function getConfig() {
        var config = {
            specs: ['./tests/**/*.spec.js'],
            js: [
                './bard.js'
            ],
            plato: {
                js: './bard.js'
            },
            build: './dist/',
            report: './report/'
        };

        return config;
    }
};
