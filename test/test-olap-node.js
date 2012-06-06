var olap = require('../olap'),
assert = require('assert');

var sources, idx, catalogs, catalog, cuubes, cube, dimensions, dimension, hierarchies, hierarchy, levels, level, members, member, measures, measure;
var mysrc = {
    AUTHENTICATION_MODE:"Unauthenticated",
    DATA_SOURCE_DESCRIPTION: "Pentaho BI Platform Datasources",
    DATA_SOURCE_INFO:"Provider=Mondrian;DataSource=Pentaho",
    DATA_SOURCE_NAME:"Provider=Mondrian;DataSource=Pentaho",
    PROVIDER_NAME:"PentahoXMLA",
    PROVIDER_TYPE:["MDP"],
    URL: "http://localhost:8080/pentaho/Xmla?userid=joe&password=password",
    catalogs: [
	{
	CATALOG_NAME: "SampleData",	
	DESCRIPTION:"No description available"
	}			
    ]
}, olapConn;

olapConn = new olap.Connection({sources:[mysrc]});
sources = olapConn.getOlapDatabases();

assert.equal(sources[0].PROVIDER_NAME, "PentahoXMLA")
