var beyondRemote = require('../src/index')
describe("exports",function() {
	it("should have an instance and a instance creat function",function(){
		var constructor = beyondRemote.remote.constructor
		var remote2 = beyondRemote.create()
		expect(beyondRemote.remote instanceof constructor).toEqual(true)
		expect(remote2 instanceof constructor).toEqual(true)
		expect(remote2.constructor === constructor)
		expect(typeof beyondRemote.create === 'function').toEqual(true)
	})

})

describe("remote",function() {
	var beyond = beyondRemote.remote
	var basePath = '/base'
	var method = 'POST'
	beyond.base({
		basePath : basePath,
		method :  method
	})
	var jsonCall = beyond.extend({
		url : '/mock/db.json'
	})
	var htmlCall = beyond.extend({
		url : '/mock/db.html'
	})
	it("should works well on base",function(){
		var base = beyond.base()
		expect(base.basePath).toEqual(basePath)
		expect(base.method).toEqual(method)
	})
	it("should works well on json fetch",function(done){
		expect(typeof jsonCall === 'function').toEqual(true)
		jsonCall().then(function(data){
			expect(data && typeof data === 'object').toEqual(true)
			done()
		})
	})
	it("should works well on plain text fetch",function(done){
		expect(typeof htmlCall === 'function').toEqual(true)
		htmlCall().then(function(data){
			expect(data && typeof data === 'string').toEqual(true)
			done()
		})
	})
})

describe("remote events",function(){
	it("should works on start & send",function(){
		var beyond = beyondRemote.create()
		var basePath = '/base'
		var method = 'POST'
		beyond.base({
			basePath : basePath,
			method :  method
		})
		var start1 = 0
		var start2 = 0 
		var send1 = 0
		var send2 = 0


		var remote1 = beyond.extend({
			url : '/mock/db.json'
		})
		beyond.on('start',function(){
			start1++
		})
		beyond.on('start',function(){
			start2++
		})
		beyond.on('send',function(){
			send1++
		})
		beyond.on('send',function(){
			send2++
		})
		remote1()
		expect(start1).toEqual(1)
		expect(start2).toEqual(1)
		expect(send1).toEqual(1)
		expect(send2).toEqual(1)
	})
	it("should works on success & complete",function(done){
		var beyond = beyondRemote.create()
		var basePath = '/base'
		var method = 'POST'
		beyond.base({
			basePath : basePath,
			method :  method
		})
		var success = 0
		var complete = 0
		var error = 0
		var remote1 = beyond.extend({
			url : '/mock/db.json'
		})
		beyond.on('success',function(){
			success++
		})
		beyond.on('complete',function(){
			complete++
		})
		remote1().then(function(){
			expect(success).toEqual(1)
			expect(complete).toEqual(1)
			expect(error).toEqual(0)
			done()
		})

	})
	it("should works on error & complete",function(){
		var beyond = beyondRemote.create()
		var basePath = '/base'
		var method = 'POST'
		beyond.base({
			basePath : basePath,
			method :  method
		})
		var success = 0
		var complete = 0
		var error = 0

		var remote1 = beyond.extend({
			url : '/mock/undefined.json'
		})
		beyond.on('error',function(){
			success++
		})
		beyond.on('complete',function(){
			complete++
		})
		remote1().catch(function(){
			expect(success).toEqual(0)
			expect(complete).toEqual(1)
			expect(error).toEqual(1)
			done()			
		})
	})
	it("should works on off handle",function(){
		var beyond = beyondRemote.create()
		var basePath = '/base'
		var method = 'POST'
		beyond.base({
			basePath : basePath,
			method :  method
		})
		var start = 0
		var send = 0
		var remote1 = beyond.extend({
			url : '/mock/db.json'
		})

		function startHandle(){
			start++
		}
		function sendHandle() {
			send++
		}
		beyond.on('start',startHandle)
		beyond.on('start',startHandle)
		beyond.on('send',sendHandle)
		beyond.on('send',sendHandle)
		beyond.on('send',sendHandle)
		remote1()
		expect(start).toEqual(2)
		expect(send).toEqual(3)
		beyond.off('start',startHandle)
		beyond.off('send',sendHandle)
		remote1()
		expect(start).toEqual(3)
		expect(send).toEqual(5)
	})
})