/*
    Copyright 2009,2010,2011 Roland Bouman
    contact: Roland.Bouman@gmail.com ~ http://rpbouman.blogspot.com/ ~ http://code.google.com/p/xmla4js
    twitter: @rolandbouman

    This is xmla4js - a stand-alone, cross-browser javascript library for working with "XML for Analysis".
    XML for Analysis (XML/A) is a vendor-neutral industry-standard protocol for OLAP services over HTTP.
    xmla4js enables web-browser-based analytical business intelligence applications.

    This file contains human-readable javascript source along with the YUI Doc compatible annotations.
    Note: some portions of the API documentation were adopted from the original XML/A specification.
    I believe that this constitutes fair use, but if you have reason to believe that the documentation
    violates any copyright, or is otherwise incompatible with the LGPL license please contact me.

    Include this in your web-pages for debug and development purposes only.
    For production purposes, consider using the minified/obfuscated versions in the /js directory.

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Lesser General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
(function(root) {
/**
*  This is xmla4js - a stand-alone, cross-browser javascript library for working with "XML for Analysis".
*  XML for Analysis (XML/A) is a vendor-neutral industry-standard protocol for OLAP services over HTTP.
*  xmla4js enables web-browser-based analytical business intelligence applications.
*  @module xmla
*  @title Xmla
*/
var Xmla,
    _soap = "http://schemas.xmlsoap.org/soap/",
    _xmlnsSOAPenvelope = _soap + "envelope/",
    _xmlnsSOAPenvelopePrefix = "SOAP-ENV",
    _xmlnsIsSOAPenvelope = "xmlns:" + _xmlnsSOAPenvelopePrefix + "=\"" + _xmlnsSOAPenvelope + "\"",
    _SOAPencodingStyle = _xmlnsSOAPenvelopePrefix + ":encodingStyle=\"" + _soap + "encoding/\"",
    _ms = "urn:schemas-microsoft-com:",
    _xmlnsXmla = _ms + "xml-analysis",
    _xmlnsIsXmla = "xmlns=\"" + _xmlnsXmla + "\"",
    _xmlnsSQLPrefix = "sql",
    _xmlnsSQL = _ms + "xml-sql",
    _xmlnsSchema = "http://www.w3.org/2001/XMLSchema",
    _xmlnsSchemaPrefix = "xsd",
    _xmlnsSchemaInstance = "http://www.w3.org/2001/XMLSchema-instance",
    _xmlnsSchemaInstancePrefix = "xsi",
    _xmlnsRowset = _xmlnsXmla + ":rowset",
    _xmlnsDataset = _xmlnsXmla + ":mddataset",
    _useAX = window.ActiveXObject ? true : false
;

function _ajax(options){
/*
    This is not a general ajax function,
    just something that is good enough for Xmla.
*/
    var xhr,
        handlerCalled = false,
        handler = function(){
            handlerCalled = true;
            switch (xhr.readyState){
                case 0:
                    options.aborted(xhr);
                    break;
                case 4:
                    if (xhr.status===200){
                        options.complete(xhr);
                    }
                    else {
                        options.error(
                            Xmla.Exception._newError(
                                "HTTP_ERROR",
                                "_ajax",
                                {
                                    request: options,
                                    status: this.status,
                                    statusText: this.statusText
                                }
                            )
                        );
                    }
                break;
            }
        };
    if (XMLHttpRequest) {
        xhr = new XMLHttpRequest();
    }
    else
    if (_useAX) {
        xhr = new ActiveXObject("MSXML2.XMLHTTP.3.0");
    }
    if (options.username && options.password) {
        xhr.open(
            "POST", options.url, options.async,
            options.username, options.password
        );
    }
    else {
        xhr.open("POST", options.url, options.async);
    }
    xhr.onreadystatechange = handler;
    xhr.setRequestHeader("Accept", "text/xml, application/xml, application/soap+xml");
    xhr.setRequestHeader("Content-Type", "text/xml");
    if (options.headers) {
        var headers = options.headers, header;
        for (header in headers) xhr.setRequestHeader(header, headers[header]);
    }
    xhr.send(options.data);
    if (!options.async && !handlerCalled){
        handler.call(xhr);
    }
    return xhr;
};

function _isUnd(arg){
    return typeof(arg)==="undefined";
};
function _isArr(arg){
    return arg && arg.constructor === Array;
};
function _isNum(arg){
    return typeof(arg)==="number";
};
function _isFun(arg){
    return typeof(arg)==="function";
};
function _isStr(arg) {
    return typeof(arg)==="string";
};
function _isObj(arg) {
    return arg && typeof(arg)==="object";
};
function _xmlEncode(value){
    if (_isStr(value)) {
        value = value.replace(/\&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
    return value;
};

var docEl = document.documentElement;

var _getElementsByTagNameNS = docEl.getElementsByTagNameNS ? function(node, ns, prefix, tagName){
                                                                 return node.getElementsByTagNameNS(ns, tagName);
                                                             }
                                                           : function(node, ns, prefix, tagName){
                                                                 if (prefix){
                                                                     return node.getElementsByTagName(prefix + ":" + tagName);
                                                                 }
                                                                 else {
                                                                     return node.getElementsByTagName(tagName);
                                                                 }
                                                             };

var _getAttributeNS = docEl.getAttributeNS ? function(element, ns, prefix, attributeName){
                                                 return element.getAttributeNS(ns, attributeName);
                                             }
                                           : function(element, ns, prefix, attributeName){
                                                 if (prefix) {
                                                     return element.getAttribute(prefix + ":" + attributeName);
                                                 }
                                                 else {
                                                     return element.getAttribute(attributeName);
                                                 }
                                             };
function _getElementText(el){
    //on first call, we examine the properies of the argument element
    //to try and find a native (and presumably optimized) method to grab
    //the text value of the element.
    //We then overwrite the original _getElementText
    //to use the optimized one in any subsequent calls
    var func;
    if (!_isUnd(el.innerText)) {         //ie
        func = function(el){
            return el.innerText;
        };
    }
    else
    if (!_isUnd(el.textContent)) {       //ff, chrome
        func = function(el){
            return el.textContent;
        };
    }
    else
    if (!_isUnd(el.nodeTypedValue)) {    //ie8
        func = function(el){
            return el.nodeTypedValue;
        };
    }
    else
    if (el.normalize){
        func = function(el) {
            el.normalize();
            if (el.firstChild){
                return el.firstChild.data;
            }
            else {
                return null;
            }
        }
    }
    else {                      //generic
        func = function(el) {
            var text = [], childNode,
                childNodes = el.childNodes, i,
                n = childNodes.length
            ;
            for (i = 0; i < n; i++){
                childNode = childNodes.item(i);
                if (childNode.data !== null) text.push(childNode.data);
            }
            return text.length ? text.join("") : null;
        }
    }
    _getElementText = func;
    return func(el);
};

function _getXmlaSoapList(container, listType, items, indent){
    if (!indent) indent = "";
    var n, i, entry, property, item, msg = "\n" + indent + "<" + container + ">";
    if (items) {
        msg += "\n" + indent + " <" + listType + ">";
        for (property in items){
            if (items.hasOwnProperty(property)) {
                item = items[property];
                msg += "\n" + indent + "  <" + property + ">";
                if (_isArr(item)){
                    n = item.length;
                    for (i = 0; i < n; i++){
                        entry = item[i];
                        msg += "<Value>" + _xmlEncode(entry) + "</Value>";
                    }
                } else {
                    msg += _xmlEncode(item);
                }
                msg += "</" + property + ">";
            }
        }
        msg += "\n" + indent + " </" + listType + ">";
    }
    msg += "\n" + indent + "</" + container + ">";
    return msg;
};

var _xmlRequestType = "RequestType";

function _getXmlaSoapMessage(options){
    var method = options.method,
        msg = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" +
        "\n<" + _xmlnsSOAPenvelopePrefix + ":Envelope" +
        " " + _xmlnsIsSOAPenvelope +
        " " + _SOAPencodingStyle + ">" +
        "\n <" + _xmlnsSOAPenvelopePrefix + ":Body>" +
        "\n  <" + method + " " + _xmlnsIsXmla + " " + _SOAPencodingStyle + ">"
    ;
    switch(method){
        case Xmla.METHOD_DISCOVER:
            if (!options.requestType) {
                Xmla.Exception._newError(
                    "MISSING_REQUEST_TYPE",
                    "Xmla._getXmlaSoapMessage",
                    options
                )._throw();
            }
            msg += "\n   <" + _xmlRequestType + ">" + options.requestType + "</" + _xmlRequestType + ">" +
                _getXmlaSoapList("Restrictions", "RestrictionList", options.restrictions, "   ") +
                _getXmlaSoapList("Properties", "PropertyList", options.properties, "   ");
            break;
        case Xmla.METHOD_EXECUTE:
            if (!options.statement){
                Xmla.Exception._newError(
                    "MISSING_REQUEST_TYPE",
                    "Xmla._getXmlaSoapMessage",
                    options
                )._throw();
            }
            msg += "\n   <Command>" +
                "\n    <Statement>" + _xmlEncode(options.statement) + "</Statement>" +
                "\n   </Command>" +
                _getXmlaSoapList("Properties", "PropertyList", options.properties, "   ")
            ;
            break;
        default:
            //we used to throw an exception here,
            //but this would make it impossible
            //to execute service or provider specific methods.
    }
    msg += "\n  </" + method + ">" +
        "\n </" + _xmlnsSOAPenvelopePrefix + ":Body>" +
        "\n</" + _xmlnsSOAPenvelopePrefix + ":Envelope>"
    ;
    return msg;
};

function _applyProps(object, properties, overwrite){
    if (properties && (!object)) {
        object = {};
    }
    var property;
    for (property in properties){
        if (properties.hasOwnProperty(property)){
            if (overwrite || _isUnd(object[property])) {
                object[property] = properties[property];
            }
        }
    }
    return object;
};

if (_isUnd(root)) root = window;
/**
*   <p>
*   The Xmla class provides a javascript API to communicate XML for Analysis (XML/A) over HTTP.
*   XML/A is an industry standard protocol that allows webclients to work with OLAP servers.
*   To fully understand the scope and purpose of this utility, it is highly recommended
*   to read <a href="http://xmla.org/xmla1.1.doc">the XML/A specification</a>
*   (MS Word format. For other formats,
*   see: <a href="http://code.google.com/p/xmla4js/source/browse/#svn/trunk/doc/xmla1.1 specification">http://code.google.com/p/xmla4js/source/browse/#svn/trunk/doc/xmla1.1 specification</a>).
*   </p>
*   @class Xmla
*   @constructor
*   @param options Object standard options
*/
Xmla = root.Xmla = function(options){

    this.listeners = {};
    this.listeners[Xmla.EVENT_REQUEST] = [];
    this.listeners[Xmla.EVENT_SUCCESS] = [];
    this.listeners[Xmla.EVENT_ERROR] = [];

    this.listeners[Xmla.EVENT_DISCOVER] = [];
    this.listeners[Xmla.EVENT_DISCOVER_SUCCESS] = [];
    this.listeners[Xmla.EVENT_DISCOVER_ERROR] = [];

    this.listeners[Xmla.EVENT_EXECUTE] = [];
    this.listeners[Xmla.EVENT_EXECUTE_SUCCESS] = [];
    this.listeners[Xmla.EVENT_EXECUTE_ERROR] = [];

    this.options = _applyProps(
        _applyProps(
            {},
            Xmla.defaultOptions,
            true
        ),
        options,
        true
    );
    var listeners = this.options.listeners;
    if (listeners) this.addListener(listeners);
    return this;
};

Xmla.defaultOptions = {
    requestTimeout: 30000,      //by default, we bail out after 30 seconds
    async: false,               //by default, we do a synchronous request
    addFieldGetters: true       //true to augment rowsets with a method to fetch a specific field.
};

/**
*   Can be used as value for the method option in the options object passed to the
*   <code><a href="#method_request">request()</a></code> method to invoke the XML/A Discover method on the server.
*   Instead of explicitly setting the method yourself, consider using the <code><a href="#method_request">discover()</a></code> method.
*   The <code>discover()</code> method automatically sets the method option to <code>METHOD_DISCOVER</code>.
*   @property METHOD_DISCOVER
*   @static
*   @final
*   @type string
*   @default <code>Discover</code>
*/
Xmla.METHOD_DISCOVER = "Discover";
/**
*   Can be used as value for the method option property in the options objecct passed to the
*   <code><a href="#method_request">request()</code></a> method to invoke the XML/A Execute method on the server.
*   Instead of explicitly setting the method yourself, consider using the <code><a href="#method_execute">execute()</a></code> method.
*   The <code>execute()</code> method automatically sets the method option to <code>METHOD_EXECUTE</code>.
*   @property METHOD_EXECUTE
*   @static
*   @final
*   @type string
*   @default <code>Discover</code>
*/
Xmla.METHOD_EXECUTE = "Execute";

var _xmlaDISCOVER = "DISCOVER_";
var _xmlaMDSCHEMA = "MDSCHEMA_";
var _xmlaDBSCHEMA = "DBSCHEMA_";

/**
*   Can be used as value for the <code>requestType</code> option in the options object passed to the to
*   <code><a href="#method_request">request()</a></code> method to invoke the XML/A Discover method on the server to return the <code>DISCOVER_DATASOURCES</code> schema rowset.
*   The <code>requestType</code> option applies only to Discover requests.
*   Instead of passing this constant as requestType yourself, consider calling the <code><a href="#method_discoverDataSources">discoverDataSources()</a></code> method.
*   The <code>discoverDataSources()</code> method passes <code>DISCOVER_DATASOURCES</code> automatically as requestType for Discover requests.
*
*   @property DISCOVER_DATASOURCES
*   @static
*   @final
*   @type string
*   @default <code>DISCOVER_DATASOURCES</code>
*/
Xmla.DISCOVER_DATASOURCES =     _xmlaDISCOVER + "DATASOURCES";
/**
*   Can be used as value for the <code>requestType</code> option in the options object passed to the to
*   <code><a href="#method_request">request()</a></code> method to invoke the XML/A Discover method on the server to return the <code>DISCOVER_PROPERTIES</code> schema rowset.
*   The <code>requestType</code> option applies only to Discover requests.
*   Instead of passing this <code>requestType</code> yourself, consider calling the <code><a href="#method_discoverProperties">discoverProperties()</a></code> method.
*   The <code>discoverProperties()</code> method passes <code>DISCOVER_PROPERTIES</code> automatically as requestType for Discover requests.
*
*   @property DISCOVER_PROPERTIES
*   @static
*   @final
*   @type string
*   @default <code>DISCOVER_PROPERTIES</code>
*/
Xmla.DISCOVER_PROPERTIES =      _xmlaDISCOVER + "PROPERTIES";
/**
*   Can be used as value for the <code>requestType</code> option in the options object passed to the to
*   <code><a href="#method_request">request()</a></code> method to invoke the XML/A Discover method on the server to return the <code>DISCOVER_SCHEMA_ROWSETS</code> schema rowset.
*   The <code>requestType</code> option applies only to Discover requests.
*   Instead of passing this <code>requestType</code> yourself, consider calling the <code><a href="#method_discoverSchemaRowsets">discoverSchemaRowsets()</a></code> method.
*   The <code>discoverProperties()</code> method passes <code>DISCOVER_PROPERTIES</code> automatically as requestType for Discover requests.
*
*   @property DISCOVER_SCHEMA_ROWSETS
*   @static
*   @final
*   @type string
*   @default <code>DISCOVER_SCHEMA_ROWSETS</code>
*/
Xmla.DISCOVER_SCHEMA_ROWSETS =  _xmlaDISCOVER + "SCHEMA_ROWSETS";
/**
*   Can be used as value for the <code>requestType</code> option in the options object passed to the to
*   <code><a href="#method_request">request()</a></code> method to invoke the XML/A Discover method on the server to return the <code>DISCOVER_ENUMERATORS</code> schema rowset.
*   The <code>requestType</code> option applies only to Discover requests.
*   Instead of passing this <code>requestType</code> yourself, consider calling the <code><a href="#method_discoverEnumerators">discoverEnumerators()</a></code> method.
*   The <code>discoverSchemaRowsets()</code> method issues a request to invoke the Discover method using <code>DISCOVER_SCHEMA_ROWSETS</code> as requestType.
*
*   @property DISCOVER_ENUMERATORS
*   @static
*   @final
*   @type string
*   @default <code>DISCOVER_ENUMERATORS</code>
*/
Xmla.DISCOVER_ENUMERATORS =     _xmlaDISCOVER + "ENUMERATORS";
/**
*   Can be used as value for the <code>requestType</code> option in the options object passed to the to
*   <code><a href="#method_request">request()</a></code> method to invoke the XML/A Discover method on the server to return the <code>DISCOVER_KEYWORDS</code> schema rowset.
*   The <code>requestType</code> option applies only to Discover requests.
*   Instead of passing this requestType yourself, consider calling the <code><a href="#method_discoverLiterals">discoverKeywords()</a></code> method.
*   The <code>discoverKeywords()</code> method issues a request to invoke the Discover method using DISCOVER_KEYWORDS as requestType.
*
*   @property DISCOVER_KEYWORDS
*   @static
*   @final
*   @type string
*   @default <code>DISCOVER_KEYWORDS</code>
*/
Xmla.DISCOVER_KEYWORDS =        _xmlaDISCOVER + "KEYWORDS";
/**
*   Can be used as value for the <code>requestType</code> option in the options object passed to the to
*   <code><a href="#method_request">request()</a></code> method to invoke the XML/A Discover method on the server to return the <code>DISCOVER_LITERALS</code> schema rowset.
*   The <code>requestType</code> option applies only to Discover requests.
*   Instead of passing this <code>requestType</code> yourself, consider calling the <code><a href="#method_discoverLiterals">discoverLiterals()</a></code> method.
*   The <code>discoverLiterals()</code> method issues a request to invoke the Discover method using DISCOVER_LITERALS as requestType.
*
*   @property DISCOVER_LITERALS
*   @static
*   @final
*   @type string
*   @default <code>DISCOVER_LITERALS</code>
*/
Xmla.DISCOVER_LITERALS =        _xmlaDISCOVER + "LITERALS";
/**
*   Can be used as value for the <code>requestType</code> option in the options object passed to the to
*   <code><a href="#method_request">request()</a></code> method to invoke the XML/A Discover method on the server to return the <code>DBSCHEMA_CATALOGS</code> schema rowset.
*   The <code>requestType</code> option applies only to Discover requests.
*   Instead of passing this <code>requestType</code> yourself, consider calling the <code><a href="#method_discoverDBCatalogs">discoverDBCatalogs()</a></code> method.
*   The <code>discoverDBCatalogs()</code> method issues a request to invoke the Discover method using <code>DBSCHEMA_CATALOGS</code> as requestType.
*
*   @property DBSCHEMA_CATALOGS
*   @static
*   @final
*   @type string
*   @default <code>DBSCHEMA_CATALOGS</code>
*/
Xmla.DBSCHEMA_CATALOGS =       _xmlaDBSCHEMA + "CATALOGS";
/**
*   Can be used as value for the <code>requestType</code> option in the options object passed to the to
*   <code><a href="#method_request">request()</a></code> method to invoke the XML/A Discover method on the server to return the <code>DBSCHEMA_COLUMNS</code> schema rowset.
*   The <code>requestType</code> option applies only to Discover requests.
*   Instead of passing this <code>requestType</code> yourself, consider calling the <code><a href="#method_discoverDBColumns">discoverDBColumns()</a></code> method.
*   The <code>discoverDBColumns()</code> method issues a request to invoke the Discover method using <code>DBSCHEMA_COLUMNS</code> as requestType.
*
*   @property DBSCHEMA_COLUMNS
*   @static
*   @final
*   @type string
*   @default <code>DBSCHEMA_COLUMNS</code>
*/
Xmla.DBSCHEMA_COLUMNS =        _xmlaDBSCHEMA + "COLUMNS";
/**
*   Can be used as value for the <code>requestType</code> option in the options object passed to the to
*   <code><a href="#method_request">request()</a></code> method to invoke the XML/A Discover method on the server to return the <code>DBSCHEMA_PROVIDER_TYPES</code> schema rowset.
*   The <code>requestType</code> option applies only to Discover requests.
*   Instead of passing this <code>requestType</code> yourself, consider calling the <code><a href="#method_discoverDBProviderTypes">discoverDBProviderTypes()</a></code> method.
*   The <code>discoverDBProviderTypes()</code> method issues a request to invoke the Discover method using <code>DBSCHEMA_PROVIDER_TYPES</code> as requestType.
*
*   @property DBSCHEMA_PROVIDER_TYPES
*   @static
*   @final
*   @type string
*   @default <code>DBSCHEMA_PROVIDER_TYPES</code>
*/
Xmla.DBSCHEMA_PROVIDER_TYPES = _xmlaDBSCHEMA + "PROVIDER_TYPES";
/**
*   Can be used as value for the <code>requestType</code> option in the options object passed to the to
*   <code><a href="#method_request">request()</a></code> method to invoke the XML/A Discover method on the server to return the <code>DBSCHEMA_SCHEMATA</code> schema rowset.
*   The <code>requestType</code> option applies only to Discover requests.
*   Instead of passing this <code>requestType</code> yourself, consider calling the <code><a href="#method_discoverDBSchemata">discoverDBSchemata()</a></code> method.
*   The <code>discoverDBColumns()</code> method issues a request to invoke the Discover method using <code>DBSCHEMA_SCHEMATA</code> as requestType.
*
*   @property DBSCHEMA_SCHEMATA
*   @static
*   @final
*   @type string
*   @default <code>DBSCHEMA_SCHEMATA</code>
*/
Xmla.DBSCHEMA_SCHEMATA =       _xmlaDBSCHEMA + "SCHEMATA";
/**
*   Can be used as value for the <code>requestType</code> option in the options object passed to the to
*   <code><a href="#method_request">request()</a></code> method to invoke the XML/A Discover method on the server to return the <code>DBSCHEMA_TABLES</code> schema rowset.
*   The <code>requestType</code> option applies only to Discover requests.
*   Instead of passing this <code>requestType</code> yourself, consider calling the <code><a href="#method_discoverDBTables">discoverDBTables()</a></code> method.
*   The <code>discoverDBColumns()</code> method issues a request to invoke the Discover method using <code>DBSCHEMA_TABLES</code> as requestType.
*
*   @property DBSCHEMA_TABLES
*   @static
*   @final
*   @type string
*   @default <code>DBSCHEMA_TABLES</code>
*/
Xmla.DBSCHEMA_TABLES =         _xmlaDBSCHEMA + "TABLES";
/**
*   Can be used as value for the <code>requestType</code> option in the options object passed to the to
*   <code><a href="#method_request">request()</a></code> method to invoke the XML/A Discover method on the server to return the <code>DBSCHEMA_TABLES_INFO</code> schema rowset.
*   The <code>requestType</code> option applies only to Discover requests.
*   Instead of passing this <code>requestType</code> yourself, consider calling the
*   <code><a href="#method_discoverDBTablesInfo">discoverDBTablesInfo()</a></code> method.
*   The <code>discoverDBTablesInfo()</code> method issues a request to invoke the Discover method using <code>DBSCHEMA_TABLES_INFO</code> as requestType.
*
*   @property DBSCHEMA_TABLES_INFO
*   @static
*   @final
*   @type string
*   @default <code>DBSCHEMA_TABLES_INFO</code>
*/
Xmla.DBSCHEMA_TABLES_INFO =    _xmlaDBSCHEMA + "TABLES_INFO";
/**
*   Can be used as value for the <code>requestType</code> option in the options object passed to the to
*   <code><a href="#method_request">request()</a></code> method to invoke the XML/A Discover method on the server to return the <code>MDSCHEMA_ACTIONS</code> schema rowset.
*   The <code>requestType</code> option applies only to Discover requests.
*   Instead of passing this <code>requestType</code> yourself, consider calling the
*   <code><a href="#method_discoverMDActions">discoverMDActions()</a></code> method.
*   The <code>discoverMDActions()</code> method issues a request to invoke the Discover method using <code>MDSCHEMA_ACTIONS</code> as requestType.
*
*   @property MDSCHEMA_ACTIONS
*   @static
*   @final
*   @type string
*   @default <code>MDSCHEMA_ACTIONS</code>
*/
Xmla.MDSCHEMA_ACTIONS =        _xmlaMDSCHEMA + "ACTIONS";
/**
*   Can be used as value for the <code>requestType</code> option in the options object passed to the to
*   <code><a href="#method_request">request()</a></code> method to invoke the XML/A Discover method on the server to return the
*   <code>MDSCHEMA_CUBES</code> schema rowset.
*   The <code>requestType</code> option applies only to Discover requests.
*   Instead of passing this <code>requestType</code> yourself, consider calling the
*   <code><a href="#method_discoverMDCubes">discoverMDCubes()</a></code> method.
*   The <code>discoverMDCubes()</code> method issues a request to invoke the Discover method using
*   <code>MDSCHEMA_CUBES</code> as requestType.
*
*   @property MDSCHEMA_CUBES
*   @static
*   @final
*   @type string
*   @default <code>MDSCHEMA_CUBES</code>
*/
Xmla.MDSCHEMA_CUBES =          _xmlaMDSCHEMA + "CUBES";
/**
*   Can be used as value for the <code>requestType</code> option in the options object passed to the to
*   <code><a href="#method_request">request()</a></code> method to invoke the XML/A Discover method on the server to return the
*   <code>MDSCHEMA_DIMENSIONS</code> schema rowset.
*   The <code>requestType</code> option applies only to Discover requests.
*   Instead of passing this <code>requestType</code> yourself, consider calling the
*   <code><a href="#method_discoverMDDimensions">discoverMDDimensions()</a></code> method.
*   The <code>discoverMDDimensions()</code> method issues a request to invoke the Discover method using
*   <code>MDSCHEMA_DIMENSIONS</code> as requestType.
*
*   @property MDSCHEMA_DIMENSIONS
*   @static
*   @final
*   @type string
*   @default <code>MDSCHEMA_DIMENSIONS</code>
*/
Xmla.MDSCHEMA_DIMENSIONS =     _xmlaMDSCHEMA + "DIMENSIONS";
/**
*   Can be used as value for the <code>requestType</code> option in the options object passed to the to
*   <code><a href="#method_request">request()</a></code> method to invoke the XML/A Discover method on the server to return the
*   <code>MDSCHEMA_FUNCTIONS</code> schema rowset.
*   The <code>requestType</code> option applies only to Discover requests.
*   Instead of passing this <code>requestType</code> yourself, consider calling the
*   <code><a href="#method_discoverMDFunctions">discoverMDFunctions()</a></code> method.
*   The <code>discoverMDFunctions()</code> method issues a request to invoke the Discover method using
*   <code>MDSCHEMA_FUNCTIONS</code> as requestType.
*
*   @property MDSCHEMA_FUNCTIONS
*   @static
*   @final
*   @type string
*   @default <code>MDSCHEMA_FUNCTIONS</code>
*/
Xmla.MDSCHEMA_FUNCTIONS =      _xmlaMDSCHEMA + "FUNCTIONS";
/**
*   Can be used as value for the <code>requestType</code> option in the options object passed to the to
*   <code><a href="#method_request">request()</a></code> method to invoke the XML/A Discover method on the server to return the
*   <code>MDSCHEMA_HIERARCHIES</code> schema rowset.
*   The <code>requestType</code> option applies only to Discover requests.
*   Instead of passing this <code>requestType</code> yourself, consider calling the
*   <code><a href="#method_discoverMDHierarchies">discoverMDHierarchies()</a></code> method.
*   The <code>discoverMDHierarchies()</code> method issues a request to invoke the Discover method using
*   <code>MDSCHEMA_HIERARCHIES</code> as requestType.
*
*   @property MDSCHEMA_HIERARCHIES
*   @static
*   @final
*   @type string
*   @default <code>MDSCHEMA_HIERARCHIES</code>
*/
Xmla.MDSCHEMA_HIERARCHIES =    _xmlaMDSCHEMA + "HIERARCHIES";
/**
*   Can be used as value for the <code>requestType</code> option in the options object passed to the to
*   <code><a href="#method_request">request()</a></code> method to invoke the XML/A Discover method on the server to return the
*   <code>MDSCHEMA_LEVELS</code> schema rowset.
*   The <code>requestType</code> option applies only to Discover requests.
*   Instead of passing this <code>requestType</code> yourself, consider calling the
*   <code><a href="#method_discoverMDLevels">discoverMDLevels()</a></code> method.
*   The <code>discoverMDLevels()</code> method issues a request to invoke the Discover method using
*   <code>MDSCHEMA_LEVELS</code> as requestType.
*
*   @property MDSCHEMA_LEVELS
*   @static
*   @final
*   @type string
*   @default <code>MDSCHEMA_LEVELS</code>
*/
Xmla.MDSCHEMA_LEVELS =         _xmlaMDSCHEMA + "LEVELS";
/**
*   Can be used as value for the <code>requestType</code> option in the options object passed to the to
*   <code><a href="#method_request">request()</a></code> method to invoke the XML/A Discover method on the server to return the
*   <code>MDSCHEMA_MEASURES</code> schema rowset.
*   The <code>requestType</code> option applies only to Discover requests.
*   Instead of passing this <code>requestType</code> yourself, consider calling the
*   <code><a href="#method_discoverMDMeasures">discoverMDMeasures()</a></code> method.
*   The <code>discoverMDMeasures()</code> method issues a request to invoke the Discover method using
*   <code>MDSCHEMA_MEASURES</code> as requestType.
*
*   @property MDSCHEMA_MEASURES
*   @static
*   @final
*   @type string
*   @default <code>MDSCHEMA_MEASURES</code>
*/
Xmla.MDSCHEMA_MEASURES =       _xmlaMDSCHEMA + "MEASURES";
/**
*   Can be used as value for the <code>requestType</code> option in the options object passed to the to
*   <code><a href="#method_request">request()</a></code> method to invoke the XML/A Discover method on the server to return the
*   <code>MDSCHEMA_MEMBERS</code> schema rowset.
*   The <code>requestType</code> option applies only to Discover requests.
*   Instead of passing this <code>requestType</code> yourself, consider calling the
*   <code><a href="#method_discoverMDMembers">discoverMDMembers()</a></code> method.
*   The <code>discoverMDMembers()</code> method issues a request to invoke the Discover method using
*   <code>MDSCHEMA_MEMBERS</code> as requestType.
*
*   @property MDSCHEMA_MEMBERS
*   @static
*   @final
*   @type string
*   @default <code>MDSCHEMA_MEMBERS</code>
*/
Xmla.MDSCHEMA_MEMBERS =        _xmlaMDSCHEMA + "MEMBERS";
/**
*   Can be used as value for the <code>requestType</code> option in the options object passed to the to
*   <code><a href="#method_request">request()</a></code> method to invoke the XML/A Discover method on the server to return the
*   <code>MDSCHEMA_PROPERTIES</code> schema rowset.
*   The <code>requestType</code> option applies only to Discover requests.
*   Instead of passing this <code>requestType</code> yourself, consider calling the
*   <code><a href="#method_discoverMDProperties">discoverMDProperties()</a></code> method.
*   The <code>discoverMDProperties()</code> method issues a request to invoke the Discover method using
*   <code>MDSCHEMA_PROPERTIES</code> as requestType.
*
*   @property MDSCHEMA_PROPERTIES
*   @static
*   @final
*   @type string
*   @default <code>MDSCHEMA_PROPERTIES</code>
*/
Xmla.MDSCHEMA_PROPERTIES =     _xmlaMDSCHEMA + "PROPERTIES";
/**
*   Can be used as value for the <code>requestType</code> option in the options object passed to the to
*   <code><a href="#method_request">request()</a></code> method to invoke the XML/A Discover method on the server to return the
*   <code>MDSCHEMA_SETS</code> schema rowset.
*   The <code>requestType</code> option applies only to Discover requests.
*   Instead of passing this <code>requestType</code> yourself, consider calling the
*   <code><a href="#method_discoverMDSets">discoverMDSets()</a></code> method.
*   The <code>discoverMDSets()</code> method issues a request to invoke the Discover method using
*   <code>MDSCHEMA_SETS</code> as requestType.
*
*   @property MDSCHEMA_SETS
*   @static
*   @final
*   @type string
*   @default <code>MDSCHEMA_SETS</code>
*/
Xmla.MDSCHEMA_SETS = _xmlaMDSCHEMA + "SETS";
/**
*   Indicates the <code>request</code> event.
*   This constant can be used as en entry in the events array argument for the <code><a href="#method_addListener">addListener()</a></code> method.
*   The <code>request</code> event is the first event that is fired before submitting a request
*   (see: <code><a href="#method_request">request()</a></code>)
*   to the server, and before firing the method-specific request events
*   (see <code><a href="#property_EVENT_EXECUTE">EVENT_EXECUTE</a></code>
*   and <code><a href="#property_EVENT_DISCOVER">EVENT_DISCOVER</a></code>).
*   The <code>request</code> event itself is not method-specific, and fires for <code>Execute</code> as well as <code>Discover</code> requests.
*   The <code>EVENT_REQUEST</code> event is <em>cancelable</em>:
*   the <code>handler</code> function specified in the listener object passed to <code>addListener</code> should return a boolen, indicating
*   whether the respective operation should be canceled.
*
*   @property EVENT_REQUEST
*   @static
*   @final
*   @type string
*   @default <code>request</code>
*/
Xmla.EVENT_REQUEST = "request";
/**
*   Indicates the <code>success</code> event.
*   This constant can be used as en entry in the events array argument for the <code><a href="#method_addListener">addListener()</a></code> method.
*   The <code>success</code> event  is the last event that is fired after receiving and processing a normal response
*   (that is, a response that does not contain an XML/A <code>SoapFault</code>),
*   after firing the method-specific success events
*   (see <code><a href="#property_EVENT_EXECUTE_SUCCESS">EVENT_EXECUTE_SUCCESS</a></code>
*   and <code><a href="#property_EVENT_DISCOVER_SUCCESS">EVENT_DISCOVER_SUCCESS</a></code>).
*   The <code>success</code> event is not method-specific, and fires for <code>Execute</code> as well as <code>Discover</code> responses.
*   This is event is not cancelable.
*
*   @property EVENT_SUCCESS
*   @static
*   @final
*   @type string
*   @default <code>success</code>
*/
Xmla.EVENT_SUCCESS = "success";
/**
*   Indicates the <code>error</code> event.
*   This constant can be used as en entry in the events array argument for the <code><a href="#method_addListener">addListener()</a></code> method.
*   The <code>error</code> is fired when an error occurs while sending a request or receiving a response.
*   The <code>error</code> event is not method-specific, and fires for errors encountered during both <code>Execute</code> as well as <code>Discover</code> method invocations.
*   This is event is not cancelable.
*
*   @property EVENT_ERROR
*   @static
*   @final
*   @type string
*   @default <code>error</code>
*/
Xmla.EVENT_ERROR = "error";

/**
*   Indicates the <code>execute</code> event.
*   This constant can be used as en entry in the events array argument for the <code><a href="#method_addListener">addListener()</a></code> method.
*   The <code>execute</code> event is method-specific, and is fired before submitting an <code>Execute</code> request
*   (see: <code><a href="#method_execute">execute()</a></code>)
*   to the server, but after firing the <code>request</code> event
*   (see: <code><a href="#property_EVENT_REQUEST">EVENT_REQUEST</a></code>).
*   The <code>EVENT_EXECUTE</code> event is <em>cancelable</em>:
*   the <code>handler</code> function specified in the listener object passed to <code>addListener</code> should return a boolen, indicating
*   whether the respective operation should be canceled.
*
*   @property EVENT_EXECUTE
*   @static
*   @final
*   @type string
*   @default <code>execute</code>
*/
Xmla.EVENT_EXECUTE = "execute";
/**
*   Indicates the <code>executesuccess</code> event.
*   This constant can be used as en entry in the events array argument for the <code><a href="#method_addListener">addListener()</a></code> method.
*   The <code>executesuccess</code> event is method-specific and fired only after receiving and processing a normal response
*   (that is, a response that does not contain a <code>SoapFault</code>)
*   to an incovation of the XML/A <code>Execute</code> method
*   (see: <code><a href="#method_execute">execute()</a></code>).
*   This is event is not cancelable.
*
*   @property EVENT_EXECUTE_SUCCESS
*   @static
*   @final
*   @type string
*   @default <code>executesuccess</code>
*/
Xmla.EVENT_EXECUTE_SUCCESS = "executesuccess";
/**
*   Indicates the <code>executeerror</code> event.
*   This constant can be used as en entry in the events array argument for the <code><a href="#method_addListener">addListener()</a></code> method.
*   The <code>executeerror</code> event is method-specific and fired when an error occurs while sending an <code>Execute</code> request, or receiving a response to an <code>Execute</code method.
*   (see: <code><a href="#method_execute">execute()</a></code>).
*   This is event is not cancelable.
*
*   @property EVENT_EXECUTE_ERROR
*   @static
*   @final
*   @type string
*   @default <code>executeerror</code>
*/
Xmla.EVENT_EXECUTE_ERROR = "executeerror";

/**
*   Indicates the <code>discover</code> event.
*   This constant can be used as en entry in the events array argument for the <code><a href="#method_addListener">addListener()</a></code> method.
*   The <code>discover</code> event is method-specific, and is fired before submitting a <code>Discover</code> request
*   (see: <code><a href="#method_discover">discover()</a></code>)
*   to the server, but after firing the <code>request</code> event
*   (see: <code><a href="#property_EVENT_DISCOVER">EVENT_DISCOVER</a></code>).
*   The <code>EVENT_DISCOVER</code> event is <em>cancelable</em>:
*   the <code>handler</code> function specified in the listener object passed to <code>addListener</code> should return a boolen, indicating
*   whether the respective operation should be canceled.
*
*   @property EVENT_DISCOVER
*   @static
*   @final
*   @type string
*   @default <code>discover</code>
*/
Xmla.EVENT_DISCOVER = "discover";
/**
*   Indicates the <code>discoversuccess</code> event.
*   This constant can be used as en entry in the events array argument for the <code><a href="#method_addListener">addListener()</a></code> method.
*   The <code>discoversuccess</code> event is method-specific and fired only after receiving and processing a normal response
*   (that is, a response that does not contain a <code>SoapFault</code>)
*   to an incovation of the XML/A <code>Discover</code> method
*   (see: <code><a href="#method_discover">discover()</a></code>).
*   This is event is not cancelable.
*
*   @property EVENT_DISCOVER_SUCCESS
*   @static
*   @final
*   @type string
*   @default <code>discoversuccess</code>
*/
Xmla.EVENT_DISCOVER_SUCCESS = "discoversuccess";
/**
*   Indicates the <code>discovererror</code> event.
*   This constant can be used as en entry in the events array argument for the <code><a href="#method_addListener">addListener()</a></code> method.
*   The <code>discovererror</code> is method-specific and fired when an error occurs while sending an <code>Discover</code> request,
*   or receiving a response to an <code>Discover</code method.
*   (see: <code><a href="#method_discover">discover()</a></code>).
*   This is event is not cancelable.
*
*   @property EVENT_DISCOVER_ERROR
*   @static
*   @final
*   @type string
*   @default <code>discovererror</code>
*/
Xmla.EVENT_DISCOVER_ERROR = "discovererror";

/**
*   Unifies all general events, that is, all events that are not method-specific.
*   This constant can be used as events array argument for the <code><a href="#method_addListener">addListener()</a></code> method,
*   or you can use array concatenation to combine it with other arrays of <code>EVENT_XXX</code> constants.
*   This constant is especially intended for asyncronous handling of Schema rowset data.
*
*   @property EVENT_GENERAL
*   @static
*   @final
*   @type string[]
*   @default <code>[EVENT_REQUEST,EVENT_SUCCESS,EVENT_ERROR]</code>
*/
Xmla.EVENT_GENERAL = [
    Xmla.EVENT_REQUEST,
    Xmla.EVENT_SUCCESS,
    Xmla.EVENT_ERROR
];

/**
*   Unifies all events specific for the <code>Discover</code> method.
*   This constant can be used as events array argument for the <code><a href="#method_addListener">addListener()</a></code> method,
*   or you can use array concatenation to combine it with other arrays of <code>EVENT_XXX</code> constants.
*
*   @property EVENT_DISCOVER_ALL
*   @static
*   @final
*   @type string[]
*   @default <code>[EVENT_DISCOVER,EVENT_DISCOVER_SUCCESS,EVENT_DISCOVER_ERROR]</code>
*/
Xmla.EVENT_DISCOVER_ALL = [
    Xmla.EVENT_DISCOVER,
    Xmla.EVENT_DISCOVER_SUCCESS,
    Xmla.EVENT_DISCOVER_ERROR
];

/**
*   Unifies all events specific for the <code>Execute</code> method.
*   This constant can be used as events array argument for the <code><a href="#method_addListener">addListener()</a></code> method,
*   or you can use array concatenation to combine it with other arrays of <code>EVENT_XXX</code> constants.
*
*   @property EVENT_EXECUTE_ALL
*   @static
*   @final
*   @type string[]
*   @default <code>[EVENT_EXECUTE,EVENT_EXECUTE_SUCCESS,EVENT_EXECUTE_ERROR]</code>
*/
Xmla.EVENT_EXECUTE_ALL = [
    Xmla.EVENT_EXECUTE,
    Xmla.EVENT_EXECUTE_SUCCESS,
    Xmla.EVENT_EXECUTE_ERROR
];

/**
*   Unifies all method-specific and non method-specific events.
*   This constant can be used as events array argument for the <code><a href="#method_addListener">addListener()</a></code> method.
*
*   @property EVENT_ALL
*   @static
*   @final
*   @type string[]
*   @default <code>[].concat(Xmla.EVENT_GENERAL, Xmla.EVENT_DISCOVER_ALL, Xmla.EVENT_EXECUTE_ALL)</code>
*/
Xmla.EVENT_ALL = [].concat(
    Xmla.EVENT_GENERAL,
    Xmla.EVENT_DISCOVER_ALL,
    Xmla.EVENT_EXECUTE_ALL
);

/**
*   Can be used as key in the <code>properties</code> member of the <code>options</code> object
*   passed to the <code><a href="#method_request">request()</a></code> method
*   to specify the XML/A <code>DataSourceInfo</code> property.
*   The XML/A <code>DataSourceInfo</code>, together with the XML/A service URL are required to
*   connect to a particular OLAP datasource.
*   Valid values for the <code>DataSourceInfo</code> as well as the corresponding URL should be obtained
*   by querying the <code>DataSourceInfo</code> and <code>URL</code> columns of the <code>DISCOVER_DATASOURCES</code>
*   rowset respectively (see <code><a href="method_discoverDataSources">discoverDataSources()</a></code>).
*
*   @property PROP_DATASOURCEINFO
*   @static
*   @final
*   @type string
*   @default <code>DataSourceInfo</code>
*/
Xmla.PROP_DATASOURCEINFO = "DataSourceInfo";
/**
*   Can be used as key in the <code>properties</code> member of the <code>options</code> object
*   passed to the <code><a href="#method_request">execute()</a></code> method
*   to specify the XML/A <code>Catalog</code> property.
*   The XML/A <code>Catalog</code> spefifies where to look for cubes that are referenced in th MDX statment.
*   Valid values for the <code>Catalog</code> should be obtained
*   by querying the <code>CATALOG_NAME</code> of the <code>DBSCHEMA_CATALOGS</code>
*   rowset (see <code><a href="method_discoverCatalogs">discoverCatalogs()</a></code>).
*
*   @property PROP_Catalog
*   @static
*   @final
*   @type string
*   @default <code>Catalog</code>
*/
Xmla.PROP_CATALOG = "Catalog";
Xmla.PROP_CUBE = "Cube";

/**
*   Can be used as key in the <code>properties</code> member of the <code>options</code> object
*   passed to the <code><a href="#method_execute">execute()</a></code> method
*   to specify the XML/A <code>Format</code> property.
*   This property controls the structure of the resultset.
*
*   @property PROP_FORMAT
*   @static
*   @final
*   @type string
*   @default <code>Format</code>
*/
Xmla.PROP_FORMAT = "Format";
/**
*   Can be used as value for the
*   <code><a href="#property_PROP_FORMAT>PROP_FORMAT</a></code> key of the
*   <code>properties</code> member of the
*   <code>options</code> object passed to the
*   <code><a href="#method_execute">execute()</a></code> method.
*   When used, this specifies that the multidimensional resultset should be returned in a tabular format,
*   causeing the multidimensional resultset to be represented with an instance of the
*   <code><a href="Xmla.Rowset#class_Xmla.Rowset">Xmla.Rowset</a></code> class.
*
*   @property PROP_FORMAT_TABULAR
*   @static
*   @final
*   @type string
*   @default <code>Tabular</code>
*/
Xmla.PROP_FORMAT_TABULAR = "Tabular";
/**
*   Can be used as value for the
*   <code><a href="#property_PROP_FORMAT>PROP_FORMAT</a></code> key of the
*   <code>properties</code> member of the
*   <code>options</code> object passed to the
*   <code><a href="#method_execute">execute()</a></code> method.
*   When used, this specifies that the multidimensional resultset should be returned in a multidimensional format.
*   Currently, Xmla4js does not provide a class to represent the resultset in this format.
*   However, you can access the results as xml through the
*   <code><a href="#property_responseText">responseText</a></code> and
*   <code><a href="#property_responseXML">responseXML</a></code> properties.
*
*   @property PROP_FORMAT_MULTIDIMENSIONAL
*   @static
*   @final
*   @type string
*   @default <code>Multidimensional</code>
*/
Xmla.PROP_FORMAT_MULTIDIMENSIONAL = "Multidimensional";

/**
*   Can be used as key in the <code>properties</code> member of the <code>options</code> object
*   passed to the <code><a href="#method_execute">execute()</a></code> method
*   to specify the XML/A <code>AxisFormat</code> property.
*   The XML/A <code>AxisFormat</code> property specifies how the client wants to receive the multi-dimensional resultset of a MDX query.
*   Valid values for the <code>AxisFormat</code> property are available as the static final properties
*   <code><a href="#property_PROP_AXISFORMAT_TUPLE">PROP_AXISFORMAT_TUPLE</a></code>,
*   <code><a href="#property_PROP_AXISFORMAT_CLUSTER">PROP_AXISFORMAT_CLUSTER</a></code>,
*   <code><a href="#property_PROP_AXISFORMAT_CUSTOM">PROP_AXISFORMAT_CUSTOM</a></code>.
*
*   @property PROP_AXISFORMAT
*   @static
*   @final
*   @type string
*   @default <code>AxisFormat</code>
*/
Xmla.PROP_AXISFORMAT = "AxisFormat";
/**
*   Can be used as value for the <code>AxisFormat</code> XML/A property
*   (see: <code><a href="#property_PROP_AXISFORMAT">PROP_AXISFORMAT</a></code>)
*   in invocations of the <code>Execute</code> method
*   (see: <code><a href="#method_execute">execute()</a></code>).
*
*   @property PROP_AXISFORMAT_TUPLE
*   @static
*   @final
*   @type string
*   @default <code>TupleFormat</code>
*/
Xmla.PROP_AXISFORMAT_TUPLE = "TupleFormat";
/**
*   Can be used as value for the <code>AxisFormat</code> XML/A property
*   (see: <code><a href="#property_PROP_AXISFORMAT">PROP_AXISFORMAT</a></code>)
*   in invocations of the <code>Execute</code> method
*   (see: <code><a href="#method_execute">execute()</a></code>).
*
*   @property PROP_AXISFORMAT_CLUSTER
*   @static
*   @final
*   @type string
*   @default <code>ClusterFormat</code>
*/
Xmla.PROP_AXISFORMAT_CLUSTER = "ClusterFormat";
/**
*   Can be used as value for the <code>AxisFormat</code> XML/A property
*   (see: <code><a href="#property_PROP_AXISFORMAT">PROP_AXISFORMAT</a></code>)
*   in invocations of the <code>Execute</code> method
*   (see: <code><a href="#method_execute">execute()</a></code>).
*
*   @property PROP_AXISFORMAT_CUSTOM
*   @static
*   @final
*   @type string
*   @default <code>CustomFormat</code>
*/
Xmla.PROP_AXISFORMAT_CUSTOM = "CustomFormat";

/**
*   Can be used as key in the <code>properties</code> member of the <code>options</code> object
*   passed to the <code><a href="#method_request">request()</a></code> method
*   to specify the XML/A <code>Content</code> property.
*   The XML/A <code>Content</code> property specifies whether to return data and/or XML Schema metadata by the <code>Discover</code> and <code>Execute</code> invocations.
*   Valid values for the <code>Content</code> property are available as the static final properties
*   <code><a href="#property_PROP_CONTENT_DATA">PROP_CONTENT_DATA</a></code>,
*   <code><a href="#property_PROP_CONTENT_NONE">PROP_CONTENT_NONE</a></code>,
*   <code><a href="#property_PROP_CONTENT_SCHEMA">PROP_CONTENT_SCHEMA</a></code>,
*   <code><a href="#property_PROP_CONTENT_SCHEMADATA">PROP_CONTENT_SCHEMADATA</a></code>.
*
*   Note: This key is primarily intended for clients that use the low-level <code><a href="#method_request">request()</a></code> method.
*   You should not set this property when calling the <code><a href="#method_request">discover()</a></code> method,
*   the <code><a href="#method_execute">execute()</a></code> method,
*   or any of the <code>discoverXXX()</code> methods.
*
*   @property PROP_CONTENT
*   @static
*   @final
*   @type string
*   @default <code>Content</code>
*/
Xmla.PROP_CONTENT = "Content";
/**
*   Can be used as value for the XML/A <code>Content</code> property
*   (see: <code><a href="#property_PROP_CONTENT">PROP_CONTENT</a></code>).
*   This value specifies that the response should contain only data, but no XML Schema metadata.
*
*   As the <code>Xmla</code> class relies on the XML Schema metadata to construct Rowset and Resultset instances,
*   this option is primarily useful if you know how to process the XML response directly.
*
*   @property PROP_CONTENT_DATA
*   @static
*   @final
*   @type string
*   @default <code>Data</code>
*/
Xmla.PROP_CONTENT_DATA = "Data";
/**
*   Can be used as value for the XML/A <code>Content</code> property
*   (see: <code><a href="#property_PROP_CONTENT">PROP_CONTENT</a></code>).
*   This value specifies that the response should contain neither data nor XML Schema metadata.
*   This is useful to check the validity of the request.
*
*   @property PROP_CONTENT_NONE
*   @static
*   @final
*   @type string
*   @default <code>None</code>
*/
Xmla.PROP_CONTENT_NONE = "None";
/**
*   Can be used as value for the XML/A <code>Content</code> property
*   (see: <code><a href="#property_PROP_CONTENT">PROP_CONTENT</a></code>).
*   This value specifies that the response should only return XML Schema metadata, but no data.
*
*   @property PROP_CONTENT_SCHEMA
*   @static
*   @final
*   @type string
*   @default <code>Schema</code>
*/
Xmla.PROP_CONTENT_SCHEMA = "Schema";
/**
*   Can be used as value for the XML/A <code>Content</code> property
*   (see: <code><a href="#property_PROP_CONTENT">PROP_CONTENT</a></code>).
*   This value specifies that the response should return both data as well as XML Schema metadata.
*
*   @property PROP_CONTENT_SCHEMADATA
*   @static
*   @final
*   @type string
*   @default <code>SchemaData</code>
*/
Xmla.PROP_CONTENT_SCHEMADATA = "SchemaData";

Xmla.prototype = {
/**
*   This object stores listeners.
*   Each key is a listener type (see the static final <code>EVENT_XXX</code> constants),
*   each value is an array of listener objects that are subscribed to that particular event.
*
*   @property listeners
*   @protected
*   @type Object
*   @default <pre>
{
&nbsp;     "request": []
&nbsp;,   "succss": []
&nbsp;,   "error": []
&nbsp;,   "discover": []
&nbsp;,   "discoversuccss": []
&nbsp;,   "discovererror": []
&nbsp;,   "execute": []
&nbsp;,   "executesuccss": []
&nbsp;,   "executeerror": []
}</pre>
*/
    listeners: null,
/**
*   The soap message sent in the last request to the server.
*
*   @property soapMessage
*   @type {string}
*   @default <code>null</code>
*/
    soapMessage: null,
/**
*   This property is set to <code>null</code> right before sending an XML/A request.
*   When a successfull response is received, it is processed and the response object is assigned to this property.
*   The response object is either a
*   <code><a href="Rowset.html#class_Rowset">Rowset</a></code> (after a successful invocation of XML/A <code>Discover</code> method, see: <code><a href="method_discover">discover()</a></code>) or a
*   <code><a href="Resultset.html#class_Resultset">Resultset</a></code> (after a successful invocation of the XML/A <code>Execute</code> method, see: <code><a href="method_execute">executte()</a></code>)
*   instance.
*
*   If you are interested in processing the raw response XML, see
*   <code><a href="#property_responseXML">responseXML</a></code> and
*   <code><a href="#property_responseText">responseText</a></code>.
*
*   Note that it is not safe to read this property immediately after doing an asynchronous request.
*   For asynchronous requests, you can read this property by the time the <code>XXX_SUCCESS</code> event handlers are notified (until it is set to <code>null</code> again by a subsequent request).
*
*   @property response
*   @type Xmla.Rowset|Xmla.Resultset
*   @default <code>null</code>
*/
    response: null,
/**
*   This property is set to <code>null</code> right before sending an XML/A request.
*   When a successfull response is received, the XML response is stored to this property as plain text.
*
*   If you are interested in processing a DOM document rather than the raw XML text, see the
*   <code><a href="#property_responseXML">responseXML</a></code> property.
*
*   If you are interested in traversing the dataset returned in the XML/A response, see the
*   <code><a href="#property_response">response</a></code> property.
*
*   Note that it is not safe to read this property immediately after doing an asynchronous request.
*   For asynchronous requests, you can read this property by the time the <code>XXX_SUCCESS</code> event handlers are notified (until it is set to <code>null</code> again by a subsequent request).
*
*   @property responseText
*   @type {string}
*   @default <code>null</code>
*/
    responseText: null,
/**
*   This property is set to <code>null</code> right before sending an XML/A request.
*   When a successfull response is received, the XML response is stored to this property as a DOM Document.
*
*   If you are interested in processing the raw XML text rather than a DOM document, see the
*   <code><a href="#property_responseText">responseText</a></code> property.
*
*   If you are interested in traversing the dataset returned in the XML/A response, see the
*   <code><a href="#property_response">response</a></code> property.
*
*   Note that it is not safe to read this property immediately after doing an asynchronous request.
*   For asynchronous requests, you can read this property by the time the <code>XXX_SUCCESS</code> event handlers are notified (until it is set to <code>null</code> again by a subsequent request).
*
*   @property responseXML
*   @type {DOMDocument}
*   @default <code>null</code>
*/
    responseXML: null,
/**
*    This method can be used to set a number of default options for the Xmla instance.
*    This is especially useful if you don't want to pass each and every option to each method call all the time.
*    Where appropriate, information that is missing from the parameter objects passed to the methods of the Xmla object
*   may be augmented with the values set through this method.
*    For example, if you plan to do a series of requests pertaining to one particular datasource,
*    you can set the mandatory options like url, async, datasource and catalog just once:
*    <pre>
&nbsp;   xml.setOptions({
&nbsp;       url: "http://localhost:8080/pentaho/Xmla",
&nbsp;       async: true,
&nbsp;       properties: {
&nbsp;           DataSourceInfo: "Pentaho Analysis Services",
&nbsp;           Catalog: "Foodmart"
&nbsp;       }
&nbsp;   });
*    </pre>
*    Then, a subsequent <code></code>
*    @method setOptions
*    @param Object
*/
    setOptions: function(options){
        _applyProps(
            this.options,
            options,
            true
        );
    },
/**
*   This method can be used to register one or more listeners. On such listener can listen for one or more events.
*   <p>For a single listener, you can pass a <code>listener</code> object literal with the following structure:</p><pre>{
*       events: ...event name or array of event names...,
*       handler: ...function or array of functions...,
*       scope: object
*   }</pre>
*   <p>
*       You can use <code>event</code> as an alias for <code>events</code>.
*       Likewise, you can use <code>handlers</code> as an alias for <code>handler</code>.
*   </p>
*   <p>
*       Alternatively, you can pass the element as separate arguments instead of as an object literal:
*       <code>addListener(name, func, scope)</code>
*       where name is a valid event name, func is the function that is to be called when the event occurs.
*       The last argument is optional and can be used to specify the scope that will be used as context for executing the function.
*   </p>
*   <p>
*       To register multiple listeners, pass an array of listener objects:
*       <code>addListener([listener1, ..., listenerN])</code>
*   </p>
*   <p>
*       Alternatively, pass multiple listener objects as separate arguments:
*       <code>addListener(listener1, ..., listenerN)</code>
*   </p>
*   <p>
*       Or, pass a single object literal with event names as keys and listener objects or functions as values:
*       <pre>addListener({
*           discover: function() {
*               ...handle discover event...
*           },
*           error: {
*               handler: function() {
*                  ...handle error event...
*               },
*               scope: obj
*           },
*           scope: defaultscope
*       })</pre>
*       In this case, you can use scope as a key to specify the default scope for the handler functions.
*   </p>
*   <p>Below is a more detailed description of the listener object and its components:</p>
*   <dl>
*       <dt><code>events</code></dt>
*       <dd><code>string</code>|<code>string[]</code> REQUIRED.
*       The event or events to listen to.
*       You can specify a single event by using one of the <code>EVENT_XXX</code> string constant values.
*       You can specify multiple events by using an array of <code>EVENT_XXX</code> string constant values.
*       You can also use one of the predefined <code>EVENT_XXX</code> array constant values,
*       or use array concatenation and compose a custom list of event names.
*       To listen to all events, either use <code><a href="#property_EVENT_ALL">EVENT_ALL</a></code>,
*       or otherwise the <code>string</code> value <code>"all"</code>.
*       </dd>
*       <dt><code>event</code></dt>
*       <dd><code>string</code>|<code>string[]</code> Alias for <code>events</code></dd>
*       <dt><code>handler</code></dt>
*       <dd><code>function</code>|<code>function[]</code> REQUIRED.
*       This function will be called and notified whenever one of the specified events occurs.
*       The function has the following signature: <code>boolean handler(string eventName, object eventData, Xmla xmla)</code>
*       You can also pass in an array of functions if you want multiple functions to be called when the event occurs.
*       The function is called in scope of the <code>scope</code> property of the listener object.
*       If no <code>scope</code> is specified, a global function is assumed.
*       The <code>handler</code> function has the following arguments:
*           <dl>
*               <dt><code>eventName</code></dt>
*               <dd><code>string</code> The event for which notification is given.
*               This is useful to distinguish between events in case the same handler function is used for multiple events.
*               In this case, use the <code>EVENT_XXX</code> constants to check the <code>eventName</code>.</dd>
*               <dt><code>eventData</code></dt>
*               <dd><code>Object</code> An object that conveys event-specific data.</dd>
*               <dt><code>xmla</code></dt>
*               <dd><code><a href="class_Xmla">Xmla</a></code> A reference to this <code>Xmla</code> instance that is the source of the event.
*                   Listeners can obtain the response as well as the original SOAP message sent to the server through this instance.
*                   This allows one listener to be shared across multiple <code>Xmla</code> instances without managing the context manually.
*               </dd>
*           </dl>
*       For events that are <em>cancelable</em>, the handler should return a <code>boolean</code>.
*       If the handler returns <code>false</code> the respective operation will be canceled.
*       Otherwise, the operation continues (but may be canceled by another handler).
*       Currently, the following events are cancelable:
*       <code><a href="#property_EVENT_DISCOVER">EVENT_DISCOVER</a></code>,
*       <code><a href="#property_EVENT_EXECUTE">EVENT_EXECUTE</a></code>, and
*       <code><a href="#property_EVENT_REQUEST">EVENT_REQUEST</a></code>.
*       </dd>
*       <dt><code>handlers</code></dt>
*       <dd><code>function</code>|<code>function[]</code> Alias for <code>handler</code></dd>
*       <dt><code>scope</code></dt>
*       <dd><code>Object</code> OPTIONAL When specified, this object is used as the <code>this</code> object when calling the handler.
*           When not specified, the global <code>window</code> is used.
*       </dd>
*   </dl>
*   @method addListener
*   @param {Object|Array} listener An object that defines the events and the notification function to be called, or an array of such objects.
*/
    addListener: function(){
        var n = arguments.length;
        switch(n) {
            case 0:
                Xmla.Exception._newError(
                    "NO_EVENTS_SPECIFIED",
                    "Xmla.addListener",
                    null
                )._throw();
            case 1:
                var arg = arguments[0];
                if (_isObj(arg)) {
                    var events, handlers;
                    if (_isArr(arg)) this._addListeners(arg)
                    else
                    if (events = arg.events || arg.event) {
                        if (_isStr(events)) events = (events==="all") ? Xmla.EVENT_ALL : events.split(",");
                        if (!(_isArr(events))){
                            Xmla.Exception._newError(
                                "WRONG_EVENTS_FORMAT",
                                "Xmla.addListener",
                                arg
                            )._throw();
                        }
                        var i, n = events.length;
                        for (i = 0; i < n; i++) this._addListener(events[i], arg);
                    }
                    else {
                        var scope = arg.scope, handler;
                        if (_isUnd(scope)) scope = null;
                        else delete arg.scope;
                        for (events in arg) {
                            handler = arg[events];
                            if (_isUnd(handler.scope)) handler.scope = scope;
                            this._addListener(events, handler);
                        }
                    }
                }
                else
                    Xmla.Exception._newError(
                        "WRONG_EVENTS_FORMAT",
                        "Xmla.addListener",
                        arg
                    )._throw();
                break;
            case 2:
            case 3:
                var event = arguments[0], handler = arguments[1], scope = arguments[2];
                if (_isStr(event) && (_isFun(handler)||(_isObj(handler)))) this._addListener(event, handler, scope);
                else {
                    var arr = [event, handler];
                    if (scope) arr.push(scope);
                    this.addListener(arr);
                }
                break;
            default:
                this._addListeners(arguments);
        }
    },
    _addListeners: function(listeners) {
        var i, n = listeners.length;
        for (i = 0; i < n; i++) this.addListener(listeners[i]);
    },
    _addListener: function(name, handler, scope) {
        var myListeners = this.listeners[name];
        if (!myListeners)
            Xmla.Exception._newError(
                "UNKNOWN_EVENT",
                "Xmla.addListener",
                {event: name, handler: handler, scope: scope}
            )._throw();
        if (!scope) scope = null;
        switch (typeof(handler)) {
            case "function":
                myListeners.concat({handler: handler, scope: scope});
                break;
            case "object":
                var handlers = handler.handler || handler.handlers;
                if (_isFun(handlers.handler)) {
                    if (!handlers.scope) handlers.scope = scope;
                    myListeners.concat(handler);
                }
                else
                if (_isArr(handlers)) {
                    var i, n = handlers.length;
                    for (i = 0; i < n; i++) this._addListener(name, handlers[i]);
                }
                break;
        }
    },
    _fireEvent: function(eventName, eventData, cancelable){
        var listeners = this.listeners[eventName];
        if (!listeners) {
            Xmla.Exception._newError(
                "UNKNOWN_EVENT",
                "Xmla._fireEvent",
                eventName
            )._throw();
        }
        var n = listeners.length, outcome = true;
        if (n) {
            var listener, listenerResult, i;
            for (i = 0; i < n; i++){
                listener = listeners[i];
                listenerResult = listener.handler.call(
                    listener.scope,
                    eventName,
                    eventData,
                    this
                );
                if (cancelable && listenerResult===false){
                    outcome = false;
                    break;
                }
            }
        }
        else //if there is neither a listener nor an error nor a general callback  we explicitly throw the exception.
        if (eventName === Xmla.EVENT_ERROR && !_isFun(eventData.error) && !_isFun(eventData.callback)) eventData.exception._throw();
        return outcome;
    },
/**
*   Sends a request to the XML/A server.
*   This method is rather low-level and allows full control over the request
*   by passing an options object. General properties of the options object are:
*   <ul>
*       <li><code>method</code> {string} REQUIRED the XML/A method to invoke. This should be one of the following constants:
*           <dl>
*               <dt><code><a href="#property_METHOD_DISCOVER">METHOD_DISCOVER</a></code></dt>
*               <dd>
*                   <p>
*                   This method is used to obtain metadata from the XML/A service or XML/A provider.
*                   Metadata is returned in a tabular format called Schema Rowsets, which are represented by an instance of the
*                   <code><a href="Xmla.Rowset.html#class_Xmla.Rowset">Xmla.Rowset</a></code> class.
*                   For these types of requests, you must pass the <code>requestType</code> option to specify which schema rowset you want to obtain.
*                   In addition, you can specify a <code>restrictions</code> object that is used as filter criteria to restrict which rows will be returned in the rowset.
*                   </p>
*                   <p>
*                   Instead of explicitly passing <code>METHOD_DISCOVER</code> as the <code>requestType</code>, you can also call the
*                   <code><a href="#method_discover">discover()</a></code> method (which requires you to explictly pass a <code>requestType</code> option).
*                   Finally, you can also call one of the <code>discoverXXX()</code> methods in order to request a particular schema rowset.
*                   </p>
*               </dd>
*               <dt><code><a href="#property_METHOD_EXECUTE">METHOD_EXECUTE</a></code></dt>
*               <dd>
*                   <p>
*                   This method is used to send an MDX quey to the XML/A provider.
*                   Query results are returned in a multidimentsional format which is represented by an instance of the
*                   <code><a href="Xmla.Resultset.html#class_Xmla.Resultset">Xmla.Resultset</a></code> class.
*                   For these types of requests, you must pass the <code>statement</code> option to specify the MDX query.
*                   </p>
*                   <p>
*                   Instead of explicitly passing <code>METHOD_EXECUTE</code> as the <code>requestType</code>, you can also call the
*                   <code><a href="#method_execute">execute()</a></code> method.
*                   </p>
*               </dd>
*           </dl>
*       </li>
*       <li><code>url</code> {string} REQUIRED the URL of XML/A service, or of a XML/A datasource.
*           Typically, you first use the URL of a XML/A service (like <code>http://your.pentaho.server:8080/pentaho/Xmla?userid=joe&amp;password=password</code>)
*           and use that to retrieve the <code>DISCOVER_DATASOURCES</code> rowset.
*           Then, you can connect to a XML/A datasource using the value returned by the <code>URL</code> column of the <code>DISCOVER_DATASOURCES</code> rowset
*           (typically, you also have to set a <code>DataSourceInfo</code> property using the value found in the <code>DataSourceInfo</code> column of the <code>DISCOVER_DATASOURCES</code> rowset).
*       </li>
*       <li>
*           <code>properties</code> {Object} XML/A properties.
*           The appropriate types and values of XML/A properties are dependent upon the specific method and requestType.
*           The XML/A standard defines a set of pre-defined properties.
*           The <code>Xmla</code> class defines a static final property for each of these (see the <code>PROP_XXX</code> constants).
*           The list of all valid properties can be obtained from the <code>DISCOVER_PROPERTIES</code> schema rowset
*           (see <code><a href="#method_discoverProperties()">discoverProperties()</a></code>).
*           Each javascript property of the <code>properties</code> object is mapped literally to a XML/A property.
*       </li>
*       <li><code>async</code> {boolean}
*           Determines how the request is performed:<ul>
*               <li><code>true</code>: The request is performed asynchronously: the call to <code>request()</code> will not block and return immediately.
*               In this case, the return value of the <code>request()</code> method is not defined,
*               and the response must be received by registering a listener.
*               (see <code><a href="#method_addListener">addListener()</a></code>).
*
*               As an alternative to using listeners, you can also pass
*               <code>success</code>, <code>error</code> and <code>callback</code> callback functions.
*               Callbacks are described in more detail below.
*               </li>
*               <li><code>false</code>: The request is performed synchronously: the call to <code>request()</code> will block until it receives a response from the XML/A server or times out.
*               In this case, the <code>request()</code> method returns
*               a <code>Rowset</code> (for <code>Discover</code> requests) or
*               a <code>Resultset</code> (for <code>Execute</code> requests).
*               If you registered any listeners (see <code><a href="#method_addListener">addListener()</a></code>),
*               then these will still be notified of any events (such as receiving the response).
*               </li>
*           </ul>
*       </li>
*       <li><code>success</code> (function)
*           A function that is to be called after the requests is executed and a successful response is receieved.
*           Any listeners appropriate for the request are called after this handler is executed.
*       </li>
*       <li><code>error</code> (function)
*           A function that is to be called after the requests is executed and an error was encountered.
*           Any listeners appropriate for the request are called after this handler is executed.
*       </li>
*       <li><code>callback</code> (function)
*           A function that is to be called after the requests is executed and the response is receieved,
*           and after calling any listeners that are appropriate for the request.
*           This function will be called both in case of success and of error.
*           If the options also contain a <code>success</code> and/or <code>error</code> handler, then
*           <code>callback</code> will be called after those more specific handlers are called.
*       </li>
*   </ul>
*   Other parts of the <code>options</code> object are method-specific.
*   <ul>
*       <li>The following options are applicable in case the <code>method</code> is <code>METHOD_DISCOVER</code>:
*           <ul>
*               <li><code>requestType</code> - {string} Applies to the Discover method and indicates the kind of schema rowset to retrieve.
*                   You can use one of the <code>DISCOVER_XXX</code>, <code>DBSCHEMA_XXX</code> or <code>MDSCHEMA_XXX</code> constants for this property.
*                   You can also dymically discover which values for <code>requestType</code> are supported by the XML/A provider using the
*                   <code>DISCOVER_SCHEMA_ROWSETS</code> rowset (see: <code><a href="method_discoverMDSchemaRowsets">discoverMDSchemaRowsets()</a></code>).
*                   See the <code><a href="#method_discover">discover()</a></code> method for more information.
*               </li>
*               <li>
*                   <code>restrictions</code> {Object} XML/A restrictions are used to filter the requested schema rowset.
*                   For more information on restrictions, see the <code><a href="#method_discover">discover()</a></code> method.
*               </li>
*           </ul>
*       </li>
*       <li>The following options are applicable in case the <code>method</code> is <code>METHOD_EXECUTE</code>:
*           <ul>
*               <li><code>statement</code> - {string} Applies to the Execute method and specifies the MDX query to send to the server.
*               </li>
*           </ul>
*       </li>
*   </ul>
*   Instead of calling this method directly, consider calling
*   <code><a href="#method_discover">discover()</a></code> (to obtain a schema rowset),
*   <code><a href="#method_execute">execute()</a></code> (to issue a MDX query),
*   or one of the specialized <code>discoverXXX()</code> methods (to obtain a particular schema rowset).
*   @method request
*   @param {Object} options An object whose properties convey the options for the request.
*   @return {Xmla.Rowset|Xmla.Resultset} The result of the invoking the XML/A method. For an asynchronous request, the return value is not defined. For synchronous requests, <code>Discover</code> requests return an instance of a <code>Xmla.Rowset</code>, and <code>Execute</code> results return an instance of a <code>Xmla.Resultset</code>.
*/
    request: function(options){
        var ex, xmla = this;

        this.response = null;
        this.responseText = null;
        this.responseXML = null;

        if (!options.url){
            if (this.options.url){
                options.url = this.options.url;
            }
            else {
                ex = Xmla.Exception._newError(
                    "MISSING_URL",
                    "Xmla.request",
                    options
                );
                ex._throw();
            }
        }

        options.properties = _applyProps(options.properties, this.options.properties, false);
        options.restrictions = _applyProps(options.restrictions, this.options.restrictions, false);
        if (_isUnd(options.async) && !_isUnd(this.options.async)){
            options.async = this.options.async;
        }
        if (_isUnd(options.requestTimeout) && !_isUnd(this.options.requestTimeout)) {
            options.requestTimeout = this.options.requestTimeout;
        }
        if (!options.username && this.options.username){
            options.username = this.options.username;
        }
        if (!options.password && this.options.password){
            options.password = this.options.password;
        }
        if (!options.headers && this.options.headers){
            options.headers = this.options.headers;
        }

        var soapMessage = _getXmlaSoapMessage(options);
        this.soapMessage = soapMessage;
        var myXhr;
        var ajaxOptions = {
            async: options.async,
            timeout: options.requestTimeout,
            data: soapMessage,
            error:      function(exception){
                            options.exception = exception;
                            xmla._requestError(options);
                        },
            complete:   function(xhr){
                            options.xhr = xhr;
                            xmla._requestSuccess(options);
                        },
            url: options.url
        };
        if (options.username){
            ajaxOptions.username = options.username;
        }
        if (options.password){
            ajaxOptions.password = options.password;
        }
        if (options.headers) {
            ajaxOptions.headers = options.headers;
        }

        if  (this._fireEvent(Xmla.EVENT_REQUEST, options, true) &&
                (
                    (options.method == Xmla.METHOD_DISCOVER && this._fireEvent(Xmla.EVENT_DISCOVER, options)) ||
                    (options.method == Xmla.METHOD_EXECUTE  && this._fireEvent(Xmla.EVENT_EXECUTE, options))
                )
        ) {
            myXhr = _ajax(ajaxOptions);
        }
        return this.response;
    },
    _requestError: function(options) {
        if (options.error) {
            options.error.call(
                options.scope ? options.scope : null,
                this,
                options,
                null
            );
        }
        if (options.callback) {
            options.callback.call(
                options.scope ? options.scope : null,
                Xmla.EVENT_ERROR,
                this,
                options,
                null
            );
        }
        this._fireEvent(Xmla.EVENT_ERROR, options);
    },
    _requestSuccess: function(request) {
        var xhr = request.xhr, response;
        this.responseXML = xhr.responseXML;
        this.responseText = xhr.responseText;

        var method = request.method;

        var soapFault = _getElementsByTagNameNS(this.responseXML, _xmlnsSOAPenvelope, _xmlnsSOAPenvelopePrefix, "Fault");
        if (soapFault.length) {
            //TODO: extract error info
            soapFault = soapFault.item(0);
            request.exception = new Xmla.Exception(
                Xmla.Exception.TYPE_ERROR,
                soapFault.getElementsByTagName("faultcode").item(0).childNodes.item(0).data,
                soapFault.getElementsByTagName("faultstring").item(0).childNodes.item(0).data,
                null,
                "_requestSuccess",
                request
            );
            switch(method){
                case Xmla.METHOD_DISCOVER:
                    this._fireEvent(Xmla.EVENT_DISCOVER_ERROR, request);
                    break;
                case Xmla.METHOD_EXECUTE:
                    this._fireEvent(Xmla.EVENT_EXECUTE_ERROR, request);
                    break;
            }
            if (request.error) {
                request.error.call(
                    request.scope ? request.scope : null,
                    this,
                    request,
                    request.exception
                );
            }
            if (request.callback) {
                request.callback.call(
                    request.scope ? request.scope : null,
                    Xmla.EVENT_ERROR,
                    this,
                    request,
                    request.exception
                );
            }
            this._fireEvent(Xmla.EVENT_ERROR, request);
        }
        else {
            switch(method){
                case Xmla.METHOD_DISCOVER:
                    request.rowset = this.response = response = new Xmla.Rowset(this.responseXML, request.requestType, this);
                    this._fireEvent(Xmla.EVENT_DISCOVER_SUCCESS, request);
                    break;
                case Xmla.METHOD_EXECUTE:
                    var resultset = null, dataset = null;
                    var format = request.properties[Xmla.PROP_FORMAT];
                    switch(format){
                        case Xmla.PROP_FORMAT_TABULAR:
                            response = resultset = new Xmla.Rowset(this.responseXML, null, this);
                            break;
                        case Xmla.PROP_FORMAT_MULTIDIMENSIONAL:
                            response = dataset = new Xmla.Dataset(this.responseXML);
                            break;
                    }
                    request.resultset = resultset;
                    request.dataset = dataset;
                    this.response = response;
                    this._fireEvent(Xmla.EVENT_EXECUTE_SUCCESS, request);
                    break;
            }
            if (request.success) {
                request.success.call(
                    request.scope ? request.scope : null,
                    this,
                    request,
                    response
                );
            }
            if (request.callback) {
                request.callback.call(
                    request.scope ? request.scope : null,
                    Xmla.EVENT_SUCCESS,
                    this,
                    request,
                    response
                );
            }
            this._fireEvent(Xmla.EVENT_SUCCESS, request);
        }
    },
/**
*   Sends an MDX query to a XML/A DataSource to invoke the XML/A <code>Execute</code> method and obtain the multi-dimensional resultset.
*   Options are passed using a generic <code>options</code> object.
*   Applicable properties of the <code>options</code> object are:
*   <ul>
*       <li><code>url</code> {string} REQUIRED the URL of a XML/A datasource.
*           This should be a value obtained from the <code>URL</code> column of the <code>DISCOVER_DATASOURCES</code> rowset
*           (see: <code><a href="method_discoverDataSources">discoverDataSources()</a></code>).
*       </li>
*       <li><code>statement</code> - {string} The MDX query to send to the server.
*       </li>
*       <li>
*           <code>properties</code> {Object} XML/A properties.
*           The list of all valid properties can be obtained from the <code>DISCOVER_PROPERTIES</code> schema rowset
*           (see <code><a href="#method_discoverProperties()">discoverProperties()</a></code>).
*           Typically, <code>execute()</code> requires these properties:<dl>
*               <dt><code>DataSourceInfo</code> property</dt>
*               <dd>Identifies a data source managed by the XML/A server.
*                   To specify this property, you can use the static final constant
*                   <code><a href="#property_PROP_DATASOURCEINFO">PROP_DATASOURCEINFO</a></code>
*                   as key in the <code>properties</code> object of the <code>options</code> object passed to the <code>execute()</code> method.
*                   Valid values for this property should be obtained from the <code>DataSourceInfo</code> column
*                   of the <code>DISCOVER_DATASOURCES</code> schema rowset (see: <code><a href="#method_discoverDataSources">discoverDataSources()</a></code>).
*                   Note that the values for the <code>DataSourceInfo</code> property and the <code>url</code> must both be taken from the same row of the <code>DISCOVER_DATASOURCES</code> schema rowset.
*               </dd>
*               <dt><code>Catalog</code> property</dt>
*               <dd>Identifies a catalog applicable for the datasource.
*                   To specify this property, you can use the static final constant
*                   <code><a href="#property_PROP_CATALOG">PROP_CATALOG</a></code>
*                   as key in the <code>properties</code> object of the <code>options</code> object passed to the <code>execute()</code> method.
*                   Valid values for this property should be obtained from the <code>CATALOG_NAME</code> column
*                   of the <code>DBSCHEMA_CATALOGS</code> schema rowset (see: <code><a href="#method_discoverDBCatalogs">discoverDBCatalogs()</a></code>).
*               </dd>
*           </dl>
*       </li>
*       <li><code>async</code> {boolean}
*           Determines how the request is performed:<ul>
*               <li><code>true</code>: The request is performed asynchronously: the call to <code>request()</code> will not block and return immediately.
*               In this case, the return value of the <code>request()</code> method is not defined,
*               and the response must be received by registering a listener
*               (see <code><a href="#method_addListener">addListener()</a></code>).
*               </li>
*               <li><code>false</code>: The request is performed synchronously: the call to <code>execute()</code> will block until it receives a response from the XML/A server or times out.
*               In this case, a <code>Resultset</code> is returned that represents the multi-dimensional data set.
*               If you registered any <code>REQUEST_XXX</code> and/or <code>EXECUTE_XXX</code> listeners (see <code><a href="#method_addListener">addListener()</a></code>),
*               then these will still be notified.
*               </li>
*           </ul>
*       </li>
*   </ul>
*   @method execute
*   @param {Object} options An object whose properties convey the options for the XML/A <code>Execute</code> request.
*   @return {Xmla.Resultset|Xmla.Rowset} The result of the invoking the XML/A <code>Execute</code> method. For an asynchronous request, the return value is not defined. For synchronous requests, an instance of a <code>Xmla.Resultset</code> that represents the multi-dimensional result set of the MDX query. If the <code>Format</code> property in the request was set to <code>Tabular</code>, then an instance of the
<code><a href="Xmla.Rowset#class_Xmla.Rowset">Rowset</a></code> class is returned to represent the <code>Resultset</code>.
*/
    execute: function(options) {
        var properties = options.properties;
        if (!properties){
            properties = {};
            options.properties = properties;
        }
        _applyProps(properties, this.options.properties, false)
        if (!properties[Xmla.PROP_CONTENT]){
            properties[Xmla.PROP_CONTENT] = Xmla.PROP_CONTENT_SCHEMADATA;
        }
        if (!properties[Xmla.PROP_FORMAT]){
            options.properties[Xmla.PROP_FORMAT] = Xmla.PROP_FORMAT_MULTIDIMENSIONAL;
        }
        var request = _applyProps(
            options,
            {
                method: Xmla.METHOD_EXECUTE
            },
            true
        );
        return this.request(request);
    },
/**
*   Sends an MDX query to a XML/A DataSource to invoke the <code><a href="#method_execute">execute()</a></code> method using <code><a href="#property_PROP_FORMAT_TABULAR">PROP_FORMAT_TABULAR</a></code> as value for the <code><a href="#property_PROP_FORMAT_TABULAR">PROP_FORMAT</a></code> property. This has the effect of obtaining the multi-dimensional resultset as a <code><a href="Xmla.Rowset#class_Xmla.Rowset">Rowset</a></code>.
*   @method executeTabular
*   @param {Object} options An object whose properties convey the options for the XML/A <code>Execute</code> request.
*   @return {Xmla.Rowset} The result of the invoking the XML/A <code>Execute</code> method. For an asynchronous request, the return value is not defined. For synchronous requests, an instance of a <code>Xmla.Rowset</code> that represents the multi-dimensional result set of the MDX query.
*/
    executeTabular: function(options){
        if (!options.properties){
            options.properties = {};
        }
        options.properties[Xmla.PROP_FORMAT] = Xmla.PROP_FORMAT_TABULAR;
        return this.execute(options);
    },
/**
*   Sends an MDX query to a XML/A DataSource to invoke the <code><a href="#method_execute</a></code> method using <code><a href="#property_PROP_FORMAT_MULTIDIMENSIONAL">PROP_FORMAT_MULTIDIMENSIONAL</a></code> as value for the <code><a href="#property_PROP_FORMAT_TABULAR">PROP_FORMAT</a></code> property. In this case, the result is available only as XML text or XML document in the <code><a href="#property_responseText">responseText</a></code>
and  <code><a href="#property_responseXML">responseXML</a></code> properties.
*   @method executeMultiDimensional
*   @param {Object} options An object whose properties convey the options for the XML/A <code>Execute</code> request.
*/
    executeMultiDimensional: function(options){
        if (!options.properties){
            options.properties = {};
        }
        options.properties[Xmla.PROP_FORMAT] = Xmla.PROP_FORMAT_MULTIDIMENSIONAL;
        return this.execute(options);
    },
/**
*   Sends a request to invoke the XML/A <code>Discover</code> method and returns a schema rowset specified by the <code>requestType</code> option.
*   Options are passed using a generic <code>options</code> object.
*   Applicable properties of the <code>options</code> object are:
*   <ul>
*       <li><code>requestType</code> - {string} Indicates the kind of schema rowset to retrieve.
*           You can use one of the following predefined XML for Analysis Schema Rowset constants:
*           <ul>
*               <li><code><a href="#property_DISCOVER_DATASOURCES">DISCOVER_DATASOURCES</a></code></li>
*               <li><code><a href="#property_DISCOVER_ENUMERATORS">DISCOVER_ENUMERATORS</a></code></li>
*               <li><code><a href="#property_DISCOVER_KEYWORDS">DISCOVER_KEYWORDS</a></code></li>
*               <li><code><a href="#property_DISCOVER_LITERALS">DISCOVER_LITERALS</a></code></li>
*               <li><code><a href="#property_DISCOVER_PROPERTIES">DISCOVER_PROPERTIES</a></code></li>
*               <li><code><a href="#property_DISCOVER_SCHEMA_ROWSETS">DISCOVER_SCHEMA_ROWSETS</a></code></li>
*           </ul>
*           Or one of the applicable OLE DB Schema Rowset constants:
*           <ul>
*               <li><code><a href="#property_DBSCHEMA_CATALOGS">DBSCHEMA_CATALOGS</a></code></li>
*               <li><code><a href="#property_DBSCHEMA_COLUMNS">DBSCHEMA_COLUMNS</a></code></li>
*               <li><code><a href="#property_DBSCHEMA_PROVIDER_TYPES">DBSCHEMA_PROVIDER_TYPES</a></code></li>
*               <li><code><a href="#property_DBSCHEMA_SCHEMATA">DBSCHEMA_SCHEMATA</a></code></li>
*               <li><code><a href="#property_DBSCHEMA_TABLES">DBSCHEMA_TABLES</a></code></li>
*               <li><code><a href="#property_DBSCHEMA_TABLES_INFO">DBSCHEMA_TABLES_INFO</a></code></li>
*           </ul>
*           Or one of the applicable OLE DB for OLAP Schema Rowset constants:
*           <ul>
*               <li><code><a href="#property_MDSCHEMA_ACTIONS">MDSCHEMA_ACTIONS</a></code></li>
*               <li><code><a href="#property_MDSCHEMA_CUBES">MDSCHEMA_CUBES</a></code></li>
*               <li><code><a href="#property_MDSCHEMA_DIMENSIONS">MDSCHEMA_DIMENSIONS</a></code></li>
*               <li><code><a href="#property_MDSCHEMA_FUNCTIONS">MDSCHEMA_FUNCTIONS</a></code></li>
*               <li><code><a href="#property_MDSCHEMA_HIERARCHIES">MDSCHEMA_HIERARCHIES</a></code></li>
*               <li><code><a href="#property_MDSCHEMA_MEASURES">MDSCHEMA_MEASURES</a></code></li>
*               <li><code><a href="#property_MDSCHEMA_MEMBERS">MDSCHEMA_MEMBERS</a></code></li>
*               <li><code><a href="#property_MDSCHEMA_PROPERTIES">MDSCHEMA_PROPERTIES</a></code></li>
*               <li><code><a href="#property_MDSCHEMA_SETS">MDSCHEMA_SETS</a></code></li>
*           </ul>
*           You can also dymically discover which values for <code>requestType</code> are supported by the XML/A provider.
*           To do that, refer to the <code>SchemaName</code> column of the <code>DISCOVER_SCHEMA_ROWSETS</code> rowset
*           (see: <code><a href="method_discoverMDSchemaRowsets">discoverMDSchemaRowsets()</a></code>).
*       </li>
*       <li><code>url</code> {string} REQUIRED the url of the XML/A service or XML/A datasource.
*           If the value for the <code>requestType</code> option is one of the predefined XML/A <code><a href="">DISCOVER_XXX</a></code> constants,
*           then this should be the url of the XML/A service.
*       </li>
*       <li>
*           <code>properties</code> {Object} XML/A properties.
*           The appropriate types and values of XML/A properties are dependent upon the value passed as <code>requestType</code>.
*           The XML/A standard defines a set of pre-defined properties.
*           The <code>Xmla</code> class defines a static final property for each of these (see the <code>PROP_XXX</code> constants).
*           The list of all valid properties can be obtained from the <code>DISCOVER_PROPERTIES</code> schema rowset
*           (see <code><a href="#method_discoverProperties()">discoverProperties()</a></code>).
*           Each javascript property of the <code>properties</code> object is mapped literally to a XML/A property.
*       </li>
*       <li>
*           <code>restrictions</code> {Object} XML/A restrictions.
*           These are used to specify a filter that will be applied to the data in the schema rowset.
*           Each javascript property of the <code>restrictions</code> object is mapped to a column of the requested schema rowset.
*           The value for the restriction is sent with the request, and processed by the XML/A server to only return matching rows from the requested schema dataset.
*           The name, types and values of the restrictions are dependent upon which schema rowset is requested.
*           The available restrictions are specified by the <code>Restrictions</code> column of the <code>DISCOVER_SCHEMA_ROWSETS</code> schema rowset.
*           For a number of schema rowsets, the available restrictions are pre-defined.
*           These are documented together with each particular <code>discoverXXX()</code> method.
*       </li>
*       <li><code>async</code> {boolean}
*           Determines how the request is performed:<ul>
*               <li><code>true</code>: The request is performed asynchronously: the call to <code>request()</code> will not block and return immediately.
*               In this case, the return value of the <code>request()</code> method is not defined,
*               and the response must be received by registering a listener
*               (see <code><a href="#method_addListener">addListener()</a></code>).
*               </li>
*               <li><code>false</code>: The request is performed synchronously: the call to <code>execute()</code> will block until it receives a response from the XML/A server or times out.
*               In this case, a <code>Resultset</code> is returned that represents the multi-dimensional data set.
*               If you registered any <code>REQUEST_XXX</code> and/or <code>EXECUTE_XXX</code> listeners (see <code><a href="#method_addListener">addListener()</a></code>),
*               then these will still be notified.
*               </li>
*           </ul>
*       </li>
*   </ul>
*   Instead of calling this method directly, consider calling
*   or one of the specialized <code>discoverXXX()</code> methods to obtain a particular schema rowset.
*   @method discover
*   @param {Object} options An object whose properties convey the options for the XML/A <code>Discover</code> request.
*   @return {Xmla.Rowset} The result of the invoking the XML/A <code>Discover</code> method. For synchronous requests, an instance of a <code><a href="Xmla.Rowset.html#Xmla.Rowset">Xmla.Rowset</a></code> that represents the requested schema rowset. For an asynchronous request, the return value is not defined: you should add a listener (see: <code><a href="#method_addListener">addListener()</a></code>) and listen for the <code>success</code> (see: <code><a href="#property_EVENT_SUCCESS">EVENT_SUCCESS</a></code>) or <code>discoversuccess</code> (see: <code><a href="#property_EVENT_DISCOVER_SUCCESS">EVENT_DISCOVER_SUCCESS</a></code>) events.
*/
    discover: function(options) {
        var request = _applyProps(
            options,
            {
                method: Xmla.METHOD_DISCOVER
            },
            true
        );
        if (!request.requestType){
            request.requestType = this.options.requestType;
        }
        return this.request(request);
    },
/**
*   Invokes the <code><a href="#method_discover">discover()</a></code> method using <code><a href="#property_DISCOVER_DATASOURCES"></a></code> as value for the <code>requestType</code>,
*   and retrieves the <code>DISCOVER_DATASOURCES</code> schema rowset.
*   The rowset has the following columns:
*   <table border="1" class="schema-rowset">
*       <tr>
*           <th>Column Name</th>
*           <th>Type</th>
*           <th>Description</th>
*           <th>Restriction</th>
*           <th>Nullable</th>
*       </tr>
*       <tr>
*           <td>
*               DataSourceName
*           </td>
*           <td>
*               string
*           </td>
*           <td>
*               A name that identifies this data source.
*           </td>
*           <td>
*               Yes
*           </td>
*           <td>
*               No
*           </td>
*       </tr>
*       <tr>
*           <td>
*               DataSourceDescription
*           </td>
*           <td>
*               string
*           </td>
*           <td>
*               Human readable description of the datasource
*           </td>
*           <td>
*               No
*           </td>
*           <td>
*               Yes
*           </td>
*       </tr>
*       <tr>
*           <td>
*               URL
*           </td>
*           <td>
*               string
*           </td>
*           <td>
*               URL to use to submit requests to this provider.
*           </td>
*           <td>
*               Yes
*           </td>
*           <td>
*               Yes
*           </td>
*       </tr>
*       <tr>
*           <td>
*               DataSourceInfo
*           </td>
*           <td>
*               string
*           </td>
*           <td>
*               Connectstring
*           </td>
*           <td>
*               No
*           </td>
*           <td>
*               Yes
*           </td>
*       </tr>
*       <tr>
*           <td>
*               ProviderName
*           </td>
*           <td>
*               string
*           </td>
*           <td>
*               A name indicating the product providing the XML/A implementation
*           </td>
*           <td>
*               Yes
*           </td>
*           <td>
*               Yes
*           </td>
*       </tr>
*       <tr>
*           <td>
*               ProviderType
*           </td>
*           <td>
*               string[]
*           </td>
*           <td>
*               The kind of data sets supported by this provider.
*               The following values are defined by the XML/A specification:
*               <dl>
*                   <dt>TDP</dt><dd>tabular data provider.</dd>
*                   <dt>MDP</dt><dd>multidimensiona data provider.</dd>
*                   <dt>DMP</dt><dd>data mining provider.</dd>
*               </dl>
*               Note: multiple values are possible.
*           </td>
*           <td>
*               Yes
*           </td>
*           <td>
*               No
*           </td>
*       </tr>
*       <tr>
*           <td>
*               AuthenticationMode
*           </td>
*           <td>
*               string
*           </td>
*           <td>
*               Type of security offered by the provider
*               The following values are defined by the XML/A specification:
*               <dl>
*                   <dt>Unauthenticated</dt><dd>no user ID or password needs to be sent.</dd>
*                   <dt>Authenticated</dt><dd>User ID and password must be included in the information required for the connection.</dd>
*                   <dt>Integrated</dt><dd> the data source uses the underlying security to determine authorization</dd>
*               </dl>
*           </td>
*           <td>
*               Yes
*           </td>
*           <td>
*               No
*           </td>
*       </tr>
*   </table>
*
*   @method discoverDataSources
*   @param {Object} options An object whose properties convey the options for the XML/A a <code>DISCOVER_DATASOURCES</code> request.
*   @return {Xmla.Rowset} The result of the invoking the XML/A <code>Discover</code> method. For synchronous requests, an instance of a <code><a href="Xmla.Rowset.html#Xmla.Rowset">Xmla.Rowset</a></code> that represents the <code>DISCOVER_DATASOURCES</code> schema rowset. For an asynchronous request, the return value is not defined: you should add a listener (see: <code><a href="#method_addListener">addListener()</a></code>) and listen for the <code>success</code> (see: <code><a href="#property_EVENT_SUCCESS">EVENT_SUCCESS</a></code>) or <code>discoversuccess</code> (see: <code><a href="#property_EVENT_DISCOVER_SUCCESS">EVENT_DISCOVER_SUCCESS</a></code>) events.
*/
    discoverDataSources: function(options){
        var request = _applyProps(
            options,
            {
                requestType: Xmla.DISCOVER_DATASOURCES
            },
            true
        );
        return this.discover(request);
    },
/**
*   Invokes the <code><a href="#method_discover">discover()</a></code> method using <code><a href="#property_DISCOVER_PROPERTIES"></a></code> as value for the <code>requestType</code>,
*   and retrieves the <code>DISCOVER_PROPERTIES</code> schema rowset.
*   This rowset provides information on the properties that are supported by the XML/A provider.
*   The rowset has the following columns:
*   <table border="1" class="schema-rowset">
*       <tr>
*           <th>Column Name</th>
*           <th>Type</th>
*           <th>Description</th>
*           <th>Restriction</th>
*           <th>Nullable</th>
*       </tr>
*       <tr>
*           <td>
*               PropertyName
*           </td>
*           <td>
*               string
*           </td>
*           <td>
*               The name of the property
*           </td>
*           <td>
*               Yes (array)
*           </td>
*           <td>
*               No
*           </td>
*       </tr>
*       <tr>
*           <td>
*               PropertyDescription
*           </td>
*           <td>
*               string
*           </td>
*           <td>
*               Human readable description of the property
*           </td>
*           <td>
*               No
*           </td>
*           <td>
*               Yes
*           </td>
*       </tr>
*       <tr>
*           <td>
*               PropertyType
*           </td>
*           <td>
*               string
*           </td>
*           <td>
*               The property's datatype (as an XML Schema data type)
*           </td>
*           <td>
*               No
*           </td>
*           <td>
*               Yes
*           </td>
*       </tr>
*       <tr>
*           <td>
*               PropertyAccessType
*           </td>
*           <td>
*               string
*           </td>
*           <td>
*               How the property may be accessed. Values defined by the XML/A spec are:
*               <ul>
*                   <li>Read</li>
*                   <li>Write</li>
*                   <li>ReadWrite</li>
*               </ul>
*           </td>
*           <td>
*               No
*           </td>
*           <td>
*               No
*           </td>
*       </tr>
*       <tr>
*           <td>
*               IsRequired
*           </td>
*           <td>
*               boolean
*           </td>
*           <td>
*               <code>true</code> if the property is required, <code>false</code> if not.
*           </td>
*           <td>
*               No
*           </td>
*           <td>
*               Yes
*           </td>
*       </tr>
*       <tr>
*           <td>
*               Value
*           </td>
*           <td>
*               string
*           </td>
*           <td>
*               The property's current value.
*           </td>
*           <td>
*               No
*           </td>
*           <td>
*               Yes
*           </td>
*       </tr>
*   </table>
*
*   @method discoverProperties
*   @param {Object} options An object whose properties convey the options for the XML/A a <code>DISCOVER_DATASOURCES</code> request.
*   @return {Xmla.Rowset} The result of the invoking the XML/A <code>Discover</code> method. For synchronous requests, an instance of a <code><a href="Xmla.Rowset.html#Xmla.Rowset">Xmla.Rowset</a></code> that represents the <code>DISCOVER_DATASOURCES</code> schema rowset. For an asynchronous request, the return value is not defined: you should add a listener (see: <code><a href="#method_addListener">addListener()</a></code>) and listen for the <code>success</code> (see: <code><a href="#property_EVENT_SUCCESS">EVENT_SUCCESS</a></code>) or <code>discoversuccess</code> (see: <code><a href="#property_EVENT_DISCOVER_SUCCESS">EVENT_DISCOVER_SUCCESS</a></code>) events.
*/
    discoverProperties: function(options){
        var request = _applyProps(
            options,
            {
                requestType: Xmla.DISCOVER_PROPERTIES
            },
            true
        );
        return this.discover(request);
    },
/**
*   Invokes the <code><a href="#method_discover">discover()</a></code> method using <code><a href="#property_DISCOVER_SCHEMA_ROWSETS"></a></code> as value for the <code>requestType</code>,
*   and retrieves the <code>DISCOVER_SCHEMA_ROWSETS</code> schema rowset.
*   This rowset lists all possible request types supported by this provider.
*   The rowset has the following columns:
*   <table border="1" class="schema-rowset">
*       <tr>
*           <th>Column Name</th>
*           <th>Type</th>
*           <th>Description</th>
*           <th>Restriction</th>
*           <th>Nullable</th>
*       </tr>
*       <tr>
*           <td>SchemaName</td>
*           <td>string</td>
*           <td>The requestType. </td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>Restrictions</td>
*           <td>array</td>
*           <td>A list of columns that may be used to filter the schema rowset.</td>
*           <td>No</td>
*           <td>Yes</td>
*       </tr>
*       <tr>
*           <td>Description</td>
*           <td>string</td>
*           <td>A human readable description of the schema rowset that is returned when using this requestType</td>
*           <td>No</td>
*           <td>Yes</td>
*       </tr>
*   </table>
*
*   @method discoverSchemaRowsets
*   @param {Object} options An object whose properties convey the options for the XML/A a <code>DISCOVER_SCHEMA_ROWSETS</code> request.
*   @return {Xmla.Rowset} The result of the invoking the XML/A <code>Discover</code> method. For synchronous requests, an instance of a <code><a href="Xmla.Rowset.html#Xmla.Rowset">Xmla.Rowset</a></code> that represents the <code>DISCOVER_DATASOURCES</code> schema rowset. For an asynchronous request, the return value is not defined: you should add a listener (see: <code><a href="#method_addListener">addListener()</a></code>) and listen for the <code>success</code> (see: <code><a href="#property_EVENT_SUCCESS">EVENT_SUCCESS</a></code>) or <code>discoversuccess</code> (see: <code><a href="#property_EVENT_DISCOVER_SUCCESS">EVENT_DISCOVER_SUCCESS</a></code>) events.
*/
    discoverSchemaRowsets: function(options){
        var request = _applyProps(
           options,
            {
                requestType: Xmla.DISCOVER_SCHEMA_ROWSETS
            },
            true
        );
        return this.discover(request);
    },
/**
*   Invokes the <code><a href="#method_discover">discover()</a></code> method using <code><a href="#property_DISCOVER_ENUMERATORS"></a></code> as value for the <code>requestType</code>,
*   and retrieves the <code>DISCOVER_ENUMERATORS</code> schema rowset.
*   This rowset lists the names, data types, and enumeration values of enumerators supported by the XMLA Provider for a specific data source.
*   The rowset has the following columns:
*   <table border="1" class="schema-rowset">
*       <tr>
*           <th>Column Name</th>
*           <th>Type</th>
*           <th>Description</th>
*           <th>Restriction</th>
*           <th>Nullable</th>
*       </tr>
*       <tr>
*           <td>EnumName</td>
*           <td>string</td>
*           <td>Name of the enumerator. </td>
*           <td>Yes (array)</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>EnumDescription</td>
*           <td>string</td>
*           <td>A human readable description of the enumerator</td>
*           <td>No</td>
*           <td>Yes</td>
*       </tr>
*       <tr>
*           <td>EnumType</td>
*           <td>string</td>
*           <td>The XML Schema data type of this enumerator</td>
*           <td>No</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>ElementName</td>
*           <td>string</td>
*           <td>The name of the enumerator entry</td>
*           <td>No</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>ElementDescription</td>
*           <td>string</td>
*           <td>A human readable description of this enumerator entry</td>
*           <td>No</td>
*           <td>Yes</td>
*       </tr>
*       <tr>
*           <td>ElementValue</td>
*           <td>string</td>
*           <td>The value of this enumerator entry</td>
*           <td>No</td>
*           <td>Yes</td>
*       </tr>
*   </table>
*
*   @method discoverEnumerators
*   @param {Object} options An object whose properties convey the options for the XML/A a <code>DISCOVER_ENUMERATORS</code> request.
*   @return {Xmla.Rowset} The result of the invoking the XML/A <code>Discover</code> method. For synchronous requests, an instance of a <code><a href="Xmla.Rowset.html#Xmla.Rowset">Xmla.Rowset</a></code> that represents the <code>DISCOVER_ENUMERATORS</code> schema rowset. For an asynchronous request, the return value is not defined: you should add a listener (see: <code><a href="#method_addListener">addListener()</a></code>) and listen for the <code>success</code> (see: <code><a href="#property_EVENT_SUCCESS">EVENT_SUCCESS</a></code>) or <code>discoversuccess</code> (see: <code><a href="#property_EVENT_DISCOVER_SUCCESS">EVENT_DISCOVER_SUCCESS</a></code>) events.
*/
    discoverEnumerators: function(options){
        var request = _applyProps(
            options,
            {
                requestType: Xmla.DISCOVER_ENUMERATORS
            },
            true
        );
        return this.discover(request);
    },
/**
*   Invokes the <code><a href="#method_discover">discover()</a></code> method using <code><a href="#property_DISCOVER_KEYWORDS"></a></code> as value for the <code>requestType</code>,
*   and retrieves the <code>DISCOVER_KEYWORDS</code> schema rowset.
*   This rowset is a list of reserved words for this XML/A provider.
*   The rowset has the following columns:
*   <table border="1" class="schema-rowset">
*       <tr>
*           <th>Column Name</th>
*           <th>Type</th>
*           <th>Description</th>
*           <th>Restriction</th>
*           <th>Nullable</th>
*       </tr>
*       <tr>
*           <td>Keyword</td>
*           <td>string</td>
*           <td>Name of the enumerator. </td>
*           <td>Yes (array)</td>
*           <td>No</td>
*       </tr>
*   </table>
*
*   @method discoverKeywords
*   @param {Object} options An object whose properties convey the options for the XML/A a <code>DISCOVER_KEYWORDS</code> request.
*   @return {Xmla.Rowset} The result of the invoking the XML/A <code>Discover</code> method. For synchronous requests, an instance of a <code><a href="Xmla.Rowset.html#Xmla.Rowset">Xmla.Rowset</a></code> that represents the <code>DISCOVER_ENUMERATORS</code> schema rowset. For an asynchronous request, the return value is not defined: you should add a listener (see: <code><a href="#method_addListener">addListener()</a></code>) and listen for the <code>success</code> (see: <code><a href="#property_EVENT_SUCCESS">EVENT_SUCCESS</a></code>) or <code>discoversuccess</code> (see: <code><a href="#property_EVENT_DISCOVER_SUCCESS">EVENT_DISCOVER_SUCCESS</a></code>) events.
*/
    discoverKeywords: function(options){
        var request = _applyProps(
            options,
            {
                requestType: Xmla.DISCOVER_KEYWORDS
            },
            true
        );
        return this.discover(request);
    },
/**
*   Invokes the <code><a href="#method_discover">discover()</a></code> method using <code><a href="#property_DISCOVER_LITERALS"></a></code> as value for the <code>requestType</code>,
*   and retrieves the <code>DISCOVER_LITERALS</code> schema rowset.
*   This rowset is a list of reserved words for this XML/A provider.
*   The rowset has the following columns:
*   <table border="1" class="schema-rowset">
*       <tr>
*           <th>Column Name</th>
*           <th>Type</th>
*           <th>Description</th>
*           <th>Restriction</th>
*           <th>Nullable</th>
*       </tr>
*       <tr>
*           <td>LiteralName</td>
*           <td>string</td>
*           <td>Name of the literal. </td>
*           <td>Yes (array)</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>LiteralValue</td>
*           <td>string</td>
*           <td>The actual literal value. </td>
*           <td>No</td>
*           <td>Yes</td>
*       </tr>
*       <tr>
*           <td>LiteralInvalidChars</td>
*           <td>string</td>
*           <td>Characters that may not appear in the literal </td>
*           <td>No</td>
*           <td>Yes</td>
*       </tr>
*       <tr>
*           <td>LiteralInvalidStartingChars</td>
*           <td>string</td>
*           <td>Characters that may not appear as first character in the literal </td>
*           <td>No</td>
*           <td>Yes</td>
*       </tr>
*       <tr>
*           <td>LiteralMaxLength</td>
*           <td>int</td>
*           <td>maximum number of characters for this literal, or -1 in case there is no maximum, or the maximum is unknown</td>
*           <td>No</td>
*           <td>Yes</td>
*       </tr>
*   </table>
*
*   @method discoverLiterals
*   @param {Object} options An object whose properties convey the options for the XML/A a <code>DISCOVER_LITERALS</code> request.
*   @return {Xmla.Rowset} The result of the invoking the XML/A <code>Discover</code> method. For synchronous requests, an instance of a <code><a href="Xmla.Rowset.html#Xmla.Rowset">Xmla.Rowset</a></code> that represents the <code>DISCOVER_LITERALS</code> schema rowset. For an asynchronous request, the return value is not defined: you should add a listener (see: <code><a href="#method_addListener">addListener()</a></code>) and listen for the <code>success</code> (see: <code><a href="#property_EVENT_SUCCESS">EVENT_SUCCESS</a></code>) or <code>discoversuccess</code> (see: <code><a href="#property_EVENT_DISCOVER_SUCCESS">EVENT_DISCOVER_SUCCESS</a></code>) events.
*/
    discoverLiterals: function(options){
        var request = _applyProps(
            options,
            {
                requestType: Xmla.DISCOVER_LITERALS
            },
            true
        );
        return this.discover(request);
    },
/**
*   Invokes the <code><a href="#method_discover">discover()</a></code> method using
*   <code><a href="#property_DBSCHEMA_CATALOGS"></a></code> as value for the <code>requestType</code>,
*   and retrieves the <code>DBSCHEMA_CATALOGS</code> schema rowset.
*   The rowset has the following columns:
*   <table border="1" class="schema-rowset">
*       <tr>
*           <th>Column Name</th>
*           <th>Type</th>
*           <th>Description</th>
*           <th>Restriction</th>
*           <th>Nullable</th>
*       </tr>
*       <tr>
*           <td>CATALOG_NAME</td>
*           <td>string</td>
*           <td>Name of the catalog</td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>DESCRIPTION</td>
*           <td>string</td>
*           <td>Human readable description</td>
*           <td>No</td>
*           <td>Yes</td>
*       </tr>
*       <tr>
*           <td>ROLES</td>
*           <td>string</td>
*           <td>A comma-separatd list of roles available to the current user.</td>
*           <td>No</td>
*           <td>Yes</td>
*       </tr>
*       <tr>
*           <td>DATE_MODIFIED</td>
*           <td>Date</td>
*           <td>The date this catalog was modified</td>
*           <td>No</td>
*           <td>Yes</td>
*       </tr>
*   </table>
*   @method discoverDBCatalogs
*   @param {Object} options An object whose properties convey the options for the XML/A a <code>DBSCHEMA_CATALOGS</code> request.
*   @return {Xmla.Rowset} The result of the invoking the XML/A <code>Discover</code> method. For synchronous requests, an instance of a <code><a href="Xmla.Rowset.html#Xmla.Rowset">Xmla.Rowset</a></code> that represents the <code>DBSCHEMA_CATALOGS</code> schema rowset. For an asynchronous request, the return value is not defined: you should add a listener (see: <code><a href="#method_addListener">addListener()</a></code>) and listen for the <code>success</code> (see: <code><a href="#property_EVENT_SUCCESS">EVENT_SUCCESS</a></code>) or <code>discoversuccess</code> (see: <code><a href="#property_EVENT_DISCOVER_SUCCESS">EVENT_DISCOVER_SUCCESS</a></code>) events.
*/
    discoverDBCatalogs: function(options){
        var request = _applyProps(
            options,
            {
                requestType: Xmla.DBSCHEMA_CATALOGS
            },
            true
        );
        return this.discover(request);
    },
/**
*   Invokes the <code><a href="#method_discover">discover()</a></code> method using
*   <code><a href="#property_DBSCHEMA_COLUMNS"></a></code> as value for the <code>requestType</code>,
*   and retrieves the <code>DBSCHEMA_COLUMNS</code> schema rowset.
*   Provides column information for all columns meeting the provided restriction criteria.
*   The rowset has the following columns:
*   <table border="1" class="schema-rowset">
*       <tr>
*           <th>Column Name</th>
*           <th>Type</th>
*           <th>Description</th>
*           <th>Restriction</th>
*           <th>Nullable</th>
*       </tr>
*        <tr>
*            <td>TABLE_CATALOG</td>
*            <td>string</td>
*            <td>The name of the Database.</td>
*            <td>Yes</td>
*            <td>No</td>
*        </tr>
*        <tr>
*            <td>TABLE_SCHEMA</td>
*            <td>string</td>
*            <td>Not supported.</td>
*            <td>Yes</td>
*            <td>No</td>
*        </tr>
*        <tr>
*            <td>TABLE_NAME</td>
*            <td>string</td>
*            <td>The name of the cube.</td>
*            <td>Yes</td>
*            <td>No</td>
*        </tr>
*        <tr>
*            <td>COLUMN_NAME</td>
*            <td>string</td>
*            <td>The name of the attribute hierarchy or measure.</td>
*            <td>Yes</td>
*            <td>No</td>
*        </tr>
*        <tr>
*            <td>COLUMN_GUID</td>
*            <td>string</td>
*            <td>Not supported.</td>
*            <td>No</td>
*            <td>No</td>
*        </tr>
*        <tr>
*            <td>COLUMN_PROPID</td>
*            <td>int</td>
*            <td>Not supported.</td>
*            <td>No</td>
*            <td>No</td>
*        </tr>
*        <tr>
*            <td>ORDINAL_POSITION</td>
*            <td>int</td>
*            <td>The position of the column, beginning with 1.</td>
*            <td>No</td>
*            <td>No</td>
*        </tr>
*        <tr>
*            <td>COLUMN_HAS_DEFAULT</td>
*            <td>boolean</td>
*            <td>Not supported.</td>
*            <td>No</td>
*            <td>No</td>
*        </tr>
*        <tr>
*            <td>COLUMN_DEFAULT</td>
*            <td>string</td>
*            <td>Not supported.</td>
*            <td>No</td>
*            <td>No</td>
*        </tr>
*        <tr>
*            <td>COLUMN_FLAGS</td>
*            <td>int</td>
*            <td>A DBCOLUMNFLAGS bitmask indicating column properties. See 'DBCOLUMNFLAGS Enumerated Type' in IColumnsInfo::GetColumnInfo</td>
*            <td>No</td>
*            <td>No</td>
*        </tr>
*        <tr>
*            <td>IS_NULLABLE</td>
*            <td>boolean</td>
*            <td>Always returns false.</td>
*            <td>No</td>
*            <td>No</td>
*        </tr>
*        <tr>
*            <td>DATA_TYPE</td>
*            <td>string</td>
*            <td>The data type of the column. Returns a string for dimension columns and a variant for measures.</td>
*            <td>No</td>
*            <td>No</td>
*        </tr>
*        <tr>
*            <td>TYPE_GUID
*            <td>srring</td>
*            <td>Not supported.</td>
*            <td>No</td>
*            <td>No</td>
*        </tr>
*        <tr>
*            <td>CHARACTER_MAXIMUM_LENGTH</td>
*            <td>int</td>
*            <td>The maximum possible length of a value within the column. This is retrieved from the DataSize property in the DataItem.</td>
*            <td>No</td>
*            <td>No</td>
*        </tr>
*        <tr>
*            <td>CHARACTER_OCTET_LENGTH</td>
*            <td>int</td>
*            <td>The maximum possible length of a value within the column, in bytes, for character or binary columns. A value of zero (0) indicates the column has no maximum length. NULL will be returned for columns that do not return binary or character data types.</td>
*            <td>No</td>
*            <td>No</td>
*        </tr>
*        <tr>
*            <td>NUMERIC_PRECISION</td>
*            <td>int</td>
*            <td>The maximum precision of the column for numeric data types other than DBTYPE_VARNUMERIC.</td>
*            <td>No</td>
*            <td>No</td>
*        </tr>
*        <tr>
*            <td>NUMERIC_SCALE</td>
*            <td>int</td>
*            <td>The number of digits to the right of the decimal point for DBTYPE_DECIMAL, DBTYPE_NUMERIC, DBTYPE_VARNUMERIC. Otherwise, this is NULL.</td>
*            <td>No</td>
*            <td>No</td>
*        </tr>
*        <tr>
*            <td>DATETIME_PRECISION</td>
*            <td>int</td>
*            <td>Not supported.</td>
*            <td>No</td>
*            <td>No</td>
*        </tr>
*        <tr>
*            <td>CHARACTER_SET_CATALOG</td>
*            <td>string</td>
*            <td>Not supported.</td>
*            <td>No</td>
*            <td>No</td>
*        </tr>
*        <tr>
*            <td>CHARACTER_SET_SCHEMA</td>
*            <td>string</td>
*            <td>Not supported.</td>
*            <td>No</td>
*            <td>No</td>
*        </tr>
*        <tr>
*            <td>CHARACTER_SET_NAME</td>
*            <td>string</td>
*            <td>Not supported.</td>
*            <td>No</td>
*            <td>No</td>
*        </tr>
*        <tr>
*            <td>COLLATION_CATALOG</td>
*            <td>string</td>
*            <td>Not supported.</td>
*            <td>No</td>
*            <td>No</td>
*        </tr>
*        <tr>
*            <td>COLLATION_SCHEMA</td>
*            <td>string</td>
*            <td>Not supported.</td>
*            <td>No</td>
*            <td>No</td>
*        </tr>
*        <tr>
*            <td>COLLATION_NAME</td>
*            <td>string</td>
*            <td>Not supported.</td>
*            <td>No</td>
*            <td>No</td>
*        </tr>
*        <tr>
*            <td>DOMAIN_CATALOG</td>
*            <td>string</td>
*            <td>Not supported.</td>
*            <td>No</td>
*            <td>No</td>
*        </tr>
*        <tr>
*            <td>DOMAIN_SCHEMA</td>
*            <td>string</td>
*            <td>Not supported.</td>
*            <td>No</td>
*            <td>No</td>
*        </tr>
*        <tr>
*            <td>DOMAIN_NAME</td>
*            <td>string</td>
*            <td>Not supported.</td>
*            <td>No</td>
*            <td>No</td>
*        </tr>
*        <tr>
*            <td>DESCRIPTION</td>
*            <td>string</td>
*            <td>Not supported.</td>
*            <td>No</td>
*            <td>No</td>
*        </tr>
*        <tr>
*            <td>COLUMN_OLAP_TYPE</td>
*            <td>string</td>
*            <td>The OLAP type of the object. MEASURE indicates the object is a measure. ATTRIBUTE indicates the object is a dimension attribute.</td>
*            <td>Yes</td>
*            <td>No</td>
*        </tr>
*   </table>
*    The rowset is sorted on TABLE_CATALOG, TABLE_SCHEMA, TABLE_NAME.
*   @method discoverDBColumns
*   @param {Object} options An object whose properties convey the options for the XML/A a <code>DBSCHEMA_COLUMNS</code> request.
*   @return {Xmla.Rowset} The result of the invoking the XML/A <code>Discover</code> method. For synchronous requests, an instance of a <code><a href="Xmla.Rowset.html#Xmla.Rowset">Xmla.Rowset</a></code> that represents the <code>DBSCHEMA_COLUMNS</code> schema rowset. For an asynchronous request, the return value is not defined: you should add a listener (see: <code><a href="#method_addListener">addListener()</a></code>) and listen for the <code>success</code> (see: <code><a href="#property_EVENT_SUCCESS">EVENT_SUCCESS</a></code>) or <code>discoversuccess</code> (see: <code><a href="#property_EVENT_DISCOVER_SUCCESS">EVENT_DISCOVER_SUCCESS</a></code>) events.
*/
    discoverDBColumns: function(options){
        var request = _applyProps(
            options,
            {
                requestType: Xmla.DBSCHEMA_COLUMNS
            },
            true
        );
        return this.discover(request);
    },
/**
*   Invokes the <code><a href="#method_discover">discover()</a></code> method using
*   <code><a href="#property_DBSCHEMA_PROVIDER_TYPES"></a></code> as value for the <code>requestType</code>,
*   and retrieves the <code>DBSCHEMA_PROVIDER_TYPES</code> schema rowset.
*   ...todo...
*   The rowset has the following columns:
*   <table border="1" class="schema-rowset">
*       <tr>
*           <th>Column Name</th>
*           <th>Type</th>
*           <th>Description</th>
*           <th>Restriction</th>
*           <th>Nullable</th>
*       </tr>
*        <tr>
*            <td>TYPE_NAME</td>
*            <td>string</td>
*            <td>The provider-specific data type name.</td>
*            <td>false</td>
*            <td>true</td>
*        </tr>
*        <tr>
*            <td>DATA_TYPE</td>
*            <td>int</td>
*            <td>The indicator of the data type.</td>
*            <td>false</td>
*            <td>true</td>
*        </tr>
*        <tr>
*            <td>COLUMN_SIZE</td>
*            <td>int</td>
*            <td> The length of a non-numeric column or parameter that refers to either the maximum or the length defined for this type by the provider. For character data, this is the maximum or defined length in characters. For DateTime data types, this is the length of the string representation (assuming the maximum allowed precision of the fractional seconds component). If the data type is numeric, this is the upper bound on the maximum precision of the data type. </td>
*            <td>false</td>
*            <td>true</td>
*        </tr>
*        <tr>
*            <td>LITERAL_PREFIX</td>
*            <td>string</td>
*            <td>The character or characters used to prefix a literal of this type in a text command.</td>
*            <td>false</td>
*            <td>true</td>
*        </tr>
*        <tr>
*            <td>LITERAL_SUFFIX</td>
*            <td>string</td>
*            <td>The character or characters used to suffix a literal of this type in a text command.</td>
*            <td>false</td>
*            <td>true</td>
*        </tr>
*        <tr>
*            <td>CREATE_PARAMS
*            <td>string</td>
*            <td>The creation parameters specified by the consumer when creating a column of this data type. For example, the SQL data type, DECIMAL, needs a precision and a scale. In this case, the creation parameters might be the string "precision,scale". In a text command to create a DECIMAL column with a precision of 10 and a scale of 2, the value of the TYPE_NAME column might be DECIMAL() and the complete type specification would be DECIMAL(10,2). The creation parameters appear as a comma-separated list of values, in the order they are to be supplied and with no surrounding parentheses. If a creation parameter is length, maximum length, precision, scale, seed, or increment, use "length", "max length", "precision", "scale", "seed", and "increment", respectively. If the creation parameter is some other value, the provider determines what text is to be used to describe the creation parameter. If the data type requires creation parameters, "()" usually appears in the type name. This indicates the position at which to insert the creation parameters. If the type name does not include "()", the creation parameters are enclosed in parentheses and appended to the data type name. </td>
*            <td>false</td>
*            <td>true</td>
*        </tr>
*        <tr>
*            <td>IS_NULLABLE</td>
*            <td>boolean</td>
*            <td>A Boolean that indicates whether the data type is nullable. VARIANT_TRUE indicates that the data type is nullable. VARIANT_FALSE indicates that the data type is not nullable. NULL indicates that it is not known whether the data type is nullable.</td>
*            <td>false</td>
*            <td>true</td>
*        </tr>
*        <tr>
*            <td>CASE_SENSITIVE</td>
*            <td>boolean</td>
*            <td>A Boolean that indicates whether the data type is a characters type and case-sensitive. VARIANT_TRUE indicates that the data type is a character type and is case-sensitive. VARIANT_FALSE indicates that the data type is not a character type or is not case-sensitive.</td>
*            <td>false</td>
*            <td>true</td>
*        </tr>
*        <tr>
*            <td>SEARCHABLE</td>
*            <td>int</td>
*            <td>An integer indicating how the data type can be used in searches if the provider supports ICommandText; otherwise, NULL. This column can have the following values: DB_UNSEARCHABLE indicates that the data type cannot be used in a WHERE clause. DB_LIKE_ONLY indicates that the data type can be used in a WHERE clause only with the LIKE predicate.DB_ALL_EXCEPT_LIKE indicates that the data type can be used in a WHERE clause with all comparison operators except LIKE. DB_SEARCHABLE indicates that the data type can be used in a WHERE clause with any comparison operator.</td>
*            <td>false</td>
*            <td>true</td>
*        </tr>
*        <tr>
*            <td>UNSIGNED_ATTRIBUTE</td>
*            <td>boolean</td>
*            <td>A Boolean that indicates whether the data type is unsigned.   VARIANT_TRUE indicates that the data type is unsigned. VARIANT_FALSE indicates that the data type is signed.NULL indicates that this is not applicable to the data type.</td>
*            <td>false</td>
*            <td>true</td>
*        </tr>
*        <tr>
*            <td>FIXED_PREC_SCALE</td>
*            <td>boolean</td>
*            <td>A Boolean that indicates whether the data type has a fixed precision and scale.  VARIANT_TRUE indicates that the data type has a fixed precision and scale. VARIANT_FALSE indicates that the data type does not have a fixed precision and scale.</td>
*            <td>false</td>
*            <td>true</td>
*        </tr>
*        <tr>
*            <td>AUTO_UNIQUE_VALUE</td>
*            <td>boolean</td>
*            <td>A Boolean that indicates whether the data type is autoincrementing. VARIANT_TRUE indicates that values of this type can be autoincrementing. VARIANT_FALSE indicates that values of this type cannot be autoincrementing. If this value is VARIANT_TRUE, whether or not a column of this type is always autoincrementing depends on the provider's DBPROP_COL_AUTOINCREMENT column property. If the DBPROP_COL_AUTOINCREMENT property is read/write, whether or not a column of this type is autoincrementing depends on the setting of the DBPROP_COL_AUTOINCREMENT property. If DBPROP_COL_AUTOINCREMENT is a read-only property, either all or none of the columns of this type are autoincrementing. </td>
*            <td>false</td>
*            <td>true</td>
*        </tr>
*        <tr>
*            <td>LOCAL_TYPE_NAME</td>
*            <td>string</td>
*            <td>The localized version of TYPE_NAME. NULL is returned if a localized name is not supported by the data provider.</td>
*            <td>false</td>
*            <td>true</td>
*        </tr>
*        <tr>
*            <td>MINIMUM_SCALE</td>
*            <td>int</td>
*            <td>If the type indicator is DBTYPE_VARNUMERIC, DBTYPE_DECIMAL, or DBTYPE_NUMERIC, the minimum number of digits allowed to the right of the decimal point. Otherwise, NULL.</td>
*            <td>false</td>
*            <td>true</td>
*        </tr>
*        <tr>
*            <td>MAXIMUM_SCALE</td>
*            <td>int</td>
*            <td>The maximum number of digits allowed to the right of the decimal point if the type indicator is DBTYPE_VARNUMERIC, DBTYPE_DECIMAL, or DBTYPE_NUMERIC; otherwise, NULL.</td>
*            <td>false</td>
*            <td>true</td>
*        </tr>
*        <tr>
*            <td>GUID</td>
*            <td>string</td>
*            <td>(Intended for future use) The GUID of the type, if the type is described in a type library. Otherwise, NULL.</td>
*            <td>false</td>
*            <td>true</td>
*        </tr>
*        <tr>
*            <td>TYPELIB
*            <td>string</td>
*            <td>(Intended for future use) The type library containing the description of the type, if the type is described in a type library. Otherwise, NULL.</td>
*            <td>false</td>
*            <td>true</td>
*        </tr>
*        <tr>
*            <td>VERSION</td>
*            <td>string</td>
*            <td>(Intended for future use) The version of the type definition. Providers might want to version type definitions. Different providers might use different versioning schemes, such as a timestamp or number (integer or float). NULL if not supported.</td>
*            <td>false</td>
*            <td>true</td>
*        </tr>
*        <tr>
*            <td>IS_LONG</td>
*            <td>boolean</td>
*            <td>A Boolean that indicates whether the data type is a binary large object (BLOB) and has very long data. VARIANT_TRUE indicates that the data type is a BLOB that contains very long data; the definition of very long data is provider-specific. VARIANT_FALSE indicates that the data type is a BLOB that does not contain very long data or is not a BLOB. This value determines the setting of the DBCOLUMNFLAGS_ISLONG flag returned by GetColumnInfo in IColumnsInfo and GetParameterInfo in ICommandWithParameters.</td>
*            <td>false</td>
*            <td>true</td>
*        </tr>
*        <tr>
*            <td>BEST_MATCH</td>
*            <td>boolean</td>
*            <td>A Boolean that indicates whether the data type is a best match. VARIANT_TRUE indicates that the data type is the best match between all data types in the data store and the OLE DB data type indicated by the value in the DATA_TYPE column. VARIANT_FALSE indicates that the data type is not the best match. For each set of rows in which the value of the DATA_TYPE column is the same, the BEST_MATCH column is set to VARIANT_TRUE in only one row.</td>
*            <td>false</td>
*            <td>true</td>
*        </tr>
*        <tr>
*            <td>IS_FIXEDLENGTH</td>
*            <td>boolean</td>
*            <td>A Boolean that indicates whether the column is fixed in length. VARIANT_TRUE indicates that columns of this type created by the data definition language (DDL) will be of fixed length. VARIANT_FALSE indicates that columns of this type created by the DDL will be of variable length. If the field is NULL, it is not known whether the provider will map this field with a fixed-length or variable-length column.
*            <td>false</td>
*            <td>true</td>
*        </tr>
*    </table>
*   @method discoverDBProviderTypes
*   @param {Object} options An object whose properties convey the options for the XML/A a <code>DBSCHEMA_PROVIDER_TYPES</code> request.
*   @return {Xmla.Rowset} The result of the invoking the XML/A <code>Discover</code> method. For synchronous requests, an instance of a <code><a href="Xmla.Rowset.html#Xmla.Rowset">Xmla.Rowset</a></code> that represents the <code>DBSCHEMA_PROVIDER_TYPES</code> schema rowset. For an asynchronous request, the return value is not defined: you should add a listener (see: <code><a href="#method_addListener">addListener()</a></code>) and listen for the <code>success</code> (see: <code><a href="#property_EVENT_SUCCESS">EVENT_SUCCESS</a></code>) or <code>discoversuccess</code> (see: <code><a href="#property_EVENT_DISCOVER_SUCCESS">EVENT_DISCOVER_SUCCESS</a></code>) events.
*/
    discoverDBProviderTypes: function(options){
        var request = _applyProps(
            options,
            {
                requestType: Xmla.DBSCHEMA_PROVIDER_TYPES
            },
            true
        );
        return this.discover(request);
    },
/**
*   Invokes the <code><a href="#method_discover">discover()</a></code> method using
*   <code><a href="#property_DBSCHEMA_SCHEMATA"></a></code> as value for the <code>requestType</code>,
*   and retrieves the <code>DBSCHEMA_SCHEMATA</code> schema rowset.
*   ...todo...
*   The rowset has the following columns:
*   <table border="1" class="schema-rowset">
*       <tr>
*           <th>Column Name</th>
*           <th>Type</th>
*           <th>Description</th>
*           <th>Restriction</th>
*           <th>Nullable</th>
*       </tr>
*   </table>
*   @method discoverDBSchemata
*   @param {Object} options An object whose properties convey the options for the XML/A a <code>DBSCHEMA_SCHEMATA</code> request.
*   @return {Xmla.Rowset} The result of the invoking the XML/A <code>Discover</code> method. For synchronous requests, an instance of a <code><a href="Xmla.Rowset.html#Xmla.Rowset">Xmla.Rowset</a></code> that represents the <code>DBSCHEMA_SCHEMATA</code> schema rowset. For an asynchronous request, the return value is not defined: you should add a listener (see: <code><a href="#method_addListener">addListener()</a></code>) and listen for the <code>success</code> (see: <code><a href="#property_EVENT_SUCCESS">EVENT_SUCCESS</a></code>) or <code>discoversuccess</code> (see: <code><a href="#property_EVENT_DISCOVER_SUCCESS">EVENT_DISCOVER_SUCCESS</a></code>) events.
*/
    discoverDBSchemata: function(options){
        var request = _applyProps(
            options,
            {
                requestType: Xmla.DBSCHEMA_SCHEMATA
            },
            true
        );
        return this.discover(request);
    },
/**
*   Invokes the <code><a href="#method_discover">discover()</a></code> method using
*   <code><a href="#property_DBSCHEMA_TABLES"></a></code> as value for the <code>requestType</code>,
*   and retrieves the <code>DBSCHEMA_TABLES</code> schema rowset.
*   ...todo...
*   The rowset has the following columns:
*   <table border="1" class="schema-rowset">
*       <tr>
*           <th>Column Name</th>
*           <th>Type</th>
*           <th>Description</th>
*           <th>Restriction</th>
*           <th>Nullable</th>
*       </tr>
*   </table>
*   @method discoverDBTables
*   @param {Object} options An object whose properties convey the options for the XML/A a <code>DBSCHEMA_TABLES</code> request.
*   @return {Xmla.Rowset} The result of the invoking the XML/A <code>Discover</code> method. For synchronous requests, an instance of a <code><a href="Xmla.Rowset.html#Xmla.Rowset">Xmla.Rowset</a></code> that represents the <code>DBSCHEMA_TABLES</code> schema rowset. For an asynchronous request, the return value is not defined: you should add a listener (see: <code><a href="#method_addListener">addListener()</a></code>) and listen for the <code>success</code> (see: <code><a href="#property_EVENT_SUCCESS">EVENT_SUCCESS</a></code>) or <code>discoversuccess</code> (see: <code><a href="#property_EVENT_DISCOVER_SUCCESS">EVENT_DISCOVER_SUCCESS</a></code>) events.
*/
    discoverDBTables: function(options){
        var request = _applyProps(
            options,
            {
                requestType: Xmla.DBSCHEMA_TABLES
            },
            true
        );
        return this.discover(request);
    },
/**
*   Invokes the <code><a href="#method_discover">discover()</a></code> method using
*   <code><a href="#property_DBSCHEMA_TABLES_INFO"></a></code> as value for the <code>requestType</code>,
*   and retrieves the <code>DBSCHEMA_TABLES_INFO</code> schema rowset.
*   ...todo...
*   The rowset has the following columns:
*   <table border="1" class="schema-rowset">
*       <tr>
*           <th>Column Name</th>
*           <th>Type</th>
*           <th>Description</th>
*           <th>Restriction</th>
*           <th>Nullable</th>
*       </tr>
*   </table>
*   @method discoverDBTablesInfo
*   @param {Object} options An object whose properties convey the options for the XML/A a <code>DBSCHEMA_TABLES_INFO</code> request.
*   @return {Xmla.Rowset} The result of the invoking the XML/A <code>Discover</code> method. For synchronous requests, an instance of a <code><a href="Xmla.Rowset.html#Xmla.Rowset">Xmla.Rowset</a></code> that represents the <code>DBSCHEMA_TABLES_INFO</code> schema rowset. For an asynchronous request, the return value is not defined: you should add a listener (see: <code><a href="#method_addListener">addListener()</a></code>) and listen for the <code>success</code> (see: <code><a href="#property_EVENT_SUCCESS">EVENT_SUCCESS</a></code>) or <code>discoversuccess</code> (see: <code><a href="#property_EVENT_DISCOVER_SUCCESS">EVENT_DISCOVER_SUCCESS</a></code>) events.
*/
    discoverDBTablesInfo: function(options){
        var request = _applyProps(
            options,
            {
                requestType: Xmla.DBSCHEMA_TABLES_INFO
            },
            true
        );
        return this.discover(request);
    },
/**
*   Invokes the <code><a href="#method_discover">discover()</a></code> method using
*   <code><a href="#property_MDSCHEMA_ACTIONS"></a></code> as value for the <code>requestType</code>,
*   and retrieves the <code>MDSCHEMA_ACTIONS</code> schema rowset.
*   ...todo...
*   The rowset has the following columns:
*   <table border="1" class="schema-rowset">
*       <tr>
*           <th>Column Name</th>
*           <th>Type</th>
*           <th>Description</th>
*           <th>Restriction</th>
*           <th>Nullable</th>
*       </tr>
*   </table>
*   @method discoverMDActions
*   @param {Object} options An object whose properties convey the options for the XML/A a <code>MDSCHEMA_ACTIONS</code> request.
*   @return {Xmla.Rowset} The result of the invoking the XML/A <code>Discover</code> method. For synchronous requests, an instance of a <code><a href="Xmla.Rowset.html#Xmla.Rowset">Xmla.Rowset</a></code> that represents the <code>MDSCHEMA_ACTIONS</code> schema rowset. For an asynchronous request, the return value is not defined: you should add a listener (see: <code><a href="#method_addListener">addListener()</a></code>) and listen for the <code>success</code> (see: <code><a href="#property_EVENT_SUCCESS">EVENT_SUCCESS</a></code>) or <code>discoversuccess</code> (see: <code><a href="#property_EVENT_DISCOVER_SUCCESS">EVENT_DISCOVER_SUCCESS</a></code>) events.
*/
    discoverMDActions: function(options){
        var request = _applyProps(
            options,
            {
                requestType: Xmla.MDSCHEMA_ACTIONS
            },
            true
        );
        return this.discover(request);
    },
/**
*   Invokes the <code><a href="#method_discover">discover()</a></code> method using
*   <code><a href="#property_MDSCHEMA_CUBES"></a></code> as value for the <code>requestType</code>,
*   and retrieves the <code>MDSCHEMA_CUBES</code> schema rowset.
*   ...todo...
*   The rowset has the following columns:
*   <table border="1" class="schema-rowset">
*       <tr>
*           <th>Column Name</th>
*           <th>Type</th>
*           <th>Description</th>
*           <th>Restriction</th>
*           <th>Nullable</th>
*       </tr>
*       <tr>
*           <td>CATALOG_NAME</td>
*           <td>string</td>
*           <td>Name of the catalog</td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>SCHEMA_NAME</td>
*           <td>string</td>
*           <td>Not supported</td>
*           <td>Yes</td>
*           <td>Yes</td>
*       </tr>
*       <tr>
*           <td>CUBE_NAME</td>
*           <td>string</td>
*           <td>Name of the cube.</td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>CUBE_TYPE</td>
*           <td>string</td>
*           <td>Type of the cube.</td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>CUBE_GUID</td>
*           <td>string</td>
*           <td>Not supported</td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>CREATED_ON</td>
*           <td>Date</td>
*           <td>Not supported</td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>LAST_SCHEMA_UPDATE</td>
*           <td>Date</td>
*           <td>The time that the cube was last processed.</td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>SCHEMA_UPDATED_BY</td>
*           <td>string</td>
*           <td></td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>LAST_DATA_UPDATE</td>
*           <td>Date</td>
*           <td>The time that the cube was last processed.</td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>DATA_UPDATED_BY</td>
*           <td>string</td>
*           <td></td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>DESCRIPTION</td>
*           <td>string</td>
*           <td>A Human-readable description of the cube.</td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>IS_DRILLTHROUGH_ENABLED</td>
*           <td>boolean</td>
*           <td></td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>IS_LINKABLE</td>
*           <td>boolean</td>
*           <td></td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>IS_WRITE_ENABLED</td>
*           <td>boolean</td>
*           <td></td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>IS_SQL_ENABLED</td>
*           <td>boolean</td>
*           <td></td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>CUBE_CAPTION</td>
*           <td>string</td>
*           <td>Caption for this cube.</td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>BASE_CUBE_NAME</td>
*           <td>string</td>
*           <td>Name of the source cube (if this cube is a perspective cube).</td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>ANNOTATIONS</td>
*           <td>string</td>
*           <td>Notes in xml format</td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*   </table>
*   @method discoverMDCubes
*   @param {Object} options An object whose properties convey the options for the XML/A a <code>MDSCHEMA_CUBES</code> request.
*   @return {Xmla.Rowset} The result of the invoking the XML/A <code>Discover</code> method. For synchronous requests, an instance of a <code><a href="Xmla.Rowset.html#Xmla.Rowset">Xmla.Rowset</a></code> that represents the <code>MDSCHEMA_CUBES</code> schema rowset. For an asynchronous request, the return value is not defined: you should add a listener (see: <code><a href="#method_addListener">addListener()</a></code>) and listen for the <code>success</code> (see: <code><a href="#property_EVENT_SUCCESS">EVENT_SUCCESS</a></code>) or <code>discoversuccess</code> (see: <code><a href="#property_EVENT_DISCOVER_SUCCESS">EVENT_DISCOVER_SUCCESS</a></code>) events.
*/
    discoverMDCubes: function(options){
        var request = _applyProps(
            options,
            {
                requestType: Xmla.MDSCHEMA_CUBES
            },
            true
        );
        return this.discover(request);
    },
/**
*   Invokes the <code><a href="#method_discover">discover()</a></code> method using
*   <code><a href="#property_MDSCHEMA_DIMENSIONS"></a></code> as value for the <code>requestType</code>,
*   and retrieves the <code>MDSCHEMA_DIMENSIONS</code> schema rowset.
*   ...todo...
*   The rowset has the following columns:
*   <table border="1" class="schema-rowset">
*       <tr>
*           <th>Column Name</th>
*           <th>Type</th>
*           <th>Description</th>
*           <th>Restriction</th>
*           <th>Nullable</th>
*       </tr>
*       <tr>
*           <td>CATALOG_NAME</td>
*           <td>string</td>
*           <td>Name of the catalog</td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>SCHEMA_NAME</td>
*           <td>string</td>
*           <td>Not supported</td>
*           <td>Yes</td>
*           <td>Yes</td>
*       </tr>
*       <tr>
*           <td>CUBE_NAME</td>
*           <td>string</td>
*           <td>Name of the cube.</td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>DIMENSION_NAME</td>
*           <td>string</td>
*           <td>Name of the dimension.</td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>DIMENSION_UNIQE_NAME</td>
*           <td>string</td>
*           <td>Unique name for this dimension.</td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>DIMENSION_GUID</td>
*           <td>string</td>
*           <td></td>
*           <td>No</td>
*           <td>Yes</td>
*       </tr>
*       <tr>
*           <td>DIMENSION_CAPTION</td>
*           <td>string</td>
*           <td></td>
*           <td>No</td>
*           <td>Yes</td>
*       </tr>
*       <tr>
*           <td>DIMENSION_ORDINAL</td>
*           <td>int</td>
*           <td></td>
*           <td>No</td>
*           <td>Yes</td>
*       </tr>
*       <tr>
*           <td>DIMENSION_TYPE</td>
*           <td>string</td>
*           <td>
*                <ul>
*                    <li>MD_DIMTYPE_UNKNOWN (0)</li>
*                    <li>MD_DIMTYPE_TIME (1)</li>
*                    <li>MD_DIMTYPE_MEASURE (2)</li>
*                    <li>MD_DIMTYPE_OTHER (3)</li>
*                    <li>MD_DIMTYPE_QUANTITATIVE (5)</li>
*                    <li>MD_DIMTYPE_ACCOUNTS (6)</li>
*                    <li>MD_DIMTYPE_CUSTOMERS (7)</li>
*                    <li>MD_DIMTYPE_PRODUCTS (8)</li>
*                    <li>MD_DIMTYPE_SCENARIO (9)</li>
*                    <li>MD_DIMTYPE_UTILIY (10)</li>
*                    <li>MD_DIMTYPE_CURRENCY (11)</li>
*                    <li>MD_DIMTYPE_RATES (12)</li>
*                    <li>MD_DIMTYPE_CHANNEL (13)</li>
*                    <li>MD_DIMTYPE_PROMOTION (14)</li>
*                    <li>MD_DIMTYPE_ORGANIZATION (15)</li>
*                    <li>MD_DIMTYPE_BILL_OF_MATERIALS (16)</li>
*                    <li>MD_DIMTYPE_GEOGRAPHY (17)</li>
*                </ul>
*            </td>
*           <td>No</td>
*           <td>Yes</td>
*       </tr>
*       <tr>
*           <td>DIMENSION_CARDINALITY</td>
*           <td>int</td>
*           <td></td>
*           <td>No</td>
*           <td>Yes</td>
*       </tr>
*       <tr>
*           <td>DEFAULT_HIERARCHY</td>
*           <td>string</td>
*           <td></td>
*           <td>No</td>
*           <td>Yes</td>
*       </tr>
*       <tr>
*           <td>DESCRIPTION</td>
*           <td>string</td>
*           <td>A Human-readable description of the dimension.</td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>IS_VIRTUAL</td>
*           <td>boolean</td>
*           <td></td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>IS_READWRITE</td>
*           <td>boolean</td>
*           <td></td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>DIMENSION_UNIQUE_SETTINGS</td>
*           <td></td>
*           <td></td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>DIMENSION_MASTER_UNIQUE_NAME</td>
*           <td></td>
*           <td></td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>IS_VISIBLE</td>
*           <td>boolean</td>
*           <td></td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*   </table>
*   @method discoverMDDimensions
*   @param {Object} options An object whose properties convey the options for the XML/A a <code>MDSCHEMA_DIMENSIONS</code> request.
*   @return {Xmla.Rowset} The result of the invoking the XML/A <code>Discover</code> method. For synchronous requests, an instance of a <code><a href="Xmla.Rowset.html#Xmla.Rowset">Xmla.Rowset</a></code> that represents the <code>MDSCHEMA_DIMENSIONS</code> schema rowset. For an asynchronous request, the return value is not defined: you should add a listener (see: <code><a href="#method_addListener">addListener()</a></code>) and listen for the <code>success</code> (see: <code><a href="#property_EVENT_SUCCESS">EVENT_SUCCESS</a></code>) or <code>discoversuccess</code> (see: <code><a href="#property_EVENT_DISCOVER_SUCCESS">EVENT_DISCOVER_SUCCESS</a></code>) events.
*/
    discoverMDDimensions: function(options){
        var request = _applyProps(
            options,
            {
                requestType: Xmla.MDSCHEMA_DIMENSIONS
            },
            true
        );
        return this.discover(request);
    },
/**
*   Invokes the <code><a href="#method_discover">discover()</a></code> method using
*   <code><a href="#property_MDSCHEMA_FUNCTIONS"></a></code> as value for the <code>requestType</code>,
*   and retrieves the <code>MDSCHEMA_FUNCTIONS</code> schema rowset.
*   ...todo...
*   The rowset has the following columns:
*   <table border="1" class="schema-rowset">
*       <tr>
*           <th>Column Name</th>
*           <th>Type</th>
*           <th>Description</th>
*           <th>Restriction</th>
*           <th>Nullable</th>
*       </tr>
*   </table>
*   @method discoverMDFunctions
*   @param {Object} options An object whose properties convey the options for the XML/A a <code>MDSCHEMA_FUNCTIONS</code> request.
*   @return {Xmla.Rowset} The result of the invoking the XML/A <code>Discover</code> method. For synchronous requests, an instance of a <code><a href="Xmla.Rowset.html#Xmla.Rowset">Xmla.Rowset</a></code> that represents the <code>MDSCHEMA_FUNCTIONS</code> schema rowset. For an asynchronous request, the return value is not defined: you should add a listener (see: <code><a href="#method_addListener">addListener()</a></code>) and listen for the <code>success</code> (see: <code><a href="#property_EVENT_SUCCESS">EVENT_SUCCESS</a></code>) or <code>discoversuccess</code> (see: <code><a href="#property_EVENT_DISCOVER_SUCCESS">EVENT_DISCOVER_SUCCESS</a></code>) events.
*/
    discoverMDFunctions: function(options){
        var request = _applyProps(
            options,
            {
                requestType: Xmla.MDSCHEMA_FUNCTIONS
            },
            true
        );
        return this.discover(request);
    },
/**
*   Invokes the <code><a href="#method_discover">discover()</a></code> method using
*   <code><a href="#property_MDSCHEMA_HIERARCHIES"></a></code> as value for the <code>requestType</code>,
*   and retrieves the <code>MDSCHEMA_HIERARCHIES</code> schema rowset.
*   ...todo...
*   The rowset has the following columns:
*   <table border="1" class="schema-rowset">
*       <tr>
*           <th>Column Name</th>
*           <th>Type</th>
*           <th>Description</th>
*           <th>Restriction</th>
*           <th>Nullable</th>
*       </tr>
*       <tr>
*           <td>CATALOG_NAME</td>
*           <td>string</td>
*           <td>Name of the catalog</td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>SCHEMA_NAME</td>
*           <td>string</td>
*           <td>Not supported</td>
*           <td>Yes</td>
*           <td>Yes</td>
*       </tr>
*       <tr>
*           <td>CUBE_NAME</td>
*           <td>string</td>
*           <td>Name of the cube.</td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>DIMENSION_UNIQE_NAME</td>
*           <td>string</td>
*           <td>Unique name for this dimension.</td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>HIERARCHY_NAME</td>
*           <td>string</td>
*           <td>Name of the hierarchy.</td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>HIERARCHY_UNIQE_NAME</td>
*           <td>string</td>
*           <td>Unique name for this hierarchy.</td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>HIERARCHY_GUID</td>
*           <td>string</td>
*           <td></td>
*           <td>No</td>
*           <td>Yes</td>
*       </tr>
*       <tr>
*           <td>HIERARCHY_CAPTION</td>
*           <td>string</td>
*           <td></td>
*           <td>No</td>
*           <td>Yes</td>
*       </tr>
*       <tr>
*           <td>DIMENSION_TYPE</td>
*           <td>string</td>
*           <td></td>
*           <td>No</td>
*           <td>Yes</td>
*       </tr>
*       <tr>
*           <td>HIERARCHY_CARDINALITY</td>
*           <td>int</td>
*           <td></td>
*           <td>No</td>
*           <td>Yes</td>
*       </tr>
*       <tr>
*           <td>DEFAULT_MEMBER</td>
*           <td>string</td>
*           <td></td>
*           <td>No</td>
*           <td>Yes</td>
*       </tr>
*       <tr>
*           <td>ALL_MEMBER</td>
*           <td>string</td>
*           <td></td>
*           <td>No</td>
*           <td>Yes</td>
*       </tr>
*       <tr>
*           <td>DESCRIPTION</td>
*           <td>string</td>
*           <td>A Human-readable description of the dimension.</td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>STRUCTURE</td>
*           <td>string</td>
*           <td></td>
*           <td>No</td>
*           <td>Yes</td>
*       </tr>
*       <tr>
*           <td>IS_VIRTUAL</td>
*           <td>boolean</td>
*           <td></td>
*           <td>No</td>
*           <td>Yes</td>
*       </tr>
*       <tr>
*           <td>IS_READWRITE</td>
*           <td>boolean</td>
*           <td></td>
*           <td>No</td>
*           <td>Yes</td>
*       </tr>
*       <tr>
*           <td>DIMENSION_UNIQUE_SETTINGS</td>
*           <td>string</td>
*           <td></td>
*           <td>No</td>
*           <td>Yes</td>
*       </tr>
*       <tr>
*           <td>DIMENSION_MASTER_UNIQUE_NAME</td>
*           <td>string</td>
*           <td></td>
*           <td>No</td>
*           <td>Yes</td>
*       </tr>
*       <tr>
*           <td>DIMENSION_IS_VISIBLE</td>
*           <td>boolean</td>
*           <td></td>
*           <td>No</td>
*           <td>Yes</td>
*       </tr>
*       <tr>
*           <td>HIERARCHY_ORDINAL</td>
*           <td>int</td>
*           <td></td>
*           <td>No</td>
*           <td>Yes</td>
*       </tr>
*       <tr>
*           <td>DIMENSION_IS_SHARED</td>
*           <td>boolean</td>
*           <td></td>
*           <td>No</td>
*           <td>Yes</td>
*       </tr>
*       <tr>
*           <td>HIERARCHY_IS_VISIBLE</td>
*           <td>boolean</td>
*           <td></td>
*           <td>No</td>
*           <td>Yes</td>
*       </tr>
*       <tr>
*           <td>HIERARCHY_ORIGIN</td>
*           <td></td>
*           <td></td>
*           <td>No</td>
*           <td>Yes</td>
*       </tr>
*       <tr>
*           <td>HIERARCHY_DISPLAY_FOLDER</td>
*           <td>string</td>
*           <td></td>
*           <td>No</td>
*           <td>Yes</td>
*       </tr>
*       <tr>
*           <td>INSTANCE_SELECTION</td>
*           <td>string</td>
*           <td></td>
*           <td>No</td>
*           <td>Yes</td>
*       </tr>
*   </table>
*   @method discoverMDHierarchies
*   @param {Object} options An object whose properties convey the options for the XML/A a <code>MDSCHEMA_HIERARCHIES</code> request.
*   @return {Xmla.Rowset} The result of the invoking the XML/A <code>Discover</code> method. For synchronous requests, an instance of a <code><a href="Xmla.Rowset.html#Xmla.Rowset">Xmla.Rowset</a></code> that represents the <code>MDSCHEMA_HIERARCHIES</code> schema rowset. For an asynchronous request, the return value is not defined: you should add a listener (see: <code><a href="#method_addListener">addListener()</a></code>) and listen for the <code>success</code> (see: <code><a href="#property_EVENT_SUCCESS">EVENT_SUCCESS</a></code>) or <code>discoversuccess</code> (see: <code><a href="#property_EVENT_DISCOVER_SUCCESS">EVENT_DISCOVER_SUCCESS</a></code>) events.
*/
    discoverMDHierarchies: function(options){
        var request = _applyProps(
            options,
            {
                requestType: Xmla.MDSCHEMA_HIERARCHIES
            },
            true
        );
        return this.discover(request);
    },
/**
*   Invokes the <code><a href="#method_discover">discover()</a></code> method using
*   <code><a href="#property_MDSCHEMA_LEVELS"></a></code> as value for the <code>requestType</code>,
*   and retrieves the <code>MDSCHEMA_LEVELS</code> schema rowset.
*   The rowset has the following columns:
*   <table border="1" class="schema-rowset">
*       <tr>
*           <th>Column Name</th>
*           <th>Type</th>
*           <th>Description</th>
*           <th>Restriction</th>
*           <th>Nullable</th>
*       </tr>
*       <tr>
*           <td>CATALOG_NAME</td>
*           <td>string</td>
*           <td>The name of the catalog to which this level belongs. NULL if the provider does not support catalogs.</td>
*           <td>No</td>
*           <td>Yes</td>
*       </tr>
*       <tr>
*           <td>SCHEMA_NAME</td>
*           <td>string</td>
*           <td>The name of the schema to which this level belongs. NULL if the provider does not support schemas.</td>
*           <td>No</td>
*           <td>Yes</td>
*       </tr>
*       <tr>
*           <td>CUBE_NAME</td>
*           <td>string</td>
*           <td>The name of the cube to which this level belongs.</td>
*           <td>No</td>
*           <td>Yes</td>
*       </tr>
*       <tr>
*           <td>DIMENSION_UNIQUE_NAME</td>
*           <td>string</td>
*           <td>The unique name of the dimension to which this level belongs. For providers that generate unique names by qualification, each component of this name is delimited.</td>
*           <td>No</td>
*           <td>Yes</td>
*       </tr>
*       <tr>
*           <td>HIERARCHY_UNIQUE_NAME</td>
*           <td>string</td>
*           <td>The unique name of the hierarchy. If the level belongs to more than one hierarchy, there is one row for each hierarchy to which it belongs. For providers that generate unique names by qualification, each component of this name is delimited.</td>
*           <td>No</td>
*           <td>Yes</td>
*       </tr>
*       <tr>
*           <td>LEVEL_NAME</td>
*           <td>string</td>
*           <td>The name of the level.</td>
*           <td>No</td>
*           <td>Yes</td>
*       </tr>
*       <tr>
*           <td>LEVEL_UNIQUE_NAME</td>
*           <td>string</td>
*           <td>The properly escaped unique name of the level.</td>
*           <td>No</td>
*           <td>Yes</td>
*       </tr>
*       <tr>
*           <td>LEVEL_GUID</td>
*           <td>string</td>
*           <td>Not supported.</td>
*           <td>No</td>
*           <td>Yes</td>
*       </tr>
*       <tr>
*           <td>LEVEL_CAPTION</td>
*           <td>string</td>
*           <td>A label or caption associated with the hierarchy. Used primarily for display purposes. If a caption does not exist, LEVEL_NAME is returned.</td>
*           <td>No</td>
*           <td>Yes</td>
*       </tr>
*       <tr>
*           <td>LEVEL_NUMBER</td>
*           <td>int</td>
*           <td>The distance of the level from the root of the hierarchy. Root level is zero (0).</td>
*           <td>No</td>
*           <td>Yes</td>
*       </tr>
*       <tr>
*           <td>LEVEL_CARDINALITY</td>
*           <td>int</td>
*           <td>The number of members in the level.</td>
*           <td>No</td>
*           <td>Yes</td>
*       </tr>
*       <tr>
*           <td>LEVEL_TYPE</td>
*           <td>int</td>
*           <td>Type of the level:
*                <ul>
*                   <li>MDLEVEL_TYPE_GEO_CONTINENT (0x2001)</li>
*                   <li>MDLEVEL_TYPE_GEO_REGION (0x2002)</li>
*                   <li>MDLEVEL_TYPE_GEO_COUNTRY (0x2003)</li>
*                   <li>MDLEVEL_TYPE_GEO_STATE_OR_PROVINCE (0x2004)</li>
*                   <li>MDLEVEL_TYPE_GEO_COUNTY (0x2005)</li>
*                   <li>MDLEVEL_TYPE_GEO_CITY (0x2006)</li>
*                   <li>MDLEVEL_TYPE_GEO_POSTALCODE (0x2007)</li>
*                   <li>MDLEVEL_TYPE_GEO_POINT (0x2008)</li>
*                   <li>MDLEVEL_TYPE_ORG_UNIT (0x1011)</li>
*                   <li>MDLEVEL_TYPE_BOM_RESOURCE (0x1012)</li>
*                   <li>MDLEVEL_TYPE_QUANTITATIVE (0x1013)</li>
*                   <li>MDLEVEL_TYPE_ACCOUNT (0x1014)</li>
*                   <li>MDLEVEL_TYPE_CUSTOMER (0x1021)</li>
*                   <li>MDLEVEL_TYPE_CUSTOMER_GROUP (0x1022)</li>
*                   <li>MDLEVEL_TYPE_CUSTOMER_HOUSEHOLD (0x1023)</li>
*                   <li>MDLEVEL_TYPE_PRODUCT (0x1031)</li>
*                   <li>MDLEVEL_TYPE_PRODUCT_GROUP (0x1032)</li>
*                   <li>MDLEVEL_TYPE_SCENARIO (0x1015)</li>
*                   <li>MDLEVEL_TYPE_UTILITY (0x1016)</li>
*                   <li>MDLEVEL_TYPE_PERSON (0x1041)</li>
*                   <li>MDLEVEL_TYPE_COMPANY (0x1042)</li>
*                   <li>MDLEVEL_TYPE_CURRENCY_SOURCE (0x1051)</li>
*                   <li>MDLEVEL_TYPE_CURRENCY_DESTINATION (0x1052)</li>
*                   <li>MDLEVEL_TYPE_CHANNEL (0x1061)</li>
*                   <li>MDLEVEL_TYPE_REPRESENTATIVE (0x1062)</li>
*                   <li>MDLEVEL_TYPE_PROMOTION (0x1071)</li>
*                </ul>
*           <td>No</td>
*           <td>Yes</td>
*       <tr>
*           <td>DESCRIPTION</td>
*           <td>string</td>
*           <td>A human-readable description of the level. NULL if no description exists.</td>
*           <td>No</td>
*           <td>Yes</td>
*       </tr>
*       <tr>
*           <td>CUSTOM_ROLLUP_SETTINGS</td>
*           <td>int</td>
*           <td>A bitmap that specifies the custom rollup options: MDLEVELS_CUSTOM_ROLLUP_EXPRESSION (0x01) indicates an expression exists for this level. (Deprecated) MDLEVELS_CUSTOM_ROLLUP_COLUMN (0x02) indicates that there is a custom rollup column for this level. MDLEVELS_SKIPPED_LEVELS (0x04) indicates that there is a skipped level associated with members of this level.MDLEVELS_CUSTOM_MEMBER_PROPERTIES (0x08) indicates that members of the level have custom member properties. MDLEVELS_UNARY_OPERATOR (0x10) indicates that members on the level have unary operators.</td>
*           <td>No</td>
*           <td>Yes</td>
*       </tr>
*       <tr>
*           <td>LEVEL_UNIQUE_SETTINGS</td>
*           <td>int</td>
*           <td>A bitmap that specifies which columns contain unique values, if the level only has members with unique names or keys. The Msmd.h file defines the following bit value constants for this bitmap: MDDIMENSIONS_MEMBER_KEY_UNIQUE (1) MDDIMENSIONS_MEMBER_NAME_UNIQUE (2)The key is always unique in Microsoft SQL Server 2005 Analysis Services (SSAS). The name will be unique if the setting on the attribute is UniqueInDimension or UniqueInAttribute</td>
*           <td>No</td>
*           <td>Yes</td>
*       </tr>
*       <tr>
*           <td>LEVEL_IS_VISIBLE</td>
*           <td>bool</td>
*           <td>A Boolean that indicates whether the level is visible. Always returns True. If the level is not visible, it will not be included in the schema rowset.</td>
*           <td>No</td>
*           <td>Yes</td>
*       </tr>
*       <tr>
*           <td>LEVEL_ORDERING_PROPERTY</td>
*           <td>string</td>
*           <td>The ID of the attribute that the level is sorted on.</td>
*           <td>No</td>
*           <td>Yes</td>
*       </tr>
*       <tr>
*           <td>LEVEL_DBTYPE</td>
*           <td>int</td>
*           <td>The DBTYPE enumeration of the member key column that is used for the level attribute. Null if concatenated keys are used as the member key column.</td>
*           <td>No</td>
*           <td>Yes</td>
*       </tr>
*       <tr>
*           <td>LEVEL_MASTER_UNIQUE_NAME</td>
*           <td>string</td>
*           <td>Always returns NULL.</td>
*           <td>No</td>
*           <td>Yes</td>
*       </tr>
*       <tr>
*           <td>LEVEL_NAME_SQL_COLUMN_NAME</td>
*           <td>string</td>
*           <td>The SQL representation of the level member names.</td>
*           <td>No</td>
*           <td>Yes</td>
*       </tr>
*       <tr>
*           <td>LEVEL_KEY_SQL_COLUMN_NAME</td>
*           <td>string</td>
*           <td>The SQL representation of the level member key values.</td>
*           <td>No</td>
*           <td>Yes</td>
*       </tr>
*       <tr>
*           <td>LEVEL_UNIQUE_NAME_SQL_COLUMN_NAME</td>
*           <td>string</td>
*           <td>The SQL representation of the member unique names.</td>
*           <td>No</td>
*           <td>Yes</td>
*       </tr>
*       <tr>
*           <td>LEVEL_ATTRIBUTE_HIERARCHY_NAME</td>
*           <td>string</td>
*            <td>The name of the attribute hierarchy providing the source of the level.</td>
*           <td>No</td>
*           <td>Yes</td>
*       </tr>
*       <tr>
*           <td>LEVEL_KEY_CARDINALITY</td>
*           <td>int</td>
*            <td>The number of columns in the level key.</td>
*           <td>No</td>
*           <td>Yes</td>
*       </tr>
*       <tr>
*           <td>LEVEL_ORIGIN</td>
*           <td>int</td>
*            <td>A bit map that defines how the level was sourced:MD_ORIGIN_USER_DEFINED identifies levels in a user defined hierarchy.MD_ORIGIN_ATTRIBUTE identifies levels in an attribute hierarchy.MD_ORIGIN_KEY_ATTRIBUTE identifies levels in a key attribute hierarchy.MD_ORIGIN_INTERNAL identifies levels in attribute hierarchies that are not enabled.</td>
*           <td>No</td>
*           <td>Yes</td>
*       </tr>
*   </table>
*   @method discoverMDLevels
*   @param {Object} options An object whose properties convey the options for the XML/A a <code>MDSCHEMA_LEVELS</code> request.
*   @return {Xmla.Rowset} The result of the invoking the XML/A <code>Discover</code> method. For synchronous requests, an instance of a <code><a href="Xmla.Rowset.html#Xmla.Rowset">Xmla.Rowset</a></code> that represents the <code>MDSCHEMA_LEVELS</code> schema rowset. For an asynchronous request, the return value is not defined: you should add a listener (see: <code><a href="#method_addListener">addListener()</a></code>) and listen for the <code>success</code> (see: <code><a href="#property_EVENT_SUCCESS">EVENT_SUCCESS</a></code>) or <code>discoversuccess</code> (see: <code><a href="#property_EVENT_DISCOVER_SUCCESS">EVENT_DISCOVER_SUCCESS</a></code>) events.
*/
    discoverMDLevels: function(options){
        var request = _applyProps(
            options,
            {
                requestType: Xmla.MDSCHEMA_LEVELS
            },
            true
        );
        return this.discover(request);
    },
/**
*   Invokes the <code><a href="#method_discover">discover()</a></code> method using
*   <code><a href="#property_MDSCHEMA_MEASURES"></a></code> as value for the <code>requestType</code>,
*   and retrieves the <code>MDSCHEMA_MEASURES</code> schema rowset.
*   ...todo...
*   The rowset has the following columns:
*   <table border="1" class="schema-rowset">
*       <tr>
*           <th>Column Name</th>
*           <th>Type</th>
*           <th>Description</th>
*           <th>Restriction</th>
*           <th>Nullable</th>
*       </tr>
*       <tr>
*           <td>CATALOG_NAME</td>
*           <td>string</td>
*           <td>Name of the catalog</td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>SCHEMA_NAME</td>
*           <td>string</td>
*           <td>Not supported</td>
*           <td>Yes</td>
*           <td>Yes</td>
*       </tr>
*       <tr>
*           <td>CUBE_NAME</td>
*           <td>string</td>
*           <td>Name of the cube.</td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>MEASURE_NAME</td>
*           <td>string</td>
*           <td>Name of the cube.</td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>MEASURE_UNIQUE_NAME</td>
*           <td>string</td>
*           <td>Name of the cube.</td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>MEASURE_CAPTION</td>
*           <td>string</td>
*           <td>Name of the cube.</td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>MEASURE_GUID</td>
*           <td>string</td>
*           <td>Name of the cube.</td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>MEASURE_AGGREGATOR</td>
*           <td>string</td>
*           <td>Name of the cube.</td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>DATA_TYPE</td>
*           <td>string</td>
*           <td>Name of the cube.</td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>NUMERIC_PRECISION</td>
*           <td>int</td>
*           <td>Name of the cube.</td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>NUMERIC_SCALE</td>
*           <td>int</td>
*           <td>Name of the cube.</td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>DESCRIPTION</td>
*           <td>string</td>
*           <td>Name of the cube.</td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>EXPRESSION</td>
*           <td>string</td>
*           <td>Name of the cube.</td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>MEASURE_IS_VISIBLE</td>
*           <td>boolean</td>
*           <td>Name of the cube.</td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>LEVELS_LIST</td>
*           <td>string</td>
*           <td>Name of the cube.</td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>MEASURE_NAME_SQL_COLUMN_NAME</td>
*           <td>string</td>
*           <td>Name of the cube.</td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>MEASURE_UNQUALIFIED_CAPTION</td>
*           <td>string</td>
*           <td>Name of the cube.</td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>MEASUREGROUP_NAME</td>
*           <td>string</td>
*           <td>Name of the cube.</td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>MEASURE_DISPLAY_FOLDER</td>
*           <td>string</td>
*           <td>Name of the cube.</td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>DEFAULT_FORMAT_STRING</td>
*           <td>string</td>
*           <td>Name of the cube.</td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*   </table>
*   @method discoverMDMeasures
*   @param {Object} options An object whose properties convey the options for the XML/A a <code>MDSCHEMA_MEASURES</code> request.
*   @return {Xmla.Rowset} The result of the invoking the XML/A <code>Discover</code> method. For synchronous requests, an instance of a <code><a href="Xmla.Rowset.html#Xmla.Rowset">Xmla.Rowset</a></code> that represents the <code>MDSCHEMA_MEASURES</code> schema rowset. For an asynchronous request, the return value is not defined: you should add a listener (see: <code><a href="#method_addListener">addListener()</a></code>) and listen for the <code>success</code> (see: <code><a href="#property_EVENT_SUCCESS">EVENT_SUCCESS</a></code>) or <code>discoversuccess</code> (see: <code><a href="#property_EVENT_DISCOVER_SUCCESS">EVENT_DISCOVER_SUCCESS</a></code>) events.
*/
    discoverMDMeasures: function(options){
        var request = _applyProps(
            options,
            {
                requestType: Xmla.MDSCHEMA_MEASURES
            },
            true
        );
        return this.discover(request);
    },
/**
*   Invokes the <code><a href="#method_discover">discover()</a></code> method using
*   <code><a href="#property_MDSCHEMA_MEMBERS"></a></code> as value for the <code>requestType</code>,
*   and retrieves the <code>MDSCHEMA_MEMBERS</code> schema rowset.
*   The rowset has the following columns:
*   <table border="1" class="schema-rowset">
*       <tr>
*           <th>Column Name</th>
*           <th>Type</th>
*           <th>Description</th>
*           <th>Restriction</th>
*           <th>Nullable</th>
*       </tr>
*       <tr>
*           <td>CATALOG_NAME</td>
*           <td>string</td>
*           <td>The name of the catalog</td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>SCHEMA_NAME</td>
*           <td>string</td>
*           <td>The name of the schema</td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>CUBE_NAME</td>
*           <td>string</td>
*           <td>The name of the cube</td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>DIMENSION_UNIQUE_NAME</td>
*           <td>string</td>
*           <td>The unique name of the dimension</td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>HIERARCHY_UNIQUE_NAME</td>
*           <td>string</td>
*           <td>The unique name of the hierarchy</td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>LEVEL_UNIQUE_NAME</td>
*           <td>string</td>
*           <td>The unique name of the level</td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>LEVEL_NUMBERr</td>
*           <td>int</td>
*           <td>Distance of this level to the root</td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>MEMBER_ORDINAL</td>
*           <td>int</td>
*           <td>Deprecated: always 0</td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>MEMBER_NAME</td>
*           <td>string</td>
*           <td>The name of this member</td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>MEMBER_UNIQUE_NAME</td>
*           <td>string</td>
*           <td>The unique name of this member</td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>MEMBER_TYPE</td>
*           <td>int</td>
*           <td>An integer constant indicating the type of this member. Can take on one of the following values:
*               <ul>
*                   <li><a href="Xmla.Rowset.html#property_MDMEMBER_TYPE_REGULAR">MDMEMBER_TYPE_REGULAR</a></li>
*                   <li><a href="Xmla.Rowset.html#property_MDMEMBER_TYPE_ALL">MDMEMBER_TYPE_ALL</a></li>
*                   <li><a href="Xmla.Rowset.html#property_MDMEMBER_TYPE_MEASURE">MDMEMBER_TYPE_MEASURE</a></li>
*                   <li><a href="Xmla.Rowset.html#property_MDMEMBER_TYPE_FORMULA">MDMEMBER_TYPE_FORMULA</a></li>
*                   <li><a href="Xmla.Rowset.html#property_MDMEMBER_TYPE_UNKNOWN">MDMEMBER_TYPE_UNKNOWN</a></li>
*                   <li><a href="Xmla.Rowset.html#property_MDMEMBER_TYPE_FORMULA">MDMEMBER_TYPE_FORMULA</a></li>
*               </ul>
*           </td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>MEMBER_GUID</td>
*           <td>string</td>
*           <td>The guid of this member</td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>MEMBER_CAPTION</td>
*           <td>string</td>
*           <td>A label or caption associated with the member. Used primarily for display purposes. If a caption does not exist, MEMBER_NAME is returned.</td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>CHILDREN_CARDINALITY</td>
*           <td>int</td>
*           <td>The number of childrend for this member</td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>PARENT_LEVEL</td>
*           <td>int</td>
*           <td>The distance of the member's parent from the root level of the hierarchy. The root level is zero (0).</td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>DESCRIPTION</td>
*           <td>string</td>
*           <td>This column always returns a NULL value. This column exists for backwards compatibility</td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>EXPRESSION</td>
*           <td>string</td>
*           <td>The expression for calculations, if the member is of type MDMEMBER_TYPE_FORMULA.</td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*       <tr>
*           <td>MEMBER_KEY</td>
*           <td>string</td>
*           <td>The value of the member's key column. Returns NULL if the member has a composite key.</td>
*           <td>Yes</td>
*           <td>No</td>
*       </tr>
*   </table>
*   @method discoverMDMembers
*   @param {Object} options An object whose properties convey the options for the XML/A a <code>MDSCHEMA_MEMBERS</code> request.
*   @return {Xmla.Rowset} The result of the invoking the XML/A <code>Discover</code> method. For synchronous requests, an instance of a <code><a href="Xmla.Rowset.html#Xmla.Rowset">Xmla.Rowset</a></code> that represents the <code>MDSCHEMA_MEMBERS</code> schema rowset. For an asynchronous request, the return value is not defined: you should add a listener (see: <code><a href="#method_addListener">addListener()</a></code>) and listen for the <code>success</code> (see: <code><a href="#property_EVENT_SUCCESS">EVENT_SUCCESS</a></code>) or <code>discoversuccess</code> (see: <code><a href="#property_EVENT_DISCOVER_SUCCESS">EVENT_DISCOVER_SUCCESS</a></code>) events.
*/
    discoverMDMembers: function(options){
        var request = _applyProps(
            options,
            {
                requestType: Xmla.MDSCHEMA_MEMBERS
            },
            true
        );
        return this.discover(request);
    },
/**
*   Invokes the <code><a href="#method_discover">discover()</a></code> method using
*   <code><a href="#property_MDSCHEMA_PROPERTIES"></a></code> as value for the <code>requestType</code>,
*   and retrieves the <code>MDSCHEMA_PROPERTIES</code> schema rowset.
*   ...todo...
*   The rowset has the following columns:
*   <table border="1" class="schema-rowset">
*       <tr>
*           <th>Column Name</th>
*           <th>Type</th>
*           <th>Description</th>
*           <th>Restriction</th>
*           <th>Nullable</th>
*       </tr>
*   </table>
*   @method discoverMDProperties
*   @param {Object} options An object whose properties convey the options for the XML/A a <code>MDSCHEMA_PROPERTIES</code> request.
*   @return {Xmla.Rowset} The result of the invoking the XML/A <code>Discover</code> method. For synchronous requests, an instance of a <code><a href="Xmla.Rowset.html#Xmla.Rowset">Xmla.Rowset</a></code> that represents the <code>MDSCHEMA_PROPERTIES</code> schema rowset. For an asynchronous request, the return value is not defined: you should add a listener (see: <code><a href="#method_addListener">addListener()</a></code>) and listen for the <code>success</code> (see: <code><a href="#property_EVENT_SUCCESS">EVENT_SUCCESS</a></code>) or <code>discoversuccess</code> (see: <code><a href="#property_EVENT_DISCOVER_SUCCESS">EVENT_DISCOVER_SUCCESS</a></code>) events.
*/
    discoverMDProperties: function(options){
        var request = _applyProps(
            options,
            {
                requestType: Xmla.MDSCHEMA_PROPERTIES
            },
            true
        );
        return this.discover(request);
    },
/**
*   Invokes the <code><a href="#method_discover">discover()</a></code> method using
*   <code><a href="#property_MDSCHEMA_SETS"></a></code> as value for the <code>requestType</code>,
*   and retrieves the <code>MDSCHEMA_SETS</code> schema rowset.
*   ...todo...
*   The rowset has the following columns:
*   <table border="1" class="schema-rowset">
*       <tr>
*           <th>Column Name</th>
*           <th>Type</th>
*           <th>Description</th>
*           <th>Restriction</th>
*           <th>Nullable</th>
*       </tr>
*   </table>
*   @method discoverMDSets
*   @param {Object} options An object whose properties convey the options for the XML/A a <code>MDSCHEMA_SETS</code> request.
*   @return {Xmla.Rowset} The result of the invoking the XML/A <code>Discover</code> method. For synchronous requests, an instance of a <code><a href="Xmla.Rowset.html#Xmla.Rowset">Xmla.Rowset</a></code> that represents the <code>MDSCHEMA_SETS</code> schema rowset. For an asynchronous request, the return value is not defined: you should add a listener (see: <code><a href="#method_addListener">addListener()</a></code>) and listen for the <code>success</code> (see: <code><a href="#property_EVENT_SUCCESS">EVENT_SUCCESS</a></code>) or <code>discoversuccess</code> (see: <code><a href="#property_EVENT_DISCOVER_SUCCESS">EVENT_DISCOVER_SUCCESS</a></code>) events.
*/
    discoverMDSets: function(options){
        var request = _applyProps(
            options,
            {
                requestType: Xmla.MDSCHEMA_SETS
            },
            true
        );
        return this.discover(request);
    }
};

function _getComplexType(node, name){
    var types = _getElementsByTagNameNS(
            node, _xmlnsSchema, _xmlnsSchemaPrefix, "complexType"
        ),
        numTypes = types.length,
        type, i
    ;
    for (i=0; i<numTypes; i ++){
        type = types.item(i);
        if (type.getAttribute("name")===name) return type;
    }
    return null;
}

/**
*   <p>
*   This class implements an XML/A Rowset object.
*   </p>
*   <p>
*   You do not need to instantiate objects of this class yourself.
*   Rather, the <code><a href="Xmla.html#class_Xmla">Xmla</a></code> class will instantiate this class to convey the result of any of the various <code>discoverXXX()</code> methods
*   (see <code><a href="Xmla.html#method_discover">discover()</a></code>).
*   In addition, this class is also used to instantiate a Resultset for the
*   <code><a name="Xmla.html#method_execute">execute()</code> method in case the
*   <code>Format</code> property is set to <code>Tabular</code>
*   (see <code><a name="Xmla.html#property_OPTION_FORMAT">OPTION_FORMAT</a></code> and <code><a name="Xmla.html#property_OPTION_FORMAT_TABULAR">OPTION_FORMAT_TABULAR</a></code>).
*   The <code><a href="Xmla.html#method_request">request()</a></code> method itself will also return an instance of this class in case the <code>method</code> is used to do a
*   <code>Discover</code> request, or in case it is used to do a <code>Execute</code> request and the <code>Format</code> property is set to <code>Tabular</code>.
*   </p>
*   <p>
*   An instance of the <code>Xmla.Rowset</code> class is returned immediately as return value from the <code>disoverXXX()</code> or <code>execute()</code> method when doing a synchronous request.
*   In addition, the rowset is available in the eventdata passed to any registered listeners
*   (see <code><a href="Xmla.html#method_addListener">addListener()</a></code>).
*   Note that for asynchronous requests, the only way to obtain the returned <code>Rowset</code> instance is through the listeners.
*   </p>
*
*   @class Xmla.Rowset
*   @constructor
*   @param {DOMDocument} node The responseXML result returned by server in response to a <code>Discover</code> request.
*   @param {string} requestTtype The requestType identifying the particular schema rowset to construct. This facilitates implementing field getters for a few complex types.
*   @param {Xmla} xmla The Xmla instance that created this Rowset. This is mainly used to allow the Rowset to access the options passed to the Xmla constructor.
*/
Xmla.Rowset = function (node, requestType, xmla){
    this._node = node;
    this._type = requestType;
    this._xmla = xmla;
    this._initData();
    return this;
};

/**
*   A possible value for the <code>DIMENSION_TYPE</code> column that appears in the
*   <code>MDSCHEMA_DIMENSIONS</code> (See: <code><a href="Xmla.html#method_discoverMDDimensions">discoverMDDimensions()</a></code>) and
*   <code>MDSCHEMA_HIERARCHIES</code> (See: <code><a href="Xmla.html#method_discoverMDHierarchies">discoverMDHierarchies()</a></code>)rowsets.
*
*   @property MD_DIMTYPE_UNKNOWN
*   @static
*   @final
*   @type int
*   @default <code>0</code>
*/
Xmla.Rowset.MD_DIMTYPE_UNKNOWN = 0;
/**
*   A possible value for the <code>DIMENSION_TYPE</code> column that appears in the
*   <code>MDSCHEMA_DIMENSIONS</code> (See: <code><a href="Xmla.html#method_discoverMDDimensions">discoverMDDimensions()</a></code>) and
*   <code>MDSCHEMA_HIERARCHIES</code> (See: <code><a href="Xmla.html#method_discoverMDHierarchies">discoverMDHierarchies()</a></code>)rowsets.
*
*   @property MD_DIMTYPE_TIME
*   @static
*   @final
*   @type int
*   @default <code>1</code>
*/
Xmla.Rowset.MD_DIMTYPE_TIME = 1;
/**
*   A possible value for the <code>DIMENSION_TYPE</code> column that appears in the
*   <code>MDSCHEMA_DIMENSIONS</code> (See: <code><a href="Xmla.html#method_discoverMDDimensions">discoverMDDimensions()</a></code>) and
*   <code>MDSCHEMA_HIERARCHIES</code> (See: <code><a href="Xmla.html#method_discoverMDHierarchies">discoverMDHierarchies()</a></code>)rowsets.
*
*   @property MD_DIMTYPE_MEASURE
*   @static
*   @final
*   @type int
*   @default <code>2</code>
*/
Xmla.Rowset.MD_DIMTYPE_MEASURE = 2;
/**
*   A possible value for the <code>DIMENSION_TYPE</code> column that appears in the
*   <code>MDSCHEMA_DIMENSIONS</code> (See: <code><a href="Xmla.html#method_discoverMDDimensions">discoverMDDimensions()</a></code>) and
*   <code>MDSCHEMA_HIERARCHIES</code> (See: <code><a href="Xmla.html#method_discoverMDHierarchies">discoverMDHierarchies()</a></code>)rowsets.
*
*   @property MD_DIMTYPE_OTHER
*   @static
*   @final
*   @type int
*   @default <code>3</code>
*/
Xmla.Rowset.MD_DIMTYPE_OTHER = 3;
/**
*   A possible value for the <code>DIMENSION_TYPE</code> column that appears in the
*   <code>MDSCHEMA_DIMENSIONS</code> (See: <code><a href="Xmla.html#method_discoverMDDimensions">discoverMDDimensions()</a></code>) and
*   <code>MDSCHEMA_HIERARCHIES</code> (See: <code><a href="Xmla.html#method_discoverMDHierarchies">discoverMDHierarchies()</a></code>)rowsets.
*
*   @property MD_DIMTYPE_QUANTITATIVE
*   @static
*   @final
*   @type int
*   @default <code>5</code>
*/
Xmla.Rowset.MD_DIMTYPE_QUANTITATIVE = 5;
/**
*   A possible value for the <code>DIMENSION_TYPE</code> column that appears in the
*   <code>MDSCHEMA_DIMENSIONS</code> (See: <code><a href="Xmla.html#method_discoverMDDimensions">discoverMDDimensions()</a></code>) and
*   <code>MDSCHEMA_HIERARCHIES</code> (See: <code><a href="Xmla.html#method_discoverMDHierarchies">discoverMDHierarchies()</a></code>)rowsets.
*
*   @property MD_DIMTYPE_ACCOUNTS
*   @static
*   @final
*   @type int
*   @default <code>6</code>
*/
Xmla.Rowset.MD_DIMTYPE_ACCOUNTS = 6;
/**
*   A possible value for the <code>DIMENSION_TYPE</code> column that appears in the
*   <code>MDSCHEMA_DIMENSIONS</code> (See: <code><a href="Xmla.html#method_discoverMDDimensions">discoverMDDimensions()</a></code>) and
*   <code>MDSCHEMA_HIERARCHIES</code> (See: <code><a href="Xmla.html#method_discoverMDHierarchies">discoverMDHierarchies()</a></code>)rowsets.
*
*   @property MD_DIMTYPE_CUSTOMERS
*   @static
*   @final
*   @type int
*   @default <code>7</code>
*/
Xmla.Rowset.MD_DIMTYPE_CUSTOMERS = 7;
/**
*   A possible value for the <code>DIMENSION_TYPE</code> column that appears in the
*   <code>MDSCHEMA_DIMENSIONS</code> (See: <code><a href="Xmla.html#method_discoverMDDimensions">discoverMDDimensions()</a></code>) and
*   <code>MDSCHEMA_HIERARCHIES</code> (See: <code><a href="Xmla.html#method_discoverMDHierarchies">discoverMDHierarchies()</a></code>)rowsets.
*
*   @property MD_DIMTYPE_PRODUCTS
*   @static
*   @final
*   @type int
*   @default <code>8</code>
*/
Xmla.Rowset.MD_DIMTYPE_PRODUCTS = 8;
/**
*   A possible value for the <code>DIMENSION_TYPE</code> column that appears in the
*   <code>MDSCHEMA_DIMENSIONS</code> (See: <code><a href="Xmla.html#method_discoverMDDimensions">discoverMDDimensions()</a></code>) and
*   <code>MDSCHEMA_HIERARCHIES</code> (See: <code><a href="Xmla.html#method_discoverMDHierarchies">discoverMDHierarchies()</a></code>)rowsets.
*
*   @property MD_DIMTYPE_SCENARIO
*   @static
*   @final
*   @type int
*   @default <code>9</code>
*/
Xmla.Rowset.MD_DIMTYPE_SCENARIO = 9;
/**
*   A possible value for the <code>DIMENSION_TYPE</code> column that appears in the
*   <code>MDSCHEMA_DIMENSIONS</code> (See: <code><a href="Xmla.html#method_discoverMDDimensions">discoverMDDimensions()</a></code>) and
*   <code>MDSCHEMA_HIERARCHIES</code> (See: <code><a href="Xmla.html#method_discoverMDHierarchies">discoverMDHierarchies()</a></code>)rowsets.
*
*   @property MD_DIMTYPE_UTILIY
*   @static
*   @final
*   @type int
*   @default <code>10</code>
*/
Xmla.Rowset.MD_DIMTYPE_UTILIY = 10;
/**
*   A possible value for the <code>DIMENSION_TYPE</code> column that appears in the
*   <code>MDSCHEMA_DIMENSIONS</code> (See: <code><a href="Xmla.html#method_discoverMDDimensions">discoverMDDimensions()</a></code>) and
*   <code>MDSCHEMA_HIERARCHIES</code> (See: <code><a href="Xmla.html#method_discoverMDHierarchies">discoverMDHierarchies()</a></code>)rowsets.
*
*   @property MD_DIMTYPE_CURRENCY
*   @static
*   @final
*   @type int
*   @default <code>11</code>
*/
Xmla.Rowset.MD_DIMTYPE_CURRENCY = 11;
/**
*   A possible value for the <code>DIMENSION_TYPE</code> column that appears in the
*   <code>MDSCHEMA_DIMENSIONS</code> (See: <code><a href="Xmla.html#method_discoverMDDimensions">discoverMDDimensions()</a></code>) and
*   <code>MDSCHEMA_HIERARCHIES</code> (See: <code><a href="Xmla.html#method_discoverMDHierarchies">discoverMDHierarchies()</a></code>)rowsets.
*
*   @property MD_DIMTYPE_RATES
*   @static
*   @final
*   @type int
*   @default <code>12</code>
*/
Xmla.Rowset.MD_DIMTYPE_RATES = 12;
/**
*   A possible value for the <code>DIMENSION_TYPE</code> column that appears in the
*   <code>MDSCHEMA_DIMENSIONS</code> (See: <code><a href="Xmla.html#method_discoverMDDimensions">discoverMDDimensions()</a></code>) and
*   <code>MDSCHEMA_HIERARCHIES</code> (See: <code><a href="Xmla.html#method_discoverMDHierarchies">discoverMDHierarchies()</a></code>)rowsets.
*
*   @property MD_DIMTYPE_CHANNEL
*   @static
*   @final
*   @type int
*   @default <code>13</code>
*/
Xmla.Rowset.MD_DIMTYPE_CHANNEL = 13;
/**
*   A possible value for the <code>DIMENSION_TYPE</code> column that appears in the
*   <code>MDSCHEMA_DIMENSIONS</code> (See: <code><a href="Xmla.html#method_discoverMDDimensions">discoverMDDimensions()</a></code>) and
*   <code>MDSCHEMA_HIERARCHIES</code> (See: <code><a href="Xmla.html#method_discoverMDHierarchies">discoverMDHierarchies()</a></code>)rowsets.
*
*   @property MD_DIMTYPE_PROMOTION
*   @static
*   @final
*   @type int
*   @default <code>14</code>
*/
Xmla.Rowset.MD_DIMTYPE_PROMOTION = 14;
/**
*   A possible value for the <code>DIMENSION_TYPE</code> column that appears in the
*   <code>MDSCHEMA_DIMENSIONS</code> (See: <code><a href="Xmla.html#method_discoverMDDimensions">discoverMDDimensions()</a></code>) and
*   <code>MDSCHEMA_HIERARCHIES</code> (See: <code><a href="Xmla.html#method_discoverMDHierarchies">discoverMDHierarchies()</a></code>)rowsets.
*
*   @property MD_DIMTYPE_ORGANIZATION
*   @static
*   @final
*   @type int
*   @default <code>15</code>
*/
Xmla.Rowset.MD_DIMTYPE_ORGANIZATION = 15;
/**
*   A possible value for the <code>DIMENSION_TYPE</code> column that appears in the
*   <code>MDSCHEMA_DIMENSIONS</code> (See: <code><a href="Xmla.html#method_discoverMDDimensions">discoverMDDimensions()</a></code>) and
*   <code>MDSCHEMA_HIERARCHIES</code> (See: <code><a href="Xmla.html#method_discoverMDHierarchies">discoverMDHierarchies()</a></code>)rowsets.
*
*   @property MD_DIMTYPE_BILL_OF_MATERIALS
*   @static
*   @final
*   @type int
*   @default <code>16</code>
*/
Xmla.Rowset.MD_DIMTYPE_BILL_OF_MATERIALS = 16;
/**
*   A possible value for the <code>DIMENSION_TYPE</code> column that appears in the
*   <code>MDSCHEMA_DIMENSIONS</code> (See: <code><a href="Xmla.html#method_discoverMDDimensions">discoverMDDimensions()</a></code>) and
*   <code>MDSCHEMA_HIERARCHIES</code> (See: <code><a href="Xmla.html#method_discoverMDHierarchies">discoverMDHierarchies()</a></code>)rowsets.
*
*   @property MD_DIMTYPE_GEOGRAPHY
*   @static
*   @final
*   @type int
*   @default <code>17</code>
*/
Xmla.Rowset.MD_DIMTYPE_GEOGRAPHY = 17;

/**
*    A possible value for the <code>STRUCTURE</code> column of the
*   <code>MDSCHEMA_HIERARCHIES</code> (See: <code><a href="Xmla.html#method_discoverMDHierarchies">discoverMDHierarchies()</a></code>)rowset.
*    @property MD_STRUCTURE_FULLYBALANCED
*   @static
*   @final
*   @type int
*   @default <code>0</code>
*/
Xmla.Rowset.MD_STRUCTURE_FULLYBALANCED = 0;
/**
*    A possible value for the <code>STRUCTURE</code> column of the
*   <code>MDSCHEMA_HIERARCHIES</code> (See: <code><a href="Xmla.html#method_discoverMDHierarchies">discoverMDHierarchies()</a></code>)rowset.
*    @property MD_STRUCTURE_RAGGEDBALANCED
*   @static
*   @final
*   @type int
*   @default <code>1</code>
*/
Xmla.Rowset.MD_STRUCTURE_RAGGEDBALANCED = 1;
/**
*    A possible value for the <code>STRUCTURE</code> column of the
*   <code>MDSCHEMA_HIERARCHIES</code> (See: <code><a href="Xmla.html#method_discoverMDHierarchies">discoverMDHierarchies()</a></code>)rowset.
*    @property MD_STRUCTURE_UNBALANCED
*   @static
*   @final
*   @type int
*   @default <code>2</code>
*/
Xmla.Rowset.MD_STRUCTURE_UNBALANCED = 2;
/**
*    A possible value for the <code>STRUCTURE</code> column of the
*   <code>MDSCHEMA_HIERARCHIES</code> (See: <code><a href="Xmla.html#method_discoverMDHierarchies">discoverMDHierarchies()</a></code>)rowset.
*    @property MD_STRUCTURE_NETWORK
*   @static
*   @final
*   @type int
*   @default <code>3</code>
*/
Xmla.Rowset.MD_STRUCTURE_NETWORK = 3;

/**
*    A  bitmap value for the <code>HIERARCHY_ORIGIN</code> column of the
*   <code>MDSCHEMA_HIERARCHIES</code> (See: <code><a href="Xmla.html#method_discoverMDHierarchies">discoverMDHierarchies()</a></code>)rowset.
*    Identifies user defined hierarchies.
*    @property MD_USER_DEFINED
*   @static
*   @final
*   @type int
*   @default <code>1</code>
*/
Xmla.Rowset.MD_USER_DEFINED = 1
/**
*    A  bitmap value for the <code>HIERARCHY_ORIGIN</code> column of the
*   <code>MDSCHEMA_HIERARCHIES</code> (See: <code><a href="Xmla.html#method_discoverMDHierarchies">discoverMDHierarchies()</a></code>)rowset.
*    identifies attribute hierarchies.
*    @property MD_SYSTEM_ENABLED
*   @static
*   @final
*   @type int
*   @default <code>2</code>
*/
Xmla.Rowset.MD_SYSTEM_ENABLED = 2
/**
*    A  bitmap value for the <code>HIERARCHY_ORIGIN</code> column of the
*   <code>MDSCHEMA_HIERARCHIES</code> (See: <code><a href="Xmla.html#method_discoverMDHierarchies">discoverMDHierarchies()</a></code>)rowset.
*    identifies attributes with no attribute hierarchies.
*    @property MD_SYSTEM_INTERNAL
*   @static
*   @final
*   @type int
*   @default <code>4</code>
*/
Xmla.Rowset.MD_SYSTEM_INTERNAL = 4

/**
*   A possible value for the <code>MEMBER_TYPE</code> column of the
*   <code>MDSCHEMA_MEMBERS</code> rowset (see: <code><a href="Xmla.html#method_discoverMDMembers">discoverMDMembers()</a></code>),
*   indicating a regular member.
*    @property MDMEMBER_TYPE_REGULAR
*   @static
*   @final
*   @type int
*   @default <code>1</code>
*/
Xmla.Rowset.MDMEMBER_TYPE_REGULAR = 1;
/**
*   A possible value for the <code>MEMBER_TYPE</code> column of the
*   <code>MDSCHEMA_MEMBERS</code> rowset (see: <code><a href="Xmla.html#method_discoverMDMembers">discoverMDMembers()</a></code>),
*   indicating an all member.
*    @property MDMEMBER_TYPE_ALL
*   @static
*   @final
*   @type int
*   @default <code>2</code>
*/
Xmla.Rowset.MDMEMBER_TYPE_ALL = 2;
/**
*   A possible value for the <code>MEMBER_TYPE</code> column of the
*   <code>MDSCHEMA_MEMBERS</code> rowset (see: <code><a href="Xmla.html#method_discoverMDMembers">discoverMDMembers()</a></code>),
*   indicating a formula member.
*    @property MDMEMBER_TYPE_FORMULA
*   @static
*   @final
*   @type int
*   @default <code>3</code>
*/
Xmla.Rowset.MDMEMBER_TYPE_FORMULA = 3;
/**
*   A possible value for the <code>MEMBER_TYPE</code> column of the
*   <code>MDSCHEMA_MEMBERS</code> rowset (see: <code><a href="Xmla.html#method_discoverMDMembers">discoverMDMembers()</a></code>),
*   indicating a measure member.
*    @property MDMEMBER_TYPE_MEASURE
*   @static
*   @final
*   @type int
*   @default <code>4</code>
*/
Xmla.Rowset.MDMEMBER_TYPE_MEASURE = 4;
/**
*   A possible value for the <code>MEMBER_TYPE</code> column of the
*   <code>MDSCHEMA_MEMBERS</code> rowset (see: <code><a href="Xmla.html#method_discoverMDMembers">discoverMDMembers()</a></code>),
*   indicating a member of unknown type
*    @property MDMEMBER_TYPE_UNKNOWN
*   @static
*   @final
*   @type int
*   @default <code>0</code>
*/
Xmla.Rowset.MDMEMBER_TYPE_UNKNOWN = 0;

Xmla.Rowset.KEYS = {};
Xmla.Rowset.KEYS[Xmla.DBSCHEMA_CATALOGS] = ["CATALOG_NAME"];
Xmla.Rowset.KEYS[Xmla.DBSCHEMA_COLUMNS] = ["TABLE_CATALOG", "TABLE_SCHEMA", "TABLE_NAME", "COLUMN_NAME"];
Xmla.Rowset.KEYS[Xmla.DBSCHEMA_PROVIDER_TYPES] = ["TYPE_NAME"];
Xmla.Rowset.KEYS[Xmla.DBSCHEMA_SCHEMATA] = ["CATALOG_NAME", "SCHEMA_NAME"];
Xmla.Rowset.KEYS[Xmla.DBSCHEMA_TABLES] = ["TABLE_CATALOG", "TABLE_SCHEMA", "TABLE_NAME"];
Xmla.Rowset.KEYS[Xmla.DBSCHEMA_TABLES_INFO] = ["TABLE_CATALOG", "TABLE_SCHEMA", "TABLE_NAME"];
Xmla.Rowset.KEYS[Xmla.DISCOVER_DATASOURCES] = ["DataSourceName"];
Xmla.Rowset.KEYS[Xmla.DISCOVER_ENUMERATORS] = ["EnumName", "ElementName"];
Xmla.Rowset.KEYS[Xmla.DISCOVER_KEYWORDS] = ["Keyword"];
Xmla.Rowset.KEYS[Xmla.DISCOVER_LITERALS] = ["LiteralName"];
Xmla.Rowset.KEYS[Xmla.DISCOVER_PROPERTIES] = ["PropertyName"];
Xmla.Rowset.KEYS[Xmla.DISCOVER_SCHEMA_ROWSETS] = ["SchemaName"];
Xmla.Rowset.KEYS[Xmla.MDSCHEMA_ACTIONS] = ["CATALOG_NAME", "SCHEMA_NAME", "CUBE_NAME", "ACTION_NAME"];
Xmla.Rowset.KEYS[Xmla.MDSCHEMA_CUBES] = ["CATALOG_NAME", "SCHEMA_NAME", "CUBE_NAME"];
Xmla.Rowset.KEYS[Xmla.MDSCHEMA_DIMENSIONS] = ["CATALOG_NAME", "SCHEMA_NAME", "CUBE_NAME", "DIMENSION_UNIQUE_NAME"];
Xmla.Rowset.KEYS[Xmla.MDSCHEMA_FUNCTIONS] = ["FUNCTION_NAME", "PARAMETER_LIST"];
Xmla.Rowset.KEYS[Xmla.MDSCHEMA_HIERARCHIES] = ["CATALOG_NAME", "SCHEMA_NAME", "CUBE_NAME", "DIMENSION_UNIQUE_NAME", "HIERARCHY_UNIQUE_NAME"];
Xmla.Rowset.KEYS[Xmla.MDSCHEMA_LEVELS] = ["CATALOG_NAME", "SCHEMA_NAME", "CUBE_NAME", "DIMENSION_UNIQUE_NAME", "HIERARCHY_UNIQUE_NAME", "LEVEL_UNIQUE_NAME"];
Xmla.Rowset.KEYS[Xmla.MDSCHEMA_MEASURES] = ["CATALOG_NAME", "SCHEMA_NAME", "CUBE_NAME", "MEASURE_NAME"];
Xmla.Rowset.KEYS[Xmla.MDSCHEMA_MEMBERS] = ["CATALOG_NAME", "SCHEMA_NAME", "CUBE_NAME", "DIMENSION_UNIQUE_NAME", "HIERARCHY_UNIQUE_NAME", "LEVEL_UNIQUE_NAME", "MEMBER_UNIQUE_NAME"];
Xmla.Rowset.KEYS[Xmla.MDSCHEMA_PROPERTIES] = ["CATALOG_NAME", "SCHEMA_NAME", "CUBE_NAME", "DIMENSION_UNIQUE_NAME", "HIERARCHY_UNIQUE_NAME", "LEVEL_UNIQUE_NAME", "MEMBER_UNIQUE_NAME", "PROPERTY_NAME"];
Xmla.Rowset.KEYS[Xmla.MDSCHEMA_SETS] = ["CATALOG_NAME", "SCHEMA_NAME", "CUBE_NAME", "SET_NAME"];


function _boolConverter(val){
    return val==="true"?true:false;
}
_boolConverter.jsType = "boolean";

function _intConverter(val){
    return parseInt(val, 10);
}
_intConverter.jsType = "number";

function _floatConverter(val){
    return parseFloat(val, 10);
}
_floatConverter.jsType = "number";

function _textConverter (val){
    return val;
}
_textConverter.jsType = "string";

function _dateTimeConverter (val){
    return Date.parse(val);
}
_dateTimeConverter.jsType = "object";

function _restrictionsConverter(val){
    return val;
}
_restrictionsConverter.jsType = "object";

function _arrayConverter(nodes, valueConverter){
    var arr = [],
        n = nodes.length,
        i, node
    ;
    for (i = 0; i < n; i++){
        node = nodes.item(i);
        arr.push(valueConverter(_getElementText(node)));
    }
    return arr;
}
_arrayConverter.jsType = "object";

var _typeConverterMap = {
    "xsd:boolean": _boolConverter,
    "xsd:decimal": _floatConverter,
    "xsd:double": _floatConverter,
    "xsd:float": _floatConverter,
    "xsd:int": _intConverter,
    "xsd:integer": _intConverter,
    "xsd:nonPositiveInteger": _intConverter,
    "xsd:negativeInteger": _intConverter,
    "xsd:nonNegativeInteger": _intConverter,
    "xsd:positiveInteger": _intConverter,
    "xsd:short": _intConverter,
    "xsd:byte": _intConverter,
    "xsd:long": _intConverter,
    "xsd:unsignedLong": _intConverter,
    "xsd:unsignedInt": _intConverter,
    "xsd:unsignedShort": _intConverter,
    "xsd:unsignedByte": _intConverter,
    "xsd:string": _textConverter,
    "xsd:dateTime": _dateTimeConverter,
    "Restrictions": _restrictionsConverter
}

function _getValueConverter(type){
    var func = _typeConverterMap[type], valueConverter;
    if (!func) {
        func = _textConverter;
    }
    return func;
}

function _getElementValue(el) {
    var txt = _getElementText(el),
        type = _getAttributeNS(el, _xmlnsSchemaInstance, _xmlnsSchemaInstancePrefix, "type"),
        converter
        ;
    if (type){
        converter = _typeConverterMap[type];
        if (converter){
            return converter(txt);
        }
    }
    return txt;
}

function _getterNameForColumnName(columnName){
    //sample: _getterNameForColumnName("DBLITERAL_CATALOG_NAME") returns "getDbLiteralCatalogName"
    return "get" +
           (/^[A-Z]+[a-z]+[A-Za-z]*$/g.test(columnName) ? columnName :
                columnName.charAt(0).toUpperCase() +
                columnName.substr(1).toLowerCase().replace(
                    /_[a-z]/g,
                    function(a){
                        return a.charAt(1).toUpperCase();
                    }
                )
           );
}

Xmla.Rowset.prototype = {
    _node:  null,
    _type: null,
    _row: null,
    _rows: null,
    numRows: null,
    fieldOrder: null,
    fields: null,
    _fieldCount: null,
    _initData: function(){
        this._rows = _getElementsByTagNameNS(this._node, _xmlnsRowset, null, "row");
        this.numRows = this._rows? this._rows.length : 0;
        this.reset();
        this.fieldOrder = [];
        this.fields = {};
        this._fieldCount = 0;
        var rowSchema = _getComplexType(this._node, "row");
        if (rowSchema){
            var seq = _getElementsByTagNameNS(rowSchema, _xmlnsSchema, _xmlnsSchemaPrefix, "sequence").item(0),
                seqChildren = seq.childNodes, numChildren = seqChildren.length, seqChild,
                fieldLabel, fieldName, minOccurs, maxOccurs, type, valueConverter, getter,
                addFieldGetters = this._xmla.options.addFieldGetters, i, val;
            for (i = 0; i < numChildren; i++){
                seqChild = seqChildren.item(i);
                if (seqChild.nodeType !== 1) {  //element node
                    continue;
                }
                fieldLabel = _getAttributeNS(seqChild, _xmlnsSQL, _xmlnsSQLPrefix, "field");
                fieldName = seqChild.getAttribute("name");
                type = seqChild.getAttribute("type");   //get the type from the xsd
                if (type===null && this._row) {           //bummer, not defined there try to get it from xsi:type in the row
                    val = this._row.getElementsByTagName(fieldName);
                    if (val.length){
                        type = _getAttributeNS(
                            val.item(0),
                            _xmlnsSchemaInstance,
                            _xmlnsSchemaInstancePrefix,
                            "type"
                        );
                    }
                }
                if (!type &&
                    this._type==Xmla.DISCOVER_SCHEMA_ROWSETS &&
                    fieldName==="Restrictions"
                ) type = "Restrictions";
                minOccurs = seqChild.getAttribute("minOccurs");
                if (minOccurs) minOccurs = parseInt(minOccurs, 10);
                else minOccurs = 1;
                maxOccurs = seqChild.getAttribute("maxOccurs");
                if (maxOccurs) {
                    if (maxOccurs === "unbounded") maxOccurs = Infinity;
                    else minOccurs=parseInt(maxOccurs,10);
                }
                else maxOccurs = 1;
                valueConverter = _getValueConverter(type);
                getter = this._createFieldGetter(fieldName, valueConverter, minOccurs, maxOccurs);
                if (addFieldGetters) this[_getterNameForColumnName(fieldName)] = getter;
                this.fields[fieldLabel] = {
                    name: fieldName,
                    label: fieldLabel,
                    index: this._fieldCount++,
                    type: type,
                    jsType: valueConverter.jsType,
                    minOccurs: minOccurs,
                    maxOccurs: maxOccurs,
                    getter: getter
                };
                this.fieldOrder.push(fieldLabel);
            }
        }
        else {
            Xmla.Exception._newError(
                "ERROR_PARSING_RESPONSE",
                "Xmla.Rowset",
                this._node
            )._throw();
        }
    },
    _createFieldGetter: function(fieldName, valueConverter, minOccurs, maxOccurs){
        var me = this;
        var getter;
        if (maxOccurs===1) {
            if(minOccurs===1)
                getter = function(){
                    var els = _getElementsByTagNameNS (this._row, _xmlnsRowset, null, fieldName);
                    return valueConverter(_getElementText(els.item(0)));
                };
            else
            if (minOccurs === 0)
                getter = function(){
                    var els = _getElementsByTagNameNS (this._row, _xmlnsRowset, null, fieldName);
                    if (els.length) {
                        return valueConverter(_getElementText(els.item(0)));
                    }
                    else {
                        return null;
                    }
                };
        }
        else
        if(minOccurs === 1)
            getter = function(){
                var els = _getElementsByTagNameNS (this._row, _xmlnsRowset, null, fieldName);
                return _arrayConverter(els, valueConverter);
            };
        else
        if (minOccurs === 0)
            getter = function(){
                var els = _getElementsByTagNameNS (this._row, _xmlnsRowset, null, fieldName);
                if (els.length) {
                    return _arrayConverter(els, valueConverter);
                }
                else {
                    return null;
                }
            };
        return getter;
    },
/**
*   Indicates the type of rowset. In most cases, this will be identical to the <code>requestType</code> value that was used in the
*   <code>Discover</code> request
*
*   @method getType
*   @return <code>int</code> One of the <code>DISCOVER_XXX</code>, <code>DBSCHEMA_XXX</code> or <code>MDSCHEMA_XXX</code> constants
*/
    getType: function(){
        return this._type;
    },
/**
*   Retrieve an array of <code>fieldDef</code> objects that describes the fields of the rows in this rowset.
*   The position of the <code>fieldDef</code> objects in the array corresponds to the column order of the rowset.
*   For a description of the <code>fieldDef</code> object, see the
*   <code><a href="#method_fieldDef">fieldDef()</a></code> method.
*
*   @method getFields
*   @return {[fieldDef]} An (ordered) array of field definition objects.
*/
    getFields: function(){
        var f = [],
            i, n = this._fieldCount,
            fieldOrder = this.fieldOrder
        ;
        for (i = 0; i < n; i++) f[i] = this.fieldDef(fieldOrder[i]);
        return f;
    },
/**
*   Retrieve an array of field names.
*   The position of the names in the array corresponds to the column order of the rowset.
*
*   @method getFieldNames
*   @return {[string]} An (ordered) array of field names.
*/
    getFieldNames: function(){
        var fieldNames = [], i, n = this._fieldCount;
        for (i = 0; i < n; i++) fieldNames[i] = this.fieldOrder[i];
        return fieldNames;
    },
/**
*   Indicates wheter the rowset can still be traversed.
*   You can use this method together with the
*   <code><a href="#method_nextRow">nextRow()</a></code> method
*   to drive a <code>while</code> loop to traverse all rows in the rowset, like so:
    <pre>
&nbsp;while(rowset.hasMoreRows()){
&nbsp;    ...process row...
&nbsp;    rowsete.nextRow();
&nbsp;}
    </pre>
*   @method hasMoreRows
*   @return {bool} true in case there are more rows to traverse. false if all rows have been traversed.
*/
    hasMoreRows: function(){
        return this.numRows > this.rowIndex;
    },
/**
*   Moves the internal row index to the next row.
*   You can use this method together with the
*   <code><a href="#method_next">hasMoreRows()</a></code> method
*   to drive a <code>while</code> loop to traverse all rows in the rowset.
*
*   @method nextRow
*/
    nextRow: function(){
        this.rowIndex++;
        this._row = this._rows.item(this.rowIndex);
        return this.rowIndex;
    },
/**
*   This method is deprecated and may be removed in the future.
*   Use <code><a href="#method_nextRow">nextRow()</a></code> instead.
*   @method next
*/
    next: function(){
        return this.nextRow();
    },
/**
*   <p>Walks through all rows, and calls the callback function for each row.</p>
*
*   <p>The callback function gets passed an object that represents the row.
*   The keys of the row object are the column names, and the values are the respective column values.</p>
*   <p>The scope for calling the callback can be passed  as the second argument to this method.
*   If the scope is not defined (or if it is <code>null</code>), the Rowset's <code>this</code> pointer is used instead.</p>
*   <p>You can pass additional data to the callback by passing in a third argument. This is then passed as is as second argument to the callback.</p>
*
*   <p>The <code>eachRow</code> method will iterate untill the callback returns <code>false</code>, or until all rows have been traversed.
*   If the callback returns <code>false</code>, iteration is aborted and <code>eachRow</code> as a whole returns <code>false</code> too.
*   If iteration is not aborted, then eachRow returns <code>true</code>.</p>
*
*   @method eachRow
*   @param {function()} callback Function to be called for each row.
*   @param {Object} scope Optional. Scope in which the callback is called. Defaults to this, that is, the Rowset.
*   @param {Object} args Optional. Object that is passed as extra argument to the callback.
*   @return {bool} true if all rows were itereated. If the callback returns false, iteration stops and false is returned.
*/
    eachRow: function(rowCallback, scope, args){
        if (_isUnd(scope)) scope = this;
        var mArgs = [null];
        if (!_isUnd(args)) {
            if (!_isArr(args)) args = [args];
            mArgs = mArgs.concat(args);
        }
        while (this.hasMoreRows()){
            mArgs[0] = this.readAsObject();
            if (rowCallback.apply(scope, mArgs)===false) return false;
            this.nextRow();
        }
        return true;
    },
/**
*   Gets the value of the internal row index.
*   Note that no check is performed to ensure this points to a valid row:
*   you should call this function only when it is safe to do so.
*   This can be determined by calling <code><a href="method_hasMoreRows">hasMoreRows()</a></code>.
*
*   @method curr
*   @return int
*/
    currRow: function(){
        return this.rowIndex;
    },
/**
*   Returns the number of rows in the set.
*
*   @method rowCount
*   @return int
*/
    rowCount: function(){
        return this.numRows;
    },
/**
*   Resets the internal row pointer so the resultset can be traversed again.
*
*   @method reset
*/
    reset: function(){
        this.rowIndex = 0;
        this._row = (this.hasMoreRows()) ? this._rows.item(this.rowIndex) : null;
    },
/**
*   Retrieves a <code>fieldDef</code> object by name.
*   A fieldDef describes a field (column). It has the following properties:
*   <dl>
*       <dt>label</dt><dd>string. This is the human readable name for this field. You should use this name for display purposes and for building restrictions. This is also the name used for matching againstt the <code>name</code> argument passed to the <code>fieldDef()</code> method.</dd>
*       <dt>name</dt><dd>string. This is the (possibly escaped) name of the field as it appears in the XML document</dd>
*       <dt>index</dt><dd>int. The ordinal position of this field. Fields are numbered starting from 0.</dd>
*       <dt>type</dt><dd>string. The name of the XML data type for the values that appear in this column</dd>
*       <dt>minOccurs</dt><dd>string. The minimal number of occurrences of a value. "0" means the field is optional.</dd>
*       <dt>maxOccurs</dt><dd>string. If this is parseable as an integer, that integer specifies the number of times a value can appear in this column. "unbounded" means there is no declared limit.</dd>
*       <dt>getter</dt><dd>function. This function is used to extract a value from the XML document for this field.</dd>
*   </dl>
*   @method fieldDef
*   @param {string} name The name of the field to retrieve.
*   @return {fieldDef} The <code>fieldDef</code> object that matches the argument.
*/
    fieldDef: function(name){
        var field = this.fields[name];
        if (!field)
            Xmla.Exception._newError(
                "INVALID_FIELD",
                "Xmla.Rowset.fieldDef",
                name
            )._throw();
        return field;
    },
/**
*   Retrieves the index of a field by name.
*   Field indexes start at 0.
*   @method fieldIndex
*   @param {string} name The name of the field for which you want to retrieve the index.
*   @return {int} The ordinal position (starting at 0) of the field that matches the argument.
*/
    fieldIndex: function(name){
        return this.fieldDef(name).index;
    },
/**
*   Retrieves the name of a field by field Index.
*   Field indexes start at 0.
*   @method fieldName
*   @param {string} name The name of the field for which you want to retrieve the index.
*   @return {int} The ordinal position (starting at 0) of the field that matches the argument.
*/
    fieldName: function(index){
        var fieldName = this.fieldOrder[index];
        if (!fieldName)
            Xmla.Exception._newError(
                "INVALID_FIELD",
                "Xmla.Rowset.fieldDef",
                index
            )._throw();
        return fieldName;
    },
/**
*   Retrieves a value from the current row for the field having the name specified by the argument.
*   @method fieldVal
*   @param {string} name The name of the field for which you want to retrieve the value.
*   @return {array|boolean|float|int|string} From the current row, the value of the field that matches the argument.
*/
    fieldVal: function(name){
        if (_isNum(name)) name = this.fieldName(name);
        return this.fieldDef(name).getter.call(this);
    },
/**
*   Returns the number of fields in this rowset.
*   @method fieldCount
*   @return {int} The number of fields in this rowset.
*/
    fieldCount: function(){
        return this._fieldCount;
    },
/**
*   Releases references to the DomDocument passed to the Rowset constructor.
*   This should facilitate automatic garbage collection by the browser.
*   @method close
*/
    close: function(){
        this._node = null;
        this._row = null;
        this._rows = null;
    },
/**
*   Reads the current row and returns the result as a new array.
*   This method does not advance the internal row pointer, and does not check if there is a valid row.
*   This method exists mainly as a convience in case you want to use a custom way to extract data from the resultset using the
*   <code><a href="#method_fetchCustom">fetchCustom()</a></code> method.
*   If you just want to obtain the results as arrays, see
*   <code><a href="#method_fetchAsArray">fetchAsArray()</a></code>
*   and
*   <code><a href="#method_fetchAllAsArray">fetchAllAsArray()</a></code>.
*   @method readAsArray
*   @return {array}
*/
    readAsArray: function(array){
        var fields = this.fields, fieldName, fieldDef;
        if (!array) array = [];
        for (fieldName in fields){
            if (fields.hasOwnProperty(fieldName)){
                fieldDef = fields[fieldName];
                array[fieldDef.index] = fieldDef.getter.call(this);
            }
        }
        return array;
    },
/**
*   Fetch all values from all fields from the current row, and return it in an array.
*   The position of the values in the array corresponds to the column order of the rowset.
*   The internal row pointer is also increased so the next call will read the next row.
*   The method returns false when there are no more rows to traverse.
*   You can use this method to drive a loop to travere all rows in the Rowset:
<pre>
while (rowArray = rowset.fetchAsArray()){
&nbsp;   ...process array...
}
</pre>
*   @method fetchAsArray
*   @return {array}
*/
    fetchAsArray: function(array){
        if (this.hasMoreRows()) {
            array = this.readAsArray(array);
            this.nextRow();
        }
        else array = false;
        return array;
    },
/**
*   Reads the current row and returns the result as a new object.
*   This method does not advance the internal row pointer, and does not check if there is a valid row.
*   This method exists mainly as a convience in case you want to use a custom way to extract data from the resultset using the
*   <code><a href="#method_fetchCustom">fetchCustom()</a></code> method.
*   If you just want to obtain the results as objects, see
*   <code><a href="#method_fetchAsObject">fetchAsObject()</a></code>
*   and
*   <code><a href="#method_fetchAllAsObject">fetchAllAsObject()</a></code>.
*   @method readAsObject
*   @return {object}
*/
    readAsObject: function(object){
        var fields = this.fields, fieldName, fieldDef;
        if (!object) object = {};
        for (fieldName in fields) {
            if (fields.hasOwnProperty(fieldName)) {
                fieldDef = fields[fieldName];
                object[fieldName] = fieldDef.getter.call(this);
            }
        }
        return object;
    },
/**
*   Fetch all values from all fields from the current row, and return it in an Object literal.
*   The property names of the returned object correspond to the fieldName (actually the fieldLabel), and the field value is assigned to its respective property.
*   The internal row pointer is also increased so the next call will read the next row.
*   The method returns false when there are no more rows to traverse.
*   You can use this method to drive a loop to travere all rows in the Rowset:
<pre>
while (rowObject = rowset.fetchAsObject()){
&nbsp;   ...process object...
}
</pre>
*   @method fetchAsObject
*   @return {Object|boolean}
*/
    fetchAsObject: function(object){
        if (this.hasMoreRows()){
            object = this.readAsObject(object);
            this.nextRow();
        }
        else object = false;
        return object;
    },
/**
*   Fetch the values using a custom callback function.
*   If there are rows to fetch, the custom function is called in scope of the rowset, so you can use <code>this</code> inside the custom function to refer to the rowset object.
*   Then, the internal row pointer is increased so the next call will read the next row.
*   The method returns whatever object or value is returned by the custom function, or false when there are no more rows to traverse.
*
*   @method fetchCustom
*   @param func {function} a custom function to extract and return the data from the current row of the xml result.
*   @param args {object} an object that will be passed to the function. Useful to hold any data required in addition to the rowset itself (which can be referred to as this inside the function).
*   @return {mixed|boolean}
*/
    fetchCustom: function(func, args){
        var object;
        if (this.hasMoreRows()){
            object = func.call(this, args);
            this.nextRow();
        }
        else object = false;
        return object;
    },
/**
*   Fetch all values from all fields from all rows, and return it as an array of arrays.
*   See <code><a href="#method_fetchAsArray">fetchAsArray()</a></code>.
*   @method fetchAllAsArray
*   @param rows {array[]} OPTIONAL. An array to append the rows to. If not specified, a new array is created
*   @return {array}
*/
    fetchAllAsArray: function(rows){
        var row;
        if (!rows) rows = [];
        while((row = this.fetchAsArray())) rows.push(row);
        return rows;
    },
/**
*   Fetch all values from all fields from all rows, and return it as an array of objects.
*   See <code><a href="#method_fetchAsObject">fetchAsObject()</a></code>.
*   @method fetchAllAsObject
*   @param rows {array[]} OPTIONAL. An array to append the rows to. If not specified, a new array is created
*   @return {array}
*/
    fetchAllAsObject: function(rows){
        var row;
        if (!rows) rows = [];
        while((row = this.fetchAsObject())) rows.push(row);
        return rows;
    },
/**
*   Fetch all rows using a custom function, and return the return values as an array.
*   See <code><a href="#method_fetchCustom">fetchCustom()</a></code>.
*   @method fetchAllCustom
*   @param rows {array[]} OPTIONAL. An array to append the rows to. If not specified, a new array is created
*   @param func {function} a callback function to extract the fields.
*   @param args {object} an object to pass data to the callback.
*   @return {array}
*/
    fetchAllCustom: function(rows, func, args){
        var row;
        if (!rows) rows = [];
        while((row = this.fetchCustom(func, args))) rows.push(row);
        return rows;
    },
/**
*   Fetch all row as an object, store it in nested objects according to values in the column identified by the key argument.
*   This method should typically not be called directly, rather it is a helper method for <code><a href="#method_mapAllAsObject">mapAllAsObject()</a></code>.
*
*   @method mapAsObject
*   @param map
*   @param key
*   @param row
*   @returns {object} a tree using column values as branch names, and storing a row or an array of rows at the leaves.
*/
    mapAsObject: function(map, key, row){
        var k, v, p, i, len = key.length, last = len - 1, m = map;
        for (i = 0; i < len; i++){
            k = key[i]; //get the keypart
            v = row[k]; //get the value for the key part
            p = m[v];   //get the property from the map for this keypart.
            if (p) {
                if (i === last) {   //last, we need to store the row now.
                    if (_isArr(p)) p.push(row); //already entries here, append
                    else m[v] = [p, row]; //single row store here. since we need multiple rows, add an array
                }
                else m = p;
            }
            else                        //property didnt exist for this key yet.
            if (i === last) m[v] = row; //last keypart: store the row here
            else m = m[v] = {};         //more keyparts to go: add a new map for this keypart
        }
    },
/**
*   Fetch all rows as an object, store them as proprties in an object (which acts as map).
*   @method mapAllAsObject
*   @key {string|array} OPTIONAL. A column name or an array of column names that will be used to generate property names for the map. If not specified, the default key is used. If there is no default key, all column names will be used.
*   @param map {object} OPTIONAL. The object that is used as map. Rows are added as properties to this map. If not specified, a new object is created
*   @return {object}
*/
    mapAllAsObject: function(key, map){
        if (!map) map = {};
        if (!key) key = this.getKey();
        var row;
        while (row = this.fetchAsObject()) this.mapAsObject(map, key, row);
        return map;
    },

/*
*   Find a key for the resultset type.
*/
    getKey: function(){
        return (this._type) ? Xmla.Rowset.KEYS[this._type] : this.getFieldNames();
    }
};

/**
*   <p>
*   This class implements an XML/A multidimensional Dataset object.
*   </p>
*   <p>
*   You do not need to instantiate objects of this class yourself.
*   Rather, the <code><a href="Xmla.html#class_Xmla">Xmla</a></code> class will instantiate this class
*   to convey the result of the <code>executeMultiDimensional</code> method
*   (see <code><a href="Xmla.html#method_executeMultiDimensional">executeMultiDimensional()</a></code>),
*   and possibly the <code>execute</code> method.
*   (Note that the <code><a name="Xmla.html#method_execute">execute()</code> instantiates either the
*   <code><a href="Xmla.html#class_Xmla.Rowset">Xmla.Rowset</a></code> or the <code><a href="Xmla.html#class_Xmla.Rowset">Xmla.Dataset</a></code> class
*   depending on the value of the <code>Format</code> property in the options passed to the <code><a href="Xmla.html#method_execute">execute()</a></code> method.)
*   </p>
*   <p>
*   An instance of the <code>Xmla.Dataset</code> class may be returned immediately as return value from these methods when doing a synchronous request.
*   In addition, the <code>Xmla.Dataset</code> object is available in the eventdata passed to any registered listeners
*   (see <code><a href="Xmla.html#method_addListener">addListener()</a></code>).
*   </p>
*
*   @class Xmla.Dataset
*   @constructor
*   @param {DOMDocument} doc The responseXML result returned by server in response to a <code>Execute</code> request.
*/
Xmla.Dataset = function(doc){
    this._initDataset(doc);
    return this;
}

/**
*   Can be used as argument for <code><a href="#method_getAxis">getAxis()</a></code> to get the first axis (the column axis).
*   Alternatively you can simply call <code><a href="#method_getColumnAxis">getColumnAxis()</a></code>
*   @property AXIS_COLUMNS
*   @static
*   @final
*   @type int
*   @default <code>0</code>
*/
Xmla.Dataset.AXIS_COLUMNS = 0;
/**
*   Can be used as argument for <code><a href="#method_getAxis">getAxis()</a></code> to get the second axis (the row axis).
*   Alternatively you can simply call <code><a href="#method_getRowAxis">getRowAxis()</a></code>
*   @property AXIS_ROWS
*   @static
*   @final
*   @type int
*   @default <code>1</code>
*/
Xmla.Dataset.AXIS_ROWS = 1;
/**
*   Can be used as argument for <code><a href="#method_getAxis">getAxis()</a></code> to get the third axis (the page axis).
*   Alternatively you can simply call <code><a href="#method_getPageAxis">getPageAxis()</a></code>
*   @property AXIS_PAGES
*   @static
*   @final
*   @type int
*   @default <code>2</code>
*/
Xmla.Dataset.AXIS_PAGES = 2;
/**
*   Can be used as argument for <code><a href="#method_getAxis">getAxis()</a></code> to get the fourth axis (the section axis).
*   Alternatively you can simply call <code><a href="#method_getSectionAxis">getSectionAxis()</a></code>
*   @property AXIS_SECTIONS
*   @static
*   @final
*   @type int
*   @default <code>3</code>
*/
Xmla.Dataset.AXIS_SECTIONS = 3;
/**
*   Can be used as argument for <code><a href="#method_getAxis">getAxis()</a></code> to get the fifth axis (the chapters axis).
*   Alternatively you can simply call <code><a href="#method_getChapterAxis">getChapterAxis()</a></code>
*   @property AXIS_CHAPTERS
*   @static
*   @final
*   @type int
*   @default <code>4</code>
*/
Xmla.Dataset.AXIS_CHAPTERS = 4;
/**
*   Can be used as argument for <code><a href="#method_getAxis">getAxis()</a></code> to get the slicer axis
*   (the axis that appears in the <code>WHERE</code> clause of an MDX-<code>SELECT</code> statement).
*   Alternatively you can simply call <code><a href="#method_getSlicerAxis">getSlicerAxis()</a></code>
*   @property AXIS_SLICER
*   @static
*   @final
*   @type string
*   @default <code>SlicerAxis</code>
*/
Xmla.Dataset.AXIS_SLICER = "SlicerAxis";

Xmla.Dataset.prototype = {
    _root:  null,
    _axes: null,
    _axesOrder: null,
    _numAxes: null,
    _slicer: null,
    _cellset:null,
    _initDataset: function(doc){
        this._initRoot(doc);
        this.cubeName = _getElementText(
            _getElementsByTagNameNS(
                this._root, _xmlnsDataset, "", "CubeName"
            ).item(0)
        );
        this._initAxes();
        this._initCells();

        var a, i, j, axis, func, funcBody = "", mul;
        func = "var ordinal = 0, a;" +
            "\nif (arguments.length !== " + this._numAxes + ") new Xmla.Exception._newError(\"ERROR_ILLEGAL_ARGUMENT\", \"cellOrdinalForTupleIndexes\", this)._throw();"
        for (a = 0, i = this._numAxes-1; i >= 0; i--, a++) {
            func += "\nif (typeof(a = arguments[" + a + "])!==\"number\") new Xmla.Exception._newError(\"ERROR_ILLEGAL_ARGUMENT\", \"cellOrdinalForTupleIndexes\", this)._throw();";
            mul = 1;
            for (j = i-1; j >= 0; j--) mul *= this._axesOrder[j].tupleCount();
            func += "\nordinal += a ";
            if (i) func += "* " + mul + ";";
        }
        func += funcBody + "\nreturn ordinal;"
        this._cellset.cellOrdinalForTupleIndexes = this.cellOrdinalForTupleIndexes = new Function(func);
    },
    _initRoot: function(doc){
        var root = _getElementsByTagNameNS(doc, _xmlnsDataset, "", "root");
        if (root.length) this._root = root.item(0);
        else
            Xmla.Exception._newError(
                "ERROR_PARSING_RESPONSE",
                "Xmla.Dataset._initData",
                doc
            )._throw();
    },
    _initAxes: function(){
        var i, axis, axisNode, axisName, axisNodes, numAxisNodes, tmpAxes = {};

        this._axes = {};
        this._axesOrder = [];

        //collect the axisInfo nodes
        axisNodes = _getElementsByTagNameNS(this._root, _xmlnsDataset, "", "AxisInfo");
        numAxisNodes = axisNodes.length;
        for (i = 0; i < numAxisNodes; i++) {
            axisNode = axisNodes.item(i);
            axisName = axisNode.getAttribute("name");
            tmpAxes[axisName] = axisNode;
        }
        //collect the axis nodes
        axisNodes = _getElementsByTagNameNS(this._root, _xmlnsDataset, "", "Axis");
        numAxisNodes = axisNodes.length;
        for (i = 0; i < numAxisNodes; i++){
            axisNode = axisNodes.item(i);
            axisName = axisNode.getAttribute("name");
            axis = new Xmla.Dataset.Axis(tmpAxes[axisName], axisNode, axisName, i);
            if (axisName === Xmla.Dataset.AXIS_SLICER) this._slicer = axis;
            else {
                this._axes[axisName] = axis;
                this._axesOrder.push(axis);
            }
        }
        this._numAxes = this._axesOrder.length;
    },
    _initCells: function(){
        this._cellset = new Xmla.Dataset.Cellset(this);
    },
/**
*   Get the number of proper axes in this Dataset. This is the number of axes that appears in the <code>SELECT</code> list, and excludes the slicer axis.
*   @method axisCount
*   @return {int}
*/
    axisCount: function(){
        return this._numAxes;
    },
    _getAxis: function(nameOrIndex) {
        var name, axis;
        switch (typeof(nameOrIndex)) {
            case "number":
                axis = this._axesOrder[nameOrIndex];
                break;
            case "string":
                axis = (name === Xmla.Dataset.AXIS_SLICER) ? this._slicer : this._axes[name];
                break;
        }
        return axis;
    },
/**
*   Get the axis specified by the argument index or name.
*   If the axis does not exist, an <code>INVALID_AXIS</code> exception is thrown.
*   To prevent an exception from being thrown, you should call the <code><a href="#method_hasAxis">hasAxis()</a></code> method to determine if the axis exists.
*   Alternatively, you can call <code><a href="#method_axisCount">axisCount()</a></code>, and use an integer argument between zero (inclusive) and axis count (exclusive).
*   @method getAxis
*   @param nameOrIndex {string | int} For int arguments, a value of 0 up to the number of axes. You can also use one of the <code>AXIS_xxx</code> constants. For string arguments, this method will match the name of the axis as it is returned in the XML/A response. These names are of the form <code>AxisN</code> where N is an ordinal that identifies the axis.
*   @return {Xmla.Dataset.Axis} The <code><a href="Xmla.Dataset.Axis.html#class_Axis">Xmla.Dataset.Axis</a></code> object that corresponds to the argument.
*/
    getAxis: function(nameOrIndex){
        if (nameOrIndex === Xmla.Dataset.AXIS_SLICER) return this._slicer;
        var axis = this._getAxis(nameOrIndex);
        if (!axis)
            Xmla.Exception._newError(
                "INVALID_AXIS",
                "Xmla.Dataset.getAxis",
                nameOrIndex
            )._throw();
        return axis;
    },
/**
*   Determine if the axis specified by the argument exists.
*   @method hasAxis
*   @param nameOrIndex {string | int} For int arguments, a value of 0 up to the number of axes. You can also use one of the <code>AXIS_xxx</code> constants. For string arguments, this method will match the name of the axis as it is returned in the XML/A response. These names are of the form <code>AxisN</code> where N is an ordinal that identifies the axis.
*   @return {boolean} <code>true</code> if the specified axis exists, <code>false</code> if it doesn't exist.
*/
    hasAxis: function(nameOrIndex) {
        var axis = this._getAxis(nameOrIndex);
        return !_isUnd(axis);
    },
/**
*   Get the Column axis. This is the first axis, and has ordinal 0. If the column axis doesn't exist, an <code>INVALID_AXIS</code> exception is thrown.
*   To prevent an exception from being thrown, you should call the <code><a href="#method_hasColumnAxis">hasColumnAxis()</a></code> method to determine if the axis exists.
*   @method getColumnAxis
*   @return {Xmla.Dataset.Axis} The column <code><a href="Xmla.Dataset.Axis.html#class_Axis">Xmla.Dataset.Axis</a></code> object.
*/
    getColumnAxis: function(){
        return this.getAxis(Xmla.Dataset.AXIS_COLUMNS);
    },
/**
*   Determine if the column axis exists.
*   @method hasColumnAxis
*   @return {boolean} <code>true</code> if the column axis exists, <code>false</code> if it doesn't exist.
*/
    hasColumnAxis: function(){
        return this.hasAxis(Xmla.Dataset.AXIS_COLUMNS);
    },
/**
*   Get the Row axis. This is the second axis, and has ordinal 1. If the row axis doesn't exist, an <code>INVALID_AXIS</code> exception is thrown.
*   To prevent an exception from being thrown, you should call the <code><a href="#method_hasRowAxis">hasRowAxis()</a></code> method to determine if the axis exists.
*   @method getRowAxis
*   @return {Xmla.Dataset.Axis} The row <code><a href="Xmla.Dataset.Axis.html#class_Axis">Xmla.Dataset.Axis</a></code> object.
*/
    getRowAxis: function(){
        return this.getAxis(Xmla.Dataset.AXIS_ROWS);
    },
/**
*   Determine if the row axis exists.
*   @method hasRowAxis
*   @return {boolean} <code>true</code> if the row axis exists, <code>false</code> if it doesn't exist.
*/
    hasRowAxis: function(){
        return this.hasAxis(Xmla.Dataset.AXIS_ROWS);
    },
/**
*   Get the Page axis. This is the third axis, and has ordinal 2. If the page axis doesn't exist, an <code>INVALID_AXIS</code> exception is thrown.
*   To prevent an exception from being thrown, you should call the <code><a href="#method_hasPageAxis">hasPageAxis()</a></code> method to determine if the axis exists.
*   @method getPageAxis
*   @return {Xmla.Dataset.Axis} The page <code><a href="Xmla.Dataset.Axis.html#class_Axis">Xmla.Dataset.Axis</a></code> object.
*/
    getPageAxis: function(){
        return this.getAxis(Xmla.Dataset.AXIS_PAGES);
    },
/**
*   Determine if the page axis exists.
*   @method hasPageAxis
*   @return {boolean} <code>true</code> if the page axis exists, <code>false</code> if it doesn't exist.
*/
    hasPageAxis: function(){
        return this.hasAxis(Xmla.Dataset.AXIS_PAGES);
    },
/**
*   Get the Section axis. This is the fourth axis, and has ordinal 3. If the section axis doesn't exist, an <code>INVALID_AXIS</code> exception is thrown.
*   To prevent an exception from being thrown, you should call the <code><a href="#method_hasPageAxis">hasSectionAxis()</a></code> method to determine if the axis exists.
*   @method getSectionAxis
*   @return {Xmla.Dataset.Axis} The section <code><a href="Xmla.Dataset.Axis.html#class_Axis">Xmla.Dataset.Axis</a></code> object.
*/
    getSectionAxis: function(){
        return this.getAxis(Xmla.Dataset.AXIS_SECTIONS);
    },
/**
*   Determine if the section axis exists.
*   @method hasSectionAxis
*   @return {boolean} <code>true</code> if the section axis exists, <code>false</code> if it doesn't exist.
*/
    hasSectionAxis: function(){
        return this.hasAxis(Xmla.Dataset.AXIS_SECTIONS);
    },
/**
*   Get the Chapter axis. This is the fifth axis, and has ordinal 4. If the chapter axis doesn't exist, an <code>INVALID_AXIS</code> exception is thrown.
*   To prevent an exception from being thrown, you should call the <code><a href="#method_hasChapterAxis">hasChapterAxis()</a></code> method to determine if the axis exists.
*   @method getChapterAxis
*   @return {Xmla.Dataset.Axis} The chapter <code><a href="Xmla.Dataset.Axis.html#class_Axis">Xmla.Dataset.Axis</a></code> object.
*/
    getChapterAxis: function(){
        return this.getAxis(Xmla.Dataset.AXIS_CHAPTERS);
    },
/**
*   Determine if the chapter axis exists.
*   @method hasChapterAxis
*   @return {boolean} <code>true</code> if the chapter axis exists, <code>false</code> if it doesn't exist.
*/
    hasChapterAxis: function(){
        return this.hasAxis(Xmla.Dataset.AXIS_CHAPTERS);
    },
/**
*   Get the Slicer axis. This is the axis that appears in the <code>WHERE</code> clause of the MDX statement.
*   @method getSlicerAxis
*   @return {Xmla.Dataset.Axis} The slicer <code><a href="Xmla.Dataset.Axis.html#class_Axis">Xmla.Dataset.Axis</a></code> object.
*/
    getSlicerAxis: function(){
        return this._slicer;
    },
/**
*   Get the Cellset object.
*   @method getCellset
*   @return {Xmla.Dataset.Cellset} The <code><a href="Xmla.Dataset.Cellset.html#class_Cellset">Xmla.Dataset.Cellset</a></code> object.
*/
    getCellset: function(){
        return this._cellset;
    },
/**
*   <p>Calculate the cellset ordinal for the argument tuple indexes.</p>
*   <p>This method accepts a variable number of tuple indexes. One integer argument must be passed for each proper axis (excluding the slicer axis).
*   Each integer arguments represent the index of a tuple on the respective axis.</p>
*   <p>The arguments must be specified by descending axis order. So if the data set has two axes (a row and a column axis),
*   this method expects the tuple index of a tuple on the row axis first, and after that, the tuple index on the column axis.</p>
*   <p>The method returns an integer that represents the ordinal of the cell identified by the tuples specified by the tuple index arguments.
*   One could use this ordinal as argument to the <code><a href="Xmla.Dataset.Cellset.html#method_getByOrdinal">getByOrdinal()</a></code> method of this Dataset's <code><a href="Xmla.Dataset.Cellset.html#class_Cellset">Cellset</a></code>.</p>
*   <p>Instead of calling this method and passing the result into the Cellsets <code><a href="Xmla.Dataset.Cellset.html#method_getByOrdinal">getByOrdinal()</a></code> method,
*   you can call the <code><a href="Xmla.Dataset.Cellset.html#method_getByTupleIndexes">getByTupleIndexes()</a></code> method  of this Dataset's <code><a href="Xmla.Dataset.Cellset.html#class_Cellset">Cellset</a></code>.</p>
*   @method cellOrdinalForTupleIndexes
*   @param {int} A variable number of integer tuple indexes. Tuple indexes should be passed in descending order of axes.
*   @return {int} The ordinal number that identifies the cell from this Dataset's <code><a href="Xmla.Dataset.Cellset.html#class_Cellset">Xmla.Dataset.Cellset</a></code> that belongs to the tuples identified by the arguments.
*/
    cellOrdinalForTupleIndexes: function() {
        throw "Not implemented"
    },
/**
*   Cleanup this Dataset object.
*   @method close
*/
    close: function(){
        if (this._slicer) this._slicer.close();
        var i, n = this._numAxes;
        for (i = 0; i < n; i++) this.getAxis(i).close();
        this._cellset.close();
        this._root = null;
        this._axes = null;
        this._axesOrder = null;
        this._numAxes = null;
        this._slicer = null;
    }
};

/**
*   <p>
*   This class implements an Axis object.
*   </p>
*   <p>
*   You do not need to instantiate objects of this class yourself.
*   Rather, the <code><a href="Xmla.Dataset.html#class_Xmla.Dataset">Xmla.Dataset</a></code> class creates instances of this class to represent the axes of an MDX query.
*   (see <code><a href="Xmla.Dataset.html#method_getAxis">getAxis()</a></code>.)
*
*   @class Xmla.Dataset.Axis
*   @constructor
*/
Xmla.Dataset.Axis = function(_axisInfoNode, _axisNode, name, id){
    this._initAxis(_axisInfoNode, _axisNode);
    this.name = name;
    this.id = id;
    return this;
}

Xmla.Dataset.Axis.MEMBER_UNIQUE_NAME = "UName";
Xmla.Dataset.Axis.MEMBER_CAPTION = "Caption";
Xmla.Dataset.Axis.MEMBER_LEVEL_NAME = "LName";
Xmla.Dataset.Axis.MEMBER_LEVEL_NUMBER = "LNum";
Xmla.Dataset.Axis.MEMBER_DISPLAY_INFO = "DisplayInfo";

Xmla.Dataset.Axis.prototype = {
    _tuples: null,
    _members: null,
    numTuples: null,
    numHierarchies: null,
    _tupleIndex: null,
    _hierarchyIndex: null,
    _hierarchyOrder: null,
    _hierarchyDefs: null,
    _hierarchyIndexes: null,
    _initHierarchies: function(_axisInfoNode){
        var hierarchyInfoNodes = _getElementsByTagNameNS(
                _axisInfoNode,
                _xmlnsDataset,
                "",
                "HierarchyInfo"
            ),
            numHierarchies = hierarchyInfoNodes.length,
            i, j, hierarchyInfoNode, hierarchyName,
            properties, numPropertyNodes, propertyNodes, propertyNode
        ;
        this._hierarchyDefs = {};
        this._hierarchyOrder = [];
        this._hierarchyIndexes = {};
        this.numHierarchies = numHierarchies;
        for (i = 0; i < numHierarchies; i++){
            hierarchyInfoNode = hierarchyInfoNodes.item(i);
            hierarchyName = hierarchyInfoNode.getAttribute("name");
            this._hierarchyOrder[i] = hierarchyName;
            this._hierarchyIndexes[hierarchyName] = i;
            properties = {
                index: i,
                name: hierarchyName
            };
            propertyNodes = _getElementsByTagNameNS(
                _axisInfoNode,
                _xmlnsDataset,
                "",
                "*"
            );
            numPropertyNodes = propertyNodes.length;
            for (j = 0; j < numPropertyNodes; j++) {
                propertyNode = propertyNodes.item(j);
                properties[propertyNode.tagName] = null;
            }
            this._hierarchyDefs[hierarchyName] = properties;
        }

    },
    _initAxis: function(_axisInfoNode, _axisNode){
        this.name = _axisNode.getAttribute("name");

        this._initHierarchies(_axisInfoNode);
        this._tuples = _getElementsByTagNameNS(_axisNode, _xmlnsDataset, "", "Tuple");
        this.numTuples = this._tuples.length;
        this.reset();
    },
    _getMembers: function(){
        if (!this.hasMoreTuples()) return null;
        return _getElementsByTagNameNS(
            this._tuples.item(this._tupleIndex),
            _xmlnsDataset, "", "Member"
        );
    },
/**
*   Resets this axis object.
*   This resets internal counters for iterating through the hierarchies and tuples of this Axis object.
*   When using hierarchy and tuple iterators to traverse the entire axis, you typically won't need to call this method yourself.
*   @method reset
*/
    reset: function(){
        this._hierarchyIndex = 0;
        this._tupleIndex = 0;
        this._members = this._getMembers();
    },
/**
*   Checks if there are more hierarchies to iterate through.
*   You can use this method along with the <code><a href="#method_nextHierarchy">nextHierarchy()</a></code> method to drive a loop
*   to iterate through the hierarchies contained in this axis object.
*   @method hasMoreHierarchies
*   @return {boolean} Returns <code>true</code> if there are more hierarchies to vist, <code>false</code> if all hierarchies are traversed.
*/
    hasMoreHierarchies: function(){
        return this.numHierarchies > this._hierarchyIndex;
    },
/**
*   Moves the internal hierarchy pointer forward.
*   You can use this method along with the <code><a href="#method_hasMoreHierarchies">hasMoreHierarchies()</a></code> method to drive a loop
*   to iterate through the hierarchies contained in this axis object.
*   @method nextHierarchy
*   @return {int} Returns the index of current hierarchy.
*/
    nextHierarchy: function(){
        return this._hierarchyIndex++;
    },
/**
*   <p>Calls a callback function for each hierarchy in this Axis object.</p>
*   <p>The callback function is passed an object that represents the current hierarchy. This object has the following structure:</p><ul>
*     <li><code>index</code> <code>int</code> The ordinal identifying this hierarchy</li>
*     <li><code>name</code> <code>string</code> The name of this hierarchy</li>
*   </ul>
*   <p>The callback may return <code>false</code> to abort iteration. If the callback does not return <code>false</code>, iteration will resume until all hierarchies are traversed.</p>
*   @param {function()} callback. A function that will be called for each hierarchy. The hierarchy is passed as an object as the first argument to the callback.
*   @param {object} scope. The object that will be used as scope when executing the callback function. If this is undefined or <code>null</code>, the Axis' <code>this</code> pointer will be used.
*   @param {object} args. Additional data to be passed to the callback function..
*   @method eachHierarchy
*   @return {boolean} Returns <code>true</code> if all hierarchies were visited and the callback did not return <code>false</code>. Returns <code>false</code> if the callback returned <code>false</code> and further iteration was aborted.
*/
    eachHierarchy: function(callback, scope, args){
        var mArgs = [null];
        if (!scope) scope = this;
        if (args) {
            if (!_isArr(args)) args = [args];
            mArgs = mArgs.concat(args);
        }
        while (this.hasMoreHierarchies()){
            mArgs[0] = this._hierarchyDefs[this._hierarchyOrder[this._hierarchyIndex]];
            if (callback.apply(scope, mArgs)===false) return false;
            this.nextHierarchy();
        }
        this._hierarchyIndex = 0;
        return true;
    },
/**
*   Checks if there are more tuples to iterate through.
*   You can use this method along with the <code><a href="#method_nextTuple">nextTuple()</a></code> method to drive a loop
*   to iterate through the tuples contained in this axis object.
*   @method hasMoreTuples
*   @return {boolean} Returns <code>true</code> if there are more tuples to vist, <code>false</code> if all tuples are traversed.
*/
    hasMoreTuples: function(){
        return this.numTuples > this._tupleIndex;
    },
/**
*   Moves the internal tuple pointer forward.
*   You can use this method along with the <code><a href="#method_nextTuple">nextTuple()</a></code> method to drive a loop
*   to iterate through the tuples contained in this axis object.
*   @method nextTuple
*   @return {int} Returns the index of current tuple.
*/
    nextTuple: function(){
        this._tupleIndex++;
        this._members = this._getMembers();
        return this._tupleIndex;
    },
/**
*   Gets the number of tuples in this axis object.
*   @method tupleCount
*   @return {int} Returns the number of tuples in this Axis object.
*/
    tupleCount: function(){
        return this.numTuples;
    },
/**
*   Returns the current value of the tuple pointer.
*   @method tupleIndex
*   @return {int} Returns the current value of the tuple pointer.
*/
    tupleIndex: function() {
        return this._tupleIndex;
    },
/**
*   Get the current tuple as an object. The tuple object has the following structure: <ul>
*       <li><code>index</code> <code>int</code>: the ordinal of this tuple within its axis</li>
*       <li><code>hierarchies</code> <code>object</code>: A map of members using hierarchy names as keys, and member objects as values</li>
*       <li><code>members</code> <code>array</code>: An array of members in order of hierarchy order.</li>
*   </ul>
*   @method getTuple
*   @return {object} An object representing the current tuple..
*/
    getTuple: function() {
        var i, n = this.numHierarchies,
            hierarchies = {}, members = [],
            tuple = {
                index: this._tupleIndex,
                hierarchies: hierarchies,
                members: members
            }
        ;
        for (i=0; i < n; i++) members.push(hierarchies[this._hierarchyOrder[i]] = this._member(i));
        return tuple;
    },
/**
*   <p>Calls a callback function for each tuple in this Axis object.</p>
*   <p>The callback function is passed an object that represents the current tuple. (see <code><a href="#method_getTuple">getTuple()</a></code> for a description of the tuple format.)</p>
*   <p>The callback may return <code>false</code> to abort iteration. If the callback does not return <code>false</code>, iteration will resume until all tuples are traversed.</p>
*   @param {function()} callback. A function that will be called for each tuple. The tuple is passed as an object as the first argument to the callback.
*   @param {object} scope. The object that will be used as scope when executing the callback function. If this is undefined or <code>null</code>, the Axis' <code>this</code> pointer will be used.
*   @param {object} args. Additional data to be passed as the second argument to the callback function.
*   @method eachTuple
*   @return {boolean} Returns <code>true</code> if all tuples were visited and the callback did not return <code>false</code>. Returns <code>false</code> if the callback returned <code>false</code> and further iteration was aborted.
*/
    eachTuple: function(callback, scope, args){
        var mArgs = [null];
        if (!scope) scope = this;
        if (args) {
            if (_isArr(args)) mArgs.concat(args)
            else mArgs.push(args);
        }
        while (this.hasMoreTuples()){
            mArgs[0] = this.getTuple();
            if (callback.apply(scope, mArgs) === false) return false;
            this.nextTuple();
        }
        this._tupleIndex = 0;
        this._members = this._getMembers();
        return true;
    },
/**
 *  Returns the hierarchies of this Axis object.
*   @method getHierarchies
*   @return {array} An array of hierarchies contained in this Axis.
 **/
    getHierarchies: function(){
        return this._hierarchyDefs;
    },
/**
 *  Returns the names of the hierarchies of this Axis object.
*   @method getHierarchyNames
*   @return {array} An array of names of the hierarchies contained in this Axis.
 **/
    getHierarchyNames: function(){
        var hierarchyNames = [], i, n = this.numHierarchies;
        for (i = 0; i < n; i++) hierarchyNames[i] = this._hierarchyOrder[i];
        return hierarchyNames;
    },
/**
*   Gets the number of hierarchies in this axis object.
*   @method hierarchyCount
*   @return {int} Returns the number of hierarchies in this Axis object.
*/
    hierarchyCount: function(){
        return this.numHierarchies;
    },
/**
*   Gets the index of the hierarchy identified by the specified name, or the index of the current hierarchy (in case the name argument is omitted).
*   @method hierarchyIndex
*   @param hierarchyName {string} The name of the hierarchy for which the index is to be retrieved. When omitted, the index of the current hierarchy is returned.
*   @return {int} The index of the hierarchy specified by the name passed as argument, or the index of the current hierarchy if the name argument is omitted.
*/
    hierarchyIndex: function(hierarchyName){
        if (_isUnd(hierarchyName)) return this._hierarchyIndex;
        var index = this._hierarchyIndexes[hierarchyName];
        if (_isUnd(index))
            Xmla.Exception._newError(
                "INVALID_HIERARCHY",
                "Xmla.Dataset.Axis.hierarchyDef",
                hierarchyName
            )._throw();
        return index;
    },
/**
*   Gets the name of the hierarchy identified by the specified index, or the name of the current hierarchy (in case the index argument is omitted).
*   @method hierarchyName
*   @param hierarchyIndex {int} The ordinal of the hierarchy for which the name is to be retrieved. When omitted, the name of the current hierarchy is returned.
*   @return {string} The name of the hierarchy specified by the argument index, or the name of the current hierarchy if the index argument is omitted.
*/
    hierarchyName: function(index){
        if (_isUnd(index)) index = this._hierarchyIndex;
        if (index !== parseInt(index, 10) ||
            index >= this.numHierarchies
        )
            Xmla.Exception._newError(
                "INVALID_HIERARCHY",
                "Xmla.Dataset.Axis.hierarchyDef",
                index
            )._throw();
        return this._hierarchyOrder[index];
    },
/**
*   Gets the hierarchy identified by the specified index or hierarchyName, or the current hierarchy (in case the argument is omitted).
*   @method hierarchy
*   @param hierarchyIndexOrName {int|string} The ordinal or name of the hierarchy that is to be retrieved. When omitted, the the current hierarchy is returned.
*   @return {string} The hierarchy specified by the argument index or name, or the current hierarchy if the argument is omitted.
*/
    hierarchy: function(hierarchyIndexOrName){
        if (_isUnd(hierarchyIndexOrName)) index = this._hierarchyIndex;
        var index, hierarchyName, hierarchy;
        if (_isNum(hierarchyIndexOrName)) {
            if (hierarchyIndexOrName !== parseInt(hierarchyIndexOrName, 10)
            ||  hierarchyIndexOrName >= this.numHierarchies
            )
                Xmla.Exception._newError(
                    "INVALID_HIERARCHY",
                    "Xmla.Dataset.Axis.hierarchyDef",
                    hierarchyIndexOrName
                )._throw();
            hierarchyName = this.hierarchyName(hierarchyIndexOrName);
        }
        else hierarchyName = hierarchyIndexOrName;
        hierarchy = this._hierarchyDefs[hierarchyName];
        if (_isUnd(hierarchy))
            Xmla.Exception._newError(
                "INVALID_HIERARCHY",
                "Xmla.Dataset.Axis.hierarchyDef",
                hierarchyName
            )._throw();
        return hierarchy;
    },
/**
*   Gets the member for the specified hierarchy from the current tuple. The member has the following structure: <ul>
*     <li><code>index</code> - <code>int</code></li>
*     <li><code>hierarchy</code> - <code>string</code>. Name of the hiearchy to which this member belongs.</li>
*     <li><code>UName</code> - <code>string</code>. Unique name of this member.</li>
*     <li><code>Caption</code> - <code>string</code>. Human friendly name for this member.</li>
*     <li><code>LName</code> - <code>string</code>. Name of the level to which this member belongs.</li>
*     <li><code>LNum</code> - <code>int</code>. Number of the level to which this member belongs. Typically, the top-level is level 0, its children are level 1 and so on.</li>
*     <li><code>DisplayInfo</code> - <code>int</code>.</li>
*   </ul>
*   <p>
*   The <code>index</code> and <code>hierarchy</code> properties are non standard and always added by Xmla4js.
*   The properties <code>UName</code>, <code>Caption</code>, <code>LName</code> and <code>LNum</code> are defined by the XML/A standard, and should always be present.
*   The property <code>DisplayInfo</code> is non-standard, but often available.
*   Other properties may be present depending on the specific XML/A provider.
*   </p>
*   @method member
*   @param hierarchyIndexOrName {int|string} The ordinal or name of the hierarchy from which the member is to be retrieved. When omitted, the the current hierarchy is returned.
*   @return {object} The member of the current tuple that belongs to the specified hierarchy, If the argument is omitted the member that belongs current hierarchy is retrieved from the current tuple.
*/
    member: function(hierarchyIndexOrName){
        if (_isUnd(hierarchyIndexOrName)) index = this._hierarchyIndex;
        var index, hierarchyName, hierarchy;
        switch(typeof(hierarchyIndexOrName)){
            case "string":
                index = this.hierarchyIndex(hierarchyIndexOrName);
                hierarchyName = hierarchyIndexOrName;
                break;
            case "number":
                if (hierarchyIndexOrName !== parseInt(hierarchyIndexOrName, 10) ||
                    hierarchyIndexOrName >= this.numHierarchies
                )
                    Xmla.Exception._newError(
                        "INVALID_HIERARCHY",
                        "Xmla.Dataset.Axis.hierarchyDef",
                        hierarchyIndexOrName
                    )._throw();
                index = hierarchyIndexOrName;
                break;
        }
        return this._member(index);
    },
    _member: function(index){
        var memberNode = this._members.item(index),
            hierarchyName = this.hierarchyName(index),
            hierarchy = this.hierarchy(hierarchyName),
            property,
            member = {
                index: index,
                hierarchy: hierarchyName
            },
            el
        ;
        for (property in hierarchy){
            if (property === "index" || property === "name") continue;
            el = _getElementsByTagNameNS(memberNode, _xmlnsDataset, "", property);
            switch (el.length) {
                case 0: //no element found for property, use the default
                    member[property] = hierarchy[property]
                    break;
                case 1: //this is expected, single element for property, get value
                    member[property] = _getElementText(el.item(0));
                    break;
                default:
                    Xmla.Exception._newError(
                        "UNEXPECTED_ERROR_READING_MEMBER",
                        "Xmla.Dataset.Axis.member",
                        property
                    )._throw();
            }
        }
        return member;
    },
/**
*   Gets the current tuple as an array of members.
*   For a description of the structure of the member elements, see <code><a href="#method_member">member()</a></code>.
*   @method readAsArray
*   @param array {array} An existing array to store the members in. If omitted, a new array is returned.
*   @return {array} An array of members that represents the current tuple.
*/
    readAsArray: function(array){
        if (!array) array = [];
        var i, n = this.numHierarchies;
        for (i = 0; i < n; i++) array[i] = this._member(i);
        return array;
    },
/**
*   Gets the current tuple as an object.
*   The object's keys are the hierarchy names, and the members of the current tuple are used as values for the keys.
*   For a description of the structure of the member elements, see <code><a href="#method_member">member()</a></code>.
*   @method readAsObject
*   @param object {object} An existing object to store the tuple data in. If omitted, a new object is returned.
*   @return {object} An object that represents the current tuple.
*/
    readAsObject: function(object){
        if (!object) object = {};
        var i, n = this.numHierarchies;
        for (i = 0; i < n; i++) object[this._hierarchyOrder[i]] = this._member(i);
        return object;
    },
/**
*   Gets the current tuple as an array of members and advances the internal tuple pointer.
*   For a description of the structure of the member elements, see <code><a href="#method_member">member()</a></code>.
*   @method fetchAsArray
*   @param array {array} An existing array to store the members in. If omitted, a new array is returned.
*   @return {array|false} An array of members that represents the current tuple, or <code>false</code> if there are no more tuples.
*/
    fetchAsArray: function(array){
        if (this.hasMoreTuples()) {
            array = this.readAsArray(array);
            this.nextTuple();
        }
        else array = false;
        return array;
    },
/**
*   Gets the current tuple as an object and advances the current tuple pointer.
*   The object's keys are the hierarchy names, and the members of the current tuple are used as values for the keys.
*   For a description of the structure of the member elements, see <code><a href="#method_member">member()</a></code>.
*   @method fetchAsObject
*   @param object {object} An existing object to store the tuple data in. If omitted, a new object is returned.
*   @return {object} An object that represents the current tuple.
*/
    fetchAsObject: function(object){
        if (this.hasMoreTuples(object)){
            object = this.readAsObject();
            this.nextTuple();
        }
        else object = false;
        return object;
    },
/**
*   Fetches all tuples and returns them as an array of arrays.
*   Each element of the returned array is an array of member objects.
*   For a description of the structure of the member elements, see <code><a href="#method_member">member()</a></code>.
*   @method fetchAllAsArray
*   @param rows {array} An existing array to store the tuples in. If omitted, a new array is returned.
*   @return {[[array]]} An array of arrays representing all tuples that belong to this axis.
**/
    fetchAllAsArray: function(rows){
        var row;
        if (!rows) rows = [];
        while((row = this.fetchAsArray())) rows.push(row);
        return rows;
    },
/**
*   Fetches all tuples and returns them as an array of objects.
*   Each element of the returned array is a tuple object.
*   The object's keys are the hierarchy names, and the members of the current tuple are used as values for the keys.
*   For a description of the structure of the member elements, see <code><a href="#method_member">member()</a></code>.
*   @method fetchAllAsObject
*   @param rows {array} An existing array to store the tuples in. If omitted, a new array is returned.
*   @return {[[object]]} An array of arrays representing all tuples that belong to this axis.
**/
    fetchAllAsObject: function(rows){
        var row;
        if (!rows) rows = [];
        while((row = this.fetchAsObject())) rows.push(row);
        return rows;
    }
}

/**
*   <p>
*   This class implements a Cellset object.
*   </p>
*   <p>
*   You do not need to instantiate objects of this class yourself.
*   Rather, the <code><a href="Xmla.Dataset.html#class_Xmla.Dataset">Xmla.Dataset</a></code> class creates instances of this class to represent the cells (the value of the measures) of an MDX query.
*   (see <code><a href="Xmla.Dataset.html#method_getCellset">getCellset()</a></code>.)
*
*   @class Xmla.Dataset.Cellset
*   @constructor
*/
Xmla.Dataset.Cellset = function(dataset){
    this._dataset = dataset;
    this._initCellset();
    return this;
}

Xmla.Dataset.Cellset.prototype = {
    _dataset: null,
    _cellNodes: null,
    _cellCount: null,
    _cellNode: null,
    _cellProperties: null,
    _idx: null,
    _cellOrd: null,
    _initCellset: function(){
        var root = this._dataset._root,
            cellSchema, cellSchemaElements, numCellSchemaElements, cellSchemaElement,
            cellInfoNodes, cellInfoNode, cellNodes, type,
            propertyNodes, propertyNode, propertyNodeTagName, numPropertyNodes, i, j
        ;
        cellSchema = _getComplexType(root, "CellData");
        if (!cellSchema)
            Xmla.Exception._newError(
                "ERROR_PARSING_RESPONSE",
                "Xmla.Rowset",
                root
            )._throw();
        cellSchemaElements = _getElementsByTagNameNS(
            cellSchema, _xmlnsSchema, _xmlnsSchemaPrefix, "element"
        );
        numCellSchemaElements = cellSchemaElements.length;
        cellInfoNodes = _getElementsByTagNameNS(
            root, _xmlnsDataset, "", "CellInfo"
        );
        if (!cellInfoNodes || cellInfoNodes.length===0)
            Xmla.Exception._newError(
                "ERROR_PARSING_RESPONSE",
                "Xmla.Rowset",
                root
            )._throw();

        cellInfoNode = cellInfoNodes.item(0);
        propertyNodes = _getElementsByTagNameNS(
            cellInfoNode, _xmlnsDataset, "", "*"
        );
        this._cellProperties = {};
        //examine cell property info so we can parse them
        numPropertyNodes = propertyNodes.length;
        for(i = 0; i < numPropertyNodes; i++) {
            propertyNode = propertyNodes.item(i);
            propertyNodeTagName = propertyNode.tagName;
            //find the xsd:element node that describes this property
            for (j = 0; j < numCellSchemaElements; j++) {
                cellSchemaElement = cellSchemaElements.item(j);
                if (cellSchemaElement.getAttribute("name") !== propertyNodeTagName) continue;
                type = cellSchemaElement.getAttribute("type");
                this._cellProperties[propertyNodeTagName] = _typeConverterMap[type];
                this["cell" + propertyNodeTagName] = new Function("return this.cellProperty(\"" + propertyNodeTagName + "\")");
                break;
            }
        }
        this._cellNodes = _getElementsByTagNameNS(
            root, _xmlnsDataset, "", "Cell"
        );
        this._cellCount = this._cellNodes.length;
        this.reset();
    },
    _getCellNode: function(index){
        if (!_isUnd(index)) this._idx = index;
        this._cellNode = this._cellNodes.item(this._idx);
        this._cellOrd = this._getCellOrdinal(this._cellNode);
    },
    _getCellOrdinal: function(node){
        return parseInt(node.getAttribute("CellOrdinal"), 10);
    },
/**
*   Returns the number of cells contained in this cellset.
*   This is the number of cells that is actually present in the cellset - not the number of logical cells.
*   The nuber of logical cells can be be calculated by multiplying the tuple counts of all axes of the data set.
*   The XML/A provider will typically not return empty cells, hence, the cellCount may be less than the logical cell count.
*   @method cellCount
*   @return {int} The number of cells in this cellset.
*/
    cellCount: function() {
        return this._cellNodes.length;
    },
/**
*   Resets the internal cell pointer to the argument, or to 0 if the argument is omitted.
*   Normally, you shouldn't have to call this method yourself.
*   @method reset
*   @param idx {int}
*/
    reset: function(idx){
        this._idx = idx ? idx : 0;
        this._getCellNode();
    },
/**
*   Check if there are cells to iterate through.
*   @method hasMoreCells
*   @return {boolean} <code>true</code> if there are more cells to iterate, <code>false</code> if there are no more cells to iterate.
*/
    hasMoreCells: function(){
        return this._idx < this._cellCount;
    },
/**
*   Advance to the next (physical) cell.
*   Note that this method may appear to be skipping cells. This happens when the XML/A provider omits empty cells in the response.
*   @method nextCell
*   @return {int} returns the ordinal of the next cell, or -1 if there was no next cell.
*/
    nextCell: function(){
        this._idx += 1;
        if (this.hasMoreCells()) {
            this._getCellNode();
            return this._cellOrd;
        }
        else {
            this._idx = 0;
            return -1;
        }
    },
/**
*   Returns the internal cell pointer. This is the fysical cell pointer.
*   To get the logical cell pointer, see <code><a href="#method_cellOrdinal">cellOrdinal()</a></code>
*   @method curr
*   @return {int} returns the internal cell pointer.
*/
    curr: function(){
        return this._idx;
    },
/**
*   Check if the cell has the specified property.
*   XML/A defines these standard properties:<ul>
*     <li><code>Value</code></li>
*     <li><code>FmtValue</code></li>
*     <li><code>ForeColor</code></li>
*     <li><code>BackColor</code></li>
*   </ul>
*   Whether all these properties are returned depends on the XML/A provider and on the query.
*   The XML/A provider may return specific additional properties.
*   @method hasCellProperty
*   @param propertyName {string} The name of the property to check for.
*   @return {boolean} returns <code>true</code> if the current cell has the specified property, <code>false</code> if it doesn't.
*/
    hasCellProperty: function(propertyName) {
        return !_isUnd(this._cellProperties[propertyName]);
    },
/**
*   Return the value of the current property of the current cell.
*   XML/A defines these standard properties:<ul>
*     <li><code>Value</code></li>
*     <li><code>FmtValue</code></li>
*     <li><code>ForeColor</code></li>
*     <li><code>BackColor</code></li>
*   </ul>
*   Whether all these properties are returned depends on the XML/A provider and on the query.
*   The XML/A provider may return specific additional properties.
*   @method cellProperty
*   @param propertyName {string} The name of the property to retrieve.
*   @return {mixed} returns the value of the specified property of the current cell.
*/
    cellProperty: function(propertyName){
        var text, type, valueConverter,
            valueEl = _getElementsByTagNameNS(
              this._cellNode, _xmlnsDataset, "", propertyName
            ).item(0);
        text = _getElementValue(valueEl);
        valueConverter = this._cellProperties[propertyName];
        if (!valueConverter) {
            type = _getAttributeNS(
                valueEl,
                _xmlnsSchemaInstance,
                _xmlnsSchemaInstancePrefix,
                "type"
            );
            valueConverter = _getValueConverter(type);
        }
        return valueConverter(text);
    },
/**
*   Returns the cell ordinal. This is the logical cell pointer.
*   To get the physical cell pointer, see <code><a href="#method_curr">curr()</a></code>
*   @method cellOrdinal
*   @return {int} returns the logical cell pointer.
*/
    cellOrdinal: function() {
        return this._cellOrd;
    },
    fetchAsArrayOfValues: function(){
        var colArray = [];

        for (var c=0, cols=this._dataset.getAxis(Xmla.Dataset.AXIS_COLUMNS).numTuples;c<cols;c++){
            colArray[colArray.length] = this.cellValue();
            this.nextCell();
        }
        return colArray;
    },
    fetchAllAsArrayOfValues: function(){
        var row, rows=[];
        while((row = this.fetchAsArrayOfValues()) && (this.hasMoreCells())){
            rows.push(row);
        }
        return rows;
    },
    eachRow: function(rowCallback, scope, args){
        if (_isUnd(scope)) scope = this;
        var mArgs = [null];
        if (!_isUnd(args)) {
            if (!_isArr(args)) args = [args];
            mArgs = mArgs.concat(args);
        }
        var row, rows=[];
        while((row = this.fetchAsArrayOfValues()) && (this.hasMoreCells())){
            mArgs[0] = row;
            if (rowCallback.apply(scope, mArgs)===false) return false;
        }
        return true;
    },
    _readCell: function(node, object){
        var p, cellProp, cellProperty;
        for (p in this._cellProperties){
            cellProp = _getElementsByTagNameNS(
                node, _xmlnsDataset, "", p
            ).item(0);
            if (!cellProp) continue;
            cellProperty = this._cellProperties[p];
            if (cellProperty) object[p] = cellProperty(_getElementText(cellProp));
            else if (p === "Value") object[p] = _getElementValue(cellProp);
            else object[p] = _getElementText(cellProp);
        }
        object.ordinal = this._getCellOrdinal(node);
        return object;
    },
/**
 *  Reads the current cell into the specified object.
*   @method readCell
*   @param {object} object An existing object to use for the current cell. If omitted, a new object will be created.
*   @return {object} An object that represents the current cell.
*/
    readCell: function(object) {
        if (!object) object = {};
        return this._readCell(this._cellNode, object);
    },
/**
 *  Iterate through each cell.
*   @method eachCell
*   @param {function()} callback
*   @param {object} scope
*   @param {object} args
*   @return {boolean}
*/
    eachCell: function(callback, scope, args) {
        var mArgs = [null];
        if (!scope) scope = this;
        if (args) {
            if (!_isArr(args)) args = [args];
            mArgs = mArgs.concat(args);
        }
        while (this.hasMoreCells()){
            this.nextCell();
            mArgs[0] = this.readCell();
            if (callback.apply(scope, mArgs)===false) return false;
        }
        this._idx = 0;
        return true;
    },
/**
 *  Get a cell by its physical index.
*   @method getByIndex
*   @param {int} index
*   @param {object} object
*   @return {object}
*/
    getByIndex: function(index, object) {
        this._getCellNode(index);
        return this.readCell(object);
    },
/**
 *  Get a cell by its logical index.
*   @method getByOrdinal
*   @param {int} ordinal
*   @param {object} object
*   @return {object}
*/
    getByOrdinal: function(ordinal, object) {
        var node, ord, idx, lastIndex = this.cellCount() - 1;
        idx = ordinal > lastIndex ? lastIndex : ordinal;
        while(true) {
            node = this._cellNodes.item(idx);
            ord = this._getCellOrdinal(node);
            if (ord === ordinal) return this.getByIndex(idx, object);
            else
            if (ord > ordinal) idx--;
            else return null;
        }
    },
/**
 *  Calculate the ordinal based on the specified tuple indexes.
*   @method cellOrdinalForTupleIndexes
*   @param {int...} ordinal
*   @return {int}
*/
    cellOrdinalForTupleIndexes: function() {
        throw "Not implemented";
    },
/**
 *  Get the cell corresponding to the specified tuple indexes.
*   @method getByTupleIndexes
*   @param {int...} ordinal
*   @return {object}
*/
    getByTupleIndexes: function() {
        return this.getByOrdinal(this.cellOrdinalForTupleIndexes.apply(this, arguments));
    },
/**
 *  Close this cellset.
*   @method close
*/
    close: function(){
        this._dataset = null;
        this._cellNodes = null;
        this._cellNode = null;
    }
}


/**
*   <p>
*   This class is used to indicate an runtime errors occurring in any of the methods of the xmla4js classes.
*   </p>
*   <p>
*   You do not need to instantiate objects of this class yourself.
*   Rather, instances of this class are created and thrown at runtime whenever an error occurs.
*   The purpose is to provide a clean and clear way for applications that use xmla4js to recognize and handle Xmla4js specific runtime errors.
*   </p>
*   <p>
*   To handle Xmla4js errors, you can use a <code>try...catch</code> block like this:
*   </p>
<pre>
&nbsp;try {
&nbsp;    ...general xmla4js work...
&nbsp;} catch (exception) {
&nbsp;    if (exception instanceof Xmla.Exception) {
&nbsp;        ...use exception.code, exception.message and exception.data to handle the exception.
&nbsp;    } else {
&nbsp;        ...handle other errors...
&nbsp;    }
&nbsp;}
</pre>
*
*   @class Xmla.Exception
*   @constructor
*/
Xmla.Exception = function(type, code, message, helpfile, source, data, args){
    this.type = type;
    this.code = code;
    this.message = message;
    this.source = source;
    this.helpfile = helpfile;
    this.data = data;
    this.args = args;
    return this;
};

/**
*   Can appear as value for the <code><a href="#property_type">type</a></code> property of instances of the <code><a href="#class_Xmla.Exception">Xmla.Exception</a></code> class,
*   and indicates that this <code>Xmla.Exception</code> signals a warning.
*
*   @property TYPE_WARNING
*   @static
*   @final
*   @type string
*   @default <code>warning</code>
*/
Xmla.Exception.TYPE_WARNING = "warning";
/**
*   Can appear as value for the <code><a href="#property_type">type</a></code> property of instances of the <code><a href="#class_Xmla.Exception">Xmla.Exception</a></code> class,
*   and indicates that this <code>Xmla.Exception</code> signals an error.
*
*   @property TYPE_ERROR
*   @static
*   @final
*   @type string
*   @default <code>error</code>
*/
Xmla.Exception.TYPE_ERROR = "error";

var _exceptionHlp = "http://code.google.com/p/xmla4js/wiki/ExceptionCodes";

/**
*   Exception code indicating a <code>requestType</code> option was expected but ommitted.
*
*   @property MISSING_REQUEST_TYPE_CDE
*   @static
*   @final
*   @type {int}
*   @default <code>-1</code>
*/
Xmla.Exception.MISSING_REQUEST_TYPE_CDE = -1;
Xmla.Exception.MISSING_REQUEST_TYPE_MSG = "Missing_Request_Type";
Xmla.Exception.MISSING_REQUEST_TYPE_HLP = _exceptionHlp +
                                    "#" + Xmla.Exception.MISSING_REQUEST_TYPE_CDE +
                                    "_" + Xmla.Exception.MISSING_REQUEST_TYPE_MSG;
/**
*   Exception code indicating a <code>statement</code> option was expected but ommitted.
*
*   @property MISSING_STATEMENT_CDE
*   @static
*   @final
*   @type {int}
*   @default <code>-2</code>
*/
Xmla.Exception.MISSING_STATEMENT_CDE = -2;
Xmla.Exception.MISSING_STATEMENT_MSG = "Missing_Statement";
Xmla.Exception.MISSING_STATEMENT_HLP = _exceptionHlp +
                                    "#" + Xmla.Exception.MISSING_STATEMENT_CDE +
                                    "_" + Xmla.Exception.MISSING_STATEMENT_MSG;

/**
*   Exception code indicating a <code>url</code> option was expected but ommitted.
*
*   @property MISSING_URL_CDE
*   @static
*   @final
*   @type {int}
*   @default <code>-3</code>
*/
Xmla.Exception.MISSING_URL_CDE = -3;
Xmla.Exception.MISSING_URL_MSG = "Missing_URL";
Xmla.Exception.MISSING_URL_HLP = _exceptionHlp +
                                    "#" + Xmla.Exception.MISSING_URL_CDE +
                                    "_" + Xmla.Exception.MISSING_URL_MSG;

/**
*   Exception code indicating a <code>events</code> were expected but ommitted.
*
*   @property NO_EVENTS_SPECIFIED_CDE
*   @static
*   @final
*   @type {int}
*   @default <code>-4</code>
*/
Xmla.Exception.NO_EVENTS_SPECIFIED_CDE = -4;
Xmla.Exception.NO_EVENTS_SPECIFIED_MSG = "No_Events_Specified";
Xmla.Exception.NO_EVENTS_SPECIFIED_HLP = _exceptionHlp +
                                    "#" + Xmla.Exception.NO_EVENTS_SPECIFIED_CDE  +
                                    "_" + Xmla.Exception.NO_EVENTS_SPECIFIED_MSG;

/**
*   Exception code indicating a <code>events</code> were specifeid in the wrong format.
*
*   @property WRONG_EVENTS_FORMAT_CDE
*   @static
*   @final
*   @type {int}
*   @default <code>-5</code>
*/
Xmla.Exception.WRONG_EVENTS_FORMAT_CDE = -5;
Xmla.Exception.WRONG_EVENTS_FORMAT_MSG = "Wrong_Events_Format";
Xmla.Exception.WRONG_EVENTS_FORMAT_HLP = _exceptionHlp +
                                    "#" + Xmla.Exception.NO_EVENTS_SPECIFIED_CDE  +
                                    "_" + Xmla.Exception.NO_EVENTS_SPECIFIED_MSG;

/**
*   Exception code indicating that the event name was unrecognized.
*
*   @property UNKNOWN_EVENT_CDE
*   @static
*   @final
*   @type {int}
*   @default <code>-6</code>
*/
Xmla.Exception.UNKNOWN_EVENT_CDE = -6;
Xmla.Exception.UNKNOWN_EVENT_MSG = "Unknown_Event";
Xmla.Exception.UNKNOWN_EVENT_HLP = _exceptionHlp +
                                    "#" + Xmla.Exception.UNKNOWN_EVENT_CDE  +
                                    "_" + Xmla.Exception.UNKNOWN_EVENT_MSG;
/**
*   Exception code indicating that no proper handler was passed for the events.
*
*   @property INVALID_EVENT_HANDLER_CDE
*   @static
*   @final
*   @type {int}
*   @default <code>-7</code>
*/
Xmla.Exception.INVALID_EVENT_HANDLER_CDE = -7;
Xmla.Exception.INVALID_EVENT_HANDLER_MSG = "Invalid_Events_Handler";
Xmla.Exception.INVALID_EVENT_HANDLER_HLP = _exceptionHlp +
                                    "#" + Xmla.Exception.INVALID_EVENT_HANDLER_CDE  +
                                    "_" + Xmla.Exception.INVALID_EVENT_HANDLER_MSG;
/**
*   Exception code indicating that the rrepsonse could not be parsed
*
*   @property ERROR_PARSING_RESPONSE_CDE
*   @static
*   @final
*   @type {int}
*   @default <code>-8</code>
*/
Xmla.Exception.ERROR_PARSING_RESPONSE_CDE = -8;
Xmla.Exception.ERROR_PARSING_RESPONSE_MSG = "Error_Parsing_Response";
Xmla.Exception.ERROR_PARSING_RESPONSE_HLP = _exceptionHlp +
                                    "#" + Xmla.Exception.ERROR_PARSING_RESPONSE_CDE  +
                                    "_" + Xmla.Exception.ERROR_PARSING_RESPONSE_MSG ;
/**
*   Exception code indicating the field name is not valid.
*
*   @property INVALID_FIELD_CDE
*   @static
*   @final
*   @type {int}
*   @default <code>-9</code>
*/
Xmla.Exception.INVALID_FIELD_CDE = -9;
Xmla.Exception.INVALID_FIELD_MSG = "Invalid_Field";
Xmla.Exception.INVALID_FIELD_HLP = _exceptionHlp +
                                    "#" + Xmla.Exception.INVALID_FIELD_CDE  +
                                    "_" + Xmla.Exception.INVALID_FIELD_MSG;

/**
*   Exception code indicating a general XMLHttpRequest error.
*   If this error occurs, the data object of the exception will have these members:
*   <ul>
*       <li>request: the options that make up the original HTTP request</li>
*       <li>status: the HTTP status code</li>
*       <li>statusText: the HTTP status text</li>
*   </ul>
*   @property HTTP_ERROR_CDE
*   @static
*   @final
*   @type {int}
*   @default <code>-10</code>
*/
Xmla.Exception.HTTP_ERROR_CDE = -10;
Xmla.Exception.HTTP_ERROR_MSG = "HTTP Error";
Xmla.Exception.HTTP_ERROR_HLP = _exceptionHlp +
                                    "#" + Xmla.Exception.HTTP_ERROR_CDE  +
                                    "_" + Xmla.Exception.HTTP_ERROR_MSG;

/**
*   Exception code indicating the hierarchy name is not valid.
*
*   @property INVALID_HIERARCHY_CDE
*   @static
*   @final
*   @type {int}
*   @default <code>-11</code>
*/
Xmla.Exception.INVALID_HIERARCHY_CDE = -11;
Xmla.Exception.INVALID_HIERARCHY_MSG = "Invalid_Hierarchy";
Xmla.Exception.INVALID_HIERARCHY_HLP = _exceptionHlp +
                                    "#" + Xmla.Exception.INVALID_HIERARCHY_CDE  +
                                    "_" + Xmla.Exception.INVALID_HIERARCHY_MSG;

/**
*   Exception code indicating a problem reading a member property
*
*   @property UNEXPECTED_ERROR_READING_MEMBER_CDE
*   @static
*   @final
*   @type {int}
*   @default <code>-12</code>
*/
Xmla.Exception.UNEXPECTED_ERROR_READING_MEMBER_CDE = -12;
Xmla.Exception.UNEXPECTED_ERROR_READING_MEMBER_MSG = "Error_Reading_Member";
Xmla.Exception.UNEXPECTED_ERROR_READING_MEMBER_HLP = _exceptionHlp +
                                    "#" + Xmla.Exception.UNEXPECTED_ERROR_READING_MEMBER_CDE  +
                                    "_" + Xmla.Exception.UNEXPECTED_ERROR_READING_MEMBER_MSG;

/**
*   Exception code indicating the requested axis does not exist
*
*   @property INVALID_AXIS
*   @static
*   @final
*   @type {int}
*   @default <code>-13</code>
*/
Xmla.Exception.INVALID_AXIS_CDE = -13;
Xmla.Exception.INVALID_AXIS_MSG = "The requested axis does not exist.";
Xmla.Exception.INVALID_AXIS_HLP = _exceptionHlp +
                                    "#" + Xmla.Exception.INVALID_AXIS_CDE  +
                                    "_" + Xmla.Exception.INVALID_AXIS_MSG;

/**
*   Exception code indicating illegal number of axis arguments
*
*   @property ILLEGAL_ARGUMENT
*   @static
*   @final
*   @type {int}
*   @default <code>-14</code>
*/
Xmla.Exception.ILLEGAL_ARGUMENT_CDE = -14;
Xmla.Exception.ILLEGAL_ARGUMENT_MSG = "Illegal arguments";
Xmla.Exception.ILLEGAL_ARGUMENT_HLP = _exceptionHlp +
                                    "#" + Xmla.Exception.ILLEGAL_ARGUMENT_CDE  +
                                    "_" + Xmla.Exception.ILLEGAL_ARGUMENT_MSG;

Xmla.Exception._newError = function(codeName, source, data){
    return new Xmla.Exception(
        Xmla.Exception.TYPE_ERROR,
        Xmla.Exception[codeName + "_CDE"],
        Xmla.Exception[codeName + "_MSG"],
        Xmla.Exception[codeName + "_HLP"],
        source,
        data
    );
};

Xmla.Exception.prototype = {
/**
*   This propery indicates what kind of exception occurred. It can have one of the following values: <dl>
*       <dt><code><a href="property_TYPE_WARNING">TYPE_WARNING</a></code></dt><dd>Indicates a warning</dd>
*       <dt><code><a href="property_TYPE_ERROR">TYPE_ERROR</a></code></dt><dd>Indicates an error</dd>
*   </dl>
*   @property type
*   @type {string}
*   @default {null}
*/
    type: null,
/**
*   A code that can be used to identify this particular kind of exception.
*   @property code
*   @type {int}
*   @default {null}
*/
    code: null,
/**
*   A human readable message that describes the nature of the error or warning.
*   @property message
*   @type {string}
*   @default {null}
*/
    message: null,
/**
*   A name that indicates in what component (on the client or server side) this error or warning occurred.
*   @property source
*   @type {string}
*   @default {null}
*/
    source: null,
/**
*   A path or url that points to a document that contains more information about this error.
*   @property helpfile
*   @type {string}
*   @default {null}
*/
    helpfile: null,
/**
*   Additional data captured when the exception was instantiated.
*   The type of information stored here is dependent upon the nature of the error.
*   @property data
*   @type {string}
*   @default {null}
*/
    data: null,
    _throw: function(){
        throw this;
    },
/**
*   A reference to the built-in <code>arguments</code> array of the function that is throwing the exception
*   This can be used to get a "stack trace"
*   @property args
*   @type {array}
*/
    args: null,
/**
 *  Returns a string representing this exception
*   @method toString
*   @return a string representing this exception
*/
    toString: function(){
        return this.type + " " + this.code + ": " + this.message;
    },
/**
 *  Get a stack trace.
*   @method getStackTrace
*   @return an array of objects describing the function on the stack
*/
    getStackTrace: function(){
        var funcstring, stack = "", regexp = /^\sfunction\s*([^\(]+)?\s*\(\)$/;
        if (this.args) {
            var func = this.args.callee;
            while (func){
                funcstring = String(func);
                func = func.caller;
            }
        }
        return stack;
    }
};

}());
