const { promisify } = require('util')
const { parseString } = require('xml2js')
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
        tagNameProcessors: [str => {
            const tag = str.split(':')
            return tag.pop()
        }]
    })

    return json
}

module.exports = { xml2js }