var beyondRemote = require('../src/index')
describe("exports", function () {
    it("should have an instance and a instance creat function", function () {
        var remote = beyondRemote.remote
        var Maker = beyondRemote.Remote
        expect(remote instanceof Maker).toEqual(true)
    })

})

describe("remote", function () {
    var beyond = beyondRemote.remote
    var newBeyond = new beyondRemote.Remote
    var basePath = '/base'
    var method = 'POST'
    var credentials = 'include'
    beyond.base({
        basePath: basePath,
        method: method,
        credentials: credentials
    })
    var jsonCall = beyond.create({
        url: '/mock/db.json'
    })
    var htmlCall = beyond.create({
        url: '/mock/db.html'
    })
    var timeoutCall = newBeyond.create({
        url: 'https://api.github.com/events',
        timeout: 0
    })
    it("should fetch with correct url", function (done){
        var remote = new beyondRemote.Remote
        var pathname = '/mock/db.html'
        var basePath = location.protocol + '//' + location.host
        remote.base({
            basePath: basePath + '/'
        })
        var call = remote.create({
            url: pathname
        })
        function handlerComplete(response){
           if(!response.url){
               console.warn('can not find response.url')
               done()
               return
           }
            expect(response.url).toEqual(basePath + pathname)
            done();
        }
        call().then(handlerComplete, handlerComplete)
    })
    it("should works well on json fetch", function (done) {
        expect(typeof jsonCall === 'function').toEqual(true)
        jsonCall().then(function (data) {
            expect(data && typeof data === 'object').toEqual(true)
            done()
        }).catch(function (error) {
            expect(error).toEqual(true)
            done()
        })
    })
    it("should works well on plain text fetch", function (done) {
        expect(typeof htmlCall === 'function').toEqual(true)
        htmlCall()
        .then(function (response) {
            return response.text()
        })
        .then(function (data) {
            expect(data && typeof data === 'string').toEqual(true)
            done()
        })
        .catch(function (error) {
            expect(error).toEqual(true)
            done()
        })
    })
    it("should works well when timeout and it well be a response like data", function (done) {
        expect(typeof  timeoutCall === 'function').toEqual(true)
        var errorFlag = 0;
        timeoutCall()
        .then(function (data) {
            errorFlag = 1;
        })
        .catch(function (data) {
            if (data.status === 408 && data.statusText === 'timeout') {
                errorFlag = 2;
            }
        })
        .then(function () {
            expect(errorFlag).toBe(2);
            done();
        });
    })
})

describe("remote events", function () {
    it("should works on start & send", function () {
        var beyond = new beyondRemote.Remote
        var basePath = '/base'
        var method = 'POST'
        beyond.base({
            basePath: basePath,
            method: method
        })
        var start1 = 0
        var start2 = 0
        var send1 = 0
        var send2 = 0

        var remote1 = beyond.create({
            url: '/mock/db.json'
        })
        beyond.on('start', function () {
            start1++
        })
        beyond.on('start', function () {
            start2++
        })
        beyond.on('send', function () {
            send1++
        })
        beyond.on('send', function () {
            send2++
        })
        remote1()
        expect(start1).toEqual(1)
        expect(start2).toEqual(1)
        expect(send1).toEqual(1)
        expect(send2).toEqual(1)
    })
    it("should works on success & complete", function (done) {
        var beyond = new beyondRemote.Remote
        var basePath = '/base'
        var method = 'POST'
        beyond.base({
            basePath: basePath,
            method: method
        })
        var success = 0
        var complete = 0
        var error = 0
        var remote1 = beyond.create({
            url: '/mock/db.json'
        })
        beyond.on('error', function (data) {
            if (data) {
                error++
            }
        })
        beyond.on('success', function (data) {
            if (data) {
                success++
            }
        })
        beyond.on('complete', function (data) {
            if (data) {
                complete++
            }
        })
        remote1().then(function () {
            expect(success).toEqual(1)
            expect(complete).toEqual(1)
            expect(error).toEqual(0)
            done()
        })

    })
    it("should works on error & complete", function (done) {
        var beyond = new beyondRemote.Remote
        var basePath = '/base'
        var method = 'POST'
        beyond.base({
            basePath: basePath,
            method: method
        })
        var success = 0
        var complete = 0
        var error = 0

        var remote1 = beyond.create({
            url: '/mock/undefined.json'
        })
        beyond.on('error', function (data) {
            if (data) {
                error++
            }
        })
        beyond.on('complete', function (data) {
            if (data) {
                complete++
            }
        })
        remote1().catch(function () {
            expect(success).toEqual(0)
            expect(complete).toEqual(1)
            expect(error).toEqual(1)
            done()
        })
    })
    it("should works on off handle", function () {
        var beyond = new beyondRemote.Remote
        var basePath = '/base'
        var method = 'POST'
        beyond.base({
            basePath: basePath,
            method: method
        })
        var start = 0
        var send = 0
        var remote1 = beyond.create({
            url: '/mock/db.json'
        })

        function startHandle() {
            start++
        }

        function sendHandle() {
            send++
        }

        beyond.on('start', startHandle)
        beyond.on('start', startHandle)
        beyond.on('send', sendHandle)
        beyond.on('send', sendHandle)
        beyond.on('send', sendHandle)
        remote1()
        expect(start).toEqual(2)
        expect(send).toEqual(3)
        beyond.off('start', startHandle)
        beyond.off('send', sendHandle)
        remote1()
        expect(start).toEqual(3)
        expect(send).toEqual(5)
    })

    it("work well when global event and local event both read response body", function (done) {
        var beyond = new beyondRemote.Remote;
        var basePath = '/base'
        var method = 'POST'
        beyond.base({
            basePath: basePath,
            method: method
        })
        var event = 0;
        var remote = beyond.create({
            url: '/mock/null.json'
        })
        beyond.on('error', function (res) {
            console.log(res)
            event++
            // return error.json().then(data => {
            // })
        })
        beyond.on('complete', function (res) {
            console.log(res)
            event++
            // return res.json().then(data => {
            // })
        })
        remote()
        .catch(error => {
            console.log(error)
            event++
            expect(event).toEqual(3)
            done()

            // return error.json().then(data => {
            // })
        })
    })
})

