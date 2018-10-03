# Example Documentation

The following is an example of how you write documentation in an `.hbs` file and generate an `.md` file with your api. Below, you'll see normal markdown syntax and documentation. However, the actual API with methods and function signatures will be generated via [Handlebars](http://handlebarsjs.com/).

That way you can documentation your library as normal, but keep the code specific documentation next to the code itself and you only need to write it in 1 place. This is more for commentary on how to install, setup, and whatever other documentation.

# API

The following are the functions exposed from the api. While this shows one file, it could be multiple.

<!-- Note that the markup below is for Handlebars markup.
The squiggly braces represent places where you can put Handlebars block expressions and variables.
It will then inject the text there for you. The output string will be
a document you can write out as an `.md` file. --> 
## ./test/example.js


## .loadURL
`request -> url -> Promise`


#### Description
Loads the contents of a URL via a GET request, and wraps the request.get in a Promise.

| Param    | Type                 | Description                   |
| ------   | -------------------- | ----------------------------- |
| request  | <code>request</code> | A Node request or request-promise module (i.e. require('request')) |
| url      | <code>String</code>  | The URL you wish to load.     |

#### Returns
<code>Promise</code> - Promise contains either the text content of the GET request or the <code>Error</code>.

#### Example
<pre><code class="language-javascript">
loadURL
    (require("request"))
    ("http://google.com")
    .then(result => console.log("result:", result))
    .catch(error => console.log("error:", error))
</code></pre>



Or you can do tabs:

    loadURL
        (require('request'))
        ('http://google.com')
        .then(result => console.log("result:", result))
        .catch(error => console.log("error:", error))

And that'll make a code block.


## .readFile
`fs -> filename -> encoding -> Promise`