    olapXmla.Query= function XmlaQuery($Query, $cube, $connection, $catalog){
	olap.Query.call(this, $Query, $cube);
	this.connection = $connection || {};
    }
    
    inheritPrototype(olapXmla.Query, olap.Query);
    
    olapXmla.Query.prototype.execute = function execute(callback) {
	    var that=this, properties = {}, mdx, results, dataset, cells, tmp_results, axis;
	    
	    mdx = this.getMDX();
	    dataset = this.getCube().getCatalog().getDatabase().getOlapConnection().executeOlapQuery({
		    mdx: mdx,
		    catalog: this.getCube().getCatalog().getName(),
		    success: function(results){
			if (typeof callback == 'function') {
			    callback.call(this, results);
			}
		    }
	    });
    }
