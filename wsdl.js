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

function seekBase(base, complexTypes) {
    // debug('seekBase', base)
    const refType = base.split(':').pop()
    if (!complexTypes[refType]) {
        return base
    } else {
        return seekComplex(complexTypes[refType], {}, complexTypes)
    }
}

function seekEnumeration(enumeration) {
    return `enum:${enumeration.map(e => e['@value']).join('/')}`
}

function seekRestriction(restriction, result) {
    // debug('seekRestriction', restriction)
    Object.keys(restriction).map(key => {
        switch (key) {
            case 'enumeration':
                result = seekEnumeration(restriction[key])
                break
            case 'restriction':
                result = seekRestriction(restriction[key], result)
                break
            case 'pattern':
                result = restriction[key]['@value']
                break
            case 'minInclusive':
            case 'maxInclusive':
                break
            // case 'attribute':
            //     result = seekAttribute(restriction[key], result, complexTypes)
            //     break
            default:
                checkCase(key)
                break
        }
    })

    return result
}

function seekSimpleType(type, result) {
    // debug('seekSimpleType', type)
    Object.keys(type).forEach(key => {
        switch (key) {
            case 'restriction':
                result = seekRestriction(type[key], result)
                break
            case 'list':
                result = `list:${type[key]['@itemType']}`
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
        const name = '@' + attr['@name']
        Object.keys(attr).forEach(key => {
            switch (key) {
                case '@name':
                    break
                case '@type':
                    result[name] = seekBase(attr[key], complexTypes)
                    break
                case 'simpleType':
                    result[name] = seekSimpleType(attr[key], {})
                    break
                default:
                    break
            }
        })
    })

    return result
}

function seekSingleElement(element, result, complexTypes) {
    // debug('seekSingleElement', element)
    const name = element['@name']
    const type = element['@type']

    Object.keys(element).forEach(key => {
        switch (key) {
            case '@name':
                break
            case '@type':
                result[name] = seekBase(element[key], complexTypes)
                break
            case 'complexType':
                result[name] = seekComplex(element[key], {}, complexTypes)
                break
            default:
                checkCase(key)
                break
        }
    })

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
    Object.keys(extension).forEach(key => {
        switch (key) {
            case '@base':
                result = seekBase(extension[key], complexTypes)
                break
            case 'attribute':
                result = seekAttribute(extension[key], result, complexTypes)
                break
            case 'sequence':
                result = seekSequence(extension[key], result, complexTypes)
                break
            default:
                checkCase(key)
                break
        }
    })

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

    return result
}

function seekSchema(schema) {
    // debug('seekSchema')
    const raws = {}

    // root here
    const complexTypes = {}
    castArray(schema['complexType']).forEach(complex => {
        complexTypes[complex['@name']] = complex
    })
    castArray(schema['simpleType']).forEach(complex => {
        complexTypes[complex['@name']] = complex
    })

    Object.keys(schema).forEach(key => {
        let data
        switch (key) {
            case 'attribute':
                // data = seekAttribute(schema[key], {}, complexTypes)
                break
            case 'element':
                data = seekElement(schema[key], {}, complexTypes)
                break
            case 'import':
                // ignore, get all from before step
                break
            case 'complexType':
            case 'simpleType':
                // ignore, will process later
                break
            default:
                checkCase(key)
                break
        }

        if (_.isObject(data)) {
            Object.keys(data).forEach(key => {
                raws[key] = xmlbuilder.create({ [key]: data[key] }, { encoding: 'utf-8' }).end()
            })
        }
    })

    return raws
}

module.exports = { seekSchema, castArray }
