const glob = require('glob')
const fs = require('fs')
const { map, filter, isNil, isString, trim, trimChars, zip, fromPairs, set, get, find, reduce, first, last, toPairs } = require('lodash/fp')
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
    let base = `## .${get('hmParsed.name', comment)}
\`${get('signature', comment)}\``
    if(legitDescription(comment)) {
        base = `${base}

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

handlebars.registerHelper('hmdoc', (items, options) =>
    reduce(
        (acc, [filename, comments] ) =>
            combineComments(filename)(comments),
        '',
        toPairs(get('data.root', items))
    )
)

const loadFilenames = stringGlob =>
    debug("loadFilenames, stringGlob:", stringGlob) ||
    new Promise((success, failure) =>
        glob(stringGlob, (err, files) =>
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

const parseCode = code => {
    try {
        debug("parseCode, code:", truncateText(code))
        const data = babylon.parse(code)
        debug("parseCode, successfully parsed via babylon.")
        return Promise.resolve(data)
    } catch(error) {
        debug("parseCode failed, error: %O", error)
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
        item => ({ hm: get('hm.value', item), description: get('description.value', item) }),
    )

const trimmedStars =
    map(
        item => set('hm', trimChars('*', get('hm', item)), item)
    )

const trimmedWhitespace =
    map(
        item => set('hm', trim(get('hm', item)), item)
    )


const parsedComments = 
    map(
        item => set('hmParsed', HMP.parse(get('hm', item)), item),
    )

const typeSignaturesAttached = 
    map(
        item => set('signature', trim(get('hm', item).split('::')[1]), item)
    )
const filterFailedParsing =
    filter(
        item => isNil(item) === false
    )

const tapConsole = label => (...args) => {
    console.log.apply(console, [`${label}:`, ...args])
    return Promise.resolve.apply(Promise, args)
}

const tapDebug = label => (...args) => {
    // debug.apply(debug, [label, ...args])
    debug(label)
    return Promise.resolve.apply(Promise, args)
}

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
    .then(tapDebug("codeToMarkdown, typeSignaturesAttached..."))
    .then(typeSignaturesAttached)
    .then(tapDebug("codeToMarkdown, filterFailedParsing..."))
    .then(filterFailedParsing)
    .then(tapDebug("codeToMarkdown, done."))


/*
### Description
Reads a file glob and parses all comments out and all Hindley-Milner type signatures it finds in the file(s). You'll get an Array of Objects that have the filename as the key, and the value is an Array of comment lines and comment blocks it found.

| Param                       | Type                | Description                   |
| --------------------------- | ------------------- | ----------------------------- |
| glob                        | <code>String</code> | A glob String, like "example.js" or "./folder/file.js" or for all files in `src`, "./src/** /*.js (remove the space after the 2 stars, heh). See glob for more information: https://www.npmjs.com/package/glob |

### Returns
<code>Promise</code> - Promise contains a list of parsed comments, or an Error as to why it failed.

### Example
<code class="language-javascript">
parse
    ('./src/** /*.js) // ignore space after 2 stars
    .then(console.log)
    .catch(console.log)
</code>
*/
// parse :: glob -> Promise
const parse = fileGlob =>
    debug("parse, fileGlob: %s", fileGlob) ||
    loadFilenames(fileGlob)
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
        debug("parse, markdowns parsed, combining with file names...") ||
        Promise.all([
            loadFilenames(fileGlob),
            markdowns
        ])
    )
    .then( ([filenames, markdowns]) =>
        debug("parse, combining filenames and markdown...") ||
        zip(filenames, markdowns))
    .then(fromPairs)
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
| handlebarsTemplateFile      | <code>String</code> | Filepath to the Handlebars template file you want to inject your code comments into. It should have a string {{#hmdoc}}{{/hmdoc}} somewhere in there; this is where hm-doc will render the API documentation. See http://handlebarsjs.com/ for more information.   |

### Returns
<code>Promise</code> - Promise contains either the text content of the of the rendered Markdown or an error as to why it failed.

### Example
<code class="language-javascript">
getMarkdown
    ('./src/** /*.js) // ignore space after 2 stars
    ('README_template.hbs')
    .then(console.log)
    .catch(console.log)
</code>
*/
// getMarkdown :: glob -> handlebarsTemplateFile -> Promise
const getMarkdown = glob => handlebarsTemplateFile =>
    tapDebug("getMarkdown, looking for glob: %s, handlebarsTemplateFile: %s", glob, handlebarsTemplateFile)()
    .then(() => Promise.all([
        parse(glob),
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
| handlebarsTemplateFile      | <code>String</code> | Filepath to the Handlebars template file you want to inject your code comments into. It should have a string {{#hmdoc}}{{/hmdoc}} somewhere in there; this is where hm-doc will render the API documentation. See http://handlebarsjs.com/ for more information.   |
| outputFilename              | <code>String</code> | File you want to write your rendered Markdown to, probably `README.md`.

### Returns
<code>Promise</code> - Promise contains a success message of the file it wrote, an error as to why it failed.

### Example
<code class="language-javascript">
writeMarkdownFile
    ('./src/** /*.js) // ignore space after 2 stars
    ('README_template.hbs')
    ('README.md')
    .then(console.log)
    .catch(console.log)
</code>
*/
// writeMarkdownFile :: glob -> handlebarsTemplateFile -> outputFilename -> Promise
const writeMarkdownFile = glob => handlebarsTemplateFile => outputFilename =>
    tapDebug("writeMarkdownFile, looking for glob: %s, handlebarsTemplateFile: %s, outputFilename: %s", glob, handlebarsTemplateFile, outputFilename)()
    .then(() => getMarkdown(glob)(handlebarsTemplateFile))
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