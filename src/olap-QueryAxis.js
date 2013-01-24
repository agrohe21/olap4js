/** olap.QueryAxis
  *
  * @class olap.QueryAxis
  * @constructor
*/
olap.QueryAxis = function QueryAxis($query, axis){
	this.query       = $query           || {};
	this.location    = axis || 0;
	this.hierarchies =  [];
}
olap.QueryAxis.prototype = {
	getLocation: function getLocation() {
		return this.location;
	},	
	getName: function getName() {
		return this.name;
	},
	getQuery: function getQuery() {
	    return this.query;
	},
	getQueryHierarchies: function getQueryHierarchies() {
	    return this.hierarchies;
	},
	addHierarchy: function addHierarchy(index, hierarchy) {
	    if (typeof(index) != "number") {
	      hierarchy = index;
	      index = -1;
	    }
	    if (hierarchy instanceof olap.QueryHierarchy){
	      if (this.getQueryHierarchies().indexOf(hierarchy) != -1) {
			throw new Error("hierarchy already on this axis");
	      }
		  //console.log(hierarchy.getAxis());
	      /*
		  if (hierarchy.getAxis() != null
			&& hierarchy.getAxis() != this)
	      {
		  // careful! potential for loop
		      var qa = hierarchy.getAxis();
		      //console.log(hierarchy.getAxis());
		      //console.log(qa);
		      qa.getQueryHierarchies().remove(hierarchy);
	      }*/
	      hierarchy.setAxis(this);
	      if (index >= this.hierarchies.length || index < 0) {
		      this.hierarchies.push(hierarchy);
	      } else {
		      this.hierarchies.splice(index, 0, hierarchy);
	      }
	    } else {
	      throw new Error("Must pass a valid olap.QueryHierarchy instance to olap.QueryAxis.addHierarchy");
	    }	      
	}
/*
qa.setMdxSetExpression("Product.Drink.Children");
			qa.addFilter(new GenericFilter("[Measures].[Unit Sales] > 1"));
			qa.addFilter(new NFilter(MdxFunctionType.TopPercent, 100, "[Measures].[Customer Count]"));
			qa.setHierarchizeMode(HierarchizeMode.PRE);	
*/	
}
