// *Some* environments (phantomjs) don't have es5 (Function.prototype.bind)
require('es5-shim/es5-shim.js')
require('es5-shim/es5-sham.js')
require('es6-promise').polyfill();
require("./test/test.js");