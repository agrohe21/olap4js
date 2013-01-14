olap.QueryHierarchy = function QueryHierarchy(query, hierarchy){
  var levels=[], lvl_idx, level, lvl_count;
  this.queryLevels = [];
  this.query = query;
  this.hierarchy = hierarchy;
  this.calculatedMembers=[];
  this.activeCalculatedMembers=[]
  this.activeLevels={};
  levels = this.hierarchy.getLevels();
  for (lvl_idx=0, lvl_count=levels.length;lvl_idx<lvl_count;lvl_idx++) {
      level = new olap.QueryLevel(this, levels[lvl_idx]);
      this.queryLevels.push(level);
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
    	var ql = this.queryLevels.get(levelName);
    	if (this.activeLevels.indexOf(ql) == -1) {
    		this.activeLevels.push(ql);
    	}
    	return ql;
    },
/*
    public QueryLevel includeLevel(Level l) throws OlapException {
    	if (!l.getHierarchy().equals(hierarchy)) {
    		throw new OlapException(
    				"You cannot include level " + l.getUniqueName() 
    				+ " on hierarchy " + hierarchy.getUniqueName());
    	}
    	QueryLevel ql = queryLevels.get(l.getName());
    	if (!activeLevels.contains(l)) {
    		activeLevels.add(ql);
    	}
    	return ql;
    }
    
    public void includeMembers(List<Member> members) throws OlapException {
    	for (Member m : members) {
    		includeMember(m);
    	}
    }

    public void include(String uniqueMemberName) throws OlapException {
    	List<IdentifierSegment> nameParts = IdentifierParser.parseIdentifier(uniqueMemberName);
    	this.include(nameParts);
    }
    
    public void include(List<IdentifierSegment> nameParts) throws OlapException {
        Member member = this.query.getCube().lookupMember(nameParts);
        if (member == null) {
            throw new OlapException(
                "Unable to find a member with name " + nameParts);
        }
        this.includeMember(member);
    }


    public void includeCalculatedMember(CalculatedMember m) throws OlapException {
    	Hierarchy h = m.getHierarchy();
    	if (!h.equals(hierarchy)) {
    		throw new OlapException(
    				"You cannot include the calculated member " + m.getUniqueName() 
    				+ " on hierarchy " + hierarchy.getUniqueName());
    	}
    	if(!calculatedMembers.contains(m)) {
    		calculatedMembers.add(m);
    	}
    	activeCalculatedMembers.add(m);
    }
    public void includeMember(Member m) throws OlapException {
    	Level l = m.getLevel();
    	if (!l.getHierarchy().equals(hierarchy)) {
    		throw new OlapException(
    				"You cannot include member " + m.getUniqueName() 
    				+ " on hierarchy " + hierarchy.getUniqueName());
    	}
    	QueryLevel ql = queryLevels.get(l.getName());
    	if (!activeLevels.contains(ql)) {
    		activeLevels.add(ql);
    	}
    	ql.include(m);
    }
    
    public void exclude(String uniqueMemberName) throws OlapException {
    	List<IdentifierSegment> nameParts = IdentifierParser.parseIdentifier(uniqueMemberName);
    	this.exclude(nameParts);
    }
    
    public void exclude(List<IdentifierSegment> nameParts) throws OlapException {
        Member member = this.query.getCube().lookupMember(nameParts);
        if (member == null) {
            throw new OlapException(
                "Unable to find a member with name " + nameParts);
        }
        this.exclude(member);
    }
    
    public void excludeMembers(List<Member> members) {
    	for (Member m : members) {
    		exclude(m);
    	}
    }

    public void exclude(Member m) {
    	Level l = m.getLevel();
    	if (!l.getHierarchy().equals(hierarchy)) {
    		throw new IllegalArgumentException("You cannot exclude member " + m.getUniqueName() + " on hierarchy " + hierarchy.getUniqueName());
    	}
    	QueryLevel ql = queryLevels.get(l.getName());
    	if (!activeLevels.contains(ql)) {
    		activeLevels.add(ql);
    	}
    	ql.exclude(m);
    }
      */
	toString: function toString() {
		return this.hierarchy.getUniqueName();
	}
   
}
