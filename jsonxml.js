/**
 * @fileoverview A simple JSON to XML converter
 * @version 1.0.1
 * @author Github: olaf-k | Twitter: @olaf_k
 */

/** @constant {string} */
const DEFAULT_XML_HEADER = '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>'
const valid_start_tag = new RegExp(/^(:|[A-Z]|_|[a-z]|[\xC0-\xD6]|[\xD8-\xF6]|[\xF8-\u02FF]|[\u0370-\u037D]|[\u037F-\u1FFF]|[\u200C-\u200D]|[\u2070-\u218F]|[\u2C00-\u2FEF]|[\u3001-\uD7FF]|[\uF900-\uFDCF]|[\uFDF0-\uFFFD])(:|[A-Z]|_|[a-z]|[\xC0-\xD6]|[\xD8-\xF6]|[\xF8-\u02FF]|[\u0370-\u037D]|[\u037F-\u1FFF]|[\u200C-\u200D]|[\u2070-\u218F]|[\u2C00-\u2FEF]|[\u3001-\uD7FF]|[\uF900-\uFDCF]|[\uFDF0-\uFFFD]|-|\\.|[0-9]|\xB7|[\u0300-\u036F]|[\u203F-\u2040])*$/);
let attempt_bad_name_fix = false;

/**
 * Processes options before actually parsing the JSON object
 * @function jsonxml
 * @param {object} obj - A proper JSON structure
 * @param {object} [options={}] - An object to customize the conversion behavior
 * @param {boolean|string} [options.header] - A truthy value will prepend to default xml header the output, a string value will prepend said string instead
 * @param {string} [options.root] - A tag name that will be used to wrap the output with
 * @param {boolean|string} [options.indent] - A truthy value will generate a prettyprinted output indented with tab, a string value will generate a prettyprinted output indented with this string
 * @param {boolean} [options.attempt_bad_name_fix] - A boolean value to attempt to handle object keys which aren't valid XML tag names
 * @returns {string} The resulting XML string
 */
function jsonxml(obj, options = {}) {
    // .header: xml header
    if (options.header)
        options.header = (typeof options.header === 'string') ? options.header : DEFAULT_XML_HEADER
    else
        options.header = ''

    // .root: global wrapper
    let depth = 0

    if (options.root && typeof options.root == 'string')
        depth = 1
    else
        options.root = false

    // .indent: default output and indented pretty print
    if (options.indent) {
        if (typeof options.indent !== 'string') options.indent = '\t'
        if (options.header) options.header += '\n'
        _format = _formatter(options.indent)
    }

	if (options.attempt_bad_name_fix)
		attempt_bad_name_fix = true;

    return options.header + _parse(obj, options.root, depth)
}

module.exports = jsonxml
module.exports.DEFAULT_XML_HEADER = DEFAULT_XML_HEADER

/**
 * Parses a JSON object recursively and returns an XML representation of it
 * @private
 * @param {object} obj - A proper JSON structure
 * @param {boolean|string} wrap - A tag that the output should be wrapped with or a falsy value if none
 * @param {number} depth - Level of recursion, used for indentation if needed
 * @returns {string} The resulting XML string
 */
function _parse(obj, wrap = false, depth = 0) {
    let out = ''
    let type = jsonTypeOf(obj)

    switch(type) {
        case 'null' :
            out = 'null'
            break
        case 'string' :
            out = obj
            break
        case 'boolean' :
        case 'number' :
            out = obj.toString()
            break
        case 'object' :
            out = Object.keys(obj).map(k => _parse(obj[k], k, depth+1)).join('')
            break
        case 'array' :
            out = obj.map(o => _parse(o, wrap, depth)).join('')
            wrap = false // each subelement is wrapped, not the array itself, depth is not increased for formatting
            break
    }

    return _format(out, wrap, type, depth)
}

/**
 * Outputs an XML-like string without any extra formatting
 * @private
 * @param {string} out - The string value to format
 * @param {boolean|string} wrap - A tag that the output should be wrapped with or a falsy value if none
 * @param {string} type - Not used, present for consistency with _formatter's return function
 * @param {number} depth - Not used, present for consistency with _formatter's return function
 * @returns {string} An XML formatted string
 */
_format = (out, wrap, type, depth) => {
	if (wrap)
	{
		var tag_name = wrap;
		
		if (!(valid_start_tag.test(tag_name)))
		{
			if (attempt_bad_name_fix)
			{
				var temp_tag = "_" + tag_name;
			
				if (valid_start_tag.test(temp_tag))
				{
					tag_name = temp_tag;
				}
				else
				{
					throw(`Unable to use '${wrap}' as an XML tag`);
				}
			}
			else
			{
				throw(`Unable to use '${wrap}' as an XML tag`);
			}
		}
		
		return `<${tag_name}>${out}</${tag_name}>`;
	}
	else
	{
		return out;
	}
}

/**
 * Returns a formatter function that indents the output
 * @function _formatter
 * @private
 * @param {string} indent - The string to be used for indentation
 * @returns {_formatter~_format} A formatting function
 */
/**
 * Outputs an indented XML-like string
 * @callback _formatter~_format
 * @param {string} out - The string value to format
 * @param {boolean|string} wrap - A tag that the output should be wrapped with or a falsy value if none
 * @param {string} type - Type of the output
 * @param {number} depth - Level of indentation
 * @returns {string} An XML formatted string
 */
_formatter = (indent) => (out, wrap, type, depth) => {
    if (!wrap) return out

	var tag_name = wrap;

	if (!(valid_start_tag.test(wrap)))
	{
		if (attempt_bad_name_fix)
		{
			var temp_tag = "_" + tag_name;
			
			if (valid_start_tag.test(temp_tag))
			{
				tag_name = temp_tag;
			}
			else
			{
				throw(`Unable to use '${wrap}' as an XML tag`);
			}
		}
		else
		{
			throw(`Unable to use '${wrap}' as an XML tag`);
		}
	}

    let tab = indent.repeat(depth-1)
	
    if (type === 'object')
        return `${tab}<${tag_name}>\n${out}${tab}</${tag_name}>\n`
    else
        return `${tab}<${tag_name}>${out}</${tag_name}>\n`
}

/**
 * Returns the JSON type of an object
 * @param {object} obj
 * @returns {string} A string with one of the following value: 'number', 'string', 'boolean', 'object', 'array' or 'null'
 */
function jsonTypeOf(obj) {
    let t = typeof obj
    if (t === 'object') {
        if (obj === null) return 'null'
        if (Array.isArray(obj)) return 'array'
    }
    return t
}