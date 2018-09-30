const { codeToMarkdown, parse } = require('./index')

test('parsing example gives us good markdown', done => {
    parse('./example.js')
    .then(result => {
        const has2Comments = result['./example.js'].length === 2
        expect(has2Comments).toBe(true)
        done()
    })
    .catch(done)
})