const { parse, writeMarkdownFile } = require('..')
const isEmpty = require('lodash/fp/isEmpty')

test('parsing example gives us good markdown', done => {
    parse('./test/example.js')({})
    .then(result => {
        // console.log("result:", result)
        const has2Comments = result['./test/example.js'].length === 2
        expect(has2Comments).toBe(true)
        done()
    })
    .catch(done)
})

test("parse a file that has comments that don't look like ours results in an empty Object", done => {
    parse('./test/cray.js')({})
    .then(result => {
        // console.log("result:", result)
        expect(isEmpty(result)).toBe(true)
        done()
    })
    .catch(done)
})

test('writeMarkdownFile gives us a good readme', done => {
    writeMarkdownFile('./test/example.js')({})('./test/example.hbs')('./test/example.md')
    .then(result => {
        expect(result).toBe('Successfully wrote filename: ./test/example.md')
        done()
    })
    .catch(done)
})
