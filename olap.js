(function olap(global){

	/* olap module boiler plate
	*/
	var olap; if (typeof exports !== 'undefined') {olap = exports;} else {olap = global.olap = {};}

	/* olap.Connection
	*/
	olap.Connection = function Connection($connection){
		//console.debug('func Call: ' + arguments.callee.name);
		
		
		var src = {}, that=this;
		this.sources = [];
		if ($connection instanceof Object) { //have we been passed a valid JS object?
			if ($connection.sources instanceof Array) {
				for (var idx in $connection.sources){
					src = $connection.sources[idx];	
					//ds = new olap.Datasource(src, this)
					this.addDataSource(src);
				}
			}
		}
		this.id = olap.Connection.id++;
		olap.Connection.instances[this.id] = this;		
	}
	
	olap.Connection.prototype = {
		getOlapDatabases: function getOlapDatabases(callback){
			if (this.sources.length ==0) {
				this.fetchOlapDatasources(function(sources){
					callback.call(this, sources);
				});
			} else {
				if (callback && typeof callback == 'function') {
					callback.call(this, this.sources);
				}
				return this.sources;
			}
		},
		fetchOlapDatasources: function fetchOlapDatasources(callback){
			//empty function that does not fetch anything
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
		}
	}
	olap.Connection.id = 1;
	olap.Connection.instances = {};
	olap.Connection.getInstance = function(id){
	    return olap.Connection.instances[id];
	};
	
	/* olap.Datasource
	*   <p>
	*   This object provides pure JS constructs to create and use OLAP Datasources
	*   </p>
	*   <p>
	*   You do not need to instantiate objects of this class yourself. YOu can use <code>olap.discoverSources()</code> or <code>olap.getSources({}, function(source) {/nconsole.log(source);})</code>
	*	</p>
	*   @class olap.Datasource
	*   @constructor
	*   @param {Object} source JS object representing object properties.  Often used to rehydrate objects after external persistence
	*   @param {Xmla} xmla The Xmla instance to be used to communicate with the server
	*/
	olap.Datasource = function Datasource(source, $conn) {
		var idx, cat;
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
	olap.Datasource.getInstance = function(id){
	    return olap.Datasource.instances[id];
	};	
	olap.Datasource.prototype = {
		getOlapConnection: function getOlapConnection() {
			return this.connection;
		},
		getName: function getName() {
			return this.DATA_SOURCE_NAME;
		},
		getDescription: function getDescription() {
			return this.DATA_SOURCE_DESCRIPTION;
		},
		getProviderName: function getProviderName() {
			return this.PROVIDER_NAME;
		},
		getURL: function getURL() {
			return this.URL;
		},
		getDataSourceInfo: function getDataSourceInfo() {
			return this.DATA_SOURCE_INFO;
		},
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
	
	/* olap.Catalog
	*   <p>
	*   Wrapper for OLAP Catalogs
	*   </p>
	*   @class olap.Catalog
	*   @constructor
	*   @param {Object} JS object representing object properties.  Often used to rehydrate objects after external persistence
	*   @param {olap.Datasource} source The olap.Datasource that this catalog belongs to
	*/
	olap.Catalog = function Catalog(catalog, $s) {
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
		
		//this.SCHEMA_NAME = catalog.SCHEMA_NAME;
		this.datasource    = $s;
		this.id = olap.Catalog.id++;
		olap.Catalog.instances[this.id] = this;				
	}
	olap.Catalog.id = 1;
	olap.Catalog.instances = {};
	olap.Catalog.getInstance = function(id){
	    return olap.Catalog.instances[id];
	};		
	olap.Catalog.prototype = {
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
		getCubes: function getCubes() {
			if (this.cubes.length == 0) {
				this.fetchCubes();
			}
			return this.cubes;
		},
		fetchCubes: function fetchCubes() {	
			//empty function that does not fetch anything
		}
	}
	
	/* olap.Cube
	*   <p>
	*   Wrapper for OLAP Cubes
	*   </p>
	*   @class olap.Cube
	*   @constructor
	*   @param {Object} JS object representing object properties.  Often used to rehydrate objects after external persistence
	*   @param {olap.Catalog} catalog The olap.Catalog that this Cube belongs to
	*/
	olap.Cube = function Cube(cube, $cat) {
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
		getName: function getName() {
			return this.CUBE_NAME;
		},
		addDimension: function addDimension(dimension, callback) {
			this.dimensions.push(dimension);
			if (typeof callback == 'function') {
				callback(dimension);
			} 
			return dimension;
		},
		addMeasure: function addMeasure(measure, callback) {
			this.measures.push(measure);
			if (typeof callback == 'function') {
				callback(measure);
			} 
			return measure;
		},
		getLevelByUniqueName: function(LEVEL_UNIQUE_NAME, HIERARCHY_NAME){
	
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
			// Maybe throw error here
			console.debug('no match for: ' + LEVEL_UNIQUE_NAME + ':' + HIERARCHY_NAME)
			return null;			
		},
		getMeasures: function getMeasures() {
			if (this.measures.length == 0) {
				var processMeasures = function processMeasures(measures){
					return this.measures;
				};
				this.fetchMeasures(processMeasures);
			} else {
				return this.measures;
			}
		},
		fetchMeasures: function fetchMeasures() {	
			//empty function that does not fetch anything
		},
		getDimensions: function getDimensions() {
			console.debug(this.dimensions.length);
			if (this.dimensions.length == 0) {
				var processDimensions = function processDimensions(dimensions){
					return this.dimensions;
				};
				this.fetchDimensions(processDimensions);
			} else {
				return this.dimensions;
			}
		},
		fetchDimensions: function fetchDimensions() {	
			//empty function that does not fetch anything
		}
	}
	
	/* olap.Measure
	*   <p>
	*   Wrapper for OLAP Measures
	*   </p>
	*   @class olap.Measure
	*   @constructor
	*   @param {Object} JS object representing object properties.  Often used to rehydrate objects after external persistence
	*   @param {olap.Cube} cube The olap.Cube that this Measure belongs to
	*/ 
	olap.Measure = function Measure(measure, $cube) {
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
		getHierarchy: function () {
			return new olap.Hierarchy({HIERARCHY_NAME:'Measures', HIERARCHY_UNIQUE_NAME:'[Measures]'});
		},
		getName: function () {
			return this.MEASURE_NAME;
		},
		getUniqueName: function () {
			return this.MEASURE_UNIQUE_NAME;
		}
	}
	
	/* olap.Dimension
	*   <p>
	*   Wrapper for OLAP Dimensions
	*   </p>
	*   @class olap.Dimension
	*   @constructor
	*   @param {Object} JS object representing object properties.  Often used to rehydrate objects after external persistence
	*   @param {olap.Cube} cube The olap.Cube that this Dimension belongs to
	*/
	olap.Dimension = function Dimension(dim, $cube) {
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
		this.id = olap.Dimension.id++;
		olap.Dimension.instances[this.id] = this;				
	}
	olap.Dimension.id = 1;
	olap.Dimension.instances = {};
	olap.Dimension.getInstance = function(id){
	    return olap.Dimension.instances[id];
	};
	olap.Dimension.prototype = {
		addHierarchy: function addHierarchy(hierarchy, callback) {
			this.hierarchies.push(hierarchy);
			if (typeof callback == 'function') {
				callback(hierarchy);
			}
			return hierarchy;
		},
		getUniqueName: function getUniqueName(){
			return this.DIMENSION_UNIQUE_NAME;
		},
		getName: function getUniqueName(){
			return this.DIMENSION_NAME;
		}
	}
	
	/* olap.Hierarchy
	*   <p>
	*   Wrapper for OLAP Hierarchies
	*   </p>
	*   @class olap.Hierarchy
	*   @constructor
	*   @param {Object} JS object representing object properties.  Often used to rehydrate objects after external persistence
	*   @param {olap.Dimension} dimension The olap.Dimension that this Hierarchy belongs to
	*/
	olap.Hierarchy = function Hierarchy(hierarchy, $dim){
		this.ALL_MEMBER = hierarchy.ALL_MEMBER || "";
		this.DEFAULT_MEMBER = hierarchy.DEFAULT_MEMBER || "";
		this.DESCRIPTION    = hierarchy.DESCRIPTION || "";
		this.HIERARCHY_CAPTION = hierarchy.HIERARCHY_CAPTION || "";
		this.HIERARCHY_CARDINALITY = hierarchy.HIERARCHaY_CARDINALITY || "";
		this.HIERARCHY_NAME        = hierarchy.HIERARCHY_NAME || "";
		this.HIERARCHY_ORDINAL     = hierarchy.HIERARCHY_ORDINAL || 0;
		this.HIERARCHY_UNIQUE_NAME = hierarchy.HIERARCHY_UNIQUE_NAME || "";
		this.PARENT_CHILD          = hierarchy.PARENT_CHILD == 'true' ? true : false;
		this.STRUCTURE             = hierarchy.STRUCTURE || 0;
		this.DIMENSION_UNIQUE_NAME = hierarchy.DIMENSION_UNIQUE_NAME;
		this.CUBE_NAME             = hierarchy.CUBE_NAME;
		this.SCHEMA_NAME           = hierarchy.SCHEMA_NAME;
		this.CATALOG_NAME          = hierarchy.CATALOG_NAME;
		this.levels                = [];
		this.dimension = $dim;
		this.id = olap.Hierarchy.id++;
		olap.Hierarchy.instances[this.id] = this;		
	}
	olap.Hierarchy.id = 1;
	olap.Hierarchy.instances = {};
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
			this.levels.push(level);
			if (typeof callback == 'function') {
				callback(level);
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
		getHierarchy: function () {
			return this;
		},
		getName: function () {
			return this.HIERARCHY_NAME;
		},
		getUniqueName: function () {
			return this.HIERARCHY_UNIQUE_NAME;
		}
	}
	
	/* olap.Level
	*   <p>
	*   Wrapper for OLAP Levels
	*   </p>
	*   @class olap.Level
	*   @constructor
	*   @param {Object} JS object representing object properties.  Often used to rehydrate objects after external persistence
	*   @param {olap.Hierarchy} hierarchy The olap.Hierarchy that this Level belongs to
	*/
	olap.Level = function Level(level, $hier) {
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
		addMember: function addLevel(mem, callback) {
			this.members.push(mem);
			if (typeof callback == 'function') {
				callback(mem);
			}
			return mem;
		},
		getName:  function getName(){
			return this.LEVEL_NAME;
		},
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
		}

	}
	
	/* olap.Member
	*   <p>
	*   Wrapper for OLAP Members
	*   </p>
	*   @class olap.Member
	*   @constructor
	*   @param {Object} JS object representing object properties.  Often used to rehydrate objects after external persistence
	*   @param {olap.Level} level The olap.Level that this Member belongs to
	*/
	olap.Member = function Member(member, $level) {
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
		getName: function getName(){
			return this.MEMBER_NAME;
		},
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
	
	/* olap.CellSet
	  *
	*/
	olap.CellSet = function CellSet($cellset){
		//console.debug('func Call: ' + arguments.callee.name);
		this.axes       = $cellset.axes || [];
		this.filterAxis = $cellset.filterAxis || {};
		this.cells      = $cellset.cells || [];
		this.CUBE_NAME  = $cellset.cubeName || '';
	}
	olap.CellSet.prototype = {
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
		}
	}
	
	/* olap.Query
	  *
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
			var results = this.results || new olap.CellSet({});;
			if (typeof callback == 'function') {
				callback.call(this, results);
				delete results;
			} else {
				return results;
			}
		}
	}
	
	
	/* olap.Axis
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
	
	/* olap.MemberExpression
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
	
	/* olap.ExpressionCollection
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