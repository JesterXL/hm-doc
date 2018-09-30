#!/usr/bin/env node
const { parse } = require('../index')
const { isString } = require('lodash/fp')
const program = require('commander')

program
.version(require('./package.json').version)
.option('-f, --files [demFiles]', 'File glob, list of files you want to load and parse comments out of [demFiles]. Example: ./*.js', './*.js')
.parse(process.argv)

if(isString(program.files) && program.files.length > 0) {
    parse(program.files)
    .then(result => console.log(result))
    .catch(error => console.log("error:", error))
}