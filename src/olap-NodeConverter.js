olap.NodeConverter = {

	toQuery: function toQuery(query) {
		cellpropertyList = [];
		var withList = [];
		var axisList = [];
		axisList.push(query.getAxes()[0];//[(Axis.COLUMNS)];
		axisList.add(query.getAxes()[1];//.get(Axis.ROWS));

		var filterAxis = null;
		var axis = query.getFilterAxis()
		if (axis) {
			if (axis.hierarchies.length != 0) {
				filterAxis = toAxis(withList, axis);
			}
		}
		return new SelectNode(
				null,
				withList,
				toAxisList(withList, axisList),
				new CubeNode(
						null,
						query.getCube()),
						filterAxis,
						cellpropertyList);
	}
}
/*

	private static List<AxisNode> toAxisList(List<ParseTreeNode> withList, List<QueryAxis> axes) {
		final ArrayList<AxisNode> axisList = new ArrayList<AxisNode>();
		for (QueryAxis axis : axes) {
			AxisNode axisNode = toAxis(withList, axis);
			if (axisNode != null) {
				axisList.add(axisNode);
			}
		}
		return axisList;
	}



	
	 //This method merges the selections into a single
	 //MDX axis selection.  Right now we do a simple
	 //crossjoin.
	 //It might return null if there are no dimensions placed on the axis.
	 //
	private static AxisNode toAxis(List<ParseTreeNode> withList, QueryAxis axis) {

		ParseTreeNode axisExpression = null;
		if (!axis.isMdxSetExpression()) {
			List<ParseTreeNode> hierarchies = new ArrayList<ParseTreeNode>();

			for(QueryHierarchy h : axis.getQueryHierarchies()) {
				ParseTreeNode hierarchyNode = toHierarchy(withList, h);
				hierarchies.add(hierarchyNode);
			}
			if (hierarchies.size() == 1) {
				axisExpression = hierarchies.get(0);
			}
			else if (hierarchies.size() > 1) {
				axisExpression = generateCrossJoin(hierarchies);
			} else {

			}

		}
		axisExpression = toSortedQuerySet(axisExpression, axis);
		ParseTreeNode axisNode = null;
		if (axisExpression != null) {
			WithSetNode withNode = new WithSetNode(null, getIdentifier(axis), axisExpression);
			withList.add(withNode);
			axisNode = withNode.getIdentifier();
		}
		QueryDetails details = axis.getQuery().getDetails();

		if (details.getMeasures().size() > 0 && axis.getLocation().equals(details.getAxis())) {
			for (Measure m : details.getMeasures()) {
				if (m.isCalculatedInQuery()) {
					WithMemberNode wm = toOlap4jCalculatedMember((CalculatedMeasure) m);
					withList.add(wm);
				}
			}


			ParseTreeNode measuresNode = toOlap4jMeasureSet(details.getMeasures());
			if (axisNode == null) {
				axisNode = measuresNode;
			} else {
				List<ParseTreeNode> axisNodes = new ArrayList<ParseTreeNode>();
				if (details.getLocation().equals(QueryDetails.Location.TOP)) {
					axisNodes.add(measuresNode);
					axisNodes.add(axisNode);	
				} else {
					axisNodes.add(axisNode);
					axisNodes.add(measuresNode);
				}
				axisNode = generateCrossJoin(axisNodes);
			}
		}

		if (axisNode == null) {
			return null;
		}
		return new AxisNode(
				null,
				axis.isNonEmpty(),
				axis.getLocation(),
				new ArrayList<IdentifierNode>(),
				axisNode);
	}

	private static ParseTreeNode toHierarchy(List<ParseTreeNode> withList,
			QueryHierarchy h) {
		ParseTreeNode hierarchySet = null;

		if (!h.isMdxSetExpression()) {
			List<ParseTreeNode> levels = new ArrayList<ParseTreeNode>();
			ParseTreeNode existSet = null;
			for (QueryLevel l : h.getActiveQueryLevels()) {
				ParseTreeNode levelNode = toLevel(l);
				levelNode = toQuerySet(levelNode, l);
				levels.add(levelNode);
				if (!l.isSimple()) {
					existSet = levelNode;
				}
			}
			ParseTreeNode levelSet = null;
			if (levels.size() > 1) {
				levelSet = generateListSetCall(levels);
			} else if (levels.size() == 1) {
				levelSet = levels.get(0);
			}

			if (h.isConsistent() && levels.size() > 1 && existSet != null) {
				levelSet = new CallNode(null, "Exists", Syntax.Function, levelSet, existSet);
			}

			if (h.needsHierarchize()) {
				levelSet = new CallNode(
						null,
						"Hierarchize",
						Syntax.Function,
						levelSet);

			}

			List<ParseTreeNode> cmNodes = new ArrayList<ParseTreeNode>();
			for (CalculatedMember cm : h.getActiveCalculatedMembers()) {
				WithMemberNode wm = toOlap4jCalculatedMember(cm);
				withList.add(wm);
				cmNodes.add(wm.getIdentifier());
			}
			if (cmNodes.size() > 0) {
				ParseTreeNode cmSet = generateListSetCall(cmNodes);
				if (levelSet != null) {
					hierarchySet = generateSetCall(cmSet, levelSet);
				} else {
					hierarchySet = cmSet;
				}
			} else {
				hierarchySet = levelSet;	
			}
		}
		hierarchySet = toSortedQuerySet(hierarchySet, h);

		if (h.isVisualTotals()) {
			if (h.getVisualTotalsPattern() !=  null) {
				hierarchySet = new CallNode(
						null,
						"VisualTotals",
						Syntax.Function,
						hierarchySet,
						LiteralNode.createString(null,  h.getVisualTotalsPattern()));
			} else {
				hierarchySet = new CallNode(
						null,
						"VisualTotals",
						Syntax.Function,
						hierarchySet);
			}

		}
		return hierarchySet;
	}

	private static ParseTreeNode toLevel(QueryLevel level) {
		List<Member> inclusions = new ArrayList<Member>();
		List<Member> exclusions = new ArrayList<Member>();
		inclusions.addAll(level.getInclusions());
		exclusions.addAll(level.getExclusions());

		ParseTreeNode baseNode = new CallNode(null, "Members", Syntax.Property, new LevelNode(null, level.getLevel()));
		baseNode = generateSetCall(baseNode);

		if (inclusions.size() > 0) {
			baseNode = toOlap4jMemberSet(inclusions);
		}
		if (exclusions.size() > 0) {
			ParseTreeNode exceptSet = toOlap4jMemberSet(exclusions);
			baseNode =  new CallNode(null, "Except", Syntax.Function, baseNode, exceptSet);			
		}

		return baseNode;
	}

	private static ParseTreeNode toQuerySet(ParseTreeNode expression, IQuerySet o) {
		MdxParser parser = new DefaultMdxParserImpl();

		if (o.isMdxSetExpression()) {
			expression =  parser.parseExpression("{" + o.getMdxSetExpression() + "}");
		}

		if (o.getFilters().size() > 0) {
			for (IFilterFunction filter : o.getFilters()) {
				expression = filter.visit(parser, expression);
			}
		}

		return expression;

	}
	private static ParseTreeNode toSortedQuerySet(ParseTreeNode expression, ISortableQuerySet o) {
		expression = toQuerySet(expression, o);
		if (o.getSortOrder() != null) {
			LiteralNode evaluatorNode =
					LiteralNode.createSymbol(
							null,
							o.getSortEvaluationLiteral());
			expression =
					new CallNode(
							null,
							"Order",
							Syntax.Function,
							expression,
							evaluatorNode,
							LiteralNode.createSymbol(
									null, o.getSortOrder().name()));
		} else if (o.getHierarchizeMode() != null) {
			if (o.getHierarchizeMode().equals(
					ISortableQuerySet.HierarchizeMode.PRE))
			{
				// In pre mode, we don't add the "POST" literal.
				expression = new CallNode(
						null,
						"Hierarchize",
						Syntax.Function,
						expression);
			} else if (o.getHierarchizeMode().equals(
					ISortableQuerySet.HierarchizeMode.POST))
			{
				expression = new CallNode(
						null,
						"Hierarchize",
						Syntax.Function,
						expression,
						LiteralNode.createSymbol(
								null, o.getHierarchizeMode().name()));
			} else {
				throw new RuntimeException("Missing value handler.");
			}
		}
		return expression;

	}
}
*/