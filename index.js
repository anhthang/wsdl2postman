const debug = require('debug')('wsdl2postman:index')
const { promisify } = require('util')
const { parseString } = require('xml2js')
const parseAsync = promisify(parseString)
const fs = require('fs')
const { get } = require('lodash')
const { buildRaw, castArray } = require('./raw')
const pretty = require('pretty-data')

async function convert(xml) {
    debug('convert')
    const json = await parseAsync(xml, {
        charkey: '#text',
        explicitArray: false,
        mergeAttrs: true,
        attrNameProcessors: [str => `@${str}`],
        tagNameProcessors: [str => {
            const tag = str.split(':')
            return tag.pop()
        }]
    })

    fs.writeFile('juniper.json', JSON.stringify(json, null, 2))

    const out = {
        info: {
            name: get(json, 'definitions.service.@name'),
            schema: 'https://schema.getpostman.com/json/collection/v2.0.0/' // required
        }
    }

    const baseUrl = get(json, 'definitions.service.port.soap:address.@location')
    const schema = castArray(get(json, 'definitions.types.schema'))

    let objSchema = {}
    schema.forEach(s => {
        objSchema = {...objSchema, ...buildRaw(s)}
    })

    // debug('schema', JSON.stringify(objSchema, null, 2))

    let item = castArray(get(json, 'definitions.binding'))

    item = item.map(i => {
        let operation = castArray(get(i, 'operation'))

        return {
            name: get(i, '@name'),
            item: operation.map(o => ({
                name: get(o, '@name'),
                request: {
                    url: baseUrl ? `${baseUrl}/${get(o, '@name')}` : '',
                    method: get(i, 'binding.@verb') || 'POST',
                    header: [{
                        key: 'SOAPAction',
                        value: get(o, 'soap:operation.@soapAction'),
                        disabled: false
                    }, {
                        key: 'Content-Type',
                        value: 'application/xml;charset=utf-8',
                        disabled: false
                    }],
                    body: {
                        mode: 'raw',
                        raw: pretty.pd.xml(objSchema[get(o, '@name')])
                    }
                }
            }))
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
