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
		var conn = $connection || {}, that = this;
		olap.Connection.call(this, conn);
		this.url = conn.url;
		$.ajax({
		  url: conn.url +'/session',
		  data:{}
		}).done(function(data) { 
		  that.sessionid = data;
		});		
    }
    
    inheritPrototype(olapSaiku.Connection, olap.Connection);
    
    olapSaiku.Connection.prototype.executeOlapQuery = function SaikuExecuteOlapQuery(options){
		var that = this;
		var uuid = 'xxxxxxxx-xxxx-xxxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, 
            function (c) {
                var r = Math.random() * 16 | 0,
                v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            }).toUpperCase();
		$.ajax({
		  url: that.url +'/joe/query/'+ uuid +'/result/flattened',
		  data:{mdx:'SELECT NON EMPTY {Hierarchize({[Measures].[Quantity]})} ON COLUMNS, NON EMPTY {Hierarchize({[Markets].[Territory].Members})} ON ROWS FROM [SteelWheelsSales]'}
		}).done(function(data) { 
			that.response = data;
			if (typeof options.success ==  'function') {
				options.success(data);
			}
			return data;
		});				
	}
	
	olapSaiku.Connection.prototype.addDataSource = function SaikuAddDataSource(source, callback) {
	    var ds = new olapSaiku.Datasource(source, this)
	    olap.Connection.prototype.addDataSource.call(this, ds)
	    return ds;
	}
	olapSaiku.Connection.prototype.fetchOlapDatasources = function SaikuFetchOlapDatasources(callback){
		var that = this;
		
		var processSaikuDiscover = function processSaikuDiscover(sources){
			var catalogs, catalog, source, idx, cubeIdx, cube, _cubes=[];
			for (var i=0,j=sources.length;i<j;i++){
				source=sources[i];
				catalogs = source.catalogs[0].schemas;
				for (idx in catalogs){
					catalog = catalogs[idx];
					_cubes=[];
					catalog.CATALOG_NAME = catalog.uniqueName;
					catalog.DESCRIPTION  = catalog.name;
					delete catalog.name;
					delete catalog.uniqueName;
					for (cubeIdx in catalog.cubes){
						cube = catalog.cubes[cubeIdx];
						//console.debug(cube);
						_cubes.push({CUBE_NAME:cube.uniqueName, DESCRIPTION: cube.name, SCHEMA_NAME: cube.schemaName, CATALOG_NAME: cube.catalogName});
					}
					catalog.cubes = _cubes;
				}
				source.catalogs = catalogs;
				ds = new olapSaiku.Datasource({
					DATA_SOURCE_DESCRIPTION:source.name|| "",
					DATA_SOURCE_NAME:source.uniqueName || "",
					catalogs:source.catalogs
				}, that)
				that.addDataSource.call(that, ds);		 
			}
			callback.call(that, that.sources)
		}
		
		$.ajax({
		  url: that.url +'/joe/discover/',
		  data:{'_':that.sessionid}
		}).done(processSaikuDiscover);
	}
    
    olapSaiku.Datasource = function SaikuDatasource($datasource, conn){
		olap.Datasource.call(this, $datasource, conn);
    }
    
    inheritPrototype(olapSaiku.Datasource, olap.Datasource);
    
    olapSaiku.Datasource.prototype.fetchCatalogs = function SaikuFetchCatalogs() {
		return this.catalogs;
    }
    
    olapSaiku.Datasource.prototype.addCatalog = function SaikuAddCatalog(catalog, callback) {
	    var cat = new olapSaiku.Catalog(catalog, this)
	    olap.Datasource.prototype.addCatalog.call(this, cat)
	    return cat;
    }
    
    /*
     * olapSaiku.Catalog
     *
    */
      
    olapSaiku.Catalog = function SaikuCatalog($catalog,$datasource){
		olap.Catalog.call(this, $catalog, $datasource);
    }
    
    inheritPrototype(olapSaiku.Catalog, olap.Catalog);
    
	olapSaiku.Catalog.prototype.addCube = function SaikuAddCube(cube, callback) {
	    var cube = new olapSaiku.Cube(cube, this)
	    olap.Catalog.prototype.addCube.call(this, cube)
	    return cube;
    }

    
    olapSaiku.Cube = function SaikuCube($Cube,$catalog){
		olap.Cube.call(this, $Cube, $catalog);
    }

    olapSaiku.Cube.getCubes = function getCubes(source) {
       
    }
    
    inheritPrototype(olapSaiku.Cube, olap.Cube);
    
    olapSaiku.Cube.prototype.fetchDimensions = function getDimensions(filter, callback) {
    
		var that = this;
		var processSaikuDimensions = function processSaikuDimensions(dimensions){
		
			for (var i=0, j=dimensions.length, obj=null;i<j;i++){
				obj = {
					DIMENSION_NAME: dimensions[i].name,
					DIMENSION_UNIQUE_NAME: dimensions[i].uniqueName,
					DESCRIPTION: dimensions[i].description,
					CAPTION: dimensions[i].caption,
					CUBE_NAME: that.CUBE_NAME,
					SCHEMA_NAME: that.SCHEMA_NAME,
					CATALOG_NAME: that.CATALOG_NAME
				};
				that.addDimension(new olapSaiku.Dimension(obj, that), callback);
			}
			console.debug(that.dimensions);
		};
	

		$.ajax({
		url: that.catalog.datasource.connection.url +'/joe/discover/'+ that.catalog.datasource.DATA_SOURCE_NAME +'/'+ that.CATALOG_NAME + '/' + that.SCHEMA_NAME +'/'+that.DESCRIPTION +'/dimensions',
		  data:{'_':that.sessionid},
		  async:false,
		  success:processSaikuDimensions
		})//.done(processSaikuMeasures);
			
	}
	olapSaiku.Cube.prototype.fetchMeasures = function getMeasures(callback) {
		var that = this;
		var processSaikuMeasures = function processSaikuMeasures(measures){
		
			for (var i=0, j=measures.length, obj=null;i<j;i++){
				obj = {
					MEASURE_NAME: measures[i].name,
					MEASURE_UNIQUE_NAME: measures[i].uniqueName,
					DESCRIPTION: measures[i].description,
					CAPTION: measures[i].caption,
					CUBE_NAME: that.CUBE_NAME,
					SCHEMA_NAME: that.SCHEMA_NAME,
					CATALOG_NAME: that.CATALOG_NAME
				};
				that.addMeasure(new olapSaiku.Measure(obj, that), callback);
			}
			//console.debug(that.measures);
		};
	

		$.ajax({
		url: that.catalog.datasource.connection.url +'/joe/discover/'+ that.catalog.datasource.DATA_SOURCE_NAME +'/'+ that.CATALOG_NAME + '/' + that.SCHEMA_NAME +'/'+that.DESCRIPTION +'/measures',
		  data:{'_':that.sessionid},
		  async:false,
		  success:processSaikuMeasures
		})//.done(processSaikuMeasures);
			
	}
    
    olapSaiku.Dimension = function SaikuDimension($dim,$cube){
		olap.Dimension.call(this, $dim, $cube);
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
