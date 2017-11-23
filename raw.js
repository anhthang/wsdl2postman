const debug = require('debug')('wsdl2postman:build-raw')
const xmlbuilder = require('xmlbuilder')
const _ = require('lodash')

function castArray(data) {
    return _.castArray(data).filter(i => !!i)
}

/**
 * The simpleType element defines a simple type and specifies the constraints
 * and information about the values of attributes or text-only elements.
 * @param {*} type 
 * @param {*} result 
 */
function seekSimple(type, result) {
    Object.keys(type).forEach(key => {
        switch (key) {
            case 'restriction':
                const enumeration = type[key]['enumeration'].map(e => e['@value'])
                result['#comment'] = `restricted enum value: ${enumeration.join(', ')}`
                result['#text'] = type['@base']
                break
            case 'list':
                result['#comment'] = `list`
                result['#text'] = type[key]['@itemType']
                break
            case 'union':
                break
            // default:
            //     break
        }
    })
    return result
}

function seekAttribute(attrs, result) {
    // debug('seekAttribute', attrs, result)
    attrs.forEach(attr => {
        if (!attr['@type']) {
            result['@' + attr['@name']] = seekSimple(attr['simpleType'], {})
        } else {
            result['@' + attr['@name']] = attr['@type']
        }
    })
    return result
}

function seekSingleElement(element, result, complexTypes) {
    // debug('seekSingleElement', element)
    const key = element['@name']
    const type = element['@type']
    // check max/min occurs here

    if (type) {
        const typeName = type.split(':').pop()
        debug('typeName', typeName)
        if (!complexTypes[typeName]) {
            result[key] = type
        } else {
            result[key] = seekComplex(complexTypes[typeName], {}, complexTypes)
        }
    } else if (element['complexType']) {
        result[key] = seekComplex(element['complexType'], {}, complexTypes)
    } else {
        result[key] = type
    }
    return result
}

/**
 * https://www.w3schools.com/xml/el_element.asp
 * @param {*} elements 
 * @param {*} result 
 */
function seekElement(elements, result, complexTypes) {
    // debug('seekElement', elements)

    elements.forEach(element => {
        seekSingleElement(element, result, complexTypes)
    })

    return result
}

function seekChoice(choice, result, complexTypes) {
    // comment should at top
    const optionals = _.map(choice.element, '@name')
    result['#comment'] = `Optional nodes: ${optionals.join(', ')}`

    choice.element.forEach(element => {
        seekSingleElement(element, result, complexTypes)
    })

    return result
}

function seekComplex(complex, result, complexTypes = {}) {
    // debug('seekComplex', complex, result)
    Object.keys(complex).forEach(key => {
        switch (key) {
            case 'attribute':
                const attrs = castArray(complex[key])
                result = seekAttribute(attrs, result)
                break
            case 'sequence':
                Object.keys(complex[key]).forEach(sKey => {
                    switch (sKey) {
                        case 'element':
                            const elements = castArray(complex[key][sKey])
                            result = seekElement(elements, result, complexTypes)
                            break
                        case 'choice':
                            result = seekChoice(complex[key][sKey], result, complexTypes)
                            break
                        default:
                            break
                    }
                })
                break
            default:
                break
        }
    })

    const hasChild = complex['@sequence']
    if (hasChild) {
        return seekElement(hasChild, result, complexTypes)
    }
    return result
}

function buildRaw(schema) {
    const raws = {}

    // root here
    const complexTypes = {}
    castArray(schema['complexType']).forEach(complex => {
        complexTypes[complex['@name']] = complex
    })

    // debug(complexTypes)
    schema['element'].forEach(s => {
        const raw = {
            [s['@name']]: seekComplex(s['complexType'], {}, complexTypes)
        }

        raws[s['@name']] = xmlbuilder.create(raw, { encoding: 'utf-8' }).end()
    })

    return raws
}

module.exports = { buildRaw, castArray }
