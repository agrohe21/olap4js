
/**
*
*  This is olap4js - a javascript library for working with OLAP datasources.
*  @module olap
*  @title Olap
*/
(function olap(global){

	var olap; if (typeof exports !== 'undefined') {olap = exports;} else {olap = global.olap = {};} //olap module boiler plate

	/** olap.Connection
	*   olap.Connection is a connection to an OLAP data source.
	*   @class olap.Connection
	*   @constructor
	*   @param connection Object literal with properties to be created
	**/
	olap.Connection = function Connection($connection){
		//console.debug('func Call: ' + arguments.callee.name);		
		var src = {}, that=this;
		this.sources = [];
		if ($connection instanceof Object) { //have we been passed a valid JS object?
			if ($connection.sources instanceof Array) {
				for (var idx in $connection.sources){
					src = $connection.sources[idx];	
					this.addDataSource(src);
				}
			}
		}
		this.id = olap.Connection.id++;
		olap.Connection.instances[this.id] = this;		
	}
	olap.Connection.id = 1;
	olap.Connection.prefix = "olap.Connection";
	olap.Connection.instances = {};
	olap.Connection.getInstance = function(id){
	    return olap.Connection.instances[id];
	};
	olap.Connection.prototype = {
		/**
		* returns a list of all databases
		* @method getOlapDatabases
		* @param {function} callback A function to call after the databases have been retrieved from the OLAP server
		*/
		getOlapDatabases: function getOlapDatabases(callback){
			if (this.sources.length ==0) {
				var sources = this.fetchOlapDatasources() //function(sources){
				if (callback && typeof callback == 'function') {
					callback.call(this, sources);
				} else {
				    return sources;
				}
				//});
			} else {
				if (callback && typeof callback == 'function') {
					callback.call(this, this.sources);
				} else {
				    return sources;
				}
			}
			return this.sources;
		},
		fetchOlapDatasources: function fetchOlapDatasources(callback){
			//empty function that does not fetch anything
			throw new Error('You must provide an implementation for: ' + arguments.callee.name)
		},
		addDataSource: function addDataSource(source, callback) {
			if ((source instanceof Object) && (source instanceof olap.Datasource == false)) { //do we have an object as param and it is not already a Datasource
				source = new olap.Datasource(source, this);
			}
			this.sources.push(source);
			if (callback && typeof callback == 'function') {
				callback.call(this, source);
			}
			return source;
		},
		/**
		* executes an MDX statement
		* @method executeOlapQuery
		*/
		executeOlapQuery: function executeOlapQuery(options){
			//just do the default for now
			console.warn('Default execute being used');
			return new olap.CellSet({});
		},
		/**
		* Describes the structure of cubes within a database
		* @method getCubes
		* @param {function} callback A function to call after the cubes have been retrieved from the OLAP server
		*/
		getCubes: function getCubes(callback) {
		
			var idx_ds, idx_cat, sources, source, catalogs, catalog, cubes, cube, _cubes = [];
			//this.getOlapDatabases(function(sources){
			sources = this.getOlapDatabases();
			for (idx_ds in sources) {
				source = sources[idx_ds];
				catalogs = source.getCatalogs();
					for (idx_cat in catalogs){
						catalog = catalogs[idx_cat];
						cubes = catalog.getCubes();
						_cubes = _cubes.concat(cubes);
					}
			}
			if (typeof callback == 'function') {
				callback.call(this, _cubes);
			} else {
				return _cubes;
			}
			//})    
		},
		//Probably get rid of this so we just have getCubes and then getMetadata for each cube.
		getLevels: function getLevels(callback) {
		
			var getLevelsInDatasource = function getLevelsInDatasource(sources){
				var idx, source, catalogs, catalog, cubes, cube, dimensions, dimension, hierarchy, hierarchies, levels, level, _levels = [];
				for (idx in sources) {
				source = sources[idx];
				catalogs = source.getCatalogs();
					for (idx in catalogs){
						catalog = catalogs[idx];
						cubes = catalog.getCubes();
						for (idx in cubes){
							cube = cubes[idx];
							measures = cube.getMeasures();
							for (idx in measures){
								measure = measures[idx];
							}
							dimensions = cube.getDimensions();
							for (idx in dimensions){
								dimension = dimensions[idx];
								hierarchies = dimension.getHierarchies();
								for (idx in hierarchies){
									hierarchy = hierarchies[idx];
									levels = hierarchy.getLevels();
									/*
									for (idx in levels){
										level = levels[idx];
										//members = level.getMembers();
										//for (idx in members){
										//member = members[idx];
									}*/	    
									_levels = _levels.concat(levels);
								}	    
							}	    
						}
					}
				}
				return _levels;
			}
			this.getOlapDatabases(function(sources){
				var lvls = getLevelsInDatasource(sources);
				if (typeof callback == 'function') {
					callback.call(this, lvls);
				} else {
					return lvls;
				}
			})    
		}	
	}
	
	/** olap.Datasource
	* A Datasource is the highest level element in the hierarchy of metadata objects. A database contains one or more catalogs.
	* Some OLAP servers may only have one database. Mondrian is one such OLAP server.
	* To obtain the collection of databases in the current server, call the olap.Connection.getOlapDatabases() method.
	*   @class olap.Datasource
	*   @constructor
	*   @param {Object} source JS object representing object properties.  Often used to rehydrate objects after external persistence
	*   @param {olap.Connection} conn The olap.Connection instance to be used to communicate with the server
	**/
	olap.Datasource = function Datasource(source, $conn) {
		this.catalogs = [];
		if (source instanceof Object) { //have we been passed a valid JS object?
			this.DATA_SOURCE_DESCRIPTION = source.DATA_SOURCE_DESCRIPTION || "";
			this.DATA_SOURCE_NAME        = source.DATA_SOURCE_NAME || "";
			this.DATA_SOURCE_INFO        = source.DATA_SOURCE_INFO || "";
			this.PROVIDER_NAME           = source.PROVIDER_NAME   || "";
			this.PROVIDER_TYPE           = source.PROVIDER_TYPE || "";
			this.URL                     = source.URL            || "";
			this.AUTHENTICATION_MODE     = source.AUTHENTICATION_MODE || "";
			if (source.catalogs instanceof Array) {
				for (var idx in source.catalogs){
					cat = source.catalogs[idx];	
					this.addCatalog(cat);
				}
			}
		}
		
		this.connection = $conn;
		this.id = olap.Datasource.id++;
		olap.Datasource.instances[this.id] = this;		
	}
	olap.Datasource.id = 1;
	olap.Datasource.instances = {};
	olap.Datasource.prefix = "olap.Datasource";
	olap.Datasource.getInstance = function(id){
	    return olap.Datasource.instances[id];
	};	
	olap.Datasource.prototype = {
		/**
		* returns the current connection
		* @method getOlapConnection
		*/
		getOlapConnection: function getOlapConnection() {
			return this.connection;
		},
		/**
		* returns the name of this database
		* @method getName
		*/
		getName: function getName() {
			return this.DATA_SOURCE_NAME;
		},
		/**
		* returns the description of this database
		* @method getDescription
		*/
		getDescription: function getDescription() {
			return this.DATA_SOURCE_DESCRIPTION;
		},
		/**
		* returns the name of the underlying OLAP provider
		* @method getProviderName
		*/
		getProviderName: function getProviderName() {
			return this.PROVIDER_NAME;
		},
		/**
		* returns the redirection URL, if this database is a proxy to another server
		* @method getURL
		*/
		getURL: function getURL() {
			return this.URL;
		},
		/**
		* returns provider-specific information
		* @method getDataSourceInfo
		*/
		getDataSourceInfo: function getDataSourceInfo() {
			return this.DATA_SOURCE_INFO;
		},
		/**
		* returns the types of data that are supported by this provider
		* @method getProviderTypes
		*/
		getProviderTypes: function getProviderTypes() {
			return this.PROVIDER_TYPE;
		},
		/**
		* returns the modes of authentication that are supported by this provider
		* @method getAuthenticationModes
		*/
		getAuthenticationModes: function getAuthenticationModes() {
			return this.AUTHENTICATION_MODE;
		},
		/**
		* returns a list of catalogs in this database
		* @method getCatalogs
		*/
		getCatalogs: function getCatalogs() {
			if (this.catalogs.length == 0) {
				this.fetchCatalogs();
			}
			return this.catalogs;
		},
		fetchCatalogs: function fetchCatalogs() {	
			//empty function that does not fetch anything
		},
		addCatalog: function addCatalog(catalog, callback) {
			if ((catalog instanceof Object) && (catalog instanceof olap.Catalog == false)) { //do we have an object as param and it is not already a Catalog
				catalog = new olap.Catalog(catalog, this);
			}
	
			this.catalogs.push(catalog);
			if (typeof callback == 'function') {
				callback(catalog);
			}
			return catalog;
			
		}
	} // olap.Datasource.prototype
	
	/** olap.Catalog
	 * A Catalog is the second highest level element in the hierarchy of metadata objects. A catalog belongs to a database and contains one or more schemas.
	 * Some OLAP servers may only have one catalog. Mondrian is one such OLAP server; its sole catalog is always called "LOCALDB".
	 * To obtain the collection of catalogs in the current server, call the olap.Connection.getOlapCatalogs() method.
	*   @class olap.Catalog
	*   @constructor
	*   @param {Object} Catalog Object representing object properties.  Often used to rehydrate objects after external persistence
	*   @param {olap.Datasource} Datasource The olap.Datasource that this catalog belongs to
	*/
	olap.Catalog = function Catalog($catalog, $ds) {
	var catalog = $catalog || {cubes:[]};
		this.CATALOG_NAME  = catalog.CATALOG_NAME  || "";
		this.DATE_MODIFIED = catalog.DATE_MODIFIED || "";
		this.DESCRIPTION   = catalog.DESCRIPTION   || "";
		this.ROLES         = catalog.ROLES         || [];
		this.cubes         =  [];
		if (catalog.cubes instanceof Array) {
			for (var idx in catalog.cubes){
				var cube = catalog.cubes[idx];	
				this.addCube(cube);
			}
		}
		this.schemas = [];
		this.datasource    = $ds;
		this.id = olap.Catalog.id++;
		olap.Catalog.instances[this.id] = this;				
	}
	olap.Catalog.id = 1;
	olap.Catalog.instances = {};
	olap.Catalog.prefix = "olap.Catalog";
	olap.Catalog.getInstance = function(id){
	    return olap.Catalog.instances[id];
	};		
	olap.Catalog.prototype = {
		/**
		* returns the name of this catalog
		* @method getName
		*/
		getName: function getName() {
				return this.CATALOG_NAME;
		},
		/**
		* returns a list of schemas in this catalog
		* @method getSchemas
		*/
		getSchemas: function getSchemas() {
				return this.schemas;
		},
		/**
		* returns this catalog's parent database
		* @method getDatabase
		*/
		getDatabase: function getDatabase() {
				return this.datasource;
		},
		addCube: function addCube(cube, callback) {
			if ((cube instanceof Object) && (cube instanceof olap.Cube == false)) { //do we have an object as param and it is not already a Catalog
				cube = new olap.Cube(cube, this);
			}
	
			this.cubes.push(cube);
			if (typeof callback == 'function') {
				callback(cube);
			}
			return cube;		
		},
 		/**
		* returns a list of cubes in this catalog
		* @method getCubes
		*/
		getCubes: function getCubes() {
			if (this.cubes.length == 0) {
				this.fetchCubes();
			}
			return this.cubes;
		},
		fetchCubes: function fetchCubes() {	
			//empty function that does not fetch anything
			throw new Error('You must provide an implementation for: ' + arguments.callee.name)
		}
	}
	
	/** olap.Schema
	*   A Schema is a collection of database objects that contain structural information, or metadata, about a database.
	*   It belongs to a catalog and contains a number of cubes and shared dimensions
	*   @class olap.Schema
	*   @constructor
	*   @param {Object} Schema Object representing object properties.  Often used to rehydrate objects after external persistence
	*   @param {olap.Catalog} catalog The olap.Catalog that this Schema belongs to
	*/
	olap.Schema = function Schema($schema, $cat) {
		var cube = $cube || {};
		this.SCHEMA_NAME = cube.SCHEMA_NAME;
		this.CATALOG_NAME = cube.CATALOG_NAME;
		this.catalog    = $cat || {};
		this.id = olap.Schema.id++;
		olap.Schema.instances[this.id] = this;
	}
	olap.Schema.id = 1;
	olap.Schema.instances = {};
	olap.Schema.prefix = "olap.Schema";
	olap.Schema.getInstance = function(id){
	    return olap.Schema.instances[id];
	};
	olap.Schema.prototype = {}
	
	/** olap.Cube
	*   A Cube is the central metadata object for representing multidimensional data.
	*   It belongs to an olap.Schema, and is described by a list of dimensions and a list of measures. It may also have a collection of named sets, each defined by a formula.
	*   @class olap.Cube
	*   @constructor
	*   @param {Object} Cube Object representing object properties.  Often used to rehydrate objects after external persistence
	*   @param {olap.Catalog} catalog The olap.Catalog that this Cube belongs to
	*/
	olap.Cube = function Cube($cube, $cat) {
		var cube = $cube || {};
		this.CUBE_NAME   = cube.CUBE_NAME || "";
		this.CUBE_TYPE   = cube.CUBE_TYPE || "CUBE";
		this.DESCRIPTION = cube.DESCRIPTION || "";
		this.IS_DRILLTHROUGH_ENABLED = cube.IS_DRILLTHROUGH_ENABLED == 'true' ? true : false;
		this.IS_LINKABLE = cube.IS_LINKABLE           == 'true' ? true : false;
		this.IS_SQL_ENABLED = cube.IS_SQL_ENABLED     == 'true' ? true : false;
		this.IS_WRITE_ENABLED = cube.IS_WRITE_ENABLED == 'true' ? true : false;
		this.LAST_SCHEMA_UPDATE = cube.LAST_SCHEMA_UPDATE || "";
		this.sets       = [];
		this.measures   = [];
		this.dimensions = [];
		this.SCHEMA_NAME = cube.SCHEMA_NAME;
		this.CATALOG_NAME = cube.CATALOG_NAME;
		this.catalog    = $cat || {};
		this.id = olap.Cube.id++;
		olap.Cube.instances[this.id] = this;
	}
	olap.Cube.id = 1;
	olap.Cube.instances = {};
	olap.Cube.prefix = "olap.Cube";
	olap.Cube.getInstance = function(id){
	    return olap.Cube.instances[id];
	};
	olap.Cube.getInstanceByName = function(CUBE_NAME, CATALOG_NAME){
		var cubes = olap.Cube.instances, cube;
		for (cube in cubes){
			if (cubes[cube].getName() == CUBE_NAME && cubes[cube].CATALOG_NAME == CATALOG_NAME){
				return cubes[cube];
			}
		}
		//Should only get here if no cubes match string
		return null;
	}
	olap.Cube.prototype = {
 		/**
		* returns a Cube's parent olap.Schema
		* @method getCatalog
		*/
		getCatalog: function getCatalog(){
		    return this.catalog;
		},
 		/**
		* returns a Cube's parent olap.Schema
		* @method getSchema
		*/
		getSchema: function getSchema() {
			//TODO this should be a schema object not just the name
			return this.SCHEMA_NAME;
		},
		/**
		* returns the name of this Cube
		* @method getName
		*/
		getName: function getName() {
			return this.CUBE_NAME;
		},
		/**
		* returns the description of this cube
		* @method getDescription
		*/
		getDescription: function getDescription() {
			return this.DESCRIPTION;
		},
		addDimension: function addDimension(dimension, callback) {
			//console.debug('func Call: ' + arguments.callee.name);
			if (dimension instanceof Object) {
				if (dimension instanceof olap.Dimension == false) {
					dimension = new olap.Dimension(dimension, this);
				}
				this.dimensions.push(dimension);
				if (typeof callback == 'function') {
					callback(dimension);
				} 
			}
				
			return dimension;
		},
		addMeasure: function addMeasure(measure, callback) {
			if (measure instanceof Object) {
				if (measure instanceof olap.Measure == false){
					measure = new olap.Measure(measure, this);
				}
				this.measures.push(measure);
				if (typeof callback == 'function') {
					callback(measure);
				}				
			}
			return measure;
		},
		/**
		* returns the hierarchy in this cube with a specific UNIQUE_NAME
		* @method getHierarchyByUniqueName
		* @return {olap.Hierarchy}
		* @param {String} UNIQUE_NAME
		*/
		getHierarchyByUniqueName: function getHierarchyByUniqueName(HIERARCHY_UNIQUE_NAME){
			//console.debug('func Call: ' + arguments.callee.name);
			//console.debug(HIERARCHY_UNIQUE_NAME);
			for (var i=0, j=this.dimensions.length;i<j;i++){
				var dim = this.dimensions[i];
				for (var h=0, k=dim.hierarchies.length;h<k;h++){
					var hier = dim.hierarchies[h];
					if (hier.HIERARCHY_UNIQUE_NAME == HIERARCHY_UNIQUE_NAME) {
						return hier;
					}
				}
			}
			throw new Error('no match for: ' + LEVEL_UNIQUE_NAME + ':' + HIERARCHY_NAME)
			return null;			
		},
		/**
		* returns the level in this cube with a specific LEVEL_UNIQUE_NAME and HIERARCHY_UNIQUE_NAME
		* @method getLevelByUniqueName
		* @return {olap.Level}
		* @param {String} LEVEL_UNIQUE_NAME
		* @param {String} HIERARCHY_UNIQUE_NAME
		*/
		getLevelByUniqueName: function getLevelByUniqueName(LEVEL_UNIQUE_NAME, HIERARCHY_NAME){
			//console.debug('func Call: ' + arguments.callee.name);
			//console.debug(LEVEL_UNIQUE_NAME +':' + HIERARCHY_NAME);
			
			if (HIERARCHY_NAME == 'Measures') {
				return {LEVEL_UNIQUE_NAME:LEVEL_UNIQUE_NAME,HIERARCHY_UNIQUE_NAME:HIERARCHY_NAME};
			} else {
				for (var i=0, j=this.dimensions.length;i<j;i++){
					var dim = this.dimensions[i];
					for (var h=0, k=dim.hierarchies.length;h<k;h++){
						var hier = dim.hierarchies[h];
						if (hier.HIERARCHY_NAME == HIERARCHY_NAME) {
							for (var z=0, y=hier.levels.length;z<y;z++){
								var lvl = hier.levels[z];
								if (lvl.LEVEL_UNIQUE_NAME == LEVEL_UNIQUE_NAME){
									return lvl;
								}
							}
						}
					}
				}
			}
			throw new Error('no match for: ' + LEVEL_UNIQUE_NAME + ':' + HIERARCHY_NAME)
			return null;			
		},
 		/**
		* returns a list of olap.Measures in this cube
		* @method getMeasures
		*/ 
		getMeasures: function getMeasures() {
			if (this.measures.length == 0) {
				return this.fetchMeasures();
			} else {
				return this.measures;
			}
		},
		fetchMeasures: function fetchMeasures() {	
			//empty function that does not fetch anything
			throw new Error('You must provide an implementation for: ' + arguments.callee.name)
		},
 		/**
		* returns a list of olap.Dimensions in this cube
		* @method getDimensions
		*/ 
		getDimensions: function getDimensions() {
			if (this.dimensions.length == 0) {
				var processDimensions = function processDimensions(dimensions){
					return this.dimensions;
				};
				this.fetchDimensions(processDimensions);
			} else {
				return this.dimensions;
			}
		},
 		/**
		* returns a list of olap.Hierarchies in this cube
		* @method getHierarchies
		*/ 
		getHierarchies: function getHierarchies() {
			var dims = this.getDimensions();
			if (dims.length !== 0) {
					var i, _hiers, hiers=[];
					for (i=0, j=dims.length;i<j;i++){
						_hiers = dims[i].getHierarchies();
						hiers = hiers.concat(_hiers);
					}
					return hiers;
			}
			return [];
		},
		fetchDimensions: function fetchDimensions() {	
			//empty function that does not fetch anything
			throw new Error('You must provide an implementation for: ' + arguments.callee.name)
		},
 		/**
		* recursively gets all metadata (except for olap.Members) in this cube
		* @method getMetadata
		*/  
		getMetadata: function getMetadata(){
			var idx_dim, idx_hier, dimensions, dimension, hierarchy, hierarchies, levels, level, measures, measure, meta= {};
			dimensions = this.getDimensions();
			for (idx_dim in dimensions){
				dimension = dimensions[idx_dim];
				hierarchies = dimension.getHierarchies();
				for (idx_hier in hierarchies){
					hierarchy = hierarchies[idx_hier];
					levels = hierarchy.getLevels();
					/*
					for (idx in levels){
						level = levels[idx];
						members = level.getMembers();
						for (idx in members){
							member = members[idx];
						}
					}*/
				}
			}
			meta.dimensions = dimensions;
			meta.measures   = this.getMeasures();
			return meta;			
		} //end getMetadata
	}
	
	/** olap.Measure
	*   <p>
	*   Wrapper for OLAP Measures
	*   </p>
	*   @class olap.Measure
	*   @constructor
	*   @param {Object} JS object representing object properties.  Often used to rehydrate objects after external persistence
	*   @param {olap.Cube} cube The olap.Cube that this Measure belongs to
	*/ 
	olap.Measure = function Measure($measure, $cube) {
		var measure = $measure || {};
		this.DATA_TYPE             = measure.DATA_TYPE || 0;
		this.DEFAULT_FORMAT_STRING = measure.DEFAULT_FORMAT_STRING || ""
		this.DESCRIPTION        = measure.DESCRIPTION || "";
		this.MEASURE_AGGREGATOR = measure.MEASURE_AGGREGATOR || 0;
		this.MEASURE_IS_VISIBLE = measure.MEASURE_IS_VISIBLE || false;
		this.MEASURE_NAME       = measure.MEASURE_NAME || "";
		this.MEASURE_UNIQUE_NAME= measure.MEASURE_UNIQUE_NAME || "";
		this.CUBE_NAME          = measure.CUBE_NAME;
		this.SCHEMA_NAME        = measure.SCHEMA_NAME;
		this.CATALOG_NAME       = measure.CATALOG_NAME;
		this.cube = $cube
		this.id = olap.Measure.id++;
		olap.Measure.instances[this.id] = this;		
		
	}
	olap.Measure.id = 1;
	olap.Measure.instances = {};
	olap.Measure.prefix = "olap.Measure";
	olap.Measure.getInstance = function(id){
	    return olap.Measure.instances[id];
	};
	olap.Measure.validMethods = ['Value'];
	olap.Measure.sugarMethods = ['Self'];
	olap.Measure.isBasicMethod = function(method){
		
		var idx;
		for (idx in this.validMethods){
			if (this.validMethods[idx] == method) {
				return true;
			}
		}		
	}
	olap.Measure.isMethodValid = function(method){
		//console.debug('func Call: ' + arguments.callee.name + method);	
		if (this.isBasicMethod(method) == true){
			return true;
		}
		var idx;
		for (idx in this.sugarMethods){
			if (this.sugarMethods[idx] == method) {
				return true;
			}
		}
		//if we get here the method is not valid
		return false;
		
	}
	olap.Measure.prototype = {
		toMDX: function toMDX(method, param){
			if (olap.Measure.isBasicMethod(method)) {
				return this.getUniqueName() + '.' + method
			}
			else {
				if (method == 'Self'){
					return this.getUniqueName();
				}
				return "";
			}
		}, 
		/**
		* returns the name of this Measure's parent Hierarchy
		* @method getName
		* @return {olap.Hierarchy}
		*/
		getHierarchy: function () {
			return new olap.Hierarchy({HIERARCHY_NAME:'Measures', HIERARCHY_UNIQUE_NAME:'[Measures]'});
		},
 		/**
		* returns the name of this Measure
		* @method getName
		* @return {String}
		*/
		getName: function () {
			return this.MEASURE_NAME;
		},
 		/**
		* returns the unique name of this Measure within the cube
		* @method getUniqueName
		* @return {String}
		*/
		getUniqueName: function () {
			return this.MEASURE_UNIQUE_NAME;
		}
	}
	
	/** olap.Dimension
	*   An organized hierarchy of categories, known as levels, that describes data in a cube.
	*   A Dimension typically describes a similar set of members upon which the user wants to base an analysis
	*   A Dimension must have at least one Hierarchy, and may have more than one.
	*   @class olap.Dimension
	*   @constructor
	*   @param {Object} Dimension object representing object properties.  Often used to rehydrate objects after external persistence
	*   @param {olap.Cube} Cube The cube that this Dimension belongs to
	*/
	olap.Dimension = function Dimension($dim, $cube) {
		var dim = $dim || {};
		this.DEFAULT_HIERARCHY = dim.DEFAULT_HIERARCHY || "";
		this.DESCRIPTION       = dim.DESCRIPTION       || "";
		this.DIMENSION_CAPTION = dim.DIMENSION_CAPTION || "";
		this.DIMENSION_CARDINALITY = dim.DIMENSION_CARDINALITY || 0;
		this.DIMENSION_GUID = dim.DIMENSION_GUID || "";
		this.DIMENSION_IS_VISIBLE = dim.DIMENSION_IS_VISIBLE == 'true' ? true : false;
		this.DIMENSION_NAME       = dim.DIMENSION_NAME || "";
		this.DIMENSION_ORDINAL    = dim.DIMENSION_ORDINAL || 0;
		this.DIMENSION_TYPE       = dim.DIMENSION_TYPE    || 0;
		/*
	*					<li>MD_DIMTYPE_UNKNOWN (0)</li>
	*					<li>MD_DIMTYPE_TIME (1)</li>
	*					<li>MD_DIMTYPE_MEASURE (2)</li>
	*					<li>MD_DIMTYPE_OTHER (3)</li>
	*					<li>MD_DIMTYPE_QUANTITATIVE (5)</li>
	*					<li>MD_DIMTYPE_ACCOUNTS (6)</li>
	*					<li>MD_DIMTYPE_CUSTOMERS (7)</li>
	*					<li>MD_DIMTYPE_PRODUCTS (8)</li>
	*					<li>MD_DIMTYPE_SCENARIO (9)</li>
	*					<li>MD_DIMTYPE_UTILIY (10)</li>
	*					<li>MD_DIMTYPE_CURRENCY (11)</li>
	*					<li>MD_DIMTYPE_RATES (12)</li>
	*					<li>MD_DIMTYPE_CHANNEL (13)</li>
	*					<li>MD_DIMTYPE_PROMOTION (14)</li>
	*					<li>MD_DIMTYPE_ORGANIZATION (15)</li>
	*					<li>MD_DIMTYPE_BILL_OF_MATERIALS (16)</li>
	*					<li>MD_DIMTYPE_GEOGRAPHY (17)</li>	
		*/
		this.DIMENSION_UNIQUE_NAME = dim.DIMENSION_UNIQUE_NAME || "";
		this.DIMENSION_UNIQUE_SETTINGS = dim.DIMENSION_UNIQUE_SETTINGS || 0;
		this.IS_VIRTUAL = dim.IS_VIRTUAL == 'true' ? true : false;
		this.IS_READWRITE = dim.IS_READWRITE == 'true' ? true : false;
		this.hierarchies = [];
		this.CUBE_NAME = dim.CUBE_NAME;
		this.SCHEMA_NAME = dim.SCHEMA_NAME;
		this.CATALOG_NAME = dim.CATALOG_NAME;
		this.cube = $cube;
		if (dim.hierarchies instanceof Array) {
			for (var idx in dim.hierarchies){
				var hier = dim.hierarchies[idx];	
				this.addHierarchy(hier);
			}
		}
		this.id = olap.Dimension.id++;
		olap.Dimension.instances[this.id] = this;				
	}
	olap.Dimension.id = 1;
	olap.Dimension.instances = {};
	olap.Dimension.prefix = "olap.Dimension";
	olap.Dimension.getInstance = function(id){
	    return olap.Dimension.instances[id];
	};
	olap.Dimension.prototype = {
		addHierarchy: function addHierarchy(hierarchy, callback) {
			if (hierarchy instanceof Object) {
				if (hierarchy instanceof olap.Hierarchy == false) {
					hierarchy = new olap.Hierarchy(hierarchy, this);
				}
				this.hierarchies.push(hierarchy);
				if (typeof callback == 'function') {
					callback(hierarchy);
				}
			}
			return hierarchy;
		},
  		/**
		* returns the unique name of this Dimension within the cube
		* @method getUniqueName
		* @return {String}
		*/
		getUniqueName: function getUniqueName(){
			return this.DIMENSION_UNIQUE_NAME;
		},
 		/**
		* returns the name of this Dimension
		* @method getName
		* @return {String}
		*/
		getName: function getName(){
			return this.DIMENSION_NAME;
		},
  		/**
		* returns the Type of this Dimension
		* @method getDimensionType
		* @return {String}
		*/
		getDimensionType: function getDimensionType(){
			return this.DIMENSION_TYPE;
		},
 		/**
		* returns a list of hierarchies in this cube
		* @method getHierarchies
		* @return {olap.Hierarchy} Array of hierarchies
		*/ 
		getHierarchies: function getHierarchies() {
			if (this.hierarchies.length == 0) {
				var processHierarchies = function processHierarchies(hierarchies){
					return this.hierarchies;
				};
				this.fetchHierarchies(processHierarchies);
			} else {
				return this.hierarchies;
			}
		},
		fetchHierarchies: function fetchHierarchies() {	
			//empty function that does not fetch anything
			throw new Error('You must provide an implementation for: ' + arguments.callee.name)
		}
	}
	
	/** olap.Hierarchy
	*   <p>
	*   Wrapper for OLAP Hierarchies
	*   </p>
	*   @class olap.Hierarchy
	*   @constructor
	*   @param {Object} Hierarchy object representing object properties.  Often used to rehydrate objects after external persistence
	*   @param {olap.Dimension} Dimension The dimension that this Hierarchy belongs to
	*/
	olap.Hierarchy = function Hierarchy($hierarchy, $dim){
		var hierarchy = $hierarchy || {};
		if ((hierarchy.HIERARCHY_UNIQUE_NAME == "") || (hierarchy.HIERARCHY_UNIQUE_NAME == undefined)) {
			throw new Error("Must supply a Unique Name");
		}
		this.ALL_MEMBER = hierarchy.ALL_MEMBER || "";
		this.DEFAULT_MEMBER = hierarchy.DEFAULT_MEMBER || "";
		this.DESCRIPTION    = hierarchy.DESCRIPTION || "";
		this.HIERARCHY_CAPTION = hierarchy.HIERARCHY_CAPTION || "";
		this.HIERARCHY_CARDINALITY = hierarchy.HIERARCHaY_CARDINALITY || "";
		this.HIERARCHY_NAME        = hierarchy.HIERARCHY_NAME || "";
		this.HIERARCHY_ORDINAL     = hierarchy.HIERARCHY_ORDINAL || 0;
		this.HIERARCHY_UNIQUE_NAME = hierarchy.HIERARCHY_UNIQUE_NAME;
		this.PARENT_CHILD          = hierarchy.PARENT_CHILD == 'true' ? true : false;
		this.STRUCTURE             = hierarchy.STRUCTURE || 0;
		this.DIMENSION_UNIQUE_NAME = hierarchy.DIMENSION_UNIQUE_NAME;
		this.CUBE_NAME             = hierarchy.CUBE_NAME;
		this.SCHEMA_NAME           = hierarchy.SCHEMA_NAME;
		this.CATALOG_NAME          = hierarchy.CATALOG_NAME;
		this.levels                = [];
		this.dimension = $dim;
		if (hierarchy.levels instanceof Array) {
			for (var idx in hierarchy.levels){
				var lvl = hierarchy.levels[idx];	
				this.addLevel(lvl);
			}
		}
		this.id = olap.Hierarchy.id++;
		olap.Hierarchy.instances[this.id] = this;		
	}
	olap.Hierarchy.id = 1;
	olap.Hierarchy.instances = {};
	olap.Hierarchy.prefix = "olap.Hierarchy";
	olap.Hierarchy.getInstance = function(id){
	    return olap.Hierarchy.instances[id];
	};
	olap.Hierarchy.validMethods = ['Members', 'AllMembers'];
	olap.Hierarchy.sugarMethods = ['DefaultMember', 'AllMember'];
	olap.Hierarchy.isBasicMethod = function(method){
		
		var idx;
		for (idx in this.validMethods){
			if (this.validMethods[idx] == method) {
				return true;
			}
		}		
	}
	olap.Hierarchy.isMethodValid = function(method){
		//console.debug('func Call: ' + arguments.callee.name + method);	
		if (this.isBasicMethod(method) == true){
			return true;
		}
		var idx;
		for (idx in this.sugarMethods){
			if (this.sugarMethods[idx] == method) {
				return true;
			}
		}
		//if we get here the method is not valid
		return false;
		
	}
	olap.Hierarchy.prototype = {
		addLevel: function addLevel(level, callback) {
			//console.debug('func Call: ' + arguments.callee.name);	
			if (level instanceof Object) {
				if (level instanceof olap.Level == false) {
					//console.debug('not olap.Level, creating olap.Level');
					//console.debug(level);
					level = new olap.Level(level, this);
				} else {
					//console.debug('is an olap.Level');
					//console.debug(level);
				}
				this.levels.push(level);
				if (typeof callback == 'function') {
					callback(level);
				}
			}
			return level;
		},
		toMDX: function toMDX(method, param){
			if (olap.Hierarchy.isBasicMethod(method)) {
				return this.getUniqueName() + '.' + method
			}
			else {
				if (method == 'DefaultMember'){
					return this.getUniqueName(); //MDX will just use default member if nothing else is after hierarch
				}
				if (method == 'AllMember') {
					return this.getUniqueName() + '.' + this.ALL_MEMBER;
				}
				return "";
			}
		},
		getHierarchy: function getHierarchy() {
			return this;
		},
  		/**
		* returns the parent Dimension of this hierarchy
		* @method getDimension
		* @return {olap.Dimension}
		*/ 
		getDimension: function getDimension() {
			return this.dimension;
		},
  		/**
		* returns the name of this Hierarchy
		* @method getName
		* @return {String}
		*/
		getName: function () {
			return this.HIERARCHY_NAME;
		},
   		/**
		* returns the unique name of this Hierarchy within the cube
		* @method getUniqueName
		* @return {String}
		*/
		getUniqueName: function () {
			return this.HIERARCHY_UNIQUE_NAME;
		},
   		/**
		* returns a list of Levels in this hierarchy
		* @method getLevels
		* @return {olap.Level} Array of levels
		*/
		getLevels: function getLevels() {
			if (this.levels.length == 0) {
				var processLevels = function processLevels(levels){
					return this.levels;
				};
				this.fetchLevels(processLevels);
			} else {
				return this.levels;
			}
		},
		fetchLevels: function fetchLevels() {	
			//empty function that does not fetch anything
			throw new Error('You must provide an implementation for: ' + arguments.callee.name)
		}
	}
	
	/** olap.Level
	*   Group of Member objects in a Hierarchy, all with the same attributes and at the same depth in the hierarchy
	*   @class olap.Level
	*   @constructor
	*   @param {Object} Level object representing object properties.  Often used to rehydrate objects after external persistence
	*   @param {olap.Hierarchy} Hierarchy The olap.Hierarchy that this Level belongs to
	*/
	olap.Level = function Level($level, $hier) {
		var level = $level || {};
		this.LEVEL_UNIQUE_NAME = level.LEVEL_UNIQUE_NAME;
		this.LEVEL_NAME        = level.LEVEL_NAME;
		this.LEVEL_CAPTION     = level.LEVEL_CAPTION;
		this.DESCRIPTION       = level.DESCRIPTION;
		this.CUSTOM_ROLLUP_SETTINGS = level.CUSTOM_ROLLUP_SETTINGS;
		this.LEVEL_CARDINALITY = level.LEVEL_CARDINALITY;
		this.LEVEL_NUMBER      = level.LEVEL_NUMBER;
		this.LEVEL_TYPE        = level.LEVEL_TYPE || 0
		this.HIERARCHY_UNIQUE_NAME = level.HIERARCHY_UNIQUE_NAME;
		this.DIMENSION_UNIQUE_NAME = level.DIMENSION_UNIQUE_NAME;
		this.CUBE_NAME = level.CUBE_NAME;
		this.SCHEMA_NAME = level.SCHEMA_NAME;
		this.CATALOG_NAME = level.CATALOG_NAME;
		this.members   = [];
		// this is done because a plain $hier is just an object literal
		if ($hier instanceof olap.Hierarchy) {
			this.hierarchy = $hier;
		} else {
			if ($hier instanceof Object) {
				this.hierarchy = new olap.Hierarchy($hier);
			} else {
				if (level.hierarchy instanceof Object) {
					this.hierarchy = new olap.Hierarchy(level.hierarchy);
				} else {
					if (!level.hierarchy &&  !$hier) {
						//console.log('nothing')
						//we don't have a hierarchy here.
					} else {
						throw new Error('hierarchy of level is not a valid object' + $hier.toString());
					}
				}
			}
		}
		this.id = olap.Level.id++;
		olap.Level.instances[this.id] = this;				
	}
	olap.Level.id = 1;
	olap.Level.instances = {};
	olap.Level.prefix = "olap.Level";
	olap.Level.getInstance = function(id){
	    return olap.Level.instances[id];
	};	
	olap.Level.validMethods = ['Members', 'AllMembers'];
	olap.Level.sugarMethods = [];
	olap.Level.isBasicMethod = function(method){
		var idx;
		for (idx in olap.Level.validMethods){
			if (olap.Level.validMethods[idx] == method) {
				return true;
			}
		}		
	}
	olap.Level.isMethodValid = function(method){
		
		if (olap.Level.isBasicMethod(method) == true){
			return true;
		}
		var idx;
		for (idx in olap.Level.sugarMethods){
			if (olap.Level.sugarMethods[idx] == method) {
				return true;
			}
		}
		//if we get here the method is not valid
		return false;
		
	}	
	olap.Level.prototype = {
		addMember: function addMember(mem, callback) {
			if (mem instanceof Object) {
				if (mem instanceof olap.Member == false) {
					mem = new olap.Member(mem, this);
				}
				this.members.push(mem);
				if (typeof callback == 'function') {
					callback(mem);
				}
			}
			return mem;
		},
  		/**
		* returns the name of this Level
		* @method getName
		* @return {String}
		*/
		getName:  function getName(){
			return this.LEVEL_NAME;
		},
  		/**
		* returns the type of this Level
		* @method getLevelType
		* @return {Integer}
		*/
		getLevelType:  function getLevelType(){
			return this.LEVEL_TYPE;
		},
  		/**
		* returns the depth of this Level in the Hierarchy
		* @method getDepth
		* @return {Integer}
		*/
		getDepth:  function getDepth(){
			return this.LEVEL_NUMBER;
		},
  		/**
		* returns the approximate members of this Level in the Hierarchy
		* @method getCardinality
		* @return {Integer}
		*/
		getCardinality:  function getCardinality(){
			return this.LEVEL_CARDINALITY;
		},
  		/**
		* returns the UNIQUE_NAME of this Level
		* @method getUniqueName
		* @return {String}
		*/
		getUniqueName:  function getUniqueName(){
			return this.LEVEL_UNIQUE_NAME;
		},
		getHierarchy: function () {
			return this.hierarchy;
		},
		toMDX: function toMDX(method, param){
			if (olap.Level.isBasicMethod(method)) {
				return this.getUniqueName() + '.' + method
			}
			else {
				return "";
			}
		},
  		/**
		* returns a list of the members of this Level
		* @method getMembers
		* @return {olap.Member} An array of Members
		*/
		getMembers: function getMembers() {
			//console.debug('func Call: ' + arguments.callee.name);
			if (this.members.length == 0) {
				var processMembers = function processMembers(members){
					return members;
				};
				this.fetchMembers(processMembers);
			} else {
				return this.members;
			}
		},
		fetchMembers: function fetchMembers() {	
			//empty function that does not fetch anything
			throw new Error('You must provide an implementation for: ' + arguments.callee.name)
		}

	}
	
	/** olap.Member
	*   Member is a data value in an OLAP dimension
	*   @class olap.Member
	*   @constructor
	*   @param {Object} Member object representing object properties.  Often used to rehydrate objects after external persistence
	*   @param {olap.Level} Level The olap.Level that this Member belongs to
	*/
	olap.Member = function Member($member, $level) {
		var member = $member || {};
		this.MEMBER_UNIQUE_NAME = member.MEMBER_UNIQUE_NAME;
		this.MEMBER_NAME        = member.MEMBER_NAME;
		this.MEMBER_TYPE        = member.MEMBER_TYPE;
		this.CHILDREN_CARDINALITY = member.CHILDREN_CARDINALITY;
		this.MEMBER_ORDINAL     = member.MEMBER_ORDINAL;
		this.MEMBER_CAPTION     = member.MEMBER_CAPTION;
		this.LEVEL_NUMBER       = member.LEVEL_NUMBER;
		this.LEVEL_UNIQUE_NAME  = member.LEVEL_UNIQUE_NAME;
		this.HIERARCHY_UNIQUE_NAME = member.HIERARCHY_UNIQUE_NAME;
		this.DIMENSION_UNIQUE_NAME = member.DIMENSION_UNIQUE_NAME;
		this.CUBE_NAME             = member.CUBE_NAME;
		this.SCHEMA_NAME           = member.SCHEMA_NAME;
		this.CATALOG_NAME          = member.CATALOG_NAME;
		//TODO put member properties here
		//this.properties   = [];
		this.level = $level;
		this.id = olap.Member.id++;
		olap.Member.instances[this.id] = this;						
	}
	olap.Member.id = 1;
	olap.Member.instances = {};
	olap.Member.prefix = "olap.Member";
	olap.Member.getInstance = function(id){
	    return olap.Level.instances[id];
	};		
	olap.Member.validMethods = ['Children', 'Cousin', 'FirstChild', 'FirstSibling','LastChild', 'LastSibling', 'NextMember', 'Parent', 'PrevMember', 'Siblings'];
	//TODO 'Ascendants', 'Descendants', 'Lag', 'Lead', 'Mtd', 'Qtd', 'Rank', 'Siblings', 'Qtd', 'Wtd', 'Ytd',  'GrandParent', 'GrandChild'
	olap.Member.sugarMethods = ['Self'];
	olap.Member.isBasicMethod = function(method){
		var idx;
		for (idx in olap.Member.validMethods){
			if (olap.Member.validMethods[idx] == method) {
				return true;
			}
		}		
	}
	olap.Member.isMethodValid = function(method){
		
		if (olap.Member.isBasicMethod(method) == true){
			return true;
		}
		var idx
		for (idx in olap.Member.sugarMethods){
			if (olap.Member.sugarMethods[idx] == method) {
				return true;
			}
		}
		//if we get here the method is not valid
		return false;
		
	}
	olap.Member.prototype = {
  		/**
		* returns the name of this Member
		* @method getName
		* @return {String}
		*/
		getName: function getName(){
			return this.MEMBER_NAME;
		},
  		/**
		* returns the UNIQUE_NAME of this Member
		* @method getUniqueName
		* @return {String}
		*/
		getUniqueName: function getUniqueName(){
			return this.MEMBER_UNIQUE_NAME;
		},
		toMDX: function toMDX(method, param){
			if (olap.Member.isBasicMethod(method)) {
				return this.getUniqueName() + '.' + method
			}
			else {
				//TODO add more in for sugar methods
				switch(method){
					case 'Self':
					  return this.getUniqueName();
					default:
					  return this.getUniqueName();
				}
			}
		}
	}

	/** olap.NamedSet
	* A Named Set describes a set whose value is determined by an MDX expression. It belongs to a cube.
	*   @class olap.Namedset
	*   @constructor
	*   @param {Object} Set object representing object properties.  Often used to rehydrate objects after external persistence
	*   @param {olap.Cube} Cube The olap.Cube that this Named Set belongs to
	*/
	olap.NamedSet = function CellSet($namedset, $cube){
		//console.debug('func Call: ' + arguments.callee.name);
		var namedset = $namedset || {};
		this.CUBE_NAME = namedset.CUBE_NAME || '' ;
		this.SCHEMA_NAME = namedset.SCHEMA_NAME || '' ;
		this.CATALOG_NAME = namedset.CATALOG_NAME || '' ;
		this.SET_NAME = namedset.SET_NAME || 'unknown';
		this.SCOPE = namedset.SCOPE || 1;
		this.DESCRIPTION = namedset.DESCRIPTION || '' ;
		this.EXPRESSION = namedset.EXPRESSION || '';
		this.DIMENSIONS = namedset.DIMENSIONS || '';
		this.SET_CAPTION = namedset.SET_CAPTION || this.SET_NAME;
		this.SET_DISPLAY_FOLDER = namedset.SET_DISPLAY_FOLDER;		
		this.cube = $cube;
		this.id = olap.CellSet.id++;
		olap.NamedSet.instances[this.id] = this;				
	}
	olap.NamedSet.id = 1;
	olap.NamedSet.prefix = "olap.NamedSet";
	olap.NamedSet.instances = {};
	olap.NamedSet.getInstance = function(id){
	    return olap.NamedSet.instances[id];
	};
	olap.NamedSet.prototype = {
  		/**
		* returns the Expression for this Named Set
		* @method getExpression
		* @return {String}
		*/
		getExpression: function getExpression(){
			return this.EXPRESSION;
		},
  		/**
		* returns the cube that is the parent of this Set
		* @method getCube
		* @return {olap.Cube}
		*/
		getCube: function getCube(){
			return this.cube;
		},
  		/**
		* returns the name of this Named Set
		* @method getName
		* @return {String}
		*/
		getName: function getName(){
			return this.SET_NAME;
		},
  		/**
		* returns the caption of this Named Set
		* @method getCaption
		* @return {String}
		*/
		getCaption: function getCaption(){
			return this.SET_CAPTION;
		},
  		/**
		* returns the Description of this Named Set
		* @method getDescription
		* @return {String}
		*/
		getDescription: function getDescription(){
			return this.DESCRIPTION;
		}
		
	}
	
	/** olap.CellSet
	* CellSet is the result of executing an olap.Query
	*   @class olap.CellSet
	*   @constructor
	*   @param {Object} Cellset Object representing object properties.  Often used to rehydrate objects after external persistence
	*   @param {String} Catalog The CATALOG_NAME that this CellSet is being executed for
	*/
	olap.CellSet = function CellSet($cellset, $catalog){
		//console.debug('func Call: ' + arguments.callee.name);
		var cellset = $cellset || {axes:[], filterAxis:{}, cells:[], CUBE_NAME: ''}, idx, axis, cell;
		
		this.CUBE_NAME  = cellset.CUBE_NAME;
		this.CATALOG_NAME = $catalog;
		this.setSlicer(cellset.filterAxis);
		this.cells = [];
		this.axes  = [];
		if (cellset.axes instanceof Array) {
			for (var i=0, j=cellset.axes.length;i<j;i++){
				axis = cellset.axes[i];
				axis.ordinal = i;
				this.addAxis(axis);
			}
		}
		if (cellset.cells instanceof Array) {
			for (idx in cellset.cells){
				cell = cellset.cells[idx];	
				this.addCell(cell);
			}
		}

		this.id = olap.CellSet.id++;
		olap.CellSet.instances[this.id] = this;				
	}
	olap.CellSet.id = 1;
	olap.CellSet.prefix = "olap.CellSet";
	olap.CellSet.instances = {};
	olap.CellSet.getInstance = function(id){
	    return olap.CellSet.instances[id];
	};
	olap.CellSet.prototype = {
		setSlicer: function setSlicer(slicer){
			if (slicer instanceof Object) {
				if (slicer instanceof olap.CellSetAxis == false) {
					slicer = new olap.CellSetAxis(slicer, this);
				}
				this.SLICER = slicer;
			}		
		},
		getAxes: function getAxes(){
			return this.axes;
		},
		getFilterAxis: function getFilterAxis(){
			return this.filterAxis;
		},
		getCell: function getCell(index){
			return this.cells[index];
		},
		getCubeName: function getCubeName(){
			return this.CUBE_NAME;
		},
		addAxis: function addAxis(axis, callback) {
			//console.debug('func Call: ' + arguments.callee.name);	
			if (axis instanceof Object) {
				if (axis instanceof olap.CellSetAxis == false) {
					axis = new olap.CellSetAxis(axis, this);
				} else {
				}
				this.axes.push(axis);
				if (typeof callback == 'function') {
					callback(axis);
				}
			}
			return axis;
		},
		addCell: function addCell(cell, callback) {
			//console.debug('func Call: ' + arguments.callee.name);	
			if (cell instanceof Object) {
				if (cell instanceof olap.Cell == false) {
					cell = new olap.Cell(cell, this);
				} else {
				}
				this.cells.push(cell);
				if (typeof callback == 'function') {
					callback(cell);
				}
			}
			return cell;
		}
	}

	/** olap.Cell
	* A Cell is a cell returned from an CellSet
	*   @class olap.Cell
	*   @constructor
	*   @param {Object} Cell Object representing object properties.  Often used to rehydrate objects after external persistence
	*   @param {olap.CellSet} Cellset The Cellset that this Cell belongs to
	*/
	olap.Cell = function Cell($cell, $cellset) {
		var cell = $cell || {};
		this.value = cell.value;
		this.formattedValue = cell.formattedValue;
		this.ordinal = cell.ordinal;
		this.cellset = $cellset;
		this.id = olap.Cell.id++;
		olap.Cell.instances[this.id] = this;				
	}
	olap.Cell.id = 1;
	olap.Cell.prefix = "olap.Cell";
	olap.Cell.instances = {};
	olap.Cell.getInstance = function(id){
	    return olap.Cell.instances[id];
	};	
	olap.Cell.prototype = {
		getCellSet: function getCellSet(){
			return this.cellset;
		},
		getOrdinal: function getOrdinal(){
			return this.ordinal;
		},
		getCoordinateList: function getCoordinateList(){
			//return List<Integer> ;
		},
		getPropertyValue: function getPropertyValue(Property){
		},
		getValue: function getValue(){
			return this.value;
		},
		getFormattedValue: function getFormattedValue(){
			return this.formattedValue;
		}
	}

	/** olap.Position
	*   @class olap.Position
	*   @constructor
	*   @param {Object} Position Object representing object properties.  Often used to rehydrate objects after external persistence
	*   @param {olap.CellSetAxis} Axis The Axis that this Position belongs to
	*/
	olap.Position = function Position($position, $axis) {
		//console.debug('func Call: ' + arguments.callee.name);	
		//document.body.appendChild(prettyPrint($position, { maxDepth:3} ));
		var position = $position || {}, memb, hier, cube = olap.Cube.getInstanceByName($axis.getCellSet().CUBE_NAME, $axis.getCellSet().CATALOG_NAME);

		this.members = {};
		for (idx in position){
			memb = position[idx];	
			hier = filterProperty.apply($axis.getHierarchies(), [{type:'equal', property:'HIERARCHY_UNIQUE_NAME', value:idx}]);
			memb.HIERARCHY_UNIQUE_NAME = hier.HIERARCHY_UNIQUE_NAME
			this.members[idx] = new olap.Member(memb);
			//BELOW is from sample
			//var tuple = rowAxis.positions[i][rowHierarchies[z].name];
			//var level = cube.getLevelByUniqueName(memb.LEVEL_UNIQUE_NAME, memb.HIERARCHY_UNIQUE_NAME);
			//document.body.appendChild(prettyPrint(level, { maxDepth:3} ));
		}
		
		this.id = olap.Position.id++;
		olap.Position.instances[this.id] = this;				
	}
	olap.Position.id = 1;
	olap.Position.prefix = "olap.Position";
	olap.Position.instances = {};
	olap.Position.getInstance = function(id){
	    return olap.Position.instances[id];
	};	
	olap.Position.prototype = {
		getOrdinal: function getOrdinal(){
			//return Axis;
		},
		getMembers: function getMembers(){
			//return Axis;
		}
	}
	
	/** olap.CellSetAxis
	*   @class olap.CellSetAxis
	*   @constructor
	*   @param {Object} CellSetAxis Object representing object properties.  Often used to rehydrate objects after external persistence
	*   @param {olap.CellSet} CellSet The CellSet that this Axis belongs to
	*/
	olap.CellSetAxis = function CellSetAxis($axis, $cellset) {
		//console.debug('func Call: ' + arguments.callee.name);	
		var axis = $axis || {ordinal:0}, idx, pos, hier;
		this.positions = [];
		this.hierarchies = [];
		this.cellset = $cellset;
		this.ordinal = axis.ordinal
		if (axis.hierarchies instanceof Array) {
			for (idx in axis.hierarchies ){
				hier = axis.hierarchies[idx];
				this.hierarchies.push(new olap.Hierarchy(hier));
			}
		}
		//document.body.appendChild(prettyPrint(this.hierarchies, { maxDepth:3} ));		
		if (axis.positions instanceof Array) {
			for (idx in axis.positions ){
				pos = axis.positions[idx];	
				this.addPosition(pos);
			}
		}

		this.id = olap.CellSetAxis.id++;
		olap.CellSetAxis.instances[this.id] = this;				
		//document.body.appendChild(prettyPrint(this, { maxDepth:3} ));		
	}
	olap.CellSetAxis.id = 1;
	olap.CellSetAxis.prefix = "olap.CellSetAxis";
	olap.CellSetAxis.instances = {};
	olap.CellSetAxis.getInstance = function(id){
	    return olap.CellSetAxis.instances[id];
	};	
	olap.CellSetAxis.prototype = {
		getOrdinal: function getOrdinal(){
			//return Axis;
		},
		getCellSet: function getCellSet() {
			return this.cellset;
		},
		getAxisMetaData: function getAxisMetaData(){
			//return CellSetAxisMetaData ;
		},
		getPositions: function getPositions() {
			return this.positions;
		},
		getPositionCount: function getPositionCount(){
			return this.positions.length;
		},
		getHierarchies: function getHierarchies(){
			return this.hierarchies;
		},
		getProperties: function getProperties(){
			//return this.positions.length;
		},
		addPosition: function addPosition(position, callback) {
			//console.debug('func Call: ' + arguments.callee.name);	
			if (position instanceof Object) {
				if (position instanceof olap.Position == false) {
					position = new olap.Position(position, this);
				} else {
				}
				this.positions.push(position);
				if (typeof callback == 'function') {
					callback(position);
				}
			}
			return position;
		},
		addHierarchy: function addHierarchy(hierarchy, callback) {
			//console.debug('func Call: ' + arguments.callee.name);	
			var found = false;
			if (hierarchy instanceof Object) {
				//try to only add if not exists
				for (var i=0,j=this.hierarchies.length;i<j;i++){
					if (this.hierarchies[i].HIERARCHY_UNIQUE_NAME == hierarchy.HIERARCHY_UNIQUE_NAME) {
						found = true;
					}
				}
				if (found ==  false){
					if ((hierarchy instanceof olap.Hierarchy == false) && (hierarchy.HIERARCHY_UNIQUE_NAME) && (hierarchy.HIERARCHY_UNIQUE_NAME !== '')&& (hierarchy.HIERARCHY_UNIQUE_NAME !== undefined)&& (hierarchy.HIERARCHY_UNIQUE_NAME !== " ")) {
						hierarchy = new olap.Hierarchy(hierarchy, this);
						this.hierarchies.push(hierarchy);
					} else if (hierarchy instanceof olap.Hierarchy == true){
						this.hierarchies.push(hierarchy);
					}
				}
				if (typeof callback == 'function') {
					callback(hierarchy);
				}
			}
			return hierarchy;
		}
	}

	/** olap.Query
	*   @class olap.Query
	*   @constructor
	*   @param {Object} Query Object representing object properties.  Often used to rehydrate objects after external persistence
	*   @param {olap.Cube} Cube The Cube that this Query is defined to operate on
	*/
	olap.Query = function Query(query, $cube) {
		var idx, axis;
		query = query || {};
		if ($cube instanceof Object){
			if ($cube instanceof olap.Cube == false) {
				this.cube = new olap.Cube($cube);
			} else {
				this.cube = $cube;
			}
		}
		this.name    = query.name    || ''; 
		//this.sets    = query.sets    || []; //sets are Named Sets that are represented in WITH statement
		//this.members = query.members || []; //members are calculated members that are represented in WITH statement
		this.axes = [];
		if (query.axes instanceof Array) {
			for (idx in query.axes){
				this.addAxis(query.axes[idx])
			}
		}
		this.text    = query.text    || '';
		this.results = query.results || null; //allow rehydration of query without re-execution
		this.id = olap.Query.id++;
		olap.Query.instances[this.id] = this;				
	}
	olap.Query.id = 1;
	olap.Query.prefix = "olap.query";
	olap.Query.instances = {};
	olap.Query.getInstance = function(id){
	    return olap.Query.instances[id];
	};	
	olap.Query.prototype = {
		addAxis: function addAxis(axis){
			if (axis instanceof Object){
				if (axis instanceof olap.Axis == false) { //do we have an object as param and it is not already an Axis
					axis = new olap.Axis(axis, this);
				}
			}
			if (axis instanceof olap.Axis){
				this.axes.push(axis);
			}
		},
		getAxes: function getAxes(){
			if (this.axes.length == 0) {
				this.fetchAxes();
			}		
			return this.axes;
		},
		fetchAxes: function fetchAxes(){
			//empty function that does not fetch anything
		},
		getAxis: function getAxis(axis){
			if (this.axes.length == 0) {
				this.fetchAxes();
			}		
			return this.axes[axis];
		},
		getCube: function getCube(){
			return this.cube;
		},
		getName: function getName(){
			return this.name;
		},
		createAxis: function createAxis(conf) {
			var axis = new olap.Axis(conf, this);
			this.axes.push(axis);
			return axis;
		},
		reset: function() {
		    for (var p in this.axes) {
			this.axes[p].reset();
		    }
		},
		getMDX: function getMDX(){
			//return 'SELECT Measures.members on columns from ' + this.getCube().getName();
			var mdx = "", axes = this.getAxes(), axis, axisMdx;
			
			for (var i=0, j=axes.length;i<j;i++){
				axisMdx = this.getAxis(i).getMdx();
				mdx += " " + axisMdx;
			}
			if (mdx.length) {
			    mdx = "SELECT" + mdx +
				"\nFROM   [" + this.getCube().getName() + "]";
			}
			console.debug(mdx);
			return mdx;
		},
		execute: function execute(callback){
			//default implementation does not create results
			var results = this.results || new olap.CellSet({});
			if (typeof callback == 'function') {
				callback.call(this, results);
				delete results;
			} else {
				return results;
			}
		}
	}
	
	
	/** olap.Axis
	  *
	*/
	olap.Axis = function Axis(axis, $query){
		axis = axis || {};
		this.query       = $query           || {};
		this.name        = axis.name        || 'Column';
		this.location    = axis.location    || 0;
		this.collections = [];
	}
	olap.Axis.prototype = {
		getLocation: function getLocation(){
			return this.location;
		},	
		getName: function getName(){
			return this.name;
		},
		findCollection: function(expression){
			var col;
			for (var i=0,j=this.collections.length; i<j;i++){
				col = this.collections[i];
				if (col.getHierarchy() == expression.getBase().getHierarchy()){
					return col;
				}
			}
			return null;
		},
		collectionCount: function(){
		},
		addCollection: function(collection){
			this.collections.push(collection);
		},
		addExpression: function addExpression(expression){
			if (!expression instanceof olap.Expression) {
				expression = new olap.Expression(expression);
			}
			var col = this.findCollection(expression);
			if (col instanceof olap.ExpressionCollection) {
				//console.debug('Adding expresssion to existing collection')
				col.addExpression(expression);
			} else {
				//console.debug('Adding expresssion to new collection')
				col = new olap.ExpressionCollection();
				col.setHierarchy(expression.getBase().getHierarchy());
				col.addExpression(expression);
				this.addCollection(col);
			}
		},
		reset: function(){
			this.collections = [];			
		},
		getMdx: function() {
		    var colls = this.collections, i, n = colls.length,
			coll, hierarchy, hierarchyName, minLevel, maxLevel,
			member, members, mdx = "", setDef;
		    for (i = 0; i < n; i++) {
			minLevel = null, maxLevel = null;
			coll = colls[i];
			hierarchyName = coll.getHierarchy().getName();
			exprs = coll.expressions;
			for (var j = 0, m = exprs.length, members = ""; j < m; j++) {
			    if (members.length) members += ", ";
			    members += exprs[j].toMDX();
			}
			setDef = "{" + members + "}";
			if (hierarchyName !== "Measures") {
				//get distinct collections. if only one, then don't need hierarchize or crossjoin.
				//if more than one expression inside same collection, then hierarchize
				if (n > 1) {
				    setDef = "Hierarchize(" + setDef + ")";
				} else {
					//do nothing as hierarchize is not needed on only one collection
				}
			}
			mdx = mdx ? "CrossJoin(" + mdx + ", " + setDef + ")" : setDef;
		    }
		    if (mdx.length) mdx = mdx + " ON Axis(" + this.getLocation() + ")";
		    //console.debug(mdx);
		    return mdx;
		}		
	}
	
	/** olap.MemberExpression
	  *
	*/
	olap.Expression = function Expression(expression){
		//console.debug(expression);
		var expr = expression || {base:{}, method:null, param:[]};
		this.base = {};
		this.method = {};
		this.param  = [];
		this.setBase(expr.base);
		this.setMethod(expr.method);
		this.setParameters(expr.param)
		delete expr;
	}
	olap.Expression.prototype = {
		setBase: function(base){
			if (base) {
				this.base = base;
			} else {
				throw new Error('Member Expressions must have a base metadata object');
			}
		},
		getBase: function(){
			return this.base;
		},
		setMethod: function(method){
			if (method){
				if (this.validateMethod(method)) {
					this.method = method;
				} else {
					throw new Error('Method: ' + method + ' is not a valid method')
				}
			} else {
				
				throw new Error('Member Expressions must have a valid method')
			}
		},
		getMethod: function(){
			return this.method;
		},
		setParameters: function(params){
			if (params instanceof Array) {
				this.param = params;
			}
		},
		getParameters: function(){
			return this.param;
		},
		validateMethod: function validateMethod(method){
			//TODO Add other classes in here 
			if (this.base instanceof olap.Member) {
				return olap.Member.isMethodValid(method);
			}
			if (this.base instanceof olap.Level){
				return olap.Level.isMethodValid(method);
			}
			if (this.base instanceof olap.Hierarchy){
				return olap.Hierarchy.isMethodValid(method);
			}
			if (this.base instanceof olap.Measure) {
				return olap.Measure.isMethodValid(method);
			}
			return false;
		},
		toMDX: function(){
			return this.base.toMDX(this.getMethod(), this.getParameters());
		}
	}
	
	/** olap.ExpressionCollection
	  *
	*/
	olap.ExpressionCollection = function ExpressionCollection() {
		//var col = collection || {hierarchy:null, expressions:[]}
		//this.hierarchy = null;
		this.expressions = [];
		//this.setHierarchy(col.hierarchy);
	}
	
	olap.ExpressionCollection.prototype = {
		setHierarchy: function setHierarchy(hierarchy){
			if (hierarchy && this.hierarchy) {
				throw new Error("Cannot set Hierarchy after being set");
			} else {
				if (hierarchy instanceof olap.Hierarchy) {
					this.hierarchy = hierarchy;
				} else {
					throw new Error("Object: " + hierarchy + " is not an olap.Hierarchy");
				}
			}
		},
		getHierarchy: function() {
			return this.hierarchy || {};
		},
		addExpression: function(expression){
			var baseHier = expression.getBase().getHierarchy();
			if (baseHier.HIERARCHY_UNIQUE_NAME == this.getHierarchy().HIERARCHY_UNIQUE_NAME) {
				this.expressions.push(expression);
			} else {
				throw new Error("Cannot add two expressions from differing hierarchies in same ExpressionCollection:" + this.getHierarchy().HIERARCHY_UNIQUE_NAME + ":" + baseHier.HIERARCHY_UNIQUE_NAME);
			}
		},
		reset: function reset(){
			delete this.hierarchy;
			this.expressions = [];
		},
		getFunction: function getFunction(){
			return this.expFunction;
		}
	}
	/* Open
	  Filter
	  Order
	  Item
	*/
	/* Hierarchy
	  DefaultMember
	  AllMembers
	  Members
	*/
	/* Level
	  AllMembers
	  ClosingPeriod
	  Members
	  OpeningPeriod
	  ParallelPeriod
	  PeriodsToDate
	*/
	/* Member
	  Add in Self as an option
	  Ascendants
	  Ancestor
	  Children
	  Cousin
	  Descendants
	  FirstChild
	  FirstSibling
	  Lag
	  LastChild
	  LastSibling
	  Lead
	  Mtd
	  NextMember
	  Parent
	  PrevMember
	  Properties
	  Qtd
	  Rank
	  Siblings
	  Wtd
	  Ytd
	  <<Grandparent, Grandchild>>
	*/
})(this);

/*
concepts taken from Nicholas Zakas Professional Javascript
*/
function object(o){
	function F(){}
	F.prototype = o;
	return new F();
}
	
function inheritPrototype(subType, superType){
	var prototype = object(superType.prototype);   //create object
	prototype.constructor = subType;               //augment object
	subType.prototype = prototype;                 //assign object
}

/* filter
	//TODO could use underscore.js
	filter will filter an object or array of objects base on
	filter.property, filter.value and filter.type
	where filter.type is in ('equal', 'gt', 'lt')
	this function can be called for any object with properties using this as scope
	sample usage:
		var a = [], obj;
		a.push({id:1, val:"One", descr:"Hey"});
		a.push({id:2, val:"Two", descr:"Hey"});
		a.push({id:3, val:"Three", descr:"Nope"});
		var display = function(val) {
			console.log("Matched");
			console.log(val);
		};
		filter.apply(a, [
				{property:"id", value:"2", type:"equal"}, 
				display
		]);
*/
filterProperty = function(filter, callback) {
	//console.log("this");console.log(this);
	//console.log("filter");console.log(filter);
	var _sources = [], _source;
	//if we are processing an array, then loop through each for filtering
	if (this instanceof Array) {
		//console.log('filter an array');console.log(this);
		for (var i=0,j=this.length;i<j;i++) {
			_source = filterProperty.apply(this[i], [filter, callback]);
			if (_source) {
				_sources.push(_source);
			}
		}
		//after processing each piece of the array, stop processing the array itself.
		if (_sources.length == 1){
			return _sources[0];
		} else {
			return _sources;
		}
	} else {
		//this is not an array, so continue with filter
	}

	//if filter not supplied then use filter arg as callback arg
	if (arguments.length == 1 && typeof filter == 'function' ) {
		callback = filter;
		filter = null;
	}
	//make an empty function so that future calls just go through
	if (typeof callback !== 'function') {
		callback = function(){};
	}

	//if no filter then return this
	if (filter == null ) {
		callback(this);
		return this;
	} else {
		//some filter was supplied, try to see if there is a match for equality
		//TODO add other conditions: contains, starts, ends
		try {
			switch (filter.type) {
				case 'gt':
					if (this[filter.property] > filter.value) {
						callback(this);
						return this;
					} else {
						//console.log('no match for:' + this[filter.property] + ':' + filter.value);
						return null;
					}
					break;
				case 'lt':
					if (this[filter.property] < filter.value) {
						callback(this);
						return this;
					} else {
						//console.log('no match for:' + this[filter.property] + ':' + filter.value);
						return null;
					}
					break;
				case 'equal':
					//letting equal fall through to default
				default:
					if (this[filter.property] == filter.value) {
						//console.log('found match');console.log(this);
						callback(this);
						return this;
					} else {
						//console.log('no match for:' + this[filter.property] + ':' + filter.value);
						return null;
					}
			}
		} catch(e) {
			//just move on to next
			return null;
		}
	}
}
