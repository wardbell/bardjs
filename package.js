Package.describe({
  name: 'firebait:bardjs',
  version: '0.0.4',
  // Brief, one-line summary of the package.
  summary: 'bardjs is a small library of functions to help you write Angular v.1.x application tests.',
  // URL to the Git repository containing the source code for this package.
  git: 'https://github.com/firebait/bardjs.git',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md',
  debugOnly: true
});

Package.onUse(function(api) {
  api.versionsFrom('1.2.0.2');
  api.use([
    'angular:angular@1.4.4',
    'angular:angular-mocks@1.4.7',
    'practicalmeteor:sinon@1.14.1_2'
  ], 'client');
  api.addFiles([
    './dist/bard.js',
    './dist/bard-ngRouteTester.js'], 'client');
});

Package.onTest(function(api) {
});
