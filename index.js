process.env.DEBUG="*"

const glob = require('glob')
const fs = require('fs')
const { map, filter, isNil, isString, trim, trimChars, zip, fromPairs, set, get, find } = require('lodash/fp')
const HMP = require('hm-parser')
const { inspect } = require('util')
const babylon = require('babylon')
const debug = require('debug')('hm-doc')

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
            debug("readFile result, err: %O, data (truncated 20 characters or less): %o", err, truncateText(data.toString())) ||
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

const getDescription =
    get('description')

const legitDescription = o =>
    isString(getDescription(o)) 
    && getDescription(o).length > 0

const docToMarkdown = o => {
    debug('docToMarkdown')
    const base = `### ${get('hmParsed.name', o)}
\`${get('signature', o)}\``
    if(legitDescription(o)) {
        debug("docToMarkdown, has a description, so appending that to the Hindley Milner declaration.")
        return `${base}
${getDescription(o)}`
    }
    debug("docToMarkdown, no description found, using the Hindley Milner declaration.")
    return base
}

const getMarkdownDocumentation =
    map(
        docToMarkdown
    )

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
    .then(tapDebug("codeToMarkdown, getMarkdownDocumentation..."))
    .then(getMarkdownDocumentation)
    .then(tapDebug("codeToMarkdown, done."))


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


parse('./*.js')
.then(result => log(result))
.catch(error => console.log("final error:", error))