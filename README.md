# hm-doc

**What**: Generates simple markdown documentation from [Hindley-Milner](https://en.wikipedia.org/wiki/Hindley%E2%80%93Milner_type_system) single line `//` comments and optional `/* */` block comments in JavaScript code.

**Why**: This is an alternative for Functional Programmers who use curried methods and don't like [the pain of JSDocs](https://github.com/jsdoc3/jsdoc/issues/1286) yet love the functionality of [jsdoc-to-markdown](https://github.com/jsdoc2md/jsdoc-to-markdown). 

**How**: You have 3 options:

- Parse files and code comments, and give you an Array of those results.
- Parse files and code comments, inject into a Handlebars template, give you the String result.
- Parse files and code comments, inject into a Handlebars template, write to a file.

# Contents
- [Installation](#installation)
- [Commandline Usage](#commandline-usage)
- [Prior-Art](#prior-art)
- [How Do I Document My Code?](#how-do-i-document-my-code)
- [API Documentation](#api-documentation)

# Installation

`npm i @jesterxl/hm-doc --save`

# Commandline Usage

See if it installed ok:

`npx hm-doc --version`

Parse all code and comments in your `src` directory:

`npx hm-doc --files './src/**/*.js'`

To exclude a directory, add an ignore (-i for short):

`npx hm-doc --files './src/**/*.js' --ignore './src/**/examples'`

Same as above, then put into a Handlebars template, then show in your Terminal:

`npx hm-doc --files './src/**/*.js' --template README_template.hbs`

Same as above, then write your documentation to a file:

`npx hm-doc --files './src/**/*.js' --template README_template.hbs --output README.md`

To see debug information, prefix the command (or set) the `DEBUG` environment variable to `hm-doc`, or `*` to see every module:

`DEBUG="hm-doc" npx hm-doc --files './src/**/*.js' --template README_template.hbs --output README.md`

For more information, type `npx hm-doc --help`.

For using the code directly, see the API docs below. We used `hm-doc` to document `hm-doc`.

# Prior Art

I just copied how [Haskell](https://www.haskell.org/)'s [Haddock](https://www.haskell.org/haddock/), and more specifically [Elm](http://elm-lang.org/) document their code. In those languages, the type signature is part of the code.

Here's how Elm documents the `isEmpty` Array method:

```elm
{-| Determine if an array is empty.
    isEmpty empty == True
-}
isEmpty : Array a -> Bool
isEmpty (Array_elm_builtin len _ _ _) =
    len == 0
```

And here's how you'd do it in JavaScript using `hm-doc`:

```javascript
/* Determine if an array is empty.
    isEmpty([]) === true
*/
// isEmpty :: Array a -> Bool
const isEmpty = array =>
    Array.isArray(array)
    && array.length === 0
```

# How Do I Document My Code?

Follow these 3 steps:

1. write your documentation in Markdown inside of comment blocks
2. write your Hindley Milner expression in a comment line
3. Create a `README_template.hbs` file and put a Handlebars block ( i.e. `{{#hmdoc}}{{/hmdoc}}` ) where you want your API docs

## Step 1 and 2: Code Comments

For example, here is an `test/example.js` file that has a block comment with markdown and HTML inside a comment block. Immediately below that is the line comment with the Hindley Milner syntax. Immediately below that is the method.

**NOTE**: If you only do a code comment line with Hindly-Milner syntax, we'll just use that, but obviously longer markdown descriptions are encouraged. If you're in a hurry, or just don't know your public API yet, just use hm syntax with single line comments to get moving.

```javascript
/*
### Description
Loads the contents of a URL via a GET request, and wraps the request.get in a Promise.

| Param    | Type                 | Description                   |
| ------   | -------------------- | ----------------------------- |
| request  | <code>request</code> | A Node request or request-promise module (i.e. require('request')) |
| url      | <code>String</code>  | The URL you wish to load.     |

### Returns
<code>Promise</code> - Promise contains either the text content of the GET request or the <code>Error</code>.

### Example
<pre><code class="language-javascript">
loadURL
    (require('request'))
    ('http://google.com')
    .then(result => console.log("result:", result))
    .catch(error => console.log("error:", error))
</code></pre>
*/
// loadURL :: request -> url -> Promise
const loadURL = request => url =>
    new Promise((success, failure) =>
        request.get(url, (err, res, body) =>
            err
            ? failure(err)
            : success(body)
        )
    )
```

That'll produce markdown that looks like the following:

// ------ EXAMPLE BELOW ------

### loadURL
`request -> url -> Promise`

### Description

Loads the contents of a URL via a GET request, and wraps the request.get in a Promise.

| Param    | Type                 | Description                   |
| ------   | -------------------- | ----------------------------- |
| request  | <code>request</code> | A Node request or request-promise module (i.e. require(\'request\')) |
| url      | <code>String</code>  | The URL you wish to load.     |

### Returns
<code>Promise</code> - Promise contains either the text content of the GET request or the <code>Error</code>.

### Example
<pre><code class="language-javascript">
loadURL
    (require("request"))
    ("http://google.com")
    .then(result => console.log("result:", result))
    .catch(error => console.log("error:", error))
</code></pre>

// ------ EXAMPLE ABOVE ------

Remember:

1. Hindle-Milner goes diretly above the function as a single like comment `//`.
2. Markdown goes in `/* */` directly above of the Hindley-Milner single line comment.
3. 2 is optional, but encouraged.

## Step 3: Handlebars Template File

The assumption is you're writing a `README.md` for Github.com or your internal company's Enterprise Github. Github can read README.md files at the top of the project, and display a nice webpage when you come to the repository. The webpage is built by converting the markdown in `README.md`. Handlebars, a way to dynamically build HTML documents, allows you to create your own markup tags. We use Handlebars so we can write in normal Markdown, but then dynamically inject things like API documentation where we need it with code.

If you didn't use Handlebars, you'd have to either copy paste the updated documentation each time into README.md each time you updated your code documentation.

Create a `README_template.hbs` file. We use `.hbs` as a filename which is standard for Handlebars, and append `_template` to remove confusion. I've accidentally made changes in `README.md`, forgot to check in my changes to git, re-ran the build documentation command, and it overwrote my `README.md`, deleting all my chagnes. This way, if you have `README_template.hbs` open and are write things, you can be safe vs. relying on the file extension which is small and easy to miss.

Here's ours:

```markdown
### Our Library

Sup! This is our library documentation. Install it like `npm i something --save`, and you're ready to do things.

### API

Below are all the functions we support in the public API.

{{#hmdoc}}{{/hmdoc}}

### Support

Email us, we're here to help!
```

Notice the weird, double squiggly braces with `#hmdoc` in the middle under the API section. That's our custom Handlebars function. When you convert Handlebars to Markdown, it'll replace those weird tags with all your API documentation. If we save this file `README_template.hbs`, we'll then run our `hm-doc` command like so:

`hm-doc -f './src/**/*.js' -t README_template.hbs -o README.md`

If we run that, then open it up, it'll render close to this:

// ------ EXAMPLE BELOW ------

### Our Library

Sup! This is our library documentation. Install it like `npm i something --save`, and you're ready to do things.

### API

Below are all the functions we support in the public API.

### loadURL
`request -> url -> Promise`

### Description

Loads the contents of a URL via a GET request, and wraps the request.get in a Promise.

| Param    | Type                 | Description                   |
| ------   | -------------------- | ----------------------------- |
| request  | <code>request</code> | A Node request or request-promise module (i.e. require(\'request\')) |
| url      | <code>String</code>  | The URL you wish to load.     |

### Returns
<code>Promise</code> - Promise contains either the text content of the GET request or the <code>Error</code>.

### Example
<pre><code class="language-javascript">
loadURL
    (require("request"))
    ("http://google.com")
    .then(result => console.log("result:", result))
    .catch(error => console.log("error:", error))
</code></pre>

### Support

Email us, we're here to help!

// ------ EXAMPLE ABOVE ------

Pretty rad, right?

# API Documentation

Below is the `hm-doc` API if you wish to use the code directly instead of the command line.
## index.js


## .parse
`glob -> globOptions -> Promise`


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

## .getMarkdown
`glob -> globOptions -> handlebarsTemplateFile -> Promise`


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

## .writeMarkdownFile
`glob -> handlebarsTemplateFile -> outputFilename -> Promise`


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

