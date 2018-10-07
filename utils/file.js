const fs = require('fs')
const { promisify } = require('util')

//transform callback in promise
const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)
const { onError } = require('./error')

const writeJsonResult = async (dataString) => {
    try {
        await writeFile('./my-result.json', dataString)
    }
    catch (e) {
        onError(e, 'writeJsonResult')
    }
}

const readTestHtml = async () => {
    try {
        const result = await readFile('./test.html', 'utf-8') || ''
        return result.replace(/\\"/g, '"')

    }
    catch (e) {
        onError(e, 'readTestHtml')
    }
}

module.exports = {
    writeJsonResult,
    readTestHtml
}