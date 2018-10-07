const { onError } = require('../../utils/error')
const { tryToGet, queryParser } = require('../../utils/dom')
const moment = require('moment')

const processSncfTest = async ($) => {
    try {
        const { name, code } = getMainInfos($)
        const { roundTrips, custom, price } = getRoundTripsInfo($)
        const details = { price, roundTrips }
        const result = { trips: [{ code, name, details }], custom }
        return { result }
    }
    catch (e) {
        onError(e, 'processSncfTest')
    }
}

const getMainInfos = ($) => {
    const firstPrimaryLink = $('.primary-link').first() //the HTML structure suggests one code by mail, so one trip by mail (can be easilu adapted if not)
    const urlPrimary = firstPrimaryLink.attr('href')
    const queryParsed = queryParser(urlPrimary)
    return { name: queryParsed.ownerName, code: queryParsed.pnrRef }
}

const getRoundTripsInfo = ($) => {
    const firstProductHeader = $('.product-header').first()
    const roundTrips = [] //cound have been map reduce, better readability
    const custom = { prices: [] }
    const transactionDate = getTransactionDate($)
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
            //compute real date (supposing we do not buy ticket more than 1 year before departure)
            const date = moment.utc(target.html().trim(), 'D MMMM')
            date.year(transactionDate.year())
            if (date.isBefore(transactionDate)) {
                date.add(1, 'year')
            }
            roundTrips.push({ date: date.utc().format('YYYY-MM-DD HH:mm:ss.ZZ').replace('+', '') })
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
    const totalPrice = computeTotalPrice(custom.prices)
    return { price: totalPrice, roundTrips, custom }
}


const computeCustomPrice = (target, custom) => {
    try {
        custom['prices'].push({ value: parseFloat(target.find('td').last().html().trim().replace(',', '.')) })
    } catch (e) {
        console.warn('parse price error: ' + e)
    }
}

const computeTotalPrice = (prices = {}) => {
    return prices.reduce((acc, curr) => acc + curr.value, 0) //sum
}

const getTransactionDate = ($) => {
    const node = $('td:contains(" Date de la transaction ")').last().next()
    let rawDate = node.html()
    rawDate = rawDate.substring(0, rawDate.indexOf('(')).trim()
    return moment(rawDate, 'DD Mo YYYY')
}

module.exports = {
    processSncfTest
}