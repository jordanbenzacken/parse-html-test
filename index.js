const fs = require('fs')
const { promisify } = require('util')
const cheerio = require('cheerio')

//transform callback in promise
const writeFile = promisify(fs.writeFile)
const readFile = promisify(fs.readFile)
const result = {}

const onError = (e, functionName) => {
    result['status'] = 'error : ' + e
    console.error(functionName + ' : ' + e)
}

const processHtmlTest = async (data) => {
    try {
        result['status'] = 'ok'
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
    const testHtml = await readTestHtml()
    const dataParsed = await processHtmlTest(testHtml)
    await writeJsonResult(JSON.stringify(dataParsed, null, 3))
}

app()