# beyond remote

用于封装ajax和fetch请求，此库依赖promise，推荐使用 [es6-promise](https://www.npmjs.com/package/es6-promise) ，ie8 还需要引入 es5-shim 

## 0.2.0 特性
增加全局事件，支持所有 remote 实例 
增加持续性请求事件 ，如 complete 事件会监测是否所有的请求都已经完成
增加返回数据自动转换为 json 格式 ，类似 jquery.ajax 的 dataType : 'json'

增加文件上传

## 基本使用
```javascript
var remote = require('beyond-remote').remote

//default base params
remote.base({
	basePath : '',
	requestJSON : true,
	responseJSON : true,
	timeout : 10
})

var getUsers = remote.create({
	url : '/user/list'
})

var getUser = function(id){
	var call = remote.create({
		url : '/user/detail',
		headers : {
			'Content-Type' : 'application/json'
		},
		body : {id : 1}
	})
	return call()
}

getUsers().then(function(json){
	console.log(json)
}).catch(function(error){
    console.log(error)
})

getUser(1).then(function(json){
	console.log(json)
}).catch(function(error){
      console.log(error)
  })
```
`requestJSON` 为 true 且没有设置`content-type`的情况下， 会设置 `content-type` 为 `application/json` ，并会将 object 类型的 body 通过 `JSON.stringify` 转化 json 格式字符串

`responseJSON` 为 true 且没有设置`content-type`的情况下， 会设置 `Accept` 为 `application/json`

如果返回 headers 的 `content-type` 为  `application/json` , 则自动将返回数据做json转换

如果 body 的内容是 `FormData` 类型 , 请将 `requestJSON` 设为`false` , 并推荐不指定 content-type 

## 高级

注册请求的全局事件
```javascript
var remote = require('beyond-remote').remote
remote.on('start',startHandle)
remote.on('send',sendHandle)
remote.on('success',successHandle)
remote.on('error',errorHandle)
remote.on('complete',completeHandle)

var getUser = remote.create({
	url : '/getUser'
})

getUser() //事件发生顺序依次为  start 异步请求api end; 异步请求状态码status  200<= status <300 , 触发 success ，否则触发 error ，最终触发complete

```

获取新的 remote 实例,强烈建议根据不同的api basePath 定义remote实例
```javascript
var remote = require('beyond-remote').remote
remote.base({basePath : '/api'})
remote.on('send',sendHandle)


var remote2 = require('beyond-remote').create()
remote2.base({basePath : '/api2'})
remote2.on('start',startHandle)
```