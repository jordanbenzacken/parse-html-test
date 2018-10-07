const { writeJsonResult, readTestHtml } = require('./utils/file')
const cheerio = require('cheerio')
const { getStatus } = require('./utils/error')
const { processSncfTest } = require('./scrap/sncf')

const app = async () => {
    let dataParsed = {}
    try {
        const dataString = await readTestHtml()
        const $ = cheerio.load(dataString)
        dataParsed = await processSncfTest($)
    } catch (e) {
        console.error(e)
    }
    await writeJsonResult(JSON.stringify({ status: getStatus(), ...dataParsed }, null, 2))
}

app()