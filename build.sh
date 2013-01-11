#!/bin/sh

cd ./src
yuidoc .
cp -R ../doc/* /home/pentaho/projects/olap4jsdocs/
yuglify ./*.js
mv *-min.js ../build
cd ..
