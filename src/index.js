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

const assign = require('beyond-lib/lib/assign')
const fetch = typeof window !== 'undefined' && window.fetch && !window.__disableNativeFetch ? window.fetch : require('fetch-ie8')

function isfunc(func) {
	return typeof func === 'function'
}

function mergeUrl(basePath='', url='') {
	return (basePath + url).replace(/\/+/,'/')
}

function isObj(obj) {
	return obj && Object.prototype.toString.call(obj) === '[object Object]'
}

function isFormData(obj) {
	return obj && Object.prototype.toString.call(obj) === '[object FormData]'
}

function serialize(obj) {
	if (obj) {
		let arr = []``
		for (var k in obj) {
			arr.push(encodeURIComponent(k) + '=' + encodeURIComponent(obj[k]))
		}
		return arr.join('&')
	}
	return null
}

function Timeout(ms, msg) {
	return new Promise((resolve, reject) => {
		setTimeout(()=>reject(msg) , ms)
	}
}


function createFetch(url, options, timeout, remote) {
	let func = function func() {
		remote.trigger('start')
		let result = new Promise((resolve, reject) =>{
			Promise.race([fetch(url, options), Timeout(timeout.ms, timeout.msg)])
			.then(function (response) {
				let isSuccess = response.ok || response.status >= 200 && response.status < 300;
				if (isSuccess) {
					remote.trigger('success', response);
				} else {
					throw response;
				}
				remote.trigger('complete', response);
				let data = response.headers.get('content-type') &&  response.headers.get('content-type').indexOf('json') >= 0 ? response.json() : response.text();
				resolve(data);
			})
			.catch(function (error) {
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
	let i = undefined;
	if (this._handlers[type] && (i = this._handlers[type].indexOf(handler)) >= 0) {
		this._handlers[type].splice(i, 1);
	}
};

Remote.prototype.trigger = function (type, arg={}) {
	let data = {type,data : arg}
	if (this._handlers[type]) {
		this._handlers[type].forEach(function (handler) {
			if (isfunc(handler)) {
				handler(data)
			}
		})
	}
}

Remote.prototype.extend = function () {
	let options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0]

	let ops = {
		headers: assign({}, this._base.headers),
		method: this._base.method,
		credentials: this._base.credentials
	}
	let metas = assign({}, this._base, options)
	let url = typeof url === 'string' || url == null ? mergeUrl(metas.basePath, metas.url || '') : metas.url
	for (let k in options) {
		//这四个参数从 metas 获取
		if (['url', 'basePath', 'requestJSON', 'responseJSON'].indexOf(k) < 0) {
			if (k === 'headers') {
				assign(ops.headers, options[k])
			} else {
				ops[k] = options[k]
			}
		}
	}
	ops.method = ops.method.toUpperCase()
	//'Content-Type': 'application/json'
	if (ops.body && ops.method === 'POST') {
		if (metas.requestJSON && !ops.headers['Content-Type']) {
			ops.headers['Content-Type'] = 'application/json'
		}
		if (metas.responseJSON && !ops.headers['Accept']) {
			ops.headers['Accept'] = 'application/json'
		}

		if (ops.headers['Content-Type'] && ops.headers['Content-Type'].indexOf('application/json') >= 0 && isObj(ops.body)) {
			ops.body = JSON.stringify(ops.body)
		}else if (!ops.headers['Content-Type'] && (isObj(ops.body) || typeof ops.body === 'string' )) {
			ops.headers['Content-Type'] = 'application/x-www-form-urlencoded'
			if (isObj(ops.body)) {
				ops.body = serialize(ops.body)
			}
		}
	}

	let timeout = {
		ms:options.timeout || this._base.timeout,
		msg: options.timeoutMsg || this._base.timeoutMsg
	}
	return createFetch(url, ops, timeout, this)
}

Remote.prototype.base = function (options) {
	if (options == null) {
		return assign({}, this._base)
	} else {
		assign(this._base, options)
	}
}

module.exports = {
	remote: new Remote(),
	create: function create() {
		return new Remote()
	}
}