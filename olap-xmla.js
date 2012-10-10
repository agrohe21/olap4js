(function olapXmla(global){

	/* olapXmla module boiler plate
	  *
	*/
	var olapXmla;
	if (typeof exports !== 'undefined') {
		olapXmla = exports;
	} else {
		olapXmla = global.olapXmla = {};
	}

    olapXmla.Connection = function XmlaConnection($connection){
	if (!window.location.origin) window.location.origin = window.location.protocol+"//"+window.location.host;	
	var conn = $connection || {};
	olap.Connection.call(this, conn);
	this.xmla = new Xmla({});
	this.xmla.setOptions({
	    async: false,
	    url: conn.url || window.location.origin + "/" + window.location.pathname.split( '/' )[1] + "/Xmla",
	    roles: conn.roles || [],
	    DataSourceInfo: 'Provider=' + conn.provider || 'Mondrian' + ';DataSource=' + conn.datasource || 'Pentaho'
	    });
    }
    
    inheritPrototype(olapXmla.Connection, olap.Connection);
    
    olapXmla.Connection.prototype.executeOlapQuery = function XmlaExecuteOlapQuery(options){
		//console.debug('func Call: ' + arguments.callee.name);
	    var that=this, properties = {}, results, dataset, cells, tmp_results, axis;
	    properties[Xmla.PROP_FORMAT]         = Xmla.PROP_FORMAT_MULTIDIMENSIONAL;
	    if (options.catalog && options.catalog !== "") {
		properties[Xmla.PROP_CATALOG] = options.catalog;
	    } else {
		throw new Error('An MDX query must have a catalog specified in options')
	    }
	    dataset = that.xmla.execute({
		statement: options.mdx,
		properties: properties,
		success: function xmlaExecuteSuccess($xmla, $options, xmla_dataset){
			var getAxisAsObject = function getAxisAsObject($axis){
				var i,j, idx, hier, tuple, pos, member, axis={hierarchies:[], positions:[]}, _hier;
				for (i=0, j=$axis.hierarchies.length;i<j;i++){
					hier = $axis.hierarchies[i];
					axis.hierarchies.push({HIERARCHY_UNIQUE_NAME:hier.name});
				}
				for (i=0, j=$axis.positions.length;i<j;i++){
					tuple = $axis.positions[i];
					pos = {};
					for (idx in tuple){
						member = tuple[idx];
						pos[idx] ={
							MEMBER_UNIQUE_NAME: member.UName,
							MEMBER_CAPTION: member.Caption,
							LEVEL_UNIQUE_NAME: member.LName,
							LEVEL_NUMBER: member.LNum
						};
					}
					axis.positions.push(pos);
				}
				return axis;
			}
			//document.body.appendChild(prettyPrint(xmla_dataset, { maxDepth:10 } ));
		    var xmla_cellset = xmla_dataset.fetchAsObject();
			var cellset = {
				CUBE_NAME:xmla_cellset.cubeName,
				axes: [],
				SLICER: {}
			}, axis = {};
			for (var i=0, j=xmla_cellset.axes.length;i<j;i++) {
				axis = xmla_cellset.axes[i];
				cellset.axes.push(getAxisAsObject(axis));
			}
			cellset.SLICER = getAxisAsObject(xmla_cellset.filterAxis);
		    results = new olap.CellSet(cellset, options.catalog);
		    if (typeof options.success ==  'function') {
				options.success(results);
		    }
		    return results;
		}			
	    });
	}
    olapXmla.Connection.prototype.addDataSource = function XmlaAddDataSource(source, callback) {
	    var ds = new olapXmla.Datasource(source, this)
	    olap.Connection.prototype.addDataSource.call(this, ds)
	    return ds;
	}
    olapXmla.Connection.prototype.fetchOlapDatasources = function XmlaFetchOlapDatasources(callback){
	    var that = this, raw_sources, source, ds;
	    this.xmla.discoverDataSources({success: function XmlaDiscoverDatasourceSuccess(xmla, request, raw_sources){
		while (source = raw_sources.fetchAsObject()) {
			ds = new olapXmla.Datasource({
			    DATA_SOURCE_DESCRIPTION:source.DataSourceDescription|| "",
			    DATA_SOURCE_NAME:source.DataSourceName || "",
			    DATA_SOURCE_INFO:source.DataSourceInfo || "",
			    PROVIDER_NAME:source.ProviderName   || "",
			    PROVIDER_TYPE:source.ProviderType || "",
			    URL:source.URL            || "",
			    AUTHENTICATION_MODE:source.AuthenticationMode || ""
			}, that)
			that.addDataSource.call(that, ds);
		}
		raw_sources.close();
		delete raw_sources;
		callback.call(that, that.sources)
	    }});
	    
	}
    
    olapXmla.Datasource = function XmlaDatasource($datasource, conn){
	olap.Datasource.call(this, $datasource, conn);
    }
    
    inheritPrototype(olapXmla.Datasource, olap.Datasource);
    
    olapXmla.Datasource.prototype.fetchCatalogs = function XmlaFetchCatalogs() {
    
	    var properties = {}, rowset, catalog, that=this;
	    rowset = this.connection.xmla.discoverDBCatalogs({
		    properties: properties
	    });
	    if (rowset.hasMoreRows()) {
		    while (catalog = rowset.fetchAsObject()){
			    this.addCatalog(catalog);
		    }
	    } 
	return this.catalogs;
    }
    
    olapXmla.Datasource.prototype.addCatalog = function XmlaAddCatalog(catalog, callback) {
	    var cat = new olapXmla.Catalog(catalog, this)
	    olap.Datasource.prototype.addCatalog.call(this, cat)
	    return cat;
    }
    
    /*
     * olapXmla.Catalog
     *
    */
      
    olapXmla.Catalog = function XmlaCatalog($catalog,$datasource){
	olap.Catalog.call(this, $catalog, $datasource);
    }
    
    inheritPrototype(olapXmla.Catalog, olap.Catalog);
    
    olapXmla.Catalog.prototype.fetchCubes = function XmlaFetchCubes() {
    
	    var properties = {}, rowset, cube, that=this;
	    properties[Xmla.PROP_CATALOG] = this.CATALOG_NAME;
	    rowset = this.datasource.connection.xmla.discoverMDCubes({
		    properties: properties
	    });
	    if (rowset.hasMoreRows()) {
		    while (cube = rowset.fetchAsObject()){
			    this.addCube(new olapXmla.Cube(cube, this));
		    }                        
	    }
	    return this.cubes;
    
    }
	
    olapXmla.Catalog.prototype.addCube = function XmlaAddCube(cube, callback) {
	    var cube = new olapXmla.Cube(cube, this)
	    olap.Catalog.prototype.addCube.call(this, cube)
	    return cube;
    }	
    
    olapXmla.Cube = function XmlaCube($Cube,$catalog){
		olap.Cube.call(this, $Cube, $catalog);
    }    
    inheritPrototype(olapXmla.Cube, olap.Cube);
    
    olapXmla.Cube.prototype.getDimensions = function getDimensions(filter, callback) {
    
	    var properties = {}, rowset, dim, that=this;
            properties[Xmla.PROP_CATALOG] = this.CATALOG_NAME;
	    var restrictions = {};
	    restrictions["CATALOG_NAME"] = this.CATALOG_NAME;
	    restrictions["CUBE_NAME"]    = this.CUBE_NAME;
	    rowset = this.catalog.datasource.connection.xmla.discoverMDDimensions({
		    properties: properties,
		    restrictions: restrictions
	    });
	    if (rowset.hasMoreRows()) {
		while (dim= rowset.fetchAsObject()){
		    this.addDimension(new olapXmla.Dimension(dim, this), callback);
		}                        
	    }
	    rowset.close();
	    return this.dimensions;
    }
    olapXmla.Cube.prototype.fetchMeasures = function fetchMeasures() {
    
	    var properties = {}, rowset, obj, that=this;
            properties[Xmla.PROP_CATALOG] = this.CATALOG_NAME;
	    var restrictions = {};
	    restrictions["CATALOG_NAME"] = this.CATALOG_NAME;
	    restrictions["CUBE_NAME"]    = this.CUBE_NAME;
	    rowset = this.catalog.datasource.connection.xmla.discoverMDMeasures({
		    properties: properties,
		    restrictions: restrictions
	    });
	    if (rowset.hasMoreRows()) {
		    while (obj= rowset.fetchAsObject()){
			this.addMeasure(new olapXmla.Measure(obj, this));
		    }                        
	    }
	    rowset.close();
	    return this.measures;
    }
    
    
    olapXmla.Dimension = function XmlaDimension($dim,$cube){
	olap.Dimension.call(this, $dim, $cube);
    }
    //add in fetch for each get
    //start on dimension expression tesing from here....
    olapXmla.Dimension.getDimensions = function getDimensions(source) {
    
	var properties = {}, rowset, dim, dims=[];
	var restrictions = {};
	rowset = source.connection.xmla.discoverMDDimensions({
		restrictions: restrictions
	});
	if (rowset.hasMoreRows()) {
	    while (dim= rowset.fetchAsObject()){
		dims.push(new olapXmla.Dimension(dim));
	    }                        
	}
	return dims;
    }

    inheritPrototype(olapXmla.Dimension, olap.Dimension);
    
    olapXmla.Dimension.prototype.getHierarchies = function getHierarchies(filter, callback) {
	var properties = {}, rowset, hierarchy, that=this;
	properties[Xmla.PROP_CATALOG] = this.cube.catalog.CATALOG_NAME;
	var restrictions = {};
	restrictions["CATALOG_NAME"] = this.cube.catalog.CATALOG_NAME;
	restrictions["CUBE_NAME"]    = this.cube.CUBE_NAME;	
	restrictions["DIMENSION_UNIQUE_NAME"] = this.DIMENSION_UNIQUE_NAME;	
	rowset = this.cube.catalog.datasource.connection.xmla.discoverMDHierarchies({
	    properties: properties,
	    restrictions: restrictions
	});
	if (rowset.hasMoreRows()) {
		while (hierarchy = rowset.fetchAsObject()){
		    this.addHierarchy(new olapXmla.Hierarchy(hierarchy, this), callback);
		}                        
	}
	rowset.close();
	return this.hierarchies;
    }
    
    olapXmla.Hierarchy = function XmlaHierarchy($hier,$dim){
	olap.Hierarchy.call(this, $hier, $dim);
    }

    olapXmla.Hierarchy.getHierarchies = function getHierarchies(connection) {
	//console.debug('func Call: ' + arguments.callee.name);
	var properties = {}, rowset, hierarchy, that=this, hiers=[], restrictions = {};
	rowset = connection.xmla.discoverMDHierarchies({
		restrictions: restrictions
	});
	if (rowset.hasMoreRows()) {
		while (hierarchy = rowset.fetchAsObject()){
		    hiers.push(new olapXmla.Hierarchy(hierarchy));
		}                        
	}
	return hiers;
    }
    
    inheritPrototype(olapXmla.Hierarchy, olap.Hierarchy);
    
    olapXmla.Hierarchy.prototype.getLevels = function getLevels(filter, callback) {
	var properties = {}, rowset, obj, that=this;
	properties[Xmla.PROP_CATALOG] = this.dimension.cube.catalog.CATALOG_NAME;
	var restrictions = {};
	restrictions["CATALOG_NAME"] = this.dimension.cube.catalog.CATALOG_NAME;
	restrictions["CUBE_NAME"]    = this.dimension.cube.CUBE_NAME;	
	restrictions["DIMENSION_UNIQUE_NAME"] = this.dimension.DIMENSION_UNIQUE_NAME;	
	restrictions["HIERARCHY_UNIQUE_NAME"] = this.HIERARCHY_UNIQUE_NAME;
	rowset = this.dimension.cube.catalog.datasource.connection.xmla.discoverMDLevels({
		properties: properties,
		restrictions: restrictions
	});
	if (rowset.hasMoreRows()) {
		while (obj = rowset.fetchAsObject()){
		    this.addLevel(new olapXmla.Level(obj, this), callback);
		}                        
	}
	rowset.close();
	return this.levels;
    }
    
    olapXmla.Level = function XmlaLevel($level,$hier){
	olap.Level.call(this, $level, $hier);
    }

    olapXmla.Level.getLevels = function getLevels(connection) {
	var properties = {}, rowset, obj, that=this, lvls=[];
	//properties[Xmla.PROP_CATALOG] = this.dimension.cube.catalog.CATALOG_NAME;
	var restrictions = {};
	/*
	 *restrictions["CATALOG_NAME"] = this.dimension.cube.catalog.CATALOG_NAME;
	restrictions["CUBE_NAME"]    = this.dimension.cube.CUBE_NAME;	
	restrictions["DIMENSION_UNIQUE_NAME"] = this.dimension.DIMENSION_UNIQUE_NAME;	
	restrictions["HIERARCHY_UNIQUE_NAME"] = this.HIERARCHY_UNIQUE_NAME;
	*/
	rowset = connection.xmla.discoverMDLevels({
		restrictions: restrictions
	});
	if (rowset.hasMoreRows()) {
		while (obj = rowset.fetchAsObject()){
		    lvls.push(new olapXmla.Level(obj, this));
		}                        
	}
	return lvls;
    }
    
    inheritPrototype(olapXmla.Level, olap.Level);
    
    olap.Level.prototype.getMembers = function getMembers(filter, callback) {
	var properties = {}, rowset, obj, that=this;
	properties[Xmla.PROP_CATALOG] = this.hierarchy.dimension.cube.catalog.CATALOG_NAME;
	var restrictions = {};
	restrictions["CATALOG_NAME"] = this.hierarchy.dimension.cube.catalog.CATALOG_NAME;
	restrictions["CUBE_NAME"]    = this.hierarchy.dimension.cube.CUBE_NAME;	
	restrictions["DIMENSION_UNIQUE_NAME"] = this.hierarchy.dimension.DIMENSION_UNIQUE_NAME;	
	restrictions["HIERARCHY_UNIQUE_NAME"] = this.hierarchy.HIERARCHY_UNIQUE_NAME;
	restrictions["LEVEL_UNIQUE_NAME"]          = this.LEVEL_UNIQUE_NAME;
	rowset = this.hierarchy.dimension.cube.catalog.datasource.connection.xmla.discoverMDMembers({
		properties: properties,
		restrictions: restrictions
	});
	if (rowset.hasMoreRows()) {
		while (obj = rowset.fetchAsObject()){
		    this.addMember(new olapXmla.Member(obj, this), callback);
		}                        
	}
	rowset.close();
	return this.members
    }
    
    olapXmla.Member = function XmlaMember($Member,$level){
	olap.Member.call(this, $Member, $level);
    }
    
    inheritPrototype(olapXmla.Member, olap.Member);
    
    olapXmla.Measure = function XmlaMeasure($Measure,$cube){
	olap.Measure.call(this, $Measure, $cube);
    }
    olapXmla.Measure.getMeasures = function getMeasures(connection){
		var idx, source, catalogs, catalog, cubes, cube, dimensions, dimension, hierarchies, hierarchy, levels, level, members, member, measures, measure, _measures = [];
		connection.getOlapDatabases(function(sources){
			for (idx in sources) {
			source = sources[idx];
			catalogs = source.getCatalogs();
			for (idx in catalogs){
				catalog = catalogs[idx];
				cubes = catalog.getCubes();
				for (idx in cubes){
				cube = cubes[idx];
				measures = cube.getMeasures();
				_measures = _measures.concat(measures);
				}
			}
			}
		})
		return _measures;
    }
    
    inheritPrototype(olapXmla.Measure, olap.Measure);
    
    olapXmla.Query= function XmlaQuery($Query, $cube, $connection, $catalog){
	olap.Query.call(this, $Query, $cube);
	this.connection = $connection || {};
	this.catalog = $catalog ||{};
    }
    
    inheritPrototype(olapXmla.Query, olap.Query);
    
    olapXmla.Query.prototype.execute = function execute(callback) {
	    var that=this, properties = {}, mdx, results, dataset, cells, tmp_results, axis;
	    
	    mdx = this.getMDX();
	    dataset = this.connection.executeOlapQuery({
		    mdx: mdx,
		    catalog: this.catalog,
		    success: function(results){
			if (typeof callback == 'function') {
			    callback.call(this, results);
			    delete results;
			}
		    }
	    });
    }


})(this);
