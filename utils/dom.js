const url = require('url')
const queryString = require('query-string')

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

const queryParser = (urlRaw) => {
    const queryData = url.parse(urlRaw).query
    return queryString.parse(queryData)
}

module.exports = {
    tryToGet,
    queryParser
}