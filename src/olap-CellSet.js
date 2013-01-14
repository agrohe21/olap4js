	/** olap.CellSet
	* CellSet is the result of executing an olap.Query
	*   @class olap.CellSet
	*   @constructor
	*   @param {Object} Cellset Object representing object properties.  Often used to rehydrate objects after external persistence
	*   @param {String} Catalog The CATALOG_NAME that this CellSet is being executed for
	*/
	olap.CellSet = function CellSet($cellset, $catalog){
		//console.debug('func Call: ' + arguments.callee.name);
		var cellset = $cellset || {axes:[], filterAxis:{}, cells:[], CUBE_NAME: ''}, idx, axis, cell;
		
		this.CUBE_NAME  = cellset.CUBE_NAME;
		this.CATALOG_NAME = $catalog;
		this.setSlicer(cellset.filterAxis);
		this.cells = [];
		this.axes  = [];
		if (cellset.axes instanceof Array) {
			for (var i=0, j=cellset.axes.length;i<j;i++){
				axis = cellset.axes[i];
				axis.ordinal = i;
				this.addAxis(axis);
			}
		}
		if (cellset.cells instanceof Array) {
			for (idx in cellset.cells){
				cell = cellset.cells[idx];	
				this.addCell(cell);
			}
		}

		this.id = olap.CellSet.id++;
		olap.CellSet.instances[this.id] = this;				
	}
	olap.CellSet.id = 1;
	olap.CellSet.prefix = "olap.CellSet";
	olap.CellSet.instances = {};
	olap.CellSet.getInstance = function(id){
	    return olap.CellSet.instances[id];
	};
	olap.CellSet.prototype = {
		setSlicer: function setSlicer(slicer){
			if (slicer instanceof Object) {
				if (slicer instanceof olap.CellSetAxis == false) {
					slicer = new olap.CellSetAxis(slicer, this);
				}
				this.SLICER = slicer;
			}		
		},
		getAxes: function getAxes(){
			return this.axes;
		},
		getFilterAxis: function getFilterAxis(){
			return this.filterAxis;
		},
		getCell: function getCell(index){
			return this.cells[index];
		},
		getCubeName: function getCubeName(){
			return this.CUBE_NAME;
		},
		addAxis: function addAxis(axis, callback) {
			//console.debug('func Call: ' + arguments.callee.name);	
			if (axis instanceof Object) {
				if (axis instanceof olap.CellSetAxis == false) {
					axis = new olap.CellSetAxis(axis, this);
				} else {
				}
				this.axes.push(axis);
				if (typeof callback == 'function') {
					callback(axis);
				}
			}
			return axis;
		},
		addCell: function addCell(cell, callback) {
			//console.debug('func Call: ' + arguments.callee.name);	
			if (cell instanceof Object) {
				if (cell instanceof olap.Cell == false) {
					cell = new olap.Cell(cell, this);
				} else {
				}
				this.cells.push(cell);
				if (typeof callback == 'function') {
					callback(cell);
				}
			}
			return cell;
		}
	}

	/** olap.Cell
	* A Cell is a cell returned from an CellSet
	*   @class olap.Cell
	*   @constructor
	*   @param {Object} Cell Object representing object properties.  Often used to rehydrate objects after external persistence
	*   @param {olap.CellSet} Cellset The Cellset that this Cell belongs to
	*/
	olap.Cell = function Cell($cell, $cellset) {
		var cell = $cell || {};
		this.value = cell.value;
		this.formattedValue = cell.formattedValue;
		this.ordinal = cell.ordinal;
		this.cellset = $cellset;
		this.id = olap.Cell.id++;
		olap.Cell.instances[this.id] = this;				
	}
	olap.Cell.id = 1;
	olap.Cell.prefix = "olap.Cell";
	olap.Cell.instances = {};
	olap.Cell.getInstance = function(id){
	    return olap.Cell.instances[id];
	};	
	olap.Cell.prototype = {
		getCellSet: function getCellSet(){
			return this.cellset;
		},
		getOrdinal: function getOrdinal(){
			return this.ordinal;
		},
		getCoordinateList: function getCoordinateList(){
			//return List<Integer> ;
		},
		getPropertyValue: function getPropertyValue(Property){
		},
		getValue: function getValue(){
			return this.value;
		},
		getFormattedValue: function getFormattedValue(){
			return this.formattedValue;
		}
	}

	/** olap.Position
	*   @class olap.Position
	*   @constructor
	*   @param {Object} Position Object representing object properties.  Often used to rehydrate objects after external persistence
	*   @param {olap.CellSetAxis} Axis The Axis that this Position belongs to
	*/
	olap.Position = function Position($position, $axis) {
		//console.debug('func Call: ' + arguments.callee.name);	
		//document.body.appendChild(prettyPrint($position, { maxDepth:3} ));
		var position = $position || {}, memb, hier, cube = olap.Cube.getInstanceByName($axis.getCellSet().CUBE_NAME, $axis.getCellSet().CATALOG_NAME);

		this.members = {};
		for (idx in position){
			memb = position[idx];	
			hier = filterProperty.apply($axis.getHierarchies(), [{type:'equal', property:'HIERARCHY_UNIQUE_NAME', value:idx}]);
			memb.HIERARCHY_UNIQUE_NAME = hier.HIERARCHY_UNIQUE_NAME
			this.members[idx] = new olap.Member(memb);
			//BELOW is from sample
			//var tuple = rowAxis.positions[i][rowHierarchies[z].name];
			//var level = cube.getLevelByUniqueName(memb.LEVEL_UNIQUE_NAME, memb.HIERARCHY_UNIQUE_NAME);
			//document.body.appendChild(prettyPrint(level, { maxDepth:3} ));
		}
		
		this.id = olap.Position.id++;
		olap.Position.instances[this.id] = this;				
	}
	olap.Position.id = 1;
	olap.Position.prefix = "olap.Position";
	olap.Position.instances = {};
	olap.Position.getInstance = function(id){
	    return olap.Position.instances[id];
	};	
	olap.Position.prototype = {
		getOrdinal: function getOrdinal(){
			//return Axis;
		},
		getMembers: function getMembers(){
			//return Axis;
		}
	}
	
	/** olap.CellSetAxis
	*   @class olap.CellSetAxis
	*   @constructor
	*   @param {Object} CellSetAxis Object representing object properties.  Often used to rehydrate objects after external persistence
	*   @param {olap.CellSet} CellSet The CellSet that this Axis belongs to
	*/
	olap.CellSetAxis = function CellSetAxis($axis, $cellset) {
		//console.debug('func Call: ' + arguments.callee.name);	
		var axis = $axis || {ordinal:0}, idx, pos, hier;
		this.positions = [];
		this.hierarchies = [];
		this.cellset = $cellset;
		this.ordinal = axis.ordinal
		if (axis.hierarchies instanceof Array) {
			for (idx in axis.hierarchies ){
				hier = axis.hierarchies[idx];
				this.hierarchies.push(new olap.Hierarchy(hier));
			}
		}
		//document.body.appendChild(prettyPrint(this.hierarchies, { maxDepth:3} ));		
		if (axis.positions instanceof Array) {
			for (idx in axis.positions ){
				pos = axis.positions[idx];	
				this.addPosition(pos);
			}
		}

		this.id = olap.CellSetAxis.id++;
		olap.CellSetAxis.instances[this.id] = this;				
		//document.body.appendChild(prettyPrint(this, { maxDepth:3} ));		
	}
	olap.CellSetAxis.id = 1;
	olap.CellSetAxis.prefix = "olap.CellSetAxis";
	olap.CellSetAxis.instances = {};
	olap.CellSetAxis.getInstance = function(id){
	    return olap.CellSetAxis.instances[id];
	};	
	olap.CellSetAxis.prototype = {
		getOrdinal: function getOrdinal(){
			//return Axis;
		},
		getCellSet: function getCellSet() {
			return this.cellset;
		},
		getAxisMetaData: function getAxisMetaData(){
			//return CellSetAxisMetaData ;
		},
		getPositions: function getPositions() {
			return this.positions;
		},
		getPositionCount: function getPositionCount(){
			return this.positions.length;
		},
		getHierarchies: function getHierarchies(){
			return this.hierarchies;
		},
		getProperties: function getProperties(){
			//return this.positions.length;
		},
		addPosition: function addPosition(position, callback) {
			//console.debug('func Call: ' + arguments.callee.name);	
			if (position instanceof Object) {
				if (position instanceof olap.Position == false) {
					position = new olap.Position(position, this);
				} else {
				}
				this.positions.push(position);
				if (typeof callback == 'function') {
					callback(position);
				}
			}
			return position;
		},
		addHierarchy: function addHierarchy(hierarchy, callback) {
			//console.debug('func Call: ' + arguments.callee.name);	
			var found = false;
			if (hierarchy instanceof Object) {
				//try to only add if not exists
				for (var i=0,j=this.hierarchies.length;i<j;i++){
					if (this.hierarchies[i].HIERARCHY_UNIQUE_NAME == hierarchy.HIERARCHY_UNIQUE_NAME) {
						found = true;
					}
				}
				if (found ==  false){
					if ((hierarchy instanceof olap.Hierarchy == false) && (hierarchy.HIERARCHY_UNIQUE_NAME) && (hierarchy.HIERARCHY_UNIQUE_NAME !== '')&& (hierarchy.HIERARCHY_UNIQUE_NAME !== undefined)&& (hierarchy.HIERARCHY_UNIQUE_NAME !== " ")) {
						hierarchy = new olap.Hierarchy(hierarchy, this);
						this.hierarchies.push(hierarchy);
					} else if (hierarchy instanceof olap.Hierarchy == true){
						this.hierarchies.push(hierarchy);
					}
				}
				if (typeof callback == 'function') {
					callback(hierarchy);
				}
			}
			return hierarchy;
		}
	}

