olap.QueryLevel = function QueryLevel(hierarchy, level){
  this.hierarchy = hierarchy;
  this.level     = level;
  this.inclusions = [];
  this.exclusions = [];
}

olap.QueryLevel.prototype = {

     /**
     * @method getQuery
     * @return {olap.Query}
     */
    getQuery: function getQuery() {
        return this.query;
    },

    /**
     * @method getName
     * @returns String
     */
    getName: function getName() {
        return this.level.getName();
    },
    
    /**
     * @method getUniqueName'
     * @returns String
     */
    getUniqueName: function getUniqueName() {
    	return this.level.getUniqueName();
    },
    
    /**
     * @method getUniqueName'
     * @returns String
    */    
    getCaption: function getCaption() {
    	return this.level.getCaption();
    },
    
    /**
     * @method getHierarchy
     * @returns {olap.Hierarchy}
     */
    getQueryHierarchy: function getQueryHierarchy() {
        return this.hierarchy;
    },

    
    /**
     * Returns the underlying Level object onto which
     * this query Level is based.
     * <p>Returns a mutable object so operations on it have
     * unpredictable consequences.
     * @return {olap.Level}
     */
    getLevel: function getLevel() {
        return this.level;
    },

    getInclusions: function getInclusions() {
    	return this.inclusions;
    },
    
    getExclusions: function getExclusions() {
    	return this.exclusions;
    },
    
    include: function include(m) {
    	if(this.inclusions.indexOf(m) == -1) {
    		this.inclusions.push(m);
    	}
    },
    
    exclude: function exclude(m) {
    	if (this.inclusions.indexOf(m) != -1) {
    		this.inclusions.splice(this.inclusions.indexOf(m));
    	}
    	if(this.exclusions.indexOf(m) == -1) {
    		this.exclusions.push(m);
    	}
    }

}