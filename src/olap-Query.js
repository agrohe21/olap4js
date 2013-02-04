/** olap.Query
*   @class olap.Query
*   @constructor
*   @param {Object} Query Object representing object properties.  Often used to rehydrate objects after external persistence
*   @param {olap.Cube} Cube The Cube that this Query is defined to operate on
*/
olap.Query = function Query($name, $cube) {
	var idx, axis, hierarchies, hier, qh;
	if ($cube instanceof Object){
		if ($cube instanceof olap.Cube) {
			this.cube = $cube;
		} else {
			this.cube = new olap.Cube($cube);
		}
	}
	this.axes = [];
	this.hierarchies = [];
	if (!this.cube instanceof olap.Cube) {
		throw new Error('Unable to create query: invalid cube');
	}
	hierarchies = this.cube.getHierarchies();
	for (var i=0,j=hierarchies.length;i<j;i++){
	  hier = hierarchies[i];
	  qh = new olap.QueryHierarchy(this, hier);
	  this.hierarchies[qh.getName()] = qh;
	}
	this.id   = olap.Query.id++;
	this.name = $name || 'query' + this.id; 
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
	createAxis: function createAxis(axis) {
		var axis = new olap.QueryAxis(this, axis);
		this.axes.push(axis);
		return axis;
	},
	/**
	 * @method getHierarchy
	 * @return {olap.QueryHierarchy}
	 */
	getHierarchy: function getHierarchy(hierarchy) {
	    if (hierarchy instanceof olap.Hierarchy) {
	      return this.hierarchies[hierarchy.getName()];
	    } else {
	      return this.hierarchies[hierarchy];
	    }
	},
	toString: function toString(){
		var mdx = "", axes = this.getAxes(), axis, axisMdx;
		
		for (var i=0, j=axes.length;i<j;i++){
			axis = axes[i];
			axisMdx = axis.toString();
			mdx += " " + axisMdx;
		}
		if (mdx.length) {
		    mdx = "SELECT" + mdx +
			"\nFROM [" + this.getCube().getName() + "]";
		}
		if  (this.hasFilterAxis()) {
			mdx += "\nWHERE " + this.getFilterAxis().toString();
		}
		return mdx;
	},
	execute: function execute(callback){
		//default implementation does not create results
		//driver specific implemenation should override this
		var results = this.results || new olap.CellSet({});
		if (typeof callback == 'function') {
			callback.call(this, results);
			delete results;
		} else {
			return results;
		}
	},
    createCalculatedMember: function createCalculatedMember(queryHierarchy, name, formula, properties) {
    	var h = queryHierarchy.getHierarchy();
    	var cm = new olap.CalculatedMember(
    			h.getDimension(), 
    			h, 
    			name, 
    			name,
    			null,
    			null, //ask Paul what this is... Type.FORMULA,
    			formula,
    			null);
    	this.addCalculatedMember(queryHierarchy, cm);
    	return cm;
    },
	addCalculatedMember: function addCalculatedMember(hierarchy, cm) {
    	hierarchy.addCalculatedMember(cm);
    }
}