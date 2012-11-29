#!/bin/sh

cd ./src
yuidoc .
yuglify ./*.js
mv *-min.js ../build
cd ..
