//to compute status
let status = 'ok'

const onError = (e, functionName) => {
    status = 'error'
    console.error(functionName + ' : ' + e)
}

const getStatus = (e, functionName) => {
    return status
}


module.exports = {
    getStatus,
    onError
}