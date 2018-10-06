const fs = require('fs')
const { promisify } = require('util')
const cheerio = require('cheerio')

//transform callback in promise
const writeFile = promisify(fs.writeFile)
const readFile = promisify(fs.readFile)
let status = 'ok'

const onError = (e, functionName) => {
    status = 'error'
    console.error(functionName + ' : ' + e)
}

const processHtmlTest = async (data) => {
    try {
        const result = {}
        const $ = cheerio.load(data)
        return result
    }
    catch (e) {
        onError(e, 'processHtmlTest')
    }
}

const readTestHtml = async () => {
    try {
        return await readFile('./test.html', 'utf-8')
    }
    catch (e) {
        onError(e, 'readTestHtml')
    }
}

const writeJsonResult = async (dataString) => {
    try {
        await writeFile('./my-result.json', dataString)
    }
    catch (e) {
        onError(e, 'writeJsonResult')
    }
}

const app = async () => {
    let dataParsed = {}
    try {
        const testHtml = await readTestHtml()
        dataParsed = await processHtmlTest(testHtml)
    } catch (e) {
        console.error(e)
    }
    await writeJsonResult(JSON.stringify({ status, ...dataParsed }, null, 3))
}

app()