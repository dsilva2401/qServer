Api Reference
=============

- [Initialize app](#initialize-app)
- [Settings](#settings)
    - [`.setDatabase`](#setdatabase)
    - [`.addModels`](#addModels)
    - [`.setViewEngine`](#setviewengine)
    - [`.setPublicDirectory`](#setpublicdirectory)
- [Router](#router)
    - [`.addRoute`](#addroute)
- [Install apps](#install-apps)
    - [App installer](#app-installer)
    - [`.install`](#install)
- [Sockets](#sockets)
    - [`.socket`](#socket)
- [Dependencies](#dependencies)
    - [`$database`](#database)

## Initialize app
Installation
```bash
npm install qserver
```
Setup app
```js
var qServer = require('qserver'),
    App = qServer.App,
    app = new App();
```

## Settings
#### `.setDatabase`
Like wrapper uses sequelize, so it uses [Sequelize configuration](http://sequelizejs.com/docs/1.7.8/usage#basics).
To set models, it get a function that recieves sequelize instance and data-types and return models.
```js
app.setDatabase(
    // Sequelize configuration
    {
        name : 'tablename',
        username : 'username',
        password : 'password',
        settings : {
            dialect : 'postgres', // Default: sqlite
            port: 5432,
            ..      (other Sequelize settings)
        }
    },
    // Models
    function(sequelize,DataTypes){
        var models = {};
        models.User = sequelize.define('User', {
            name: DataTypes.STRING
        });
        return models;
    }
);
```
#### `.addModels`
`.addModels` adds new models to database
```js
app.addModels(
    function(sequelize,DataTypes){
        var models = {};
        models.Task = sequelize.define('Task', {
            title: DataTypes.STRING,
            details: DataTypes.STRING
        });
        return models;
    }
);
```

#### `.setViewEngine`
`.setViewEngine`  method sets view engine and views path, it recieves an object with attributes `path`, `extension` and `engine`.
'path' attribute sets the views path, `extension` is the file's to render extension and `engine` is the view engine.
```js
app.setViewEngine({
    path : __dirname+'/views',
    extension : 'jade',
    engine : require('jade').__express
});
```
#### `.setPublicDirectory`
`.setPublicDirectory`  method the public directory path
```js
app.setPublicDirectory(__dirname + '/public');
```

## Router
#### `.addRoute`
`.addRoute` method works with dependency injection, it recieves a function with dependencies to resolve and returns the route configuration
```js
app.addRoute(function(){ // Function recieves dependencies like $database
    return {   
        method : 'POST', // Default: GET
        path : '/new/path',
        callback : function(request,response){
            ...
        }
    };
})
```

## Install apps
You can also compose other apps eith your main app
#### App installer
Tha app installer is the function that contains app to be installed, this function recieves app that will be composed (`parent`).
```js
var subAppInstaller = function(parent){
    // Sub-app
    var subApp = new App(parent);
    // Sub-app route
    subApp.addRoute(function() {
        ...
    });
};
```
If app should be installed inside a costum path it also should be recived as a parameter before `parent`. Route paths inside sub-app will be after path sent by installer function.
```js
var subAppInstallerWithPath = function(path,parent){
    // Sub-app
    var subApp = new App(path,parent);
    // Sub-app route
    subApp.addRoute(function() {
        ...
    });
};
```

#### `.install`
This is how we will install sub-apps
```js
// Without using path
app.install(subAppInstaller);
// Using path
app.install('/sub-app',subAppInstallerWithPath);
```

## Sockets
Based on [Socket.io](http://socket.io/docs/).
#### `.socket`
Receives a function as a paramater, that function receives the $io server instance though dependency injection
```js
app.socket( function($io) {
    $io.on('connection', function (socket) {
        socket.emit('news', { hello: 'world' });
        socket.on('my other event', function (data) {
            console.log(data);
        });
    }); 
});
```

## Dependencies
Wrapper works with dependency injection, here we list available dependencies
#### `$database`
#### `$io`
