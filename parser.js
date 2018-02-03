const { promisify } = require('util')
const { parseString, processors } = require('xml2js')
const parseAsync = promisify(parseString)

async function xml2js(xml) {
    const json = await parseAsync(xml, {
        charkey: '#text',
        explicitArray: false,
        mergeAttrs: true,
        attrNameProcessors: [str => {
            const attr = str.split(':')
            return `@${attr.pop()}`
        }],
        tagNameProcessors: [processors.stripPrefix]
    })

    return json
}

module.exports = { xml2js }