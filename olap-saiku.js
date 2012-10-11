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
		that.url = conn.url || window.location.origin + "/" + window.location.pathname.split( '/' )[1] + "/content/saiku";
		$.ajax({
		  async: false, //this is so we get the session and username back before proceeding
		  url: that.url + "/session",
		  data:{}
		}).done(function(data) { 
		  that.sessionid = data.sessionid;
		  that.username = data.username;
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
		  url: that.url + '/' + that.username + '/query/'+ uuid,
		  type: 'POST',
		  data: {
			connection: options.cube.catalog.datasource.DATA_SOURCE_NAME,
			catalog: options.cube.CATALOG_NAME,
			schema: options.cube.SCHEMA_NAME,
			cube: options.cube.DESCRIPTION
		  }
		}).done(function(data) { 
			that.response = data;
			$.ajax({
			  //url: that.url + '/' + that.username + '/query/'+ uuid + '/result/flat',
			  //url: that.url + '/' + that.username + '/query/'+ uuid + '/result/flattened',
			  url: that.url + '/' + that.username + '/query/'+ uuid + '/result/hierarchical',
			  type: 'POST',
			  data: {
				connection: options.cube.catalog.datasource.DATA_SOURCE_NAME,
				catalog: options.cube.CATALOG_NAME,
				schema: options.cube.SCHEMA_NAME,
				cube: options.cube.DESCRIPTION,
				mdx:options.mdx
			  }
			}).done(function(cellset){
				//console.debug(cellset);
				if (typeof options.success ==  'function') {
					options.success.call(that, cellset);
				}
			})			
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
		  url: that.url +'/'+ that.username + '/discover/',
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
    inheritPrototype(olapSaiku.Cube, olap.Cube);
    olapSaiku.Cube.prototype.fetchDimensions = function fetchDimensions(filter, callback) {
    
		var that = this;
		var processSaikuDimensions = function processSaikuDimensions(dimensions){
			var dim, dim_obj, idx, hierarchies, hierarchy, h_obj, levels, level, l_obj, l_idx, hier, lvl;
			for (var i=0, j=dimensions.length;i<j;i++){
				dim_obj = {
					DIMENSION_NAME: dimensions[i].name,
					DIMENSION_UNIQUE_NAME: dimensions[i].uniqueName,
					DESCRIPTION: dimensions[i].description,
					CAPTION: dimensions[i].caption,
					CUBE_NAME: that.CUBE_NAME,
					SCHEMA_NAME: that.SCHEMA_NAME,
					CATALOG_NAME: that.CATALOG_NAME,
					hierarchies: []
				};
				dim = new olapSaiku.Dimension(dim_obj, that);
				hierarchies = dimensions[i].hierarchies;
				for (idx in hierarchies){
					hierarchy = hierarchies[idx];
					h_obj = {
						HIERARCHY_CAPTION: hierarchy.caption,
						HIERARCHY_NAME: hierarchy.name,
						HIERARCHY_UNIQUE_NAME: hierarchy.uniqueName,
						DIMENSION_UNIQUE_NAME: hierarchy.dimensionUniqueName,
						CUBE_NAME: that.CUBE_NAME,
						SCHEMA_NAME: that.SCHEMA_NAME,
						CATALOG_NAME: that.CATALOG_NAME,
						levels: []
					};
					hier = new olapSaiku.Hierarchy(h_obj, dim);
					levels = hierarchy.levels;
					//console.debug(levels);
					for (l_idx in levels){
						level = levels[l_idx];
						l_obj = {
							LEVEL_UNIQUE_NAME: level.uniqueName,
							LEVEL_NAME: level.name,
							LEVEL_CAPTION: level.caption,
							HIERARCHY_UNIQUE_NAME: level.hierarchyUniqueName,
							DIMENSION_UNIQUE_NAME: level.dimensionUniqueName,
							CUBE_NAME: that.CUBE_NAME,
							SCHEMA_NAME: that.SCHEMA_NAME,
							CATALOG_NAME: that.CATALOG_NAME,
						}
						lvl = new olapSaiku.Level(l_obj, hier)
						hier.addLevel(lvl);
					}
					dim.addHierarchy(hier);
				}
				that.addDimension(dim);				
			}
		};
	

		$.ajax({
		  url: that.catalog.datasource.connection.url + '/' + that.username + '/discover/'+ that.catalog.datasource.DATA_SOURCE_NAME +'/'+ that.CATALOG_NAME + '/' + that.SCHEMA_NAME +'/'+that.DESCRIPTION +'/dimensions',
		  data:{'_':that.sessionid},
		  async:false,
		  success:processSaikuDimensions
		})
			
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
				that.addMeasure(new olap.Measure(obj, that), callback);
			}
			//console.debug(that.measures);
		};
	

		$.ajax({
		url: that.catalog.datasource.connection.url + '/' + that.username + '/discover/'+ that.catalog.datasource.DATA_SOURCE_NAME +'/'+ that.CATALOG_NAME + '/' + that.SCHEMA_NAME +'/'+that.DESCRIPTION +'/measures',
		  data:{'_':that.sessionid},
		  async:false,
		  success:processSaikuMeasures
		})//.done(processSaikuMeasures);
			
	}
	olapSaiku.Cube.prototype.addDimension = function SaikuAddDimension(dimension, callback) {
		//console.debug('func Call: ' + arguments.callee.name);		
	    var dim = new olapSaiku.Dimension(dimension, this)
	    olap.Cube.prototype.addDimension.call(this, dim)
	    return dim;
    }

	olapSaiku.Dimension = function SaikuDimension($dim,$cube){
		olap.Dimension.call(this, $dim, $cube);
    }
    inheritPrototype(olapSaiku.Dimension, olap.Dimension);
	olapSaiku.Dimension.prototype.addHierarchy = function SaikuAddHierarchy(hierarchy, callback) {
		//console.debug('func Call: ' + arguments.callee.name);		
	    var hier = new olapSaiku.Hierarchy(hierarchy, this)
	    olap.Dimension.prototype.addHierarchy.call(this, hierarchy)
	    return hier;
    }

    olapSaiku.Hierarchy = function SaikuHierarchy($hier,$dim){
		olap.Hierarchy.call(this, $hier, $dim);
    }
    inheritPrototype(olapSaiku.Hierarchy, olap.Hierarchy);
	olapSaiku.Hierarchy.prototype.addLevel = function SaikuAddLevel(level, callback) {
		//console.debug('func Call: ' + arguments.callee.name);	
	    var lvl = new olapSaiku.Level(level, this)
	    olap.Hierarchy.prototype.addLevel.call(this, lvl)
	    return lvl;
    }
	
    olapSaiku.Level = function SaikuLevel($level,$hier){
		olap.Level.call(this, $level, $hier);
    }
    
    inheritPrototype(olapSaiku.Level, olap.Level);
    
	olapSaiku.Level.prototype.addMember = function SaikuAddMember(member, callback) {
		//console.debug('func Call: ' + arguments.callee.name);	
	    var mem = new olapSaiku.Member(member, this)
	    olap.Level.prototype.addMember.call(this, mem)
	    return mem;
    }
	
    olapSaiku.Level.prototype.fetchMembers = function fetchMembers(callback) {
		//console.debug('func Call: ' + arguments.callee.name);	
	
		var that = this;
		var processSaikuMembers = function processSaikuMembers(members){
			console.debug('got something');
			console.debug(members)
			for (var i=0, j=members.length, obj=null;i<j;i++){
				obj = {
					MEMBER_NAME: members[i].name,
					MEMBER_CAPTION: members[i].caption,
					DESCRIPTION: members[i].description,
					MEMBER_UNIQUE_NAME: members[i].uniqueName,
					LEVEL_UNIQUE_NAME: that.LEVEL_UNIQUE_NAME,
					HIERARCHY_UNIQUE_NAME: that.HIERARCHY_UNIQUE_NAME,
					DIMENSION_UNIQUE_NAME: that.DIMENSION_UNIQUE_NAME,
					CUBE_NAME: that.CUBE_NAME,
					SCHEMA_NAME: that.SCHEMA_NAME,
					CATALOG_NAME: that.CATALOG_NAME
				};
				that.addMember(new olapSaiku.Member(obj, that), callback);
			}
			
		};
	
		var conn = that.hierarchy.dimension.cube.catalog.datasource.connection;
		$.ajax({
		url: that.hierarchy.dimension.cube.catalog.datasource.connection.url + '/' + that.username + '/discover/'+ that.hierarchy.dimension.cube.catalog.datasource.DATA_SOURCE_NAME +'/'+ that.CATALOG_NAME +
			'/' + that.SCHEMA_NAME +'/'+that.hierarchy.dimension.cube.DESCRIPTION +'/dimensions/' + that.hierarchy.dimension.DIMENSION_NAME +'/hierarchies/' + that.hierarchy.getName() +'/levels/' + that.LEVEL_NAME,
		  data:{'_':that.sessionid},
		  async:false,
		  success:processSaikuMembers
		})
		return this.members
    }
    
    olapSaiku.Member = function SaikuMember($Member,$level){
		olap.Member.call(this, $Member, $level);
    }
    
    inheritPrototype(olapSaiku.Member, olap.Member);
    
	/*
    olapSaiku.Measure = function SaikuMeasure($Measure,$cube){
		olap.Measure.call(this, $Measure, $cube);
    }
    
    inheritPrototype(olapSaiku.Measure, olap.Measure);
	*/
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
