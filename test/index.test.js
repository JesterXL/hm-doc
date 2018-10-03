const { parse, writeMarkdownFile } = require('..')

test('parsing example gives us good markdown', done => {
    parse('./test/example.js')
    .then(result => {
        const has2Comments = result['./test/example.js'].length === 2
        expect(has2Comments).toBe(true)
        done()
    })
    .catch(done)
})

test('writeMarkdownFile gives us a good readme', done => {
    writeMarkdownFile('./test/example.js')('./test/example.hbs')('./test/example.md')
    .then(result => {
        expect(result).toBe('Successfully wrote filename: ./test/example.md')
        done()
    })
    .catch(done)
})