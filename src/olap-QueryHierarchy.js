olap.QueryHierarchy = function QueryHierarchy(query, hierarchy){
  var levels=[], lvl_idx, level, lvl_count;
  this.query = query;
  this.hierarchy = hierarchy;
  this.queryLevels = {};
  this.calculatedMembers=[];
  this.activeCalculatedMembers=[]
  this.activeLevels={};
  levels = this.hierarchy.getLevels();
  for (lvl_idx=0, lvl_count=levels.length;lvl_idx<lvl_count;lvl_idx++) {
      level = new olap.QueryLevel(this, levels[lvl_idx]);
      this.queryLevels[level.getName()] = level;
  }
}

olap.QueryHierarchy.prototype = {

     /**
     * @method getQuery
     * @return {olap.Query}
     */
    getQuery: function getQuery() {
        return this.query;
    },

    /**
     * @method getAxis
     * @returns {olap.Axis}
     */
    getAxis: function getAxis() {
        return this.axis;
    },
    
    /**
     * @method setAxis
     * Only internal use!
     * @param axis
     */
    setAxis: function setAxis(axis) {
        this.axis = axis;
    },

    /**
     * @method getName
     * @returns String
     */
    getName: function getName() {
        return this.hierarchy.getName();
    },
    
    /**
     * @method getUniqueName'
     * @returns String
     */
    getUniqueName: function getUniqueName() {
    	return this.hierarchy.getUniqueName();
    },
    
    /**
     * @method getUniqueName'
     * @returns String
    */    
    getCaption: function getCaption() {
    	return this.hierarchy.getCaption();
    },
    
    /**
     * @method getHierarchy
     * @returns {olap.Hierarchy}
     */
    getHierarchy: function getHierarchy() {
        return this.hierarchy;
    },
    
    addCalculatedMember: function addCalculatedMember(cm) {
    	this.calculatedMembers.push(cm);
    },
    
    getCalculatedMembers: function getCalculatedMembers() {
    	return this.calculatedMembers;
    },
    
    getActiveCalculatedMembers: function getActiveCalculatedMembers() {
    	return this.activeCalculatedMembers;
    },
    
    getActiveQueryLevels: function getActiveQueryLevels() {
    	return this.activeLevels;
    },

    getActiveLevel: function getActiveLevel(levelName) {
    	return this.activeLevels[levelName];

    },
    
    includeLevel: function includeLevel(levelName) {
		var ql;
		if (levelName instanceof olap.QueryLevel) {
			ql = levelName;
		} else {
			ql = this.queryLevels[levelName];
		}
   		this.activeLevels[ql.getName()] = ql;
    	return ql;
    },
/*
    public void includeMembers(List<Member> members) throws OlapException {
    	for (Member m : members) {
    		includeMember(m);
    	}
    }
*/
    include: function include(uniqueMemberName) {
		var member;
		if (typeof(uniqueMemberName) == 'string') {
			member = this.hierarchy.lookupMember(uniqueMemberName);
			if (member == null) {
				throw new Error(
					"Unable to find a member with name " + uniqueMemberName);
			}
			this.includeMember(member);
		} else {
			if (uniqueMemberName instanceof olap.member) {
				includeMember(uniqueMemberName)
			} else {
				throw new Error('Invalid Member Name: ' + uniqueMemberName);
			}
		}
    },
    
    includeMember: function includeMember(m) {
		//console.debug('func Call: ' + arguments.callee.name);		
		var ql, l;
		if (!m instanceof olap.Member) {
			throw new Error('must pass an olap.Member to includeMember');
		}
    	l = m.getLevel();
    	if (!l.getHierarchy() == this.hierarchy) {
    		throw new Error(
    				"You cannot include member " + m.getUniqueName() 
    				+ " on hierarchy " + this.hierarchy.getUniqueName());
    	}
    	ql = this.queryLevels[l.getName()];
    	this.activeLevels[ql.getName()] = ql;
    	ql.include(m);
    },

    exclude: function exclude(uniqueMemberName)  {
		var member;
		if (typeof(uniqueMemberName) == 'string') {
			member = this.hierarchy.lookupMember(uniqueMemberName);
			if (member == null) {
				throw new Error(
					"Unable to find a member with name " + uniqueMemberName);
			}
			this.excludeMember(member);
		} else {
			if (uniqueMemberName instanceof olap.member) {
				this.excludeMember(uniqueMemberName)
			} else {
				throw new Error('Invalid Member Name: ' + uniqueMemberName);
			}
		}
    },
	
    excludeMember: function excludeMember(m) {
		//console.debug('func Call: ' + arguments.callee.name);		
		var ql, l;
		if (!m instanceof olap.Member) {
			throw new Error('must pass an olap.Member to includeMember');
		}
    	l = m.getLevel();
    	if (!l.getHierarchy() == this.hierarchy) {
    		throw new Error(
    				"You cannot include member " + m.getUniqueName() 
    				+ " on hierarchy " + this.hierarchy.getUniqueName());
    	}
    	ql = this.queryLevels[l.getName()];
    	this.activeLevels[ql.getName()] = ql;
    	ql.exclude(m);
    },

    includeCalculatedMember: function includeCalculatedMember(m) {
    	var h = this.getHierarchy();
    	if (h !== this.hierarchy) {
    		throw new Error(
    				"You cannot include the calculated member " + m.getUniqueName() 
    				+ " on hierarchy " + this.hierarchy.getUniqueName());
    	}
    	if(this.calculatedMembers.indexOf(m) == -1) {
    		this.calculatedMembers.push(m);
    	}
    	this.activeCalculatedMembers.push(m);
    },

	toString: function toString() {
		return this.hierarchy.getUniqueName();
	}
}