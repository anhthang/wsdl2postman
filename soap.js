const builder = require('xmlbuilder')
const { invert } = require('lodash')

/**
 * soapNsURI
 * 1.1: 'http://schemas.xmlsoap.org/soap/envelope/'
 * 1.2: 'http://www.w3.org/2003/05/soap-envelope'
 */
function createSOAPEnvelope(prefix, nsUri) {
    prefix = prefix || 'soap'
    nsURI = nsURI || 'http://schemas.xmlsoap.org/soap/envelope/'
    var doc = builder.create(prefix + ':Envelope',
        { version: '1.0', encoding: 'UTF-8', standalone: true })
    doc.attribute('xmlns:' + prefix, nsURI)
    let header = doc.element(prefix + ':Header')
    let body = doc.element(prefix + ':Body')
    return {
        body,
        header,
        doc
    }
}

// const namespaces = {
//     wsdl: 'http://schemas.xmlsoap.org/wsdl/',
//     soap: 'http://schemas.xmlsoap.org/wsdl/soap/',
//     soap12: 'http://schemas.xmlsoap.org/wsdl/soap12/',
//     http: 'http://schemas.xmlsoap.org/wsdl/http/',
//     mime: 'http://schemas.xmlsoap.org/wsdl/mime/',
//     soapenc: 'http://schemas.xmlsoap.org/soap/encoding/',
//     soapenv: 'http://schemas.xmlsoap.org/soap/envelope/',
//     xsi_rc: 'http://www.w3.org/2000/10/XMLSchema-instance',
//     xsd_rc: 'http://www.w3.org/2000/10/XMLSchema',
//     xsd: 'http://www.w3.org/2001/XMLSchema',
//     xsi: 'http://www.w3.org/2001/XMLSchema-instance',
//     xml: 'http://www.w3.org/XML/1998/namespace'
// }

function getNamespaces(definitions) {
    debug('getNamespaces')
    const namespaces = {}
    for (let prefix in definitions) {
        if (definitions.hasOwnProperty(prefix) && prefix.startsWith('@')) {
            if (prefix === '')
                continue
            const nsURI = definitions[prefix]
            switch (nsURI) {
                case 'http://xml.apache.org/xml-soap': // apachesoap
                case 'http://schemas.xmlsoap.org/wsdl/': // wsdl
                case 'http://schemas.xmlsoap.org/wsdl/soap/': // wsdlsoap
                case 'http://schemas.xmlsoap.org/wsdl/soap12/': // wsdlsoap12
                case 'http://schemas.xmlsoap.org/soap/encoding/': // soapenc
                case 'http://www.w3.org/2001/XMLSchema': // xsd
                    continue
            }
            if (~nsURI.indexOf('http://schemas.xmlsoap.org/'))
                continue
            if (~nsURI.indexOf('http://www.w3.org/'))
                continue
            if (~nsURI.indexOf('http://xml.apache.org/'))
                continue

            prefix = prefix.replace('@', '')
            namespaces[prefix] = nsURI
        }
    }
    return namespaces
}

function getPrefix(namespaces, nsURI) {
    debug('getPrefix')
    const prefix = invert(namespaces)
    switch (nsURI) {
        case 'http://www.w3.org/XML/1998/namespace':
            return 'xml'
        case 'http://www.w3.org/2000/xmlns/':
            return 'xmlns'
        default:
            return prefix[nsURI]
            break
    }
}

module.exports = {
    createSOAPEnvelope,
    getNamespaces,
    getPrefix
}
