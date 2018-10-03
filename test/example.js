
/*
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


// readFile :: fs -> filename -> encoding -> Promise
const readFile = fs => filename => encoding =>
    new Promise((success, failure) =>
        fs.readFile(filename, encoding, (err, data) =>
            err
            ? failure(err)
            : success(data)
        )
    )

// this is a random comment
const alwaysTrue = () => true