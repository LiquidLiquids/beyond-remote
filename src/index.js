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
 * 		'content-Type': 'application/json'
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
 * exports.getUsers = remote.create({
 * 	url : '/getUsers',
 * 	headers : {},
 * 	body : JSON.stringify({age : 19})
 * })
 *
 * exports.getUser = remote.create({
 * 	url : '/getUser',
 * 	body : JSON.stringify({id : 1})
 * })
 *
 * remotes/api2.js
 * var maker2 = new require('beyond-remote').Remote
 * maker2.base({
 * 	url : '/basePath2'
 * 	...
 * })
 *
 * exports.getAdminUsers = maker2.create({
 * 	url : '/getAdminUsers'
 * })
 *
 * exports.getAdminUser = function(id){
 *  return maker2.create({
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

function mergeUrl(basePath = '', path = '') {
	if (!basePath && !path ) {
		return ''
	}else{
		return (basePath + '/' + path).replace(/\/+/g, '/')
	}
}

function isNotEmptyObj(obj) {
	let result = obj && Object.prototype.toString.call(obj) === '[object Object]'
	if (result) {
		for(let k in obj){
			return true
		}
	}
	return false
}


function serialize(obj) {
	if (obj) {
		let arr = []
		for (var k in obj) {
			arr.push(encodeURIComponent(k) + '=' + encodeURIComponent(obj[k]))
		}
		return arr.join('&')
	}
	return null
}

function timeoutPromise(ms) {
	return new Promise(function(resolve, reject) {
		setTimeout(function() {

			let response = {
				ok : false,
				status: 408,
				statusText: 'timeout'
			}
			reject(response)
		}, ms * 1000)
	})
}
function createRemote(url, init, options) {
	const remote = ()=>{
		this.trigger('start')
		const result = Promise.race([fetch(url, init), timeoutPromise(options.timeout)])
		.then((response)=>{
			const isSuccess = response.ok || (response.status >= 200 && response.status < 300)
			if (isSuccess) {
				this.trigger('success', response.clone())
			} else {
				throw response
			}
			this.trigger('complete', response.clone())
			return response.headers.get('content-type') && response.headers.get('content-type').indexOf('json') >= 0 ? response.json() : response
		})
		.catch((response)=> {
			this.trigger('error',  response.clone ? response.clone() : response)
			this.trigger('complete', response.clone ? response.clone() : response)
			throw response
		})
		this.trigger('send')
		return result
	}
	return remote
}

function Remote() {
	this._base = {
		basePath: '',
		requestJSON: true,
		responseJSON: true,
		timeout: 10
	}
	this._handlers = {}
}

Remote.prototype.on = function(type, handler) {
	this._handlers[type] = this._handlers[type] || []
	this._handlers[type].push(handler)
}

Remote.prototype.off = function(type, handler) {
	let i = null
	if (this._handlers[type] && (i = this._handlers[type].indexOf(handler)) >= 0) {
		this._handlers[type].splice(i, 1)
	}
}

Remote.prototype.trigger = function(type, data = {}) {
	if (this._handlers[type]) {
		this._handlers[type].forEach(function(handler) {
			if (isfunc(handler)) {
				handler({type,data})
			}
		})
	}
}

Remote.prototype.create = function(opts) {
	opts = assign({},this._base,opts)
	const init = {
		headers : {}
	}
	const url = typeof opts.url === 'string' || opts.url == null ? mergeUrl(opts.basePath, opts.url || '') : opts.url
	// console.log(url)
	for (let k in opts) {
		if (['url', 'basePath', 'requestJSON', 'responseJSON','timeout','headers'].indexOf(k) < 0) {
			init[k] = opts[k]
		}
	}
	// lowerCase headers key 
	if (opts.headers) {
		const headers = {}
		for(let k in opts.headers){
			headers[k.toLowerCase()] = init.headers[k]
		}
		init.headers = headers
	}

	const method = (opts.method || 'GET').toUpperCase()

	if (method === 'POST') {
		if (opts.requestJSON && !init.headers['content-type']) {
			init.headers['content-type'] = 'application/json'
		}
		if (opts.responseJSON && !init.headers['accept']) {
			init.headers['accept'] = 'application/json'
		}

		if (init.headers['content-type'] && init.headers['content-type'].indexOf('application/json') >= 0 && isNotEmptyObj(init.body)) {
			init.body = JSON.stringify(init.body)
		} else if (!init.headers['content-type'] && (isNotEmptyObj(init.body) || typeof init.body === 'string')) {
			init.headers['content-type'] = 'application/x-www-form-urlencoded'
			if (typeof init.body !== 'string') {
				init.body = serialize(init.body)
			}
		}
	}
	return createRemote.call(this,url, init, opts)
}

Remote.prototype.extend = Remote.prototype.create

Remote.prototype.base = function(options) {
	assign(this._base,options)
}

module.exports = {
	remote : new Remote(),
	Remote
}