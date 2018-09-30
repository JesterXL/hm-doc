# hm-doc

Generates simple markdown documentation from Hindley Milner and optional block comments in JavaScript code.

# Installation

`npm i @jesterxl/hm-doc --save`

# Usage: Commandline

`npx @jesterxl/hm-doc --files example.js`

# Usage: Code

```javascript
const { parse } = require('@jesterxl/hm-doc')
parse('./src/**/*.js')
.then(comments => console.log("comments:", comments))
.catch(error => console.log("error:", error))
```

The `comments` output above is an Object with the keys as the file names, and the value an Array of parsed comment lines and comment blocks.

```javascript
{
    './example.js': [
        '### loadURL\n`request -> url -> Promise`\n\n### Description\nLoads the contents of a URL via a GET request, and wraps the request.get in a Promise.\n\n| Param    | Type                 | Description                   |\n| ------   | -------------------- | ----------------------------- |\n| request  | <code>request</code> | A Node request or request-promise module (i.e. require(\'request\')) |\n| url      | <code>String</code>  | The URL you wish to load.     |\n\n### Returns\n<code>Promise</code> - Promise contains either the text content of the GET request or the <code>Error</code>.\n\n### Example\n<pre><code class="language-javascript">\nloadURL\n    (require("request"))\n    ("http://google.com")\n    .then(result => console.log("result:", result))\n    .catch(error => console.log("error:", error))\n</code></pre>\n',
        '### readFile\n`fs -> filename -> encoding -> Promise`'
    ]
}
```

# How Do I Document Code Correctly?

The best way is to:

1. write your documentation in Markdown inside of comment blocks
2. write your Hindley Milner expression in a comment line

For example, here is an `example.js` file that has a block comment with markdown and HTML inside a comment block. Immediately below that is the line comment with the Hindley Milner syntax. Immediately below that is the method.

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
<code class="language-javascript">
loadURL
    (require('request'))
    ('http://google.com')
    .then(result => console.log("result:", result))
    .catch(error => console.log("error:", error))
</code>
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

# So this module produces an Object full of Arrays with Text?

Yes. The workflow assumes you're writing Markdown documentation in a README.md for your project.

1. Write your method documentation in your code.
2. Write your project documentation in `README.hbs`; note it's an `.hbs` file, not an `.md`, although you still write in Markdown. You'll put some [Handlebars](http://handlebarsjs.com/) markup in there for your API.
3. Run the `@jesterxl/hm-doc` cli or the `parse` function.
4. Take the text output, inject into the `README.hbs` via Handlebars.
5. Output to `README.md`.

At work, we use an npm command for all this. This library helps those who write functional code where something like jsdoc2md doesn't really work as writing JSDocs for curried code is [miserable](https://github.com/jsdoc3/jsdoc/issues/1286).
