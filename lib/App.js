var Sequelize = require('sequelize'),
	http = require('http'),
	express = require('express'),
	Class = require('easejs').Class,
	socketIO = require('socket.io'),
	cookieParser = require('cookie-parser'),
	logger = require('morgan'),
	bodyParser = require('body-parser');

module.exports = Class({
	
	// Attributes
		'private app' : null,
		'private port' : null,
		'private router' : null,
		'private database' : null,
		'private server' : null,
		'private io' : null,

	// Methods
		__construct : function(arg1,arg2) {
			var self = this;
			self.app = express();
			self.app.use(logger('dev'));
			self.app.use(cookieParser());
			self.router = express.Router();
			self.port = (process.env.PORT || 3000);
			self.app.use(self.router);
			self.app.use(bodyParser.urlencoded({ extended: true }));
			self.app.use(bodyParser.json());

				
			// Sub-app settings
				if ( arg1 || arg2 ) {
					self.setParent(arg1,arg2);
				}
			// Root app settings
				else {
					// Setting server
					self.server = http.createServer(self.app);
					// Setting Socket.io
					self.io = socketIO(self.server);
					self.app.set('io',self.io);
				}
		},

		'private isRoot' : function() {
			if(this.app.parent) return false;
			return true;
		},

		'private setParent' : function(arg1,arg2) {
			var self = this,
				appParent, appPath;
			appParent = (arg2 || arg1);
			appPath = (arg2 ? arg1 : null);
			if(appPath){
				appParent._getApp().use(appPath,self.app);
			}else{
				appParent._getApp().use(self.app);
			}
			self.database = appParent._getApp().get('database');
			self.io = appParent._getApp().get('io');
		},

		'private dependencies' : function() {
			var self = this;
			return {
				$database : self.database
			};
		},

		'private resolveDependencies' : function(_f) {
			var self = this,
				dependencies = self.dependencies(),
				solvedDependencies = [],
				fDependencies,
				finalResult;
			// Getting dependencies
				fDependencies = _f.toString();
				fDependencies = fDependencies.substring(
					fDependencies.indexOf('(')+1,
					fDependencies.indexOf(')')
				);
				fDependencies = fDependencies.split(',');
			// Solving dependencies
				fDependencies.forEach(function(_dependency) {
					solvedDependencies.push( dependencies[_dependency] );
				});
				finalResult = [];
				for (var i=0;i<solvedDependencies.length;i++) {
					finalResult.push('solvedDependencies['+i+']' );
				}
				finalResult = eval('_f('+finalResult.join(',')+')');
				
			return finalResult;
		},

		'public _getApp' : function() {
			return this.app;
		},

		'public setViewEngine' : function(_config) {
			var self = this;
			self.app.engine(
				_config.extension,
				_config.engine
			);
			self.app.set('view engine',_config.extension);
			self.app.set('views',_config.path);
		},

		'public setPublicDirectory' : function() {
			var self = this,
				prePath = ( (arguments.length>1) ? arguments[0] : '' ),
				publicPath = ( (arguments.length>1) ? arguments[1] : arguments[0] );

			if (prePath) {
				self.app.use(prePath,express.static(publicPath));
			} else {
				self.app.use(express.static(publicPath));
			}

		},

		'public setDatabase' : function(_db,_models) {
			if(this.database) return;
			_models = (_models || function() {});
			var self = this,
				dbSettings;
			// Setting database
				_db.settings = _db.settings || {};
				dbSettings = {
					sync: true,
					syncOnAssociation: true,
					dialect: 'sqlite',
					host: self.ipaddress,
					logging: false,
					storage: 'database.sqlite'
				};
				for(var _s in _db.settings){
					dbSettings[_s] = _db.settings[_s];
				}
				self.database = new Sequelize(_db.name,_db.username,_db.password,dbSettings);
			// Authencitacting
				self.database.authenticate().complete(function(err) {
					if (err) {
						console.log('Unable to connect to the database:', err);
						return;
					}
					console.log('Successful connection to database..');
				});
			// Setting models
				_models(self.database,Sequelize);
			// Syncing database
				self.database.sync({
					// force : true
				}).complete(function(err) {
					if (err) {
						console.log('An error occurred while creating the table:', err);
						return;
					}
					console.log('Successful database synchronization..');
				});
			// Setting database on app
				self.app.set('database',self.database);
		},

		'public addModels' : function(_models) {
			if( !this.database ){
				console.log('Error : No database set, before adding models set a database');
				return;
			}
			var self = this;
			_models(self.database,Sequelize);
			self.database.sync({
				// force : true
			}).complete(function(err) {
				if (err) {
					console.log('An error occurred while creating the table:', err);
					return;
				}
				console.log('Successful database synchronization..');
			});
		},

		'public addRoute' : function(_route) {
			var self = this,
				rSettings;
			// Settings
				_route = self.resolveDependencies(_route);
				rSettings = {};
				rSettings.method = _route.method || 'GET';
				rSettings.method = rSettings.method.toLowerCase();
				rSettings.callback = _route.callback;
				self.router[rSettings.method](
					_route.path,
					_route.callback
				);
		},

		'public socket' : function(_socketF){
			var self = this;
			_socketF(self.io);
		},

		'public start' : function() {
			if( !this.isRoot() ) return;
			var self = this;
			self.server.listen(self.port, function(){
				console.log('Server up at port '+self.port);
			});
		},

		'public stop' : function(){
			var self = this;
			self.server.close();
		},

		'public install' : function(_pathOrInstaller,_installer) {
			if (typeof _pathOrInstaller == 'string') _installer(_pathOrInstaller,this);
			else _pathOrInstaller(this);
		}

});
