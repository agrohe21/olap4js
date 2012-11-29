
# Overview
olap4js is intended to be a common set of JS objects that can run on multiple clients and with multiple OLAP backends

# Host Environments
## Browser: Main testing evnironment at the moment
### Xmla: The XMLA implementation has full metadata and query execution
### Saiku: The Saiku implementation has a metadata discovery implementation and basic query processing
## Node.js
The basic olap connection is working, but not Xmla

## Installation Linux
* Install the plugin
```bash
$ cd /home/pentaho/pentaho/server/biserver-ee/pentaho-solutions/system
$ git clone https://github.com/agrohe21/olap4js.git
```

* Restart your biserver  or manually reload the plugins
* Type in the URL into the browser http://localhost:8080/pentaho/content/olap4js/index.html
* From there, go to the Samples link and run the Xmla samples
* Saiku samples will not work until the Saiku plugin is installed

## Quick Example
```javascript
var olapConn = new olapXmla.Connection(), cubes, sw_meta;
  //get all cubes for active connection
  olapConn.getCubes(function(cubes){
    //filter cubes array down to only CATALOG_NAME = SteelWheels
    var sw = filterProperty.apply(cubes, [{type:'equal', property:'CATALOG_NAME', value:'SteelWheels'}]);
    //get the dims, hierarchies, levels and measures for the cube
    sw_meta = sw.getMetadata();
    //simply dump it out to Page DOM
    document.body.appendChild(prettyPrint(sw_meta, { maxDepth:3 } ));
  });
```
