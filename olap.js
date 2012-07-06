(function olap(global){

	/* olap module boiler plate
	  *
	*/
	var olap;
	if (typeof exports !== 'undefined') {
		olap = exports;
	} else {
		olap = global.olap = {};
	}

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
		
	}
	olap.Connection.prototype.getOlapDatabases = function getOlapDatabases(callback){
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
	}
	olap.Connection.prototype.fetchOlapDatasources = function fetchOlapDatasources(callback){
		//empty function that does not fetch anything
	}
	olap.Connection.prototype.addDataSource = function addDataSource(source, callback) {
		if ((source instanceof Object) && (source instanceof olap.Datasource == false)) { //do we have an object as param and it is not already a Datasource
			source = new olap.Datasource(source, this);
		}
		this.sources.push(source);
		if (callback && typeof callback == 'function') {
			callback.call(this, source);
		}
		return source;
	}
	
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
	}
	olap.Datasource.prototype.getOlapConnection = function getOlapConnection() {
		return this.connection;
	}
	olap.Datasource.prototype.getName = function getName() {
		return this.DATA_SOURCE_NAME;
	}
	olap.Datasource.prototype.getDescription = function getDescription() {
		return this.DATA_SOURCE_DESCRIPTION;
	}
	olap.Datasource.prototype.getProviderName = function getProviderName() {
		return this.PROVIDER_NAME;
	}
	olap.Datasource.prototype.getURL = function getURL() {
		return this.URL;
	}
	olap.Datasource.prototype.getDataSourceInfo = function getDataSourceInfo() {
		return this.DATA_SOURCE_INFO;
	}
	olap.Datasource.prototype.getCatalogs = function getCatalogs() {
		if (this.catalogs.length == 0) {
			this.fetchCatalogs();
		}
		return this.catalogs;
	}
	olap.Datasource.prototype.fetchCatalogs = function fetchCatalogs() {	
		//empty function that does not fetch anything
	}
	olap.Datasource.prototype.addCatalog = function addCatalog(catalog, callback) {
		if ((catalog instanceof Object) && (catalog instanceof olap.Catalog == false)) { //do we have an object as param and it is not already a Catalog
			catalog = new olap.Catalog(catalog, this);
		}

		this.catalogs.push(catalog);
		if (typeof callback == 'function') {
			callback(catalog);
		}
		return catalog;
		
	}
	
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
		this.cubes         = catalog.cubes         || [];
		this.datasource    = $s;
	}
	olap.Catalog.prototype.addCube = function addCube(cube, callback) {
		this.cubes.push(cube);
		if (typeof callback == 'function') {
			callback(cube);
		}
		return cube;
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
		this.catalog    = $cat || {};
	}
	
	olap.Cube.prototype.getName = function getName() {
		return this.CUBE_NAME;
	}
	olap.Cube.prototype.addDimension = function addDimension(dimension, callback) {
		this.dimensions.push(dimension);
		if (typeof callback == 'function') {
			callback(dimension);
		} 
		return dimension;
	}
	olap.Cube.prototype.addMeasure = function addMeasure(measure, callback) {
		this.measures.push(measure);
		if (typeof callback == 'function') {
			callback(measure);
		} 
		return measure;
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
		this.DATA_TYPE = measure.DATA_TYPE || 0;
		this.DEFAULT_FORMAT_STRING = measure.DEFAULT_FORMAT_STRING || ""
		this.DESCRIPTION = measure.DESCRIPTION || "";
		this.MEASURE_AGGREGATOR = measure.MEASURE_AGGREGATOR || 0;
		this.MEASURE_IS_VISIBLE = measure.MEASURE_IS_VISIBLE || false;
		this.MEASURE_NAME       = measure.MEASURE_NAME || "";
		this.MEASURE_UNIQUE_NAME= measure.MEASURE_UNIQUE_NAME || "";
		this.cube = $cube
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
		this.cube = $cube
	}
	olap.Dimension.prototype.addHierarchy = function addHierarchy(hierarchy, callback) {
		this.hierarchies.push(hierarchy);
		if (typeof callback == 'function') {
			callback(hierarchy);
		}
		return hierarchy;
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
	olap.Hierarchy =function Hierarchy(hierarchy, $dim){
		this.ALL_MEMBER = hierarchy.ALL_MEMBER || "";
		this.DEFAULT_MEMBER = hierarchy.DEFAULT_MEMBER || "";
		this.DESCRIPTION    = hierarchy.DESCRIPTION || "";
		this.HIERARCHY_CAPTION = hierarchy.HIERARCHY_CAPTION || "";
		this.HIERARCHY_CARDINALITY = hierarchy.HIERARCHY_CARDINALITY || "";
		this.HIERARCHY_NAME        = hierarchy.HIERARCHY_NAME || "";
		this.HIERARCHY_ORDINAL     = hierarchy.HIERARCHY_ORDINAL || 0;
		this.HIERARCHY_UNIQUE_NAME = hierarchy.HIERARCHY_UNIQUE_NAME || "";
		this.PARENT_CHILD          = hierarchy.PARENT_CHILD == 'true' ? true : false;
		this.STRUCTURE             = hierarchy.STRUCTURE || 0;
		this.levels                = [];
		this.dimension = $dim;
	}
	olap.Hierarchy.prototype.addLevel = function addLevel(level, callback) {
		this.levels.push(level);
		if (typeof callback == 'function') {
			callback(level);
		}
		return level;
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
		this.LEVEL_TYPE        = level.LEVEL_TYPE || 0;
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
					throw new Error('hierarchy of level is not a valid object' + $hier.toString());
				}
			}
		}
	}
	olap.Level.prototype.addMember = function addLevel(mem, callback) {
		this.members.push(mem);
		if (typeof callback == 'function') {
			callback(mem);
		}
		return mem;
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
		this.MEMBER_ORDINAL     = member.MEMBER_ORDINAL
		//TODO put member properties here
		//this.properties   = [];
		this.level = $level;
	}
	olap.Member.validMethods = ['Children', 'Cousin', 'FirstChild', 'FirstSibling','LastChild', 'LastSibling', 'NextMember', 'Parent', 'PrevMember', 'Siblings'];
	//hold on her 'Ascendants', 'Descendants', 'Lag', 'Lead', 'Mtd', 'Qtd', 'Rank', 'Siblings', 'Qtd', 'Wtd', 'Ytd'
	olap.Member.sugarMethods = ['Self', 'GrandParent', 'GrandChild'];
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
		var idx;
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
				return "";
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
	}
	olap.CellSet.prototype.getAxes = function getAxes(){
		return this.axes;
	}
	olap.CellSet.prototype.getFilterAxis = function getFilterAxis(){
		return this.filterAxis;
	}
	olap.CellSet.prototype.getCell = function getCell(index){
		return this.cells[index];
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
	}
	//class properties and functions....
	olap.Query.id = 0;
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
		this.hierarchies = [];
	}
	olap.Axis.prototype = {
		getLocation: function getLocation(){
			return this.location;
		},	
		getName: function getName(){
			return this.name;
		},
		addExpression: function addExpression(expression){
			if (!expression instanceof olap.Expression) {
				var expression = new olap.Expression(expression);
			}
			this.members.push(exp);
		},
		reset: function(){
			this.hierarchies = [];			
		}
	}
	
	/* olap.MemberExpression
	  *
	*/
	olap.Expression = function Expression(expression){
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
			//TODO Add other classes in here Hierarchy, Level
			if (this.base instanceof olap.Member) {
				return olap.Member.isMethodValid(method);
			}
			return false;
		},
		toMDX: function(){
			return this.base.toMDX(this.getMethod(), this.getParameters());
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
	olap.Expression.prototype.getFunction = function getFunction(){
		return this.expFunction;
	}

	/* olap.SetExpression
	  *
	*/
	olap.SetExpression = function SetExpression(expression){
	}	

	inheritPrototype(olap.SetExpression, Array)
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
