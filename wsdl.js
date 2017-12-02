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
        throw new Error(`missing case [${key}]`)
    }
}

function seekRestriction(type, result) {
    // debug('seekRestriction', type)
    const enumeration = type['restriction']['enumeration'].map(e => e['@value'])
    result = 'enum:' + enumeration.join('/')
    return result
}

function seekSimpleType(type, result) {
    // debug('seekSimpleType', type)
    Object.keys(type).forEach(key => {
        switch (key) {
            case 'restriction':
                result = seekRestriction(type, result)
                break
            case 'list':
                result['#comment'] = `list`
                result['#text'] = type[key]['@itemType']
                break
            default:
                checkCase(key)
                break
        }
    })
    return result
}

function seekAttribute(data, result, complexTypes) {
    // debug('seekAttribute', data)
    const attrs = castArray(data)
    attrs.forEach(attr => {
        if (attr['simpleType']) {
            result['@' + attr['@name']] = seekSimpleType(attr['simpleType'], {})
        } else {
            const type = attr['@type']
            const typeName = type.split(':').pop()
            if (!complexTypes[typeName]) {
                result['@' + attr['@name']] = type
            } else {
                result['@' + attr['@name']] = seekComplex(complexTypes[typeName], {}, complexTypes)
            }
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

function seekElement(data, result, complexTypes) {
    // debug('seekElement', data)
    const elements = castArray(data)
    elements.forEach(element => {
        seekSingleElement(element, result, complexTypes)
    })

    return result
}

function seekChoice(choice, result, complexTypes) {
    // debug('seekChoice', choice)
    // comment should at top
    const optionals = _.map(choice.element, '@name')
    result['#comment'] = `Optional nodes: ${optionals.join(', ')}`

    choice.element.forEach(element => {
        seekSingleElement(element, result, complexTypes)
    })

    return result
}

function seekExtension(extension, result, complexTypes) {
    // debug('seekExtension', extension)
    const base = extension['@base']
    const baseName = base.split(':').pop()
    if (!complexTypes[baseName]) {
        result['#text'] = base
    } else {
        result = seekComplex(complexTypes[baseName], {}, complexTypes)
    }

    result = seekAttribute(extension['attribute'], result, complexTypes)
    return result
}

function seekContent(content, result, complexTypes) {
    // debug('seekContent', content)
    Object.keys(content).map(key => {
        switch (key) {
            case 'extension':
                result = seekExtension(content[key], result, complexTypes)
                break
            case 'restriction':
                result = seekRestriction(content[key], result)
                break
            default:
                checkCase(key)
                break
        }
    })

    return result
}

function seekAny(any, result) {
    return result
}

function seekSequence(sequence, result, complexTypes) {
    // debug('seekSequence', sequence)
    Object.keys(sequence).forEach(key => {
        switch (key) {
            case 'element':
                result = seekElement(sequence[key], result, complexTypes)
                break
            case 'choice':
                result = seekChoice(sequence[key], result, complexTypes)
                break
            case 'any':
                result = seekAny(sequence[key], result)
                break
            default:
                checkCase(key)
                break
        }
    })

    return result
}

function seekComplex(complex, result, complexTypes = {}) {
    // debug('seekComplex', complex)
    Object.keys(complex).forEach(key => {
        switch (key) {
            case 'attribute':
                result = seekAttribute(complex[key], result, complexTypes)
                break
            case 'sequence':
                result = seekSequence(complex[key], result, complexTypes)
                break
            case 'simpleContent':
            case 'complexContent':
                result = seekContent(complex[key], result, complexTypes)
                break
            case 'restriction':
                result = seekRestriction(complex, result)
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

function wsdlHelper(schema) {
    const raws = {}

    // root here
    const complexTypes = {}
    castArray(schema['complexType']).forEach(complex => {
        complexTypes[complex['@name']] = complex
    })
    castArray(schema['simpleType']).forEach(complex => {
        complexTypes[complex['@name']] = complex
    })

    schema['element'].forEach(s => {
        const raw = {
            [s['@name']]: seekComplex(s['complexType'], {}, complexTypes)
        }

        raws[s['@name']] = xmlbuilder.create(raw, { encoding: 'utf-8' }).end()
    })

    return raws
}

module.exports = { wsdlHelper, castArray }
