const debug = require('debug')('wsdl2postman:wsdl')
const xmlbuilder = require('xmlbuilder')
const _ = require('lodash')

function castArray(data) {
    return _.castArray(data).filter(i => !!i)
}

function checkCase(key) {
    if (key.startsWith('@')) {
        // debug(`need to check key [${key}]`)
    } else {
        // throw new Error(`missing case [${key}]`)
    }
}

/**
 * The simpleType element defines a simple type and specifies the constraints
 * and information about the values of attributes or text-only elements.
 * @param {*} type 
 * @param {*} result 
 */
function seekSimpleType(type, result) {
    // debug('seekSimpleType')
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
            default:
                // missing annotation, union
                throw new Error(`simpleType [${key}] not implemented`)
                break
        }
    })
    return result
}

function seekAttribute(data, result) {
    // debug('seekAttribute')
    const attrs = castArray(data)
    attrs.forEach(attr => {
        if (!attr['@type']) {
            result['@' + attr['@name']] = seekSimpleType(attr['simpleType'], {})
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
function seekElement(data, result, complexTypes) {
    // debug('seekElement')
    const elements = castArray(data)
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

/**
 * The extension element extends an existing simpleType or complexType element.
 * @param {*} extension 
 * @param {*} result 
 */
function seekExtension(extension, result, complexTypes) {
    // debug('seekExtension')
    const base = extension['@base']
    const baseName = base.split(':').pop()
    if (!complexTypes[baseName]) {
        result['#text'] = base
    } else {
        result = seekComplex(complexTypes[baseName], {}, complexTypes)
    }

    result = seekAttribute(extension['attribute'], result)
    return result
}

function seekComplexContent(complexContent, result, complexTypes) {
    // debug('seekComplexContent')
    // (annotation?,((group|all|choice|sequence)?,((attribute|attributeGroup)*,anyAttribute?)))    
    Object.keys(complexContent).map(key => {
        switch (key) {
            case 'extension':
                result = seekExtension(complexContent[key], result, complexTypes)
                break
            case 'restriction':
                break
            default:
                // throw new Error(`complexContent [${key}] not implemented`)
                break
        }
    })

    return result
}

function seekComplex(complex, result, complexTypes = {}) {
    // debug('seekComplex')
    Object.keys(complex).forEach(key => {
        switch (key) {
            case 'attribute':
                result = seekAttribute(complex[key], result)
                break
            case 'sequence':
                Object.keys(complex[key]).forEach(sKey => {
                    switch (sKey) {
                        case 'element':
                            result = seekElement(complex[key][sKey], result, complexTypes)
                            break
                        case 'choice':
                            result = seekChoice(complex[key][sKey], result, complexTypes)
                            break
                        default:
                            break
                    }
                })
                break
            case 'simpleContent':
            case 'complexContent':
                result = seekComplexContent(complex[key], result, complexTypes)
                break
            default:
                checkCase(key)
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
