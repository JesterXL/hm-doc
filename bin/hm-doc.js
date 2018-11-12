#!/usr/bin/env node
const { parse, getMarkdown, writeMarkdownFile } = require('../index')
const { isString, every } = require('lodash/fp')
const program = require('commander')

program
.version(require('../package.json').version, '-v, --version')
.description('Writes Hindle-Milner parsed documentation and markdown.')
.option('-f, --files [demFiles]', 'File glob, list of files you want to load and parse comments out of [demFiles]. Example: ./*.js')
.option('-i, --ignore [demFiles]', 'File glob to ignore, list of files/folders you want to ignore and not include in documentation. Example: ./*.js')
.option('-t, --template [handlebarsTemplate]', 'Handlebars template file [handlebarsTemplate]. Example: ./README.hbs')
.option('-o, --output [outputFile]', '(Optional) Markdown file you would like to output to.')
.parse(process.argv)

const hasFiles = program =>
    isString(program.files)
    && program.files.length > 0

const hasIgnore = program =>
    isString(program.ignore)
    && program.ignore.length > 0

const getIgnoreOrDefault = program =>
    hasIgnore(program)
    ? program.ignore
    : ''

const hasTemplate = program =>
    isString(program.template)
    && program.template.length > 0

const hasOutput = program =>
    isString(program.output)
    && program.output.length > 0

const hasJustFiles = program =>
    hasFiles(program)
    && hasTemplate(program) === false
    && hasOutput(program) === false

const hasJustFilesAndTemplate = program =>
    hasFiles(program)
    && hasTemplate(program)
    && hasOutput(program) === false

const hasEverything = program =>
    every(
        predicate => predicate(program),
        [
            hasFiles,
            hasTemplate,
            hasOutput
        ]
    )
    
// console.log("program.files:", program.files)
// console.log("program.template:", program.template)
// console.log("program.output:", program.output)
// console.log(hasEverything(program))
// console.log(hasJustFilesAndTemplate(program))
// console.log(hasJustFiles(program))
if(hasEverything(program)) {
    writeMarkdownFile
        (program.files)
        (program.template)
        (program.output)
    .then(console.log)
    .catch(console.log)
} else if(hasJustFilesAndTemplate(program)) {
    getMarkdown
        (program.files)
        ({ignore: getIgnoreOrDefault(program)})
        (program.template)
    .then(console.log)
    .catch(console.log)
} else if(hasJustFiles(program)) {
    parse
        (program.files)
        ({ignore: getIgnoreOrDefault(program)})
    .then(console.log)
    .catch(console.log)
} else {
    console.log("hm-doc requires at least files (-f, or --files). Type hm-docs --help for more information.")
}