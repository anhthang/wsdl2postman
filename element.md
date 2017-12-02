# XSD Elements
https://www.w3schools.com/xml/schema_elements_ref.asp

| x | Element | Explanation |
| --- | --- | --- |
| | all | Specifies that the child elements can appear in any order. Each child element can occur 0 or | 1 time |
| | annotation | Specifies the top-level element for schema comments |
| | any | Enables the author to extend the XML document with elements not specified by the schema |
| | anyAttribute | Enables the author to extend the XML document with attributes not specified by the | schema |
| | appinfo | Specifies information to be used by the application (must go inside annotation) |
| | attribute | Defines an attribute |
| | attributeGroup | Defines an attribute group to be used in complex type definitions |
| | choice | Allows only one of the elements contained in the declaration to be present within the | containing element |
| | complexContent | Defines extensions or restrictions on a complex type that contains mixed content | or elements only |
| | complexType | Defines a complex type element |
| | documentation | Defines text comments in a schema (must go inside annotation) |
| | element | Defines an element |
| | extension | Extends an existing simpleType or complexType element |
| | field | Specifies an XPath expression that specifies the value used to define an identity | constraint |
| | group | Defines a group of elements to be used in complex type definitions |
| | import | Adds multiple schemas with different target namespace to a document |
| | include | Adds multiple schemas with the same target namespace to a document |
| | key | Specifies an attribute or element value as a key (unique, non-nullable, and always present) | within the containing element in an instance document |
| | keyref | Specifies that an attribute or element value correspond to those of the specified key or | unique element |
| | list | Defines a simple type element as a list of values |
| | notation | Describes the format of non-XML data within an XML document |
| | redefine | Redefines simple and complex types, groups, and attribute groups from an external schema | |
| | restriction | Defines restrictions on a simpleType, simpleContent, or a complexContent |
| | schema | Defines the root element of a schema |
| | selector | Specifies an XPath expression that selects a set of elements for an identity constraint |
| | sequence | Specifies that the child elements must appear in a sequence. Each child element can | occur from 0 to any number of times |
| | simpleContent | Contains extensions or restrictions on a text-only complex type or on a simple type | as content and contains no elements |
| | simpleType | Defines a simple type and specifies the constraints and information about the values | of attributes or text-only elements |
| | union | Defines a simple type as a collection (union) of values from specified simple data types |
| | unique | Defines that an element or an attribute value must be unique within the scope |

# XSD Restrictions/Facets for Datatypes

| x | Constraint | Description |
| --- | --- | --- |
| | enumeration | Defines a list of acceptable values |
| | fractionDigits | Specifies the maximum number of decimal places allowed. Must be equal to or | greater than zero |
| | length | Specifies the exact number of characters or list items allowed. Must be equal to or | greater than zero |
| | maxExclusive | Specifies the upper bounds for numeric values (the value must be less than this | value) |
| | maxInclusive | Specifies the upper bounds for numeric values (the value must be less than or equal | to this value) |
| | maxLength | Specifies the maximum number of characters or list items allowed. Must be equal to or | greater than zero |
| | minExclusive | Specifies the lower bounds for numeric values (the value must be greater than this | value) |
| | minInclusive | Specifies the lower bounds for numeric values (the value must be greater than or | equal to this value) |
| | minLength | Specifies the minimum number of characters or list items allowed. Must be equal to or | greater than zero |
| | pattern | Defines the exact sequence of characters that are acceptable  |
| | totalDigits | Specifies the maximum number of digits allowed. Must be greater than zero |
| | whiteSpace | Specifies how white space (line feeds, tabs, spaces, and carriage returns) is handled |

