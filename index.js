const glob = require('glob')
const fs = require('fs')
const { map, filter, isNil, isString, trim, trimChars, zip, fromPairs, set, get, find, reduce, has, toPairs, every, forEach, isObject, forOwn } = require('lodash/fp')
const HMP = require('hm-parser')
const { inspect } = require('util')
const babylon = require('babylon')
const handlebars = require('handlebars')
const debug = require('debug')('hm-doc')

const getDescription =
    get('description')

const legitDescription = o =>
    isString(getDescription(o)) 
    && getDescription(o).length > 0

const parsedCommentToMarkdown = comment => {
    const base = `## .${get('hmParsed.name', comment)}
\`${get('signature', comment)}\``
    if(legitDescription(comment)) {
        return `${base}

${getDescription(comment)}`
    }
    return base
}

const combineComments = filename => comments =>
    reduce(
        (commentsString, comment) =>
            `${commentsString}\n${parsedCommentToMarkdown(comment)}`,
        `## ${filename}\n\n`,
        comments
    )

const registerResult = handlebars.registerHelper('hmdoc', (items, options) =>
    reduce(
        (acc, [filename, comments] ) =>
            combineComments(filename)(comments),
        '',
        toPairs(get('data.root', items))
    )
)

const loadFilenames = stringGlob => options =>
    debug("loadFilenames, stringGlob:", stringGlob, ", options:", options) ||
    new Promise((success, failure) =>
        glob(stringGlob, options, (err, files) =>
            debug("loadFilenames result, err: %o, files: %O", err, files) ||
            err
            ? failure(err)
            : success(files)
        )
    )

const truncateChars = o =>
    o.substring(0, 20)

const addElipsesIfBig = o =>
    o.length >= 20
    ? `${o} ...`
    : o

const truncateText = o =>
    isString(o)
    ? addElipsesIfBig(truncateChars(o))
    : o

const readFile = filename =>
    debug("readFile, filename: %o", filename) ||
    new Promise((success, failure) =>
        fs.readFile(filename, (err, data) =>
            err
            ? failure(err)
            : success(data.toString())
        )
    )

const log = o => console.log(inspect(o, {depth: 8, colors: true}))

const parseCode = code => { // eslint-disable-line fp-jxl/no-nil
    try {
        debug("parseCode, code:", truncateText(code)) // eslint-disable-line fp-jxl/no-unused-expression
        const data = babylon.parse(code)
        debug("parseCode, successfully parsed via babylon.") // eslint-disable-line fp-jxl/no-unused-expression
        return Promise.resolve(data)
    } catch(error) {
        debug("parseCode failed, error: %O", error) // eslint-disable-line fp-jxl/no-unused-expression
        return Promise.reject(error)
    }
}

const getProgramBody = get('program.body')

const getComments =
    map(
        get('leadingComments')
    )

const getCleanedComments =
    filter(
        item => isNil(item) === false
    )

const findCommentBlock =
    find(
        item => get('type', item) === 'CommentBlock'
    )
const findCommentLine =
    find(
        item => get('type', item) === 'CommentLine'
    )

const toTypeAndDocumentationPair =
    map(
        item => ({ hm: findCommentLine(item), description: findCommentBlock(item) })
    )

const stripAST =
    map(
        item => ({ hm: get('hm.value', item), description: get('description.value', item) })
    )

const trimmedStars =
    map(
        item => set('hm', trimChars('*', get('hm', item)), item)
    )

const trimmedWhitespace =
    map(
        item => set('hm', trim(get('hm', item)), item)
    )

const safeHMPParse = string => { // eslint-disable-line fp-jxl/no-nil
    try {
        const data = HMP.parse(string)
        return { ok: true, data }
    } catch(error) {
        return { ok: false, error }
    }
}
// [jwarden 10.3.2018] TODO/FIXME: Should look at proceeding line as random 1 line comments will break lol.
// For now, will attempt to if see it's parseable. If not, return state that it should be disposed of.
const parsedComments = 
    map(
        item => {
            const { ok, data, error } = safeHMPParse(get('hm', item))
            if(ok) {
                return set('hmParsed', data, item)
            }
            return set('hmParseFailure', error, item)
        }
    )

const removeFailedCommentParsing =
    filter(
        item => has('hmParseFailure', item) === false
    )

const typeSignaturesAttached = 
    map(
        item => set('signature', trim(get('hm', item).split('::')[1]), item)
    )

const filterFailedParsing =
    filter(
        item => isNil(item) === false
    )

// [jwarden 11.12.2018] TODO: Figure out how to support specific number tapConsoles, like tapConsole2, tapConsole3, etc.
const tapConsole = label => (...args) => { // eslint-disable-line fp-jxl/no-rest-parameters
    console.log.apply(console, [`${label}:`, ...args]) // eslint-disable-line fp-jxl/no-unused-expression
    return Promise.resolve.apply(Promise, args)
}

// [jwarden 11.12.2018] TODO: Figure out how to support specific number tapDebug, like tapDebug2, tapDebug3, etc.
const tapDebug = label => (...args) => { // eslint-disable-line fp-jxl/no-rest-parameters
    // debug.apply(debug, [label, ...args])
    debug(label) // eslint-disable-line fp-jxl/no-unused-expression
    return Promise.resolve.apply(Promise, args)
}

// [jwarden 11.12.2018] TODO: Figure out how to support specific number tapDebug, like tapDebugAndShowArgs2, tapDebugAndShowArgs3, etc.
const tapDebugAndShowArgs = label => (...args) => { // eslint-disable-line fp-jxl/no-rest-parameters
    debug.apply(debug, [label, ...args]) // eslint-disable-line fp-jxl/no-unused-expression
    return Promise.resolve.apply(Promise, args)
}

// [jwarden 10.3.2018] NOTE: We're basically finding all comments in the file, and assuming they might possibly be what we're looking for.
// That is probably not the case, heh, so sometimes HMP will fail, or won't fail but it isn't a Hindley-Milner comment for example.
// I believe JSDocs uses the "slash star star" to recognize the start of a JSDoc block comment. I didn't want to introduce another
// commenting format, and rather, keep what developers know. SO... until we get better at parsing the AST Bablylon gives us,
// we'll just have to add verification steps like this.
const okLookingHM = o =>
    isString(get('hm', o))
    && get('hm', o).length > 0

const hmParsedSuccessfully = o =>
    isObject(get('hmParsed', o))

const okLookingSignature = o =>
    isString(get('signature', o))
    && get('signature', o).length > 0

const legitParsedComment = parsedComment =>
    every(
        predicate => predicate(parsedComment),
        [
            okLookingHM,
            hmParsedSuccessfully,
            okLookingSignature
        ]
    )

const filterLegitParsedComments = filter(legitParsedComment)

const codeToMarkdown = code =>
    tapDebug("codeToMarkdown start...")()
    .then(() => Promise.resolve(code))
    .then(tapDebug("codeToMarkdown, parsing code..."))
    .then(parseCode)
    .then(tapDebug("codeToMarkdown, getProgramBody..."))
    .then(getProgramBody)
    .then(tapDebug("codeToMarkdown, getComments..."))
    .then(getComments)
    .then(tapDebug("codeToMarkdown, getCleanedComments..."))
    .then(getCleanedComments)
    .then(tapDebug("codeToMarkdown, toTypeAndDocumentationPair..."))
    .then(toTypeAndDocumentationPair)
    .then(tapDebug("codeToMarkdown, stripAST..."))
    .then(stripAST)
    .then(tapDebug("codeToMarkdown, trimmedStars..."))
    .then(trimmedStars)
    .then(tapDebug("codeToMarkdown, trimmedWhitespace..."))
    .then(trimmedWhitespace)
    .then(tapDebug("codeToMarkdown, parsedComments..."))
    .then(parsedComments)
    .then(tapDebug("codeToMarkdown, removeFailedCommentParsing..."))
    .then(removeFailedCommentParsing)
    .then(tapDebug("codeToMarkdown, typeSignaturesAttached..."))
    .then(typeSignaturesAttached)
    .then(tapDebug("codeToMarkdown, filterFailedParsing..."))
    .then(filterFailedParsing)
    .then(tapDebug("codeToMarkdown, filterFailedParsing..."))
    .then(filterLegitParsedComments)
    .then(tapDebugAndShowArgs("codeToMarkdown, filterLegitParsedComments done"))
    .then(tapDebug("codeToMarkdown, done."))

const cleanEmptyResults = filesObject => {
    debug("cleanEmptyResults, start:", filesObject) // eslint-disable-line fp-jxl/no-unused-expression
    const filenames = Object.keys(filesObject)
    const cleanedObject = reduce(
        (acc, filename) => {
            const parsedComments = get([filename], filesObject)
            if(parsedComments.length > 0) {
                return {...acc, [filename]: parsedComments}
            }
            return acc
        }
        , {}
        , filenames
    )
    debug("cleanEmptyResults, end:", cleanedObject) // eslint-disable-line fp-jxl/no-unused-expression
    return cleanedObject
}

/*
### Description
Reads a file glob and parses all comments out and all Hindley-Milner type signatures it finds in the file(s). You'll get an Array of Objects that have the filename as the key, and the value is an Array of comment lines and comment blocks it found.

| Param                       | Type                | Description                   |
| --------------------------- | ------------------- | ----------------------------- |
| glob                        | <code>String</code> | A glob String, like "example.js" or "./folder/file.js" or for all files in `src`, "./src/** /*.js (remove the space after the 2 stars, heh). See glob for more information: https://www.npmjs.com/package/glob |
| globOptions                 | <code>Object</code> | Glob options Object. Feel free to use {} as default, else refer to the glob documentation on what options you can use. https://github.com/isaacs/node-glob#options

### Returns
<code>Promise</code> - Promise contains a list of parsed comments, or an Error as to why it failed.

### Example
```javascript
parse
    ('./src/** /*.js') // ignore space after 2 stars
    ({ ignore: 'example' })
    .then(console.log)
    .catch(console.log)
```
*/
// parse :: glob -> globOptions -> Promise
const parse = fileGlob => fileGlobOptions =>
    debug("parse, fileGlob: %s", fileGlob) ||
    loadFilenames(fileGlob)(fileGlobOptions)
    .then(files =>
        debug("parse, files loaded, about to read them: %o", files) ||
        Promise.all(
            map(
                readFile,
                files
            )
        )
    )
    .then(fileContents =>
        debug("parse, fileContents loaded, attempting to parse out comments from AST...") ||
        Promise.all(
            map(
                codeToMarkdown,
                fileContents
            )
        ))
    .then(markdowns =>
        debug("parse, markdowns parsed, combining with file names: %O", markdowns) ||
        Promise.all([
            loadFilenames(fileGlob)(fileGlobOptions),
            markdowns
        ])
    )
    .then( ([filenames, markdowns]) =>
        debug("parse, combining filenames and markdown...") ||
        zip(filenames, markdowns))
    .then(fromPairs)
    .then( result =>
        debug("parse, cleaning empty results...") ||
        cleanEmptyResults(result)
    )
    .then(tapDebugAndShowArgs("parse done, showing result"))
    .then(tapDebug("parse, done."))

const renderMarkdown = sourceFileContents => data =>
        handlebars.compile
            (sourceFileContents)
            (data)

const readFileToString = filename =>
    new Promise((success, failure) =>
        fs.readFile(filename, (error, data) =>
            err
            ? failure(error)
            : success(data.toString())
        )
    )

const writeFile = filename => data =>
    new Promise((success, failure) =>
        fs.writeFile(filename, data, err =>
            err
            ? failure(err)
            : success(`Successfully wrote filename: ${filename}`)
        )
    )

/*
### Description
Reads a file glob, parses all comments out and all Hindley-Milner type signatures, reads your Handlebars template, compiles it with the parsed comments, and prints out the compiled text.

| Param                       | Type                | Description                   |
| --------------------------- | ------------------- | ----------------------------- |
| glob                        | <code>String</code> | A glob String, like "example.js" or "./folder/file.js" or for all files in `src`, "./src/** /*.js (remove the space after the 2 stars, heh). See glob for more information: https://www.npmjs.com/package/glob |
| globOptions                 | <code>Object</code> | Glob options Object. Feel free to use {} as default, else refer to the glob documentation on what options you can use. https://github.com/isaacs/node-glob#options
| handlebarsTemplateFile      | <code>String</code> | Filepath to the Handlebars template file you want to inject your code comments into. It should have a string {{#hmdoc}}{{/hmdoc}} somewhere in there; this is where hm-doc will render the API documentation. See http://handlebarsjs.com/ for more information.   |

### Returns
<code>Promise</code> - Promise contains either the text content of the of the rendered Markdown or an error as to why it failed.

### Example
```javascript
getMarkdown
    ('./src/** /*.js') // ignore space after 2 stars
    ({ ignore: './examples' })
    ('README_template.hbs')
    .then(console.log)
    .catch(console.log)
```
*/
// getMarkdown :: glob -> globOptions -> handlebarsTemplateFile -> Promise
const getMarkdown = glob => globOptions => handlebarsTemplateFile =>
    tapDebug("getMarkdown, looking for glob: %s, handlebarsTemplateFile: %s", glob, globOptions, handlebarsTemplateFile)()
    .then(() => Promise.all([
        parse(glob)(globOptions),
        readFile(handlebarsTemplateFile)
    ]))
    .then(tapDebug("getMarkdown, parsed glob and read template file, rendering markdown..."))
    .then( ([ data, templateString ]) =>
        renderMarkdown
            (templateString)
            (data)
    )
    .then(tapDebug("getMarkdown, rendered markdown."))

/*
### Description

Reads a file glob, parses all comments out and all Hindley-Milner type signatures, reads your Handlebars template, compiles it with the parsed comments, and finally writes that compiled text to a file.

| Param                       | Type                | Description                   |
| --------------------------- | ------------------- | ----------------------------- |
| glob                        | <code>String</code> | A glob String, like "example.js" or "./folder/file.js" or for all files in `src`, "./src/** /*.js (remove the space after the 2 stars, heh). See glob for more information: https://www.npmjs.com/package/glob |
| globOptions                 | <code>Object</code> | Glob options Object. Feel free to use {} as default, else refer to the glob documentation on what options you can use. https://github.com/isaacs/node-glob#options
| handlebarsTemplateFile      | <code>String</code> | Filepath to the Handlebars template file you want to inject your code comments into. It should have a string {{#hmdoc}}{{/hmdoc}} somewhere in there; this is where hm-doc will render the API documentation. See http://handlebarsjs.com/ for more information.   |
| outputFilename              | <code>String</code> | File you want to write your rendered Markdown to, probably `README.md`.

### Returns
<code>Promise</code> - Promise contains a success message of the file it wrote, an error as to why it failed.

### Example
```javascript
writeMarkdownFile
    ('./src/** /*.js') // ignore space after 2 stars
    ({ ignore: '' })
    ('README_template.hbs')
    ('README.md')
    .then(console.log)
    .catch(console.log)
```
*/
// writeMarkdownFile :: glob -> handlebarsTemplateFile -> outputFilename -> Promise
const writeMarkdownFile = glob => globOptions => handlebarsTemplateFile => outputFilename =>
    tapDebug("writeMarkdownFile, looking for glob: %s, handlebarsTemplateFile: %s, outputFilename: %s", glob, handlebarsTemplateFile, outputFilename)()
    .then(() => getMarkdown(glob)(globOptions)(handlebarsTemplateFile))
    .then(tapDebug("writeMarkdownFile, markdown rendered, writing file..."))
    .then( markdown =>
        writeFile
            (outputFilename)
            (markdown)
    )


module.exports = {
    codeToMarkdown,
    parse,
    renderMarkdown,
    getMarkdown,
    writeMarkdownFile
}