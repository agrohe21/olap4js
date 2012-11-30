YUI.add("yuidoc-meta", function(Y) {
   Y.YUIDoc = { meta: {
    "classes": [
        "olap.Catalog",
        "olap.Connection",
        "olap.Cube",
        "olap.Datasource",
        "olap.Dimension",
        "olap.Hierarchy",
        "olap.Level",
        "olap.Measure",
        "olap.Member",
        "olapXmla.Connection"
    ],
    "modules": [
        "olap",
        "olapXmla"
    ],
    "allModules": [
        {
            "displayName": "olap",
            "name": "olap",
            "description": "This is olap4js - a javascript library for working with OLAP datasources."
        },
        {
            "displayName": "olapXmla",
            "name": "olapXmla",
            "description": "The Xmla specific implementation of the olap4js API"
        }
    ]
} };
});