const fs = require('fs')
const { promisify } = require('util')
const cheerio = require('cheerio')
const url = require('url')
const queryString = require('query-string');

//transform callback in promise
const writeFile = promisify(fs.writeFile)
const readFile = promisify(fs.readFile)


//status
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

const computeCustomPrice = (target, custom) => {
    try {
        custom['prices'].push({ value: parseFloat(target.find('td').last().html().trim().replace(',', '.')) })
    } catch (e) {
        console.warn('parse price error: ' + e)
    }
}

const getRoundTrips = ($) => {
    const firstProductHeader = $('.product-header').first()
    const roundTrips = [] //cound have been map reduce, better readability
    const custom = { prices: [] }
    computeCustomPrice(firstProductHeader, custom)
    firstProductHeader.siblings().map((i, sibling) => { //brute force processing due to poor HTML structure :-(
        const element = $(sibling)
        let target = false // to avoid double get (could have been in a map), better readability
        target = tryToGet(element, 'product-header') //get custom prices
        if (target) {
            computeCustomPrice(target, custom)
        }
        target = tryToGet(element, 'product-travel-date') //will be a new roundtrip then
        if (target) {
            roundTrips.push({})
        }
        target = tryToGet(element, 'product-details') //get a train
        if (target) {
            roundTrips[roundTrips.length - 1]['type'] = (target.find('.travel-way') || '').html().trim()
            const train = {}
            train['departureTime'] = (target.find('.origin-destination-hour') || '').html().replace('h', ':').trim()
            train['departureStation'] = (target.find('.origin-destination-station') || '').html().trim()
            train['arrivalTime'] = (target.find('.origin-destination-border.origin-destination-hour') || '').html().replace('h', ':').trim()
            train['arrivalStation'] = (target.find('.origin-destination-border.origin-destination-station') || '').html().trim()
            train['type'] = (target.find('.segment').get(0).children[0].data || '').trim() //fragile 
            train['number'] = (target.find('.segment').get(1).children[0].data || '').trim()
            roundTrips[roundTrips.length - 1]['trains'] = [train]
        }
    })
    return { roundTrips, custom }
}

const processHtmlTest = async (data) => {
    try {
        dataNoEscape = data.replace(/\\"/g, '"')
        const $ = cheerio.load(dataNoEscape)
        const { name, code } = getMainInfos($)
        const { roundTrips, custom } = getRoundTrips($)
        const details = { roundTrips }
        const result = { trips: [{ code, name, details }], custom }
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