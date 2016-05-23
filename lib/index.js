/**
 * remotes/index.js
 * var remote = require('beyond-remote').remote
 * remote.base({
 * 	basePath : '/basePath',
 * 	method : 'post',
 * 	credentials: 'include',
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
 *  }).catch(function(error){
 *      return error
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

'use strict';

var assign = require('beyond-lib/lib/assign');
var fetch = typeof window !== 'undefined' && window.fetch && !window.__disableNativeFetch ? window.fetch : require('fetch-ie8');

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

function isObj(obj) {
	return obj && Object.prototype.toString.call(obj) === '[object Object]';
}

function isFormData(obj) {
	return obj && Object.prototype.toString.call(obj) === '[object FormData]';
}

function serialize(obj) {
	if (obj) {
		var arr = [];
		for (var k in obj) {
			arr.push(encodeURIComponent(k) + '=' + encodeURIComponent(obj[k]));
		}
		return arr.join('&');
	}
	return null;
}

function Timeout(ms, msg) {
	return new Promise(function (resolve, reject) {
		setTimeout(function () {
			reject(msg);
		}, ms);
	});
}

function createFetch(url, options, timeout, remote) {
	var func = function func() {
		remote.trigger('start');
		var result = new Promise(function (resolve, reject) {
			Promise.race([fetch(url, options), Timeout(timeout.ms, timeout.msg)]).then(function (response) {
				var isSuccess = response.ok || response.status >= 200 && response.status < 300;
				if (isSuccess) {
					remote.trigger('success', response);
				} else {
					throw response;
				}
				remote.trigger('complete', response);
				var data = response.headers.get('content-type') && response.headers.get('content-type').indexOf('json') >= 0 ? response.json() : response.text();
				resolve(data);
			})['catch'](function (error) {
				remote.trigger('error', error);
				remote.trigger('complete', error);
				reject(error);
			});
			remote.trigger('send');
		});
		return result;
	};
	func.url = url;
	func.options = options;
	return func;
}

function Remote() {
	this._base = {
		basePath: '',
		method: 'GET',
		requestJSON: true,
		responseJSON: true,
		timeout: 90000,
		timeoutMsg: {
			ok: false,
			text: 'timeout',
			status: 900,
			title: '服务器超时！请重试！'
		},
		credentials: 'omit'
	};
	this._handlers = {};
}

Remote.prototype.on = function (type, handler) {
	this._handlers[type] = this._handlers[type] || [];
	this._handlers[type].push(handler);
};

Remote.prototype.off = function (type, handler) {
	var i = undefined;
	if (this._handlers[type] && (i = this._handlers[type].indexOf(handler)) >= 0) {
		this._handlers[type].splice(i, 1);
	}
};

Remote.prototype.trigger = function (type, arg) {
	if (this._handlers[type]) {
		this._handlers[type].forEach(function (handler) {
			if (isfunc(handler)) {
				handler(arg);
			}
		});
	}
};

Remote.prototype.extend = function () {
	var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

	var ops = {
		headers: assign({}, this._base.headers),
		method: this._base.method,
		credentials: this._base.credentials
	};
	var metas = assign({}, this._base, options);
	var url = typeof url === 'string' || url == null ? mergeUrl(metas.basePath, metas.url || '') : metas.url;
	for (var k in options) {
		//这四个参数从 metas 获取
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
	if (metas.requestJSON && !ops.headers['Content-Type']) {
		ops.headers['Content-Type'] = 'application/json';
	}
	if (metas.responseJSON && !ops.headers['Accept']) {
		ops.headers['Accept'] = 'application/json';
	}

	if (ops.headers['Content-Type'] && ops.headers['Content-Type'].indexOf('application/json') >= 0 && isObj(ops.body)) {
		ops.body = JSON.stringify(ops.body);
	}
	if (ops.method === 'POST' && !ops.headers['Content-Type'] && !isFormData(ops.body)) {
		ops.headers['Content-Type'] = 'application/x-www-form-urlencoded';
		if (isObj(ops.body)) {
			ops.body = serialize(ops.body);
		}
	}

	var timeout = {
		ms: options.timeout || this._base.timeout,
		msg: options.timeoutMsg || this._base.timeoutMsg
	};
	return createFetch(url, ops, timeout, this);
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