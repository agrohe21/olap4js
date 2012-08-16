(function olapSaiku(global){

	/* olapSaiku module boiler plate
	  *
	*/
	var olapSaiku;
	if (typeof exports !== 'undefined') {
		olapSaiku = exports;
	} else {
		olapSaiku = global.olapSaiku = {};
	}

    olapSaiku.Connection = function SaikuConnection($connection){
	var conn = $connection || {};
	olap.Connection.call(this, conn);
    }
    
    inheritPrototype(olapSaiku.Connection, olap.Connection);
    
    olapSaiku.Connection.prototype = {
	executeOlapQuery: function SaikuExecuteOlapQuery(options){
	},
	addDataSource: function XmlaAddDataSource(source, callback) {
	    var ds = new olapSaiku.Datasource(source, this)
	    olap.Connection.prototype.addDataSource.call(this, ds)
	    return ds;
	},
	fetchOlapDatasources: function XmlaFetchOlapDatasources(callback){
	}
    }
    
    olapSaiku.Datasource = function XmlaDatasource($datasource, conn){
	olap.Datasource.call(this, $datasource, conn);
    }
    
    inheritPrototype(olapSaiku.Datasource, olap.Datasource);
    
    olapSaiku.Datasource.prototype.fetchCatalogs = function XmlaFetchCatalogs() {
    
	return this.catalogs;
    }
    
    olapSaiku.Datasource.prototype.addCatalog = function XmlaAddCatalog(catalog, callback) {
	    var cat = new olapSaiku.Catalog(catalog, this)
	    olap.Datasource.prototype.addCatalog.call(this, cat)
	    return cat;
    }
    
    /*
     * olapSaiku.Catalog
     *
    */
      
    olapSaiku.Catalog = function XmlaCatalog($catalog,$datasource){
	olap.Catalog.call(this, $catalog, $datasource);
    }
    
    inheritPrototype(olapSaiku.Catalog, olap.Catalog);
    
    olapSaiku.Catalog.prototype.getCubes = function f(filter, callback) {    
    }
    
    olapSaiku.Cube = function SaikuCube($Cube,$catalog){
	olap.Cube.call(this, $Cube, $catalog);
    }

    olapSaiku.Cube.getCubes = function getCubes(source) {
    
	    var properties = {}, rowset, cube, cubes=[];
	    rowset = source.connection.xmla.discoverMDCubes({
		    properties: properties
	    });
	    if (rowset.hasMoreRows()) {
		    while (cube = rowset.fetchAsObject()){
			    cubes.push(new olapSaiku.Cube(cube));
		    }                        
	    }
	    rowset.close();
	    return cubes;
    
    }
    
    inheritPrototype(olapSaiku.Cube, olap.Cube);
    
    olapSaiku.Cube.prototype = {
	getDimensions: function getDimensions(filter, callback) {
    
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
		    this.addDimension(new olapSaiku.Dimension(dim, this), callback);
		}                        
	    }
	    return this.dimensions;
	},
	getMeasures: function getMeasures(filter, callback) {
    
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
			this.addMeasure(new olapSaiku.Measure(obj, this), callback);
		    }                        
	    }
	    return this.measures;
	}
    }
    
    olapSaiku.Dimension = function SaikuDimension($dim,$cube){
	olap.Dimension.call(this, $dim, $cube);
    }
    //add in fetch for each get
    //start on dimension expression tesing from here....
    olapSaiku.Dimension.getDimensions = function getDimensions(source) {
    
	var properties = {}, rowset, dim, dims=[];
	var restrictions = {};
	rowset = source.connection.xmla.discoverMDDimensions({
		restrictions: restrictions
	});
	if (rowset.hasMoreRows()) {
	    while (dim= rowset.fetchAsObject()){
		//console.log(dim);
		dims.push(new olapSaiku.Dimension(dim));
	    }                        
	}
	return dims;
    }

    inheritPrototype(olapSaiku.Dimension, olap.Dimension);
    
    olapSaiku.Dimension.prototype.getHierarchies = function getHierarchies(filter, callback) {
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
		    this.addHierarchy(new olapSaiku.Hierarchy(hierarchy, this), callback);
		}                        
	}
	return this.hierarchies;
    }
    
    olapSaiku.Hierarchy = function SaikuHierarchy($hier,$dim){
	olap.Hierarchy.call(this, $hier, $dim);
    }
    
    inheritPrototype(olapSaiku.Hierarchy, olap.Hierarchy);
    
    olapSaiku.Hierarchy.prototype.getLevels = function getLevels(filter, callback) {
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
		    this.addLevel(new olapSaiku.Level(obj, this), callback);
		}                        
	}
	return this.levels;
    }
    
    olapSaiku.Level = function SaikuLevel($level,$hier){
	olap.Level.call(this, $level, $hier);
    }
    
    inheritPrototype(olapSaiku.Level, olap.Level);
    
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
		    this.addMember(new olapSaiku.Member(obj, this), callback);
		}                        
	} 
	return this.members
    }
    
    olapSaiku.Member = function SaikuMember($Member,$level){
	olap.Member.call(this, $Member, $level);
    }
    
    inheritPrototype(olapSaiku.Member, olap.Member);
    
    olapSaiku.Measure = function SaikuMeasure($Measure,$cube){
	olap.Measure.call(this, $Measure, $cube);
    }
    
    inheritPrototype(olapSaiku.Measure, olap.Measure);
    
    olapSaiku.Query= function SaikuQuery($Query, $cube, $connection, $catalog){
	olap.Query.call(this, $Query, $cube);
	this.connection = $connection || {};
	this.catalog = $catalog ||{};
    }
    
    inheritPrototype(olapSaiku.Query, olap.Query);
    
    olapSaiku.Query.prototype.execute = function execute(callback) {
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
