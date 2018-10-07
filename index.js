const fs = require('fs')
const { promisify } = require('util')
const cheerio = require('cheerio')
const url = require('url')
const queryString = require('query-string');


//transform callback in promise
const writeFile = promisify(fs.writeFile)
const readFile = promisify(fs.readFile)
let status = 'ok'

const onError = (e, functionName) => {
    status = 'error'
    console.error(functionName + ' : ' + e)
}

const getMainInfos = ($) => {
    const firstPrimaryLink = $('.primary-link').first()
    const urlPrimary = firstPrimaryLink.attr('href')
    const queryData = url.parse(urlPrimary).query
    const queryParsed = queryString.parse(queryData)
    return { name: queryParsed.ownerName, code: queryParsed.pnrRef }
}

const tryToGet = (element, selector) => {
    if (element.hasClass(selector)) {
        return element
    }
    const target = element.find('.' + selector)
    if (target.length !== 0) {
        return target
    }
    return false
}

const getRoundTrips = ($) => {
    const firstProductHeader = $('.product-header').first()
    let roundTrips = []
    firstProductHeader.siblings().map((i, sibling) => {
        const element = $(sibling)
        let target = false
        target = tryToGet(element, 'product-travel-date')
        if (target) {
            roundTrips.push({})
        }
        target = tryToGet(element, 'product-details')
        if (target) {
            roundTrips[roundTrips.length - 1]['type'] = target.find('.travel-way').html().trim()
            const train = {}
            train['departureTime'] = target.find('.origin-destination-hour').html().replace('h', ':').trim()
            train['departureStation'] = target.find('.origin-destination-station').html().trim()
            roundTrips[roundTrips.length - 1]['trains'] = [train]
            debugger
        }
    })
    return roundTrips
}

const processHtmlTest = async (data) => {
    try {
        dataNoEscape = data.replace(/\\"/g, '"')
        const $ = cheerio.load(dataNoEscape)
        const { name, code } = getMainInfos($)
        const roundTrips = getRoundTrips($)
        const details = { roundTrips }
        const result = { trips: [{ code, name, details }] }
        return { result }
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
    await writeJsonResult(JSON.stringify({ status, ...dataParsed }, null, 2))
}

app()