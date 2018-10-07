const { onError } = require('../../utils/error')
const { tryToGet, queryParser } = require('../../utils/dom')

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

const getRoundTripsInfo = ($) => {
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
    const totalPrice = computeTotalPrice(custom.prices)
    return { price: totalPrice, roundTrips, custom }
}

const getMainInfos = ($) => {
    const firstPrimaryLink = $('.primary-link').first() //the HTML structure suggests one code by mail, so one trip by mail (can be easilu adapted if not)
    const urlPrimary = firstPrimaryLink.attr('href')
    const queryParsed = queryParser(urlPrimary)
    return { name: queryParsed.ownerName, code: queryParsed.pnrRef }
}

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

module.exports = {
    processSncfTest
}