## beyond remote

用于封装ajax和fetch请求，此库依赖promise，推荐使用 [es6-promise](https://www.npmjs.com/package/es6-promise) ，ie8 还需要引入 es5-shim 


### 使用方式

#### 基本使用
```javascript
var remote = require('beyond-remote').remote

//default base params
remote.base({
	basePath : '',
	method : 'GET',
	requestJSON : true,
	responseJSON : true
})

var getUsers = remote.extend({
	url : '/user/list'
})

var getUser = function(id){
	return remote.extend({
		url : '/user/detail',
		headers : {
			'Content-Type' : 'application/json'
		},
		body : {id : 1}
	})
}

getUsers().then(function(json){
	console.log(json)
})

getUser(1).then(function(json){
	console.log(json)
})
```
`requestJSON` 会设置 `Content-Type` 为 `application/json` 如果 Content-Type 没有指定，并会将 object 类型的 body 通过 `JSON.stringify` 转化 json 格式字符串

`responseJSON` 会设置 `Accept` 为 `application/json`

如果返回 headers 的 `Content-Type` 为  `application/json` , 则自动将返回数据做json转换

#### 高级

注册请求的全局事件
```javascript
var remote = require('beyond-remote').remote
remote.on('start',startHandle)
remote.on('send',sendHandle)
remote.on('success',successHandle)
remote.on('error',errorHandle)
remote.on('complete',completeHandle)

var getUser = remote.extend({
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