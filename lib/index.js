'use strict';

/**
 * remotes/index.js
 * var remote = require('beyond-remote').remote
 * remote.base({
 * 	basePath : '/basePath',
 * 	method : 'post',
 * 	requestJSON : true,
 * 	responseJSON : true,
 * 	headers : {
 * 		'Content-Type': 'application/json'
 * 	},
 * 	
 * 	onStart(response)
 * 	onSend(response)
 * 	onSuccess(response)
 * 	onError(response)
 * 	onComplete(response)
 * 	
 * })
 * 
 * exports.getUsers = remote.extend({
 * 	url : '/getUsers',
 * 	headers : {},
 * 	body : JSON.stringify({age : 19})
 * })
 *
 * exports.getUser = remote.extend({
 * 	url : '/getUser',
 * 	body : JSON.stringify({id : 1})
 *  
 * })
 *
 * remotes/api2.js
 * var remote2 = new require('beyond-remote').create()
 * remote2.base({
 * 	url : '/basePath2'
 * 	...
 * })
 *
 * exports.getAdminUsers = remote2.extend({
 * 	url : '/getAdminUsers'
 * })
 *
 * exports.getAdminUser = function(id){
 *  return remote2.extend({
 * 	 url : '/getAdminUsers',
 * 	 body : JSON.stringify({id})
 *  }).then(function(response){
 *  	return response.json()
 *  })
 * }
 *
 * index.js
 * var users = require('./remotes')
 * users.getUsers().then(function(json){
 * 	
 * })['catch'](function(){
 * })
 * users.getUser()
 *
 */
var assign = require('beyond-lib/lib/assign');
var fetch = typeof window !== 'undefined' && window.fetch && !window.__disableNativeFetch ? window.fetch : require('fetch-ie8');
function noop() {}

function Remote() {
	this._base = {
		basePath: '',
		method: 'GET',
		requestJSON: true,
		responseJSON: true
	};
	this._handles = {};
}

function isfunc(func) {
	return typeof func === 'function';
}

function mergeUrl(basePath, url) {
	if (!basePath || !url) {
		return basePath + url;
	} else if (/\/$/.test(basePath) && /^\//.test(url)) {
		return basePath + url.slice(1);
	} else if (!/\/$/.test(basePath) && !/^\//.test(url)) {
		return basePath + '/' + url;
	}
	return basePath + url;
}

function createFetch(url, options, remote) {
	return function () {
		remote.trigger('start');
		var result = fetch(url, options).then(function (response) {
			var isSuccess = response.status >= 200 && response.status < 300;
			if (isSuccess) {
				remote.trigger('success');
			} else {
				throw response;
			}
			remote.trigger('complete');
			return response.headers.get('content-type').indexOf('json') >= 0 ? response.json() : response.text();
		})['catch'](function (e) {
			remote.trigger('error');
			remote.trigger('complete');
			return e;
		});
		remote.trigger('send');
		return result;
	};
}

Remote.prototype.on = function (type, handle) {
	this._handles[type] = this._handles[type] || [];
	this._handles[type].push(handle);
};

Remote.prototype.off = function (type, handle) {
	var i = undefined;
	if (this._handles[type] && (i = this._handles[type].indexOf(handle)) >= 0) {
		this._handles[type].splice(i, 1);
	}
};

Remote.prototype.trigger = function (type) {
	if (this._handles[type]) {
		this._handles[type].forEach(function (handle) {
			if (typeof handle === 'function') {
				handle();
			}
		});
	}
};

Remote.prototype.extend = function () {
	var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

	var ops = {
		headers: {},
		method: this._base.method
	};
	var metas = assign({}, this._base, options);
	var url = typeof url === 'string' || url == null ? mergeUrl(metas.basePath, metas.url || '') : metas.url;
	for (var k in options) {
		if (['url', 'basePath', 'requestJSON', 'responseJSON'].indexOf(k) < 0) {
			if (k === 'headers') {
				assign(ops.headers, options[k]);
			} else {
				ops[k] = options[k];
			}
		}
	}
	ops.method = ops.method.toUpperCase();
	//'Content-Type': 'application/json'
	if (metas.requestJSON) {
		if (!ops.headers['Content-Type']) {
			ops.headers['Content-Type'] = 'application/json';
		}
		if (ops.body && Object.prototype.toString.call(ops.body) === '[object Object]') {
			ops.body = JSON.stringify(ops.body);
		}
	}
	if (metas.responseJSON && !ops.headers['Accept']) {
		ops.headers['Accept'] = 'application/json';
	}

	return createFetch(url, ops, this);
};

Remote.prototype.base = function (options) {
	if (options == null) {
		return assign({}, this._base);
	} else {
		assign(this._base, options);
	}
};

module.exports = {
	remote: new Remote(),
	create: function create() {
		return new Remote();
	}
};