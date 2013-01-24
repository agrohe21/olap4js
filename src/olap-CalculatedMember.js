olap.CalculatedMember = function CalculatedMember(dimension, hierarchy, name, description,	parentMember, memberType, formula, properties) {
		this.dimension = dimension;
		this.hierarchy = hierarchy;
		this.level = hierarchy.getLevels()[0];
		this.name = name;
		this.description = description;
		this.memberType = memberType;
		this.formula = formula;
		if (parentMember == null) {
			this.uniqueName = this.hierarchy.getName() + '.' + name;
		} else {
			if (parentMember instanceof olap.Member) {
				this.uniqueName = parentMember.getUnqiueName() + '.' + name;
			} else {
				throw new Error('Calculated member Parent must be a valid olap.Member');
			}
		}
		if (properties) {
			this.properties = properties;
		}
}

olap.CalculatedMember.prototype = {
	getDimension: function getDimension() {
		return this.dimension;
	},
	getHierarchy: function getHierarchy() {
		return this.hierarchy;
	},
	getFormula: function getFormula() {
		return this.formula;
	},
	getMemberType: function getMemberType() {
		return this.memberType;
	},
	getCaption: function getCaption() {
		return this.name;
	},
	getDescription: function getDescription() {
		return this.description;
	},
	getName: function getName() {
		return this.name;
	},
	getUniqueName: function getUniqueName() {
		return this.uniqueName;
	}	
}

/*
	public Map<String, String> getFormatProperties() {
		return properties;
	}

	public String getFormatPropertyValue(String key) throws OlapException {
		if (properties.containsKey(key)) {
			return properties.get(key);
		}
		return null;
	}

	public void setFormatProperty(String key, String value) throws OlapException {
		properties.put(key, value);
	}
*/