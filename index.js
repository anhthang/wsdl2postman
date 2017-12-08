const debug = require('debug')('wsdl2postman:index')
const { xml2js } = require('./parser')
const fs = require('fs')
const { get, map, flattenDeep } = require('lodash')
const { seekSchema, castArray } = require('./wsdl')
const pretty = require('pretty-data')

const { promisify } = require('util')
const request = require('request')
const getAsync = promisify(request.get)

async function importSchema(schemaLocation) {
    debug('importing schema')

    const { body } = await getAsync(schemaLocation)
    const json = await xml2js(body)
    return json.schema
}

async function convert(xml) {
    debug('convert')
    const json = await xml2js(xml)

    fs.writeFileSync('juniper.json', JSON.stringify(json, null, 2))

    const out = {
        info: {
            name: get(json, 'definitions.service.@name'),
            schema: 'https://schema.getpostman.com/json/collection/v2.0.0/' // required
        }
    }

    const baseUrl = get(json, 'definitions.service.port.soap:address.@location')
    let schema = castArray(get(json, 'definitions.types.schema'))

    let otherSchemas = []
    const imports = flattenDeep(map(schema, 'import')).filter(i => !!i)
    if (imports.length) {
        const locations = map(imports, '@schemaLocation').filter(i => !!i)
        if (locations.length) {
            otherSchemas = await Promise.all(locations.map(sl => importSchema(sl)))
        }
    }

    schema = schema.concat(otherSchemas)

    let objSchema = {}
    schema.forEach(s => {
        objSchema = { ...objSchema, ...seekSchema(s) }
    })

    const soapAction = {}
    castArray(get(json, 'definitions.binding'))
        .forEach(b => {
            const operationName = get(b.operation, '@name')
            if (operationName) {
                soapAction[operationName] = {
                    action: get(b.operation, 'operation.@soapAction'),
                    method: get(b, 'binding.@verb') || 'POST'
                }
            }
        })

    let item = castArray(get(json, 'definitions.portType')).filter(i => !!i.operation)

    item = item.map(i => {
        let operation = castArray(get(i, 'operation'))

        return {
            name: get(i, '@name'),
            item: operation.map(o => {
                const operationName = get(o, '@name')
                return {
                    name: operationName,
                    request: {
                        url: baseUrl ? `${baseUrl}/${operationName}` : '',
                        method: soapAction[operationName] ? soapAction[operationName].method : '',
                        header: [{
                            key: 'SOAPAction',
                            value: soapAction[operationName] ? soapAction[operationName].action : get(o, 'input.@Action'),
                            disabled: false
                        }, {
                            key: 'Content-Type',
                            value: 'application/xml;charset=utf-8',
                            disabled: false
                        }],
                        body: {
                            mode: 'raw',
                            raw: pretty.pd.xml(objSchema[operationName])
                        }
                    }
                }
            })
        }
    })

    out.item = item
    fs.writeFileSync('output-postman.json', JSON.stringify(out, null, 2))
    return out
}

Promise.resolve(convert(fs.readFileSync('./examples/juniper.wsdl', 'utf-8')))
    .catch(error => {
        console.log('eee', error.stack)
    })

// module.exports = convert
