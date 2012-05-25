var olapXmla = function olapXmla(){
    new olap.call(this);
};

olapXmla.Connection = function XmlaConnection($connection){
    var conn = $connection || {};
    olap.Connection.call(this, conn);
    this.xmla = new Xmla({});
    this.xmla.setOptions({
	async: false,
	url: conn.url || "http://localhost:8080/pentaho/Xmla",
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
	    //console.debug('func Call: ' + arguments.callee.name);
	    var cellset = xmla_dataset.fetchAsObject();
	    results = new olap.CellSet(cellset);
	    if (typeof options.success ==  'function') {
		options.success(results);
	    }
	    return results;
	}			
    });
};

olapXmla.Connection.prototype.addDataSource = function XmlaAddDataSource(source, callback) {
	var ds = new olapXmla.Datasource(source, this)
	olap.Connection.prototype.addDataSource.call(this, ds)
	return ds;
}

olapXmla.Connection.prototype.fetchOlapDatasources = function XmlaFetchOlapDatasources(){
    var that = this, raw_sources, source, ds;
    raw_sources = this.xmla.discoverDataSources({});
    
    while (source = raw_sources.fetchAsObject()) {
	    ds = new olapXmla.Datasource({
		DATA_SOURCE_DESCRIPTION:source.DataSourceDescription|| "",
		DATA_SOURCE_NAME:source.DataSourceName || "",
		DATA_SOURCE_INFO:source.DataSourceInfo || "",
		PROVIDER_NAME:source.ProviderName   || "",
		PROVIDER_TYPE:source.ProviderType || "",
		URL:source.URL            || "",
		AUTHENTICATION_MODE:source.AuthenticationMode || ""
	    }, this)
	    that.addDataSource.call(this, ds);
    }
    raw_sources.close();
    delete raw_sources;
}

olapXmla.Datasource = function XmlaDatasource($datasource, conn){
    //this.catalogs = [];
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

olapXmla.Catalog.prototype.getCubes = function getCubes(filter, callback) {

	var properties = {}, rowset, cube, that=this;
	properties[Xmla.PROP_CATALOG] = this.CATALOG_NAME;
	rowset = this.datasource.connection.xmla.discoverMDCubes({
		properties: properties
	});
	if (rowset.hasMoreRows()) {
		while (cube = rowset.fetchAsObject()){
			this.addCube(new olapXmla.Cube(cube, this), callback);
		}                        
	}
	return this.cubes;

}

olapXmla.Cube = function XmlaCube($Cube,$catalog){
    olap.Cube.call(this, $Cube, $catalog);
}

inheritPrototype(olapXmla.Cube, olap.Cube);

olapXmla.Cube.prototype.getDimensions = function getDimensions(filter, callback) {

	var properties = {}, rowset, dim, that=this;
        properties[olap.PROP_CATALOG] = this.catalog.CATALOG_NAME;
	var restrictions = {};
	restrictions["CATALOG_NAME"] = this.catalog.CATALOG_NAME;
	restrictions["CUBE_NAME"]    = this.CUBE_NAME;	
	rowset = this.catalog.datasource.connection.xmla.discoverMDDimensions({
		restrictions: restrictions
	});
	if (rowset.hasMoreRows()) {
	    while (dim= rowset.fetchAsObject()){
		this.addDimension(new olapXmla.Dimension(dim, this), callback);
	    }                        
	}
	return this.dimensions;
}

olapXmla.Cube.prototype.getMeasures = function getMeasures(filter, callback) {

    var properties = {}, rowset, obj, that=this;
    //properties[olap.PROP_CATALOG] = this.catalog.CATALOG_NAME;
    var restrictions = {};
    restrictions["CATALOG_NAME"] = this.catalog.CATALOG_NAME;
    restrictions["CUBE_NAME"]    = this.CUBE_NAME;	
    rowset = this.catalog.datasource.connection.xmla.discoverMDMeasures({
	    restrictions: restrictions
    });
    if (rowset.hasMoreRows()) {
	    while (obj= rowset.fetchAsObject()){
		this.addMeasure(new olapXmla.Measure(obj, this), callback);
	    }                        
    }
    return this.measures;
}

olapXmla.Dimension = function XmlaDimension($dim,$cube){
    olap.Dimension.call(this, $dim, $cube);
}

inheritPrototype(olapXmla.Dimension, olap.Dimension);

olapXmla.Dimension.prototype.getHierarchies = function getHierarchies(filter, callback) {
    var properties = {}, rowset, hierarchy, that=this;
    properties[olap.PROP_CATALOG] = this.cube.catalog.CATALOG_NAME;
    var restrictions = {};
    restrictions["CATALOG_NAME"] = this.cube.catalog.CATALOG_NAME;
    restrictions["CUBE_NAME"]    = this.cube.CUBE_NAME;	
    restrictions["DIMENSION_UNIQUE_NAME"] = this.DIMENSION_UNIQUE_NAME;	
    rowset = this.cube.catalog.datasource.connection.xmla.discoverMDHierarchies({
	    restrictions: restrictions
    });
    if (rowset.hasMoreRows()) {
	    while (hierarchy = rowset.fetchAsObject()){
		this.addHierarchy(new olapXmla.Hierarchy(hierarchy, this), callback);
	    }                        
    }
    return this.hierarchies;
}

olapXmla.Hierarchy = function XmlaHierarchy($hier,$dim){
    olap.Hierarchy.call(this, $hier, $dim);
}

inheritPrototype(olapXmla.Hierarchy, olap.Hierarchy);

olapXmla.Hierarchy.prototype.getLevels = function getLevels(filter, callback) {
    var properties = {}, rowset, obj, that=this;
    properties[olap.PROP_CATALOG] = this.dimension.cube.catalog.CATALOG_NAME;
    var restrictions = {};
    restrictions["CATALOG_NAME"] = this.dimension.cube.catalog.CATALOG_NAME;
    restrictions["CUBE_NAME"]    = this.dimension.cube.CUBE_NAME;	
    restrictions["DIMENSION_UNIQUE_NAME"] = this.dimension.DIMENSION_UNIQUE_NAME;	
    restrictions["HIERARCHY_UNIQUE_NAME"] = this.HIERARCHY_UNIQUE_NAME;
    rowset = this.dimension.cube.catalog.datasource.connection.xmla.discoverMDLevels({
	    restrictions: restrictions
    });
    if (rowset.hasMoreRows()) {
	    while (obj = rowset.fetchAsObject()){
		this.addLevel(new olapXmla.Level(obj, this), callback);
	    }                        
    }
    return this.levels;
}

olapXmla.Level = function XmlaLevel($level,$hier){
    olap.Level.call(this, $level, $hier);
}

inheritPrototype(olapXmla.Level, olap.Level);

olap.Level.prototype.getMembers = function getMembers(filter, callback) {
    var properties = {}, rowset, obj, that=this;
    properties[olap.PROP_DATASOURCEINFO] = this.hierarchy.dimension.cube.catalog.datasource[olap.PROP_DATASOURCEINFO];
    properties[olap.PROP_CATALOG] = this.hierarchy.dimension.cube.catalog.CATALOG_NAME;
    var restrictions = {};
    restrictions["CATALOG_NAME"] = this.hierarchy.dimension.cube.catalog.CATALOG_NAME;
    restrictions["CUBE_NAME"]    = this.hierarchy.dimension.cube.CUBE_NAME;	
    restrictions["DIMENSION_UNIQUE_NAME"] = this.hierarchy.dimension.DIMENSION_UNIQUE_NAME;	
    restrictions["HIERARCHY_UNIQUE_NAME"] = this.hierarchy.HIERARCHY_UNIQUE_NAME;
    restrictions["LEVEL_UNIQUE_NAME"]          = this.LEVEL_UNIQUE_NAME;
    rowset = this.hierarchy.dimension.cube.catalog.datasource.connection.xmla.discoverMDMembers({
	    restrictions: restrictions
    });
    if (rowset.hasMoreRows()) {
	    while (obj = rowset.fetchAsObject()){
		this.addMember(new olapXmla.Member(obj, this), callback);
	    }                        
    } 
    return this.members
}

olapXmla.Member = function XmlaMember($Member,$level){
    olap.Member.call(this, $Member, $level);
}

inheritPrototype(olapXmla.Member, olap.Member);

olapXmla.Measure = function XmlaMeasure($Measure,$cube){
    olap.Measure.call(this, $Measure, $cube);
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


