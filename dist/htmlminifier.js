/*!
 * HTMLMinifier v3.5.21 (https://kangax.github.io/html-minifier/)
 * Copyright 2010-2019 Juriy "kangax" Zaytsev
 * Licensed under the MIT license
 */

require=(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  for (var i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(
      uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)
    ))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],2:[function(require,module,exports){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function () { return 42 } }
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

},{"base64-js":1,"ieee754":4}],3:[function(require,module,exports){
(function (global){
/*! https://mths.be/he v1.2.0 by @mathias | MIT license */
;(function(root) {

	// Detect free variables `exports`.
	var freeExports = typeof exports == 'object' && exports;

	// Detect free variable `module`.
	var freeModule = typeof module == 'object' && module &&
		module.exports == freeExports && module;

	// Detect free variable `global`, from Node.js or Browserified code,
	// and use it as `root`.
	var freeGlobal = typeof global == 'object' && global;
	if (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal) {
		root = freeGlobal;
	}

	/*--------------------------------------------------------------------------*/

	// All astral symbols.
	var regexAstralSymbols = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;
	// All ASCII symbols (not just printable ASCII) except those listed in the
	// first column of the overrides table.
	// https://html.spec.whatwg.org/multipage/syntax.html#table-charref-overrides
	var regexAsciiWhitelist = /[\x01-\x7F]/g;
	// All BMP symbols that are not ASCII newlines, printable ASCII symbols, or
	// code points listed in the first column of the overrides table on
	// https://html.spec.whatwg.org/multipage/syntax.html#table-charref-overrides.
	var regexBmpWhitelist = /[\x01-\t\x0B\f\x0E-\x1F\x7F\x81\x8D\x8F\x90\x9D\xA0-\uFFFF]/g;

	var regexEncodeNonAscii = /<\u20D2|=\u20E5|>\u20D2|\u205F\u200A|\u219D\u0338|\u2202\u0338|\u2220\u20D2|\u2229\uFE00|\u222A\uFE00|\u223C\u20D2|\u223D\u0331|\u223E\u0333|\u2242\u0338|\u224B\u0338|\u224D\u20D2|\u224E\u0338|\u224F\u0338|\u2250\u0338|\u2261\u20E5|\u2264\u20D2|\u2265\u20D2|\u2266\u0338|\u2267\u0338|\u2268\uFE00|\u2269\uFE00|\u226A\u0338|\u226A\u20D2|\u226B\u0338|\u226B\u20D2|\u227F\u0338|\u2282\u20D2|\u2283\u20D2|\u228A\uFE00|\u228B\uFE00|\u228F\u0338|\u2290\u0338|\u2293\uFE00|\u2294\uFE00|\u22B4\u20D2|\u22B5\u20D2|\u22D8\u0338|\u22D9\u0338|\u22DA\uFE00|\u22DB\uFE00|\u22F5\u0338|\u22F9\u0338|\u2933\u0338|\u29CF\u0338|\u29D0\u0338|\u2A6D\u0338|\u2A70\u0338|\u2A7D\u0338|\u2A7E\u0338|\u2AA1\u0338|\u2AA2\u0338|\u2AAC\uFE00|\u2AAD\uFE00|\u2AAF\u0338|\u2AB0\u0338|\u2AC5\u0338|\u2AC6\u0338|\u2ACB\uFE00|\u2ACC\uFE00|\u2AFD\u20E5|[\xA0-\u0113\u0116-\u0122\u0124-\u012B\u012E-\u014D\u0150-\u017E\u0192\u01B5\u01F5\u0237\u02C6\u02C7\u02D8-\u02DD\u0311\u0391-\u03A1\u03A3-\u03A9\u03B1-\u03C9\u03D1\u03D2\u03D5\u03D6\u03DC\u03DD\u03F0\u03F1\u03F5\u03F6\u0401-\u040C\u040E-\u044F\u0451-\u045C\u045E\u045F\u2002-\u2005\u2007-\u2010\u2013-\u2016\u2018-\u201A\u201C-\u201E\u2020-\u2022\u2025\u2026\u2030-\u2035\u2039\u203A\u203E\u2041\u2043\u2044\u204F\u2057\u205F-\u2063\u20AC\u20DB\u20DC\u2102\u2105\u210A-\u2113\u2115-\u211E\u2122\u2124\u2127-\u2129\u212C\u212D\u212F-\u2131\u2133-\u2138\u2145-\u2148\u2153-\u215E\u2190-\u219B\u219D-\u21A7\u21A9-\u21AE\u21B0-\u21B3\u21B5-\u21B7\u21BA-\u21DB\u21DD\u21E4\u21E5\u21F5\u21FD-\u2205\u2207-\u2209\u220B\u220C\u220F-\u2214\u2216-\u2218\u221A\u221D-\u2238\u223A-\u2257\u2259\u225A\u225C\u225F-\u2262\u2264-\u228B\u228D-\u229B\u229D-\u22A5\u22A7-\u22B0\u22B2-\u22BB\u22BD-\u22DB\u22DE-\u22E3\u22E6-\u22F7\u22F9-\u22FE\u2305\u2306\u2308-\u2310\u2312\u2313\u2315\u2316\u231C-\u231F\u2322\u2323\u232D\u232E\u2336\u233D\u233F\u237C\u23B0\u23B1\u23B4-\u23B6\u23DC-\u23DF\u23E2\u23E7\u2423\u24C8\u2500\u2502\u250C\u2510\u2514\u2518\u251C\u2524\u252C\u2534\u253C\u2550-\u256C\u2580\u2584\u2588\u2591-\u2593\u25A1\u25AA\u25AB\u25AD\u25AE\u25B1\u25B3-\u25B5\u25B8\u25B9\u25BD-\u25BF\u25C2\u25C3\u25CA\u25CB\u25EC\u25EF\u25F8-\u25FC\u2605\u2606\u260E\u2640\u2642\u2660\u2663\u2665\u2666\u266A\u266D-\u266F\u2713\u2717\u2720\u2736\u2758\u2772\u2773\u27C8\u27C9\u27E6-\u27ED\u27F5-\u27FA\u27FC\u27FF\u2902-\u2905\u290C-\u2913\u2916\u2919-\u2920\u2923-\u292A\u2933\u2935-\u2939\u293C\u293D\u2945\u2948-\u294B\u294E-\u2976\u2978\u2979\u297B-\u297F\u2985\u2986\u298B-\u2996\u299A\u299C\u299D\u29A4-\u29B7\u29B9\u29BB\u29BC\u29BE-\u29C5\u29C9\u29CD-\u29D0\u29DC-\u29DE\u29E3-\u29E5\u29EB\u29F4\u29F6\u2A00-\u2A02\u2A04\u2A06\u2A0C\u2A0D\u2A10-\u2A17\u2A22-\u2A27\u2A29\u2A2A\u2A2D-\u2A31\u2A33-\u2A3C\u2A3F\u2A40\u2A42-\u2A4D\u2A50\u2A53-\u2A58\u2A5A-\u2A5D\u2A5F\u2A66\u2A6A\u2A6D-\u2A75\u2A77-\u2A9A\u2A9D-\u2AA2\u2AA4-\u2AB0\u2AB3-\u2AC8\u2ACB\u2ACC\u2ACF-\u2ADB\u2AE4\u2AE6-\u2AE9\u2AEB-\u2AF3\u2AFD\uFB00-\uFB04]|\uD835[\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDCCF\uDD04\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDD6B]/g;
	var encodeMap = {'\xAD':'shy','\u200C':'zwnj','\u200D':'zwj','\u200E':'lrm','\u2063':'ic','\u2062':'it','\u2061':'af','\u200F':'rlm','\u200B':'ZeroWidthSpace','\u2060':'NoBreak','\u0311':'DownBreve','\u20DB':'tdot','\u20DC':'DotDot','\t':'Tab','\n':'NewLine','\u2008':'puncsp','\u205F':'MediumSpace','\u2009':'thinsp','\u200A':'hairsp','\u2004':'emsp13','\u2002':'ensp','\u2005':'emsp14','\u2003':'emsp','\u2007':'numsp','\xA0':'nbsp','\u205F\u200A':'ThickSpace','\u203E':'oline','_':'lowbar','\u2010':'dash','\u2013':'ndash','\u2014':'mdash','\u2015':'horbar',',':'comma',';':'semi','\u204F':'bsemi',':':'colon','\u2A74':'Colone','!':'excl','\xA1':'iexcl','?':'quest','\xBF':'iquest','.':'period','\u2025':'nldr','\u2026':'mldr','\xB7':'middot','\'':'apos','\u2018':'lsquo','\u2019':'rsquo','\u201A':'sbquo','\u2039':'lsaquo','\u203A':'rsaquo','"':'quot','\u201C':'ldquo','\u201D':'rdquo','\u201E':'bdquo','\xAB':'laquo','\xBB':'raquo','(':'lpar',')':'rpar','[':'lsqb',']':'rsqb','{':'lcub','}':'rcub','\u2308':'lceil','\u2309':'rceil','\u230A':'lfloor','\u230B':'rfloor','\u2985':'lopar','\u2986':'ropar','\u298B':'lbrke','\u298C':'rbrke','\u298D':'lbrkslu','\u298E':'rbrksld','\u298F':'lbrksld','\u2990':'rbrkslu','\u2991':'langd','\u2992':'rangd','\u2993':'lparlt','\u2994':'rpargt','\u2995':'gtlPar','\u2996':'ltrPar','\u27E6':'lobrk','\u27E7':'robrk','\u27E8':'lang','\u27E9':'rang','\u27EA':'Lang','\u27EB':'Rang','\u27EC':'loang','\u27ED':'roang','\u2772':'lbbrk','\u2773':'rbbrk','\u2016':'Vert','\xA7':'sect','\xB6':'para','@':'commat','*':'ast','/':'sol','undefined':null,'&':'amp','#':'num','%':'percnt','\u2030':'permil','\u2031':'pertenk','\u2020':'dagger','\u2021':'Dagger','\u2022':'bull','\u2043':'hybull','\u2032':'prime','\u2033':'Prime','\u2034':'tprime','\u2057':'qprime','\u2035':'bprime','\u2041':'caret','`':'grave','\xB4':'acute','\u02DC':'tilde','^':'Hat','\xAF':'macr','\u02D8':'breve','\u02D9':'dot','\xA8':'die','\u02DA':'ring','\u02DD':'dblac','\xB8':'cedil','\u02DB':'ogon','\u02C6':'circ','\u02C7':'caron','\xB0':'deg','\xA9':'copy','\xAE':'reg','\u2117':'copysr','\u2118':'wp','\u211E':'rx','\u2127':'mho','\u2129':'iiota','\u2190':'larr','\u219A':'nlarr','\u2192':'rarr','\u219B':'nrarr','\u2191':'uarr','\u2193':'darr','\u2194':'harr','\u21AE':'nharr','\u2195':'varr','\u2196':'nwarr','\u2197':'nearr','\u2198':'searr','\u2199':'swarr','\u219D':'rarrw','\u219D\u0338':'nrarrw','\u219E':'Larr','\u219F':'Uarr','\u21A0':'Rarr','\u21A1':'Darr','\u21A2':'larrtl','\u21A3':'rarrtl','\u21A4':'mapstoleft','\u21A5':'mapstoup','\u21A6':'map','\u21A7':'mapstodown','\u21A9':'larrhk','\u21AA':'rarrhk','\u21AB':'larrlp','\u21AC':'rarrlp','\u21AD':'harrw','\u21B0':'lsh','\u21B1':'rsh','\u21B2':'ldsh','\u21B3':'rdsh','\u21B5':'crarr','\u21B6':'cularr','\u21B7':'curarr','\u21BA':'olarr','\u21BB':'orarr','\u21BC':'lharu','\u21BD':'lhard','\u21BE':'uharr','\u21BF':'uharl','\u21C0':'rharu','\u21C1':'rhard','\u21C2':'dharr','\u21C3':'dharl','\u21C4':'rlarr','\u21C5':'udarr','\u21C6':'lrarr','\u21C7':'llarr','\u21C8':'uuarr','\u21C9':'rrarr','\u21CA':'ddarr','\u21CB':'lrhar','\u21CC':'rlhar','\u21D0':'lArr','\u21CD':'nlArr','\u21D1':'uArr','\u21D2':'rArr','\u21CF':'nrArr','\u21D3':'dArr','\u21D4':'iff','\u21CE':'nhArr','\u21D5':'vArr','\u21D6':'nwArr','\u21D7':'neArr','\u21D8':'seArr','\u21D9':'swArr','\u21DA':'lAarr','\u21DB':'rAarr','\u21DD':'zigrarr','\u21E4':'larrb','\u21E5':'rarrb','\u21F5':'duarr','\u21FD':'loarr','\u21FE':'roarr','\u21FF':'hoarr','\u2200':'forall','\u2201':'comp','\u2202':'part','\u2202\u0338':'npart','\u2203':'exist','\u2204':'nexist','\u2205':'empty','\u2207':'Del','\u2208':'in','\u2209':'notin','\u220B':'ni','\u220C':'notni','\u03F6':'bepsi','\u220F':'prod','\u2210':'coprod','\u2211':'sum','+':'plus','\xB1':'pm','\xF7':'div','\xD7':'times','<':'lt','\u226E':'nlt','<\u20D2':'nvlt','=':'equals','\u2260':'ne','=\u20E5':'bne','\u2A75':'Equal','>':'gt','\u226F':'ngt','>\u20D2':'nvgt','\xAC':'not','|':'vert','\xA6':'brvbar','\u2212':'minus','\u2213':'mp','\u2214':'plusdo','\u2044':'frasl','\u2216':'setmn','\u2217':'lowast','\u2218':'compfn','\u221A':'Sqrt','\u221D':'prop','\u221E':'infin','\u221F':'angrt','\u2220':'ang','\u2220\u20D2':'nang','\u2221':'angmsd','\u2222':'angsph','\u2223':'mid','\u2224':'nmid','\u2225':'par','\u2226':'npar','\u2227':'and','\u2228':'or','\u2229':'cap','\u2229\uFE00':'caps','\u222A':'cup','\u222A\uFE00':'cups','\u222B':'int','\u222C':'Int','\u222D':'tint','\u2A0C':'qint','\u222E':'oint','\u222F':'Conint','\u2230':'Cconint','\u2231':'cwint','\u2232':'cwconint','\u2233':'awconint','\u2234':'there4','\u2235':'becaus','\u2236':'ratio','\u2237':'Colon','\u2238':'minusd','\u223A':'mDDot','\u223B':'homtht','\u223C':'sim','\u2241':'nsim','\u223C\u20D2':'nvsim','\u223D':'bsim','\u223D\u0331':'race','\u223E':'ac','\u223E\u0333':'acE','\u223F':'acd','\u2240':'wr','\u2242':'esim','\u2242\u0338':'nesim','\u2243':'sime','\u2244':'nsime','\u2245':'cong','\u2247':'ncong','\u2246':'simne','\u2248':'ap','\u2249':'nap','\u224A':'ape','\u224B':'apid','\u224B\u0338':'napid','\u224C':'bcong','\u224D':'CupCap','\u226D':'NotCupCap','\u224D\u20D2':'nvap','\u224E':'bump','\u224E\u0338':'nbump','\u224F':'bumpe','\u224F\u0338':'nbumpe','\u2250':'doteq','\u2250\u0338':'nedot','\u2251':'eDot','\u2252':'efDot','\u2253':'erDot','\u2254':'colone','\u2255':'ecolon','\u2256':'ecir','\u2257':'cire','\u2259':'wedgeq','\u225A':'veeeq','\u225C':'trie','\u225F':'equest','\u2261':'equiv','\u2262':'nequiv','\u2261\u20E5':'bnequiv','\u2264':'le','\u2270':'nle','\u2264\u20D2':'nvle','\u2265':'ge','\u2271':'nge','\u2265\u20D2':'nvge','\u2266':'lE','\u2266\u0338':'nlE','\u2267':'gE','\u2267\u0338':'ngE','\u2268\uFE00':'lvnE','\u2268':'lnE','\u2269':'gnE','\u2269\uFE00':'gvnE','\u226A':'ll','\u226A\u0338':'nLtv','\u226A\u20D2':'nLt','\u226B':'gg','\u226B\u0338':'nGtv','\u226B\u20D2':'nGt','\u226C':'twixt','\u2272':'lsim','\u2274':'nlsim','\u2273':'gsim','\u2275':'ngsim','\u2276':'lg','\u2278':'ntlg','\u2277':'gl','\u2279':'ntgl','\u227A':'pr','\u2280':'npr','\u227B':'sc','\u2281':'nsc','\u227C':'prcue','\u22E0':'nprcue','\u227D':'sccue','\u22E1':'nsccue','\u227E':'prsim','\u227F':'scsim','\u227F\u0338':'NotSucceedsTilde','\u2282':'sub','\u2284':'nsub','\u2282\u20D2':'vnsub','\u2283':'sup','\u2285':'nsup','\u2283\u20D2':'vnsup','\u2286':'sube','\u2288':'nsube','\u2287':'supe','\u2289':'nsupe','\u228A\uFE00':'vsubne','\u228A':'subne','\u228B\uFE00':'vsupne','\u228B':'supne','\u228D':'cupdot','\u228E':'uplus','\u228F':'sqsub','\u228F\u0338':'NotSquareSubset','\u2290':'sqsup','\u2290\u0338':'NotSquareSuperset','\u2291':'sqsube','\u22E2':'nsqsube','\u2292':'sqsupe','\u22E3':'nsqsupe','\u2293':'sqcap','\u2293\uFE00':'sqcaps','\u2294':'sqcup','\u2294\uFE00':'sqcups','\u2295':'oplus','\u2296':'ominus','\u2297':'otimes','\u2298':'osol','\u2299':'odot','\u229A':'ocir','\u229B':'oast','\u229D':'odash','\u229E':'plusb','\u229F':'minusb','\u22A0':'timesb','\u22A1':'sdotb','\u22A2':'vdash','\u22AC':'nvdash','\u22A3':'dashv','\u22A4':'top','\u22A5':'bot','\u22A7':'models','\u22A8':'vDash','\u22AD':'nvDash','\u22A9':'Vdash','\u22AE':'nVdash','\u22AA':'Vvdash','\u22AB':'VDash','\u22AF':'nVDash','\u22B0':'prurel','\u22B2':'vltri','\u22EA':'nltri','\u22B3':'vrtri','\u22EB':'nrtri','\u22B4':'ltrie','\u22EC':'nltrie','\u22B4\u20D2':'nvltrie','\u22B5':'rtrie','\u22ED':'nrtrie','\u22B5\u20D2':'nvrtrie','\u22B6':'origof','\u22B7':'imof','\u22B8':'mumap','\u22B9':'hercon','\u22BA':'intcal','\u22BB':'veebar','\u22BD':'barvee','\u22BE':'angrtvb','\u22BF':'lrtri','\u22C0':'Wedge','\u22C1':'Vee','\u22C2':'xcap','\u22C3':'xcup','\u22C4':'diam','\u22C5':'sdot','\u22C6':'Star','\u22C7':'divonx','\u22C8':'bowtie','\u22C9':'ltimes','\u22CA':'rtimes','\u22CB':'lthree','\u22CC':'rthree','\u22CD':'bsime','\u22CE':'cuvee','\u22CF':'cuwed','\u22D0':'Sub','\u22D1':'Sup','\u22D2':'Cap','\u22D3':'Cup','\u22D4':'fork','\u22D5':'epar','\u22D6':'ltdot','\u22D7':'gtdot','\u22D8':'Ll','\u22D8\u0338':'nLl','\u22D9':'Gg','\u22D9\u0338':'nGg','\u22DA\uFE00':'lesg','\u22DA':'leg','\u22DB':'gel','\u22DB\uFE00':'gesl','\u22DE':'cuepr','\u22DF':'cuesc','\u22E6':'lnsim','\u22E7':'gnsim','\u22E8':'prnsim','\u22E9':'scnsim','\u22EE':'vellip','\u22EF':'ctdot','\u22F0':'utdot','\u22F1':'dtdot','\u22F2':'disin','\u22F3':'isinsv','\u22F4':'isins','\u22F5':'isindot','\u22F5\u0338':'notindot','\u22F6':'notinvc','\u22F7':'notinvb','\u22F9':'isinE','\u22F9\u0338':'notinE','\u22FA':'nisd','\u22FB':'xnis','\u22FC':'nis','\u22FD':'notnivc','\u22FE':'notnivb','\u2305':'barwed','\u2306':'Barwed','\u230C':'drcrop','\u230D':'dlcrop','\u230E':'urcrop','\u230F':'ulcrop','\u2310':'bnot','\u2312':'profline','\u2313':'profsurf','\u2315':'telrec','\u2316':'target','\u231C':'ulcorn','\u231D':'urcorn','\u231E':'dlcorn','\u231F':'drcorn','\u2322':'frown','\u2323':'smile','\u232D':'cylcty','\u232E':'profalar','\u2336':'topbot','\u233D':'ovbar','\u233F':'solbar','\u237C':'angzarr','\u23B0':'lmoust','\u23B1':'rmoust','\u23B4':'tbrk','\u23B5':'bbrk','\u23B6':'bbrktbrk','\u23DC':'OverParenthesis','\u23DD':'UnderParenthesis','\u23DE':'OverBrace','\u23DF':'UnderBrace','\u23E2':'trpezium','\u23E7':'elinters','\u2423':'blank','\u2500':'boxh','\u2502':'boxv','\u250C':'boxdr','\u2510':'boxdl','\u2514':'boxur','\u2518':'boxul','\u251C':'boxvr','\u2524':'boxvl','\u252C':'boxhd','\u2534':'boxhu','\u253C':'boxvh','\u2550':'boxH','\u2551':'boxV','\u2552':'boxdR','\u2553':'boxDr','\u2554':'boxDR','\u2555':'boxdL','\u2556':'boxDl','\u2557':'boxDL','\u2558':'boxuR','\u2559':'boxUr','\u255A':'boxUR','\u255B':'boxuL','\u255C':'boxUl','\u255D':'boxUL','\u255E':'boxvR','\u255F':'boxVr','\u2560':'boxVR','\u2561':'boxvL','\u2562':'boxVl','\u2563':'boxVL','\u2564':'boxHd','\u2565':'boxhD','\u2566':'boxHD','\u2567':'boxHu','\u2568':'boxhU','\u2569':'boxHU','\u256A':'boxvH','\u256B':'boxVh','\u256C':'boxVH','\u2580':'uhblk','\u2584':'lhblk','\u2588':'block','\u2591':'blk14','\u2592':'blk12','\u2593':'blk34','\u25A1':'squ','\u25AA':'squf','\u25AB':'EmptyVerySmallSquare','\u25AD':'rect','\u25AE':'marker','\u25B1':'fltns','\u25B3':'xutri','\u25B4':'utrif','\u25B5':'utri','\u25B8':'rtrif','\u25B9':'rtri','\u25BD':'xdtri','\u25BE':'dtrif','\u25BF':'dtri','\u25C2':'ltrif','\u25C3':'ltri','\u25CA':'loz','\u25CB':'cir','\u25EC':'tridot','\u25EF':'xcirc','\u25F8':'ultri','\u25F9':'urtri','\u25FA':'lltri','\u25FB':'EmptySmallSquare','\u25FC':'FilledSmallSquare','\u2605':'starf','\u2606':'star','\u260E':'phone','\u2640':'female','\u2642':'male','\u2660':'spades','\u2663':'clubs','\u2665':'hearts','\u2666':'diams','\u266A':'sung','\u2713':'check','\u2717':'cross','\u2720':'malt','\u2736':'sext','\u2758':'VerticalSeparator','\u27C8':'bsolhsub','\u27C9':'suphsol','\u27F5':'xlarr','\u27F6':'xrarr','\u27F7':'xharr','\u27F8':'xlArr','\u27F9':'xrArr','\u27FA':'xhArr','\u27FC':'xmap','\u27FF':'dzigrarr','\u2902':'nvlArr','\u2903':'nvrArr','\u2904':'nvHarr','\u2905':'Map','\u290C':'lbarr','\u290D':'rbarr','\u290E':'lBarr','\u290F':'rBarr','\u2910':'RBarr','\u2911':'DDotrahd','\u2912':'UpArrowBar','\u2913':'DownArrowBar','\u2916':'Rarrtl','\u2919':'latail','\u291A':'ratail','\u291B':'lAtail','\u291C':'rAtail','\u291D':'larrfs','\u291E':'rarrfs','\u291F':'larrbfs','\u2920':'rarrbfs','\u2923':'nwarhk','\u2924':'nearhk','\u2925':'searhk','\u2926':'swarhk','\u2927':'nwnear','\u2928':'toea','\u2929':'tosa','\u292A':'swnwar','\u2933':'rarrc','\u2933\u0338':'nrarrc','\u2935':'cudarrr','\u2936':'ldca','\u2937':'rdca','\u2938':'cudarrl','\u2939':'larrpl','\u293C':'curarrm','\u293D':'cularrp','\u2945':'rarrpl','\u2948':'harrcir','\u2949':'Uarrocir','\u294A':'lurdshar','\u294B':'ldrushar','\u294E':'LeftRightVector','\u294F':'RightUpDownVector','\u2950':'DownLeftRightVector','\u2951':'LeftUpDownVector','\u2952':'LeftVectorBar','\u2953':'RightVectorBar','\u2954':'RightUpVectorBar','\u2955':'RightDownVectorBar','\u2956':'DownLeftVectorBar','\u2957':'DownRightVectorBar','\u2958':'LeftUpVectorBar','\u2959':'LeftDownVectorBar','\u295A':'LeftTeeVector','\u295B':'RightTeeVector','\u295C':'RightUpTeeVector','\u295D':'RightDownTeeVector','\u295E':'DownLeftTeeVector','\u295F':'DownRightTeeVector','\u2960':'LeftUpTeeVector','\u2961':'LeftDownTeeVector','\u2962':'lHar','\u2963':'uHar','\u2964':'rHar','\u2965':'dHar','\u2966':'luruhar','\u2967':'ldrdhar','\u2968':'ruluhar','\u2969':'rdldhar','\u296A':'lharul','\u296B':'llhard','\u296C':'rharul','\u296D':'lrhard','\u296E':'udhar','\u296F':'duhar','\u2970':'RoundImplies','\u2971':'erarr','\u2972':'simrarr','\u2973':'larrsim','\u2974':'rarrsim','\u2975':'rarrap','\u2976':'ltlarr','\u2978':'gtrarr','\u2979':'subrarr','\u297B':'suplarr','\u297C':'lfisht','\u297D':'rfisht','\u297E':'ufisht','\u297F':'dfisht','\u299A':'vzigzag','\u299C':'vangrt','\u299D':'angrtvbd','\u29A4':'ange','\u29A5':'range','\u29A6':'dwangle','\u29A7':'uwangle','\u29A8':'angmsdaa','\u29A9':'angmsdab','\u29AA':'angmsdac','\u29AB':'angmsdad','\u29AC':'angmsdae','\u29AD':'angmsdaf','\u29AE':'angmsdag','\u29AF':'angmsdah','\u29B0':'bemptyv','\u29B1':'demptyv','\u29B2':'cemptyv','\u29B3':'raemptyv','\u29B4':'laemptyv','\u29B5':'ohbar','\u29B6':'omid','\u29B7':'opar','\u29B9':'operp','\u29BB':'olcross','\u29BC':'odsold','\u29BE':'olcir','\u29BF':'ofcir','\u29C0':'olt','\u29C1':'ogt','\u29C2':'cirscir','\u29C3':'cirE','\u29C4':'solb','\u29C5':'bsolb','\u29C9':'boxbox','\u29CD':'trisb','\u29CE':'rtriltri','\u29CF':'LeftTriangleBar','\u29CF\u0338':'NotLeftTriangleBar','\u29D0':'RightTriangleBar','\u29D0\u0338':'NotRightTriangleBar','\u29DC':'iinfin','\u29DD':'infintie','\u29DE':'nvinfin','\u29E3':'eparsl','\u29E4':'smeparsl','\u29E5':'eqvparsl','\u29EB':'lozf','\u29F4':'RuleDelayed','\u29F6':'dsol','\u2A00':'xodot','\u2A01':'xoplus','\u2A02':'xotime','\u2A04':'xuplus','\u2A06':'xsqcup','\u2A0D':'fpartint','\u2A10':'cirfnint','\u2A11':'awint','\u2A12':'rppolint','\u2A13':'scpolint','\u2A14':'npolint','\u2A15':'pointint','\u2A16':'quatint','\u2A17':'intlarhk','\u2A22':'pluscir','\u2A23':'plusacir','\u2A24':'simplus','\u2A25':'plusdu','\u2A26':'plussim','\u2A27':'plustwo','\u2A29':'mcomma','\u2A2A':'minusdu','\u2A2D':'loplus','\u2A2E':'roplus','\u2A2F':'Cross','\u2A30':'timesd','\u2A31':'timesbar','\u2A33':'smashp','\u2A34':'lotimes','\u2A35':'rotimes','\u2A36':'otimesas','\u2A37':'Otimes','\u2A38':'odiv','\u2A39':'triplus','\u2A3A':'triminus','\u2A3B':'tritime','\u2A3C':'iprod','\u2A3F':'amalg','\u2A40':'capdot','\u2A42':'ncup','\u2A43':'ncap','\u2A44':'capand','\u2A45':'cupor','\u2A46':'cupcap','\u2A47':'capcup','\u2A48':'cupbrcap','\u2A49':'capbrcup','\u2A4A':'cupcup','\u2A4B':'capcap','\u2A4C':'ccups','\u2A4D':'ccaps','\u2A50':'ccupssm','\u2A53':'And','\u2A54':'Or','\u2A55':'andand','\u2A56':'oror','\u2A57':'orslope','\u2A58':'andslope','\u2A5A':'andv','\u2A5B':'orv','\u2A5C':'andd','\u2A5D':'ord','\u2A5F':'wedbar','\u2A66':'sdote','\u2A6A':'simdot','\u2A6D':'congdot','\u2A6D\u0338':'ncongdot','\u2A6E':'easter','\u2A6F':'apacir','\u2A70':'apE','\u2A70\u0338':'napE','\u2A71':'eplus','\u2A72':'pluse','\u2A73':'Esim','\u2A77':'eDDot','\u2A78':'equivDD','\u2A79':'ltcir','\u2A7A':'gtcir','\u2A7B':'ltquest','\u2A7C':'gtquest','\u2A7D':'les','\u2A7D\u0338':'nles','\u2A7E':'ges','\u2A7E\u0338':'nges','\u2A7F':'lesdot','\u2A80':'gesdot','\u2A81':'lesdoto','\u2A82':'gesdoto','\u2A83':'lesdotor','\u2A84':'gesdotol','\u2A85':'lap','\u2A86':'gap','\u2A87':'lne','\u2A88':'gne','\u2A89':'lnap','\u2A8A':'gnap','\u2A8B':'lEg','\u2A8C':'gEl','\u2A8D':'lsime','\u2A8E':'gsime','\u2A8F':'lsimg','\u2A90':'gsiml','\u2A91':'lgE','\u2A92':'glE','\u2A93':'lesges','\u2A94':'gesles','\u2A95':'els','\u2A96':'egs','\u2A97':'elsdot','\u2A98':'egsdot','\u2A99':'el','\u2A9A':'eg','\u2A9D':'siml','\u2A9E':'simg','\u2A9F':'simlE','\u2AA0':'simgE','\u2AA1':'LessLess','\u2AA1\u0338':'NotNestedLessLess','\u2AA2':'GreaterGreater','\u2AA2\u0338':'NotNestedGreaterGreater','\u2AA4':'glj','\u2AA5':'gla','\u2AA6':'ltcc','\u2AA7':'gtcc','\u2AA8':'lescc','\u2AA9':'gescc','\u2AAA':'smt','\u2AAB':'lat','\u2AAC':'smte','\u2AAC\uFE00':'smtes','\u2AAD':'late','\u2AAD\uFE00':'lates','\u2AAE':'bumpE','\u2AAF':'pre','\u2AAF\u0338':'npre','\u2AB0':'sce','\u2AB0\u0338':'nsce','\u2AB3':'prE','\u2AB4':'scE','\u2AB5':'prnE','\u2AB6':'scnE','\u2AB7':'prap','\u2AB8':'scap','\u2AB9':'prnap','\u2ABA':'scnap','\u2ABB':'Pr','\u2ABC':'Sc','\u2ABD':'subdot','\u2ABE':'supdot','\u2ABF':'subplus','\u2AC0':'supplus','\u2AC1':'submult','\u2AC2':'supmult','\u2AC3':'subedot','\u2AC4':'supedot','\u2AC5':'subE','\u2AC5\u0338':'nsubE','\u2AC6':'supE','\u2AC6\u0338':'nsupE','\u2AC7':'subsim','\u2AC8':'supsim','\u2ACB\uFE00':'vsubnE','\u2ACB':'subnE','\u2ACC\uFE00':'vsupnE','\u2ACC':'supnE','\u2ACF':'csub','\u2AD0':'csup','\u2AD1':'csube','\u2AD2':'csupe','\u2AD3':'subsup','\u2AD4':'supsub','\u2AD5':'subsub','\u2AD6':'supsup','\u2AD7':'suphsub','\u2AD8':'supdsub','\u2AD9':'forkv','\u2ADA':'topfork','\u2ADB':'mlcp','\u2AE4':'Dashv','\u2AE6':'Vdashl','\u2AE7':'Barv','\u2AE8':'vBar','\u2AE9':'vBarv','\u2AEB':'Vbar','\u2AEC':'Not','\u2AED':'bNot','\u2AEE':'rnmid','\u2AEF':'cirmid','\u2AF0':'midcir','\u2AF1':'topcir','\u2AF2':'nhpar','\u2AF3':'parsim','\u2AFD':'parsl','\u2AFD\u20E5':'nparsl','\u266D':'flat','\u266E':'natur','\u266F':'sharp','\xA4':'curren','\xA2':'cent','$':'dollar','\xA3':'pound','\xA5':'yen','\u20AC':'euro','\xB9':'sup1','\xBD':'half','\u2153':'frac13','\xBC':'frac14','\u2155':'frac15','\u2159':'frac16','\u215B':'frac18','\xB2':'sup2','\u2154':'frac23','\u2156':'frac25','\xB3':'sup3','\xBE':'frac34','\u2157':'frac35','\u215C':'frac38','\u2158':'frac45','\u215A':'frac56','\u215D':'frac58','\u215E':'frac78','\uD835\uDCB6':'ascr','\uD835\uDD52':'aopf','\uD835\uDD1E':'afr','\uD835\uDD38':'Aopf','\uD835\uDD04':'Afr','\uD835\uDC9C':'Ascr','\xAA':'ordf','\xE1':'aacute','\xC1':'Aacute','\xE0':'agrave','\xC0':'Agrave','\u0103':'abreve','\u0102':'Abreve','\xE2':'acirc','\xC2':'Acirc','\xE5':'aring','\xC5':'angst','\xE4':'auml','\xC4':'Auml','\xE3':'atilde','\xC3':'Atilde','\u0105':'aogon','\u0104':'Aogon','\u0101':'amacr','\u0100':'Amacr','\xE6':'aelig','\xC6':'AElig','\uD835\uDCB7':'bscr','\uD835\uDD53':'bopf','\uD835\uDD1F':'bfr','\uD835\uDD39':'Bopf','\u212C':'Bscr','\uD835\uDD05':'Bfr','\uD835\uDD20':'cfr','\uD835\uDCB8':'cscr','\uD835\uDD54':'copf','\u212D':'Cfr','\uD835\uDC9E':'Cscr','\u2102':'Copf','\u0107':'cacute','\u0106':'Cacute','\u0109':'ccirc','\u0108':'Ccirc','\u010D':'ccaron','\u010C':'Ccaron','\u010B':'cdot','\u010A':'Cdot','\xE7':'ccedil','\xC7':'Ccedil','\u2105':'incare','\uD835\uDD21':'dfr','\u2146':'dd','\uD835\uDD55':'dopf','\uD835\uDCB9':'dscr','\uD835\uDC9F':'Dscr','\uD835\uDD07':'Dfr','\u2145':'DD','\uD835\uDD3B':'Dopf','\u010F':'dcaron','\u010E':'Dcaron','\u0111':'dstrok','\u0110':'Dstrok','\xF0':'eth','\xD0':'ETH','\u2147':'ee','\u212F':'escr','\uD835\uDD22':'efr','\uD835\uDD56':'eopf','\u2130':'Escr','\uD835\uDD08':'Efr','\uD835\uDD3C':'Eopf','\xE9':'eacute','\xC9':'Eacute','\xE8':'egrave','\xC8':'Egrave','\xEA':'ecirc','\xCA':'Ecirc','\u011B':'ecaron','\u011A':'Ecaron','\xEB':'euml','\xCB':'Euml','\u0117':'edot','\u0116':'Edot','\u0119':'eogon','\u0118':'Eogon','\u0113':'emacr','\u0112':'Emacr','\uD835\uDD23':'ffr','\uD835\uDD57':'fopf','\uD835\uDCBB':'fscr','\uD835\uDD09':'Ffr','\uD835\uDD3D':'Fopf','\u2131':'Fscr','\uFB00':'fflig','\uFB03':'ffilig','\uFB04':'ffllig','\uFB01':'filig','fj':'fjlig','\uFB02':'fllig','\u0192':'fnof','\u210A':'gscr','\uD835\uDD58':'gopf','\uD835\uDD24':'gfr','\uD835\uDCA2':'Gscr','\uD835\uDD3E':'Gopf','\uD835\uDD0A':'Gfr','\u01F5':'gacute','\u011F':'gbreve','\u011E':'Gbreve','\u011D':'gcirc','\u011C':'Gcirc','\u0121':'gdot','\u0120':'Gdot','\u0122':'Gcedil','\uD835\uDD25':'hfr','\u210E':'planckh','\uD835\uDCBD':'hscr','\uD835\uDD59':'hopf','\u210B':'Hscr','\u210C':'Hfr','\u210D':'Hopf','\u0125':'hcirc','\u0124':'Hcirc','\u210F':'hbar','\u0127':'hstrok','\u0126':'Hstrok','\uD835\uDD5A':'iopf','\uD835\uDD26':'ifr','\uD835\uDCBE':'iscr','\u2148':'ii','\uD835\uDD40':'Iopf','\u2110':'Iscr','\u2111':'Im','\xED':'iacute','\xCD':'Iacute','\xEC':'igrave','\xCC':'Igrave','\xEE':'icirc','\xCE':'Icirc','\xEF':'iuml','\xCF':'Iuml','\u0129':'itilde','\u0128':'Itilde','\u0130':'Idot','\u012F':'iogon','\u012E':'Iogon','\u012B':'imacr','\u012A':'Imacr','\u0133':'ijlig','\u0132':'IJlig','\u0131':'imath','\uD835\uDCBF':'jscr','\uD835\uDD5B':'jopf','\uD835\uDD27':'jfr','\uD835\uDCA5':'Jscr','\uD835\uDD0D':'Jfr','\uD835\uDD41':'Jopf','\u0135':'jcirc','\u0134':'Jcirc','\u0237':'jmath','\uD835\uDD5C':'kopf','\uD835\uDCC0':'kscr','\uD835\uDD28':'kfr','\uD835\uDCA6':'Kscr','\uD835\uDD42':'Kopf','\uD835\uDD0E':'Kfr','\u0137':'kcedil','\u0136':'Kcedil','\uD835\uDD29':'lfr','\uD835\uDCC1':'lscr','\u2113':'ell','\uD835\uDD5D':'lopf','\u2112':'Lscr','\uD835\uDD0F':'Lfr','\uD835\uDD43':'Lopf','\u013A':'lacute','\u0139':'Lacute','\u013E':'lcaron','\u013D':'Lcaron','\u013C':'lcedil','\u013B':'Lcedil','\u0142':'lstrok','\u0141':'Lstrok','\u0140':'lmidot','\u013F':'Lmidot','\uD835\uDD2A':'mfr','\uD835\uDD5E':'mopf','\uD835\uDCC2':'mscr','\uD835\uDD10':'Mfr','\uD835\uDD44':'Mopf','\u2133':'Mscr','\uD835\uDD2B':'nfr','\uD835\uDD5F':'nopf','\uD835\uDCC3':'nscr','\u2115':'Nopf','\uD835\uDCA9':'Nscr','\uD835\uDD11':'Nfr','\u0144':'nacute','\u0143':'Nacute','\u0148':'ncaron','\u0147':'Ncaron','\xF1':'ntilde','\xD1':'Ntilde','\u0146':'ncedil','\u0145':'Ncedil','\u2116':'numero','\u014B':'eng','\u014A':'ENG','\uD835\uDD60':'oopf','\uD835\uDD2C':'ofr','\u2134':'oscr','\uD835\uDCAA':'Oscr','\uD835\uDD12':'Ofr','\uD835\uDD46':'Oopf','\xBA':'ordm','\xF3':'oacute','\xD3':'Oacute','\xF2':'ograve','\xD2':'Ograve','\xF4':'ocirc','\xD4':'Ocirc','\xF6':'ouml','\xD6':'Ouml','\u0151':'odblac','\u0150':'Odblac','\xF5':'otilde','\xD5':'Otilde','\xF8':'oslash','\xD8':'Oslash','\u014D':'omacr','\u014C':'Omacr','\u0153':'oelig','\u0152':'OElig','\uD835\uDD2D':'pfr','\uD835\uDCC5':'pscr','\uD835\uDD61':'popf','\u2119':'Popf','\uD835\uDD13':'Pfr','\uD835\uDCAB':'Pscr','\uD835\uDD62':'qopf','\uD835\uDD2E':'qfr','\uD835\uDCC6':'qscr','\uD835\uDCAC':'Qscr','\uD835\uDD14':'Qfr','\u211A':'Qopf','\u0138':'kgreen','\uD835\uDD2F':'rfr','\uD835\uDD63':'ropf','\uD835\uDCC7':'rscr','\u211B':'Rscr','\u211C':'Re','\u211D':'Ropf','\u0155':'racute','\u0154':'Racute','\u0159':'rcaron','\u0158':'Rcaron','\u0157':'rcedil','\u0156':'Rcedil','\uD835\uDD64':'sopf','\uD835\uDCC8':'sscr','\uD835\uDD30':'sfr','\uD835\uDD4A':'Sopf','\uD835\uDD16':'Sfr','\uD835\uDCAE':'Sscr','\u24C8':'oS','\u015B':'sacute','\u015A':'Sacute','\u015D':'scirc','\u015C':'Scirc','\u0161':'scaron','\u0160':'Scaron','\u015F':'scedil','\u015E':'Scedil','\xDF':'szlig','\uD835\uDD31':'tfr','\uD835\uDCC9':'tscr','\uD835\uDD65':'topf','\uD835\uDCAF':'Tscr','\uD835\uDD17':'Tfr','\uD835\uDD4B':'Topf','\u0165':'tcaron','\u0164':'Tcaron','\u0163':'tcedil','\u0162':'Tcedil','\u2122':'trade','\u0167':'tstrok','\u0166':'Tstrok','\uD835\uDCCA':'uscr','\uD835\uDD66':'uopf','\uD835\uDD32':'ufr','\uD835\uDD4C':'Uopf','\uD835\uDD18':'Ufr','\uD835\uDCB0':'Uscr','\xFA':'uacute','\xDA':'Uacute','\xF9':'ugrave','\xD9':'Ugrave','\u016D':'ubreve','\u016C':'Ubreve','\xFB':'ucirc','\xDB':'Ucirc','\u016F':'uring','\u016E':'Uring','\xFC':'uuml','\xDC':'Uuml','\u0171':'udblac','\u0170':'Udblac','\u0169':'utilde','\u0168':'Utilde','\u0173':'uogon','\u0172':'Uogon','\u016B':'umacr','\u016A':'Umacr','\uD835\uDD33':'vfr','\uD835\uDD67':'vopf','\uD835\uDCCB':'vscr','\uD835\uDD19':'Vfr','\uD835\uDD4D':'Vopf','\uD835\uDCB1':'Vscr','\uD835\uDD68':'wopf','\uD835\uDCCC':'wscr','\uD835\uDD34':'wfr','\uD835\uDCB2':'Wscr','\uD835\uDD4E':'Wopf','\uD835\uDD1A':'Wfr','\u0175':'wcirc','\u0174':'Wcirc','\uD835\uDD35':'xfr','\uD835\uDCCD':'xscr','\uD835\uDD69':'xopf','\uD835\uDD4F':'Xopf','\uD835\uDD1B':'Xfr','\uD835\uDCB3':'Xscr','\uD835\uDD36':'yfr','\uD835\uDCCE':'yscr','\uD835\uDD6A':'yopf','\uD835\uDCB4':'Yscr','\uD835\uDD1C':'Yfr','\uD835\uDD50':'Yopf','\xFD':'yacute','\xDD':'Yacute','\u0177':'ycirc','\u0176':'Ycirc','\xFF':'yuml','\u0178':'Yuml','\uD835\uDCCF':'zscr','\uD835\uDD37':'zfr','\uD835\uDD6B':'zopf','\u2128':'Zfr','\u2124':'Zopf','\uD835\uDCB5':'Zscr','\u017A':'zacute','\u0179':'Zacute','\u017E':'zcaron','\u017D':'Zcaron','\u017C':'zdot','\u017B':'Zdot','\u01B5':'imped','\xFE':'thorn','\xDE':'THORN','\u0149':'napos','\u03B1':'alpha','\u0391':'Alpha','\u03B2':'beta','\u0392':'Beta','\u03B3':'gamma','\u0393':'Gamma','\u03B4':'delta','\u0394':'Delta','\u03B5':'epsi','\u03F5':'epsiv','\u0395':'Epsilon','\u03DD':'gammad','\u03DC':'Gammad','\u03B6':'zeta','\u0396':'Zeta','\u03B7':'eta','\u0397':'Eta','\u03B8':'theta','\u03D1':'thetav','\u0398':'Theta','\u03B9':'iota','\u0399':'Iota','\u03BA':'kappa','\u03F0':'kappav','\u039A':'Kappa','\u03BB':'lambda','\u039B':'Lambda','\u03BC':'mu','\xB5':'micro','\u039C':'Mu','\u03BD':'nu','\u039D':'Nu','\u03BE':'xi','\u039E':'Xi','\u03BF':'omicron','\u039F':'Omicron','\u03C0':'pi','\u03D6':'piv','\u03A0':'Pi','\u03C1':'rho','\u03F1':'rhov','\u03A1':'Rho','\u03C3':'sigma','\u03A3':'Sigma','\u03C2':'sigmaf','\u03C4':'tau','\u03A4':'Tau','\u03C5':'upsi','\u03A5':'Upsilon','\u03D2':'Upsi','\u03C6':'phi','\u03D5':'phiv','\u03A6':'Phi','\u03C7':'chi','\u03A7':'Chi','\u03C8':'psi','\u03A8':'Psi','\u03C9':'omega','\u03A9':'ohm','\u0430':'acy','\u0410':'Acy','\u0431':'bcy','\u0411':'Bcy','\u0432':'vcy','\u0412':'Vcy','\u0433':'gcy','\u0413':'Gcy','\u0453':'gjcy','\u0403':'GJcy','\u0434':'dcy','\u0414':'Dcy','\u0452':'djcy','\u0402':'DJcy','\u0435':'iecy','\u0415':'IEcy','\u0451':'iocy','\u0401':'IOcy','\u0454':'jukcy','\u0404':'Jukcy','\u0436':'zhcy','\u0416':'ZHcy','\u0437':'zcy','\u0417':'Zcy','\u0455':'dscy','\u0405':'DScy','\u0438':'icy','\u0418':'Icy','\u0456':'iukcy','\u0406':'Iukcy','\u0457':'yicy','\u0407':'YIcy','\u0439':'jcy','\u0419':'Jcy','\u0458':'jsercy','\u0408':'Jsercy','\u043A':'kcy','\u041A':'Kcy','\u045C':'kjcy','\u040C':'KJcy','\u043B':'lcy','\u041B':'Lcy','\u0459':'ljcy','\u0409':'LJcy','\u043C':'mcy','\u041C':'Mcy','\u043D':'ncy','\u041D':'Ncy','\u045A':'njcy','\u040A':'NJcy','\u043E':'ocy','\u041E':'Ocy','\u043F':'pcy','\u041F':'Pcy','\u0440':'rcy','\u0420':'Rcy','\u0441':'scy','\u0421':'Scy','\u0442':'tcy','\u0422':'Tcy','\u045B':'tshcy','\u040B':'TSHcy','\u0443':'ucy','\u0423':'Ucy','\u045E':'ubrcy','\u040E':'Ubrcy','\u0444':'fcy','\u0424':'Fcy','\u0445':'khcy','\u0425':'KHcy','\u0446':'tscy','\u0426':'TScy','\u0447':'chcy','\u0427':'CHcy','\u045F':'dzcy','\u040F':'DZcy','\u0448':'shcy','\u0428':'SHcy','\u0449':'shchcy','\u0429':'SHCHcy','\u044A':'hardcy','\u042A':'HARDcy','\u044B':'ycy','\u042B':'Ycy','\u044C':'softcy','\u042C':'SOFTcy','\u044D':'ecy','\u042D':'Ecy','\u044E':'yucy','\u042E':'YUcy','\u044F':'yacy','\u042F':'YAcy','\u2135':'aleph','\u2136':'beth','\u2137':'gimel','\u2138':'daleth'};

	var regexEscape = /["&'<>`]/g;
	var escapeMap = {
		'"': '&quot;',
		'&': '&amp;',
		'\'': '&#x27;',
		'<': '&lt;',
		// See https://mathiasbynens.be/notes/ambiguous-ampersands: in HTML, the
		// following is not strictly necessary unless it’s part of a tag or an
		// unquoted attribute value. We’re only escaping it to support those
		// situations, and for XML support.
		'>': '&gt;',
		// In Internet Explorer ≤ 8, the backtick character can be used
		// to break out of (un)quoted attribute values or HTML comments.
		// See http://html5sec.org/#102, http://html5sec.org/#108, and
		// http://html5sec.org/#133.
		'`': '&#x60;'
	};

	var regexInvalidEntity = /&#(?:[xX][^a-fA-F0-9]|[^0-9xX])/;
	var regexInvalidRawCodePoint = /[\0-\x08\x0B\x0E-\x1F\x7F-\x9F\uFDD0-\uFDEF\uFFFE\uFFFF]|[\uD83F\uD87F\uD8BF\uD8FF\uD93F\uD97F\uD9BF\uD9FF\uDA3F\uDA7F\uDABF\uDAFF\uDB3F\uDB7F\uDBBF\uDBFF][\uDFFE\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
	var regexDecode = /&(CounterClockwiseContourIntegral|DoubleLongLeftRightArrow|ClockwiseContourIntegral|NotNestedGreaterGreater|NotSquareSupersetEqual|DiacriticalDoubleAcute|NotRightTriangleEqual|NotSucceedsSlantEqual|NotPrecedesSlantEqual|CloseCurlyDoubleQuote|NegativeVeryThinSpace|DoubleContourIntegral|FilledVerySmallSquare|CapitalDifferentialD|OpenCurlyDoubleQuote|EmptyVerySmallSquare|NestedGreaterGreater|DoubleLongRightArrow|NotLeftTriangleEqual|NotGreaterSlantEqual|ReverseUpEquilibrium|DoubleLeftRightArrow|NotSquareSubsetEqual|NotDoubleVerticalBar|RightArrowLeftArrow|NotGreaterFullEqual|NotRightTriangleBar|SquareSupersetEqual|DownLeftRightVector|DoubleLongLeftArrow|leftrightsquigarrow|LeftArrowRightArrow|NegativeMediumSpace|blacktriangleright|RightDownVectorBar|PrecedesSlantEqual|RightDoubleBracket|SucceedsSlantEqual|NotLeftTriangleBar|RightTriangleEqual|SquareIntersection|RightDownTeeVector|ReverseEquilibrium|NegativeThickSpace|longleftrightarrow|Longleftrightarrow|LongLeftRightArrow|DownRightTeeVector|DownRightVectorBar|GreaterSlantEqual|SquareSubsetEqual|LeftDownVectorBar|LeftDoubleBracket|VerticalSeparator|rightleftharpoons|NotGreaterGreater|NotSquareSuperset|blacktriangleleft|blacktriangledown|NegativeThinSpace|LeftDownTeeVector|NotLessSlantEqual|leftrightharpoons|DoubleUpDownArrow|DoubleVerticalBar|LeftTriangleEqual|FilledSmallSquare|twoheadrightarrow|NotNestedLessLess|DownLeftTeeVector|DownLeftVectorBar|RightAngleBracket|NotTildeFullEqual|NotReverseElement|RightUpDownVector|DiacriticalTilde|NotSucceedsTilde|circlearrowright|NotPrecedesEqual|rightharpoondown|DoubleRightArrow|NotSucceedsEqual|NonBreakingSpace|NotRightTriangle|LessEqualGreater|RightUpTeeVector|LeftAngleBracket|GreaterFullEqual|DownArrowUpArrow|RightUpVectorBar|twoheadleftarrow|GreaterEqualLess|downharpoonright|RightTriangleBar|ntrianglerighteq|NotSupersetEqual|LeftUpDownVector|DiacriticalAcute|rightrightarrows|vartriangleright|UpArrowDownArrow|DiacriticalGrave|UnderParenthesis|EmptySmallSquare|LeftUpVectorBar|leftrightarrows|DownRightVector|downharpoonleft|trianglerighteq|ShortRightArrow|OverParenthesis|DoubleLeftArrow|DoubleDownArrow|NotSquareSubset|bigtriangledown|ntrianglelefteq|UpperRightArrow|curvearrowright|vartriangleleft|NotLeftTriangle|nleftrightarrow|LowerRightArrow|NotHumpDownHump|NotGreaterTilde|rightthreetimes|LeftUpTeeVector|NotGreaterEqual|straightepsilon|LeftTriangleBar|rightsquigarrow|ContourIntegral|rightleftarrows|CloseCurlyQuote|RightDownVector|LeftRightVector|nLeftrightarrow|leftharpoondown|circlearrowleft|SquareSuperset|OpenCurlyQuote|hookrightarrow|HorizontalLine|DiacriticalDot|NotLessGreater|ntriangleright|DoubleRightTee|InvisibleComma|InvisibleTimes|LowerLeftArrow|DownLeftVector|NotSubsetEqual|curvearrowleft|trianglelefteq|NotVerticalBar|TildeFullEqual|downdownarrows|NotGreaterLess|RightTeeVector|ZeroWidthSpace|looparrowright|LongRightArrow|doublebarwedge|ShortLeftArrow|ShortDownArrow|RightVectorBar|GreaterGreater|ReverseElement|rightharpoonup|LessSlantEqual|leftthreetimes|upharpoonright|rightarrowtail|LeftDownVector|Longrightarrow|NestedLessLess|UpperLeftArrow|nshortparallel|leftleftarrows|leftrightarrow|Leftrightarrow|LeftRightArrow|longrightarrow|upharpoonleft|RightArrowBar|ApplyFunction|LeftTeeVector|leftarrowtail|NotEqualTilde|varsubsetneqq|varsupsetneqq|RightTeeArrow|SucceedsEqual|SucceedsTilde|LeftVectorBar|SupersetEqual|hookleftarrow|DifferentialD|VerticalTilde|VeryThinSpace|blacktriangle|bigtriangleup|LessFullEqual|divideontimes|leftharpoonup|UpEquilibrium|ntriangleleft|RightTriangle|measuredangle|shortparallel|longleftarrow|Longleftarrow|LongLeftArrow|DoubleLeftTee|Poincareplane|PrecedesEqual|triangleright|DoubleUpArrow|RightUpVector|fallingdotseq|looparrowleft|PrecedesTilde|NotTildeEqual|NotTildeTilde|smallsetminus|Proportional|triangleleft|triangledown|UnderBracket|NotHumpEqual|exponentiale|ExponentialE|NotLessTilde|HilbertSpace|RightCeiling|blacklozenge|varsupsetneq|HumpDownHump|GreaterEqual|VerticalLine|LeftTeeArrow|NotLessEqual|DownTeeArrow|LeftTriangle|varsubsetneq|Intersection|NotCongruent|DownArrowBar|LeftUpVector|LeftArrowBar|risingdotseq|GreaterTilde|RoundImplies|SquareSubset|ShortUpArrow|NotSuperset|quaternions|precnapprox|backepsilon|preccurlyeq|OverBracket|blacksquare|MediumSpace|VerticalBar|circledcirc|circleddash|CircleMinus|CircleTimes|LessGreater|curlyeqprec|curlyeqsucc|diamondsuit|UpDownArrow|Updownarrow|RuleDelayed|Rrightarrow|updownarrow|RightVector|nRightarrow|nrightarrow|eqslantless|LeftCeiling|Equilibrium|SmallCircle|expectation|NotSucceeds|thickapprox|GreaterLess|SquareUnion|NotPrecedes|NotLessLess|straightphi|succnapprox|succcurlyeq|SubsetEqual|sqsupseteq|Proportion|Laplacetrf|ImaginaryI|supsetneqq|NotGreater|gtreqqless|NotElement|ThickSpace|TildeEqual|TildeTilde|Fouriertrf|rmoustache|EqualTilde|eqslantgtr|UnderBrace|LeftVector|UpArrowBar|nLeftarrow|nsubseteqq|subsetneqq|nsupseteqq|nleftarrow|succapprox|lessapprox|UpTeeArrow|upuparrows|curlywedge|lesseqqgtr|varepsilon|varnothing|RightFloor|complement|CirclePlus|sqsubseteq|Lleftarrow|circledast|RightArrow|Rightarrow|rightarrow|lmoustache|Bernoullis|precapprox|mapstoleft|mapstodown|longmapsto|dotsquare|downarrow|DoubleDot|nsubseteq|supsetneq|leftarrow|nsupseteq|subsetneq|ThinSpace|ngeqslant|subseteqq|HumpEqual|NotSubset|triangleq|NotCupCap|lesseqgtr|heartsuit|TripleDot|Leftarrow|Coproduct|Congruent|varpropto|complexes|gvertneqq|LeftArrow|LessTilde|supseteqq|MinusPlus|CircleDot|nleqslant|NotExists|gtreqless|nparallel|UnionPlus|LeftFloor|checkmark|CenterDot|centerdot|Mellintrf|gtrapprox|bigotimes|OverBrace|spadesuit|therefore|pitchfork|rationals|PlusMinus|Backslash|Therefore|DownBreve|backsimeq|backprime|DownArrow|nshortmid|Downarrow|lvertneqq|eqvparsl|imagline|imagpart|infintie|integers|Integral|intercal|LessLess|Uarrocir|intlarhk|sqsupset|angmsdaf|sqsubset|llcorner|vartheta|cupbrcap|lnapprox|Superset|SuchThat|succnsim|succneqq|angmsdag|biguplus|curlyvee|trpezium|Succeeds|NotTilde|bigwedge|angmsdah|angrtvbd|triminus|cwconint|fpartint|lrcorner|smeparsl|subseteq|urcorner|lurdshar|laemptyv|DDotrahd|approxeq|ldrushar|awconint|mapstoup|backcong|shortmid|triangle|geqslant|gesdotol|timesbar|circledR|circledS|setminus|multimap|naturals|scpolint|ncongdot|RightTee|boxminus|gnapprox|boxtimes|andslope|thicksim|angmsdaa|varsigma|cirfnint|rtriltri|angmsdab|rppolint|angmsdac|barwedge|drbkarow|clubsuit|thetasym|bsolhsub|capbrcup|dzigrarr|doteqdot|DotEqual|dotminus|UnderBar|NotEqual|realpart|otimesas|ulcorner|hksearow|hkswarow|parallel|PartialD|elinters|emptyset|plusacir|bbrktbrk|angmsdad|pointint|bigoplus|angmsdae|Precedes|bigsqcup|varkappa|notindot|supseteq|precneqq|precnsim|profalar|profline|profsurf|leqslant|lesdotor|raemptyv|subplus|notnivb|notnivc|subrarr|zigrarr|vzigzag|submult|subedot|Element|between|cirscir|larrbfs|larrsim|lotimes|lbrksld|lbrkslu|lozenge|ldrdhar|dbkarow|bigcirc|epsilon|simrarr|simplus|ltquest|Epsilon|luruhar|gtquest|maltese|npolint|eqcolon|npreceq|bigodot|ddagger|gtrless|bnequiv|harrcir|ddotseq|equivDD|backsim|demptyv|nsqsube|nsqsupe|Upsilon|nsubset|upsilon|minusdu|nsucceq|swarrow|nsupset|coloneq|searrow|boxplus|napprox|natural|asympeq|alefsym|congdot|nearrow|bigstar|diamond|supplus|tritime|LeftTee|nvinfin|triplus|NewLine|nvltrie|nvrtrie|nwarrow|nexists|Diamond|ruluhar|Implies|supmult|angzarr|suplarr|suphsub|questeq|because|digamma|Because|olcross|bemptyv|omicron|Omicron|rotimes|NoBreak|intprod|angrtvb|orderof|uwangle|suphsol|lesdoto|orslope|DownTee|realine|cudarrl|rdldhar|OverBar|supedot|lessdot|supdsub|topfork|succsim|rbrkslu|rbrksld|pertenk|cudarrr|isindot|planckh|lessgtr|pluscir|gesdoto|plussim|plustwo|lesssim|cularrp|rarrsim|Cayleys|notinva|notinvb|notinvc|UpArrow|Uparrow|uparrow|NotLess|dwangle|precsim|Product|curarrm|Cconint|dotplus|rarrbfs|ccupssm|Cedilla|cemptyv|notniva|quatint|frac35|frac38|frac45|frac56|frac58|frac78|tridot|xoplus|gacute|gammad|Gammad|lfisht|lfloor|bigcup|sqsupe|gbreve|Gbreve|lharul|sqsube|sqcups|Gcedil|apacir|llhard|lmidot|Lmidot|lmoust|andand|sqcaps|approx|Abreve|spades|circeq|tprime|divide|topcir|Assign|topbot|gesdot|divonx|xuplus|timesd|gesles|atilde|solbar|SOFTcy|loplus|timesb|lowast|lowbar|dlcorn|dlcrop|softcy|dollar|lparlt|thksim|lrhard|Atilde|lsaquo|smashp|bigvee|thinsp|wreath|bkarow|lsquor|lstrok|Lstrok|lthree|ltimes|ltlarr|DotDot|simdot|ltrPar|weierp|xsqcup|angmsd|sigmav|sigmaf|zeetrf|Zcaron|zcaron|mapsto|vsupne|thetav|cirmid|marker|mcomma|Zacute|vsubnE|there4|gtlPar|vsubne|bottom|gtrarr|SHCHcy|shchcy|midast|midcir|middot|minusb|minusd|gtrdot|bowtie|sfrown|mnplus|models|colone|seswar|Colone|mstpos|searhk|gtrsim|nacute|Nacute|boxbox|telrec|hairsp|Tcedil|nbumpe|scnsim|ncaron|Ncaron|ncedil|Ncedil|hamilt|Scedil|nearhk|hardcy|HARDcy|tcedil|Tcaron|commat|nequiv|nesear|tcaron|target|hearts|nexist|varrho|scedil|Scaron|scaron|hellip|Sacute|sacute|hercon|swnwar|compfn|rtimes|rthree|rsquor|rsaquo|zacute|wedgeq|homtht|barvee|barwed|Barwed|rpargt|horbar|conint|swarhk|roplus|nltrie|hslash|hstrok|Hstrok|rmoust|Conint|bprime|hybull|hyphen|iacute|Iacute|supsup|supsub|supsim|varphi|coprod|brvbar|agrave|Supset|supset|igrave|Igrave|notinE|Agrave|iiiint|iinfin|copysr|wedbar|Verbar|vangrt|becaus|incare|verbar|inodot|bullet|drcorn|intcal|drcrop|cularr|vellip|Utilde|bumpeq|cupcap|dstrok|Dstrok|CupCap|cupcup|cupdot|eacute|Eacute|supdot|iquest|easter|ecaron|Ecaron|ecolon|isinsv|utilde|itilde|Itilde|curarr|succeq|Bumpeq|cacute|ulcrop|nparsl|Cacute|nprcue|egrave|Egrave|nrarrc|nrarrw|subsup|subsub|nrtrie|jsercy|nsccue|Jsercy|kappav|kcedil|Kcedil|subsim|ulcorn|nsimeq|egsdot|veebar|kgreen|capand|elsdot|Subset|subset|curren|aacute|lacute|Lacute|emptyv|ntilde|Ntilde|lagran|lambda|Lambda|capcap|Ugrave|langle|subdot|emsp13|numero|emsp14|nvdash|nvDash|nVdash|nVDash|ugrave|ufisht|nvHarr|larrfs|nvlArr|larrhk|larrlp|larrpl|nvrArr|Udblac|nwarhk|larrtl|nwnear|oacute|Oacute|latail|lAtail|sstarf|lbrace|odblac|Odblac|lbrack|udblac|odsold|eparsl|lcaron|Lcaron|ograve|Ograve|lcedil|Lcedil|Aacute|ssmile|ssetmn|squarf|ldquor|capcup|ominus|cylcty|rharul|eqcirc|dagger|rfloor|rfisht|Dagger|daleth|equals|origof|capdot|equest|dcaron|Dcaron|rdquor|oslash|Oslash|otilde|Otilde|otimes|Otimes|urcrop|Ubreve|ubreve|Yacute|Uacute|uacute|Rcedil|rcedil|urcorn|parsim|Rcaron|Vdashl|rcaron|Tstrok|percnt|period|permil|Exists|yacute|rbrack|rbrace|phmmat|ccaron|Ccaron|planck|ccedil|plankv|tstrok|female|plusdo|plusdu|ffilig|plusmn|ffllig|Ccedil|rAtail|dfisht|bernou|ratail|Rarrtl|rarrtl|angsph|rarrpl|rarrlp|rarrhk|xwedge|xotime|forall|ForAll|Vvdash|vsupnE|preceq|bigcap|frac12|frac13|frac14|primes|rarrfs|prnsim|frac15|Square|frac16|square|lesdot|frac18|frac23|propto|prurel|rarrap|rangle|puncsp|frac25|Racute|qprime|racute|lesges|frac34|abreve|AElig|eqsim|utdot|setmn|urtri|Equal|Uring|seArr|uring|searr|dashv|Dashv|mumap|nabla|iogon|Iogon|sdote|sdotb|scsim|napid|napos|equiv|natur|Acirc|dblac|erarr|nbump|iprod|erDot|ucirc|awint|esdot|angrt|ncong|isinE|scnap|Scirc|scirc|ndash|isins|Ubrcy|nearr|neArr|isinv|nedot|ubrcy|acute|Ycirc|iukcy|Iukcy|xutri|nesim|caret|jcirc|Jcirc|caron|twixt|ddarr|sccue|exist|jmath|sbquo|ngeqq|angst|ccaps|lceil|ngsim|UpTee|delta|Delta|rtrif|nharr|nhArr|nhpar|rtrie|jukcy|Jukcy|kappa|rsquo|Kappa|nlarr|nlArr|TSHcy|rrarr|aogon|Aogon|fflig|xrarr|tshcy|ccirc|nleqq|filig|upsih|nless|dharl|nlsim|fjlig|ropar|nltri|dharr|robrk|roarr|fllig|fltns|roang|rnmid|subnE|subne|lAarr|trisb|Ccirc|acirc|ccups|blank|VDash|forkv|Vdash|langd|cedil|blk12|blk14|laquo|strns|diams|notin|vDash|larrb|blk34|block|disin|uplus|vdash|vBarv|aelig|starf|Wedge|check|xrArr|lates|lbarr|lBarr|notni|lbbrk|bcong|frasl|lbrke|frown|vrtri|vprop|vnsup|gamma|Gamma|wedge|xodot|bdquo|srarr|doteq|ldquo|boxdl|boxdL|gcirc|Gcirc|boxDl|boxDL|boxdr|boxdR|boxDr|TRADE|trade|rlhar|boxDR|vnsub|npart|vltri|rlarr|boxhd|boxhD|nprec|gescc|nrarr|nrArr|boxHd|boxHD|boxhu|boxhU|nrtri|boxHu|clubs|boxHU|times|colon|Colon|gimel|xlArr|Tilde|nsime|tilde|nsmid|nspar|THORN|thorn|xlarr|nsube|nsubE|thkap|xhArr|comma|nsucc|boxul|boxuL|nsupe|nsupE|gneqq|gnsim|boxUl|boxUL|grave|boxur|boxuR|boxUr|boxUR|lescc|angle|bepsi|boxvh|varpi|boxvH|numsp|Theta|gsime|gsiml|theta|boxVh|boxVH|boxvl|gtcir|gtdot|boxvL|boxVl|boxVL|crarr|cross|Cross|nvsim|boxvr|nwarr|nwArr|sqsup|dtdot|Uogon|lhard|lharu|dtrif|ocirc|Ocirc|lhblk|duarr|odash|sqsub|Hacek|sqcup|llarr|duhar|oelig|OElig|ofcir|boxvR|uogon|lltri|boxVr|csube|uuarr|ohbar|csupe|ctdot|olarr|olcir|harrw|oline|sqcap|omacr|Omacr|omega|Omega|boxVR|aleph|lneqq|lnsim|loang|loarr|rharu|lobrk|hcirc|operp|oplus|rhard|Hcirc|orarr|Union|order|ecirc|Ecirc|cuepr|szlig|cuesc|breve|reals|eDDot|Breve|hoarr|lopar|utrif|rdquo|Umacr|umacr|efDot|swArr|ultri|alpha|rceil|ovbar|swarr|Wcirc|wcirc|smtes|smile|bsemi|lrarr|aring|parsl|lrhar|bsime|uhblk|lrtri|cupor|Aring|uharr|uharl|slarr|rbrke|bsolb|lsime|rbbrk|RBarr|lsimg|phone|rBarr|rbarr|icirc|lsquo|Icirc|emacr|Emacr|ratio|simne|plusb|simlE|simgE|simeq|pluse|ltcir|ltdot|empty|xharr|xdtri|iexcl|Alpha|ltrie|rarrw|pound|ltrif|xcirc|bumpe|prcue|bumpE|asymp|amacr|cuvee|Sigma|sigma|iiint|udhar|iiota|ijlig|IJlig|supnE|imacr|Imacr|prime|Prime|image|prnap|eogon|Eogon|rarrc|mdash|mDDot|cuwed|imath|supne|imped|Amacr|udarr|prsim|micro|rarrb|cwint|raquo|infin|eplus|range|rangd|Ucirc|radic|minus|amalg|veeeq|rAarr|epsiv|ycirc|quest|sharp|quot|zwnj|Qscr|race|qscr|Qopf|qopf|qint|rang|Rang|Zscr|zscr|Zopf|zopf|rarr|rArr|Rarr|Pscr|pscr|prop|prod|prnE|prec|ZHcy|zhcy|prap|Zeta|zeta|Popf|popf|Zdot|plus|zdot|Yuml|yuml|phiv|YUcy|yucy|Yscr|yscr|perp|Yopf|yopf|part|para|YIcy|Ouml|rcub|yicy|YAcy|rdca|ouml|osol|Oscr|rdsh|yacy|real|oscr|xvee|andd|rect|andv|Xscr|oror|ordm|ordf|xscr|ange|aopf|Aopf|rHar|Xopf|opar|Oopf|xopf|xnis|rhov|oopf|omid|xmap|oint|apid|apos|ogon|ascr|Ascr|odot|odiv|xcup|xcap|ocir|oast|nvlt|nvle|nvgt|nvge|nvap|Wscr|wscr|auml|ntlg|ntgl|nsup|nsub|nsim|Nscr|nscr|nsce|Wopf|ring|npre|wopf|npar|Auml|Barv|bbrk|Nopf|nopf|nmid|nLtv|beta|ropf|Ropf|Beta|beth|nles|rpar|nleq|bnot|bNot|nldr|NJcy|rscr|Rscr|Vscr|vscr|rsqb|njcy|bopf|nisd|Bopf|rtri|Vopf|nGtv|ngtr|vopf|boxh|boxH|boxv|nges|ngeq|boxV|bscr|scap|Bscr|bsim|Vert|vert|bsol|bull|bump|caps|cdot|ncup|scnE|ncap|nbsp|napE|Cdot|cent|sdot|Vbar|nang|vBar|chcy|Mscr|mscr|sect|semi|CHcy|Mopf|mopf|sext|circ|cire|mldr|mlcp|cirE|comp|shcy|SHcy|vArr|varr|cong|copf|Copf|copy|COPY|malt|male|macr|lvnE|cscr|ltri|sime|ltcc|simg|Cscr|siml|csub|Uuml|lsqb|lsim|uuml|csup|Lscr|lscr|utri|smid|lpar|cups|smte|lozf|darr|Lopf|Uscr|solb|lopf|sopf|Sopf|lneq|uscr|spar|dArr|lnap|Darr|dash|Sqrt|LJcy|ljcy|lHar|dHar|Upsi|upsi|diam|lesg|djcy|DJcy|leqq|dopf|Dopf|dscr|Dscr|dscy|ldsh|ldca|squf|DScy|sscr|Sscr|dsol|lcub|late|star|Star|Uopf|Larr|lArr|larr|uopf|dtri|dzcy|sube|subE|Lang|lang|Kscr|kscr|Kopf|kopf|KJcy|kjcy|KHcy|khcy|DZcy|ecir|edot|eDot|Jscr|jscr|succ|Jopf|jopf|Edot|uHar|emsp|ensp|Iuml|iuml|eopf|isin|Iscr|iscr|Eopf|epar|sung|epsi|escr|sup1|sup2|sup3|Iota|iota|supe|supE|Iopf|iopf|IOcy|iocy|Escr|esim|Esim|imof|Uarr|QUOT|uArr|uarr|euml|IEcy|iecy|Idot|Euml|euro|excl|Hscr|hscr|Hopf|hopf|TScy|tscy|Tscr|hbar|tscr|flat|tbrk|fnof|hArr|harr|half|fopf|Fopf|tdot|gvnE|fork|trie|gtcc|fscr|Fscr|gdot|gsim|Gscr|gscr|Gopf|gopf|gneq|Gdot|tosa|gnap|Topf|topf|geqq|toea|GJcy|gjcy|tint|gesl|mid|Sfr|ggg|top|ges|gla|glE|glj|geq|gne|gEl|gel|gnE|Gcy|gcy|gap|Tfr|tfr|Tcy|tcy|Hat|Tau|Ffr|tau|Tab|hfr|Hfr|ffr|Fcy|fcy|icy|Icy|iff|ETH|eth|ifr|Ifr|Eta|eta|int|Int|Sup|sup|ucy|Ucy|Sum|sum|jcy|ENG|ufr|Ufr|eng|Jcy|jfr|els|ell|egs|Efr|efr|Jfr|uml|kcy|Kcy|Ecy|ecy|kfr|Kfr|lap|Sub|sub|lat|lcy|Lcy|leg|Dot|dot|lEg|leq|les|squ|div|die|lfr|Lfr|lgE|Dfr|dfr|Del|deg|Dcy|dcy|lne|lnE|sol|loz|smt|Cup|lrm|cup|lsh|Lsh|sim|shy|map|Map|mcy|Mcy|mfr|Mfr|mho|gfr|Gfr|sfr|cir|Chi|chi|nap|Cfr|vcy|Vcy|cfr|Scy|scy|ncy|Ncy|vee|Vee|Cap|cap|nfr|scE|sce|Nfr|nge|ngE|nGg|vfr|Vfr|ngt|bot|nGt|nis|niv|Rsh|rsh|nle|nlE|bne|Bfr|bfr|nLl|nlt|nLt|Bcy|bcy|not|Not|rlm|wfr|Wfr|npr|nsc|num|ocy|ast|Ocy|ofr|xfr|Xfr|Ofr|ogt|ohm|apE|olt|Rho|ape|rho|Rfr|rfr|ord|REG|ang|reg|orv|And|and|AMP|Rcy|amp|Afr|ycy|Ycy|yen|yfr|Yfr|rcy|par|pcy|Pcy|pfr|Pfr|phi|Phi|afr|Acy|acy|zcy|Zcy|piv|acE|acd|zfr|Zfr|pre|prE|psi|Psi|qfr|Qfr|zwj|Or|ge|Gg|gt|gg|el|oS|lt|Lt|LT|Re|lg|gl|eg|ne|Im|it|le|DD|wp|wr|nu|Nu|dd|lE|Sc|sc|pi|Pi|ee|af|ll|Ll|rx|gE|xi|pm|Xi|ic|pr|Pr|in|ni|mp|mu|ac|Mu|or|ap|Gt|GT|ii);|&(Aacute|Agrave|Atilde|Ccedil|Eacute|Egrave|Iacute|Igrave|Ntilde|Oacute|Ograve|Oslash|Otilde|Uacute|Ugrave|Yacute|aacute|agrave|atilde|brvbar|ccedil|curren|divide|eacute|egrave|frac12|frac14|frac34|iacute|igrave|iquest|middot|ntilde|oacute|ograve|oslash|otilde|plusmn|uacute|ugrave|yacute|AElig|Acirc|Aring|Ecirc|Icirc|Ocirc|THORN|Ucirc|acirc|acute|aelig|aring|cedil|ecirc|icirc|iexcl|laquo|micro|ocirc|pound|raquo|szlig|thorn|times|ucirc|Auml|COPY|Euml|Iuml|Ouml|QUOT|Uuml|auml|cent|copy|euml|iuml|macr|nbsp|ordf|ordm|ouml|para|quot|sect|sup1|sup2|sup3|uuml|yuml|AMP|ETH|REG|amp|deg|eth|not|reg|shy|uml|yen|GT|LT|gt|lt)(?!;)([=a-zA-Z0-9]?)|&#([0-9]+)(;?)|&#[xX]([a-fA-F0-9]+)(;?)|&([0-9a-zA-Z]+)/g;
	var decodeMap = {'aacute':'\xE1','Aacute':'\xC1','abreve':'\u0103','Abreve':'\u0102','ac':'\u223E','acd':'\u223F','acE':'\u223E\u0333','acirc':'\xE2','Acirc':'\xC2','acute':'\xB4','acy':'\u0430','Acy':'\u0410','aelig':'\xE6','AElig':'\xC6','af':'\u2061','afr':'\uD835\uDD1E','Afr':'\uD835\uDD04','agrave':'\xE0','Agrave':'\xC0','alefsym':'\u2135','aleph':'\u2135','alpha':'\u03B1','Alpha':'\u0391','amacr':'\u0101','Amacr':'\u0100','amalg':'\u2A3F','amp':'&','AMP':'&','and':'\u2227','And':'\u2A53','andand':'\u2A55','andd':'\u2A5C','andslope':'\u2A58','andv':'\u2A5A','ang':'\u2220','ange':'\u29A4','angle':'\u2220','angmsd':'\u2221','angmsdaa':'\u29A8','angmsdab':'\u29A9','angmsdac':'\u29AA','angmsdad':'\u29AB','angmsdae':'\u29AC','angmsdaf':'\u29AD','angmsdag':'\u29AE','angmsdah':'\u29AF','angrt':'\u221F','angrtvb':'\u22BE','angrtvbd':'\u299D','angsph':'\u2222','angst':'\xC5','angzarr':'\u237C','aogon':'\u0105','Aogon':'\u0104','aopf':'\uD835\uDD52','Aopf':'\uD835\uDD38','ap':'\u2248','apacir':'\u2A6F','ape':'\u224A','apE':'\u2A70','apid':'\u224B','apos':'\'','ApplyFunction':'\u2061','approx':'\u2248','approxeq':'\u224A','aring':'\xE5','Aring':'\xC5','ascr':'\uD835\uDCB6','Ascr':'\uD835\uDC9C','Assign':'\u2254','ast':'*','asymp':'\u2248','asympeq':'\u224D','atilde':'\xE3','Atilde':'\xC3','auml':'\xE4','Auml':'\xC4','awconint':'\u2233','awint':'\u2A11','backcong':'\u224C','backepsilon':'\u03F6','backprime':'\u2035','backsim':'\u223D','backsimeq':'\u22CD','Backslash':'\u2216','Barv':'\u2AE7','barvee':'\u22BD','barwed':'\u2305','Barwed':'\u2306','barwedge':'\u2305','bbrk':'\u23B5','bbrktbrk':'\u23B6','bcong':'\u224C','bcy':'\u0431','Bcy':'\u0411','bdquo':'\u201E','becaus':'\u2235','because':'\u2235','Because':'\u2235','bemptyv':'\u29B0','bepsi':'\u03F6','bernou':'\u212C','Bernoullis':'\u212C','beta':'\u03B2','Beta':'\u0392','beth':'\u2136','between':'\u226C','bfr':'\uD835\uDD1F','Bfr':'\uD835\uDD05','bigcap':'\u22C2','bigcirc':'\u25EF','bigcup':'\u22C3','bigodot':'\u2A00','bigoplus':'\u2A01','bigotimes':'\u2A02','bigsqcup':'\u2A06','bigstar':'\u2605','bigtriangledown':'\u25BD','bigtriangleup':'\u25B3','biguplus':'\u2A04','bigvee':'\u22C1','bigwedge':'\u22C0','bkarow':'\u290D','blacklozenge':'\u29EB','blacksquare':'\u25AA','blacktriangle':'\u25B4','blacktriangledown':'\u25BE','blacktriangleleft':'\u25C2','blacktriangleright':'\u25B8','blank':'\u2423','blk12':'\u2592','blk14':'\u2591','blk34':'\u2593','block':'\u2588','bne':'=\u20E5','bnequiv':'\u2261\u20E5','bnot':'\u2310','bNot':'\u2AED','bopf':'\uD835\uDD53','Bopf':'\uD835\uDD39','bot':'\u22A5','bottom':'\u22A5','bowtie':'\u22C8','boxbox':'\u29C9','boxdl':'\u2510','boxdL':'\u2555','boxDl':'\u2556','boxDL':'\u2557','boxdr':'\u250C','boxdR':'\u2552','boxDr':'\u2553','boxDR':'\u2554','boxh':'\u2500','boxH':'\u2550','boxhd':'\u252C','boxhD':'\u2565','boxHd':'\u2564','boxHD':'\u2566','boxhu':'\u2534','boxhU':'\u2568','boxHu':'\u2567','boxHU':'\u2569','boxminus':'\u229F','boxplus':'\u229E','boxtimes':'\u22A0','boxul':'\u2518','boxuL':'\u255B','boxUl':'\u255C','boxUL':'\u255D','boxur':'\u2514','boxuR':'\u2558','boxUr':'\u2559','boxUR':'\u255A','boxv':'\u2502','boxV':'\u2551','boxvh':'\u253C','boxvH':'\u256A','boxVh':'\u256B','boxVH':'\u256C','boxvl':'\u2524','boxvL':'\u2561','boxVl':'\u2562','boxVL':'\u2563','boxvr':'\u251C','boxvR':'\u255E','boxVr':'\u255F','boxVR':'\u2560','bprime':'\u2035','breve':'\u02D8','Breve':'\u02D8','brvbar':'\xA6','bscr':'\uD835\uDCB7','Bscr':'\u212C','bsemi':'\u204F','bsim':'\u223D','bsime':'\u22CD','bsol':'\\','bsolb':'\u29C5','bsolhsub':'\u27C8','bull':'\u2022','bullet':'\u2022','bump':'\u224E','bumpe':'\u224F','bumpE':'\u2AAE','bumpeq':'\u224F','Bumpeq':'\u224E','cacute':'\u0107','Cacute':'\u0106','cap':'\u2229','Cap':'\u22D2','capand':'\u2A44','capbrcup':'\u2A49','capcap':'\u2A4B','capcup':'\u2A47','capdot':'\u2A40','CapitalDifferentialD':'\u2145','caps':'\u2229\uFE00','caret':'\u2041','caron':'\u02C7','Cayleys':'\u212D','ccaps':'\u2A4D','ccaron':'\u010D','Ccaron':'\u010C','ccedil':'\xE7','Ccedil':'\xC7','ccirc':'\u0109','Ccirc':'\u0108','Cconint':'\u2230','ccups':'\u2A4C','ccupssm':'\u2A50','cdot':'\u010B','Cdot':'\u010A','cedil':'\xB8','Cedilla':'\xB8','cemptyv':'\u29B2','cent':'\xA2','centerdot':'\xB7','CenterDot':'\xB7','cfr':'\uD835\uDD20','Cfr':'\u212D','chcy':'\u0447','CHcy':'\u0427','check':'\u2713','checkmark':'\u2713','chi':'\u03C7','Chi':'\u03A7','cir':'\u25CB','circ':'\u02C6','circeq':'\u2257','circlearrowleft':'\u21BA','circlearrowright':'\u21BB','circledast':'\u229B','circledcirc':'\u229A','circleddash':'\u229D','CircleDot':'\u2299','circledR':'\xAE','circledS':'\u24C8','CircleMinus':'\u2296','CirclePlus':'\u2295','CircleTimes':'\u2297','cire':'\u2257','cirE':'\u29C3','cirfnint':'\u2A10','cirmid':'\u2AEF','cirscir':'\u29C2','ClockwiseContourIntegral':'\u2232','CloseCurlyDoubleQuote':'\u201D','CloseCurlyQuote':'\u2019','clubs':'\u2663','clubsuit':'\u2663','colon':':','Colon':'\u2237','colone':'\u2254','Colone':'\u2A74','coloneq':'\u2254','comma':',','commat':'@','comp':'\u2201','compfn':'\u2218','complement':'\u2201','complexes':'\u2102','cong':'\u2245','congdot':'\u2A6D','Congruent':'\u2261','conint':'\u222E','Conint':'\u222F','ContourIntegral':'\u222E','copf':'\uD835\uDD54','Copf':'\u2102','coprod':'\u2210','Coproduct':'\u2210','copy':'\xA9','COPY':'\xA9','copysr':'\u2117','CounterClockwiseContourIntegral':'\u2233','crarr':'\u21B5','cross':'\u2717','Cross':'\u2A2F','cscr':'\uD835\uDCB8','Cscr':'\uD835\uDC9E','csub':'\u2ACF','csube':'\u2AD1','csup':'\u2AD0','csupe':'\u2AD2','ctdot':'\u22EF','cudarrl':'\u2938','cudarrr':'\u2935','cuepr':'\u22DE','cuesc':'\u22DF','cularr':'\u21B6','cularrp':'\u293D','cup':'\u222A','Cup':'\u22D3','cupbrcap':'\u2A48','cupcap':'\u2A46','CupCap':'\u224D','cupcup':'\u2A4A','cupdot':'\u228D','cupor':'\u2A45','cups':'\u222A\uFE00','curarr':'\u21B7','curarrm':'\u293C','curlyeqprec':'\u22DE','curlyeqsucc':'\u22DF','curlyvee':'\u22CE','curlywedge':'\u22CF','curren':'\xA4','curvearrowleft':'\u21B6','curvearrowright':'\u21B7','cuvee':'\u22CE','cuwed':'\u22CF','cwconint':'\u2232','cwint':'\u2231','cylcty':'\u232D','dagger':'\u2020','Dagger':'\u2021','daleth':'\u2138','darr':'\u2193','dArr':'\u21D3','Darr':'\u21A1','dash':'\u2010','dashv':'\u22A3','Dashv':'\u2AE4','dbkarow':'\u290F','dblac':'\u02DD','dcaron':'\u010F','Dcaron':'\u010E','dcy':'\u0434','Dcy':'\u0414','dd':'\u2146','DD':'\u2145','ddagger':'\u2021','ddarr':'\u21CA','DDotrahd':'\u2911','ddotseq':'\u2A77','deg':'\xB0','Del':'\u2207','delta':'\u03B4','Delta':'\u0394','demptyv':'\u29B1','dfisht':'\u297F','dfr':'\uD835\uDD21','Dfr':'\uD835\uDD07','dHar':'\u2965','dharl':'\u21C3','dharr':'\u21C2','DiacriticalAcute':'\xB4','DiacriticalDot':'\u02D9','DiacriticalDoubleAcute':'\u02DD','DiacriticalGrave':'`','DiacriticalTilde':'\u02DC','diam':'\u22C4','diamond':'\u22C4','Diamond':'\u22C4','diamondsuit':'\u2666','diams':'\u2666','die':'\xA8','DifferentialD':'\u2146','digamma':'\u03DD','disin':'\u22F2','div':'\xF7','divide':'\xF7','divideontimes':'\u22C7','divonx':'\u22C7','djcy':'\u0452','DJcy':'\u0402','dlcorn':'\u231E','dlcrop':'\u230D','dollar':'$','dopf':'\uD835\uDD55','Dopf':'\uD835\uDD3B','dot':'\u02D9','Dot':'\xA8','DotDot':'\u20DC','doteq':'\u2250','doteqdot':'\u2251','DotEqual':'\u2250','dotminus':'\u2238','dotplus':'\u2214','dotsquare':'\u22A1','doublebarwedge':'\u2306','DoubleContourIntegral':'\u222F','DoubleDot':'\xA8','DoubleDownArrow':'\u21D3','DoubleLeftArrow':'\u21D0','DoubleLeftRightArrow':'\u21D4','DoubleLeftTee':'\u2AE4','DoubleLongLeftArrow':'\u27F8','DoubleLongLeftRightArrow':'\u27FA','DoubleLongRightArrow':'\u27F9','DoubleRightArrow':'\u21D2','DoubleRightTee':'\u22A8','DoubleUpArrow':'\u21D1','DoubleUpDownArrow':'\u21D5','DoubleVerticalBar':'\u2225','downarrow':'\u2193','Downarrow':'\u21D3','DownArrow':'\u2193','DownArrowBar':'\u2913','DownArrowUpArrow':'\u21F5','DownBreve':'\u0311','downdownarrows':'\u21CA','downharpoonleft':'\u21C3','downharpoonright':'\u21C2','DownLeftRightVector':'\u2950','DownLeftTeeVector':'\u295E','DownLeftVector':'\u21BD','DownLeftVectorBar':'\u2956','DownRightTeeVector':'\u295F','DownRightVector':'\u21C1','DownRightVectorBar':'\u2957','DownTee':'\u22A4','DownTeeArrow':'\u21A7','drbkarow':'\u2910','drcorn':'\u231F','drcrop':'\u230C','dscr':'\uD835\uDCB9','Dscr':'\uD835\uDC9F','dscy':'\u0455','DScy':'\u0405','dsol':'\u29F6','dstrok':'\u0111','Dstrok':'\u0110','dtdot':'\u22F1','dtri':'\u25BF','dtrif':'\u25BE','duarr':'\u21F5','duhar':'\u296F','dwangle':'\u29A6','dzcy':'\u045F','DZcy':'\u040F','dzigrarr':'\u27FF','eacute':'\xE9','Eacute':'\xC9','easter':'\u2A6E','ecaron':'\u011B','Ecaron':'\u011A','ecir':'\u2256','ecirc':'\xEA','Ecirc':'\xCA','ecolon':'\u2255','ecy':'\u044D','Ecy':'\u042D','eDDot':'\u2A77','edot':'\u0117','eDot':'\u2251','Edot':'\u0116','ee':'\u2147','efDot':'\u2252','efr':'\uD835\uDD22','Efr':'\uD835\uDD08','eg':'\u2A9A','egrave':'\xE8','Egrave':'\xC8','egs':'\u2A96','egsdot':'\u2A98','el':'\u2A99','Element':'\u2208','elinters':'\u23E7','ell':'\u2113','els':'\u2A95','elsdot':'\u2A97','emacr':'\u0113','Emacr':'\u0112','empty':'\u2205','emptyset':'\u2205','EmptySmallSquare':'\u25FB','emptyv':'\u2205','EmptyVerySmallSquare':'\u25AB','emsp':'\u2003','emsp13':'\u2004','emsp14':'\u2005','eng':'\u014B','ENG':'\u014A','ensp':'\u2002','eogon':'\u0119','Eogon':'\u0118','eopf':'\uD835\uDD56','Eopf':'\uD835\uDD3C','epar':'\u22D5','eparsl':'\u29E3','eplus':'\u2A71','epsi':'\u03B5','epsilon':'\u03B5','Epsilon':'\u0395','epsiv':'\u03F5','eqcirc':'\u2256','eqcolon':'\u2255','eqsim':'\u2242','eqslantgtr':'\u2A96','eqslantless':'\u2A95','Equal':'\u2A75','equals':'=','EqualTilde':'\u2242','equest':'\u225F','Equilibrium':'\u21CC','equiv':'\u2261','equivDD':'\u2A78','eqvparsl':'\u29E5','erarr':'\u2971','erDot':'\u2253','escr':'\u212F','Escr':'\u2130','esdot':'\u2250','esim':'\u2242','Esim':'\u2A73','eta':'\u03B7','Eta':'\u0397','eth':'\xF0','ETH':'\xD0','euml':'\xEB','Euml':'\xCB','euro':'\u20AC','excl':'!','exist':'\u2203','Exists':'\u2203','expectation':'\u2130','exponentiale':'\u2147','ExponentialE':'\u2147','fallingdotseq':'\u2252','fcy':'\u0444','Fcy':'\u0424','female':'\u2640','ffilig':'\uFB03','fflig':'\uFB00','ffllig':'\uFB04','ffr':'\uD835\uDD23','Ffr':'\uD835\uDD09','filig':'\uFB01','FilledSmallSquare':'\u25FC','FilledVerySmallSquare':'\u25AA','fjlig':'fj','flat':'\u266D','fllig':'\uFB02','fltns':'\u25B1','fnof':'\u0192','fopf':'\uD835\uDD57','Fopf':'\uD835\uDD3D','forall':'\u2200','ForAll':'\u2200','fork':'\u22D4','forkv':'\u2AD9','Fouriertrf':'\u2131','fpartint':'\u2A0D','frac12':'\xBD','frac13':'\u2153','frac14':'\xBC','frac15':'\u2155','frac16':'\u2159','frac18':'\u215B','frac23':'\u2154','frac25':'\u2156','frac34':'\xBE','frac35':'\u2157','frac38':'\u215C','frac45':'\u2158','frac56':'\u215A','frac58':'\u215D','frac78':'\u215E','frasl':'\u2044','frown':'\u2322','fscr':'\uD835\uDCBB','Fscr':'\u2131','gacute':'\u01F5','gamma':'\u03B3','Gamma':'\u0393','gammad':'\u03DD','Gammad':'\u03DC','gap':'\u2A86','gbreve':'\u011F','Gbreve':'\u011E','Gcedil':'\u0122','gcirc':'\u011D','Gcirc':'\u011C','gcy':'\u0433','Gcy':'\u0413','gdot':'\u0121','Gdot':'\u0120','ge':'\u2265','gE':'\u2267','gel':'\u22DB','gEl':'\u2A8C','geq':'\u2265','geqq':'\u2267','geqslant':'\u2A7E','ges':'\u2A7E','gescc':'\u2AA9','gesdot':'\u2A80','gesdoto':'\u2A82','gesdotol':'\u2A84','gesl':'\u22DB\uFE00','gesles':'\u2A94','gfr':'\uD835\uDD24','Gfr':'\uD835\uDD0A','gg':'\u226B','Gg':'\u22D9','ggg':'\u22D9','gimel':'\u2137','gjcy':'\u0453','GJcy':'\u0403','gl':'\u2277','gla':'\u2AA5','glE':'\u2A92','glj':'\u2AA4','gnap':'\u2A8A','gnapprox':'\u2A8A','gne':'\u2A88','gnE':'\u2269','gneq':'\u2A88','gneqq':'\u2269','gnsim':'\u22E7','gopf':'\uD835\uDD58','Gopf':'\uD835\uDD3E','grave':'`','GreaterEqual':'\u2265','GreaterEqualLess':'\u22DB','GreaterFullEqual':'\u2267','GreaterGreater':'\u2AA2','GreaterLess':'\u2277','GreaterSlantEqual':'\u2A7E','GreaterTilde':'\u2273','gscr':'\u210A','Gscr':'\uD835\uDCA2','gsim':'\u2273','gsime':'\u2A8E','gsiml':'\u2A90','gt':'>','Gt':'\u226B','GT':'>','gtcc':'\u2AA7','gtcir':'\u2A7A','gtdot':'\u22D7','gtlPar':'\u2995','gtquest':'\u2A7C','gtrapprox':'\u2A86','gtrarr':'\u2978','gtrdot':'\u22D7','gtreqless':'\u22DB','gtreqqless':'\u2A8C','gtrless':'\u2277','gtrsim':'\u2273','gvertneqq':'\u2269\uFE00','gvnE':'\u2269\uFE00','Hacek':'\u02C7','hairsp':'\u200A','half':'\xBD','hamilt':'\u210B','hardcy':'\u044A','HARDcy':'\u042A','harr':'\u2194','hArr':'\u21D4','harrcir':'\u2948','harrw':'\u21AD','Hat':'^','hbar':'\u210F','hcirc':'\u0125','Hcirc':'\u0124','hearts':'\u2665','heartsuit':'\u2665','hellip':'\u2026','hercon':'\u22B9','hfr':'\uD835\uDD25','Hfr':'\u210C','HilbertSpace':'\u210B','hksearow':'\u2925','hkswarow':'\u2926','hoarr':'\u21FF','homtht':'\u223B','hookleftarrow':'\u21A9','hookrightarrow':'\u21AA','hopf':'\uD835\uDD59','Hopf':'\u210D','horbar':'\u2015','HorizontalLine':'\u2500','hscr':'\uD835\uDCBD','Hscr':'\u210B','hslash':'\u210F','hstrok':'\u0127','Hstrok':'\u0126','HumpDownHump':'\u224E','HumpEqual':'\u224F','hybull':'\u2043','hyphen':'\u2010','iacute':'\xED','Iacute':'\xCD','ic':'\u2063','icirc':'\xEE','Icirc':'\xCE','icy':'\u0438','Icy':'\u0418','Idot':'\u0130','iecy':'\u0435','IEcy':'\u0415','iexcl':'\xA1','iff':'\u21D4','ifr':'\uD835\uDD26','Ifr':'\u2111','igrave':'\xEC','Igrave':'\xCC','ii':'\u2148','iiiint':'\u2A0C','iiint':'\u222D','iinfin':'\u29DC','iiota':'\u2129','ijlig':'\u0133','IJlig':'\u0132','Im':'\u2111','imacr':'\u012B','Imacr':'\u012A','image':'\u2111','ImaginaryI':'\u2148','imagline':'\u2110','imagpart':'\u2111','imath':'\u0131','imof':'\u22B7','imped':'\u01B5','Implies':'\u21D2','in':'\u2208','incare':'\u2105','infin':'\u221E','infintie':'\u29DD','inodot':'\u0131','int':'\u222B','Int':'\u222C','intcal':'\u22BA','integers':'\u2124','Integral':'\u222B','intercal':'\u22BA','Intersection':'\u22C2','intlarhk':'\u2A17','intprod':'\u2A3C','InvisibleComma':'\u2063','InvisibleTimes':'\u2062','iocy':'\u0451','IOcy':'\u0401','iogon':'\u012F','Iogon':'\u012E','iopf':'\uD835\uDD5A','Iopf':'\uD835\uDD40','iota':'\u03B9','Iota':'\u0399','iprod':'\u2A3C','iquest':'\xBF','iscr':'\uD835\uDCBE','Iscr':'\u2110','isin':'\u2208','isindot':'\u22F5','isinE':'\u22F9','isins':'\u22F4','isinsv':'\u22F3','isinv':'\u2208','it':'\u2062','itilde':'\u0129','Itilde':'\u0128','iukcy':'\u0456','Iukcy':'\u0406','iuml':'\xEF','Iuml':'\xCF','jcirc':'\u0135','Jcirc':'\u0134','jcy':'\u0439','Jcy':'\u0419','jfr':'\uD835\uDD27','Jfr':'\uD835\uDD0D','jmath':'\u0237','jopf':'\uD835\uDD5B','Jopf':'\uD835\uDD41','jscr':'\uD835\uDCBF','Jscr':'\uD835\uDCA5','jsercy':'\u0458','Jsercy':'\u0408','jukcy':'\u0454','Jukcy':'\u0404','kappa':'\u03BA','Kappa':'\u039A','kappav':'\u03F0','kcedil':'\u0137','Kcedil':'\u0136','kcy':'\u043A','Kcy':'\u041A','kfr':'\uD835\uDD28','Kfr':'\uD835\uDD0E','kgreen':'\u0138','khcy':'\u0445','KHcy':'\u0425','kjcy':'\u045C','KJcy':'\u040C','kopf':'\uD835\uDD5C','Kopf':'\uD835\uDD42','kscr':'\uD835\uDCC0','Kscr':'\uD835\uDCA6','lAarr':'\u21DA','lacute':'\u013A','Lacute':'\u0139','laemptyv':'\u29B4','lagran':'\u2112','lambda':'\u03BB','Lambda':'\u039B','lang':'\u27E8','Lang':'\u27EA','langd':'\u2991','langle':'\u27E8','lap':'\u2A85','Laplacetrf':'\u2112','laquo':'\xAB','larr':'\u2190','lArr':'\u21D0','Larr':'\u219E','larrb':'\u21E4','larrbfs':'\u291F','larrfs':'\u291D','larrhk':'\u21A9','larrlp':'\u21AB','larrpl':'\u2939','larrsim':'\u2973','larrtl':'\u21A2','lat':'\u2AAB','latail':'\u2919','lAtail':'\u291B','late':'\u2AAD','lates':'\u2AAD\uFE00','lbarr':'\u290C','lBarr':'\u290E','lbbrk':'\u2772','lbrace':'{','lbrack':'[','lbrke':'\u298B','lbrksld':'\u298F','lbrkslu':'\u298D','lcaron':'\u013E','Lcaron':'\u013D','lcedil':'\u013C','Lcedil':'\u013B','lceil':'\u2308','lcub':'{','lcy':'\u043B','Lcy':'\u041B','ldca':'\u2936','ldquo':'\u201C','ldquor':'\u201E','ldrdhar':'\u2967','ldrushar':'\u294B','ldsh':'\u21B2','le':'\u2264','lE':'\u2266','LeftAngleBracket':'\u27E8','leftarrow':'\u2190','Leftarrow':'\u21D0','LeftArrow':'\u2190','LeftArrowBar':'\u21E4','LeftArrowRightArrow':'\u21C6','leftarrowtail':'\u21A2','LeftCeiling':'\u2308','LeftDoubleBracket':'\u27E6','LeftDownTeeVector':'\u2961','LeftDownVector':'\u21C3','LeftDownVectorBar':'\u2959','LeftFloor':'\u230A','leftharpoondown':'\u21BD','leftharpoonup':'\u21BC','leftleftarrows':'\u21C7','leftrightarrow':'\u2194','Leftrightarrow':'\u21D4','LeftRightArrow':'\u2194','leftrightarrows':'\u21C6','leftrightharpoons':'\u21CB','leftrightsquigarrow':'\u21AD','LeftRightVector':'\u294E','LeftTee':'\u22A3','LeftTeeArrow':'\u21A4','LeftTeeVector':'\u295A','leftthreetimes':'\u22CB','LeftTriangle':'\u22B2','LeftTriangleBar':'\u29CF','LeftTriangleEqual':'\u22B4','LeftUpDownVector':'\u2951','LeftUpTeeVector':'\u2960','LeftUpVector':'\u21BF','LeftUpVectorBar':'\u2958','LeftVector':'\u21BC','LeftVectorBar':'\u2952','leg':'\u22DA','lEg':'\u2A8B','leq':'\u2264','leqq':'\u2266','leqslant':'\u2A7D','les':'\u2A7D','lescc':'\u2AA8','lesdot':'\u2A7F','lesdoto':'\u2A81','lesdotor':'\u2A83','lesg':'\u22DA\uFE00','lesges':'\u2A93','lessapprox':'\u2A85','lessdot':'\u22D6','lesseqgtr':'\u22DA','lesseqqgtr':'\u2A8B','LessEqualGreater':'\u22DA','LessFullEqual':'\u2266','LessGreater':'\u2276','lessgtr':'\u2276','LessLess':'\u2AA1','lesssim':'\u2272','LessSlantEqual':'\u2A7D','LessTilde':'\u2272','lfisht':'\u297C','lfloor':'\u230A','lfr':'\uD835\uDD29','Lfr':'\uD835\uDD0F','lg':'\u2276','lgE':'\u2A91','lHar':'\u2962','lhard':'\u21BD','lharu':'\u21BC','lharul':'\u296A','lhblk':'\u2584','ljcy':'\u0459','LJcy':'\u0409','ll':'\u226A','Ll':'\u22D8','llarr':'\u21C7','llcorner':'\u231E','Lleftarrow':'\u21DA','llhard':'\u296B','lltri':'\u25FA','lmidot':'\u0140','Lmidot':'\u013F','lmoust':'\u23B0','lmoustache':'\u23B0','lnap':'\u2A89','lnapprox':'\u2A89','lne':'\u2A87','lnE':'\u2268','lneq':'\u2A87','lneqq':'\u2268','lnsim':'\u22E6','loang':'\u27EC','loarr':'\u21FD','lobrk':'\u27E6','longleftarrow':'\u27F5','Longleftarrow':'\u27F8','LongLeftArrow':'\u27F5','longleftrightarrow':'\u27F7','Longleftrightarrow':'\u27FA','LongLeftRightArrow':'\u27F7','longmapsto':'\u27FC','longrightarrow':'\u27F6','Longrightarrow':'\u27F9','LongRightArrow':'\u27F6','looparrowleft':'\u21AB','looparrowright':'\u21AC','lopar':'\u2985','lopf':'\uD835\uDD5D','Lopf':'\uD835\uDD43','loplus':'\u2A2D','lotimes':'\u2A34','lowast':'\u2217','lowbar':'_','LowerLeftArrow':'\u2199','LowerRightArrow':'\u2198','loz':'\u25CA','lozenge':'\u25CA','lozf':'\u29EB','lpar':'(','lparlt':'\u2993','lrarr':'\u21C6','lrcorner':'\u231F','lrhar':'\u21CB','lrhard':'\u296D','lrm':'\u200E','lrtri':'\u22BF','lsaquo':'\u2039','lscr':'\uD835\uDCC1','Lscr':'\u2112','lsh':'\u21B0','Lsh':'\u21B0','lsim':'\u2272','lsime':'\u2A8D','lsimg':'\u2A8F','lsqb':'[','lsquo':'\u2018','lsquor':'\u201A','lstrok':'\u0142','Lstrok':'\u0141','lt':'<','Lt':'\u226A','LT':'<','ltcc':'\u2AA6','ltcir':'\u2A79','ltdot':'\u22D6','lthree':'\u22CB','ltimes':'\u22C9','ltlarr':'\u2976','ltquest':'\u2A7B','ltri':'\u25C3','ltrie':'\u22B4','ltrif':'\u25C2','ltrPar':'\u2996','lurdshar':'\u294A','luruhar':'\u2966','lvertneqq':'\u2268\uFE00','lvnE':'\u2268\uFE00','macr':'\xAF','male':'\u2642','malt':'\u2720','maltese':'\u2720','map':'\u21A6','Map':'\u2905','mapsto':'\u21A6','mapstodown':'\u21A7','mapstoleft':'\u21A4','mapstoup':'\u21A5','marker':'\u25AE','mcomma':'\u2A29','mcy':'\u043C','Mcy':'\u041C','mdash':'\u2014','mDDot':'\u223A','measuredangle':'\u2221','MediumSpace':'\u205F','Mellintrf':'\u2133','mfr':'\uD835\uDD2A','Mfr':'\uD835\uDD10','mho':'\u2127','micro':'\xB5','mid':'\u2223','midast':'*','midcir':'\u2AF0','middot':'\xB7','minus':'\u2212','minusb':'\u229F','minusd':'\u2238','minusdu':'\u2A2A','MinusPlus':'\u2213','mlcp':'\u2ADB','mldr':'\u2026','mnplus':'\u2213','models':'\u22A7','mopf':'\uD835\uDD5E','Mopf':'\uD835\uDD44','mp':'\u2213','mscr':'\uD835\uDCC2','Mscr':'\u2133','mstpos':'\u223E','mu':'\u03BC','Mu':'\u039C','multimap':'\u22B8','mumap':'\u22B8','nabla':'\u2207','nacute':'\u0144','Nacute':'\u0143','nang':'\u2220\u20D2','nap':'\u2249','napE':'\u2A70\u0338','napid':'\u224B\u0338','napos':'\u0149','napprox':'\u2249','natur':'\u266E','natural':'\u266E','naturals':'\u2115','nbsp':'\xA0','nbump':'\u224E\u0338','nbumpe':'\u224F\u0338','ncap':'\u2A43','ncaron':'\u0148','Ncaron':'\u0147','ncedil':'\u0146','Ncedil':'\u0145','ncong':'\u2247','ncongdot':'\u2A6D\u0338','ncup':'\u2A42','ncy':'\u043D','Ncy':'\u041D','ndash':'\u2013','ne':'\u2260','nearhk':'\u2924','nearr':'\u2197','neArr':'\u21D7','nearrow':'\u2197','nedot':'\u2250\u0338','NegativeMediumSpace':'\u200B','NegativeThickSpace':'\u200B','NegativeThinSpace':'\u200B','NegativeVeryThinSpace':'\u200B','nequiv':'\u2262','nesear':'\u2928','nesim':'\u2242\u0338','NestedGreaterGreater':'\u226B','NestedLessLess':'\u226A','NewLine':'\n','nexist':'\u2204','nexists':'\u2204','nfr':'\uD835\uDD2B','Nfr':'\uD835\uDD11','nge':'\u2271','ngE':'\u2267\u0338','ngeq':'\u2271','ngeqq':'\u2267\u0338','ngeqslant':'\u2A7E\u0338','nges':'\u2A7E\u0338','nGg':'\u22D9\u0338','ngsim':'\u2275','ngt':'\u226F','nGt':'\u226B\u20D2','ngtr':'\u226F','nGtv':'\u226B\u0338','nharr':'\u21AE','nhArr':'\u21CE','nhpar':'\u2AF2','ni':'\u220B','nis':'\u22FC','nisd':'\u22FA','niv':'\u220B','njcy':'\u045A','NJcy':'\u040A','nlarr':'\u219A','nlArr':'\u21CD','nldr':'\u2025','nle':'\u2270','nlE':'\u2266\u0338','nleftarrow':'\u219A','nLeftarrow':'\u21CD','nleftrightarrow':'\u21AE','nLeftrightarrow':'\u21CE','nleq':'\u2270','nleqq':'\u2266\u0338','nleqslant':'\u2A7D\u0338','nles':'\u2A7D\u0338','nless':'\u226E','nLl':'\u22D8\u0338','nlsim':'\u2274','nlt':'\u226E','nLt':'\u226A\u20D2','nltri':'\u22EA','nltrie':'\u22EC','nLtv':'\u226A\u0338','nmid':'\u2224','NoBreak':'\u2060','NonBreakingSpace':'\xA0','nopf':'\uD835\uDD5F','Nopf':'\u2115','not':'\xAC','Not':'\u2AEC','NotCongruent':'\u2262','NotCupCap':'\u226D','NotDoubleVerticalBar':'\u2226','NotElement':'\u2209','NotEqual':'\u2260','NotEqualTilde':'\u2242\u0338','NotExists':'\u2204','NotGreater':'\u226F','NotGreaterEqual':'\u2271','NotGreaterFullEqual':'\u2267\u0338','NotGreaterGreater':'\u226B\u0338','NotGreaterLess':'\u2279','NotGreaterSlantEqual':'\u2A7E\u0338','NotGreaterTilde':'\u2275','NotHumpDownHump':'\u224E\u0338','NotHumpEqual':'\u224F\u0338','notin':'\u2209','notindot':'\u22F5\u0338','notinE':'\u22F9\u0338','notinva':'\u2209','notinvb':'\u22F7','notinvc':'\u22F6','NotLeftTriangle':'\u22EA','NotLeftTriangleBar':'\u29CF\u0338','NotLeftTriangleEqual':'\u22EC','NotLess':'\u226E','NotLessEqual':'\u2270','NotLessGreater':'\u2278','NotLessLess':'\u226A\u0338','NotLessSlantEqual':'\u2A7D\u0338','NotLessTilde':'\u2274','NotNestedGreaterGreater':'\u2AA2\u0338','NotNestedLessLess':'\u2AA1\u0338','notni':'\u220C','notniva':'\u220C','notnivb':'\u22FE','notnivc':'\u22FD','NotPrecedes':'\u2280','NotPrecedesEqual':'\u2AAF\u0338','NotPrecedesSlantEqual':'\u22E0','NotReverseElement':'\u220C','NotRightTriangle':'\u22EB','NotRightTriangleBar':'\u29D0\u0338','NotRightTriangleEqual':'\u22ED','NotSquareSubset':'\u228F\u0338','NotSquareSubsetEqual':'\u22E2','NotSquareSuperset':'\u2290\u0338','NotSquareSupersetEqual':'\u22E3','NotSubset':'\u2282\u20D2','NotSubsetEqual':'\u2288','NotSucceeds':'\u2281','NotSucceedsEqual':'\u2AB0\u0338','NotSucceedsSlantEqual':'\u22E1','NotSucceedsTilde':'\u227F\u0338','NotSuperset':'\u2283\u20D2','NotSupersetEqual':'\u2289','NotTilde':'\u2241','NotTildeEqual':'\u2244','NotTildeFullEqual':'\u2247','NotTildeTilde':'\u2249','NotVerticalBar':'\u2224','npar':'\u2226','nparallel':'\u2226','nparsl':'\u2AFD\u20E5','npart':'\u2202\u0338','npolint':'\u2A14','npr':'\u2280','nprcue':'\u22E0','npre':'\u2AAF\u0338','nprec':'\u2280','npreceq':'\u2AAF\u0338','nrarr':'\u219B','nrArr':'\u21CF','nrarrc':'\u2933\u0338','nrarrw':'\u219D\u0338','nrightarrow':'\u219B','nRightarrow':'\u21CF','nrtri':'\u22EB','nrtrie':'\u22ED','nsc':'\u2281','nsccue':'\u22E1','nsce':'\u2AB0\u0338','nscr':'\uD835\uDCC3','Nscr':'\uD835\uDCA9','nshortmid':'\u2224','nshortparallel':'\u2226','nsim':'\u2241','nsime':'\u2244','nsimeq':'\u2244','nsmid':'\u2224','nspar':'\u2226','nsqsube':'\u22E2','nsqsupe':'\u22E3','nsub':'\u2284','nsube':'\u2288','nsubE':'\u2AC5\u0338','nsubset':'\u2282\u20D2','nsubseteq':'\u2288','nsubseteqq':'\u2AC5\u0338','nsucc':'\u2281','nsucceq':'\u2AB0\u0338','nsup':'\u2285','nsupe':'\u2289','nsupE':'\u2AC6\u0338','nsupset':'\u2283\u20D2','nsupseteq':'\u2289','nsupseteqq':'\u2AC6\u0338','ntgl':'\u2279','ntilde':'\xF1','Ntilde':'\xD1','ntlg':'\u2278','ntriangleleft':'\u22EA','ntrianglelefteq':'\u22EC','ntriangleright':'\u22EB','ntrianglerighteq':'\u22ED','nu':'\u03BD','Nu':'\u039D','num':'#','numero':'\u2116','numsp':'\u2007','nvap':'\u224D\u20D2','nvdash':'\u22AC','nvDash':'\u22AD','nVdash':'\u22AE','nVDash':'\u22AF','nvge':'\u2265\u20D2','nvgt':'>\u20D2','nvHarr':'\u2904','nvinfin':'\u29DE','nvlArr':'\u2902','nvle':'\u2264\u20D2','nvlt':'<\u20D2','nvltrie':'\u22B4\u20D2','nvrArr':'\u2903','nvrtrie':'\u22B5\u20D2','nvsim':'\u223C\u20D2','nwarhk':'\u2923','nwarr':'\u2196','nwArr':'\u21D6','nwarrow':'\u2196','nwnear':'\u2927','oacute':'\xF3','Oacute':'\xD3','oast':'\u229B','ocir':'\u229A','ocirc':'\xF4','Ocirc':'\xD4','ocy':'\u043E','Ocy':'\u041E','odash':'\u229D','odblac':'\u0151','Odblac':'\u0150','odiv':'\u2A38','odot':'\u2299','odsold':'\u29BC','oelig':'\u0153','OElig':'\u0152','ofcir':'\u29BF','ofr':'\uD835\uDD2C','Ofr':'\uD835\uDD12','ogon':'\u02DB','ograve':'\xF2','Ograve':'\xD2','ogt':'\u29C1','ohbar':'\u29B5','ohm':'\u03A9','oint':'\u222E','olarr':'\u21BA','olcir':'\u29BE','olcross':'\u29BB','oline':'\u203E','olt':'\u29C0','omacr':'\u014D','Omacr':'\u014C','omega':'\u03C9','Omega':'\u03A9','omicron':'\u03BF','Omicron':'\u039F','omid':'\u29B6','ominus':'\u2296','oopf':'\uD835\uDD60','Oopf':'\uD835\uDD46','opar':'\u29B7','OpenCurlyDoubleQuote':'\u201C','OpenCurlyQuote':'\u2018','operp':'\u29B9','oplus':'\u2295','or':'\u2228','Or':'\u2A54','orarr':'\u21BB','ord':'\u2A5D','order':'\u2134','orderof':'\u2134','ordf':'\xAA','ordm':'\xBA','origof':'\u22B6','oror':'\u2A56','orslope':'\u2A57','orv':'\u2A5B','oS':'\u24C8','oscr':'\u2134','Oscr':'\uD835\uDCAA','oslash':'\xF8','Oslash':'\xD8','osol':'\u2298','otilde':'\xF5','Otilde':'\xD5','otimes':'\u2297','Otimes':'\u2A37','otimesas':'\u2A36','ouml':'\xF6','Ouml':'\xD6','ovbar':'\u233D','OverBar':'\u203E','OverBrace':'\u23DE','OverBracket':'\u23B4','OverParenthesis':'\u23DC','par':'\u2225','para':'\xB6','parallel':'\u2225','parsim':'\u2AF3','parsl':'\u2AFD','part':'\u2202','PartialD':'\u2202','pcy':'\u043F','Pcy':'\u041F','percnt':'%','period':'.','permil':'\u2030','perp':'\u22A5','pertenk':'\u2031','pfr':'\uD835\uDD2D','Pfr':'\uD835\uDD13','phi':'\u03C6','Phi':'\u03A6','phiv':'\u03D5','phmmat':'\u2133','phone':'\u260E','pi':'\u03C0','Pi':'\u03A0','pitchfork':'\u22D4','piv':'\u03D6','planck':'\u210F','planckh':'\u210E','plankv':'\u210F','plus':'+','plusacir':'\u2A23','plusb':'\u229E','pluscir':'\u2A22','plusdo':'\u2214','plusdu':'\u2A25','pluse':'\u2A72','PlusMinus':'\xB1','plusmn':'\xB1','plussim':'\u2A26','plustwo':'\u2A27','pm':'\xB1','Poincareplane':'\u210C','pointint':'\u2A15','popf':'\uD835\uDD61','Popf':'\u2119','pound':'\xA3','pr':'\u227A','Pr':'\u2ABB','prap':'\u2AB7','prcue':'\u227C','pre':'\u2AAF','prE':'\u2AB3','prec':'\u227A','precapprox':'\u2AB7','preccurlyeq':'\u227C','Precedes':'\u227A','PrecedesEqual':'\u2AAF','PrecedesSlantEqual':'\u227C','PrecedesTilde':'\u227E','preceq':'\u2AAF','precnapprox':'\u2AB9','precneqq':'\u2AB5','precnsim':'\u22E8','precsim':'\u227E','prime':'\u2032','Prime':'\u2033','primes':'\u2119','prnap':'\u2AB9','prnE':'\u2AB5','prnsim':'\u22E8','prod':'\u220F','Product':'\u220F','profalar':'\u232E','profline':'\u2312','profsurf':'\u2313','prop':'\u221D','Proportion':'\u2237','Proportional':'\u221D','propto':'\u221D','prsim':'\u227E','prurel':'\u22B0','pscr':'\uD835\uDCC5','Pscr':'\uD835\uDCAB','psi':'\u03C8','Psi':'\u03A8','puncsp':'\u2008','qfr':'\uD835\uDD2E','Qfr':'\uD835\uDD14','qint':'\u2A0C','qopf':'\uD835\uDD62','Qopf':'\u211A','qprime':'\u2057','qscr':'\uD835\uDCC6','Qscr':'\uD835\uDCAC','quaternions':'\u210D','quatint':'\u2A16','quest':'?','questeq':'\u225F','quot':'"','QUOT':'"','rAarr':'\u21DB','race':'\u223D\u0331','racute':'\u0155','Racute':'\u0154','radic':'\u221A','raemptyv':'\u29B3','rang':'\u27E9','Rang':'\u27EB','rangd':'\u2992','range':'\u29A5','rangle':'\u27E9','raquo':'\xBB','rarr':'\u2192','rArr':'\u21D2','Rarr':'\u21A0','rarrap':'\u2975','rarrb':'\u21E5','rarrbfs':'\u2920','rarrc':'\u2933','rarrfs':'\u291E','rarrhk':'\u21AA','rarrlp':'\u21AC','rarrpl':'\u2945','rarrsim':'\u2974','rarrtl':'\u21A3','Rarrtl':'\u2916','rarrw':'\u219D','ratail':'\u291A','rAtail':'\u291C','ratio':'\u2236','rationals':'\u211A','rbarr':'\u290D','rBarr':'\u290F','RBarr':'\u2910','rbbrk':'\u2773','rbrace':'}','rbrack':']','rbrke':'\u298C','rbrksld':'\u298E','rbrkslu':'\u2990','rcaron':'\u0159','Rcaron':'\u0158','rcedil':'\u0157','Rcedil':'\u0156','rceil':'\u2309','rcub':'}','rcy':'\u0440','Rcy':'\u0420','rdca':'\u2937','rdldhar':'\u2969','rdquo':'\u201D','rdquor':'\u201D','rdsh':'\u21B3','Re':'\u211C','real':'\u211C','realine':'\u211B','realpart':'\u211C','reals':'\u211D','rect':'\u25AD','reg':'\xAE','REG':'\xAE','ReverseElement':'\u220B','ReverseEquilibrium':'\u21CB','ReverseUpEquilibrium':'\u296F','rfisht':'\u297D','rfloor':'\u230B','rfr':'\uD835\uDD2F','Rfr':'\u211C','rHar':'\u2964','rhard':'\u21C1','rharu':'\u21C0','rharul':'\u296C','rho':'\u03C1','Rho':'\u03A1','rhov':'\u03F1','RightAngleBracket':'\u27E9','rightarrow':'\u2192','Rightarrow':'\u21D2','RightArrow':'\u2192','RightArrowBar':'\u21E5','RightArrowLeftArrow':'\u21C4','rightarrowtail':'\u21A3','RightCeiling':'\u2309','RightDoubleBracket':'\u27E7','RightDownTeeVector':'\u295D','RightDownVector':'\u21C2','RightDownVectorBar':'\u2955','RightFloor':'\u230B','rightharpoondown':'\u21C1','rightharpoonup':'\u21C0','rightleftarrows':'\u21C4','rightleftharpoons':'\u21CC','rightrightarrows':'\u21C9','rightsquigarrow':'\u219D','RightTee':'\u22A2','RightTeeArrow':'\u21A6','RightTeeVector':'\u295B','rightthreetimes':'\u22CC','RightTriangle':'\u22B3','RightTriangleBar':'\u29D0','RightTriangleEqual':'\u22B5','RightUpDownVector':'\u294F','RightUpTeeVector':'\u295C','RightUpVector':'\u21BE','RightUpVectorBar':'\u2954','RightVector':'\u21C0','RightVectorBar':'\u2953','ring':'\u02DA','risingdotseq':'\u2253','rlarr':'\u21C4','rlhar':'\u21CC','rlm':'\u200F','rmoust':'\u23B1','rmoustache':'\u23B1','rnmid':'\u2AEE','roang':'\u27ED','roarr':'\u21FE','robrk':'\u27E7','ropar':'\u2986','ropf':'\uD835\uDD63','Ropf':'\u211D','roplus':'\u2A2E','rotimes':'\u2A35','RoundImplies':'\u2970','rpar':')','rpargt':'\u2994','rppolint':'\u2A12','rrarr':'\u21C9','Rrightarrow':'\u21DB','rsaquo':'\u203A','rscr':'\uD835\uDCC7','Rscr':'\u211B','rsh':'\u21B1','Rsh':'\u21B1','rsqb':']','rsquo':'\u2019','rsquor':'\u2019','rthree':'\u22CC','rtimes':'\u22CA','rtri':'\u25B9','rtrie':'\u22B5','rtrif':'\u25B8','rtriltri':'\u29CE','RuleDelayed':'\u29F4','ruluhar':'\u2968','rx':'\u211E','sacute':'\u015B','Sacute':'\u015A','sbquo':'\u201A','sc':'\u227B','Sc':'\u2ABC','scap':'\u2AB8','scaron':'\u0161','Scaron':'\u0160','sccue':'\u227D','sce':'\u2AB0','scE':'\u2AB4','scedil':'\u015F','Scedil':'\u015E','scirc':'\u015D','Scirc':'\u015C','scnap':'\u2ABA','scnE':'\u2AB6','scnsim':'\u22E9','scpolint':'\u2A13','scsim':'\u227F','scy':'\u0441','Scy':'\u0421','sdot':'\u22C5','sdotb':'\u22A1','sdote':'\u2A66','searhk':'\u2925','searr':'\u2198','seArr':'\u21D8','searrow':'\u2198','sect':'\xA7','semi':';','seswar':'\u2929','setminus':'\u2216','setmn':'\u2216','sext':'\u2736','sfr':'\uD835\uDD30','Sfr':'\uD835\uDD16','sfrown':'\u2322','sharp':'\u266F','shchcy':'\u0449','SHCHcy':'\u0429','shcy':'\u0448','SHcy':'\u0428','ShortDownArrow':'\u2193','ShortLeftArrow':'\u2190','shortmid':'\u2223','shortparallel':'\u2225','ShortRightArrow':'\u2192','ShortUpArrow':'\u2191','shy':'\xAD','sigma':'\u03C3','Sigma':'\u03A3','sigmaf':'\u03C2','sigmav':'\u03C2','sim':'\u223C','simdot':'\u2A6A','sime':'\u2243','simeq':'\u2243','simg':'\u2A9E','simgE':'\u2AA0','siml':'\u2A9D','simlE':'\u2A9F','simne':'\u2246','simplus':'\u2A24','simrarr':'\u2972','slarr':'\u2190','SmallCircle':'\u2218','smallsetminus':'\u2216','smashp':'\u2A33','smeparsl':'\u29E4','smid':'\u2223','smile':'\u2323','smt':'\u2AAA','smte':'\u2AAC','smtes':'\u2AAC\uFE00','softcy':'\u044C','SOFTcy':'\u042C','sol':'/','solb':'\u29C4','solbar':'\u233F','sopf':'\uD835\uDD64','Sopf':'\uD835\uDD4A','spades':'\u2660','spadesuit':'\u2660','spar':'\u2225','sqcap':'\u2293','sqcaps':'\u2293\uFE00','sqcup':'\u2294','sqcups':'\u2294\uFE00','Sqrt':'\u221A','sqsub':'\u228F','sqsube':'\u2291','sqsubset':'\u228F','sqsubseteq':'\u2291','sqsup':'\u2290','sqsupe':'\u2292','sqsupset':'\u2290','sqsupseteq':'\u2292','squ':'\u25A1','square':'\u25A1','Square':'\u25A1','SquareIntersection':'\u2293','SquareSubset':'\u228F','SquareSubsetEqual':'\u2291','SquareSuperset':'\u2290','SquareSupersetEqual':'\u2292','SquareUnion':'\u2294','squarf':'\u25AA','squf':'\u25AA','srarr':'\u2192','sscr':'\uD835\uDCC8','Sscr':'\uD835\uDCAE','ssetmn':'\u2216','ssmile':'\u2323','sstarf':'\u22C6','star':'\u2606','Star':'\u22C6','starf':'\u2605','straightepsilon':'\u03F5','straightphi':'\u03D5','strns':'\xAF','sub':'\u2282','Sub':'\u22D0','subdot':'\u2ABD','sube':'\u2286','subE':'\u2AC5','subedot':'\u2AC3','submult':'\u2AC1','subne':'\u228A','subnE':'\u2ACB','subplus':'\u2ABF','subrarr':'\u2979','subset':'\u2282','Subset':'\u22D0','subseteq':'\u2286','subseteqq':'\u2AC5','SubsetEqual':'\u2286','subsetneq':'\u228A','subsetneqq':'\u2ACB','subsim':'\u2AC7','subsub':'\u2AD5','subsup':'\u2AD3','succ':'\u227B','succapprox':'\u2AB8','succcurlyeq':'\u227D','Succeeds':'\u227B','SucceedsEqual':'\u2AB0','SucceedsSlantEqual':'\u227D','SucceedsTilde':'\u227F','succeq':'\u2AB0','succnapprox':'\u2ABA','succneqq':'\u2AB6','succnsim':'\u22E9','succsim':'\u227F','SuchThat':'\u220B','sum':'\u2211','Sum':'\u2211','sung':'\u266A','sup':'\u2283','Sup':'\u22D1','sup1':'\xB9','sup2':'\xB2','sup3':'\xB3','supdot':'\u2ABE','supdsub':'\u2AD8','supe':'\u2287','supE':'\u2AC6','supedot':'\u2AC4','Superset':'\u2283','SupersetEqual':'\u2287','suphsol':'\u27C9','suphsub':'\u2AD7','suplarr':'\u297B','supmult':'\u2AC2','supne':'\u228B','supnE':'\u2ACC','supplus':'\u2AC0','supset':'\u2283','Supset':'\u22D1','supseteq':'\u2287','supseteqq':'\u2AC6','supsetneq':'\u228B','supsetneqq':'\u2ACC','supsim':'\u2AC8','supsub':'\u2AD4','supsup':'\u2AD6','swarhk':'\u2926','swarr':'\u2199','swArr':'\u21D9','swarrow':'\u2199','swnwar':'\u292A','szlig':'\xDF','Tab':'\t','target':'\u2316','tau':'\u03C4','Tau':'\u03A4','tbrk':'\u23B4','tcaron':'\u0165','Tcaron':'\u0164','tcedil':'\u0163','Tcedil':'\u0162','tcy':'\u0442','Tcy':'\u0422','tdot':'\u20DB','telrec':'\u2315','tfr':'\uD835\uDD31','Tfr':'\uD835\uDD17','there4':'\u2234','therefore':'\u2234','Therefore':'\u2234','theta':'\u03B8','Theta':'\u0398','thetasym':'\u03D1','thetav':'\u03D1','thickapprox':'\u2248','thicksim':'\u223C','ThickSpace':'\u205F\u200A','thinsp':'\u2009','ThinSpace':'\u2009','thkap':'\u2248','thksim':'\u223C','thorn':'\xFE','THORN':'\xDE','tilde':'\u02DC','Tilde':'\u223C','TildeEqual':'\u2243','TildeFullEqual':'\u2245','TildeTilde':'\u2248','times':'\xD7','timesb':'\u22A0','timesbar':'\u2A31','timesd':'\u2A30','tint':'\u222D','toea':'\u2928','top':'\u22A4','topbot':'\u2336','topcir':'\u2AF1','topf':'\uD835\uDD65','Topf':'\uD835\uDD4B','topfork':'\u2ADA','tosa':'\u2929','tprime':'\u2034','trade':'\u2122','TRADE':'\u2122','triangle':'\u25B5','triangledown':'\u25BF','triangleleft':'\u25C3','trianglelefteq':'\u22B4','triangleq':'\u225C','triangleright':'\u25B9','trianglerighteq':'\u22B5','tridot':'\u25EC','trie':'\u225C','triminus':'\u2A3A','TripleDot':'\u20DB','triplus':'\u2A39','trisb':'\u29CD','tritime':'\u2A3B','trpezium':'\u23E2','tscr':'\uD835\uDCC9','Tscr':'\uD835\uDCAF','tscy':'\u0446','TScy':'\u0426','tshcy':'\u045B','TSHcy':'\u040B','tstrok':'\u0167','Tstrok':'\u0166','twixt':'\u226C','twoheadleftarrow':'\u219E','twoheadrightarrow':'\u21A0','uacute':'\xFA','Uacute':'\xDA','uarr':'\u2191','uArr':'\u21D1','Uarr':'\u219F','Uarrocir':'\u2949','ubrcy':'\u045E','Ubrcy':'\u040E','ubreve':'\u016D','Ubreve':'\u016C','ucirc':'\xFB','Ucirc':'\xDB','ucy':'\u0443','Ucy':'\u0423','udarr':'\u21C5','udblac':'\u0171','Udblac':'\u0170','udhar':'\u296E','ufisht':'\u297E','ufr':'\uD835\uDD32','Ufr':'\uD835\uDD18','ugrave':'\xF9','Ugrave':'\xD9','uHar':'\u2963','uharl':'\u21BF','uharr':'\u21BE','uhblk':'\u2580','ulcorn':'\u231C','ulcorner':'\u231C','ulcrop':'\u230F','ultri':'\u25F8','umacr':'\u016B','Umacr':'\u016A','uml':'\xA8','UnderBar':'_','UnderBrace':'\u23DF','UnderBracket':'\u23B5','UnderParenthesis':'\u23DD','Union':'\u22C3','UnionPlus':'\u228E','uogon':'\u0173','Uogon':'\u0172','uopf':'\uD835\uDD66','Uopf':'\uD835\uDD4C','uparrow':'\u2191','Uparrow':'\u21D1','UpArrow':'\u2191','UpArrowBar':'\u2912','UpArrowDownArrow':'\u21C5','updownarrow':'\u2195','Updownarrow':'\u21D5','UpDownArrow':'\u2195','UpEquilibrium':'\u296E','upharpoonleft':'\u21BF','upharpoonright':'\u21BE','uplus':'\u228E','UpperLeftArrow':'\u2196','UpperRightArrow':'\u2197','upsi':'\u03C5','Upsi':'\u03D2','upsih':'\u03D2','upsilon':'\u03C5','Upsilon':'\u03A5','UpTee':'\u22A5','UpTeeArrow':'\u21A5','upuparrows':'\u21C8','urcorn':'\u231D','urcorner':'\u231D','urcrop':'\u230E','uring':'\u016F','Uring':'\u016E','urtri':'\u25F9','uscr':'\uD835\uDCCA','Uscr':'\uD835\uDCB0','utdot':'\u22F0','utilde':'\u0169','Utilde':'\u0168','utri':'\u25B5','utrif':'\u25B4','uuarr':'\u21C8','uuml':'\xFC','Uuml':'\xDC','uwangle':'\u29A7','vangrt':'\u299C','varepsilon':'\u03F5','varkappa':'\u03F0','varnothing':'\u2205','varphi':'\u03D5','varpi':'\u03D6','varpropto':'\u221D','varr':'\u2195','vArr':'\u21D5','varrho':'\u03F1','varsigma':'\u03C2','varsubsetneq':'\u228A\uFE00','varsubsetneqq':'\u2ACB\uFE00','varsupsetneq':'\u228B\uFE00','varsupsetneqq':'\u2ACC\uFE00','vartheta':'\u03D1','vartriangleleft':'\u22B2','vartriangleright':'\u22B3','vBar':'\u2AE8','Vbar':'\u2AEB','vBarv':'\u2AE9','vcy':'\u0432','Vcy':'\u0412','vdash':'\u22A2','vDash':'\u22A8','Vdash':'\u22A9','VDash':'\u22AB','Vdashl':'\u2AE6','vee':'\u2228','Vee':'\u22C1','veebar':'\u22BB','veeeq':'\u225A','vellip':'\u22EE','verbar':'|','Verbar':'\u2016','vert':'|','Vert':'\u2016','VerticalBar':'\u2223','VerticalLine':'|','VerticalSeparator':'\u2758','VerticalTilde':'\u2240','VeryThinSpace':'\u200A','vfr':'\uD835\uDD33','Vfr':'\uD835\uDD19','vltri':'\u22B2','vnsub':'\u2282\u20D2','vnsup':'\u2283\u20D2','vopf':'\uD835\uDD67','Vopf':'\uD835\uDD4D','vprop':'\u221D','vrtri':'\u22B3','vscr':'\uD835\uDCCB','Vscr':'\uD835\uDCB1','vsubne':'\u228A\uFE00','vsubnE':'\u2ACB\uFE00','vsupne':'\u228B\uFE00','vsupnE':'\u2ACC\uFE00','Vvdash':'\u22AA','vzigzag':'\u299A','wcirc':'\u0175','Wcirc':'\u0174','wedbar':'\u2A5F','wedge':'\u2227','Wedge':'\u22C0','wedgeq':'\u2259','weierp':'\u2118','wfr':'\uD835\uDD34','Wfr':'\uD835\uDD1A','wopf':'\uD835\uDD68','Wopf':'\uD835\uDD4E','wp':'\u2118','wr':'\u2240','wreath':'\u2240','wscr':'\uD835\uDCCC','Wscr':'\uD835\uDCB2','xcap':'\u22C2','xcirc':'\u25EF','xcup':'\u22C3','xdtri':'\u25BD','xfr':'\uD835\uDD35','Xfr':'\uD835\uDD1B','xharr':'\u27F7','xhArr':'\u27FA','xi':'\u03BE','Xi':'\u039E','xlarr':'\u27F5','xlArr':'\u27F8','xmap':'\u27FC','xnis':'\u22FB','xodot':'\u2A00','xopf':'\uD835\uDD69','Xopf':'\uD835\uDD4F','xoplus':'\u2A01','xotime':'\u2A02','xrarr':'\u27F6','xrArr':'\u27F9','xscr':'\uD835\uDCCD','Xscr':'\uD835\uDCB3','xsqcup':'\u2A06','xuplus':'\u2A04','xutri':'\u25B3','xvee':'\u22C1','xwedge':'\u22C0','yacute':'\xFD','Yacute':'\xDD','yacy':'\u044F','YAcy':'\u042F','ycirc':'\u0177','Ycirc':'\u0176','ycy':'\u044B','Ycy':'\u042B','yen':'\xA5','yfr':'\uD835\uDD36','Yfr':'\uD835\uDD1C','yicy':'\u0457','YIcy':'\u0407','yopf':'\uD835\uDD6A','Yopf':'\uD835\uDD50','yscr':'\uD835\uDCCE','Yscr':'\uD835\uDCB4','yucy':'\u044E','YUcy':'\u042E','yuml':'\xFF','Yuml':'\u0178','zacute':'\u017A','Zacute':'\u0179','zcaron':'\u017E','Zcaron':'\u017D','zcy':'\u0437','Zcy':'\u0417','zdot':'\u017C','Zdot':'\u017B','zeetrf':'\u2128','ZeroWidthSpace':'\u200B','zeta':'\u03B6','Zeta':'\u0396','zfr':'\uD835\uDD37','Zfr':'\u2128','zhcy':'\u0436','ZHcy':'\u0416','zigrarr':'\u21DD','zopf':'\uD835\uDD6B','Zopf':'\u2124','zscr':'\uD835\uDCCF','Zscr':'\uD835\uDCB5','zwj':'\u200D','zwnj':'\u200C'};
	var decodeMapLegacy = {'aacute':'\xE1','Aacute':'\xC1','acirc':'\xE2','Acirc':'\xC2','acute':'\xB4','aelig':'\xE6','AElig':'\xC6','agrave':'\xE0','Agrave':'\xC0','amp':'&','AMP':'&','aring':'\xE5','Aring':'\xC5','atilde':'\xE3','Atilde':'\xC3','auml':'\xE4','Auml':'\xC4','brvbar':'\xA6','ccedil':'\xE7','Ccedil':'\xC7','cedil':'\xB8','cent':'\xA2','copy':'\xA9','COPY':'\xA9','curren':'\xA4','deg':'\xB0','divide':'\xF7','eacute':'\xE9','Eacute':'\xC9','ecirc':'\xEA','Ecirc':'\xCA','egrave':'\xE8','Egrave':'\xC8','eth':'\xF0','ETH':'\xD0','euml':'\xEB','Euml':'\xCB','frac12':'\xBD','frac14':'\xBC','frac34':'\xBE','gt':'>','GT':'>','iacute':'\xED','Iacute':'\xCD','icirc':'\xEE','Icirc':'\xCE','iexcl':'\xA1','igrave':'\xEC','Igrave':'\xCC','iquest':'\xBF','iuml':'\xEF','Iuml':'\xCF','laquo':'\xAB','lt':'<','LT':'<','macr':'\xAF','micro':'\xB5','middot':'\xB7','nbsp':'\xA0','not':'\xAC','ntilde':'\xF1','Ntilde':'\xD1','oacute':'\xF3','Oacute':'\xD3','ocirc':'\xF4','Ocirc':'\xD4','ograve':'\xF2','Ograve':'\xD2','ordf':'\xAA','ordm':'\xBA','oslash':'\xF8','Oslash':'\xD8','otilde':'\xF5','Otilde':'\xD5','ouml':'\xF6','Ouml':'\xD6','para':'\xB6','plusmn':'\xB1','pound':'\xA3','quot':'"','QUOT':'"','raquo':'\xBB','reg':'\xAE','REG':'\xAE','sect':'\xA7','shy':'\xAD','sup1':'\xB9','sup2':'\xB2','sup3':'\xB3','szlig':'\xDF','thorn':'\xFE','THORN':'\xDE','times':'\xD7','uacute':'\xFA','Uacute':'\xDA','ucirc':'\xFB','Ucirc':'\xDB','ugrave':'\xF9','Ugrave':'\xD9','uml':'\xA8','uuml':'\xFC','Uuml':'\xDC','yacute':'\xFD','Yacute':'\xDD','yen':'\xA5','yuml':'\xFF'};
	var decodeMapNumeric = {'0':'\uFFFD','128':'\u20AC','130':'\u201A','131':'\u0192','132':'\u201E','133':'\u2026','134':'\u2020','135':'\u2021','136':'\u02C6','137':'\u2030','138':'\u0160','139':'\u2039','140':'\u0152','142':'\u017D','145':'\u2018','146':'\u2019','147':'\u201C','148':'\u201D','149':'\u2022','150':'\u2013','151':'\u2014','152':'\u02DC','153':'\u2122','154':'\u0161','155':'\u203A','156':'\u0153','158':'\u017E','159':'\u0178'};
	var invalidReferenceCodePoints = [1,2,3,4,5,6,7,8,11,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,64976,64977,64978,64979,64980,64981,64982,64983,64984,64985,64986,64987,64988,64989,64990,64991,64992,64993,64994,64995,64996,64997,64998,64999,65000,65001,65002,65003,65004,65005,65006,65007,65534,65535,131070,131071,196606,196607,262142,262143,327678,327679,393214,393215,458750,458751,524286,524287,589822,589823,655358,655359,720894,720895,786430,786431,851966,851967,917502,917503,983038,983039,1048574,1048575,1114110,1114111];

	/*--------------------------------------------------------------------------*/

	var stringFromCharCode = String.fromCharCode;

	var object = {};
	var hasOwnProperty = object.hasOwnProperty;
	var has = function(object, propertyName) {
		return hasOwnProperty.call(object, propertyName);
	};

	var contains = function(array, value) {
		var index = -1;
		var length = array.length;
		while (++index < length) {
			if (array[index] == value) {
				return true;
			}
		}
		return false;
	};

	var merge = function(options, defaults) {
		if (!options) {
			return defaults;
		}
		var result = {};
		var key;
		for (key in defaults) {
			// A `hasOwnProperty` check is not needed here, since only recognized
			// option names are used anyway. Any others are ignored.
			result[key] = has(options, key) ? options[key] : defaults[key];
		}
		return result;
	};

	// Modified version of `ucs2encode`; see https://mths.be/punycode.
	var codePointToSymbol = function(codePoint, strict) {
		var output = '';
		if ((codePoint >= 0xD800 && codePoint <= 0xDFFF) || codePoint > 0x10FFFF) {
			// See issue #4:
			// “Otherwise, if the number is in the range 0xD800 to 0xDFFF or is
			// greater than 0x10FFFF, then this is a parse error. Return a U+FFFD
			// REPLACEMENT CHARACTER.”
			if (strict) {
				parseError('character reference outside the permissible Unicode range');
			}
			return '\uFFFD';
		}
		if (has(decodeMapNumeric, codePoint)) {
			if (strict) {
				parseError('disallowed character reference');
			}
			return decodeMapNumeric[codePoint];
		}
		if (strict && contains(invalidReferenceCodePoints, codePoint)) {
			parseError('disallowed character reference');
		}
		if (codePoint > 0xFFFF) {
			codePoint -= 0x10000;
			output += stringFromCharCode(codePoint >>> 10 & 0x3FF | 0xD800);
			codePoint = 0xDC00 | codePoint & 0x3FF;
		}
		output += stringFromCharCode(codePoint);
		return output;
	};

	var hexEscape = function(codePoint) {
		return '&#x' + codePoint.toString(16).toUpperCase() + ';';
	};

	var decEscape = function(codePoint) {
		return '&#' + codePoint + ';';
	};

	var parseError = function(message) {
		throw Error('Parse error: ' + message);
	};

	/*--------------------------------------------------------------------------*/

	var encode = function(string, options) {
		options = merge(options, encode.options);
		var strict = options.strict;
		if (strict && regexInvalidRawCodePoint.test(string)) {
			parseError('forbidden code point');
		}
		var encodeEverything = options.encodeEverything;
		var useNamedReferences = options.useNamedReferences;
		var allowUnsafeSymbols = options.allowUnsafeSymbols;
		var escapeCodePoint = options.decimal ? decEscape : hexEscape;

		var escapeBmpSymbol = function(symbol) {
			return escapeCodePoint(symbol.charCodeAt(0));
		};

		if (encodeEverything) {
			// Encode ASCII symbols.
			string = string.replace(regexAsciiWhitelist, function(symbol) {
				// Use named references if requested & possible.
				if (useNamedReferences && has(encodeMap, symbol)) {
					return '&' + encodeMap[symbol] + ';';
				}
				return escapeBmpSymbol(symbol);
			});
			// Shorten a few escapes that represent two symbols, of which at least one
			// is within the ASCII range.
			if (useNamedReferences) {
				string = string
					.replace(/&gt;\u20D2/g, '&nvgt;')
					.replace(/&lt;\u20D2/g, '&nvlt;')
					.replace(/&#x66;&#x6A;/g, '&fjlig;');
			}
			// Encode non-ASCII symbols.
			if (useNamedReferences) {
				// Encode non-ASCII symbols that can be replaced with a named reference.
				string = string.replace(regexEncodeNonAscii, function(string) {
					// Note: there is no need to check `has(encodeMap, string)` here.
					return '&' + encodeMap[string] + ';';
				});
			}
			// Note: any remaining non-ASCII symbols are handled outside of the `if`.
		} else if (useNamedReferences) {
			// Apply named character references.
			// Encode `<>"'&` using named character references.
			if (!allowUnsafeSymbols) {
				string = string.replace(regexEscape, function(string) {
					return '&' + encodeMap[string] + ';'; // no need to check `has()` here
				});
			}
			// Shorten escapes that represent two symbols, of which at least one is
			// `<>"'&`.
			string = string
				.replace(/&gt;\u20D2/g, '&nvgt;')
				.replace(/&lt;\u20D2/g, '&nvlt;');
			// Encode non-ASCII symbols that can be replaced with a named reference.
			string = string.replace(regexEncodeNonAscii, function(string) {
				// Note: there is no need to check `has(encodeMap, string)` here.
				return '&' + encodeMap[string] + ';';
			});
		} else if (!allowUnsafeSymbols) {
			// Encode `<>"'&` using hexadecimal escapes, now that they’re not handled
			// using named character references.
			string = string.replace(regexEscape, escapeBmpSymbol);
		}
		return string
			// Encode astral symbols.
			.replace(regexAstralSymbols, function($0) {
				// https://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
				var high = $0.charCodeAt(0);
				var low = $0.charCodeAt(1);
				var codePoint = (high - 0xD800) * 0x400 + low - 0xDC00 + 0x10000;
				return escapeCodePoint(codePoint);
			})
			// Encode any remaining BMP symbols that are not printable ASCII symbols
			// using a hexadecimal escape.
			.replace(regexBmpWhitelist, escapeBmpSymbol);
	};
	// Expose default options (so they can be overridden globally).
	encode.options = {
		'allowUnsafeSymbols': false,
		'encodeEverything': false,
		'strict': false,
		'useNamedReferences': false,
		'decimal' : false
	};

	var decode = function(html, options) {
		options = merge(options, decode.options);
		var strict = options.strict;
		if (strict && regexInvalidEntity.test(html)) {
			parseError('malformed character reference');
		}
		return html.replace(regexDecode, function($0, $1, $2, $3, $4, $5, $6, $7, $8) {
			var codePoint;
			var semicolon;
			var decDigits;
			var hexDigits;
			var reference;
			var next;

			if ($1) {
				reference = $1;
				// Note: there is no need to check `has(decodeMap, reference)`.
				return decodeMap[reference];
			}

			if ($2) {
				// Decode named character references without trailing `;`, e.g. `&amp`.
				// This is only a parse error if it gets converted to `&`, or if it is
				// followed by `=` in an attribute context.
				reference = $2;
				next = $3;
				if (next && options.isAttributeValue) {
					if (strict && next == '=') {
						parseError('`&` did not start a character reference');
					}
					return $0;
				} else {
					if (strict) {
						parseError(
							'named character reference was not terminated by a semicolon'
						);
					}
					// Note: there is no need to check `has(decodeMapLegacy, reference)`.
					return decodeMapLegacy[reference] + (next || '');
				}
			}

			if ($4) {
				// Decode decimal escapes, e.g. `&#119558;`.
				decDigits = $4;
				semicolon = $5;
				if (strict && !semicolon) {
					parseError('character reference was not terminated by a semicolon');
				}
				codePoint = parseInt(decDigits, 10);
				return codePointToSymbol(codePoint, strict);
			}

			if ($6) {
				// Decode hexadecimal escapes, e.g. `&#x1D306;`.
				hexDigits = $6;
				semicolon = $7;
				if (strict && !semicolon) {
					parseError('character reference was not terminated by a semicolon');
				}
				codePoint = parseInt(hexDigits, 16);
				return codePointToSymbol(codePoint, strict);
			}

			// If we’re still here, `if ($7)` is implied; it’s an ambiguous
			// ampersand for sure. https://mths.be/notes/ambiguous-ampersands
			if (strict) {
				parseError(
					'named character reference was not terminated by a semicolon'
				);
			}
			return $0;
		});
	};
	// Expose default options (so they can be overridden globally).
	decode.options = {
		'isAttributeValue': false,
		'strict': false
	};

	var escape = function(string) {
		return string.replace(regexEscape, function($0) {
			// Note: there is no need to check `has(escapeMap, $0)` here.
			return escapeMap[$0];
		});
	};

	/*--------------------------------------------------------------------------*/

	var he = {
		'version': '1.2.0',
		'encode': encode,
		'decode': decode,
		'escape': escape,
		'unescape': decode
	};

	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		typeof define == 'function' &&
		typeof define.amd == 'object' &&
		define.amd
	) {
		define(function() {
			return he;
		});
	}	else if (freeExports && !freeExports.nodeType) {
		if (freeModule) { // in Node.js, io.js, or RingoJS v0.8.0+
			freeModule.exports = he;
		} else { // in Narwhal or RingoJS v0.7.0-
			for (var key in he) {
				has(he, key) && (freeExports[key] = he[key]);
			}
		}
	} else { // in Rhino or a web browser
		root.he = he;
	}

}(this));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],4:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],5:[function(require,module,exports){
(function (global){
/*! https://mths.be/punycode v1.4.1 by @mathias */
;(function(root) {

	/** Detect free variables */
	var freeExports = typeof exports == 'object' && exports &&
		!exports.nodeType && exports;
	var freeModule = typeof module == 'object' && module &&
		!module.nodeType && module;
	var freeGlobal = typeof global == 'object' && global;
	if (
		freeGlobal.global === freeGlobal ||
		freeGlobal.window === freeGlobal ||
		freeGlobal.self === freeGlobal
	) {
		root = freeGlobal;
	}

	/**
	 * The `punycode` object.
	 * @name punycode
	 * @type Object
	 */
	var punycode,

	/** Highest positive signed 32-bit float value */
	maxInt = 2147483647, // aka. 0x7FFFFFFF or 2^31-1

	/** Bootstring parameters */
	base = 36,
	tMin = 1,
	tMax = 26,
	skew = 38,
	damp = 700,
	initialBias = 72,
	initialN = 128, // 0x80
	delimiter = '-', // '\x2D'

	/** Regular expressions */
	regexPunycode = /^xn--/,
	regexNonASCII = /[^\x20-\x7E]/, // unprintable ASCII chars + non-ASCII chars
	regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g, // RFC 3490 separators

	/** Error messages */
	errors = {
		'overflow': 'Overflow: input needs wider integers to process',
		'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
		'invalid-input': 'Invalid input'
	},

	/** Convenience shortcuts */
	baseMinusTMin = base - tMin,
	floor = Math.floor,
	stringFromCharCode = String.fromCharCode,

	/** Temporary variable */
	key;

	/*--------------------------------------------------------------------------*/

	/**
	 * A generic error utility function.
	 * @private
	 * @param {String} type The error type.
	 * @returns {Error} Throws a `RangeError` with the applicable error message.
	 */
	function error(type) {
		throw new RangeError(errors[type]);
	}

	/**
	 * A generic `Array#map` utility function.
	 * @private
	 * @param {Array} array The array to iterate over.
	 * @param {Function} callback The function that gets called for every array
	 * item.
	 * @returns {Array} A new array of values returned by the callback function.
	 */
	function map(array, fn) {
		var length = array.length;
		var result = [];
		while (length--) {
			result[length] = fn(array[length]);
		}
		return result;
	}

	/**
	 * A simple `Array#map`-like wrapper to work with domain name strings or email
	 * addresses.
	 * @private
	 * @param {String} domain The domain name or email address.
	 * @param {Function} callback The function that gets called for every
	 * character.
	 * @returns {Array} A new string of characters returned by the callback
	 * function.
	 */
	function mapDomain(string, fn) {
		var parts = string.split('@');
		var result = '';
		if (parts.length > 1) {
			// In email addresses, only the domain name should be punycoded. Leave
			// the local part (i.e. everything up to `@`) intact.
			result = parts[0] + '@';
			string = parts[1];
		}
		// Avoid `split(regex)` for IE8 compatibility. See #17.
		string = string.replace(regexSeparators, '\x2E');
		var labels = string.split('.');
		var encoded = map(labels, fn).join('.');
		return result + encoded;
	}

	/**
	 * Creates an array containing the numeric code points of each Unicode
	 * character in the string. While JavaScript uses UCS-2 internally,
	 * this function will convert a pair of surrogate halves (each of which
	 * UCS-2 exposes as separate characters) into a single code point,
	 * matching UTF-16.
	 * @see `punycode.ucs2.encode`
	 * @see <https://mathiasbynens.be/notes/javascript-encoding>
	 * @memberOf punycode.ucs2
	 * @name decode
	 * @param {String} string The Unicode input string (UCS-2).
	 * @returns {Array} The new array of code points.
	 */
	function ucs2decode(string) {
		var output = [],
		    counter = 0,
		    length = string.length,
		    value,
		    extra;
		while (counter < length) {
			value = string.charCodeAt(counter++);
			if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
				// high surrogate, and there is a next character
				extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) { // low surrogate
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				} else {
					// unmatched surrogate; only append this code unit, in case the next
					// code unit is the high surrogate of a surrogate pair
					output.push(value);
					counter--;
				}
			} else {
				output.push(value);
			}
		}
		return output;
	}

	/**
	 * Creates a string based on an array of numeric code points.
	 * @see `punycode.ucs2.decode`
	 * @memberOf punycode.ucs2
	 * @name encode
	 * @param {Array} codePoints The array of numeric code points.
	 * @returns {String} The new Unicode string (UCS-2).
	 */
	function ucs2encode(array) {
		return map(array, function(value) {
			var output = '';
			if (value > 0xFFFF) {
				value -= 0x10000;
				output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
				value = 0xDC00 | value & 0x3FF;
			}
			output += stringFromCharCode(value);
			return output;
		}).join('');
	}

	/**
	 * Converts a basic code point into a digit/integer.
	 * @see `digitToBasic()`
	 * @private
	 * @param {Number} codePoint The basic numeric code point value.
	 * @returns {Number} The numeric value of a basic code point (for use in
	 * representing integers) in the range `0` to `base - 1`, or `base` if
	 * the code point does not represent a value.
	 */
	function basicToDigit(codePoint) {
		if (codePoint - 48 < 10) {
			return codePoint - 22;
		}
		if (codePoint - 65 < 26) {
			return codePoint - 65;
		}
		if (codePoint - 97 < 26) {
			return codePoint - 97;
		}
		return base;
	}

	/**
	 * Converts a digit/integer into a basic code point.
	 * @see `basicToDigit()`
	 * @private
	 * @param {Number} digit The numeric value of a basic code point.
	 * @returns {Number} The basic code point whose value (when used for
	 * representing integers) is `digit`, which needs to be in the range
	 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
	 * used; else, the lowercase form is used. The behavior is undefined
	 * if `flag` is non-zero and `digit` has no uppercase form.
	 */
	function digitToBasic(digit, flag) {
		//  0..25 map to ASCII a..z or A..Z
		// 26..35 map to ASCII 0..9
		return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
	}

	/**
	 * Bias adaptation function as per section 3.4 of RFC 3492.
	 * https://tools.ietf.org/html/rfc3492#section-3.4
	 * @private
	 */
	function adapt(delta, numPoints, firstTime) {
		var k = 0;
		delta = firstTime ? floor(delta / damp) : delta >> 1;
		delta += floor(delta / numPoints);
		for (/* no initialization */; delta > baseMinusTMin * tMax >> 1; k += base) {
			delta = floor(delta / baseMinusTMin);
		}
		return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
	}

	/**
	 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
	 * symbols.
	 * @memberOf punycode
	 * @param {String} input The Punycode string of ASCII-only symbols.
	 * @returns {String} The resulting string of Unicode symbols.
	 */
	function decode(input) {
		// Don't use UCS-2
		var output = [],
		    inputLength = input.length,
		    out,
		    i = 0,
		    n = initialN,
		    bias = initialBias,
		    basic,
		    j,
		    index,
		    oldi,
		    w,
		    k,
		    digit,
		    t,
		    /** Cached calculation results */
		    baseMinusT;

		// Handle the basic code points: let `basic` be the number of input code
		// points before the last delimiter, or `0` if there is none, then copy
		// the first basic code points to the output.

		basic = input.lastIndexOf(delimiter);
		if (basic < 0) {
			basic = 0;
		}

		for (j = 0; j < basic; ++j) {
			// if it's not a basic code point
			if (input.charCodeAt(j) >= 0x80) {
				error('not-basic');
			}
			output.push(input.charCodeAt(j));
		}

		// Main decoding loop: start just after the last delimiter if any basic code
		// points were copied; start at the beginning otherwise.

		for (index = basic > 0 ? basic + 1 : 0; index < inputLength; /* no final expression */) {

			// `index` is the index of the next character to be consumed.
			// Decode a generalized variable-length integer into `delta`,
			// which gets added to `i`. The overflow checking is easier
			// if we increase `i` as we go, then subtract off its starting
			// value at the end to obtain `delta`.
			for (oldi = i, w = 1, k = base; /* no condition */; k += base) {

				if (index >= inputLength) {
					error('invalid-input');
				}

				digit = basicToDigit(input.charCodeAt(index++));

				if (digit >= base || digit > floor((maxInt - i) / w)) {
					error('overflow');
				}

				i += digit * w;
				t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);

				if (digit < t) {
					break;
				}

				baseMinusT = base - t;
				if (w > floor(maxInt / baseMinusT)) {
					error('overflow');
				}

				w *= baseMinusT;

			}

			out = output.length + 1;
			bias = adapt(i - oldi, out, oldi == 0);

			// `i` was supposed to wrap around from `out` to `0`,
			// incrementing `n` each time, so we'll fix that now:
			if (floor(i / out) > maxInt - n) {
				error('overflow');
			}

			n += floor(i / out);
			i %= out;

			// Insert `n` at position `i` of the output
			output.splice(i++, 0, n);

		}

		return ucs2encode(output);
	}

	/**
	 * Converts a string of Unicode symbols (e.g. a domain name label) to a
	 * Punycode string of ASCII-only symbols.
	 * @memberOf punycode
	 * @param {String} input The string of Unicode symbols.
	 * @returns {String} The resulting Punycode string of ASCII-only symbols.
	 */
	function encode(input) {
		var n,
		    delta,
		    handledCPCount,
		    basicLength,
		    bias,
		    j,
		    m,
		    q,
		    k,
		    t,
		    currentValue,
		    output = [],
		    /** `inputLength` will hold the number of code points in `input`. */
		    inputLength,
		    /** Cached calculation results */
		    handledCPCountPlusOne,
		    baseMinusT,
		    qMinusT;

		// Convert the input in UCS-2 to Unicode
		input = ucs2decode(input);

		// Cache the length
		inputLength = input.length;

		// Initialize the state
		n = initialN;
		delta = 0;
		bias = initialBias;

		// Handle the basic code points
		for (j = 0; j < inputLength; ++j) {
			currentValue = input[j];
			if (currentValue < 0x80) {
				output.push(stringFromCharCode(currentValue));
			}
		}

		handledCPCount = basicLength = output.length;

		// `handledCPCount` is the number of code points that have been handled;
		// `basicLength` is the number of basic code points.

		// Finish the basic string - if it is not empty - with a delimiter
		if (basicLength) {
			output.push(delimiter);
		}

		// Main encoding loop:
		while (handledCPCount < inputLength) {

			// All non-basic code points < n have been handled already. Find the next
			// larger one:
			for (m = maxInt, j = 0; j < inputLength; ++j) {
				currentValue = input[j];
				if (currentValue >= n && currentValue < m) {
					m = currentValue;
				}
			}

			// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
			// but guard against overflow
			handledCPCountPlusOne = handledCPCount + 1;
			if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
				error('overflow');
			}

			delta += (m - n) * handledCPCountPlusOne;
			n = m;

			for (j = 0; j < inputLength; ++j) {
				currentValue = input[j];

				if (currentValue < n && ++delta > maxInt) {
					error('overflow');
				}

				if (currentValue == n) {
					// Represent delta as a generalized variable-length integer
					for (q = delta, k = base; /* no condition */; k += base) {
						t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
						if (q < t) {
							break;
						}
						qMinusT = q - t;
						baseMinusT = base - t;
						output.push(
							stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
						);
						q = floor(qMinusT / baseMinusT);
					}

					output.push(stringFromCharCode(digitToBasic(q, 0)));
					bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
					delta = 0;
					++handledCPCount;
				}
			}

			++delta;
			++n;

		}
		return output.join('');
	}

	/**
	 * Converts a Punycode string representing a domain name or an email address
	 * to Unicode. Only the Punycoded parts of the input will be converted, i.e.
	 * it doesn't matter if you call it on a string that has already been
	 * converted to Unicode.
	 * @memberOf punycode
	 * @param {String} input The Punycoded domain name or email address to
	 * convert to Unicode.
	 * @returns {String} The Unicode representation of the given Punycode
	 * string.
	 */
	function toUnicode(input) {
		return mapDomain(input, function(string) {
			return regexPunycode.test(string)
				? decode(string.slice(4).toLowerCase())
				: string;
		});
	}

	/**
	 * Converts a Unicode string representing a domain name or an email address to
	 * Punycode. Only the non-ASCII parts of the domain name will be converted,
	 * i.e. it doesn't matter if you call it with a domain that's already in
	 * ASCII.
	 * @memberOf punycode
	 * @param {String} input The domain name or email address to convert, as a
	 * Unicode string.
	 * @returns {String} The Punycode representation of the given domain name or
	 * email address.
	 */
	function toASCII(input) {
		return mapDomain(input, function(string) {
			return regexNonASCII.test(string)
				? 'xn--' + encode(string)
				: string;
		});
	}

	/*--------------------------------------------------------------------------*/

	/** Define the public API */
	punycode = {
		/**
		 * A string representing the current Punycode.js version number.
		 * @memberOf punycode
		 * @type String
		 */
		'version': '1.4.1',
		/**
		 * An object of methods to convert from JavaScript's internal character
		 * representation (UCS-2) to Unicode code points, and back.
		 * @see <https://mathiasbynens.be/notes/javascript-encoding>
		 * @memberOf punycode
		 * @type Object
		 */
		'ucs2': {
			'decode': ucs2decode,
			'encode': ucs2encode
		},
		'decode': decode,
		'encode': encode,
		'toASCII': toASCII,
		'toUnicode': toUnicode
	};

	/** Expose `punycode` */
	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		typeof define == 'function' &&
		typeof define.amd == 'object' &&
		define.amd
	) {
		define('punycode', function() {
			return punycode;
		});
	} else if (freeExports && freeModule) {
		if (module.exports == freeExports) {
			// in Node.js, io.js, or RingoJS v0.8.0+
			freeModule.exports = punycode;
		} else {
			// in Narwhal or RingoJS v0.7.0-
			for (key in punycode) {
				punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
			}
		}
	} else {
		// in Rhino or a web browser
		root.punycode = punycode;
	}

}(this));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],6:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

// If obj.hasOwnProperty has been overridden, then calling
// obj.hasOwnProperty(prop) will break.
// See: https://github.com/joyent/node/issues/1707
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

module.exports = function(qs, sep, eq, options) {
  sep = sep || '&';
  eq = eq || '=';
  var obj = {};

  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }

  var regexp = /\+/g;
  qs = qs.split(sep);

  var maxKeys = 1000;
  if (options && typeof options.maxKeys === 'number') {
    maxKeys = options.maxKeys;
  }

  var len = qs.length;
  // maxKeys <= 0 means that we should not limit keys count
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (var i = 0; i < len; ++i) {
    var x = qs[i].replace(regexp, '%20'),
        idx = x.indexOf(eq),
        kstr, vstr, k, v;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = '';
    }

    k = decodeURIComponent(kstr);
    v = decodeURIComponent(vstr);

    if (!hasOwnProperty(obj, k)) {
      obj[k] = v;
    } else if (isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }

  return obj;
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

},{}],7:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var stringifyPrimitive = function(v) {
  switch (typeof v) {
    case 'string':
      return v;

    case 'boolean':
      return v ? 'true' : 'false';

    case 'number':
      return isFinite(v) ? v : '';

    default:
      return '';
  }
};

module.exports = function(obj, sep, eq, name) {
  sep = sep || '&';
  eq = eq || '=';
  if (obj === null) {
    obj = undefined;
  }

  if (typeof obj === 'object') {
    return map(objectKeys(obj), function(k) {
      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
      if (isArray(obj[k])) {
        return map(obj[k], function(v) {
          return ks + encodeURIComponent(stringifyPrimitive(v));
        }).join(sep);
      } else {
        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
      }
    }).join(sep);

  }

  if (!name) return '';
  return encodeURIComponent(stringifyPrimitive(name)) + eq +
         encodeURIComponent(stringifyPrimitive(obj));
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

function map (xs, f) {
  if (xs.map) return xs.map(f);
  var res = [];
  for (var i = 0; i < xs.length; i++) {
    res.push(f(xs[i], i));
  }
  return res;
}

var objectKeys = Object.keys || function (obj) {
  var res = [];
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
  }
  return res;
};

},{}],8:[function(require,module,exports){
'use strict';

exports.decode = exports.parse = require('./decode');
exports.encode = exports.stringify = require('./encode');

},{"./decode":6,"./encode":7}],9:[function(require,module,exports){
"use strict";

module.exports =
{
	// Output
	ABSOLUTE:      "absolute",
	PATH_RELATIVE: "pathRelative",
	ROOT_RELATIVE: "rootRelative",
	SHORTEST:      "shortest"
};

},{}],10:[function(require,module,exports){
"use strict";

var constants = require("./constants");



function formatAuth(urlObj, options)
{
	if (urlObj.auth && !options.removeAuth && (urlObj.extra.relation.maximumHost || options.output===constants.ABSOLUTE))
	{
		return urlObj.auth + "@";
	}
	
	return "";
}



function formatHash(urlObj, options)
{
	return urlObj.hash ? urlObj.hash : "";
}



function formatHost(urlObj, options)
{
	if (urlObj.host.full && (urlObj.extra.relation.maximumAuth || options.output===constants.ABSOLUTE))
	{
		return urlObj.host.full;
	}
	
	return "";
}



function formatPath(urlObj, options)
{
	var str = "";
	
	var absolutePath = urlObj.path.absolute.string;
	var relativePath = urlObj.path.relative.string;
	var resource = showResource(urlObj, options);
	
	if (urlObj.extra.relation.maximumHost || options.output===constants.ABSOLUTE || options.output===constants.ROOT_RELATIVE)
	{
		str = absolutePath;
	}
	else if (relativePath.length<=absolutePath.length && options.output===constants.SHORTEST || options.output===constants.PATH_RELATIVE)
	{
		str = relativePath;
		
		if (str === "")
		{
			var query = showQuery(urlObj,options) && !!getQuery(urlObj,options);
			
			if (urlObj.extra.relation.maximumPath && !resource)
			{
				str = "./";
			}
			else if (urlObj.extra.relation.overridesQuery && !resource && !query)
			{
				str = "./";
			}
		}
	}
	else
	{
		str = absolutePath;
	}
	
	if ( str==="/" && !resource && options.removeRootTrailingSlash && (!urlObj.extra.relation.minimumPort || options.output===constants.ABSOLUTE) )
	{
		str = "";
	}
	
	return str;
}



function formatPort(urlObj, options)
{
	if (urlObj.port && !urlObj.extra.portIsDefault && urlObj.extra.relation.maximumHost)
	{
		return ":" + urlObj.port;
	}
	
	return "";
}



function formatQuery(urlObj, options)
{
	return showQuery(urlObj,options) ? getQuery(urlObj, options) : "";
}



function formatResource(urlObj, options)
{
	return showResource(urlObj,options) ? urlObj.resource : "";
}



function formatScheme(urlObj, options)
{
	var str = "";
	
	if (urlObj.extra.relation.maximumHost || options.output===constants.ABSOLUTE)
	{
		if (!urlObj.extra.relation.minimumScheme || !options.schemeRelative || options.output===constants.ABSOLUTE)
		{
			str += urlObj.scheme + "://";
		}
		else
		{
			str += "//";
		}
	}
	
	return str;
}



function formatUrl(urlObj, options)
{
	var url = "";
	
	url += formatScheme(urlObj, options);
	url += formatAuth(urlObj, options);
	url += formatHost(urlObj, options);
	url += formatPort(urlObj, options);
	url += formatPath(urlObj, options);
	url += formatResource(urlObj, options);
	url += formatQuery(urlObj, options);
	url += formatHash(urlObj, options);
	
	return url;
}



function getQuery(urlObj, options)
{
	var stripQuery = options.removeEmptyQueries && urlObj.extra.relation.minimumPort;
	
	return urlObj.query.string[ stripQuery ? "stripped" : "full" ];
}



function showQuery(urlObj, options)
{
	return !urlObj.extra.relation.minimumQuery || options.output===constants.ABSOLUTE || options.output===constants.ROOT_RELATIVE;
}



function showResource(urlObj, options)
{
	var removeIndex = options.removeDirectoryIndexes && urlObj.extra.resourceIsIndex;
	var removeMatchingResource = urlObj.extra.relation.minimumResource && options.output!==constants.ABSOLUTE && options.output!==constants.ROOT_RELATIVE;
	
	return !!urlObj.resource && !removeMatchingResource && !removeIndex;
}



module.exports = formatUrl;

},{"./constants":9}],11:[function(require,module,exports){
"use strict";

var constants  = require("./constants");
var formatUrl  = require("./format");
var getOptions = require("./options");
var objUtils   = require("./util/object");
var parseUrl   = require("./parse");
var relateUrl  = require("./relate");



function RelateUrl(from, options)
{
	this.options = getOptions(options,
	{
		defaultPorts: {ftp:21, http:80, https:443},
		directoryIndexes: ["index.html"],
		ignore_www: false,
		output: RelateUrl.SHORTEST,
		rejectedSchemes: ["data","javascript","mailto"],
		removeAuth: false,
		removeDirectoryIndexes: true,
		removeEmptyQueries: false,
		removeRootTrailingSlash: true,
		schemeRelative: true,
		site: undefined,
		slashesDenoteHost: true
	});
	
	this.from = parseUrl.from(from, this.options, null);
}



/*
	Usage: instance=new RelateUrl(); instance.relate();
*/
RelateUrl.prototype.relate = function(from, to, options)
{
	// relate(to,options)
	if ( objUtils.isPlainObject(to) )
	{
		options = to;
		to = from;
		from = null;
	}
	// relate(to)
	else if (!to)
	{
		to = from;
		from = null;
	}
	
	options = getOptions(options, this.options);
	from = from || options.site;
	from = parseUrl.from(from, options, this.from);
	
	if (!from || !from.href)
	{
		throw new Error("from value not defined.");
	}
	else if (from.extra.hrefInfo.minimumPathOnly)
	{
		throw new Error("from value supplied is not absolute: "+from.href);
	}
	
	to = parseUrl.to(to, options);
	
	if (to.valid===false) return to.href;
	
	to = relateUrl(from, to, options);
	to = formatUrl(to, options);
	
	return to;
}



/*
	Usage: RelateUrl.relate();
*/
RelateUrl.relate = function(from, to, options)
{
	return new RelateUrl().relate(from, to, options);
}



// Make constants accessible from API
objUtils.shallowMerge(RelateUrl, constants);



module.exports = RelateUrl;

},{"./constants":9,"./format":10,"./options":12,"./parse":15,"./relate":22,"./util/object":24}],12:[function(require,module,exports){
"use strict";

var objUtils = require("./util/object");



function getOptions(options, defaults)
{
	if ( objUtils.isPlainObject(options) )
	{
		var newOptions = {};
		
		for (var i in defaults)
		{
			if ( defaults.hasOwnProperty(i) )
			{
				if (options[i] !== undefined)
				{
					newOptions[i] = mergeOption(options[i], defaults[i]);
				}
				else
				{
					newOptions[i] = defaults[i];
				}
			}
		}
		
		return newOptions;
	}
	else
	{
		return defaults;
	}
}



function mergeOption(newValues, defaultValues)
{
	if (defaultValues instanceof Object && newValues instanceof Object)
	{
		if (defaultValues instanceof Array && newValues instanceof Array)
		{
			return defaultValues.concat(newValues);
		}
		else
		{
			return objUtils.shallowMerge(newValues, defaultValues);
		}
	}
	
	return newValues;
}



module.exports = getOptions;

},{"./util/object":24}],13:[function(require,module,exports){
"use strict";

function parseHost(urlObj, options)
{
	// TWEAK :: condition only for speed optimization
	if (options.ignore_www)
	{
		var host = urlObj.host.full;
		
		if (host)
		{
			var stripped = host;
			
			if (host.indexOf("www.") === 0)
			{
				stripped = host.substr(4);
			}
			
			urlObj.host.stripped = stripped;
		}
	}
}



module.exports = parseHost;

},{}],14:[function(require,module,exports){
"use strict";

function hrefInfo(urlObj)
{
	var minimumPathOnly     = (!urlObj.scheme && !urlObj.auth && !urlObj.host.full && !urlObj.port);
	var minimumResourceOnly = (minimumPathOnly && !urlObj.path.absolute.string);
	var minimumQueryOnly    = (minimumResourceOnly && !urlObj.resource);
	var minimumHashOnly     = (minimumQueryOnly && !urlObj.query.string.full.length);
	var empty               = (minimumHashOnly && !urlObj.hash);
	
	urlObj.extra.hrefInfo.minimumPathOnly     = minimumPathOnly;
	urlObj.extra.hrefInfo.minimumResourceOnly = minimumResourceOnly;
	urlObj.extra.hrefInfo.minimumQueryOnly    = minimumQueryOnly;
	urlObj.extra.hrefInfo.minimumHashOnly     = minimumHashOnly;
	urlObj.extra.hrefInfo.empty = empty;
}



module.exports = hrefInfo;

},{}],15:[function(require,module,exports){
"use strict";

var hrefInfo   = require("./hrefInfo");
var parseHost  = require("./host");
var parsePath  = require("./path");
var parsePort  = require("./port");
var parseQuery = require("./query");
var parseUrlString = require("./urlstring");
var pathUtils      = require("../util/path");



function parseFromUrl(url, options, fallback)
{
	if (url)
	{
		var urlObj = parseUrl(url, options);
		
		// Because the following occurs in the relate stage for "to" URLs,
		// such had to be mostly duplicated here
		
		var pathArray = pathUtils.resolveDotSegments(urlObj.path.absolute.array);
		
		urlObj.path.absolute.array  = pathArray;
		urlObj.path.absolute.string = "/" + pathUtils.join(pathArray);
		
		return urlObj;
	}
	else
	{
		return fallback;
	}
}



function parseUrl(url, options)
{
	var urlObj = parseUrlString(url, options);
	
	if (urlObj.valid===false) return urlObj;
	
	parseHost(urlObj, options);
	parsePort(urlObj, options);
	parsePath(urlObj, options);
	parseQuery(urlObj, options);
	hrefInfo(urlObj);
	
	return urlObj;
}



module.exports =
{
	from: parseFromUrl,
	to:   parseUrl
};

},{"../util/path":25,"./host":13,"./hrefInfo":14,"./path":16,"./port":17,"./query":18,"./urlstring":19}],16:[function(require,module,exports){
"use strict";

function isDirectoryIndex(resource, options)
{
	var verdict = false;
	
	options.directoryIndexes.every( function(index)
	{
		if (index === resource)
		{
			verdict = true;
			return false;
		}
		
		return true;
	});
	
	return verdict;
}



function parsePath(urlObj, options)
{
	var path = urlObj.path.absolute.string;
	
	if (path)
	{
		var lastSlash = path.lastIndexOf("/");
		
		if (lastSlash > -1)
		{
			if (++lastSlash < path.length)
			{
				var resource = path.substr(lastSlash);
				
				if (resource!=="." && resource!=="..")
				{
					urlObj.resource = resource;
					path = path.substr(0, lastSlash);
				}
				else
				{
					path += "/";
				}
			}
			
			urlObj.path.absolute.string = path;
			urlObj.path.absolute.array = splitPath(path);
		}
		else if (path==="." || path==="..")
		{
			// "..?var", "..#anchor", etc ... not "..index.html"
			path += "/";
			
			urlObj.path.absolute.string = path;
			urlObj.path.absolute.array = splitPath(path);
		}
		else
		{
			// Resource-only
			urlObj.resource = path;
			urlObj.path.absolute.string = null;
		}
		
		urlObj.extra.resourceIsIndex = isDirectoryIndex(urlObj.resource, options);
	}
	// Else: query/hash-only or empty
}



function splitPath(path)
{
	// TWEAK :: condition only for speed optimization
	if (path !== "/")
	{
		var cleaned = [];
		
		path.split("/").forEach( function(dir)
		{
			// Cleanup -- splitting "/dir/" becomes ["","dir",""]
			if (dir !== "")
			{
				cleaned.push(dir);
			}
		});
		
		return cleaned;
	}
	else
	{
		// Faster to skip the above block and just create an array
		return [];
	}
}



module.exports = parsePath;

},{}],17:[function(require,module,exports){
"use strict";

function parsePort(urlObj, options)
{
	var defaultPort = -1;
	
	for (var i in options.defaultPorts)
	{
		if ( i===urlObj.scheme && options.defaultPorts.hasOwnProperty(i) )
		{
			defaultPort = options.defaultPorts[i];
			break;
		}
	}
	
	if (defaultPort > -1)
	{
		// Force same type as urlObj.port
		defaultPort = defaultPort.toString();
		
		if (urlObj.port === null)
		{
			urlObj.port = defaultPort;
		}
		
		urlObj.extra.portIsDefault = (urlObj.port === defaultPort);
	}
}



module.exports = parsePort;

},{}],18:[function(require,module,exports){
"use strict";
var hasOwnProperty = Object.prototype.hasOwnProperty;



function parseQuery(urlObj, options)
{
	urlObj.query.string.full = stringify(urlObj.query.object, false);
	
	// TWEAK :: condition only for speed optimization
	if (options.removeEmptyQueries)
	{
		urlObj.query.string.stripped = stringify(urlObj.query.object, true);
	}
}



function stringify(queryObj, removeEmptyQueries)
{
	var count = 0;
	var str = "";
	
	for (var i in queryObj)
	{
		if ( i!=="" && hasOwnProperty.call(queryObj, i)===true )
		{
			var value = queryObj[i];
			
			if (value !== "" || !removeEmptyQueries)
			{
				str += (++count===1) ? "?" : "&";
				
				i = encodeURIComponent(i);
				
				if (value !== "")
				{
					str += i +"="+ encodeURIComponent(value).replace(/%20/g,"+");
				}
				else
				{
					str += i;
				}
			}
		}
	}
	
	return str;
}



module.exports = parseQuery;

},{}],19:[function(require,module,exports){
"use strict";

var _parseUrl = require("url").parse;



/*
	Customize the URL object that Node generates
	because:
	
	* necessary data for later
	* urlObj.host is useless
	* urlObj.hostname is too long
	* urlObj.path is useless
	* urlObj.pathname is too long
	* urlObj.protocol is inaccurate; should be called "scheme"
	* urlObj.search is mostly useless
*/
function clean(urlObj)
{
	var scheme = urlObj.protocol;
	
	if (scheme)
	{
		// Remove ":" suffix
		if (scheme.indexOf(":") === scheme.length-1)
		{
			scheme = scheme.substr(0, scheme.length-1);
		}
	}
	
	urlObj.host =
	{
		// TODO :: unescape(encodeURIComponent(s)) ? ... http://ecmanaut.blogspot.ca/2006/07/encoding-decoding-utf8-in-javascript.html
		full: urlObj.hostname,
		stripped: null
	};
	
	urlObj.path =
	{
		absolute:
		{
			array: null,
			string: urlObj.pathname
		},
		relative:
		{
			array: null,
			string: null
		}
	};
	
	urlObj.query =
	{
		object: urlObj.query,
		string:
		{
			full: null,
			stripped: null
		}
	};
	
	urlObj.extra =
	{
		hrefInfo:
		{
			minimumPathOnly: null,
			minimumResourceOnly: null,
			minimumQueryOnly: null,
			minimumHashOnly: null,
			empty: null,
			
			separatorOnlyQuery: urlObj.search==="?"
		},
		portIsDefault: null,
		relation:
		{
			maximumScheme: null,
			maximumAuth: null,
			maximumHost: null,
			maximumPort: null,
			maximumPath: null,
			maximumResource: null,
			maximumQuery: null,
			maximumHash: null,
			
			minimumScheme: null,
			minimumAuth: null,
			minimumHost: null,
			minimumPort: null,
			minimumPath: null,
			minimumResource: null,
			minimumQuery: null,
			minimumHash: null,
			
			overridesQuery: null
		},
		resourceIsIndex: null,
		slashes: urlObj.slashes
	};
	
	urlObj.resource = null;
	urlObj.scheme = scheme;
	delete urlObj.hostname;
	delete urlObj.pathname;
	delete urlObj.protocol;
	delete urlObj.search;
	delete urlObj.slashes;
	
	return urlObj;
}



function validScheme(url, options)
{
	var valid = true;
	
	options.rejectedSchemes.every( function(rejectedScheme)
	{
		valid = !(url.indexOf(rejectedScheme+":") === 0);
		
		// Break loop
		return valid;
	});
	
	return valid;
}



function parseUrlString(url, options)
{
	if ( validScheme(url,options) )
	{
		return clean( _parseUrl(url, true, options.slashesDenoteHost) );
	}
	else
	{
		return {href:url, valid:false};
	}
}



module.exports = parseUrlString;

},{"url":26}],20:[function(require,module,exports){
"use strict";

var findRelation = require("./findRelation");
var objUtils     = require("../util/object");
var pathUtils    = require("../util/path");



function absolutize(urlObj, siteUrlObj, options)
{
	findRelation.upToPath(urlObj, siteUrlObj, options);
	
	// Fill in relative URLs
	if (urlObj.extra.relation.minimumScheme) urlObj.scheme = siteUrlObj.scheme;
	if (urlObj.extra.relation.minimumAuth)   urlObj.auth   = siteUrlObj.auth;
	if (urlObj.extra.relation.minimumHost)   urlObj.host   = objUtils.clone(siteUrlObj.host);
	if (urlObj.extra.relation.minimumPort)   copyPort(urlObj, siteUrlObj);
	if (urlObj.extra.relation.minimumScheme) copyPath(urlObj, siteUrlObj);
	
	// Check remaining relativeness now that path has been copied and/or resolved
	findRelation.pathOn(urlObj, siteUrlObj, options);
	
	// Fill in relative URLs
	if (urlObj.extra.relation.minimumResource) copyResource(urlObj, siteUrlObj);
	if (urlObj.extra.relation.minimumQuery)    urlObj.query = objUtils.clone(siteUrlObj.query);
	if (urlObj.extra.relation.minimumHash)     urlObj.hash  = siteUrlObj.hash;
}



/*
	Get an absolute path that's relative to site url.
*/
function copyPath(urlObj, siteUrlObj)
{
	if (urlObj.extra.relation.maximumHost || !urlObj.extra.hrefInfo.minimumResourceOnly)
	{
		var pathArray = urlObj.path.absolute.array;
		var pathString = "/";
		
		// If not erroneous URL
		if (pathArray)
		{
			// If is relative path
			if (urlObj.extra.hrefInfo.minimumPathOnly && urlObj.path.absolute.string.indexOf("/")!==0)
			{
				// Append path to site path
				pathArray = siteUrlObj.path.absolute.array.concat(pathArray);
			}
			
			pathArray   = pathUtils.resolveDotSegments(pathArray);
			pathString += pathUtils.join(pathArray);
		}
		else
		{
			pathArray = [];
		}
		
		urlObj.path.absolute.array  = pathArray;
		urlObj.path.absolute.string = pathString;
	}
	else
	{
		// Resource-, query- or hash-only or empty
		urlObj.path = objUtils.clone(siteUrlObj.path);
	}
}



function copyPort(urlObj, siteUrlObj)
{
	urlObj.port = siteUrlObj.port;
	
	urlObj.extra.portIsDefault = siteUrlObj.extra.portIsDefault;
}



function copyResource(urlObj, siteUrlObj)
{
	urlObj.resource = siteUrlObj.resource;
	
	urlObj.extra.resourceIsIndex = siteUrlObj.extra.resourceIsIndex;
}



module.exports = absolutize;

},{"../util/object":24,"../util/path":25,"./findRelation":21}],21:[function(require,module,exports){
"use strict";

function findRelation_upToPath(urlObj, siteUrlObj, options)
{
	// Path- or root-relative URL
	var pathOnly = urlObj.extra.hrefInfo.minimumPathOnly;
	
	// Matching scheme, scheme-relative or path-only
	var minimumScheme = (urlObj.scheme===siteUrlObj.scheme || !urlObj.scheme);
	
	// Matching auth, ignoring auth or path-only
	var minimumAuth = minimumScheme && (urlObj.auth===siteUrlObj.auth || options.removeAuth || pathOnly);
	
	// Matching host or path-only
	var www = options.ignore_www ? "stripped" : "full";
	var minimumHost = minimumAuth && (urlObj.host[www]===siteUrlObj.host[www] || pathOnly);
	
	// Matching port or path-only
	var minimumPort = minimumHost && (urlObj.port===siteUrlObj.port || pathOnly);
	
	urlObj.extra.relation.minimumScheme = minimumScheme;
	urlObj.extra.relation.minimumAuth   = minimumAuth;
	urlObj.extra.relation.minimumHost   = minimumHost;
	urlObj.extra.relation.minimumPort   = minimumPort;
	
	urlObj.extra.relation.maximumScheme = !minimumScheme || minimumScheme && !minimumAuth;
	urlObj.extra.relation.maximumAuth   = !minimumScheme || minimumScheme && !minimumHost;
	urlObj.extra.relation.maximumHost   = !minimumScheme || minimumScheme && !minimumPort;
}



function findRelation_pathOn(urlObj, siteUrlObj, options)
{
	var queryOnly = urlObj.extra.hrefInfo.minimumQueryOnly;
	var hashOnly  = urlObj.extra.hrefInfo.minimumHashOnly;
	var empty     = urlObj.extra.hrefInfo.empty;	// not required, but self-documenting
	
	// From upToPath()
	var minimumPort   = urlObj.extra.relation.minimumPort;
	var minimumScheme = urlObj.extra.relation.minimumScheme;
	
	// Matching port and path
	var minimumPath = minimumPort && urlObj.path.absolute.string===siteUrlObj.path.absolute.string;
	
	// Matching resource or query/hash-only or empty
	var matchingResource = (urlObj.resource===siteUrlObj.resource || !urlObj.resource && siteUrlObj.extra.resourceIsIndex) || (options.removeDirectoryIndexes && urlObj.extra.resourceIsIndex && !siteUrlObj.resource);
	var minimumResource = minimumPath && (matchingResource || queryOnly || hashOnly || empty);
	
	// Matching query or hash-only/empty
	var query = options.removeEmptyQueries ? "stripped" : "full";
	var urlQuery = urlObj.query.string[query];
	var siteUrlQuery = siteUrlObj.query.string[query];
	var minimumQuery = (minimumResource && !!urlQuery && urlQuery===siteUrlQuery) || ((hashOnly || empty) && !urlObj.extra.hrefInfo.separatorOnlyQuery);
	
	var minimumHash = minimumQuery && urlObj.hash===siteUrlObj.hash;
	
	urlObj.extra.relation.minimumPath     = minimumPath;
	urlObj.extra.relation.minimumResource = minimumResource;
	urlObj.extra.relation.minimumQuery    = minimumQuery;
	urlObj.extra.relation.minimumHash     = minimumHash;
	
	urlObj.extra.relation.maximumPort     = !minimumScheme || minimumScheme && !minimumPath;
	urlObj.extra.relation.maximumPath     = !minimumScheme || minimumScheme && !minimumResource;
	urlObj.extra.relation.maximumResource = !minimumScheme || minimumScheme && !minimumQuery;
	urlObj.extra.relation.maximumQuery    = !minimumScheme || minimumScheme && !minimumHash;
	urlObj.extra.relation.maximumHash     = !minimumScheme || minimumScheme && !minimumHash;	// there's nothing after hash, so it's the same as maximumQuery
	
	// Matching path and/or resource with existing but non-matching site query
	urlObj.extra.relation.overridesQuery  = minimumPath && urlObj.extra.relation.maximumResource && !minimumQuery && !!siteUrlQuery;
}



module.exports =
{
	pathOn:   findRelation_pathOn,
	upToPath: findRelation_upToPath
};

},{}],22:[function(require,module,exports){
"use strict";

var absolutize = require("./absolutize");
var relativize = require("./relativize");



function relateUrl(siteUrlObj, urlObj, options)
{
	absolutize(urlObj, siteUrlObj, options);
	relativize(urlObj, siteUrlObj, options);
	
	return urlObj;
}



module.exports = relateUrl;

},{"./absolutize":20,"./relativize":23}],23:[function(require,module,exports){
"use strict";

var pathUtils = require("../util/path");



/*
	Get a path relative to the site path.
*/
function relatePath(absolutePath, siteAbsolutePath)
{
	var relativePath = [];
	
	// At this point, it's related to the host/port
	var related = true;
	var parentIndex = -1;
	
	// Find parents
	siteAbsolutePath.forEach( function(siteAbsoluteDir, i)
	{
		if (related)
		{
			if (absolutePath[i] !== siteAbsoluteDir)
			{
				related = false;
			}
			else
			{
				parentIndex = i;
			}
		}
		
		if (!related)
		{
			// Up one level
			relativePath.push("..");
		}
	});
	
	// Form path
	absolutePath.forEach( function(dir, i)
	{
		if (i > parentIndex)
		{
			relativePath.push(dir);
		}
	});
	
	return relativePath;
}



function relativize(urlObj, siteUrlObj, options)
{
	if (urlObj.extra.relation.minimumScheme)
	{
		var pathArray = relatePath(urlObj.path.absolute.array, siteUrlObj.path.absolute.array);
		
		urlObj.path.relative.array  = pathArray;
		urlObj.path.relative.string = pathUtils.join(pathArray);
	}
}



module.exports = relativize;

},{"../util/path":25}],24:[function(require,module,exports){
"use strict";

/*
	Deep-clone an object.
*/
function clone(obj)
{
	if (obj instanceof Object)
	{
		var clonedObj = (obj instanceof Array) ? [] : {};
		
		for (var i in obj)
		{
			if ( obj.hasOwnProperty(i) )
			{
				clonedObj[i] = clone( obj[i] );
			}
		}
		
		return clonedObj;
	}
	
	return obj;
}



/*
	https://github.com/jonschlinkert/is-plain-object
*/
function isPlainObject(obj)
{
	return !!obj && typeof obj==="object" && obj.constructor===Object;
}



/*
	Shallow-merge two objects.
*/
function shallowMerge(target, source)
{
	if (target instanceof Object && source instanceof Object)
	{
		for (var i in source)
		{
			if ( source.hasOwnProperty(i) )
			{
				target[i] = source[i];
			}
		}
	}
	
	return target;
}



module.exports =
{
	clone: clone,
	isPlainObject: isPlainObject,
	shallowMerge: shallowMerge
};

},{}],25:[function(require,module,exports){
"use strict";

function joinPath(pathArray)
{
	if (pathArray.length > 0)
	{
		return pathArray.join("/") + "/";
	}
	else
	{
		return "";
	}
}



function resolveDotSegments(pathArray)
{
	var pathAbsolute = [];
	
	pathArray.forEach( function(dir)
	{
		if (dir !== "..")
		{
			if (dir !== ".")
			{
				pathAbsolute.push(dir);
			}
		}
		else
		{
			// Remove parent
			if (pathAbsolute.length > 0)
			{
				pathAbsolute.splice(pathAbsolute.length-1, 1);
			}
		}
	});
	
	return pathAbsolute;
}



module.exports =
{
	join: joinPath,
	resolveDotSegments: resolveDotSegments
};

},{}],26:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var punycode = require('punycode');
var util = require('./util');

exports.parse = urlParse;
exports.resolve = urlResolve;
exports.resolveObject = urlResolveObject;
exports.format = urlFormat;

exports.Url = Url;

function Url() {
  this.protocol = null;
  this.slashes = null;
  this.auth = null;
  this.host = null;
  this.port = null;
  this.hostname = null;
  this.hash = null;
  this.search = null;
  this.query = null;
  this.pathname = null;
  this.path = null;
  this.href = null;
}

// Reference: RFC 3986, RFC 1808, RFC 2396

// define these here so at least they only have to be
// compiled once on the first module load.
var protocolPattern = /^([a-z0-9.+-]+:)/i,
    portPattern = /:[0-9]*$/,

    // Special case for a simple path URL
    simplePathPattern = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,

    // RFC 2396: characters reserved for delimiting URLs.
    // We actually just auto-escape these.
    delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],

    // RFC 2396: characters not allowed for various reasons.
    unwise = ['{', '}', '|', '\\', '^', '`'].concat(delims),

    // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
    autoEscape = ['\''].concat(unwise),
    // Characters that are never ever allowed in a hostname.
    // Note that any invalid chars are also handled, but these
    // are the ones that are *expected* to be seen, so we fast-path
    // them.
    nonHostChars = ['%', '/', '?', ';', '#'].concat(autoEscape),
    hostEndingChars = ['/', '?', '#'],
    hostnameMaxLen = 255,
    hostnamePartPattern = /^[+a-z0-9A-Z_-]{0,63}$/,
    hostnamePartStart = /^([+a-z0-9A-Z_-]{0,63})(.*)$/,
    // protocols that can allow "unsafe" and "unwise" chars.
    unsafeProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that never have a hostname.
    hostlessProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that always contain a // bit.
    slashedProtocol = {
      'http': true,
      'https': true,
      'ftp': true,
      'gopher': true,
      'file': true,
      'http:': true,
      'https:': true,
      'ftp:': true,
      'gopher:': true,
      'file:': true
    },
    querystring = require('querystring');

function urlParse(url, parseQueryString, slashesDenoteHost) {
  if (url && util.isObject(url) && url instanceof Url) return url;

  var u = new Url;
  u.parse(url, parseQueryString, slashesDenoteHost);
  return u;
}

Url.prototype.parse = function(url, parseQueryString, slashesDenoteHost) {
  if (!util.isString(url)) {
    throw new TypeError("Parameter 'url' must be a string, not " + typeof url);
  }

  // Copy chrome, IE, opera backslash-handling behavior.
  // Back slashes before the query string get converted to forward slashes
  // See: https://code.google.com/p/chromium/issues/detail?id=25916
  var queryIndex = url.indexOf('?'),
      splitter =
          (queryIndex !== -1 && queryIndex < url.indexOf('#')) ? '?' : '#',
      uSplit = url.split(splitter),
      slashRegex = /\\/g;
  uSplit[0] = uSplit[0].replace(slashRegex, '/');
  url = uSplit.join(splitter);

  var rest = url;

  // trim before proceeding.
  // This is to support parse stuff like "  http://foo.com  \n"
  rest = rest.trim();

  if (!slashesDenoteHost && url.split('#').length === 1) {
    // Try fast path regexp
    var simplePath = simplePathPattern.exec(rest);
    if (simplePath) {
      this.path = rest;
      this.href = rest;
      this.pathname = simplePath[1];
      if (simplePath[2]) {
        this.search = simplePath[2];
        if (parseQueryString) {
          this.query = querystring.parse(this.search.substr(1));
        } else {
          this.query = this.search.substr(1);
        }
      } else if (parseQueryString) {
        this.search = '';
        this.query = {};
      }
      return this;
    }
  }

  var proto = protocolPattern.exec(rest);
  if (proto) {
    proto = proto[0];
    var lowerProto = proto.toLowerCase();
    this.protocol = lowerProto;
    rest = rest.substr(proto.length);
  }

  // figure out if it's got a host
  // user@server is *always* interpreted as a hostname, and url
  // resolution will treat //foo/bar as host=foo,path=bar because that's
  // how the browser resolves relative URLs.
  if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
    var slashes = rest.substr(0, 2) === '//';
    if (slashes && !(proto && hostlessProtocol[proto])) {
      rest = rest.substr(2);
      this.slashes = true;
    }
  }

  if (!hostlessProtocol[proto] &&
      (slashes || (proto && !slashedProtocol[proto]))) {

    // there's a hostname.
    // the first instance of /, ?, ;, or # ends the host.
    //
    // If there is an @ in the hostname, then non-host chars *are* allowed
    // to the left of the last @ sign, unless some host-ending character
    // comes *before* the @-sign.
    // URLs are obnoxious.
    //
    // ex:
    // http://a@b@c/ => user:a@b host:c
    // http://a@b?@c => user:a host:c path:/?@c

    // v0.12 TODO(isaacs): This is not quite how Chrome does things.
    // Review our test case against browsers more comprehensively.

    // find the first instance of any hostEndingChars
    var hostEnd = -1;
    for (var i = 0; i < hostEndingChars.length; i++) {
      var hec = rest.indexOf(hostEndingChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }

    // at this point, either we have an explicit point where the
    // auth portion cannot go past, or the last @ char is the decider.
    var auth, atSign;
    if (hostEnd === -1) {
      // atSign can be anywhere.
      atSign = rest.lastIndexOf('@');
    } else {
      // atSign must be in auth portion.
      // http://a@b/c@d => host:b auth:a path:/c@d
      atSign = rest.lastIndexOf('@', hostEnd);
    }

    // Now we have a portion which is definitely the auth.
    // Pull that off.
    if (atSign !== -1) {
      auth = rest.slice(0, atSign);
      rest = rest.slice(atSign + 1);
      this.auth = decodeURIComponent(auth);
    }

    // the host is the remaining to the left of the first non-host char
    hostEnd = -1;
    for (var i = 0; i < nonHostChars.length; i++) {
      var hec = rest.indexOf(nonHostChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }
    // if we still have not hit it, then the entire thing is a host.
    if (hostEnd === -1)
      hostEnd = rest.length;

    this.host = rest.slice(0, hostEnd);
    rest = rest.slice(hostEnd);

    // pull out port.
    this.parseHost();

    // we've indicated that there is a hostname,
    // so even if it's empty, it has to be present.
    this.hostname = this.hostname || '';

    // if hostname begins with [ and ends with ]
    // assume that it's an IPv6 address.
    var ipv6Hostname = this.hostname[0] === '[' &&
        this.hostname[this.hostname.length - 1] === ']';

    // validate a little.
    if (!ipv6Hostname) {
      var hostparts = this.hostname.split(/\./);
      for (var i = 0, l = hostparts.length; i < l; i++) {
        var part = hostparts[i];
        if (!part) continue;
        if (!part.match(hostnamePartPattern)) {
          var newpart = '';
          for (var j = 0, k = part.length; j < k; j++) {
            if (part.charCodeAt(j) > 127) {
              // we replace non-ASCII char with a temporary placeholder
              // we need this to make sure size of hostname is not
              // broken by replacing non-ASCII by nothing
              newpart += 'x';
            } else {
              newpart += part[j];
            }
          }
          // we test again with ASCII char only
          if (!newpart.match(hostnamePartPattern)) {
            var validParts = hostparts.slice(0, i);
            var notHost = hostparts.slice(i + 1);
            var bit = part.match(hostnamePartStart);
            if (bit) {
              validParts.push(bit[1]);
              notHost.unshift(bit[2]);
            }
            if (notHost.length) {
              rest = '/' + notHost.join('.') + rest;
            }
            this.hostname = validParts.join('.');
            break;
          }
        }
      }
    }

    if (this.hostname.length > hostnameMaxLen) {
      this.hostname = '';
    } else {
      // hostnames are always lower case.
      this.hostname = this.hostname.toLowerCase();
    }

    if (!ipv6Hostname) {
      // IDNA Support: Returns a punycoded representation of "domain".
      // It only converts parts of the domain name that
      // have non-ASCII characters, i.e. it doesn't matter if
      // you call it with a domain that already is ASCII-only.
      this.hostname = punycode.toASCII(this.hostname);
    }

    var p = this.port ? ':' + this.port : '';
    var h = this.hostname || '';
    this.host = h + p;
    this.href += this.host;

    // strip [ and ] from the hostname
    // the host field still retains them, though
    if (ipv6Hostname) {
      this.hostname = this.hostname.substr(1, this.hostname.length - 2);
      if (rest[0] !== '/') {
        rest = '/' + rest;
      }
    }
  }

  // now rest is set to the post-host stuff.
  // chop off any delim chars.
  if (!unsafeProtocol[lowerProto]) {

    // First, make 100% sure that any "autoEscape" chars get
    // escaped, even if encodeURIComponent doesn't think they
    // need to be.
    for (var i = 0, l = autoEscape.length; i < l; i++) {
      var ae = autoEscape[i];
      if (rest.indexOf(ae) === -1)
        continue;
      var esc = encodeURIComponent(ae);
      if (esc === ae) {
        esc = escape(ae);
      }
      rest = rest.split(ae).join(esc);
    }
  }


  // chop off from the tail first.
  var hash = rest.indexOf('#');
  if (hash !== -1) {
    // got a fragment string.
    this.hash = rest.substr(hash);
    rest = rest.slice(0, hash);
  }
  var qm = rest.indexOf('?');
  if (qm !== -1) {
    this.search = rest.substr(qm);
    this.query = rest.substr(qm + 1);
    if (parseQueryString) {
      this.query = querystring.parse(this.query);
    }
    rest = rest.slice(0, qm);
  } else if (parseQueryString) {
    // no query string, but parseQueryString still requested
    this.search = '';
    this.query = {};
  }
  if (rest) this.pathname = rest;
  if (slashedProtocol[lowerProto] &&
      this.hostname && !this.pathname) {
    this.pathname = '/';
  }

  //to support http.request
  if (this.pathname || this.search) {
    var p = this.pathname || '';
    var s = this.search || '';
    this.path = p + s;
  }

  // finally, reconstruct the href based on what has been validated.
  this.href = this.format();
  return this;
};

// format a parsed object into a url string
function urlFormat(obj) {
  // ensure it's an object, and not a string url.
  // If it's an obj, this is a no-op.
  // this way, you can call url_format() on strings
  // to clean up potentially wonky urls.
  if (util.isString(obj)) obj = urlParse(obj);
  if (!(obj instanceof Url)) return Url.prototype.format.call(obj);
  return obj.format();
}

Url.prototype.format = function() {
  var auth = this.auth || '';
  if (auth) {
    auth = encodeURIComponent(auth);
    auth = auth.replace(/%3A/i, ':');
    auth += '@';
  }

  var protocol = this.protocol || '',
      pathname = this.pathname || '',
      hash = this.hash || '',
      host = false,
      query = '';

  if (this.host) {
    host = auth + this.host;
  } else if (this.hostname) {
    host = auth + (this.hostname.indexOf(':') === -1 ?
        this.hostname :
        '[' + this.hostname + ']');
    if (this.port) {
      host += ':' + this.port;
    }
  }

  if (this.query &&
      util.isObject(this.query) &&
      Object.keys(this.query).length) {
    query = querystring.stringify(this.query);
  }

  var search = this.search || (query && ('?' + query)) || '';

  if (protocol && protocol.substr(-1) !== ':') protocol += ':';

  // only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
  // unless they had them to begin with.
  if (this.slashes ||
      (!protocol || slashedProtocol[protocol]) && host !== false) {
    host = '//' + (host || '');
    if (pathname && pathname.charAt(0) !== '/') pathname = '/' + pathname;
  } else if (!host) {
    host = '';
  }

  if (hash && hash.charAt(0) !== '#') hash = '#' + hash;
  if (search && search.charAt(0) !== '?') search = '?' + search;

  pathname = pathname.replace(/[?#]/g, function(match) {
    return encodeURIComponent(match);
  });
  search = search.replace('#', '%23');

  return protocol + host + pathname + search + hash;
};

function urlResolve(source, relative) {
  return urlParse(source, false, true).resolve(relative);
}

Url.prototype.resolve = function(relative) {
  return this.resolveObject(urlParse(relative, false, true)).format();
};

function urlResolveObject(source, relative) {
  if (!source) return relative;
  return urlParse(source, false, true).resolveObject(relative);
}

Url.prototype.resolveObject = function(relative) {
  if (util.isString(relative)) {
    var rel = new Url();
    rel.parse(relative, false, true);
    relative = rel;
  }

  var result = new Url();
  var tkeys = Object.keys(this);
  for (var tk = 0; tk < tkeys.length; tk++) {
    var tkey = tkeys[tk];
    result[tkey] = this[tkey];
  }

  // hash is always overridden, no matter what.
  // even href="" will remove it.
  result.hash = relative.hash;

  // if the relative url is empty, then there's nothing left to do here.
  if (relative.href === '') {
    result.href = result.format();
    return result;
  }

  // hrefs like //foo/bar always cut to the protocol.
  if (relative.slashes && !relative.protocol) {
    // take everything except the protocol from relative
    var rkeys = Object.keys(relative);
    for (var rk = 0; rk < rkeys.length; rk++) {
      var rkey = rkeys[rk];
      if (rkey !== 'protocol')
        result[rkey] = relative[rkey];
    }

    //urlParse appends trailing / to urls like http://www.example.com
    if (slashedProtocol[result.protocol] &&
        result.hostname && !result.pathname) {
      result.path = result.pathname = '/';
    }

    result.href = result.format();
    return result;
  }

  if (relative.protocol && relative.protocol !== result.protocol) {
    // if it's a known url protocol, then changing
    // the protocol does weird things
    // first, if it's not file:, then we MUST have a host,
    // and if there was a path
    // to begin with, then we MUST have a path.
    // if it is file:, then the host is dropped,
    // because that's known to be hostless.
    // anything else is assumed to be absolute.
    if (!slashedProtocol[relative.protocol]) {
      var keys = Object.keys(relative);
      for (var v = 0; v < keys.length; v++) {
        var k = keys[v];
        result[k] = relative[k];
      }
      result.href = result.format();
      return result;
    }

    result.protocol = relative.protocol;
    if (!relative.host && !hostlessProtocol[relative.protocol]) {
      var relPath = (relative.pathname || '').split('/');
      while (relPath.length && !(relative.host = relPath.shift()));
      if (!relative.host) relative.host = '';
      if (!relative.hostname) relative.hostname = '';
      if (relPath[0] !== '') relPath.unshift('');
      if (relPath.length < 2) relPath.unshift('');
      result.pathname = relPath.join('/');
    } else {
      result.pathname = relative.pathname;
    }
    result.search = relative.search;
    result.query = relative.query;
    result.host = relative.host || '';
    result.auth = relative.auth;
    result.hostname = relative.hostname || relative.host;
    result.port = relative.port;
    // to support http.request
    if (result.pathname || result.search) {
      var p = result.pathname || '';
      var s = result.search || '';
      result.path = p + s;
    }
    result.slashes = result.slashes || relative.slashes;
    result.href = result.format();
    return result;
  }

  var isSourceAbs = (result.pathname && result.pathname.charAt(0) === '/'),
      isRelAbs = (
          relative.host ||
          relative.pathname && relative.pathname.charAt(0) === '/'
      ),
      mustEndAbs = (isRelAbs || isSourceAbs ||
                    (result.host && relative.pathname)),
      removeAllDots = mustEndAbs,
      srcPath = result.pathname && result.pathname.split('/') || [],
      relPath = relative.pathname && relative.pathname.split('/') || [],
      psychotic = result.protocol && !slashedProtocol[result.protocol];

  // if the url is a non-slashed url, then relative
  // links like ../.. should be able
  // to crawl up to the hostname, as well.  This is strange.
  // result.protocol has already been set by now.
  // Later on, put the first path part into the host field.
  if (psychotic) {
    result.hostname = '';
    result.port = null;
    if (result.host) {
      if (srcPath[0] === '') srcPath[0] = result.host;
      else srcPath.unshift(result.host);
    }
    result.host = '';
    if (relative.protocol) {
      relative.hostname = null;
      relative.port = null;
      if (relative.host) {
        if (relPath[0] === '') relPath[0] = relative.host;
        else relPath.unshift(relative.host);
      }
      relative.host = null;
    }
    mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
  }

  if (isRelAbs) {
    // it's absolute.
    result.host = (relative.host || relative.host === '') ?
                  relative.host : result.host;
    result.hostname = (relative.hostname || relative.hostname === '') ?
                      relative.hostname : result.hostname;
    result.search = relative.search;
    result.query = relative.query;
    srcPath = relPath;
    // fall through to the dot-handling below.
  } else if (relPath.length) {
    // it's relative
    // throw away the existing file, and take the new path instead.
    if (!srcPath) srcPath = [];
    srcPath.pop();
    srcPath = srcPath.concat(relPath);
    result.search = relative.search;
    result.query = relative.query;
  } else if (!util.isNullOrUndefined(relative.search)) {
    // just pull out the search.
    // like href='?foo'.
    // Put this after the other two cases because it simplifies the booleans
    if (psychotic) {
      result.hostname = result.host = srcPath.shift();
      //occationaly the auth can get stuck only in host
      //this especially happens in cases like
      //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
      var authInHost = result.host && result.host.indexOf('@') > 0 ?
                       result.host.split('@') : false;
      if (authInHost) {
        result.auth = authInHost.shift();
        result.host = result.hostname = authInHost.shift();
      }
    }
    result.search = relative.search;
    result.query = relative.query;
    //to support http.request
    if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
      result.path = (result.pathname ? result.pathname : '') +
                    (result.search ? result.search : '');
    }
    result.href = result.format();
    return result;
  }

  if (!srcPath.length) {
    // no path at all.  easy.
    // we've already handled the other stuff above.
    result.pathname = null;
    //to support http.request
    if (result.search) {
      result.path = '/' + result.search;
    } else {
      result.path = null;
    }
    result.href = result.format();
    return result;
  }

  // if a url ENDs in . or .., then it must get a trailing slash.
  // however, if it ends in anything else non-slashy,
  // then it must NOT get a trailing slash.
  var last = srcPath.slice(-1)[0];
  var hasTrailingSlash = (
      (result.host || relative.host || srcPath.length > 1) &&
      (last === '.' || last === '..') || last === '');

  // strip single dots, resolve double dots to parent dir
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = srcPath.length; i >= 0; i--) {
    last = srcPath[i];
    if (last === '.') {
      srcPath.splice(i, 1);
    } else if (last === '..') {
      srcPath.splice(i, 1);
      up++;
    } else if (up) {
      srcPath.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (!mustEndAbs && !removeAllDots) {
    for (; up--; up) {
      srcPath.unshift('..');
    }
  }

  if (mustEndAbs && srcPath[0] !== '' &&
      (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
    srcPath.unshift('');
  }

  if (hasTrailingSlash && (srcPath.join('/').substr(-1) !== '/')) {
    srcPath.push('');
  }

  var isAbsolute = srcPath[0] === '' ||
      (srcPath[0] && srcPath[0].charAt(0) === '/');

  // put the host back
  if (psychotic) {
    result.hostname = result.host = isAbsolute ? '' :
                                    srcPath.length ? srcPath.shift() : '';
    //occationaly the auth can get stuck only in host
    //this especially happens in cases like
    //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
    var authInHost = result.host && result.host.indexOf('@') > 0 ?
                     result.host.split('@') : false;
    if (authInHost) {
      result.auth = authInHost.shift();
      result.host = result.hostname = authInHost.shift();
    }
  }

  mustEndAbs = mustEndAbs || (result.host && srcPath.length);

  if (mustEndAbs && !isAbsolute) {
    srcPath.unshift('');
  }

  if (!srcPath.length) {
    result.pathname = null;
    result.path = null;
  } else {
    result.pathname = srcPath.join('/');
  }

  //to support request.http
  if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
    result.path = (result.pathname ? result.pathname : '') +
                  (result.search ? result.search : '');
  }
  result.auth = relative.auth || result.auth;
  result.slashes = result.slashes || relative.slashes;
  result.href = result.format();
  return result;
};

Url.prototype.parseHost = function() {
  var host = this.host;
  var port = portPattern.exec(host);
  if (port) {
    port = port[0];
    if (port !== ':') {
      this.port = port.substr(1);
    }
    host = host.substr(0, host.length - port.length);
  }
  if (host) this.hostname = host;
};

},{"./util":27,"punycode":5,"querystring":8}],27:[function(require,module,exports){
'use strict';

module.exports = {
  isString: function(arg) {
    return typeof(arg) === 'string';
  },
  isObject: function(arg) {
    return typeof(arg) === 'object' && arg !== null;
  },
  isNull: function(arg) {
    return arg === null;
  },
  isNullOrUndefined: function(arg) {
    return arg == null;
  }
};

},{}],28:[function(require,module,exports){
/*!
 * HTML Parser By John Resig (ejohn.org)
 * Modified by Juriy "kangax" Zaytsev
 * Original code by Erik Arvidsson, Mozilla Public License
 * http://erik.eae.net/simplehtmlparser/simplehtmlparser.js
 */

/*
 * // Use like so:
 * HTMLParser(htmlString, {
 *     start: function(tag, attrs, unary) {},
 *     end: function(tag) {},
 *     chars: function(text) {},
 *     comment: function(text) {}
 * });
 *
 * // or to get an XML string:
 * HTMLtoXML(htmlString);
 *
 * // or to get an XML DOM Document
 * HTMLtoDOM(htmlString);
 *
 * // or to inject into an existing document/DOM node
 * HTMLtoDOM(htmlString, document);
 * HTMLtoDOM(htmlString, document.body);
 *
 */

/* global ActiveXObject, DOMDocument */

'use strict';

var createMapFromString = require('./utils').createMapFromString;

function makeMap(values) {
  return createMapFromString(values, true);
}

// Regular Expressions for parsing tags and attributes
var singleAttrIdentifier = /([^\s"'<>/=]+)/,
    singleAttrAssigns = [/=/],
    singleAttrValues = [
      // attr value double quotes
      /"([^"]*)"+/.source,
      // attr value, single quotes
      /'([^']*)'+/.source,
      // attr value, no quotes
      /([^ \t\n\f\r"'`=<>]+)/.source
    ],
    // https://www.w3.org/TR/1999/REC-xml-names-19990114/#NT-QName
    qnameCapture = (function() {
      // based on https://www.npmjs.com/package/ncname
      var combiningChar = '\\u0300-\\u0345\\u0360\\u0361\\u0483-\\u0486\\u0591-\\u05A1\\u05A3-\\u05B9\\u05BB-\\u05BD\\u05BF\\u05C1\\u05C2\\u05C4\\u064B-\\u0652\\u0670\\u06D6-\\u06E4\\u06E7\\u06E8\\u06EA-\\u06ED\\u0901-\\u0903\\u093C\\u093E-\\u094D\\u0951-\\u0954\\u0962\\u0963\\u0981-\\u0983\\u09BC\\u09BE-\\u09C4\\u09C7\\u09C8\\u09CB-\\u09CD\\u09D7\\u09E2\\u09E3\\u0A02\\u0A3C\\u0A3E-\\u0A42\\u0A47\\u0A48\\u0A4B-\\u0A4D\\u0A70\\u0A71\\u0A81-\\u0A83\\u0ABC\\u0ABE-\\u0AC5\\u0AC7-\\u0AC9\\u0ACB-\\u0ACD\\u0B01-\\u0B03\\u0B3C\\u0B3E-\\u0B43\\u0B47\\u0B48\\u0B4B-\\u0B4D\\u0B56\\u0B57\\u0B82\\u0B83\\u0BBE-\\u0BC2\\u0BC6-\\u0BC8\\u0BCA-\\u0BCD\\u0BD7\\u0C01-\\u0C03\\u0C3E-\\u0C44\\u0C46-\\u0C48\\u0C4A-\\u0C4D\\u0C55\\u0C56\\u0C82\\u0C83\\u0CBE-\\u0CC4\\u0CC6-\\u0CC8\\u0CCA-\\u0CCD\\u0CD5\\u0CD6\\u0D02\\u0D03\\u0D3E-\\u0D43\\u0D46-\\u0D48\\u0D4A-\\u0D4D\\u0D57\\u0E31\\u0E34-\\u0E3A\\u0E47-\\u0E4E\\u0EB1\\u0EB4-\\u0EB9\\u0EBB\\u0EBC\\u0EC8-\\u0ECD\\u0F18\\u0F19\\u0F35\\u0F37\\u0F39\\u0F3E\\u0F3F\\u0F71-\\u0F84\\u0F86-\\u0F8B\\u0F90-\\u0F95\\u0F97\\u0F99-\\u0FAD\\u0FB1-\\u0FB7\\u0FB9\\u20D0-\\u20DC\\u20E1\\u302A-\\u302F\\u3099\\u309A';
      var digit = '0-9\\u0660-\\u0669\\u06F0-\\u06F9\\u0966-\\u096F\\u09E6-\\u09EF\\u0A66-\\u0A6F\\u0AE6-\\u0AEF\\u0B66-\\u0B6F\\u0BE7-\\u0BEF\\u0C66-\\u0C6F\\u0CE6-\\u0CEF\\u0D66-\\u0D6F\\u0E50-\\u0E59\\u0ED0-\\u0ED9\\u0F20-\\u0F29';
      var extender = '\\xB7\\u02D0\\u02D1\\u0387\\u0640\\u0E46\\u0EC6\\u3005\\u3031-\\u3035\\u309D\\u309E\\u30FC-\\u30FE';
      var letter = 'A-Za-z\\xC0-\\xD6\\xD8-\\xF6\\xF8-\\u0131\\u0134-\\u013E\\u0141-\\u0148\\u014A-\\u017E\\u0180-\\u01C3\\u01CD-\\u01F0\\u01F4\\u01F5\\u01FA-\\u0217\\u0250-\\u02A8\\u02BB-\\u02C1\\u0386\\u0388-\\u038A\\u038C\\u038E-\\u03A1\\u03A3-\\u03CE\\u03D0-\\u03D6\\u03DA\\u03DC\\u03DE\\u03E0\\u03E2-\\u03F3\\u0401-\\u040C\\u040E-\\u044F\\u0451-\\u045C\\u045E-\\u0481\\u0490-\\u04C4\\u04C7\\u04C8\\u04CB\\u04CC\\u04D0-\\u04EB\\u04EE-\\u04F5\\u04F8\\u04F9\\u0531-\\u0556\\u0559\\u0561-\\u0586\\u05D0-\\u05EA\\u05F0-\\u05F2\\u0621-\\u063A\\u0641-\\u064A\\u0671-\\u06B7\\u06BA-\\u06BE\\u06C0-\\u06CE\\u06D0-\\u06D3\\u06D5\\u06E5\\u06E6\\u0905-\\u0939\\u093D\\u0958-\\u0961\\u0985-\\u098C\\u098F\\u0990\\u0993-\\u09A8\\u09AA-\\u09B0\\u09B2\\u09B6-\\u09B9\\u09DC\\u09DD\\u09DF-\\u09E1\\u09F0\\u09F1\\u0A05-\\u0A0A\\u0A0F\\u0A10\\u0A13-\\u0A28\\u0A2A-\\u0A30\\u0A32\\u0A33\\u0A35\\u0A36\\u0A38\\u0A39\\u0A59-\\u0A5C\\u0A5E\\u0A72-\\u0A74\\u0A85-\\u0A8B\\u0A8D\\u0A8F-\\u0A91\\u0A93-\\u0AA8\\u0AAA-\\u0AB0\\u0AB2\\u0AB3\\u0AB5-\\u0AB9\\u0ABD\\u0AE0\\u0B05-\\u0B0C\\u0B0F\\u0B10\\u0B13-\\u0B28\\u0B2A-\\u0B30\\u0B32\\u0B33\\u0B36-\\u0B39\\u0B3D\\u0B5C\\u0B5D\\u0B5F-\\u0B61\\u0B85-\\u0B8A\\u0B8E-\\u0B90\\u0B92-\\u0B95\\u0B99\\u0B9A\\u0B9C\\u0B9E\\u0B9F\\u0BA3\\u0BA4\\u0BA8-\\u0BAA\\u0BAE-\\u0BB5\\u0BB7-\\u0BB9\\u0C05-\\u0C0C\\u0C0E-\\u0C10\\u0C12-\\u0C28\\u0C2A-\\u0C33\\u0C35-\\u0C39\\u0C60\\u0C61\\u0C85-\\u0C8C\\u0C8E-\\u0C90\\u0C92-\\u0CA8\\u0CAA-\\u0CB3\\u0CB5-\\u0CB9\\u0CDE\\u0CE0\\u0CE1\\u0D05-\\u0D0C\\u0D0E-\\u0D10\\u0D12-\\u0D28\\u0D2A-\\u0D39\\u0D60\\u0D61\\u0E01-\\u0E2E\\u0E30\\u0E32\\u0E33\\u0E40-\\u0E45\\u0E81\\u0E82\\u0E84\\u0E87\\u0E88\\u0E8A\\u0E8D\\u0E94-\\u0E97\\u0E99-\\u0E9F\\u0EA1-\\u0EA3\\u0EA5\\u0EA7\\u0EAA\\u0EAB\\u0EAD\\u0EAE\\u0EB0\\u0EB2\\u0EB3\\u0EBD\\u0EC0-\\u0EC4\\u0F40-\\u0F47\\u0F49-\\u0F69\\u10A0-\\u10C5\\u10D0-\\u10F6\\u1100\\u1102\\u1103\\u1105-\\u1107\\u1109\\u110B\\u110C\\u110E-\\u1112\\u113C\\u113E\\u1140\\u114C\\u114E\\u1150\\u1154\\u1155\\u1159\\u115F-\\u1161\\u1163\\u1165\\u1167\\u1169\\u116D\\u116E\\u1172\\u1173\\u1175\\u119E\\u11A8\\u11AB\\u11AE\\u11AF\\u11B7\\u11B8\\u11BA\\u11BC-\\u11C2\\u11EB\\u11F0\\u11F9\\u1E00-\\u1E9B\\u1EA0-\\u1EF9\\u1F00-\\u1F15\\u1F18-\\u1F1D\\u1F20-\\u1F45\\u1F48-\\u1F4D\\u1F50-\\u1F57\\u1F59\\u1F5B\\u1F5D\\u1F5F-\\u1F7D\\u1F80-\\u1FB4\\u1FB6-\\u1FBC\\u1FBE\\u1FC2-\\u1FC4\\u1FC6-\\u1FCC\\u1FD0-\\u1FD3\\u1FD6-\\u1FDB\\u1FE0-\\u1FEC\\u1FF2-\\u1FF4\\u1FF6-\\u1FFC\\u2126\\u212A\\u212B\\u212E\\u2180-\\u2182\\u3007\\u3021-\\u3029\\u3041-\\u3094\\u30A1-\\u30FA\\u3105-\\u312C\\u4E00-\\u9FA5\\uAC00-\\uD7A3';
      var ncname = '[' + letter + '_][' + letter + digit + '\\.\\-_' + combiningChar + extender + ']*';
      return '((?:' + ncname + '\\:)?' + ncname + ')';
    })(),
    startTagOpen = new RegExp('^<' + qnameCapture),
    startTagClose = /^\s*(\/?)>/,
    endTag = new RegExp('^<\\/' + qnameCapture + '[^>]*>'),
    doctype = /^<!DOCTYPE\s?[^>]+>/i;

var IS_REGEX_CAPTURING_BROKEN = false;
'x'.replace(/x(.)?/g, function(m, g) {
  IS_REGEX_CAPTURING_BROKEN = g === '';
});

// Empty Elements
var empty = makeMap('area,base,basefont,br,col,embed,frame,hr,img,input,isindex,keygen,link,meta,param,source,track,wbr');

// Inline Elements
var inline = makeMap('a,abbr,acronym,applet,b,basefont,bdo,big,br,button,cite,code,del,dfn,em,font,i,iframe,img,input,ins,kbd,label,map,noscript,object,q,s,samp,script,select,small,span,strike,strong,sub,sup,svg,textarea,tt,u,var');

// Elements that you can, intentionally, leave open
// (and which close themselves)
var closeSelf = makeMap('colgroup,dd,dt,li,option,p,td,tfoot,th,thead,tr,source');

// Attributes that have their values filled in disabled='disabled'
var fillAttrs = makeMap('checked,compact,declare,defer,disabled,ismap,multiple,nohref,noresize,noshade,nowrap,readonly,selected');

// Special Elements (can contain anything)
var special = makeMap('script,style');

// HTML5 tags https://html.spec.whatwg.org/multipage/indices.html#elements-3
// Phrasing Content https://html.spec.whatwg.org/multipage/dom.html#phrasing-content
var nonPhrasing = makeMap('address,article,aside,base,blockquote,body,caption,col,colgroup,dd,details,dialog,div,dl,dt,fieldset,figcaption,figure,footer,form,h1,h2,h3,h4,h5,h6,head,header,hgroup,hr,html,legend,li,menuitem,meta,ol,optgroup,option,param,rp,rt,source,style,summary,tbody,td,tfoot,th,thead,title,tr,track,ul');

var reCache = {};

function attrForHandler(handler) {
  var pattern = singleAttrIdentifier.source +
                '(?:\\s*(' + joinSingleAttrAssigns(handler) + ')' +
                '[ \\t\\n\\f\\r]*(?:' + singleAttrValues.join('|') + '))?';
  if (handler.customAttrSurround) {
    var attrClauses = [];
    for (var i = handler.customAttrSurround.length - 1; i >= 0; i--) {
      attrClauses[i] = '(?:' +
                       '(' + handler.customAttrSurround[i][0].source + ')\\s*' +
                       pattern +
                       '\\s*(' + handler.customAttrSurround[i][1].source + ')' +
                       ')';
    }
    attrClauses.push('(?:' + pattern + ')');
    pattern = '(?:' + attrClauses.join('|') + ')';
  }
  return new RegExp('^\\s*' + pattern);
}

function joinSingleAttrAssigns(handler) {
  return singleAttrAssigns.concat(
    handler.customAttrAssign || []
  ).map(function(assign) {
    return '(?:' + assign.source + ')';
  }).join('|');
}

function HTMLParser(html, handler) {
  var stack = [], lastTag;
  var attribute = attrForHandler(handler);
  var last, prevTag, nextTag;
  while (html) {
    last = html;
    // Make sure we're not in a script or style element
    if (!lastTag || !special(lastTag)) {
      var textEnd = html.indexOf('<');
      if (textEnd === 0) {
        // Comment:
        if (/^<!--/.test(html)) {
          var commentEnd = html.indexOf('-->');

          if (commentEnd >= 0) {
            if (handler.comment) {
              handler.comment(html.substring(4, commentEnd));
            }
            html = html.substring(commentEnd + 3);
            prevTag = '';
            continue;
          }
        }

        // https://en.wikipedia.org/wiki/Conditional_comment#Downlevel-revealed_conditional_comment
        if (/^<!\[/.test(html)) {
          var conditionalEnd = html.indexOf(']>');

          if (conditionalEnd >= 0) {
            if (handler.comment) {
              handler.comment(html.substring(2, conditionalEnd + 1), true /* non-standard */);
            }
            html = html.substring(conditionalEnd + 2);
            prevTag = '';
            continue;
          }
        }

        // Doctype:
        var doctypeMatch = html.match(doctype);
        if (doctypeMatch) {
          if (handler.doctype) {
            handler.doctype(doctypeMatch[0]);
          }
          html = html.substring(doctypeMatch[0].length);
          prevTag = '';
          continue;
        }

        // End tag:
        var endTagMatch = html.match(endTag);
        if (endTagMatch) {
          html = html.substring(endTagMatch[0].length);
          endTagMatch[0].replace(endTag, parseEndTag);
          prevTag = '/' + endTagMatch[1].toLowerCase();
          continue;
        }

        // Start tag:
        var startTagMatch = parseStartTag(html);
        if (startTagMatch) {
          html = startTagMatch.rest;
          handleStartTag(startTagMatch);
          prevTag = startTagMatch.tagName.toLowerCase();
          continue;
        }
      }

      var text;
      if (textEnd >= 0) {
        text = html.substring(0, textEnd);
        html = html.substring(textEnd);
      }
      else {
        text = html;
        html = '';
      }

      // next tag
      var nextTagMatch = parseStartTag(html);
      if (nextTagMatch) {
        nextTag = nextTagMatch.tagName;
      }
      else {
        nextTagMatch = html.match(endTag);
        if (nextTagMatch) {
          nextTag = '/' + nextTagMatch[1];
        }
        else {
          nextTag = '';
        }
      }

      if (handler.chars) {
        handler.chars(text, prevTag, nextTag);
      }
      prevTag = '';

    }
    else {
      var stackedTag = lastTag.toLowerCase();
      var reStackedTag = reCache[stackedTag] || (reCache[stackedTag] = new RegExp('([\\s\\S]*?)</' + stackedTag + '[^>]*>', 'i'));

      html = html.replace(reStackedTag, function(all, text) {
        if (stackedTag !== 'script' && stackedTag !== 'style' && stackedTag !== 'noscript') {
          text = text
            .replace(/<!--([\s\S]*?)-->/g, '$1')
            .replace(/<!\[CDATA\[([\s\S]*?)]]>/g, '$1');
        }

        if (handler.chars) {
          handler.chars(text);
        }

        return '';
      });

      parseEndTag('</' + stackedTag + '>', stackedTag);
    }

    if (html === last) {
      throw new Error('Parse Error: ' + html);
    }
  }

  if (!handler.partialMarkup) {
    // Clean up any remaining tags
    parseEndTag();
  }

  function parseStartTag(input) {
    var start = input.match(startTagOpen);
    if (start) {
      var match = {
        tagName: start[1],
        attrs: []
      };
      input = input.slice(start[0].length);
      var end, attr;
      while (!(end = input.match(startTagClose)) && (attr = input.match(attribute))) {
        input = input.slice(attr[0].length);
        match.attrs.push(attr);
      }
      if (end) {
        match.unarySlash = end[1];
        match.rest = input.slice(end[0].length);
        return match;
      }
    }
  }

  function closeIfFound(tagName) {
    if (findTag(tagName) >= 0) {
      parseEndTag('', tagName);
      return true;
    }
  }

  function handleStartTag(match) {
    var tagName = match.tagName;
    var unarySlash = match.unarySlash;

    if (handler.html5) {
      if (lastTag === 'p' && nonPhrasing(tagName)) {
        parseEndTag('', lastTag);
      }
      else if (tagName === 'tbody') {
        closeIfFound('thead');
      }
      else if (tagName === 'tfoot') {
        if (!closeIfFound('tbody')) {
          closeIfFound('thead');
        }
      }
      if (tagName === 'col' && findTag('colgroup') < 0) {
        lastTag = 'colgroup';
        stack.push({ tag: lastTag, attrs: [] });
        if (handler.start) {
          handler.start(lastTag, [], false, '');
        }
      }
    }

    if (!handler.html5 && !inline(tagName)) {
      while (lastTag && inline(lastTag)) {
        parseEndTag('', lastTag);
      }
    }

    if (closeSelf(tagName) && lastTag === tagName) {
      parseEndTag('', tagName);
    }

    var unary = empty(tagName) || tagName === 'html' && lastTag === 'head' || !!unarySlash;

    var attrs = match.attrs.map(function(args) {
      var name, value, customOpen, customClose, customAssign, quote;
      var ncp = 7; // number of captured parts, scalar

      // hackish work around FF bug https://bugzilla.mozilla.org/show_bug.cgi?id=369778
      if (IS_REGEX_CAPTURING_BROKEN && args[0].indexOf('""') === -1) {
        if (args[3] === '') { delete args[3]; }
        if (args[4] === '') { delete args[4]; }
        if (args[5] === '') { delete args[5]; }
      }

      function populate(index) {
        customAssign = args[index];
        value = args[index + 1];
        if (typeof value !== 'undefined') {
          return '"';
        }
        value = args[index + 2];
        if (typeof value !== 'undefined') {
          return '\'';
        }
        value = args[index + 3];
        if (typeof value === 'undefined' && fillAttrs(name)) {
          value = name;
        }
        return '';
      }

      var j = 1;
      if (handler.customAttrSurround) {
        for (var i = 0, l = handler.customAttrSurround.length; i < l; i++, j += ncp) {
          name = args[j + 1];
          if (name) {
            quote = populate(j + 2);
            customOpen = args[j];
            customClose = args[j + 6];
            break;
          }
        }
      }

      if (!name && (name = args[j])) {
        quote = populate(j + 1);
      }

      return {
        name: name,
        value: value,
        customAssign: customAssign || '=',
        customOpen: customOpen || '',
        customClose: customClose || '',
        quote: quote || ''
      };
    });

    if (!unary) {
      stack.push({ tag: tagName, attrs: attrs });
      lastTag = tagName;
      unarySlash = '';
    }

    if (handler.start) {
      handler.start(tagName, attrs, unary, unarySlash);
    }
  }

  function findTag(tagName) {
    var pos;
    var needle = tagName.toLowerCase();
    for (pos = stack.length - 1; pos >= 0; pos--) {
      if (stack[pos].tag.toLowerCase() === needle) {
        break;
      }
    }
    return pos;
  }

  function parseEndTag(tag, tagName) {
    var pos;

    // Find the closest opened tag of the same type
    if (tagName) {
      pos = findTag(tagName);
    }
    // If no tag name is provided, clean shop
    else {
      pos = 0;
    }

    if (pos >= 0) {
      // Close all the open elements, up the stack
      for (var i = stack.length - 1; i >= pos; i--) {
        if (handler.end) {
          handler.end(stack[i].tag, stack[i].attrs, i > pos || !tag);
        }
      }

      // Remove the open elements from the stack
      stack.length = pos;
      lastTag = pos && stack[pos - 1].tag;
    }
    else if (tagName.toLowerCase() === 'br') {
      if (handler.start) {
        handler.start(tagName, [], true, '');
      }
    }
    else if (tagName.toLowerCase() === 'p') {
      if (handler.start) {
        handler.start(tagName, [], false, '', true);
      }
      if (handler.end) {
        handler.end(tagName, []);
      }
    }
  }
}

exports.HTMLParser = HTMLParser;
exports.HTMLtoXML = function(html) {
  var results = '';

  new HTMLParser(html, {
    start: function(tag, attrs, unary) {
      results += '<' + tag;

      for (var i = 0, len = attrs.length; i < len; i++) {
        results += ' ' + attrs[i].name + '="' + (attrs[i].value || '').replace(/"/g, '&#34;') + '"';
      }

      results += (unary ? '/' : '') + '>';
    },
    end: function(tag) {
      results += '</' + tag + '>';
    },
    chars: function(text) {
      results += text;
    },
    comment: function(text) {
      results += '<!--' + text + '-->';
    },
    ignore: function(text) {
      results += text;
    }
  });

  return results;
};

exports.HTMLtoDOM = function(html, doc) {
  // There can be only one of these elements
  var one = {
    html: true,
    head: true,
    body: true,
    title: true
  };

  // Enforce a structure for the document
  var structure = {
    link: 'head',
    base: 'head'
  };

  if (doc) {
    doc = doc.ownerDocument || doc.getOwnerDocument && doc.getOwnerDocument() || doc;
  }
  else if (typeof DOMDocument !== 'undefined') {
    doc = new DOMDocument();
  }
  else if (typeof document !== 'undefined' && document.implementation && document.implementation.createDocument) {
    doc = document.implementation.createDocument('', '', null);
  }
  else if (typeof ActiveX !== 'undefined') {
    doc = new ActiveXObject('Msxml.DOMDocument');
  }

  var elems = [],
      documentElement = doc.documentElement ||
        doc.getDocumentElement && doc.getDocumentElement();

  // If we're dealing with an empty document then we
  // need to pre-populate it with the HTML document structure
  if (!documentElement && doc.createElement) {
    (function() {
      var html = doc.createElement('html');
      var head = doc.createElement('head');
      head.appendChild(doc.createElement('title'));
      html.appendChild(head);
      html.appendChild(doc.createElement('body'));
      doc.appendChild(html);
    })();
  }

  // Find all the unique elements
  if (doc.getElementsByTagName) {
    for (var i in one) {
      one[i] = doc.getElementsByTagName(i)[0];
    }
  }

  // If we're working with a document, inject contents into
  // the body element
  var curParentNode = one.body;

  new HTMLParser(html, {
    start: function(tagName, attrs, unary) {
      // If it's a pre-built element, then we can ignore
      // its construction
      if (one[tagName]) {
        curParentNode = one[tagName];
        return;
      }

      var elem = doc.createElement(tagName);

      for (var attr in attrs) {
        elem.setAttribute(attrs[attr].name, attrs[attr].value);
      }

      if (structure[tagName] && typeof one[structure[tagName]] !== 'boolean') {
        one[structure[tagName]].appendChild(elem);
      }
      else if (curParentNode && curParentNode.appendChild) {
        curParentNode.appendChild(elem);
      }

      if (!unary) {
        elems.push(elem);
        curParentNode = elem;
      }
    },
    end: function(/* tag */) {
      elems.length -= 1;

      // Init the new parentNode
      curParentNode = elems[elems.length - 1];
    },
    chars: function(text) {
      curParentNode.appendChild(doc.createTextNode(text));
    },
    comment: function(/* text */) {
      // create comment node
    },
    ignore: function(/* text */) {
      // What to do here?
    }
  });

  return doc;
};

},{"./utils":30}],29:[function(require,module,exports){
'use strict';

function Sorter() {
}

Sorter.prototype.sort = function(tokens, fromIndex) {
  fromIndex = fromIndex || 0;
  for (var i = 0, len = this.keys.length; i < len; i++) {
    var key = this.keys[i];
    var token = key.slice(1);
    var index = tokens.indexOf(token, fromIndex);
    if (index !== -1) {
      do {
        if (index !== fromIndex) {
          tokens.splice(index, 1);
          tokens.splice(fromIndex, 0, token);
        }
        fromIndex++;
      } while ((index = tokens.indexOf(token, fromIndex)) !== -1);
      return this[key].sort(tokens, fromIndex);
    }
  }
  return tokens;
};

function TokenChain() {
}

TokenChain.prototype = {
  add: function(tokens) {
    var self = this;
    tokens.forEach(function(token) {
      var key = '$' + token;
      if (!self[key]) {
        self[key] = [];
        self[key].processed = 0;
      }
      self[key].push(tokens);
    });
  },
  createSorter: function() {
    var self = this;
    var sorter = new Sorter();
    sorter.keys = Object.keys(self).sort(function(j, k) {
      var m = self[j].length;
      var n = self[k].length;
      return m < n ? 1 : m > n ? -1 : j < k ? -1 : j > k ? 1 : 0;
    }).filter(function(key) {
      if (self[key].processed < self[key].length) {
        var token = key.slice(1);
        var chain = new TokenChain();
        self[key].forEach(function(tokens) {
          var index;
          while ((index = tokens.indexOf(token)) !== -1) {
            tokens.splice(index, 1);
          }
          tokens.forEach(function(token) {
            self['$' + token].processed++;
          });
          chain.add(tokens.slice(0));
        });
        sorter[key] = chain.createSorter();
        return true;
      }
      return false;
    });
    return sorter;
  }
};

module.exports = TokenChain;

},{}],30:[function(require,module,exports){
'use strict';

function createMap(values, ignoreCase) {
  var map = {};
  values.forEach(function(value) {
    map[value] = 1;
  });
  return ignoreCase ? function(value) {
    return map[value.toLowerCase()] === 1;
  } : function(value) {
    return map[value] === 1;
  };
}

exports.createMap = createMap;
exports.createMapFromString = function(values, ignoreCase) {
  return createMap(values.split(/,/), ignoreCase);
};

},{}],"html-minifier":[function(require,module,exports){
'use strict';

var decode = require('he').decode;
var HTMLParser = require('./htmlparser').HTMLParser;
var RelateUrl = require('relateurl');
var TokenChain = require('./tokenchain');
var utils = require('./utils');

function trimWhitespace(str) {
  return str && str.replace(/^[ \n\r\t\f]+/, '').replace(/[ \n\r\t\f]+$/, '');
}

function collapseWhitespaceAll(str) {
  // Non-breaking space is specifically handled inside the replacer function here:
  return str && str.replace(/[ \n\r\t\f\xA0]+/g, function(spaces) {
    return spaces === '\t' ? '\t' : spaces.replace(/(^|\xA0+)[^\xA0]+/g, '$1 ');
  });
}

function collapseWhitespace(str, options, trimLeft, trimRight, collapseAll) {
  var lineBreakBefore = '', lineBreakAfter = '';

  if (options.preserveLineBreaks) {
    str = str.replace(/^[ \n\r\t\f]*?[\n\r][ \n\r\t\f]*/, function() {
      lineBreakBefore = '\n';
      return '';
    }).replace(/[ \n\r\t\f]*?[\n\r][ \n\r\t\f]*$/, function() {
      lineBreakAfter = '\n';
      return '';
    });
  }

  if (trimLeft) {
    // Non-breaking space is specifically handled inside the replacer function here:
    str = str.replace(/^[ \n\r\t\f\xA0]+/, function(spaces) {
      var conservative = !lineBreakBefore && options.conservativeCollapse;
      if (conservative && spaces === '\t') {
        return '\t';
      }
      return spaces.replace(/^[^\xA0]+/, '').replace(/(\xA0+)[^\xA0]+/g, '$1 ') || (conservative ? ' ' : '');
    });
  }

  if (trimRight) {
    // Non-breaking space is specifically handled inside the replacer function here:
    str = str.replace(/[ \n\r\t\f\xA0]+$/, function(spaces) {
      var conservative = !lineBreakAfter && options.conservativeCollapse;
      if (conservative && spaces === '\t') {
        return '\t';
      }
      return spaces.replace(/[^\xA0]+(\xA0+)/g, ' $1').replace(/[^\xA0]+$/, '') || (conservative ? ' ' : '');
    });
  }

  if (collapseAll) {
    // strip non space whitespace then compress spaces to one
    str = collapseWhitespaceAll(str);
  }

  return lineBreakBefore + str + lineBreakAfter;
}

var createMapFromString = utils.createMapFromString;
// non-empty tags that will maintain whitespace around them
var inlineTags = createMapFromString('a,abbr,acronym,b,bdi,bdo,big,button,cite,code,del,dfn,em,font,i,ins,kbd,label,mark,math,nobr,object,q,rp,rt,rtc,ruby,s,samp,select,small,span,strike,strong,sub,sup,svg,textarea,time,tt,u,var');
// non-empty tags that will maintain whitespace within them
var inlineTextTags = createMapFromString('a,abbr,acronym,b,big,del,em,font,i,ins,kbd,mark,nobr,rp,s,samp,small,span,strike,strong,sub,sup,time,tt,u,var');
// self-closing tags that will maintain whitespace around them
var selfClosingInlineTags = createMapFromString('comment,img,input,wbr');

function collapseWhitespaceSmart(str, prevTag, nextTag, options) {
  var trimLeft = prevTag && !selfClosingInlineTags(prevTag);
  if (trimLeft && !options.collapseInlineTagWhitespace) {
    trimLeft = prevTag.charAt(0) === '/' ? !inlineTags(prevTag.slice(1)) : !inlineTextTags(prevTag);
  }
  var trimRight = nextTag && !selfClosingInlineTags(nextTag);
  if (trimRight && !options.collapseInlineTagWhitespace) {
    trimRight = nextTag.charAt(0) === '/' ? !inlineTextTags(nextTag.slice(1)) : !inlineTags(nextTag);
  }
  return collapseWhitespace(str, options, trimLeft, trimRight, prevTag && nextTag);
}

function isConditionalComment(text) {
  return /^\[if\s[^\]]+]|\[endif]$/.test(text);
}

function isIgnoredComment(text, options) {
  for (var i = 0, len = options.ignoreCustomComments.length; i < len; i++) {
    if (options.ignoreCustomComments[i].test(text)) {
      return true;
    }
  }
  return false;
}

function isEventAttribute(attrName, options) {
  var patterns = options.customEventAttributes;
  if (patterns) {
    for (var i = patterns.length; i--;) {
      if (patterns[i].test(attrName)) {
        return true;
      }
    }
    return false;
  }
  return /^on[a-z]{3,}$/.test(attrName);
}

function canRemoveAttributeQuotes(value) {
  // https://mathiasbynens.be/notes/unquoted-attribute-values
  return /^[^ \t\n\f\r"'`=<>]+$/.test(value);
}

function attributesInclude(attributes, attribute) {
  for (var i = attributes.length; i--;) {
    if (attributes[i].name.toLowerCase() === attribute) {
      return true;
    }
  }
  return false;
}

function isAttributeRedundant(tag, attrName, attrValue, attrs) {
  attrValue = attrValue ? trimWhitespace(attrValue.toLowerCase()) : '';

  return (
    tag === 'script' &&
    attrName === 'language' &&
    attrValue === 'javascript' ||

    tag === 'form' &&
    attrName === 'method' &&
    attrValue === 'get' ||

    tag === 'input' &&
    attrName === 'type' &&
    attrValue === 'text' ||

    tag === 'script' &&
    attrName === 'charset' &&
    !attributesInclude(attrs, 'src') ||

    tag === 'a' &&
    attrName === 'name' &&
    attributesInclude(attrs, 'id') ||

    tag === 'area' &&
    attrName === 'shape' &&
    attrValue === 'rect'
  );
}

// https://mathiasbynens.be/demo/javascript-mime-type
// https://developer.mozilla.org/en/docs/Web/HTML/Element/script#attr-type
var executableScriptsMimetypes = utils.createMap([
  'text/javascript',
  'text/ecmascript',
  'text/jscript',
  'application/javascript',
  'application/x-javascript',
  'application/ecmascript'
]);

function isScriptTypeAttribute(attrValue) {
  attrValue = trimWhitespace(attrValue.split(/;/, 2)[0]).toLowerCase();
  return attrValue === '' || executableScriptsMimetypes(attrValue);
}

function isExecutableScript(tag, attrs) {
  if (tag !== 'script') {
    return false;
  }
  for (var i = 0, len = attrs.length; i < len; i++) {
    var attrName = attrs[i].name.toLowerCase();
    if (attrName === 'type') {
      return isScriptTypeAttribute(attrs[i].value);
    }
  }
  return true;
}

function isStyleLinkTypeAttribute(attrValue) {
  attrValue = trimWhitespace(attrValue).toLowerCase();
  return attrValue === '' || attrValue === 'text/css';
}

function isStyleSheet(tag, attrs) {
  if (tag !== 'style') {
    return false;
  }
  for (var i = 0, len = attrs.length; i < len; i++) {
    var attrName = attrs[i].name.toLowerCase();
    if (attrName === 'type') {
      return isStyleLinkTypeAttribute(attrs[i].value);
    }
  }
  return true;
}

var isSimpleBoolean = createMapFromString('allowfullscreen,async,autofocus,autoplay,checked,compact,controls,declare,default,defaultchecked,defaultmuted,defaultselected,defer,disabled,enabled,formnovalidate,hidden,indeterminate,inert,ismap,itemscope,loop,multiple,muted,nohref,noresize,noshade,novalidate,nowrap,open,pauseonexit,readonly,required,reversed,scoped,seamless,selected,sortable,truespeed,typemustmatch,visible');
var isBooleanValue = createMapFromString('true,false');

function isBooleanAttribute(attrName, attrValue) {
  return isSimpleBoolean(attrName) || attrName === 'draggable' && !isBooleanValue(attrValue);
}

function isUriTypeAttribute(attrName, tag) {
  return (
    /^(?:a|area|link|base)$/.test(tag) && attrName === 'href' ||
    tag === 'img' && /^(?:src|longdesc|usemap)$/.test(attrName) ||
    tag === 'object' && /^(?:classid|codebase|data|usemap)$/.test(attrName) ||
    tag === 'q' && attrName === 'cite' ||
    tag === 'blockquote' && attrName === 'cite' ||
    (tag === 'ins' || tag === 'del') && attrName === 'cite' ||
    tag === 'form' && attrName === 'action' ||
    tag === 'input' && (attrName === 'src' || attrName === 'usemap') ||
    tag === 'head' && attrName === 'profile' ||
    tag === 'script' && (attrName === 'src' || attrName === 'for')
  );
}

function isNumberTypeAttribute(attrName, tag) {
  return (
    /^(?:a|area|object|button)$/.test(tag) && attrName === 'tabindex' ||
    tag === 'input' && (attrName === 'maxlength' || attrName === 'tabindex') ||
    tag === 'select' && (attrName === 'size' || attrName === 'tabindex') ||
    tag === 'textarea' && /^(?:rows|cols|tabindex)$/.test(attrName) ||
    tag === 'colgroup' && attrName === 'span' ||
    tag === 'col' && attrName === 'span' ||
    (tag === 'th' || tag === 'td') && (attrName === 'rowspan' || attrName === 'colspan')
  );
}

function isLinkType(tag, attrs, value) {
  if (tag !== 'link') {
    return false;
  }
  for (var i = 0, len = attrs.length; i < len; i++) {
    if (attrs[i].name === 'rel' && attrs[i].value === value) {
      return true;
    }
  }
}

function isMediaQuery(tag, attrs, attrName) {
  return attrName === 'media' && (isLinkType(tag, attrs, 'stylesheet') || isStyleSheet(tag, attrs));
}

var srcsetTags = createMapFromString('img,source');

function isSrcset(attrName, tag) {
  return attrName === 'srcset' && srcsetTags(tag);
}

function cleanAttributeValue(tag, attrName, attrValue, options, attrs) {
  if (isEventAttribute(attrName, options)) {
    attrValue = trimWhitespace(attrValue).replace(/^javascript:\s*/i, '');
    return options.minifyJS(attrValue, true);
  }
  else if (attrName === 'class') {
    attrValue = trimWhitespace(attrValue);
    if (options.sortClassName) {
      attrValue = options.sortClassName(attrValue);
    }
    else {
      attrValue = collapseWhitespaceAll(attrValue);
    }
    return attrValue;
  }
  else if (isUriTypeAttribute(attrName, tag)) {
    attrValue = trimWhitespace(attrValue);
    return isLinkType(tag, attrs, 'canonical') ? attrValue : options.minifyURLs(attrValue);
  }
  else if (isNumberTypeAttribute(attrName, tag)) {
    return trimWhitespace(attrValue);
  }
  else if (attrName === 'style') {
    attrValue = trimWhitespace(attrValue);
    if (attrValue) {
      if (/;$/.test(attrValue) && !/&#?[0-9a-zA-Z]+;$/.test(attrValue)) {
        attrValue = attrValue.replace(/\s*;$/, ';');
      }
      attrValue = options.minifyCSS(attrValue, 'inline');
    }
    return attrValue;
  }
  else if (isSrcset(attrName, tag)) {
    // https://html.spec.whatwg.org/multipage/embedded-content.html#attr-img-srcset
    attrValue = trimWhitespace(attrValue).split(/\s+,\s*|\s*,\s+/).map(function(candidate) {
      var url = candidate;
      var descriptor = '';
      var match = candidate.match(/\s+([1-9][0-9]*w|[0-9]+(?:\.[0-9]+)?x)$/);
      if (match) {
        url = url.slice(0, -match[0].length);
        var num = +match[1].slice(0, -1);
        var suffix = match[1].slice(-1);
        if (num !== 1 || suffix !== 'x') {
          descriptor = ' ' + num + suffix;
        }
      }
      return options.minifyURLs(url) + descriptor;
    }).join(', ');
  }
  else if (isMetaViewport(tag, attrs) && attrName === 'content') {
    attrValue = attrValue.replace(/\s+/g, '').replace(/[0-9]+\.[0-9]+/g, function(numString) {
      // "0.90000" -> "0.9"
      // "1.0" -> "1"
      // "1.0001" -> "1.0001" (unchanged)
      return (+numString).toString();
    });
  }
  else if (options.customAttrCollapse && options.customAttrCollapse.test(attrName)) {
    attrValue = attrValue.replace(/\n+|\r+|\s{2,}/g, '');
  }
  else if (tag === 'script' && attrName === 'type') {
    attrValue = trimWhitespace(attrValue.replace(/\s*;\s*/g, ';'));
  }
  else if (isMediaQuery(tag, attrs, attrName)) {
    attrValue = trimWhitespace(attrValue);
    return options.minifyCSS(attrValue, 'media');
  }
  return attrValue;
}

function isMetaViewport(tag, attrs) {
  if (tag !== 'meta') {
    return false;
  }
  for (var i = 0, len = attrs.length; i < len; i++) {
    if (attrs[i].name === 'name' && attrs[i].value === 'viewport') {
      return true;
    }
  }
}

function ignoreCSS(id) {
  return '/* clean-css ignore:start */' + id + '/* clean-css ignore:end */';
}

// See https://github.com/jakubpawlowicz/clean-css/issues/418
function wrapCSS(text, type) {
  switch (type) {
    case 'inline':
      return '*{' + text + '}';
    case 'media':
      return '@media ' + text + '{a{top:0}}';
    default:
      return text;
  }
}

function cleanConditionalComment(comment, options) {
  return options.processConditionalComments ? comment.replace(/^(\[if\s[^\]]+]>)([\s\S]*?)(<!\[endif])$/, function(match, prefix, text, suffix) {
    return prefix + minify(text, options, true) + suffix;
  }) : comment;
}

function processScript(text, options, currentAttrs) {
  for (var i = 0, len = currentAttrs.length; i < len; i++) {
    if (currentAttrs[i].name.toLowerCase() === 'type' &&
        options.processScripts.indexOf(currentAttrs[i].value) > -1) {
      return minify(text, options);
    }
  }
  return text;
}

// Tag omission rules from https://html.spec.whatwg.org/multipage/syntax.html#optional-tags
// with the following deviations:
// - retain <body> if followed by <noscript>
// - </rb>, </rt>, </rtc>, </rp> & </tfoot> follow https://www.w3.org/TR/html5/syntax.html#optional-tags
// - retain all tags which are adjacent to non-standard HTML tags
var optionalStartTags = createMapFromString('html,head,body,colgroup,tbody');
var optionalEndTags = createMapFromString('html,head,body,li,dt,dd,p,rb,rt,rtc,rp,optgroup,option,colgroup,caption,thead,tbody,tfoot,tr,td,th');
var headerTags = createMapFromString('meta,link,script,style,template,noscript');
var descriptionTags = createMapFromString('dt,dd');
var pBlockTags = createMapFromString('address,article,aside,blockquote,details,div,dl,fieldset,figcaption,figure,footer,form,h1,h2,h3,h4,h5,h6,header,hgroup,hr,main,menu,nav,ol,p,pre,section,table,ul');
var pInlineTags = createMapFromString('a,audio,del,ins,map,noscript,video');
var rubyTags = createMapFromString('rb,rt,rtc,rp');
var rtcTag = createMapFromString('rb,rtc,rp');
var optionTag = createMapFromString('option,optgroup');
var tableContentTags = createMapFromString('tbody,tfoot');
var tableSectionTags = createMapFromString('thead,tbody,tfoot');
var cellTags = createMapFromString('td,th');
var topLevelTags = createMapFromString('html,head,body');
var compactTags = createMapFromString('html,body');
var looseTags = createMapFromString('head,colgroup,caption');
var trailingTags = createMapFromString('dt,thead');
var htmlTags = createMapFromString('a,abbr,acronym,address,applet,area,article,aside,audio,b,base,basefont,bdi,bdo,bgsound,big,blink,blockquote,body,br,button,canvas,caption,center,cite,code,col,colgroup,command,content,data,datalist,dd,del,details,dfn,dialog,dir,div,dl,dt,element,em,embed,fieldset,figcaption,figure,font,footer,form,frame,frameset,h1,h2,h3,h4,h5,h6,head,header,hgroup,hr,html,i,iframe,image,img,input,ins,isindex,kbd,keygen,label,legend,li,link,listing,main,map,mark,marquee,menu,menuitem,meta,meter,multicol,nav,nobr,noembed,noframes,noscript,object,ol,optgroup,option,output,p,param,picture,plaintext,pre,progress,q,rb,rp,rt,rtc,ruby,s,samp,script,section,select,shadow,small,source,spacer,span,strike,strong,style,sub,summary,sup,table,tbody,td,template,textarea,tfoot,th,thead,time,title,tr,track,tt,u,ul,var,video,wbr,xmp');

function canRemoveParentTag(optionalStartTag, tag) {
  switch (optionalStartTag) {
    case 'html':
    case 'head':
      return true;
    case 'body':
      return !headerTags(tag);
    case 'colgroup':
      return tag === 'col';
    case 'tbody':
      return tag === 'tr';
  }
  return false;
}

function isStartTagMandatory(optionalEndTag, tag) {
  switch (tag) {
    case 'colgroup':
      return optionalEndTag === 'colgroup';
    case 'tbody':
      return tableSectionTags(optionalEndTag);
  }
  return false;
}

function canRemovePrecedingTag(optionalEndTag, tag) {
  switch (optionalEndTag) {
    case 'html':
    case 'head':
    case 'body':
    case 'colgroup':
    case 'caption':
      return true;
    case 'li':
    case 'optgroup':
    case 'tr':
      return tag === optionalEndTag;
    case 'dt':
    case 'dd':
      return descriptionTags(tag);
    case 'p':
      return pBlockTags(tag);
    case 'rb':
    case 'rt':
    case 'rp':
      return rubyTags(tag);
    case 'rtc':
      return rtcTag(tag);
    case 'option':
      return optionTag(tag);
    case 'thead':
    case 'tbody':
      return tableContentTags(tag);
    case 'tfoot':
      return tag === 'tbody';
    case 'td':
    case 'th':
      return cellTags(tag);
  }
  return false;
}

var reEmptyAttribute = new RegExp(
  '^(?:class|id|style|title|lang|dir|on(?:focus|blur|change|click|dblclick|mouse(' +
    '?:down|up|over|move|out)|key(?:press|down|up)))$');

function canDeleteEmptyAttribute(tag, attrName, attrValue, options) {
  var isValueEmpty = !attrValue || /^\s*$/.test(attrValue);
  if (!isValueEmpty) {
    return false;
  }
  if (typeof options.removeEmptyAttributes === 'function') {
    return options.removeEmptyAttributes(attrName, tag);
  }
  return tag === 'input' && attrName === 'value' || reEmptyAttribute.test(attrName);
}

function hasAttrName(name, attrs) {
  for (var i = attrs.length - 1; i >= 0; i--) {
    if (attrs[i].name === name) {
      return true;
    }
  }
  return false;
}

function canRemoveElement(tag, attrs) {
  switch (tag) {
    case 'textarea':
      return false;
    case 'audio':
    case 'script':
    case 'video':
      if (hasAttrName('src', attrs)) {
        return false;
      }
      break;
    case 'iframe':
      if (hasAttrName('src', attrs) || hasAttrName('srcdoc', attrs)) {
        return false;
      }
      break;
    case 'object':
      if (hasAttrName('data', attrs)) {
        return false;
      }
      break;
    case 'applet':
      if (hasAttrName('code', attrs)) {
        return false;
      }
      break;
  }
  return true;
}

function canCollapseWhitespace(tag) {
  return !/^(?:script|style|pre|textarea)$/.test(tag);
}

function canTrimWhitespace(tag) {
  return !/^(?:pre|textarea)$/.test(tag);
}

function normalizeAttr(attr, attrs, tag, options) {
  var attrName = options.name(attr.name),
      attrValue = attr.value;

  if (options.decodeEntities && attrValue) {
    attrValue = decode(attrValue, { isAttributeValue: true });
  }

  if (options.removeRedundantAttributes &&
    isAttributeRedundant(tag, attrName, attrValue, attrs) ||
    options.removeScriptTypeAttributes && tag === 'script' &&
    attrName === 'type' && isScriptTypeAttribute(attrValue) ||
    options.removeStyleLinkTypeAttributes && (tag === 'style' || tag === 'link') &&
    attrName === 'type' && isStyleLinkTypeAttribute(attrValue)) {
    return;
  }

  if (attrValue) {
    attrValue = cleanAttributeValue(tag, attrName, attrValue, options, attrs);
  }

  if (options.removeEmptyAttributes &&
      canDeleteEmptyAttribute(tag, attrName, attrValue, options)) {
    return;
  }

  if (options.decodeEntities && attrValue) {
    attrValue = attrValue.replace(/&(#?[0-9a-zA-Z]+;)/g, '&amp;$1');
  }

  return {
    attr: attr,
    name: attrName,
    value: attrValue
  };
}

function buildAttr(normalized, hasUnarySlash, options, isLast, uidAttr) {
  var attrName = normalized.name,
      attrValue = normalized.value,
      attr = normalized.attr,
      attrQuote = attr.quote,
      attrFragment,
      emittedAttrValue;

  if (typeof attrValue !== 'undefined' && (!options.removeAttributeQuotes ||
      ~attrValue.indexOf(uidAttr) || !canRemoveAttributeQuotes(attrValue))) {
    if (!options.preventAttributesEscaping) {
      if (typeof options.quoteCharacter === 'undefined') {
        var apos = (attrValue.match(/'/g) || []).length;
        var quot = (attrValue.match(/"/g) || []).length;
        attrQuote = apos < quot ? '\'' : '"';
      }
      else {
        attrQuote = options.quoteCharacter === '\'' ? '\'' : '"';
      }
      if (attrQuote === '"') {
        attrValue = attrValue.replace(/"/g, '&#34;');
      }
      else {
        attrValue = attrValue.replace(/'/g, '&#39;');
      }
    }
    emittedAttrValue = attrQuote + attrValue + attrQuote;
    if (!isLast && !options.removeTagWhitespace) {
      emittedAttrValue += ' ';
    }
  }
  // make sure trailing slash is not interpreted as HTML self-closing tag
  else if (isLast && !hasUnarySlash && !/\/$/.test(attrValue)) {
    emittedAttrValue = attrValue;
  }
  else {
    emittedAttrValue = attrValue + ' ';
  }

  if (typeof attrValue === 'undefined' || options.collapseBooleanAttributes &&
      isBooleanAttribute(attrName.toLowerCase(), attrValue.toLowerCase())) {
    attrFragment = attrName;
    if (!isLast) {
      attrFragment += ' ';
    }
  }
  else {
    attrFragment = attrName + attr.customAssign + emittedAttrValue;
  }

  return attr.customOpen + attrFragment + attr.customClose;
}

function identity(value) {
  return value;
}

function processOptions(values) {
  var options = {
    name: function(name) {
      return name.toLowerCase();
    },
    canCollapseWhitespace: canCollapseWhitespace,
    canTrimWhitespace: canTrimWhitespace,
    html5: true,
    ignoreCustomComments: [/^!/],
    ignoreCustomFragments: [
      /<%[\s\S]*?%>/,
      /<\?[\s\S]*?\?>/
    ],
    includeAutoGeneratedTags: true,
    log: identity,
    minifyCSS: identity,
    minifyJS: identity,
    minifyURLs: identity
  };
  Object.keys(values).forEach(function(key) {
    var value = values[key];
    if (key === 'caseSensitive') {
      if (value) {
        options.name = identity;
      }
    }
    else if (key === 'log') {
      if (typeof value === 'function') {
        options.log = value;
      }
    }
    else if (key === 'minifyCSS' && typeof value !== 'function') {
      delete options.minifyCSS;
    }
    else if (key === 'minifyJS' && typeof value !== 'function') {
      delete options.minifyJS;
    }
    else if (key === 'minifyURLs' && typeof value !== 'function') {
      if (!value) {
        return;
      }
      if (typeof value === 'string') {
        value = { site: value };
      }
      else if (typeof value !== 'object') {
        value = {};
      }
      options.minifyURLs = function(text) {
        try {
          return RelateUrl.relate(text, value);
        }
        catch (err) {
          options.log(err);
          return text;
        }
      };
    }
    else {
      options[key] = value;
    }
  });
  return options;
}

function uniqueId(value) {
  var id;
  do {
    id = Math.random().toString(36).replace(/^0\.[0-9]*/, '');
  } while (~value.indexOf(id));
  return id;
}

var specialContentTags = createMapFromString('script,style');

function createSortFns(value, options, uidIgnore, uidAttr) {
  var attrChains = options.sortAttributes && Object.create(null);
  var classChain = options.sortClassName && new TokenChain();

  function attrNames(attrs) {
    return attrs.map(function(attr) {
      return options.name(attr.name);
    });
  }

  function shouldSkipUID(token, uid) {
    return !uid || token.indexOf(uid) === -1;
  }

  function shouldSkipUIDs(token) {
    return shouldSkipUID(token, uidIgnore) && shouldSkipUID(token, uidAttr);
  }

  function scan(input) {
    var currentTag, currentType;
    new HTMLParser(input, {
      start: function(tag, attrs) {
        if (attrChains) {
          if (!attrChains[tag]) {
            attrChains[tag] = new TokenChain();
          }
          attrChains[tag].add(attrNames(attrs).filter(shouldSkipUIDs));
        }
        for (var i = 0, len = attrs.length; i < len; i++) {
          var attr = attrs[i];
          if (classChain && attr.value && options.name(attr.name) === 'class') {
            classChain.add(trimWhitespace(attr.value).split(/[ \t\n\f\r]+/).filter(shouldSkipUIDs));
          }
          else if (options.processScripts && attr.name.toLowerCase() === 'type') {
            currentTag = tag;
            currentType = attr.value;
          }
        }
      },
      end: function() {
        currentTag = '';
      },
      chars: function(text) {
        if (options.processScripts && specialContentTags(currentTag) &&
            options.processScripts.indexOf(currentType) > -1) {
          scan(text);
        }
      }
    });
  }

  var log = options.log;
  options.log = identity;
  options.sortAttributes = false;
  options.sortClassName = false;
  scan(minify(value, options));
  options.log = log;
  if (attrChains) {
    var attrSorters = Object.create(null);
    for (var tag in attrChains) {
      attrSorters[tag] = attrChains[tag].createSorter();
    }
    options.sortAttributes = function(tag, attrs) {
      var sorter = attrSorters[tag];
      if (sorter) {
        var attrMap = Object.create(null);
        var names = attrNames(attrs);
        names.forEach(function(name, index) {
          (attrMap[name] || (attrMap[name] = [])).push(attrs[index]);
        });
        sorter.sort(names).forEach(function(name, index) {
          attrs[index] = attrMap[name].shift();
        });
      }
    };
  }
  if (classChain) {
    var sorter = classChain.createSorter();
    options.sortClassName = function(value) {
      return sorter.sort(value.split(/[ \n\f\r]+/)).join(' ');
    };
  }
}

function minify(value, options, partialMarkup) {
  if (options.collapseWhitespace) {
    value = collapseWhitespace(value, options, true, true);
  }

  var buffer = [],
      charsPrevTag,
      currentChars = '',
      hasChars,
      currentTag = '',
      currentAttrs = [],
      stackNoTrimWhitespace = [],
      stackNoCollapseWhitespace = [],
      optionalStartTag = '',
      optionalEndTag = '',
      ignoredMarkupChunks = [],
      ignoredCustomMarkupChunks = [],
      uidIgnore,
      uidAttr,
      uidPattern;

  // temporarily replace ignored chunks with comments,
  // so that we don't have to worry what's there.
  // for all we care there might be
  // completely-horribly-broken-alien-non-html-emoj-cthulhu-filled content
  value = value.replace(/<!-- htmlmin:ignore -->([\s\S]*?)<!-- htmlmin:ignore -->/g, function(match, group1) {
    if (!uidIgnore) {
      uidIgnore = uniqueId(value);
      var pattern = new RegExp('^' + uidIgnore + '([0-9]+)$');
      if (options.ignoreCustomComments) {
        options.ignoreCustomComments = options.ignoreCustomComments.slice();
      }
      else {
        options.ignoreCustomComments = [];
      }
      options.ignoreCustomComments.push(pattern);
    }
    var token = '<!--' + uidIgnore + ignoredMarkupChunks.length + '-->';
    ignoredMarkupChunks.push(group1);
    return token;
  });

  var customFragments = options.ignoreCustomFragments.map(function(re) {
    return re.source;
  });
  if (customFragments.length) {
    var reCustomIgnore = new RegExp('\\s*(?:' + customFragments.join('|') + ')+\\s*', 'g');
    // temporarily replace custom ignored fragments with unique attributes
    value = value.replace(reCustomIgnore, function(match) {
      if (!uidAttr) {
        uidAttr = uniqueId(value);
        uidPattern = new RegExp('(\\s*)' + uidAttr + '([0-9]+)(\\s*)', 'g');
        if (options.minifyCSS) {
          options.minifyCSS = (function(fn) {
            return function(text, type) {
              text = text.replace(uidPattern, function(match, prefix, index) {
                var chunks = ignoredCustomMarkupChunks[+index];
                return chunks[1] + uidAttr + index + chunks[2];
              });
              var ids = [];
              fn(wrapCSS(text, type)).warnings.forEach(function(warning) {
                var match = uidPattern.exec(warning);
                if (match) {
                  var id = uidAttr + match[2];
                  text = text.replace(id, ignoreCSS(id));
                  ids.push(id);
                }
              });
              text = fn(text, type);
              ids.forEach(function(id) {
                text = text.replace(ignoreCSS(id), id);
              });
              return text;
            };
          })(options.minifyCSS);
        }
        if (options.minifyJS) {
          options.minifyJS = (function(fn) {
            return function(text, type) {
              return fn(text.replace(uidPattern, function(match, prefix, index) {
                var chunks = ignoredCustomMarkupChunks[+index];
                return chunks[1] + uidAttr + index + chunks[2];
              }), type);
            };
          })(options.minifyJS);
        }
      }
      var token = uidAttr + ignoredCustomMarkupChunks.length;
      ignoredCustomMarkupChunks.push(/^(\s*)[\s\S]*?(\s*)$/.exec(match));
      return '\t' + token + '\t';
    });
  }

  if (options.sortAttributes && typeof options.sortAttributes !== 'function' ||
      options.sortClassName && typeof options.sortClassName !== 'function') {
    createSortFns(value, options, uidIgnore, uidAttr);
  }

  function _canCollapseWhitespace(tag, attrs) {
    return options.canCollapseWhitespace(tag, attrs, canCollapseWhitespace);
  }

  function _canTrimWhitespace(tag, attrs) {
    return options.canTrimWhitespace(tag, attrs, canTrimWhitespace);
  }

  function removeStartTag() {
    var index = buffer.length - 1;
    while (index > 0 && !/^<[^/!]/.test(buffer[index])) {
      index--;
    }
    buffer.length = Math.max(0, index);
  }

  function removeEndTag() {
    var index = buffer.length - 1;
    while (index > 0 && !/^<\//.test(buffer[index])) {
      index--;
    }
    buffer.length = Math.max(0, index);
  }

  // look for trailing whitespaces, bypass any inline tags
  function trimTrailingWhitespace(index, nextTag) {
    for (var endTag = null; index >= 0 && _canTrimWhitespace(endTag); index--) {
      var str = buffer[index];
      var match = str.match(/^<\/([\w:-]+)>$/);
      if (match) {
        endTag = match[1];
      }
      else if (/>$/.test(str) || (buffer[index] = collapseWhitespaceSmart(str, null, nextTag, options))) {
        break;
      }
    }
  }

  // look for trailing whitespaces from previously processed text
  // which may not be trimmed due to a following comment or an empty
  // element which has now been removed
  function squashTrailingWhitespace(nextTag) {
    var charsIndex = buffer.length - 1;
    if (buffer.length > 1) {
      var item = buffer[buffer.length - 1];
      if (/^(?:<!|$)/.test(item) && item.indexOf(uidIgnore) === -1) {
        charsIndex--;
      }
    }
    trimTrailingWhitespace(charsIndex, nextTag);
  }

  new HTMLParser(value, {
    partialMarkup: partialMarkup,
    html5: options.html5,

    start: function(tag, attrs, unary, unarySlash, autoGenerated) {
      if (tag.toLowerCase() === 'svg') {
        options = Object.create(options);
        options.caseSensitive = true;
        options.keepClosingSlash = true;
        options.name = identity;
      }
      tag = options.name(tag);
      currentTag = tag;
      charsPrevTag = tag;
      if (!inlineTextTags(tag)) {
        currentChars = '';
      }
      hasChars = false;
      currentAttrs = attrs;

      var optional = options.removeOptionalTags;
      if (optional) {
        var htmlTag = htmlTags(tag);
        // <html> may be omitted if first thing inside is not comment
        // <head> may be omitted if first thing inside is an element
        // <body> may be omitted if first thing inside is not space, comment, <meta>, <link>, <script>, <style> or <template>
        // <colgroup> may be omitted if first thing inside is <col>
        // <tbody> may be omitted if first thing inside is <tr>
        if (htmlTag && canRemoveParentTag(optionalStartTag, tag)) {
          removeStartTag();
        }
        optionalStartTag = '';
        // end-tag-followed-by-start-tag omission rules
        if (htmlTag && canRemovePrecedingTag(optionalEndTag, tag)) {
          removeEndTag();
          // <colgroup> cannot be omitted if preceding </colgroup> is omitted
          // <tbody> cannot be omitted if preceding </tbody>, </thead> or </tfoot> is omitted
          optional = !isStartTagMandatory(optionalEndTag, tag);
        }
        optionalEndTag = '';
      }

      // set whitespace flags for nested tags (eg. <code> within a <pre>)
      if (options.collapseWhitespace) {
        if (!stackNoTrimWhitespace.length) {
          squashTrailingWhitespace(tag);
        }
        if (!unary) {
          if (!_canTrimWhitespace(tag, attrs) || stackNoTrimWhitespace.length) {
            stackNoTrimWhitespace.push(tag);
          }
          if (!_canCollapseWhitespace(tag, attrs) || stackNoCollapseWhitespace.length) {
            stackNoCollapseWhitespace.push(tag);
          }
        }
      }

      var openTag = '<' + tag;
      var hasUnarySlash = unarySlash && options.keepClosingSlash;

      buffer.push(openTag);

      if (options.sortAttributes) {
        options.sortAttributes(tag, attrs);
      }

      var parts = [];
      for (var i = attrs.length, isLast = true; --i >= 0;) {
        var normalized = normalizeAttr(attrs[i], attrs, tag, options);
        if (normalized) {
          parts.unshift(buildAttr(normalized, hasUnarySlash, options, isLast, uidAttr));
          isLast = false;
        }
      }
      if (parts.length > 0) {
        buffer.push(' ');
        buffer.push.apply(buffer, parts);
      }
      // start tag must never be omitted if it has any attributes
      else if (optional && optionalStartTags(tag)) {
        optionalStartTag = tag;
      }

      buffer.push(buffer.pop() + (hasUnarySlash ? '/' : '') + '>');

      if (autoGenerated && !options.includeAutoGeneratedTags) {
        removeStartTag();
        optionalStartTag = '';
      }
    },
    end: function(tag, attrs, autoGenerated) {
      if (tag.toLowerCase() === 'svg') {
        options = Object.getPrototypeOf(options);
      }
      tag = options.name(tag);

      // check if current tag is in a whitespace stack
      if (options.collapseWhitespace) {
        if (stackNoTrimWhitespace.length) {
          if (tag === stackNoTrimWhitespace[stackNoTrimWhitespace.length - 1]) {
            stackNoTrimWhitespace.pop();
          }
        }
        else {
          squashTrailingWhitespace('/' + tag);
        }
        if (stackNoCollapseWhitespace.length &&
          tag === stackNoCollapseWhitespace[stackNoCollapseWhitespace.length - 1]) {
          stackNoCollapseWhitespace.pop();
        }
      }

      var isElementEmpty = false;
      if (tag === currentTag) {
        currentTag = '';
        isElementEmpty = !hasChars;
      }

      if (options.removeOptionalTags) {
        // <html>, <head> or <body> may be omitted if the element is empty
        if (isElementEmpty && topLevelTags(optionalStartTag)) {
          removeStartTag();
        }
        optionalStartTag = '';
        // </html> or </body> may be omitted if not followed by comment
        // </head> may be omitted if not followed by space or comment
        // </p> may be omitted if no more content in non-</a> parent
        // except for </dt> or </thead>, end tags may be omitted if no more content in parent element
        if (htmlTags(tag) && optionalEndTag && !trailingTags(optionalEndTag) && (optionalEndTag !== 'p' || !pInlineTags(tag))) {
          removeEndTag();
        }
        optionalEndTag = optionalEndTags(tag) ? tag : '';
      }

      if (options.removeEmptyElements && isElementEmpty && canRemoveElement(tag, attrs)) {
        // remove last "element" from buffer
        removeStartTag();
        optionalStartTag = '';
        optionalEndTag = '';
      }
      else {
        if (autoGenerated && !options.includeAutoGeneratedTags) {
          optionalEndTag = '';
        }
        else {
          buffer.push('</' + tag + '>');
        }
        charsPrevTag = '/' + tag;
        if (!inlineTags(tag)) {
          currentChars = '';
        }
        else if (isElementEmpty) {
          currentChars += '|';
        }
      }
    },
    chars: function(text, prevTag, nextTag) {
      prevTag = prevTag === '' ? 'comment' : prevTag;
      nextTag = nextTag === '' ? 'comment' : nextTag;
      if (options.decodeEntities && text && !specialContentTags(currentTag)) {
        text = decode(text);
      }
      if (options.collapseWhitespace) {
        if (!stackNoTrimWhitespace.length) {
          if (prevTag === 'comment') {
            var prevComment = buffer[buffer.length - 1];
            if (prevComment.indexOf(uidIgnore) === -1) {
              if (!prevComment) {
                prevTag = charsPrevTag;
              }
              if (buffer.length > 1 && (!prevComment || !options.conservativeCollapse && / $/.test(currentChars))) {
                var charsIndex = buffer.length - 2;
                buffer[charsIndex] = buffer[charsIndex].replace(/\s+$/, function(trailingSpaces) {
                  text = trailingSpaces + text;
                  return '';
                });
              }
            }
          }
          if (prevTag) {
            if (prevTag === '/nobr' || prevTag === 'wbr') {
              if (/^\s/.test(text)) {
                var tagIndex = buffer.length - 1;
                while (tagIndex > 0 && buffer[tagIndex].lastIndexOf('<' + prevTag) !== 0) {
                  tagIndex--;
                }
                trimTrailingWhitespace(tagIndex - 1, 'br');
              }
            }
            else if (inlineTextTags(prevTag.charAt(0) === '/' ? prevTag.slice(1) : prevTag)) {
              text = collapseWhitespace(text, options, /(?:^|\s)$/.test(currentChars));
            }
          }
          if (prevTag || nextTag) {
            text = collapseWhitespaceSmart(text, prevTag, nextTag, options);
          }
          else {
            text = collapseWhitespace(text, options, true, true);
          }
          if (!text && /\s$/.test(currentChars) && prevTag && prevTag.charAt(0) === '/') {
            trimTrailingWhitespace(buffer.length - 1, nextTag);
          }
        }
        if (!stackNoCollapseWhitespace.length && nextTag !== 'html' && !(prevTag && nextTag)) {
          text = collapseWhitespace(text, options, false, false, true);
        }
      }
      if (options.processScripts && specialContentTags(currentTag)) {
        text = processScript(text, options, currentAttrs);
      }
      if (isExecutableScript(currentTag, currentAttrs)) {
        text = options.minifyJS(text);
      }
      if (isStyleSheet(currentTag, currentAttrs)) {
        text = options.minifyCSS(text);
      }
      if (options.removeOptionalTags && text) {
        // <html> may be omitted if first thing inside is not comment
        // <body> may be omitted if first thing inside is not space, comment, <meta>, <link>, <script>, <style> or <template>
        if (optionalStartTag === 'html' || optionalStartTag === 'body' && !/^\s/.test(text)) {
          removeStartTag();
        }
        optionalStartTag = '';
        // </html> or </body> may be omitted if not followed by comment
        // </head>, </colgroup> or </caption> may be omitted if not followed by space or comment
        if (compactTags(optionalEndTag) || looseTags(optionalEndTag) && !/^\s/.test(text)) {
          removeEndTag();
        }
        optionalEndTag = '';
      }
      charsPrevTag = /^\s*$/.test(text) ? prevTag : 'comment';
      if (options.decodeEntities && text && !specialContentTags(currentTag)) {
        // Escape any `&` symbols that start either:
        // 1) a legacy named character reference (i.e. one that doesn't end with `;`)
        // 2) or any other character reference (i.e. one that does end with `;`)
        // Note that `&` can be escaped as `&amp`, without the semi-colon.
        // https://mathiasbynens.be/notes/ambiguous-ampersands
        text = text.replace(/&((?:Iacute|aacute|uacute|plusmn|Otilde|otilde|agrave|Agrave|Yacute|yacute|Oslash|oslash|atilde|Atilde|brvbar|ccedil|Ccedil|Ograve|curren|divide|eacute|Eacute|ograve|Oacute|egrave|Egrave|Ugrave|frac12|frac14|frac34|ugrave|oacute|iacute|Ntilde|ntilde|Uacute|middot|igrave|Igrave|iquest|Aacute|cedil|laquo|micro|iexcl|Icirc|icirc|acirc|Ucirc|Ecirc|ocirc|Ocirc|ecirc|ucirc|Aring|aring|AElig|aelig|acute|pound|raquo|Acirc|times|THORN|szlig|thorn|COPY|auml|ordf|ordm|Uuml|macr|uuml|Auml|ouml|Ouml|para|nbsp|euml|quot|QUOT|Euml|yuml|cent|sect|copy|sup1|sup2|sup3|iuml|Iuml|ETH|shy|reg|not|yen|amp|AMP|REG|uml|eth|deg|gt|GT|LT|lt)(?!;)|(?:#?[0-9a-zA-Z]+;))/g, '&amp$1').replace(/</g, '&lt;');
      }
      if (uidPattern && options.collapseWhitespace && stackNoTrimWhitespace.length) {
        text = text.replace(uidPattern, function(match, prefix, index) {
          return ignoredCustomMarkupChunks[+index][0];
        });
      }
      currentChars += text;
      if (text) {
        hasChars = true;
      }
      buffer.push(text);
    },
    comment: function(text, nonStandard) {
      var prefix = nonStandard ? '<!' : '<!--';
      var suffix = nonStandard ? '>' : '-->';
      if (isConditionalComment(text)) {
        text = prefix + cleanConditionalComment(text, options) + suffix;
      }
      else if (options.removeComments) {
        if (isIgnoredComment(text, options)) {
          text = '<!--' + text + '-->';
        }
        else {
          text = '';
        }
      }
      else {
        text = prefix + text + suffix;
      }
      if (options.removeOptionalTags && text) {
        // preceding comments suppress tag omissions
        optionalStartTag = '';
        optionalEndTag = '';
      }
      buffer.push(text);
    },
    doctype: function(doctype) {
      buffer.push(options.useShortDoctype ? '<!doctype' +
        (options.removeTagWhitespace ? '' : ' ') + 'html>' :
        collapseWhitespaceAll(doctype));
    },
    customAttrAssign: options.customAttrAssign,
    customAttrSurround: options.customAttrSurround
  });

  if (options.removeOptionalTags) {
    // <html> may be omitted if first thing inside is not comment
    // <head> or <body> may be omitted if empty
    if (topLevelTags(optionalStartTag)) {
      removeStartTag();
    }
    // except for </dt> or </thead>, end tags may be omitted if no more content in parent element
    if (optionalEndTag && !trailingTags(optionalEndTag)) {
      removeEndTag();
    }
  }
  if (options.collapseWhitespace) {
    squashTrailingWhitespace('br');
  }

  return joinResultSegments(buffer, options, uidPattern ? function(str) {
    return str.replace(uidPattern, function(match, prefix, index, suffix) {
      var chunk = ignoredCustomMarkupChunks[+index][0];
      if (options.collapseWhitespace) {
        if (prefix !== '\t') {
          chunk = prefix + chunk;
        }
        if (suffix !== '\t') {
          chunk += suffix;
        }
        return collapseWhitespace(chunk, {
          preserveLineBreaks: options.preserveLineBreaks,
          conservativeCollapse: !options.trimCustomFragments
        }, /^[ \n\r\t\f]/.test(chunk), /[ \n\r\t\f]$/.test(chunk));
      }
      return chunk;
    });
  } : identity, uidIgnore ? function(str) {
    return str.replace(new RegExp('<!--' + uidIgnore + '([0-9]+)-->', 'g'), function(match, index) {
      return ignoredMarkupChunks[+index];
    });
  } : identity);
}

function joinResultSegments(results, options, restoreCustom, restoreIgnore) {
  var str;
  var maxLineLength = options.maxLineLength;
  if (maxLineLength) {
    var line = '', lines = [];
    while (results.length) {
      var len = line.length;
      var end = results[0].indexOf('\n');
      if (end < 0) {
        line += restoreIgnore(restoreCustom(results.shift()));
      }
      else {
        line += restoreIgnore(restoreCustom(results[0].slice(0, end)));
        results[0] = results[0].slice(end + 1);
      }
      if (len > 0 && line.length > maxLineLength) {
        lines.push(line.slice(0, len));
        line = line.slice(len);
      }
      else if (end >= 0) {
        lines.push(line);
        line = '';
      }
    }
    if (line) {
      lines.push(line);
    }
    str = lines.join('\n');
  }
  else {
    str = restoreIgnore(restoreCustom(results.join('')));
  }
  return options.collapseWhitespace ? collapseWhitespace(str, options, true, true) : str;
}

exports.minify = function(value, options) {
  var start = Date.now();
  options = processOptions(options || {});
  var result = minify(value, options);
  options.log('minified in: ' + (Date.now() - start) + 'ms');
  return result;
};

},{"./htmlparser":28,"./tokenchain":29,"./utils":30,"he":3,"relateurl":11}],"uglify-js":[function(require,module,exports){
(function (Buffer){
(function(exports){"use strict";function characters(str){return str.split("")}function member(name,array){return array.indexOf(name)>=0}function find_if(func,array){for(var i=array.length;--i>=0;)if(func(array[i]))return array[i]}function repeat_string(str,i){if(i<=0)return"";if(i==1)return str;var d=repeat_string(str,i>>1);d+=d;return i&1?d+str:d}function configure_error_stack(fn){Object.defineProperty(fn.prototype,"stack",{get:function(){var err=new Error(this.message);err.name=this.name;try{throw err}catch(e){return e.stack}}})}function DefaultsError(msg,defs){this.message=msg;this.defs=defs}DefaultsError.prototype=Object.create(Error.prototype);DefaultsError.prototype.constructor=DefaultsError;DefaultsError.prototype.name="DefaultsError";configure_error_stack(DefaultsError);function defaults(args,defs,croak){if(args===true)args={};var ret=args||{};if(croak)for(var i in ret)if(HOP(ret,i)&&!HOP(defs,i)){throw new DefaultsError("`"+i+"` is not a supported option",defs)}for(var i in defs)if(HOP(defs,i)){ret[i]=args&&HOP(args,i)?args[i]:defs[i]}return ret}function merge(obj,ext){var count=0;for(var i in ext)if(HOP(ext,i)){obj[i]=ext[i];count++}return count}function noop(){}function return_false(){return false}function return_true(){return true}function return_this(){return this}function return_null(){return null}var MAP=function(){function MAP(a,f,backwards){var ret=[],top=[],i;function doit(){var val=f(a[i],i);var is_last=val instanceof Last;if(is_last)val=val.v;if(val instanceof AtTop){val=val.v;if(val instanceof Splice){top.push.apply(top,backwards?val.v.slice().reverse():val.v)}else{top.push(val)}}else if(val!==skip){if(val instanceof Splice){ret.push.apply(ret,backwards?val.v.slice().reverse():val.v)}else{ret.push(val)}}return is_last}if(Array.isArray(a)){if(backwards){for(i=a.length;--i>=0;)if(doit())break;ret.reverse();top.reverse()}else{for(i=0;i<a.length;++i)if(doit())break}}else{for(i in a)if(HOP(a,i))if(doit())break}return top.concat(ret)}MAP.at_top=function(val){return new AtTop(val)};MAP.splice=function(val){return new Splice(val)};MAP.last=function(val){return new Last(val)};var skip=MAP.skip={};function AtTop(val){this.v=val}function Splice(val){this.v=val}function Last(val){this.v=val}return MAP}();function push_uniq(array,el){if(array.indexOf(el)<0)return array.push(el)}function string_template(text,props){return text.replace(/\{(.+?)\}/g,function(str,p){return props&&props[p]})}function remove(array,el){var index=array.indexOf(el);if(index>=0)array.splice(index,1)}function makePredicate(words){if(!Array.isArray(words))words=words.split(" ");var map=Object.create(null);words.forEach(function(word){map[word]=true});return map}function all(array,predicate){for(var i=array.length;--i>=0;)if(!predicate(array[i]))return false;return true}function Dictionary(){this._values=Object.create(null);this._size=0}Dictionary.prototype={set:function(key,val){if(!this.has(key))++this._size;this._values["$"+key]=val;return this},add:function(key,val){if(this.has(key)){this.get(key).push(val)}else{this.set(key,[val])}return this},get:function(key){return this._values["$"+key]},del:function(key){if(this.has(key)){--this._size;delete this._values["$"+key]}return this},has:function(key){return"$"+key in this._values},each:function(f){for(var i in this._values)f(this._values[i],i.substr(1))},size:function(){return this._size},map:function(f){var ret=[];for(var i in this._values)ret.push(f(this._values[i],i.substr(1)));return ret},clone:function(){var ret=new Dictionary;for(var i in this._values)ret._values[i]=this._values[i];ret._size=this._size;return ret},toObject:function(){return this._values}};Dictionary.fromObject=function(obj){var dict=new Dictionary;dict._size=merge(dict._values,obj);return dict};function HOP(obj,prop){return Object.prototype.hasOwnProperty.call(obj,prop)}function first_in_statement(stack){var node=stack.parent(-1);for(var i=0,p;p=stack.parent(i++);node=p){if(p.TYPE=="Call"){if(p.expression===node)continue}else if(p instanceof AST_Binary){if(p.left===node)continue}else if(p instanceof AST_Conditional){if(p.condition===node)continue}else if(p instanceof AST_PropAccess){if(p.expression===node)continue}else if(p instanceof AST_Sequence){if(p.expressions[0]===node)continue}else if(p instanceof AST_Statement){return p.body===node}else if(p instanceof AST_UnaryPostfix){if(p.expression===node)continue}return false}}"use strict";function DEFNODE(type,props,methods,base){if(typeof base==="undefined")base=AST_Node;props=props?props.split(/\s+/):[];var self_props=props;if(base&&base.PROPS)props=props.concat(base.PROPS);var code=["return function AST_",type,"(props){","if(props){"];props.forEach(function(prop){code.push("this.",prop,"=props.",prop,";")});var proto=base&&new base;if(proto&&proto.initialize||methods&&methods.initialize)code.push("this.initialize();");code.push("}}");var ctor=new Function(code.join(""))();if(proto){ctor.prototype=proto;ctor.BASE=base}if(base)base.SUBCLASSES.push(ctor);ctor.prototype.CTOR=ctor;ctor.PROPS=props||null;ctor.SELF_PROPS=self_props;ctor.SUBCLASSES=[];if(type){ctor.prototype.TYPE=ctor.TYPE=type}if(methods)for(var name in methods)if(HOP(methods,name)){if(/^\$/.test(name)){ctor[name.substr(1)]=methods[name]}else{ctor.prototype[name]=methods[name]}}ctor.DEFMETHOD=function(name,method){this.prototype[name]=method};if(typeof exports!=="undefined"){exports["AST_"+type]=ctor}return ctor}var AST_Token=DEFNODE("Token","type value line col pos endline endcol endpos nlb comments_before comments_after file raw",{},null);var AST_Node=DEFNODE("Node","start end",{_clone:function(deep){if(deep){var self=this.clone();return self.transform(new TreeTransformer(function(node){if(node!==self){return node.clone(true)}}))}return new this.CTOR(this)},clone:function(deep){return this._clone(deep)},$documentation:"Base class of all AST nodes",$propdoc:{start:"[AST_Token] The first token of this node",end:"[AST_Token] The last token of this node"},_walk:function(visitor){return visitor._visit(this)},walk:function(visitor){return this._walk(visitor)}},null);AST_Node.warn=function(txt,props){if(AST_Node.warn_function)AST_Node.warn_function(string_template(txt,props))};var AST_Statement=DEFNODE("Statement",null,{$documentation:"Base class of all statements"});var AST_Debugger=DEFNODE("Debugger",null,{$documentation:"Represents a debugger statement"},AST_Statement);var AST_Directive=DEFNODE("Directive","value quote",{$documentation:'Represents a directive, like "use strict";',$propdoc:{value:"[string] The value of this directive as a plain string (it's not an AST_String!)",quote:"[string] the original quote character"}},AST_Statement);var AST_SimpleStatement=DEFNODE("SimpleStatement","body",{$documentation:"A statement consisting of an expression, i.e. a = 1 + 2",$propdoc:{body:"[AST_Node] an expression node (should not be instanceof AST_Statement)"},_walk:function(visitor){return visitor._visit(this,function(){this.body._walk(visitor)})}},AST_Statement);function walk_body(node,visitor){var body=node.body;if(body instanceof AST_Statement){body._walk(visitor)}else body.forEach(function(node){node._walk(visitor)})}var AST_Block=DEFNODE("Block","body",{$documentation:"A body of statements (usually braced)",$propdoc:{body:"[AST_Statement*] an array of statements"},_walk:function(visitor){return visitor._visit(this,function(){walk_body(this,visitor)})}},AST_Statement);var AST_BlockStatement=DEFNODE("BlockStatement",null,{$documentation:"A block statement"},AST_Block);var AST_EmptyStatement=DEFNODE("EmptyStatement",null,{$documentation:"The empty statement (empty block or simply a semicolon)"},AST_Statement);var AST_StatementWithBody=DEFNODE("StatementWithBody","body",{$documentation:"Base class for all statements that contain one nested body: `For`, `ForIn`, `Do`, `While`, `With`",$propdoc:{body:"[AST_Statement] the body; this should always be present, even if it's an AST_EmptyStatement"}},AST_Statement);var AST_LabeledStatement=DEFNODE("LabeledStatement","label",{$documentation:"Statement with a label",$propdoc:{label:"[AST_Label] a label definition"},_walk:function(visitor){return visitor._visit(this,function(){this.label._walk(visitor);this.body._walk(visitor)})},clone:function(deep){var node=this._clone(deep);if(deep){var label=node.label;var def=this.label;node.walk(new TreeWalker(function(node){if(node instanceof AST_LoopControl&&node.label&&node.label.thedef===def){node.label.thedef=label;label.references.push(node)}}))}return node}},AST_StatementWithBody);var AST_IterationStatement=DEFNODE("IterationStatement",null,{$documentation:"Internal class.  All loops inherit from it."},AST_StatementWithBody);var AST_DWLoop=DEFNODE("DWLoop","condition",{$documentation:"Base class for do/while statements",$propdoc:{condition:"[AST_Node] the loop condition.  Should not be instanceof AST_Statement"}},AST_IterationStatement);var AST_Do=DEFNODE("Do",null,{$documentation:"A `do` statement",_walk:function(visitor){return visitor._visit(this,function(){this.body._walk(visitor);this.condition._walk(visitor)})}},AST_DWLoop);var AST_While=DEFNODE("While",null,{$documentation:"A `while` statement",_walk:function(visitor){return visitor._visit(this,function(){this.condition._walk(visitor);this.body._walk(visitor)})}},AST_DWLoop);var AST_For=DEFNODE("For","init condition step",{$documentation:"A `for` statement",$propdoc:{init:"[AST_Node?] the `for` initialization code, or null if empty",condition:"[AST_Node?] the `for` termination clause, or null if empty",step:"[AST_Node?] the `for` update clause, or null if empty"},_walk:function(visitor){return visitor._visit(this,function(){if(this.init)this.init._walk(visitor);if(this.condition)this.condition._walk(visitor);if(this.step)this.step._walk(visitor);this.body._walk(visitor)})}},AST_IterationStatement);var AST_ForIn=DEFNODE("ForIn","init object",{$documentation:"A `for ... in` statement",$propdoc:{init:"[AST_Node] the `for/in` initialization code",object:"[AST_Node] the object that we're looping through"},_walk:function(visitor){return visitor._visit(this,function(){this.init._walk(visitor);this.object._walk(visitor);this.body._walk(visitor)})}},AST_IterationStatement);var AST_With=DEFNODE("With","expression",{$documentation:"A `with` statement",$propdoc:{expression:"[AST_Node] the `with` expression"},_walk:function(visitor){return visitor._visit(this,function(){this.expression._walk(visitor);this.body._walk(visitor)})}},AST_StatementWithBody);var AST_Scope=DEFNODE("Scope","variables functions uses_with uses_eval parent_scope enclosed cname",{$documentation:"Base class for all statements introducing a lexical scope",$propdoc:{variables:"[Object/S] a map of name -> SymbolDef for all variables/functions defined in this scope",functions:"[Object/S] like `variables`, but only lists function declarations",uses_with:"[boolean/S] tells whether this scope uses the `with` statement",uses_eval:"[boolean/S] tells whether this scope contains a direct call to the global `eval`",parent_scope:"[AST_Scope?/S] link to the parent scope",enclosed:"[SymbolDef*/S] a list of all symbol definitions that are accessed from this scope or any subscopes",cname:"[integer/S] current index for mangling variables (used internally by the mangler)"},clone:function(deep){var node=this._clone(deep);if(this.variables)node.variables=this.variables.clone();if(this.functions)node.functions=this.functions.clone();if(this.enclosed)node.enclosed=this.enclosed.slice();return node},pinned:function(){return this.uses_eval||this.uses_with}},AST_Block);var AST_Toplevel=DEFNODE("Toplevel","globals",{$documentation:"The toplevel scope",$propdoc:{globals:"[Object/S] a map of name -> SymbolDef for all undeclared names"},wrap_commonjs:function(name){var body=this.body;var wrapped_tl="(function(exports){'$ORIG';})(typeof "+name+"=='undefined'?("+name+"={}):"+name+");";wrapped_tl=parse(wrapped_tl);wrapped_tl=wrapped_tl.transform(new TreeTransformer(function(node){if(node instanceof AST_Directive&&node.value=="$ORIG"){return MAP.splice(body)}}));return wrapped_tl},wrap_enclose:function(args_values){if(typeof args_values!="string")args_values="";var index=args_values.indexOf(":");if(index<0)index=args_values.length;var body=this.body;return parse(["(function(",args_values.slice(0,index),'){"$ORIG"})(',args_values.slice(index+1),")"].join("")).transform(new TreeTransformer(function(node){if(node instanceof AST_Directive&&node.value=="$ORIG"){return MAP.splice(body)}}))}},AST_Scope);var AST_Lambda=DEFNODE("Lambda","name argnames uses_arguments",{$documentation:"Base class for functions",$propdoc:{name:"[AST_SymbolDeclaration?] the name of this function",argnames:"[AST_SymbolFunarg*] array of function arguments",uses_arguments:"[boolean/S] tells whether this function accesses the arguments array"},_walk:function(visitor){return visitor._visit(this,function(){if(this.name)this.name._walk(visitor);this.argnames.forEach(function(argname){argname._walk(visitor)});walk_body(this,visitor)})}},AST_Scope);var AST_Accessor=DEFNODE("Accessor",null,{$documentation:"A setter/getter function.  The `name` property is always null."},AST_Lambda);var AST_Function=DEFNODE("Function","inlined",{$documentation:"A function expression"},AST_Lambda);var AST_Defun=DEFNODE("Defun","inlined",{$documentation:"A function definition"},AST_Lambda);var AST_Jump=DEFNODE("Jump",null,{$documentation:"Base class for “jumps” (for now that's `return`, `throw`, `break` and `continue`)"},AST_Statement);var AST_Exit=DEFNODE("Exit","value",{$documentation:"Base class for “exits” (`return` and `throw`)",$propdoc:{value:"[AST_Node?] the value returned or thrown by this statement; could be null for AST_Return"},_walk:function(visitor){return visitor._visit(this,this.value&&function(){this.value._walk(visitor)})}},AST_Jump);var AST_Return=DEFNODE("Return",null,{$documentation:"A `return` statement"},AST_Exit);var AST_Throw=DEFNODE("Throw",null,{$documentation:"A `throw` statement"},AST_Exit);var AST_LoopControl=DEFNODE("LoopControl","label",{$documentation:"Base class for loop control statements (`break` and `continue`)",$propdoc:{label:"[AST_LabelRef?] the label, or null if none"},_walk:function(visitor){return visitor._visit(this,this.label&&function(){this.label._walk(visitor)})}},AST_Jump);var AST_Break=DEFNODE("Break",null,{$documentation:"A `break` statement"},AST_LoopControl);var AST_Continue=DEFNODE("Continue",null,{$documentation:"A `continue` statement"},AST_LoopControl);var AST_If=DEFNODE("If","condition alternative",{$documentation:"A `if` statement",$propdoc:{condition:"[AST_Node] the `if` condition",alternative:"[AST_Statement?] the `else` part, or null if not present"},_walk:function(visitor){return visitor._visit(this,function(){this.condition._walk(visitor);this.body._walk(visitor);if(this.alternative)this.alternative._walk(visitor)})}},AST_StatementWithBody);var AST_Switch=DEFNODE("Switch","expression",{$documentation:"A `switch` statement",$propdoc:{expression:"[AST_Node] the `switch` “discriminant”"},_walk:function(visitor){return visitor._visit(this,function(){this.expression._walk(visitor);walk_body(this,visitor)})}},AST_Block);var AST_SwitchBranch=DEFNODE("SwitchBranch",null,{$documentation:"Base class for `switch` branches"},AST_Block);var AST_Default=DEFNODE("Default",null,{$documentation:"A `default` switch branch"},AST_SwitchBranch);var AST_Case=DEFNODE("Case","expression",{$documentation:"A `case` switch branch",$propdoc:{expression:"[AST_Node] the `case` expression"},_walk:function(visitor){return visitor._visit(this,function(){this.expression._walk(visitor);walk_body(this,visitor)})}},AST_SwitchBranch);var AST_Try=DEFNODE("Try","bcatch bfinally",{$documentation:"A `try` statement",$propdoc:{bcatch:"[AST_Catch?] the catch block, or null if not present",bfinally:"[AST_Finally?] the finally block, or null if not present"},_walk:function(visitor){return visitor._visit(this,function(){walk_body(this,visitor);if(this.bcatch)this.bcatch._walk(visitor);if(this.bfinally)this.bfinally._walk(visitor)})}},AST_Block);var AST_Catch=DEFNODE("Catch","argname",{$documentation:"A `catch` node; only makes sense as part of a `try` statement",$propdoc:{argname:"[AST_SymbolCatch] symbol for the exception"},_walk:function(visitor){return visitor._visit(this,function(){this.argname._walk(visitor);walk_body(this,visitor)})}},AST_Block);var AST_Finally=DEFNODE("Finally",null,{$documentation:"A `finally` node; only makes sense as part of a `try` statement"},AST_Block);var AST_Definitions=DEFNODE("Definitions","definitions",{$documentation:"Base class for `var` nodes (variable declarations/initializations)",$propdoc:{definitions:"[AST_VarDef*] array of variable definitions"},_walk:function(visitor){return visitor._visit(this,function(){this.definitions.forEach(function(defn){defn._walk(visitor)})})}},AST_Statement);var AST_Var=DEFNODE("Var",null,{$documentation:"A `var` statement"},AST_Definitions);var AST_VarDef=DEFNODE("VarDef","name value",{$documentation:"A variable declaration; only appears in a AST_Definitions node",$propdoc:{name:"[AST_SymbolVar] name of the variable",value:"[AST_Node?] initializer, or null of there's no initializer"},_walk:function(visitor){return visitor._visit(this,function(){this.name._walk(visitor);if(this.value)this.value._walk(visitor)})}});var AST_Call=DEFNODE("Call","expression args",{$documentation:"A function call expression",$propdoc:{expression:"[AST_Node] expression to invoke as function",args:"[AST_Node*] array of arguments"},_walk:function(visitor){return visitor._visit(this,function(){this.expression._walk(visitor);this.args.forEach(function(node){node._walk(visitor)})})}});var AST_New=DEFNODE("New",null,{$documentation:"An object instantiation.  Derives from a function call since it has exactly the same properties"},AST_Call);var AST_Sequence=DEFNODE("Sequence","expressions",{$documentation:"A sequence expression (comma-separated expressions)",$propdoc:{expressions:"[AST_Node*] array of expressions (at least two)"},_walk:function(visitor){return visitor._visit(this,function(){this.expressions.forEach(function(node){node._walk(visitor)})})}});var AST_PropAccess=DEFNODE("PropAccess","expression property",{$documentation:'Base class for property access expressions, i.e. `a.foo` or `a["foo"]`',$propdoc:{expression:"[AST_Node] the “container” expression",property:"[AST_Node|string] the property to access.  For AST_Dot this is always a plain string, while for AST_Sub it's an arbitrary AST_Node"}});var AST_Dot=DEFNODE("Dot",null,{$documentation:"A dotted property access expression",_walk:function(visitor){return visitor._visit(this,function(){this.expression._walk(visitor)})}},AST_PropAccess);var AST_Sub=DEFNODE("Sub",null,{$documentation:'Index-style property access, i.e. `a["foo"]`',_walk:function(visitor){return visitor._visit(this,function(){this.expression._walk(visitor);this.property._walk(visitor)})}},AST_PropAccess);var AST_Unary=DEFNODE("Unary","operator expression",{$documentation:"Base class for unary expressions",$propdoc:{operator:"[string] the operator",expression:"[AST_Node] expression that this unary operator applies to"},_walk:function(visitor){return visitor._visit(this,function(){this.expression._walk(visitor)})}});var AST_UnaryPrefix=DEFNODE("UnaryPrefix",null,{$documentation:"Unary prefix expression, i.e. `typeof i` or `++i`"},AST_Unary);var AST_UnaryPostfix=DEFNODE("UnaryPostfix",null,{$documentation:"Unary postfix expression, i.e. `i++`"},AST_Unary);var AST_Binary=DEFNODE("Binary","operator left right",{$documentation:"Binary expression, i.e. `a + b`",$propdoc:{left:"[AST_Node] left-hand side expression",operator:"[string] the operator",right:"[AST_Node] right-hand side expression"},_walk:function(visitor){return visitor._visit(this,function(){this.left._walk(visitor);this.right._walk(visitor)})}});var AST_Conditional=DEFNODE("Conditional","condition consequent alternative",{$documentation:"Conditional expression using the ternary operator, i.e. `a ? b : c`",$propdoc:{condition:"[AST_Node]",consequent:"[AST_Node]",alternative:"[AST_Node]"},_walk:function(visitor){return visitor._visit(this,function(){this.condition._walk(visitor);this.consequent._walk(visitor);this.alternative._walk(visitor)})}});var AST_Assign=DEFNODE("Assign",null,{$documentation:"An assignment expression — `a = b + 5`"},AST_Binary);var AST_Array=DEFNODE("Array","elements",{$documentation:"An array literal",$propdoc:{elements:"[AST_Node*] array of elements"},_walk:function(visitor){return visitor._visit(this,function(){this.elements.forEach(function(element){element._walk(visitor)})})}});var AST_Object=DEFNODE("Object","properties",{$documentation:"An object literal",$propdoc:{properties:"[AST_ObjectProperty*] array of properties"},_walk:function(visitor){return visitor._visit(this,function(){this.properties.forEach(function(prop){prop._walk(visitor)})})}});var AST_ObjectProperty=DEFNODE("ObjectProperty","key value",{$documentation:"Base class for literal object properties",$propdoc:{key:"[string|AST_SymbolAccessor] property name. For ObjectKeyVal this is a string. For getters and setters this is an AST_SymbolAccessor.",value:"[AST_Node] property value.  For getters and setters this is an AST_Accessor."},_walk:function(visitor){return visitor._visit(this,function(){this.value._walk(visitor)})}});var AST_ObjectKeyVal=DEFNODE("ObjectKeyVal","quote",{$documentation:"A key: value object property",$propdoc:{quote:"[string] the original quote character"}},AST_ObjectProperty);var AST_ObjectSetter=DEFNODE("ObjectSetter",null,{$documentation:"An object setter property"},AST_ObjectProperty);var AST_ObjectGetter=DEFNODE("ObjectGetter",null,{$documentation:"An object getter property"},AST_ObjectProperty);var AST_Symbol=DEFNODE("Symbol","scope name thedef",{$propdoc:{name:"[string] name of this symbol",scope:"[AST_Scope/S] the current scope (not necessarily the definition scope)",thedef:"[SymbolDef/S] the definition of this symbol"},$documentation:"Base class for all symbols"});var AST_SymbolAccessor=DEFNODE("SymbolAccessor",null,{$documentation:"The name of a property accessor (setter/getter function)"},AST_Symbol);var AST_SymbolDeclaration=DEFNODE("SymbolDeclaration","init",{$documentation:"A declaration symbol (symbol in var, function name or argument, symbol in catch)"},AST_Symbol);var AST_SymbolVar=DEFNODE("SymbolVar",null,{$documentation:"Symbol defining a variable"},AST_SymbolDeclaration);var AST_SymbolFunarg=DEFNODE("SymbolFunarg",null,{$documentation:"Symbol naming a function argument"},AST_SymbolVar);var AST_SymbolDefun=DEFNODE("SymbolDefun",null,{$documentation:"Symbol defining a function"},AST_SymbolDeclaration);var AST_SymbolLambda=DEFNODE("SymbolLambda",null,{$documentation:"Symbol naming a function expression"},AST_SymbolDeclaration);var AST_SymbolCatch=DEFNODE("SymbolCatch",null,{$documentation:"Symbol naming the exception in catch"},AST_SymbolDeclaration);var AST_Label=DEFNODE("Label","references",{$documentation:"Symbol naming a label (declaration)",$propdoc:{references:"[AST_LoopControl*] a list of nodes referring to this label"},initialize:function(){this.references=[];this.thedef=this}},AST_Symbol);var AST_SymbolRef=DEFNODE("SymbolRef",null,{$documentation:"Reference to some symbol (not definition/declaration)"},AST_Symbol);var AST_LabelRef=DEFNODE("LabelRef",null,{$documentation:"Reference to a label symbol"},AST_Symbol);var AST_This=DEFNODE("This",null,{$documentation:"The `this` symbol"},AST_Symbol);var AST_Constant=DEFNODE("Constant",null,{$documentation:"Base class for all constants",getValue:function(){return this.value}});var AST_String=DEFNODE("String","value quote",{$documentation:"A string literal",$propdoc:{value:"[string] the contents of this string",quote:"[string] the original quote character"}},AST_Constant);var AST_Number=DEFNODE("Number","value literal",{$documentation:"A number literal",$propdoc:{value:"[number] the numeric value",literal:"[string] numeric value as string (optional)"}},AST_Constant);var AST_RegExp=DEFNODE("RegExp","value",{$documentation:"A regexp literal",$propdoc:{value:"[RegExp] the actual regexp"}},AST_Constant);var AST_Atom=DEFNODE("Atom",null,{$documentation:"Base class for atoms"},AST_Constant);var AST_Null=DEFNODE("Null",null,{$documentation:"The `null` atom",value:null},AST_Atom);var AST_NaN=DEFNODE("NaN",null,{$documentation:"The impossible value",value:0/0},AST_Atom);var AST_Undefined=DEFNODE("Undefined",null,{$documentation:"The `undefined` value",value:function(){}()},AST_Atom);var AST_Hole=DEFNODE("Hole",null,{$documentation:"A hole in an array",value:function(){}()},AST_Atom);var AST_Infinity=DEFNODE("Infinity",null,{$documentation:"The `Infinity` value",value:1/0},AST_Atom);var AST_Boolean=DEFNODE("Boolean",null,{$documentation:"Base class for booleans"},AST_Atom);var AST_False=DEFNODE("False",null,{$documentation:"The `false` atom",value:false},AST_Boolean);var AST_True=DEFNODE("True",null,{$documentation:"The `true` atom",value:true},AST_Boolean);function TreeWalker(callback){this.visit=callback;this.stack=[];this.directives=Object.create(null)}TreeWalker.prototype={_visit:function(node,descend){this.push(node);var ret=this.visit(node,descend?function(){descend.call(node)}:noop);if(!ret&&descend){descend.call(node)}this.pop();return ret},parent:function(n){return this.stack[this.stack.length-2-(n||0)]},push:function(node){if(node instanceof AST_Lambda){this.directives=Object.create(this.directives)}else if(node instanceof AST_Directive&&!this.directives[node.value]){this.directives[node.value]=node}this.stack.push(node)},pop:function(){if(this.stack.pop()instanceof AST_Lambda){this.directives=Object.getPrototypeOf(this.directives)}},self:function(){return this.stack[this.stack.length-1]},find_parent:function(type){var stack=this.stack;for(var i=stack.length;--i>=0;){var x=stack[i];if(x instanceof type)return x}},has_directive:function(type){var dir=this.directives[type];if(dir)return dir;var node=this.stack[this.stack.length-1];if(node instanceof AST_Scope){for(var i=0;i<node.body.length;++i){var st=node.body[i];if(!(st instanceof AST_Directive))break;if(st.value==type)return st}}},loopcontrol_target:function(node){var stack=this.stack;if(node.label)for(var i=stack.length;--i>=0;){var x=stack[i];if(x instanceof AST_LabeledStatement&&x.label.name==node.label.name)return x.body}else for(var i=stack.length;--i>=0;){var x=stack[i];if(x instanceof AST_IterationStatement||node instanceof AST_Break&&x instanceof AST_Switch)return x}},in_boolean_context:function(){var self=this.self();for(var i=0,p;p=this.parent(i);i++){if(p instanceof AST_SimpleStatement||p instanceof AST_Conditional&&p.condition===self||p instanceof AST_DWLoop&&p.condition===self||p instanceof AST_For&&p.condition===self||p instanceof AST_If&&p.condition===self||p instanceof AST_UnaryPrefix&&p.operator=="!"&&p.expression===self){return true}if(p instanceof AST_Binary&&(p.operator=="&&"||p.operator=="||")||p instanceof AST_Conditional||p.tail_node()===self){self=p}else{return false}}}};"use strict";var KEYWORDS="break case catch const continue debugger default delete do else finally for function if in instanceof new return switch throw try typeof var void while with";var KEYWORDS_ATOM="false null true";var RESERVED_WORDS="abstract boolean byte char class double enum export extends final float goto implements import int interface let long native package private protected public short static super synchronized this throws transient volatile yield"+" "+KEYWORDS_ATOM+" "+KEYWORDS;var KEYWORDS_BEFORE_EXPRESSION="return new delete throw else case";KEYWORDS=makePredicate(KEYWORDS);RESERVED_WORDS=makePredicate(RESERVED_WORDS);KEYWORDS_BEFORE_EXPRESSION=makePredicate(KEYWORDS_BEFORE_EXPRESSION);KEYWORDS_ATOM=makePredicate(KEYWORDS_ATOM);var OPERATOR_CHARS=makePredicate(characters("+-*&%=<>!?|~^"));var RE_HEX_NUMBER=/^0x[0-9a-f]+$/i;var RE_OCT_NUMBER=/^0[0-7]+$/;var OPERATORS=makePredicate(["in","instanceof","typeof","new","void","delete","++","--","+","-","!","~","&","|","^","*","/","%",">>","<<",">>>","<",">","<=",">=","==","===","!=","!==","?","=","+=","-=","/=","*=","%=",">>=","<<=",">>>=","|=","^=","&=","&&","||"]);var WHITESPACE_CHARS=makePredicate(characters("  \n\r\t\f\v​           \u2028\u2029  　\ufeff"));var NEWLINE_CHARS=makePredicate(characters("\n\r\u2028\u2029"));var PUNC_BEFORE_EXPRESSION=makePredicate(characters("[{(,;:"));var PUNC_CHARS=makePredicate(characters("[]{}(),;:"));var UNICODE={letter:new RegExp("[\\u0041-\\u005A\\u0061-\\u007A\\u00AA\\u00B5\\u00BA\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02C1\\u02C6-\\u02D1\\u02E0-\\u02E4\\u02EC\\u02EE\\u0370-\\u0374\\u0376\\u0377\\u037A-\\u037D\\u037F\\u0386\\u0388-\\u038A\\u038C\\u038E-\\u03A1\\u03A3-\\u03F5\\u03F7-\\u0481\\u048A-\\u052F\\u0531-\\u0556\\u0559\\u0561-\\u0587\\u05D0-\\u05EA\\u05F0-\\u05F2\\u0620-\\u064A\\u066E\\u066F\\u0671-\\u06D3\\u06D5\\u06E5\\u06E6\\u06EE\\u06EF\\u06FA-\\u06FC\\u06FF\\u0710\\u0712-\\u072F\\u074D-\\u07A5\\u07B1\\u07CA-\\u07EA\\u07F4\\u07F5\\u07FA\\u0800-\\u0815\\u081A\\u0824\\u0828\\u0840-\\u0858\\u08A0-\\u08B2\\u0904-\\u0939\\u093D\\u0950\\u0958-\\u0961\\u0971-\\u0980\\u0985-\\u098C\\u098F\\u0990\\u0993-\\u09A8\\u09AA-\\u09B0\\u09B2\\u09B6-\\u09B9\\u09BD\\u09CE\\u09DC\\u09DD\\u09DF-\\u09E1\\u09F0\\u09F1\\u0A05-\\u0A0A\\u0A0F\\u0A10\\u0A13-\\u0A28\\u0A2A-\\u0A30\\u0A32\\u0A33\\u0A35\\u0A36\\u0A38\\u0A39\\u0A59-\\u0A5C\\u0A5E\\u0A72-\\u0A74\\u0A85-\\u0A8D\\u0A8F-\\u0A91\\u0A93-\\u0AA8\\u0AAA-\\u0AB0\\u0AB2\\u0AB3\\u0AB5-\\u0AB9\\u0ABD\\u0AD0\\u0AE0\\u0AE1\\u0B05-\\u0B0C\\u0B0F\\u0B10\\u0B13-\\u0B28\\u0B2A-\\u0B30\\u0B32\\u0B33\\u0B35-\\u0B39\\u0B3D\\u0B5C\\u0B5D\\u0B5F-\\u0B61\\u0B71\\u0B83\\u0B85-\\u0B8A\\u0B8E-\\u0B90\\u0B92-\\u0B95\\u0B99\\u0B9A\\u0B9C\\u0B9E\\u0B9F\\u0BA3\\u0BA4\\u0BA8-\\u0BAA\\u0BAE-\\u0BB9\\u0BD0\\u0C05-\\u0C0C\\u0C0E-\\u0C10\\u0C12-\\u0C28\\u0C2A-\\u0C39\\u0C3D\\u0C58\\u0C59\\u0C60\\u0C61\\u0C85-\\u0C8C\\u0C8E-\\u0C90\\u0C92-\\u0CA8\\u0CAA-\\u0CB3\\u0CB5-\\u0CB9\\u0CBD\\u0CDE\\u0CE0\\u0CE1\\u0CF1\\u0CF2\\u0D05-\\u0D0C\\u0D0E-\\u0D10\\u0D12-\\u0D3A\\u0D3D\\u0D4E\\u0D60\\u0D61\\u0D7A-\\u0D7F\\u0D85-\\u0D96\\u0D9A-\\u0DB1\\u0DB3-\\u0DBB\\u0DBD\\u0DC0-\\u0DC6\\u0E01-\\u0E30\\u0E32\\u0E33\\u0E40-\\u0E46\\u0E81\\u0E82\\u0E84\\u0E87\\u0E88\\u0E8A\\u0E8D\\u0E94-\\u0E97\\u0E99-\\u0E9F\\u0EA1-\\u0EA3\\u0EA5\\u0EA7\\u0EAA\\u0EAB\\u0EAD-\\u0EB0\\u0EB2\\u0EB3\\u0EBD\\u0EC0-\\u0EC4\\u0EC6\\u0EDC-\\u0EDF\\u0F00\\u0F40-\\u0F47\\u0F49-\\u0F6C\\u0F88-\\u0F8C\\u1000-\\u102A\\u103F\\u1050-\\u1055\\u105A-\\u105D\\u1061\\u1065\\u1066\\u106E-\\u1070\\u1075-\\u1081\\u108E\\u10A0-\\u10C5\\u10C7\\u10CD\\u10D0-\\u10FA\\u10FC-\\u1248\\u124A-\\u124D\\u1250-\\u1256\\u1258\\u125A-\\u125D\\u1260-\\u1288\\u128A-\\u128D\\u1290-\\u12B0\\u12B2-\\u12B5\\u12B8-\\u12BE\\u12C0\\u12C2-\\u12C5\\u12C8-\\u12D6\\u12D8-\\u1310\\u1312-\\u1315\\u1318-\\u135A\\u1380-\\u138F\\u13A0-\\u13F4\\u1401-\\u166C\\u166F-\\u167F\\u1681-\\u169A\\u16A0-\\u16EA\\u16EE-\\u16F8\\u1700-\\u170C\\u170E-\\u1711\\u1720-\\u1731\\u1740-\\u1751\\u1760-\\u176C\\u176E-\\u1770\\u1780-\\u17B3\\u17D7\\u17DC\\u1820-\\u1877\\u1880-\\u18A8\\u18AA\\u18B0-\\u18F5\\u1900-\\u191E\\u1950-\\u196D\\u1970-\\u1974\\u1980-\\u19AB\\u19C1-\\u19C7\\u1A00-\\u1A16\\u1A20-\\u1A54\\u1AA7\\u1B05-\\u1B33\\u1B45-\\u1B4B\\u1B83-\\u1BA0\\u1BAE\\u1BAF\\u1BBA-\\u1BE5\\u1C00-\\u1C23\\u1C4D-\\u1C4F\\u1C5A-\\u1C7D\\u1CE9-\\u1CEC\\u1CEE-\\u1CF1\\u1CF5\\u1CF6\\u1D00-\\u1DBF\\u1E00-\\u1F15\\u1F18-\\u1F1D\\u1F20-\\u1F45\\u1F48-\\u1F4D\\u1F50-\\u1F57\\u1F59\\u1F5B\\u1F5D\\u1F5F-\\u1F7D\\u1F80-\\u1FB4\\u1FB6-\\u1FBC\\u1FBE\\u1FC2-\\u1FC4\\u1FC6-\\u1FCC\\u1FD0-\\u1FD3\\u1FD6-\\u1FDB\\u1FE0-\\u1FEC\\u1FF2-\\u1FF4\\u1FF6-\\u1FFC\\u2071\\u207F\\u2090-\\u209C\\u2102\\u2107\\u210A-\\u2113\\u2115\\u2119-\\u211D\\u2124\\u2126\\u2128\\u212A-\\u212D\\u212F-\\u2139\\u213C-\\u213F\\u2145-\\u2149\\u214E\\u2160-\\u2188\\u2C00-\\u2C2E\\u2C30-\\u2C5E\\u2C60-\\u2CE4\\u2CEB-\\u2CEE\\u2CF2\\u2CF3\\u2D00-\\u2D25\\u2D27\\u2D2D\\u2D30-\\u2D67\\u2D6F\\u2D80-\\u2D96\\u2DA0-\\u2DA6\\u2DA8-\\u2DAE\\u2DB0-\\u2DB6\\u2DB8-\\u2DBE\\u2DC0-\\u2DC6\\u2DC8-\\u2DCE\\u2DD0-\\u2DD6\\u2DD8-\\u2DDE\\u2E2F\\u3005-\\u3007\\u3021-\\u3029\\u3031-\\u3035\\u3038-\\u303C\\u3041-\\u3096\\u309D-\\u309F\\u30A1-\\u30FA\\u30FC-\\u30FF\\u3105-\\u312D\\u3131-\\u318E\\u31A0-\\u31BA\\u31F0-\\u31FF\\u3400-\\u4DB5\\u4E00-\\u9FCC\\uA000-\\uA48C\\uA4D0-\\uA4FD\\uA500-\\uA60C\\uA610-\\uA61F\\uA62A\\uA62B\\uA640-\\uA66E\\uA67F-\\uA69D\\uA6A0-\\uA6EF\\uA717-\\uA71F\\uA722-\\uA788\\uA78B-\\uA78E\\uA790-\\uA7AD\\uA7B0\\uA7B1\\uA7F7-\\uA801\\uA803-\\uA805\\uA807-\\uA80A\\uA80C-\\uA822\\uA840-\\uA873\\uA882-\\uA8B3\\uA8F2-\\uA8F7\\uA8FB\\uA90A-\\uA925\\uA930-\\uA946\\uA960-\\uA97C\\uA984-\\uA9B2\\uA9CF\\uA9E0-\\uA9E4\\uA9E6-\\uA9EF\\uA9FA-\\uA9FE\\uAA00-\\uAA28\\uAA40-\\uAA42\\uAA44-\\uAA4B\\uAA60-\\uAA76\\uAA7A\\uAA7E-\\uAAAF\\uAAB1\\uAAB5\\uAAB6\\uAAB9-\\uAABD\\uAAC0\\uAAC2\\uAADB-\\uAADD\\uAAE0-\\uAAEA\\uAAF2-\\uAAF4\\uAB01-\\uAB06\\uAB09-\\uAB0E\\uAB11-\\uAB16\\uAB20-\\uAB26\\uAB28-\\uAB2E\\uAB30-\\uAB5A\\uAB5C-\\uAB5F\\uAB64\\uAB65\\uABC0-\\uABE2\\uAC00-\\uD7A3\\uD7B0-\\uD7C6\\uD7CB-\\uD7FB\\uF900-\\uFA6D\\uFA70-\\uFAD9\\uFB00-\\uFB06\\uFB13-\\uFB17\\uFB1D\\uFB1F-\\uFB28\\uFB2A-\\uFB36\\uFB38-\\uFB3C\\uFB3E\\uFB40\\uFB41\\uFB43\\uFB44\\uFB46-\\uFBB1\\uFBD3-\\uFD3D\\uFD50-\\uFD8F\\uFD92-\\uFDC7\\uFDF0-\\uFDFB\\uFE70-\\uFE74\\uFE76-\\uFEFC\\uFF21-\\uFF3A\\uFF41-\\uFF5A\\uFF66-\\uFFBE\\uFFC2-\\uFFC7\\uFFCA-\\uFFCF\\uFFD2-\\uFFD7\\uFFDA-\\uFFDC]"),digit:new RegExp("[\\u0030-\\u0039\\u0660-\\u0669\\u06F0-\\u06F9\\u07C0-\\u07C9\\u0966-\\u096F\\u09E6-\\u09EF\\u0A66-\\u0A6F\\u0AE6-\\u0AEF\\u0B66-\\u0B6F\\u0BE6-\\u0BEF\\u0C66-\\u0C6F\\u0CE6-\\u0CEF\\u0D66-\\u0D6F\\u0DE6-\\u0DEF\\u0E50-\\u0E59\\u0ED0-\\u0ED9\\u0F20-\\u0F29\\u1040-\\u1049\\u1090-\\u1099\\u17E0-\\u17E9\\u1810-\\u1819\\u1946-\\u194F\\u19D0-\\u19D9\\u1A80-\\u1A89\\u1A90-\\u1A99\\u1B50-\\u1B59\\u1BB0-\\u1BB9\\u1C40-\\u1C49\\u1C50-\\u1C59\\uA620-\\uA629\\uA8D0-\\uA8D9\\uA900-\\uA909\\uA9D0-\\uA9D9\\uA9F0-\\uA9F9\\uAA50-\\uAA59\\uABF0-\\uABF9\\uFF10-\\uFF19]"),non_spacing_mark:new RegExp("[\\u0300-\\u036F\\u0483-\\u0487\\u0591-\\u05BD\\u05BF\\u05C1\\u05C2\\u05C4\\u05C5\\u05C7\\u0610-\\u061A\\u064B-\\u065E\\u0670\\u06D6-\\u06DC\\u06DF-\\u06E4\\u06E7\\u06E8\\u06EA-\\u06ED\\u0711\\u0730-\\u074A\\u07A6-\\u07B0\\u07EB-\\u07F3\\u0816-\\u0819\\u081B-\\u0823\\u0825-\\u0827\\u0829-\\u082D\\u0900-\\u0902\\u093C\\u0941-\\u0948\\u094D\\u0951-\\u0955\\u0962\\u0963\\u0981\\u09BC\\u09C1-\\u09C4\\u09CD\\u09E2\\u09E3\\u0A01\\u0A02\\u0A3C\\u0A41\\u0A42\\u0A47\\u0A48\\u0A4B-\\u0A4D\\u0A51\\u0A70\\u0A71\\u0A75\\u0A81\\u0A82\\u0ABC\\u0AC1-\\u0AC5\\u0AC7\\u0AC8\\u0ACD\\u0AE2\\u0AE3\\u0B01\\u0B3C\\u0B3F\\u0B41-\\u0B44\\u0B4D\\u0B56\\u0B62\\u0B63\\u0B82\\u0BC0\\u0BCD\\u0C3E-\\u0C40\\u0C46-\\u0C48\\u0C4A-\\u0C4D\\u0C55\\u0C56\\u0C62\\u0C63\\u0CBC\\u0CBF\\u0CC6\\u0CCC\\u0CCD\\u0CE2\\u0CE3\\u0D41-\\u0D44\\u0D4D\\u0D62\\u0D63\\u0DCA\\u0DD2-\\u0DD4\\u0DD6\\u0E31\\u0E34-\\u0E3A\\u0E47-\\u0E4E\\u0EB1\\u0EB4-\\u0EB9\\u0EBB\\u0EBC\\u0EC8-\\u0ECD\\u0F18\\u0F19\\u0F35\\u0F37\\u0F39\\u0F71-\\u0F7E\\u0F80-\\u0F84\\u0F86\\u0F87\\u0F90-\\u0F97\\u0F99-\\u0FBC\\u0FC6\\u102D-\\u1030\\u1032-\\u1037\\u1039\\u103A\\u103D\\u103E\\u1058\\u1059\\u105E-\\u1060\\u1071-\\u1074\\u1082\\u1085\\u1086\\u108D\\u109D\\u135F\\u1712-\\u1714\\u1732-\\u1734\\u1752\\u1753\\u1772\\u1773\\u17B7-\\u17BD\\u17C6\\u17C9-\\u17D3\\u17DD\\u180B-\\u180D\\u18A9\\u1920-\\u1922\\u1927\\u1928\\u1932\\u1939-\\u193B\\u1A17\\u1A18\\u1A56\\u1A58-\\u1A5E\\u1A60\\u1A62\\u1A65-\\u1A6C\\u1A73-\\u1A7C\\u1A7F\\u1B00-\\u1B03\\u1B34\\u1B36-\\u1B3A\\u1B3C\\u1B42\\u1B6B-\\u1B73\\u1B80\\u1B81\\u1BA2-\\u1BA5\\u1BA8\\u1BA9\\u1C2C-\\u1C33\\u1C36\\u1C37\\u1CD0-\\u1CD2\\u1CD4-\\u1CE0\\u1CE2-\\u1CE8\\u1CED\\u1DC0-\\u1DE6\\u1DFD-\\u1DFF\\u20D0-\\u20DC\\u20E1\\u20E5-\\u20F0\\u2CEF-\\u2CF1\\u2DE0-\\u2DFF\\u302A-\\u302F\\u3099\\u309A\\uA66F\\uA67C\\uA67D\\uA6F0\\uA6F1\\uA802\\uA806\\uA80B\\uA825\\uA826\\uA8C4\\uA8E0-\\uA8F1\\uA926-\\uA92D\\uA947-\\uA951\\uA980-\\uA982\\uA9B3\\uA9B6-\\uA9B9\\uA9BC\\uAA29-\\uAA2E\\uAA31\\uAA32\\uAA35\\uAA36\\uAA43\\uAA4C\\uAAB0\\uAAB2-\\uAAB4\\uAAB7\\uAAB8\\uAABE\\uAABF\\uAAC1\\uABE5\\uABE8\\uABED\\uFB1E\\uFE00-\\uFE0F\\uFE20-\\uFE26]"),space_combining_mark:new RegExp("[\\u0903\\u093E-\\u0940\\u0949-\\u094C\\u094E\\u0982\\u0983\\u09BE-\\u09C0\\u09C7\\u09C8\\u09CB\\u09CC\\u09D7\\u0A03\\u0A3E-\\u0A40\\u0A83\\u0ABE-\\u0AC0\\u0AC9\\u0ACB\\u0ACC\\u0B02\\u0B03\\u0B3E\\u0B40\\u0B47\\u0B48\\u0B4B\\u0B4C\\u0B57\\u0BBE\\u0BBF\\u0BC1\\u0BC2\\u0BC6-\\u0BC8\\u0BCA-\\u0BCC\\u0BD7\\u0C01-\\u0C03\\u0C41-\\u0C44\\u0C82\\u0C83\\u0CBE\\u0CC0-\\u0CC4\\u0CC7\\u0CC8\\u0CCA\\u0CCB\\u0CD5\\u0CD6\\u0D02\\u0D03\\u0D3E-\\u0D40\\u0D46-\\u0D48\\u0D4A-\\u0D4C\\u0D57\\u0D82\\u0D83\\u0DCF-\\u0DD1\\u0DD8-\\u0DDF\\u0DF2\\u0DF3\\u0F3E\\u0F3F\\u0F7F\\u102B\\u102C\\u1031\\u1038\\u103B\\u103C\\u1056\\u1057\\u1062-\\u1064\\u1067-\\u106D\\u1083\\u1084\\u1087-\\u108C\\u108F\\u109A-\\u109C\\u17B6\\u17BE-\\u17C5\\u17C7\\u17C8\\u1923-\\u1926\\u1929-\\u192B\\u1930\\u1931\\u1933-\\u1938\\u19B0-\\u19C0\\u19C8\\u19C9\\u1A19-\\u1A1B\\u1A55\\u1A57\\u1A61\\u1A63\\u1A64\\u1A6D-\\u1A72\\u1B04\\u1B35\\u1B3B\\u1B3D-\\u1B41\\u1B43\\u1B44\\u1B82\\u1BA1\\u1BA6\\u1BA7\\u1BAA\\u1C24-\\u1C2B\\u1C34\\u1C35\\u1CE1\\u1CF2\\uA823\\uA824\\uA827\\uA880\\uA881\\uA8B4-\\uA8C3\\uA952\\uA953\\uA983\\uA9B4\\uA9B5\\uA9BA\\uA9BB\\uA9BD-\\uA9C0\\uAA2F\\uAA30\\uAA33\\uAA34\\uAA4D\\uAA7B\\uABE3\\uABE4\\uABE6\\uABE7\\uABE9\\uABEA\\uABEC]"),connector_punctuation:new RegExp("[\\u005F\\u203F\\u2040\\u2054\\uFE33\\uFE34\\uFE4D-\\uFE4F\\uFF3F]")};function is_letter(code){return code>=97&&code<=122||code>=65&&code<=90||code>=170&&UNICODE.letter.test(String.fromCharCode(code))}function is_surrogate_pair_head(code){if(typeof code=="string")code=code.charCodeAt(0);return code>=55296&&code<=56319}function is_surrogate_pair_tail(code){if(typeof code=="string")code=code.charCodeAt(0);return code>=56320&&code<=57343}function is_digit(code){return code>=48&&code<=57}function is_alphanumeric_char(code){return is_digit(code)||is_letter(code)}function is_unicode_digit(code){return UNICODE.digit.test(String.fromCharCode(code))}function is_unicode_combining_mark(ch){return UNICODE.non_spacing_mark.test(ch)||UNICODE.space_combining_mark.test(ch)}function is_unicode_connector_punctuation(ch){return UNICODE.connector_punctuation.test(ch)}function is_identifier(name){return!RESERVED_WORDS[name]&&/^[a-z_$][a-z0-9_$]*$/i.test(name)}function is_identifier_start(code){return code==36||code==95||is_letter(code)}function is_identifier_char(ch){var code=ch.charCodeAt(0);return is_identifier_start(code)||is_digit(code)||code==8204||code==8205||is_unicode_combining_mark(ch)||is_unicode_connector_punctuation(ch)||is_unicode_digit(code)}function is_identifier_string(str){return/^[a-z_$][a-z0-9_$]*$/i.test(str)}function parse_js_number(num){if(RE_HEX_NUMBER.test(num)){return parseInt(num.substr(2),16)}else if(RE_OCT_NUMBER.test(num)){return parseInt(num.substr(1),8)}else{var val=parseFloat(num);if(val==num)return val}}function JS_Parse_Error(message,filename,line,col,pos){this.message=message;this.filename=filename;this.line=line;this.col=col;this.pos=pos}JS_Parse_Error.prototype=Object.create(Error.prototype);JS_Parse_Error.prototype.constructor=JS_Parse_Error;JS_Parse_Error.prototype.name="SyntaxError";configure_error_stack(JS_Parse_Error);function js_error(message,filename,line,col,pos){throw new JS_Parse_Error(message,filename,line,col,pos)}function is_token(token,type,val){return token.type==type&&(val==null||token.value==val)}var EX_EOF={};function tokenizer($TEXT,filename,html5_comments,shebang){var S={text:$TEXT,filename:filename,pos:0,tokpos:0,line:1,tokline:0,col:0,tokcol:0,newline_before:false,regex_allowed:false,comments_before:[],directives:{},directive_stack:[]};function peek(){return S.text.charAt(S.pos)}function next(signal_eof,in_string){var ch=S.text.charAt(S.pos++);if(signal_eof&&!ch)throw EX_EOF;if(NEWLINE_CHARS[ch]){S.newline_before=S.newline_before||!in_string;++S.line;S.col=0;if(!in_string&&ch=="\r"&&peek()=="\n"){++S.pos;ch="\n"}}else{++S.col}return ch}function forward(i){while(i-- >0)next()}function looking_at(str){return S.text.substr(S.pos,str.length)==str}function find_eol(){var text=S.text;for(var i=S.pos,n=S.text.length;i<n;++i){var ch=text[i];if(NEWLINE_CHARS[ch])return i}return-1}function find(what,signal_eof){var pos=S.text.indexOf(what,S.pos);if(signal_eof&&pos==-1)throw EX_EOF;return pos}function start_token(){S.tokline=S.line;S.tokcol=S.col;S.tokpos=S.pos}var prev_was_dot=false;function token(type,value,is_comment){S.regex_allowed=type=="operator"&&!UNARY_POSTFIX[value]||type=="keyword"&&KEYWORDS_BEFORE_EXPRESSION[value]||type=="punc"&&PUNC_BEFORE_EXPRESSION[value];if(type=="punc"&&value=="."){prev_was_dot=true}else if(!is_comment){prev_was_dot=false}var ret={type:type,value:value,line:S.tokline,col:S.tokcol,pos:S.tokpos,endline:S.line,endcol:S.col,endpos:S.pos,nlb:S.newline_before,file:filename};if(/^(?:num|string|regexp)$/i.test(type)){ret.raw=$TEXT.substring(ret.pos,ret.endpos)}if(!is_comment){ret.comments_before=S.comments_before;ret.comments_after=S.comments_before=[]}S.newline_before=false;return new AST_Token(ret)}function skip_whitespace(){while(WHITESPACE_CHARS[peek()])next()}function read_while(pred){var ret="",ch,i=0;while((ch=peek())&&pred(ch,i++))ret+=next();return ret}function parse_error(err){js_error(err,filename,S.tokline,S.tokcol,S.tokpos)}function read_num(prefix){var has_e=false,after_e=false,has_x=false,has_dot=prefix==".";var num=read_while(function(ch,i){var code=ch.charCodeAt(0);switch(code){case 120:case 88:return has_x?false:has_x=true;case 101:case 69:return has_x?true:has_e?false:has_e=after_e=true;case 45:return after_e||i==0&&!prefix;case 43:return after_e;case after_e=false,46:return!has_dot&&!has_x&&!has_e?has_dot=true:false}return is_alphanumeric_char(code)});if(prefix)num=prefix+num;if(RE_OCT_NUMBER.test(num)&&next_token.has_directive("use strict")){parse_error("Legacy octal literals are not allowed in strict mode")}var valid=parse_js_number(num);if(!isNaN(valid)){return token("num",valid)}else{parse_error("Invalid syntax: "+num)}}function read_escaped_char(in_string){var ch=next(true,in_string);switch(ch.charCodeAt(0)){case 110:return"\n";case 114:return"\r";case 116:return"\t";case 98:return"\b";case 118:return"\v";case 102:return"\f";case 120:return String.fromCharCode(hex_bytes(2));case 117:return String.fromCharCode(hex_bytes(4));case 10:return"";case 13:if(peek()=="\n"){next(true,in_string);return""}}if(ch>="0"&&ch<="7")return read_octal_escape_sequence(ch);return ch}function read_octal_escape_sequence(ch){var p=peek();if(p>="0"&&p<="7"){ch+=next(true);if(ch[0]<="3"&&(p=peek())>="0"&&p<="7")ch+=next(true)}if(ch==="0")return"\0";if(ch.length>0&&next_token.has_directive("use strict"))parse_error("Legacy octal escape sequences are not allowed in strict mode");return String.fromCharCode(parseInt(ch,8))}function hex_bytes(n){var num=0;for(;n>0;--n){var digit=parseInt(next(true),16);if(isNaN(digit))parse_error("Invalid hex-character pattern in string");num=num<<4|digit}return num}var read_string=with_eof_error("Unterminated string constant",function(quote_char){var quote=next(),ret="";for(;;){var ch=next(true,true);if(ch=="\\")ch=read_escaped_char(true);else if(NEWLINE_CHARS[ch])parse_error("Unterminated string constant");else if(ch==quote)break;ret+=ch}var tok=token("string",ret);tok.quote=quote_char;return tok});function skip_line_comment(type){var regex_allowed=S.regex_allowed;var i=find_eol(),ret;if(i==-1){ret=S.text.substr(S.pos);S.pos=S.text.length}else{ret=S.text.substring(S.pos,i);S.pos=i}S.col=S.tokcol+(S.pos-S.tokpos);S.comments_before.push(token(type,ret,true));S.regex_allowed=regex_allowed;return next_token}var skip_multiline_comment=with_eof_error("Unterminated multiline comment",function(){var regex_allowed=S.regex_allowed;var i=find("*/",true);var text=S.text.substring(S.pos,i).replace(/\r\n|\r|\u2028|\u2029/g,"\n");forward(text.length+2);S.comments_before.push(token("comment2",text,true));S.regex_allowed=regex_allowed;return next_token});function read_name(){var backslash=false,name="",ch,escaped=false,hex;while((ch=peek())!=null){if(!backslash){if(ch=="\\")escaped=backslash=true,next();else if(is_identifier_char(ch))name+=next();else break}else{if(ch!="u")parse_error("Expecting UnicodeEscapeSequence -- uXXXX");ch=read_escaped_char();if(!is_identifier_char(ch))parse_error("Unicode char: "+ch.charCodeAt(0)+" is not valid in identifier");name+=ch;backslash=false}}if(KEYWORDS[name]&&escaped){hex=name.charCodeAt(0).toString(16).toUpperCase();name="\\u"+"0000".substr(hex.length)+hex+name.slice(1)}return name}var read_regexp=with_eof_error("Unterminated regular expression",function(source){var prev_backslash=false,ch,in_class=false;while(ch=next(true))if(NEWLINE_CHARS[ch]){parse_error("Unexpected line terminator")}else if(prev_backslash){source+="\\"+ch;prev_backslash=false}else if(ch=="["){in_class=true;source+=ch}else if(ch=="]"&&in_class){in_class=false;source+=ch}else if(ch=="/"&&!in_class){break}else if(ch=="\\"){prev_backslash=true}else{source+=ch}var mods=read_name();try{var regexp=new RegExp(source,mods);regexp.raw_source=source;return token("regexp",regexp)}catch(e){parse_error(e.message)}});function read_operator(prefix){function grow(op){if(!peek())return op;var bigger=op+peek();if(OPERATORS[bigger]){next();return grow(bigger)}else{return op}}return token("operator",grow(prefix||next()))}function handle_slash(){next();switch(peek()){case"/":next();return skip_line_comment("comment1");case"*":next();return skip_multiline_comment()}return S.regex_allowed?read_regexp(""):read_operator("/")}function handle_dot(){next();return is_digit(peek().charCodeAt(0))?read_num("."):token("punc",".")}function read_word(){var word=read_name();if(prev_was_dot)return token("name",word);return KEYWORDS_ATOM[word]?token("atom",word):!KEYWORDS[word]?token("name",word):OPERATORS[word]?token("operator",word):token("keyword",word)}function with_eof_error(eof_error,cont){return function(x){try{return cont(x)}catch(ex){if(ex===EX_EOF)parse_error(eof_error);else throw ex}}}function next_token(force_regexp){if(force_regexp!=null)return read_regexp(force_regexp);if(shebang&&S.pos==0&&looking_at("#!")){start_token();forward(2);skip_line_comment("comment5")}for(;;){skip_whitespace();start_token();if(html5_comments){if(looking_at("\x3c!--")){forward(4);skip_line_comment("comment3");continue}if(looking_at("--\x3e")&&S.newline_before){forward(3);skip_line_comment("comment4");continue}}var ch=peek();if(!ch)return token("eof");var code=ch.charCodeAt(0);switch(code){case 34:case 39:return read_string(ch);case 46:return handle_dot();case 47:{var tok=handle_slash();if(tok===next_token)continue;return tok}}if(is_digit(code))return read_num();if(PUNC_CHARS[ch])return token("punc",next());if(OPERATOR_CHARS[ch])return read_operator();if(code==92||is_identifier_start(code))return read_word();break}parse_error("Unexpected character '"+ch+"'")}next_token.context=function(nc){if(nc)S=nc;return S};next_token.add_directive=function(directive){S.directive_stack[S.directive_stack.length-1].push(directive);if(S.directives[directive]===undefined){S.directives[directive]=1}else{S.directives[directive]++}};next_token.push_directives_stack=function(){S.directive_stack.push([])};next_token.pop_directives_stack=function(){var directives=S.directive_stack[S.directive_stack.length-1];for(var i=0;i<directives.length;i++){S.directives[directives[i]]--}S.directive_stack.pop()};next_token.has_directive=function(directive){return S.directives[directive]>0};return next_token}var UNARY_PREFIX=makePredicate(["typeof","void","delete","--","++","!","~","-","+"]);var UNARY_POSTFIX=makePredicate(["--","++"]);var ASSIGNMENT=makePredicate(["=","+=","-=","/=","*=","%=",">>=","<<=",">>>=","|=","^=","&="]);var PRECEDENCE=function(a,ret){for(var i=0;i<a.length;++i){var b=a[i];for(var j=0;j<b.length;++j){ret[b[j]]=i+1}}return ret}([["||"],["&&"],["|"],["^"],["&"],["==","===","!=","!=="],["<",">","<=",">=","in","instanceof"],[">>","<<",">>>"],["+","-"],["*","/","%"]],{});var ATOMIC_START_TOKEN=makePredicate(["atom","num","string","regexp","name"]);function parse($TEXT,options){options=defaults(options,{bare_returns:false,expression:false,filename:null,html5_comments:true,shebang:true,strict:false,toplevel:null},true);var S={input:typeof $TEXT=="string"?tokenizer($TEXT,options.filename,options.html5_comments,options.shebang):$TEXT,token:null,prev:null,peeked:null,in_function:0,in_directives:true,in_loop:0,labels:[]};S.token=next();function is(type,value){return is_token(S.token,type,value)}function peek(){return S.peeked||(S.peeked=S.input())}function next(){S.prev=S.token;if(S.peeked){S.token=S.peeked;S.peeked=null}else{S.token=S.input()}S.in_directives=S.in_directives&&(S.token.type=="string"||is("punc",";"));return S.token}function prev(){return S.prev}function croak(msg,line,col,pos){var ctx=S.input.context();js_error(msg,ctx.filename,line!=null?line:ctx.tokline,col!=null?col:ctx.tokcol,pos!=null?pos:ctx.tokpos)}function token_error(token,msg){croak(msg,token.line,token.col)}function unexpected(token){if(token==null)token=S.token;token_error(token,"Unexpected token: "+token.type+" ("+token.value+")")}function expect_token(type,val){if(is(type,val)){return next()}token_error(S.token,"Unexpected token "+S.token.type+" «"+S.token.value+"»"+", expected "+type+" «"+val+"»")}function expect(punc){return expect_token("punc",punc)}function has_newline_before(token){return token.nlb||!all(token.comments_before,function(comment){return!comment.nlb})}function can_insert_semicolon(){return!options.strict&&(is("eof")||is("punc","}")||has_newline_before(S.token))}function semicolon(optional){if(is("punc",";"))next();else if(!optional&&!can_insert_semicolon())unexpected()}function parenthesised(){expect("(");var exp=expression(true);expect(")");return exp}function embed_tokens(parser){return function(){var start=S.token;var expr=parser.apply(null,arguments);var end=prev();expr.start=start;expr.end=end;return expr}}function handle_regexp(){if(is("operator","/")||is("operator","/=")){S.peeked=null;S.token=S.input(S.token.value.substr(1))}}var statement=embed_tokens(function(strict_defun){handle_regexp();switch(S.token.type){case"string":if(S.in_directives){var token=peek();if(S.token.raw.indexOf("\\")==-1&&(is_token(token,"punc",";")||is_token(token,"punc","}")||has_newline_before(token)||is_token(token,"eof"))){S.input.add_directive(S.token.value)}else{S.in_directives=false}}var dir=S.in_directives,stat=simple_statement();return dir?new AST_Directive(stat.body):stat;case"num":case"regexp":case"operator":case"atom":return simple_statement();case"name":return is_token(peek(),"punc",":")?labeled_statement():simple_statement();case"punc":switch(S.token.value){case"{":return new AST_BlockStatement({start:S.token,body:block_(),end:prev()});case"[":case"(":return simple_statement();case";":S.in_directives=false;next();return new AST_EmptyStatement;default:unexpected()}case"keyword":switch(S.token.value){case"break":next();return break_cont(AST_Break);case"continue":next();return break_cont(AST_Continue);case"debugger":next();semicolon();return new AST_Debugger;case"do":next();var body=in_loop(statement);expect_token("keyword","while");var condition=parenthesised();semicolon(true);return new AST_Do({body:body,condition:condition});case"while":next();return new AST_While({condition:parenthesised(),body:in_loop(statement)});case"for":next();return for_();case"function":if(!strict_defun&&S.input.has_directive("use strict")){croak("In strict mode code, functions can only be declared at top level or immediately within another function.")}next();return function_(AST_Defun);case"if":next();return if_();case"return":if(S.in_function==0&&!options.bare_returns)croak("'return' outside of function");next();var value=null;if(is("punc",";")){next()}else if(!can_insert_semicolon()){value=expression(true);semicolon()}return new AST_Return({value:value});case"switch":next();return new AST_Switch({expression:parenthesised(),body:in_loop(switch_body_)});case"throw":next();if(has_newline_before(S.token))croak("Illegal newline after 'throw'");var value=expression(true);semicolon();return new AST_Throw({value:value});case"try":next();return try_();case"var":next();var node=var_();semicolon();return node;case"with":if(S.input.has_directive("use strict")){croak("Strict mode may not include a with statement")}next();return new AST_With({expression:parenthesised(),body:statement()})}}unexpected()});function labeled_statement(){var label=as_symbol(AST_Label);if(!all(S.labels,function(l){return l.name!=label.name})){croak("Label "+label.name+" defined twice")}expect(":");S.labels.push(label);var stat=statement();S.labels.pop();if(!(stat instanceof AST_IterationStatement)){label.references.forEach(function(ref){if(ref instanceof AST_Continue){ref=ref.label.start;croak("Continue label `"+label.name+"` refers to non-IterationStatement.",ref.line,ref.col,ref.pos)}})}return new AST_LabeledStatement({body:stat,label:label})}function simple_statement(tmp){return new AST_SimpleStatement({body:(tmp=expression(true),semicolon(),tmp)})}function break_cont(type){var label=null,ldef;if(!can_insert_semicolon()){label=as_symbol(AST_LabelRef,true)}if(label!=null){ldef=find_if(function(l){return l.name==label.name},S.labels);if(!ldef)croak("Undefined label "+label.name);label.thedef=ldef}else if(S.in_loop==0)croak(type.TYPE+" not inside a loop or switch");semicolon();var stat=new type({label:label});if(ldef)ldef.references.push(stat);return stat}function for_(){expect("(");var init=null;if(!is("punc",";")){init=is("keyword","var")?(next(),var_(true)):expression(true,true);if(is("operator","in")){if(init instanceof AST_Var){if(init.definitions.length>1)croak("Only one variable declaration allowed in for..in loop",init.start.line,init.start.col,init.start.pos)}else if(!is_assignable(init)){croak("Invalid left-hand side in for..in loop",init.start.line,init.start.col,init.start.pos)}next();return for_in(init)}}return regular_for(init)}function regular_for(init){expect(";");var test=is("punc",";")?null:expression(true);expect(";");var step=is("punc",")")?null:expression(true);expect(")");return new AST_For({init:init,condition:test,step:step,body:in_loop(statement)})}function for_in(init){var obj=expression(true);expect(")");return new AST_ForIn({init:init,object:obj,body:in_loop(statement)})}var function_=function(ctor){var in_statement=ctor===AST_Defun;var name=is("name")?as_symbol(in_statement?AST_SymbolDefun:AST_SymbolLambda):null;if(in_statement&&!name)unexpected();if(name&&ctor!==AST_Accessor&&!(name instanceof AST_SymbolDeclaration))unexpected(prev());expect("(");var argnames=[];for(var first=true;!is("punc",")");){if(first)first=false;else expect(",");argnames.push(as_symbol(AST_SymbolFunarg))}next();var loop=S.in_loop;var labels=S.labels;++S.in_function;S.in_directives=true;S.input.push_directives_stack();S.in_loop=0;S.labels=[];var body=block_(true);if(S.input.has_directive("use strict")){if(name)strict_verify_symbol(name);argnames.forEach(strict_verify_symbol)}S.input.pop_directives_stack();--S.in_function;S.in_loop=loop;S.labels=labels;return new ctor({name:name,argnames:argnames,body:body})};function if_(){var cond=parenthesised(),body=statement(),belse=null;if(is("keyword","else")){next();belse=statement()}return new AST_If({condition:cond,body:body,alternative:belse})}function block_(strict_defun){expect("{");var a=[];while(!is("punc","}")){if(is("eof"))unexpected();a.push(statement(strict_defun))}next();return a}function switch_body_(){expect("{");var a=[],cur=null,branch=null,tmp;while(!is("punc","}")){if(is("eof"))unexpected();if(is("keyword","case")){if(branch)branch.end=prev();cur=[];branch=new AST_Case({start:(tmp=S.token,next(),tmp),expression:expression(true),body:cur});a.push(branch);expect(":")}else if(is("keyword","default")){if(branch)branch.end=prev();cur=[];branch=new AST_Default({start:(tmp=S.token,next(),expect(":"),tmp),body:cur});a.push(branch)}else{if(!cur)unexpected();cur.push(statement())}}if(branch)branch.end=prev();next();return a}function try_(){var body=block_(),bcatch=null,bfinally=null;if(is("keyword","catch")){var start=S.token;next();expect("(");var name=as_symbol(AST_SymbolCatch);expect(")");bcatch=new AST_Catch({start:start,argname:name,body:block_(),end:prev()})}if(is("keyword","finally")){var start=S.token;next();bfinally=new AST_Finally({start:start,body:block_(),end:prev()})}if(!bcatch&&!bfinally)croak("Missing catch/finally blocks");return new AST_Try({body:body,bcatch:bcatch,bfinally:bfinally})}function vardefs(no_in){var a=[];for(;;){a.push(new AST_VarDef({start:S.token,name:as_symbol(AST_SymbolVar),value:is("operator","=")?(next(),expression(false,no_in)):null,end:prev()}));if(!is("punc",","))break;next()}return a}var var_=function(no_in){return new AST_Var({start:prev(),definitions:vardefs(no_in),end:prev()})};var new_=function(allow_calls){var start=S.token;expect_token("operator","new");var newexp=expr_atom(false),args;if(is("punc","(")){next();args=expr_list(")")}else{args=[]}var call=new AST_New({start:start,expression:newexp,args:args,end:prev()});mark_pure(call);return subscripts(call,allow_calls)};function as_atom_node(){var tok=S.token,ret;switch(tok.type){case"name":ret=_make_symbol(AST_SymbolRef);break;case"num":ret=new AST_Number({start:tok,end:tok,value:tok.value});break;case"string":ret=new AST_String({start:tok,end:tok,value:tok.value,quote:tok.quote});break;case"regexp":ret=new AST_RegExp({start:tok,end:tok,value:tok.value});break;case"atom":switch(tok.value){case"false":ret=new AST_False({start:tok,end:tok});break;case"true":ret=new AST_True({start:tok,end:tok});break;case"null":ret=new AST_Null({start:tok,end:tok});break}break}next();return ret}var expr_atom=function(allow_calls){if(is("operator","new")){return new_(allow_calls)}var start=S.token;if(is("punc")){switch(start.value){case"(":next();var ex=expression(true);var len=start.comments_before.length;[].unshift.apply(ex.start.comments_before,start.comments_before);start.comments_before=ex.start.comments_before;start.comments_before_length=len;if(len==0&&start.comments_before.length>0){var comment=start.comments_before[0];if(!comment.nlb){comment.nlb=start.nlb;start.nlb=false}}start.comments_after=ex.start.comments_after;ex.start=start;expect(")");var end=prev();end.comments_before=ex.end.comments_before;[].push.apply(ex.end.comments_after,end.comments_after);end.comments_after=ex.end.comments_after;ex.end=end;if(ex instanceof AST_Call)mark_pure(ex);return subscripts(ex,allow_calls);case"[":return subscripts(array_(),allow_calls);case"{":return subscripts(object_(),allow_calls)}unexpected()}if(is("keyword","function")){next();var func=function_(AST_Function);func.start=start;func.end=prev();return subscripts(func,allow_calls)}if(ATOMIC_START_TOKEN[S.token.type]){return subscripts(as_atom_node(),allow_calls)}unexpected()};function expr_list(closing,allow_trailing_comma,allow_empty){var first=true,a=[];while(!is("punc",closing)){if(first)first=false;else expect(",");if(allow_trailing_comma&&is("punc",closing))break;if(is("punc",",")&&allow_empty){a.push(new AST_Hole({start:S.token,end:S.token}))}else{a.push(expression(false))}}next();return a}var array_=embed_tokens(function(){expect("[");return new AST_Array({elements:expr_list("]",!options.strict,true)})});var create_accessor=embed_tokens(function(){return function_(AST_Accessor)});var object_=embed_tokens(function(){expect("{");var first=true,a=[];while(!is("punc","}")){if(first)first=false;else expect(",");if(!options.strict&&is("punc","}"))break;var start=S.token;var type=start.type;var name=as_property_name();if(type=="name"&&!is("punc",":")){var key=new AST_SymbolAccessor({start:S.token,name:""+as_property_name(),end:prev()});if(name=="get"){a.push(new AST_ObjectGetter({start:start,key:key,value:create_accessor(),end:prev()}));continue}if(name=="set"){a.push(new AST_ObjectSetter({start:start,key:key,value:create_accessor(),end:prev()}));continue}}expect(":");a.push(new AST_ObjectKeyVal({start:start,quote:start.quote,key:""+name,value:expression(false),end:prev()}))}next();return new AST_Object({properties:a})});function as_property_name(){var tmp=S.token;switch(tmp.type){case"operator":if(!KEYWORDS[tmp.value])unexpected();case"num":case"string":case"name":case"keyword":case"atom":next();return tmp.value;default:unexpected()}}function as_name(){var tmp=S.token;if(tmp.type!="name")unexpected();next();return tmp.value}function _make_symbol(type){var name=S.token.value;return new(name=="this"?AST_This:type)({name:String(name),start:S.token,end:S.token})}function strict_verify_symbol(sym){if(sym.name=="arguments"||sym.name=="eval")croak("Unexpected "+sym.name+" in strict mode",sym.start.line,sym.start.col,sym.start.pos)}function as_symbol(type,noerror){if(!is("name")){if(!noerror)croak("Name expected");return null}var sym=_make_symbol(type);if(S.input.has_directive("use strict")&&sym instanceof AST_SymbolDeclaration){strict_verify_symbol(sym)}next();return sym}function mark_pure(call){var start=call.start;var comments=start.comments_before;var i=HOP(start,"comments_before_length")?start.comments_before_length:comments.length;while(--i>=0){var comment=comments[i];if(/[@#]__PURE__/.test(comment.value)){call.pure=comment;break}}}var subscripts=function(expr,allow_calls){var start=expr.start;if(is("punc",".")){next();return subscripts(new AST_Dot({start:start,expression:expr,property:as_name(),end:prev()}),allow_calls)}if(is("punc","[")){next();var prop=expression(true);expect("]");return subscripts(new AST_Sub({start:start,expression:expr,property:prop,end:prev()}),allow_calls)}if(allow_calls&&is("punc","(")){next();var call=new AST_Call({start:start,expression:expr,args:expr_list(")"),end:prev()});mark_pure(call);return subscripts(call,true)}return expr};var maybe_unary=function(allow_calls){var start=S.token;if(is("operator")&&UNARY_PREFIX[start.value]){next();handle_regexp();var ex=make_unary(AST_UnaryPrefix,start,maybe_unary(allow_calls));ex.start=start;ex.end=prev();return ex}var val=expr_atom(allow_calls);while(is("operator")&&UNARY_POSTFIX[S.token.value]&&!has_newline_before(S.token)){val=make_unary(AST_UnaryPostfix,S.token,val);val.start=start;val.end=S.token;next()}return val};function make_unary(ctor,token,expr){var op=token.value;switch(op){case"++":case"--":if(!is_assignable(expr))croak("Invalid use of "+op+" operator",token.line,token.col,token.pos);break;case"delete":if(expr instanceof AST_SymbolRef&&S.input.has_directive("use strict"))croak("Calling delete on expression not allowed in strict mode",expr.start.line,expr.start.col,expr.start.pos);break}return new ctor({operator:op,expression:expr})}var expr_op=function(left,min_prec,no_in){var op=is("operator")?S.token.value:null;if(op=="in"&&no_in)op=null;var prec=op!=null?PRECEDENCE[op]:null;if(prec!=null&&prec>min_prec){next();var right=expr_op(maybe_unary(true),prec,no_in);return expr_op(new AST_Binary({start:left.start,left:left,operator:op,right:right,end:right.end}),min_prec,no_in)}return left};function expr_ops(no_in){return expr_op(maybe_unary(true),0,no_in)}var maybe_conditional=function(no_in){var start=S.token;var expr=expr_ops(no_in);if(is("operator","?")){next();var yes=expression(false);expect(":");return new AST_Conditional({start:start,condition:expr,consequent:yes,alternative:expression(false,no_in),end:prev()})}return expr};function is_assignable(expr){return expr instanceof AST_PropAccess||expr instanceof AST_SymbolRef}var maybe_assign=function(no_in){var start=S.token;var left=maybe_conditional(no_in),val=S.token.value;if(is("operator")&&ASSIGNMENT[val]){if(is_assignable(left)){next();return new AST_Assign({start:start,left:left,operator:val,right:maybe_assign(no_in),end:prev()})}croak("Invalid assignment")}return left};var expression=function(commas,no_in){var start=S.token;var exprs=[];while(true){exprs.push(maybe_assign(no_in));if(!commas||!is("punc",","))break;next();commas=true}return exprs.length==1?exprs[0]:new AST_Sequence({start:start,expressions:exprs,end:peek()})};function in_loop(cont){++S.in_loop;var ret=cont();--S.in_loop;return ret}if(options.expression){return expression(true)}return function(){var start=S.token;var body=[];S.input.push_directives_stack();while(!is("eof"))body.push(statement(true));S.input.pop_directives_stack();var end=prev();var toplevel=options.toplevel;if(toplevel){toplevel.body=toplevel.body.concat(body);toplevel.end=end}else{toplevel=new AST_Toplevel({start:start,body:body,end:end})}return toplevel}()}"use strict";function TreeTransformer(before,after){TreeWalker.call(this);this.before=before;this.after=after}TreeTransformer.prototype=new TreeWalker;(function(DEF){function do_list(list,tw){return MAP(list,function(node){return node.transform(tw,true)})}DEF(AST_Node,noop);DEF(AST_LabeledStatement,function(self,tw){self.label=self.label.transform(tw);self.body=self.body.transform(tw)});DEF(AST_SimpleStatement,function(self,tw){self.body=self.body.transform(tw)});DEF(AST_Block,function(self,tw){self.body=do_list(self.body,tw)});DEF(AST_Do,function(self,tw){self.body=self.body.transform(tw);self.condition=self.condition.transform(tw)});DEF(AST_While,function(self,tw){self.condition=self.condition.transform(tw);self.body=self.body.transform(tw)});DEF(AST_For,function(self,tw){if(self.init)self.init=self.init.transform(tw);if(self.condition)self.condition=self.condition.transform(tw);if(self.step)self.step=self.step.transform(tw);self.body=self.body.transform(tw)});DEF(AST_ForIn,function(self,tw){self.init=self.init.transform(tw);self.object=self.object.transform(tw);self.body=self.body.transform(tw)});DEF(AST_With,function(self,tw){self.expression=self.expression.transform(tw);self.body=self.body.transform(tw)});DEF(AST_Exit,function(self,tw){if(self.value)self.value=self.value.transform(tw)});DEF(AST_LoopControl,function(self,tw){if(self.label)self.label=self.label.transform(tw)});DEF(AST_If,function(self,tw){self.condition=self.condition.transform(tw);self.body=self.body.transform(tw);if(self.alternative)self.alternative=self.alternative.transform(tw)});DEF(AST_Switch,function(self,tw){self.expression=self.expression.transform(tw);self.body=do_list(self.body,tw)});DEF(AST_Case,function(self,tw){self.expression=self.expression.transform(tw);self.body=do_list(self.body,tw)});DEF(AST_Try,function(self,tw){self.body=do_list(self.body,tw);if(self.bcatch)self.bcatch=self.bcatch.transform(tw);if(self.bfinally)self.bfinally=self.bfinally.transform(tw)});DEF(AST_Catch,function(self,tw){self.argname=self.argname.transform(tw);self.body=do_list(self.body,tw)});DEF(AST_Definitions,function(self,tw){self.definitions=do_list(self.definitions,tw)});DEF(AST_VarDef,function(self,tw){self.name=self.name.transform(tw);if(self.value)self.value=self.value.transform(tw)});DEF(AST_Lambda,function(self,tw){if(self.name)self.name=self.name.transform(tw);self.argnames=do_list(self.argnames,tw);self.body=do_list(self.body,tw)});DEF(AST_Call,function(self,tw){self.expression=self.expression.transform(tw);self.args=do_list(self.args,tw)});DEF(AST_Sequence,function(self,tw){self.expressions=do_list(self.expressions,tw)});DEF(AST_Dot,function(self,tw){self.expression=self.expression.transform(tw)});DEF(AST_Sub,function(self,tw){self.expression=self.expression.transform(tw);self.property=self.property.transform(tw)});DEF(AST_Unary,function(self,tw){self.expression=self.expression.transform(tw)});DEF(AST_Binary,function(self,tw){self.left=self.left.transform(tw);self.right=self.right.transform(tw)});DEF(AST_Conditional,function(self,tw){self.condition=self.condition.transform(tw);self.consequent=self.consequent.transform(tw);self.alternative=self.alternative.transform(tw)});DEF(AST_Array,function(self,tw){self.elements=do_list(self.elements,tw)});DEF(AST_Object,function(self,tw){self.properties=do_list(self.properties,tw)});DEF(AST_ObjectProperty,function(self,tw){self.value=self.value.transform(tw)})})(function(node,descend){node.DEFMETHOD("transform",function(tw,in_list){var x,y;tw.push(this);if(tw.before)x=tw.before(this,descend,in_list);if(typeof x==="undefined"){x=this;descend(x,tw);if(tw.after){y=tw.after(x,in_list);if(typeof y!=="undefined")x=y}}tw.pop();return x})});"use strict";function SymbolDef(scope,orig,init){this.name=orig.name;this.orig=[orig];this.init=init;this.eliminated=0;this.scope=scope;this.references=[];this.replaced=0;this.global=false;this.mangled_name=null;this.undeclared=false;this.id=SymbolDef.next_id++}SymbolDef.next_id=1;SymbolDef.prototype={unmangleable:function(options){if(!options)options={};return this.global&&!options.toplevel||this.undeclared||!options.eval&&this.scope.pinned()||options.keep_fnames&&(this.orig[0]instanceof AST_SymbolLambda||this.orig[0]instanceof AST_SymbolDefun)},mangle:function(options){var cache=options.cache&&options.cache.props;if(this.global&&cache&&cache.has(this.name)){this.mangled_name=cache.get(this.name)}else if(!this.mangled_name&&!this.unmangleable(options)){var def;if(def=this.redefined()){this.mangled_name=def.mangled_name||def.name}else{this.mangled_name=next_mangled_name(this.scope,options,this)}if(this.global&&cache){cache.set(this.name,this.mangled_name)}}},redefined:function(){return this.defun&&this.defun.variables.get(this.name)}};AST_Toplevel.DEFMETHOD("figure_out_scope",function(options){options=defaults(options,{cache:null,ie8:false});var self=this;var scope=self.parent_scope=null;var defun=null;var tw=new TreeWalker(function(node,descend){if(node instanceof AST_Catch){var save_scope=scope;scope=new AST_Scope(node);scope.init_scope_vars(save_scope);descend();scope=save_scope;return true}if(node instanceof AST_Scope){node.init_scope_vars(scope);var save_scope=scope;var save_defun=defun;defun=scope=node;descend();scope=save_scope;defun=save_defun;return true}if(node instanceof AST_With){for(var s=scope;s;s=s.parent_scope)s.uses_with=true;return}if(node instanceof AST_Symbol){node.scope=scope}if(node instanceof AST_Label){node.thedef=node;node.references=[]}if(node instanceof AST_SymbolDefun){(node.scope=defun.parent_scope.resolve()).def_function(node,defun)}else if(node instanceof AST_SymbolLambda){var def=defun.def_function(node,node.name=="arguments"?undefined:defun);if(options.ie8)def.defun=defun.parent_scope.resolve()}else if(node instanceof AST_SymbolVar){defun.def_variable(node,node.TYPE=="SymbolVar"?null:undefined);if(defun!==scope){node.mark_enclosed(options);var def=scope.find_variable(node);if(node.thedef!==def){node.thedef=def}node.reference(options)}}else if(node instanceof AST_SymbolCatch){scope.def_variable(node).defun=defun}});self.walk(tw);self.globals=new Dictionary;var tw=new TreeWalker(function(node){if(node instanceof AST_LoopControl){if(node.label)node.label.thedef.references.push(node);return true}if(node instanceof AST_SymbolRef){var name=node.name;if(name=="eval"&&tw.parent()instanceof AST_Call){for(var s=node.scope;s&&!s.uses_eval;s=s.parent_scope){s.uses_eval=true}}var sym=node.scope.find_variable(name);if(!sym){sym=self.def_global(node)}else if(sym.scope instanceof AST_Lambda&&name=="arguments"){sym.scope.uses_arguments=true}node.thedef=sym;node.reference(options);return true}if(node instanceof AST_SymbolCatch){var def=node.definition().redefined();if(def)for(var s=node.scope;s;s=s.parent_scope){push_uniq(s.enclosed,def);if(s===def.scope)break}return true}});self.walk(tw);if(options.ie8)self.walk(new TreeWalker(function(node){if(node instanceof AST_SymbolCatch){redefine(node,node.thedef.defun);return true}if(node instanceof AST_SymbolLambda){var def=node.thedef;if(def.orig.length==1){redefine(node,node.scope.parent_scope);node.thedef.init=def.init}return true}}));function redefine(node,scope){var name=node.name;var refs=node.thedef.references;var def=scope.find_variable(name)||self.globals.get(name)||scope.def_variable(node);refs.forEach(function(ref){ref.thedef=def;ref.reference(options)});node.thedef=def;node.reference(options)}});AST_Toplevel.DEFMETHOD("def_global",function(node){var globals=this.globals,name=node.name;if(globals.has(name)){return globals.get(name)}else{var g=new SymbolDef(this,node);g.undeclared=true;g.global=true;globals.set(name,g);return g}});AST_Scope.DEFMETHOD("init_scope_vars",function(parent_scope){this.variables=new Dictionary;this.functions=new Dictionary;this.uses_with=false;this.uses_eval=false;this.parent_scope=parent_scope;this.enclosed=[];this.cname=-1});AST_Lambda.DEFMETHOD("init_scope_vars",function(){AST_Scope.prototype.init_scope_vars.apply(this,arguments);this.uses_arguments=false;this.def_variable(new AST_SymbolFunarg({name:"arguments",start:this.start,end:this.end}))});AST_Symbol.DEFMETHOD("mark_enclosed",function(options){var def=this.definition();for(var s=this.scope;s;s=s.parent_scope){push_uniq(s.enclosed,def);if(options.keep_fnames){s.functions.each(function(d){push_uniq(def.scope.enclosed,d)})}if(s===def.scope)break}});AST_Symbol.DEFMETHOD("reference",function(options){this.definition().references.push(this);this.mark_enclosed(options)});AST_Scope.DEFMETHOD("find_variable",function(name){if(name instanceof AST_Symbol)name=name.name;return this.variables.get(name)||this.parent_scope&&this.parent_scope.find_variable(name)});AST_Scope.DEFMETHOD("def_function",function(symbol,init){var def=this.def_variable(symbol,init);if(!def.init||def.init instanceof AST_Defun)def.init=init;this.functions.set(symbol.name,def);return def});AST_Scope.DEFMETHOD("def_variable",function(symbol,init){var def=this.variables.get(symbol.name);if(def){def.orig.push(symbol);if(def.init&&(def.scope!==symbol.scope||def.init instanceof AST_Function)){def.init=init}}else{def=new SymbolDef(this,symbol,init);this.variables.set(symbol.name,def);def.global=!this.parent_scope}return symbol.thedef=def});AST_Lambda.DEFMETHOD("resolve",return_this);AST_Scope.DEFMETHOD("resolve",function(){return this.parent_scope});AST_Toplevel.DEFMETHOD("resolve",return_this);function names_in_use(scope,options){var names=scope.names_in_use;if(!names){scope.names_in_use=names=Object.create(scope.mangled_names||null);scope.cname_holes=[];scope.enclosed.forEach(function(def){if(def.unmangleable(options))names[def.name]=true})}return names}function next_mangled_name(scope,options,def){var in_use=names_in_use(scope,options);var holes=scope.cname_holes;var names=Object.create(null);var scopes=[scope];def.references.forEach(function(sym){var scope=sym.scope;do{if(scopes.indexOf(scope)<0){for(var name in names_in_use(scope,options)){names[name]=true}scopes.push(scope)}else break}while(scope=scope.parent_scope)});var name;for(var i=0,len=holes.length;i<len;i++){name=base54(holes[i]);if(names[name])continue;holes.splice(i,1);scope.names_in_use[name]=true;return name}while(true){name=base54(++scope.cname);if(in_use[name]||!is_identifier(name)||options.reserved.has[name])continue;if(!names[name])break;holes.push(scope.cname)}scope.names_in_use[name]=true;return name}AST_Symbol.DEFMETHOD("unmangleable",function(options){var def=this.definition();return!def||def.unmangleable(options)});AST_Label.DEFMETHOD("unmangleable",return_false);AST_Symbol.DEFMETHOD("unreferenced",function(){return!this.definition().references.length&&!this.scope.pinned()});AST_Symbol.DEFMETHOD("definition",function(){return this.thedef});AST_Symbol.DEFMETHOD("global",function(){return this.definition().global});function _default_mangler_options(options){options=defaults(options,{eval:false,ie8:false,keep_fnames:false,reserved:[],toplevel:false});if(!Array.isArray(options.reserved))options.reserved=[];push_uniq(options.reserved,"arguments");options.reserved.has=makePredicate(options.reserved);return options}AST_Toplevel.DEFMETHOD("mangle_names",function(options){options=_default_mangler_options(options);var lname=-1;if(options.cache&&options.cache.props){var mangled_names=this.mangled_names=Object.create(null);options.cache.props.each(function(mangled_name){mangled_names[mangled_name]=true})}var redefined=[];var tw=new TreeWalker(function(node,descend){if(node instanceof AST_LabeledStatement){var save_nesting=lname;descend();lname=save_nesting;return true}if(node instanceof AST_Scope){descend();if(options.cache&&node instanceof AST_Toplevel){node.globals.each(mangle)}node.variables.each(mangle);return true}if(node instanceof AST_Label){var name;do{name=base54(++lname)}while(!is_identifier(name));node.mangled_name=name;return true}if(!options.ie8&&node instanceof AST_Catch){var def=node.argname.definition();var redef=def.redefined();if(redef){redefined.push(def);reference(node.argname);def.references.forEach(reference)}descend();if(!redef)mangle(def);return true}function reference(sym){sym.thedef=redef;sym.reference(options);sym.thedef=def}});this.walk(tw);redefined.forEach(mangle);function mangle(def){if(options.reserved.has[def.name])return;def.mangle(options)}});AST_Toplevel.DEFMETHOD("find_colliding_names",function(options){var cache=options.cache&&options.cache.props;var avoid=Object.create(null);options.reserved.forEach(to_avoid);this.globals.each(add_def);this.walk(new TreeWalker(function(node){if(node instanceof AST_Scope)node.variables.each(add_def);if(node instanceof AST_SymbolCatch)add_def(node.definition())}));return avoid;function to_avoid(name){avoid[name]=true}function add_def(def){var name=def.name;if(def.global&&cache&&cache.has(name))name=cache.get(name);else if(!def.unmangleable(options))return;to_avoid(name)}});AST_Toplevel.DEFMETHOD("expand_names",function(options){base54.reset();base54.sort();options=_default_mangler_options(options);var avoid=this.find_colliding_names(options);var cname=0;this.globals.each(rename);this.walk(new TreeWalker(function(node){if(node instanceof AST_Scope)node.variables.each(rename);if(node instanceof AST_SymbolCatch)rename(node.definition())}));function next_name(){var name;do{name=base54(cname++)}while(avoid[name]||!is_identifier(name));return name}function rename(def){if(def.global&&options.cache)return;if(def.unmangleable(options))return;if(options.reserved.has[def.name])return;var d=def.redefined();def.name=d?d.name:next_name();def.orig.forEach(function(sym){sym.name=def.name});def.references.forEach(function(sym){sym.name=def.name})}});AST_Node.DEFMETHOD("tail_node",return_this);AST_Sequence.DEFMETHOD("tail_node",function(){return this.expressions[this.expressions.length-1]});AST_Toplevel.DEFMETHOD("compute_char_frequency",function(options){options=_default_mangler_options(options);base54.reset();try{AST_Node.prototype.print=function(stream,force_parens){this._print(stream,force_parens);if(this instanceof AST_Symbol&&!this.unmangleable(options)){base54.consider(this.name,-1)}else if(options.properties){if(this instanceof AST_Dot){base54.consider(this.property,-1)}else if(this instanceof AST_Sub){skip_string(this.property)}}};base54.consider(this.print_to_string(),1)}finally{AST_Node.prototype.print=AST_Node.prototype._print}base54.sort();function skip_string(node){if(node instanceof AST_String){base54.consider(node.value,-1)}else if(node instanceof AST_Conditional){skip_string(node.consequent);skip_string(node.alternative)}else if(node instanceof AST_Sequence){skip_string(node.tail_node())}}});var base54=function(){var freq=Object.create(null);function init(chars){var array=[];for(var i=0,len=chars.length;i<len;i++){var ch=chars[i];array.push(ch);freq[ch]=-.01*i}return array}var digits=init("0123456789");var leading=init("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$_");var chars,frequency;function reset(){frequency=Object.create(freq)}base54.consider=function(str,delta){for(var i=str.length;--i>=0;){frequency[str[i]]+=delta}};function compare(a,b){return frequency[b]-frequency[a]}base54.sort=function(){chars=leading.sort(compare).concat(digits.sort(compare))};base54.reset=reset;reset();function base54(num){var ret="",base=54;num++;do{num--;ret+=chars[num%base];num=Math.floor(num/base);base=64}while(num>0);return ret}return base54}();"use strict";var EXPECT_DIRECTIVE=/^$|[;{][\s\n]*$/;function is_some_comments(comment){return comment.type=="comment2"&&/@preserve|@license|@cc_on/i.test(comment.value)}function OutputStream(options){var readonly=!options;options=defaults(options,{ascii_only:false,beautify:false,braces:false,comments:false,ie8:false,indent_level:4,indent_start:0,inline_script:true,keep_quoted_props:false,max_line_len:false,preamble:null,preserve_line:false,quote_keys:false,quote_style:0,semicolons:true,shebang:true,source_map:null,webkit:false,width:80,wrap_iife:false},true);var comment_filter=return_false;if(options.comments){var comments=options.comments;if(typeof options.comments==="string"&&/^\/.*\/[a-zA-Z]*$/.test(options.comments)){var regex_pos=options.comments.lastIndexOf("/");comments=new RegExp(options.comments.substr(1,regex_pos-1),options.comments.substr(regex_pos+1))}if(comments instanceof RegExp){comment_filter=function(comment){return comment.type!="comment5"&&comments.test(comment.value)}}else if(typeof comments==="function"){comment_filter=function(comment){return comment.type!="comment5"&&comments(this,comment)}}else if(comments==="some"){comment_filter=is_some_comments}else{comment_filter=return_true}}var indentation=0;var current_col=0;var current_line=1;var current_pos=0;var OUTPUT="";var to_utf8=options.ascii_only?function(str,identifier){return str.replace(/[\u0000-\u001f\u007f-\uffff]/g,function(ch){var code=ch.charCodeAt(0).toString(16);if(code.length<=2&&!identifier){while(code.length<2)code="0"+code;return"\\x"+code}else{while(code.length<4)code="0"+code;return"\\u"+code}})}:function(str){var s="";for(var i=0,len=str.length;i<len;i++){if(is_surrogate_pair_head(str[i])&&!is_surrogate_pair_tail(str[i+1])||is_surrogate_pair_tail(str[i])&&!is_surrogate_pair_head(str[i-1])){s+="\\u"+str.charCodeAt(i).toString(16)}else{s+=str[i]}}return s};function make_string(str,quote){var dq=0,sq=0;str=str.replace(/[\\\b\f\n\r\v\t\x22\x27\u2028\u2029\0\ufeff]/g,function(s,i){switch(s){case'"':++dq;return'"';case"'":++sq;return"'";case"\\":return"\\\\";case"\n":return"\\n";case"\r":return"\\r";case"\t":return"\\t";case"\b":return"\\b";case"\f":return"\\f";case"\v":return options.ie8?"\\x0B":"\\v";case"\u2028":return"\\u2028";case"\u2029":return"\\u2029";case"\ufeff":return"\\ufeff";case"\0":return/[0-9]/.test(str.charAt(i+1))?"\\x00":"\\0"}return s});function quote_single(){return"'"+str.replace(/\x27/g,"\\'")+"'"}function quote_double(){return'"'+str.replace(/\x22/g,'\\"')+'"'}str=to_utf8(str);switch(options.quote_style){case 1:return quote_single();case 2:return quote_double();case 3:return quote=="'"?quote_single():quote_double();default:return dq>sq?quote_single():quote_double()}}function encode_string(str,quote){var ret=make_string(str,quote);if(options.inline_script){ret=ret.replace(/<\x2f(script)([>\/\t\n\f\r ])/gi,"<\\/$1$2");ret=ret.replace(/\x3c!--/g,"\\x3c!--");ret=ret.replace(/--\x3e/g,"--\\x3e")}return ret}function make_name(name){name=name.toString();name=to_utf8(name,true);return name}function make_indent(back){return repeat_string(" ",options.indent_start+indentation-back*options.indent_level)}var has_parens=false;var line_end=0;var line_fixed=true;var might_need_space=false;var might_need_semicolon=false;var need_newline_indented=false;var need_space=false;var newline_insert=-1;var last="";var mapping_token,mapping_name,mappings=options.source_map&&[];var adjust_mappings=mappings?function(line,col){mappings.forEach(function(mapping){mapping.line+=line;mapping.col+=col})}:noop;var flush_mappings=mappings?function(){mappings.forEach(function(mapping){try{options.source_map.add(mapping.token.file,mapping.line,mapping.col,mapping.token.line,mapping.token.col,!mapping.name&&mapping.token.type=="name"?mapping.token.value:mapping.name)}catch(ex){AST_Node.warn("Couldn't figure out mapping for {file}:{line},{col} → {cline},{ccol} [{name}]",{file:mapping.token.file,line:mapping.token.line,col:mapping.token.col,cline:mapping.line,ccol:mapping.col,name:mapping.name||""})}});mappings=[]}:noop;function insert_newlines(count){var index=OUTPUT.lastIndexOf("\n");if(line_end<index)line_end=index;var left=OUTPUT.slice(0,line_end);var right=OUTPUT.slice(line_end);adjust_mappings(count,right.length-current_col);current_line+=count;current_pos+=count;current_col=right.length;OUTPUT=left;while(count--)OUTPUT+="\n";OUTPUT+=right}var fix_line=options.max_line_len?function(){if(line_fixed){if(current_col>options.max_line_len){AST_Node.warn("Output exceeds {max_line_len} characters",options)}return}if(current_col>options.max_line_len)insert_newlines(1);line_fixed=true;flush_mappings()}:noop;var requireSemicolonChars=makePredicate("( [ + * / - , .");function print(str){str=String(str);var ch=str.charAt(0);if(need_newline_indented&&ch){need_newline_indented=false;if(ch!="\n"){print("\n");indent()}}if(need_space&&ch){need_space=false;if(!/[\s;})]/.test(ch)){space()}}newline_insert=-1;var prev=last.charAt(last.length-1);if(might_need_semicolon){might_need_semicolon=false;if(prev==":"&&ch=="}"||(!ch||";}".indexOf(ch)<0)&&prev!=";"){if(options.semicolons||requireSemicolonChars[ch]){OUTPUT+=";";current_col++;current_pos++}else{fix_line();OUTPUT+="\n";current_pos++;current_line++;current_col=0;if(/^\s+$/.test(str)){might_need_semicolon=true}}if(!options.beautify)might_need_space=false}}if(might_need_space){if(is_identifier_char(prev)&&(is_identifier_char(ch)||ch=="\\")||ch=="/"&&ch==prev||(ch=="+"||ch=="-")&&ch==last){OUTPUT+=" ";current_col++;current_pos++}might_need_space=false}if(mapping_token){mappings.push({token:mapping_token,name:mapping_name,line:current_line,col:current_col});mapping_token=false;if(line_fixed)flush_mappings()}OUTPUT+=str;has_parens=str[str.length-1]=="(";current_pos+=str.length;var a=str.split(/\r?\n/),n=a.length-1;current_line+=n;current_col+=a[0].length;if(n>0){fix_line();current_col=a[n].length}last=str}var space=options.beautify?function(){print(" ")}:function(){might_need_space=true};var indent=options.beautify?function(half){if(options.beautify){print(make_indent(half?.5:0))}}:noop;var with_indent=options.beautify?function(col,cont){if(col===true)col=next_indent();var save_indentation=indentation;indentation=col;var ret=cont();indentation=save_indentation;return ret}:function(col,cont){return cont()};var may_add_newline=options.max_line_len||options.preserve_line?function(){fix_line();line_end=OUTPUT.length;line_fixed=false}:noop;var newline=options.beautify?function(){if(newline_insert<0)return print("\n");if(OUTPUT[newline_insert]!="\n"){OUTPUT=OUTPUT.slice(0,newline_insert)+"\n"+OUTPUT.slice(newline_insert);current_pos++;current_line++}newline_insert++}:may_add_newline;var semicolon=options.beautify?function(){print(";")}:function(){might_need_semicolon=true};function force_semicolon(){might_need_semicolon=false;print(";")}function next_indent(){return indentation+options.indent_level}function with_block(cont){var ret;print("{");newline();with_indent(next_indent(),function(){ret=cont()});indent();print("}");return ret}function with_parens(cont){print("(");may_add_newline();var ret=cont();may_add_newline();print(")");return ret}function with_square(cont){print("[");may_add_newline();var ret=cont();may_add_newline();print("]");return ret}function comma(){may_add_newline();print(",");may_add_newline();space()}function colon(){print(":");space()}var add_mapping=mappings?function(token,name){mapping_token=token;mapping_name=name}:noop;function get(){if(!line_fixed)fix_line();return OUTPUT}function has_nlb(){var index=OUTPUT.lastIndexOf("\n");return/^ *$/.test(OUTPUT.slice(index+1))}function prepend_comments(node){var self=this;var start=node.start;if(!start)return;if(start.comments_before&&start.comments_before._dumped===self)return;var comments=start.comments_before;if(!comments){comments=start.comments_before=[]}comments._dumped=self;if(node instanceof AST_Exit&&node.value){var tw=new TreeWalker(function(node){var parent=tw.parent();if(parent instanceof AST_Exit||parent instanceof AST_Binary&&parent.left===node||parent.TYPE=="Call"&&parent.expression===node||parent instanceof AST_Conditional&&parent.condition===node||parent instanceof AST_Dot&&parent.expression===node||parent instanceof AST_Sequence&&parent.expressions[0]===node||parent instanceof AST_Sub&&parent.expression===node||parent instanceof AST_UnaryPostfix){var text=node.start.comments_before;if(text&&text._dumped!==self){text._dumped=self;comments=comments.concat(text)}}else{return true}});tw.push(node);node.value.walk(tw)}if(current_pos==0){if(comments.length>0&&options.shebang&&comments[0].type=="comment5"){print("#!"+comments.shift().value+"\n");indent()}var preamble=options.preamble;if(preamble){print(preamble.replace(/\r\n?|[\n\u2028\u2029]|\s*$/g,"\n"))}}comments=comments.filter(comment_filter,node);if(comments.length==0)return;var last_nlb=has_nlb();comments.forEach(function(c,i){if(!last_nlb){if(c.nlb){print("\n");indent();last_nlb=true}else if(i>0){space()}}if(/comment[134]/.test(c.type)){print("//"+c.value.replace(/[@#]__PURE__/g," ")+"\n");indent();last_nlb=true}else if(c.type=="comment2"){print("/*"+c.value.replace(/[@#]__PURE__/g," ")+"*/");last_nlb=false}});if(!last_nlb){if(start.nlb){print("\n");indent()}else{space()}}}function append_comments(node,tail){var self=this;var token=node.end;if(!token)return;var comments=token[tail?"comments_before":"comments_after"];if(!comments||comments._dumped===self)return;if(!(node instanceof AST_Statement||all(comments,function(c){return!/comment[134]/.test(c.type)})))return;comments._dumped=self;var insert=OUTPUT.length;comments.filter(comment_filter,node).forEach(function(c,i){need_space=false;if(need_newline_indented){print("\n");indent();need_newline_indented=false}else if(c.nlb&&(i>0||!has_nlb())){print("\n");indent()}else if(i>0||!tail){space()}if(/comment[134]/.test(c.type)){print("//"+c.value.replace(/[@#]__PURE__/g," "));need_newline_indented=true}else if(c.type=="comment2"){print("/*"+c.value.replace(/[@#]__PURE__/g," ")+"*/");need_space=true}});if(OUTPUT.length>insert)newline_insert=insert}var stack=[];return{get:get,toString:get,indent:indent,indentation:function(){return indentation},current_width:function(){return current_col-indentation},should_break:function(){return options.width&&this.current_width()>=options.width},has_parens:function(){return has_parens},newline:newline,print:print,space:space,comma:comma,colon:colon,last:function(){return last},semicolon:semicolon,force_semicolon:force_semicolon,to_utf8:to_utf8,print_name:function(name){print(make_name(name))},print_string:function(str,quote,escape_directive){var encoded=encode_string(str,quote);if(escape_directive===true&&encoded.indexOf("\\")===-1){if(!EXPECT_DIRECTIVE.test(OUTPUT)){force_semicolon()}force_semicolon()}print(encoded)},encode_string:encode_string,next_indent:next_indent,with_indent:with_indent,with_block:with_block,with_parens:with_parens,with_square:with_square,add_mapping:add_mapping,option:function(opt){return options[opt]},prepend_comments:readonly?noop:prepend_comments,append_comments:readonly||comment_filter===return_false?noop:append_comments,line:function(){return current_line},col:function(){return current_col},pos:function(){return current_pos},push_node:function(node){stack.push(node)},pop_node:options.preserve_line?function(){var node=stack.pop();if(node.start&&node.start.line>current_line){insert_newlines(node.start.line-current_line)}}:function(){stack.pop()},parent:function(n){return stack[stack.length-2-(n||0)]}}}(function(){function DEFPRINT(nodetype,generator){nodetype.DEFMETHOD("_codegen",generator)}var in_directive=false;var active_scope=null;var use_asm=null;AST_Node.DEFMETHOD("print",function(stream,force_parens){var self=this,generator=self._codegen;if(self instanceof AST_Scope){active_scope=self}else if(!use_asm&&self instanceof AST_Directive&&self.value=="use asm"){use_asm=active_scope}function doit(){stream.prepend_comments(self);self.add_source_map(stream);generator(self,stream);stream.append_comments(self)}stream.push_node(self);if(force_parens||self.needs_parens(stream)){stream.with_parens(doit)}else{doit()}stream.pop_node();if(self===use_asm){use_asm=null}});AST_Node.DEFMETHOD("_print",AST_Node.prototype.print);AST_Node.DEFMETHOD("print_to_string",function(options){var s=OutputStream(options);this.print(s);return s.get()});function PARENS(nodetype,func){if(Array.isArray(nodetype)){nodetype.forEach(function(nodetype){PARENS(nodetype,func)})}else{nodetype.DEFMETHOD("needs_parens",func)}}PARENS(AST_Node,return_false);PARENS(AST_Function,function(output){if(!output.has_parens()&&first_in_statement(output))return true;if(output.option("webkit")){var p=output.parent();if(p instanceof AST_PropAccess&&p.expression===this)return true}if(output.option("wrap_iife")){var p=output.parent();if(p instanceof AST_Call&&p.expression===this)return true}});PARENS(AST_Object,function(output){return!output.has_parens()&&first_in_statement(output)});PARENS(AST_Unary,function(output){var p=output.parent();return p instanceof AST_PropAccess&&p.expression===this||p instanceof AST_Call&&p.expression===this});PARENS(AST_Sequence,function(output){var p=output.parent();return p instanceof AST_Call||p instanceof AST_Unary||p instanceof AST_Binary||p instanceof AST_VarDef||p instanceof AST_PropAccess||p instanceof AST_Array||p instanceof AST_ObjectProperty||p instanceof AST_Conditional});PARENS(AST_Binary,function(output){var p=output.parent();if(p instanceof AST_Call&&p.expression===this)return true;if(p instanceof AST_Unary)return true;if(p instanceof AST_PropAccess&&p.expression===this)return true;if(p instanceof AST_Binary){var po=p.operator,pp=PRECEDENCE[po];var so=this.operator,sp=PRECEDENCE[so];if(pp>sp||pp==sp&&this===p.right){return true}}});PARENS(AST_PropAccess,function(output){var p=output.parent();if(p instanceof AST_New&&p.expression===this){var parens=false;this.walk(new TreeWalker(function(node){if(parens||node instanceof AST_Scope)return true;if(node instanceof AST_Call){parens=true;return true}}));return parens}});PARENS(AST_Call,function(output){var p=output.parent();if(p instanceof AST_New&&p.expression===this)return true;if(output.option("webkit")){var g=output.parent(1);return this.expression instanceof AST_Function&&p instanceof AST_PropAccess&&p.expression===this&&g instanceof AST_Assign&&g.left===p}});PARENS(AST_New,function(output){var p=output.parent();if(!need_constructor_parens(this,output)&&(p instanceof AST_PropAccess||p instanceof AST_Call&&p.expression===this))return true});PARENS(AST_Number,function(output){var p=output.parent();if(p instanceof AST_PropAccess&&p.expression===this){var value=this.getValue();if(value<0||/^0/.test(make_num(value))){return true}}});PARENS([AST_Assign,AST_Conditional],function(output){var p=output.parent();if(p instanceof AST_Unary)return true;if(p instanceof AST_Binary&&!(p instanceof AST_Assign))return true;if(p instanceof AST_Call&&p.expression===this)return true;if(p instanceof AST_Conditional&&p.condition===this)return true;if(p instanceof AST_PropAccess&&p.expression===this)return true});DEFPRINT(AST_Directive,function(self,output){output.print_string(self.value,self.quote);output.semicolon()});DEFPRINT(AST_Debugger,function(self,output){output.print("debugger");output.semicolon()});function display_body(body,is_toplevel,output,allow_directives){var last=body.length-1;in_directive=allow_directives;body.forEach(function(stmt,i){if(in_directive===true&&!(stmt instanceof AST_Directive||stmt instanceof AST_EmptyStatement||stmt instanceof AST_SimpleStatement&&stmt.body instanceof AST_String)){in_directive=false}if(!(stmt instanceof AST_EmptyStatement)){output.indent();stmt.print(output);if(!(i==last&&is_toplevel)){output.newline();if(is_toplevel)output.newline()}}if(in_directive===true&&stmt instanceof AST_SimpleStatement&&stmt.body instanceof AST_String){in_directive=false}});in_directive=false}AST_StatementWithBody.DEFMETHOD("_do_print_body",function(output){force_statement(this.body,output)});DEFPRINT(AST_Statement,function(self,output){self.body.print(output);output.semicolon()});DEFPRINT(AST_Toplevel,function(self,output){display_body(self.body,true,output,true);output.print("")});DEFPRINT(AST_LabeledStatement,function(self,output){self.label.print(output);output.colon();self.body.print(output)});DEFPRINT(AST_SimpleStatement,function(self,output){self.body.print(output);output.semicolon()});function print_braced_empty(self,output){output.print("{");output.with_indent(output.next_indent(),function(){output.append_comments(self,true)});output.print("}")}function print_braced(self,output,allow_directives){if(self.body.length>0){output.with_block(function(){display_body(self.body,false,output,allow_directives)})}else print_braced_empty(self,output)}DEFPRINT(AST_BlockStatement,function(self,output){print_braced(self,output)});DEFPRINT(AST_EmptyStatement,function(self,output){output.semicolon()});DEFPRINT(AST_Do,function(self,output){output.print("do");output.space();make_block(self.body,output);output.space();output.print("while");output.space();output.with_parens(function(){self.condition.print(output)});output.semicolon()});DEFPRINT(AST_While,function(self,output){output.print("while");output.space();output.with_parens(function(){self.condition.print(output)});output.space();self._do_print_body(output)});DEFPRINT(AST_For,function(self,output){output.print("for");output.space();output.with_parens(function(){if(self.init){if(self.init instanceof AST_Definitions){self.init.print(output)}else{parenthesize_for_noin(self.init,output,true)}output.print(";");output.space()}else{output.print(";")}if(self.condition){self.condition.print(output);output.print(";");output.space()}else{output.print(";")}if(self.step){self.step.print(output)}});output.space();self._do_print_body(output)});DEFPRINT(AST_ForIn,function(self,output){output.print("for");output.space();output.with_parens(function(){self.init.print(output);output.space();output.print("in");output.space();self.object.print(output)});output.space();self._do_print_body(output)});DEFPRINT(AST_With,function(self,output){output.print("with");output.space();output.with_parens(function(){self.expression.print(output)});output.space();self._do_print_body(output)});AST_Lambda.DEFMETHOD("_do_print",function(output,nokeyword){var self=this;if(!nokeyword){output.print("function")}if(self.name){output.space();self.name.print(output)}output.with_parens(function(){self.argnames.forEach(function(arg,i){if(i)output.comma();arg.print(output)})});output.space();print_braced(self,output,true)});DEFPRINT(AST_Lambda,function(self,output){self._do_print(output)});function print_jump(output,kind,target){output.print(kind);if(target){output.space();target.print(output)}output.semicolon()}DEFPRINT(AST_Return,function(self,output){print_jump(output,"return",self.value)});DEFPRINT(AST_Throw,function(self,output){print_jump(output,"throw",self.value)});DEFPRINT(AST_Break,function(self,output){print_jump(output,"break",self.label)});DEFPRINT(AST_Continue,function(self,output){print_jump(output,"continue",self.label)});function make_then(self,output){var b=self.body;if(output.option("braces")||output.option("ie8")&&b instanceof AST_Do)return make_block(b,output);if(!b)return output.force_semicolon();while(true){if(b instanceof AST_If){if(!b.alternative){make_block(self.body,output);return}b=b.alternative}else if(b instanceof AST_StatementWithBody){b=b.body}else break}force_statement(self.body,output)}DEFPRINT(AST_If,function(self,output){output.print("if");output.space();output.with_parens(function(){self.condition.print(output)});output.space();if(self.alternative){make_then(self,output);output.space();output.print("else");output.space();if(self.alternative instanceof AST_If)self.alternative.print(output);else force_statement(self.alternative,output)}else{self._do_print_body(output)}});DEFPRINT(AST_Switch,function(self,output){output.print("switch");output.space();output.with_parens(function(){self.expression.print(output)});output.space();var last=self.body.length-1;if(last<0)print_braced_empty(self,output);else output.with_block(function(){self.body.forEach(function(branch,i){output.indent(true);branch.print(output);if(i<last&&branch.body.length>0)output.newline()})})});AST_SwitchBranch.DEFMETHOD("_do_print_body",function(output){output.newline();this.body.forEach(function(stmt){output.indent();stmt.print(output);output.newline()})});DEFPRINT(AST_Default,function(self,output){output.print("default:");self._do_print_body(output)});DEFPRINT(AST_Case,function(self,output){output.print("case");output.space();self.expression.print(output);output.print(":");self._do_print_body(output)});DEFPRINT(AST_Try,function(self,output){output.print("try");output.space();print_braced(self,output);if(self.bcatch){output.space();self.bcatch.print(output)}if(self.bfinally){output.space();self.bfinally.print(output)}});DEFPRINT(AST_Catch,function(self,output){output.print("catch");output.space();output.with_parens(function(){self.argname.print(output)});output.space();print_braced(self,output)});DEFPRINT(AST_Finally,function(self,output){output.print("finally");output.space();print_braced(self,output)});DEFPRINT(AST_Var,function(self,output){output.print("var");output.space();self.definitions.forEach(function(def,i){if(i)output.comma();def.print(output)});var p=output.parent();if(p&&p.init!==self||!(p instanceof AST_For||p instanceof AST_ForIn))output.semicolon()});function parenthesize_for_noin(node,output,noin){var parens=false;if(noin)node.walk(new TreeWalker(function(node){if(parens||node instanceof AST_Scope)return true;if(node instanceof AST_Binary&&node.operator=="in"){parens=true;return true}}));node.print(output,parens)}DEFPRINT(AST_VarDef,function(self,output){self.name.print(output);if(self.value){output.space();output.print("=");output.space();var p=output.parent(1);var noin=p instanceof AST_For||p instanceof AST_ForIn;parenthesize_for_noin(self.value,output,noin)}});DEFPRINT(AST_Call,function(self,output){self.expression.print(output);if(self instanceof AST_New&&!need_constructor_parens(self,output))return;if(self.expression instanceof AST_Call||self.expression instanceof AST_Lambda){output.add_mapping(self.start)}output.with_parens(function(){self.args.forEach(function(expr,i){if(i)output.comma();expr.print(output)})})});DEFPRINT(AST_New,function(self,output){output.print("new");output.space();AST_Call.prototype._codegen(self,output)});DEFPRINT(AST_Sequence,function(self,output){self.expressions.forEach(function(node,index){if(index>0){output.comma();if(output.should_break()){output.newline();output.indent()}}node.print(output)})});DEFPRINT(AST_Dot,function(self,output){var expr=self.expression;expr.print(output);var prop=self.property;if(output.option("ie8")&&RESERVED_WORDS[prop]){output.print("[");output.add_mapping(self.end);output.print_string(prop);output.print("]")}else{if(expr instanceof AST_Number&&expr.getValue()>=0){if(!/[xa-f.)]/i.test(output.last())){output.print(".")}}output.print(".");output.add_mapping(self.end);output.print_name(prop)}});DEFPRINT(AST_Sub,function(self,output){self.expression.print(output);output.print("[");self.property.print(output);output.print("]")});DEFPRINT(AST_UnaryPrefix,function(self,output){var op=self.operator;output.print(op);if(/^[a-z]/i.test(op)||/[+-]$/.test(op)&&self.expression instanceof AST_UnaryPrefix&&/^[+-]/.test(self.expression.operator)){output.space()}self.expression.print(output)});DEFPRINT(AST_UnaryPostfix,function(self,output){self.expression.print(output);output.print(self.operator)});DEFPRINT(AST_Binary,function(self,output){var op=self.operator;self.left.print(output);if(op[0]==">"&&self.left instanceof AST_UnaryPostfix&&self.left.operator=="--"){output.print(" ")}else{output.space()}output.print(op);if((op=="<"||op=="<<")&&self.right instanceof AST_UnaryPrefix&&self.right.operator=="!"&&self.right.expression instanceof AST_UnaryPrefix&&self.right.expression.operator=="--"){output.print(" ")}else{output.space()}self.right.print(output)});DEFPRINT(AST_Conditional,function(self,output){self.condition.print(output);output.space();output.print("?");output.space();self.consequent.print(output);output.space();output.colon();self.alternative.print(output)});DEFPRINT(AST_Array,function(self,output){output.with_square(function(){var a=self.elements,len=a.length;if(len>0)output.space();a.forEach(function(exp,i){if(i)output.comma();exp.print(output);if(i===len-1&&exp instanceof AST_Hole)output.comma()});if(len>0)output.space()})});DEFPRINT(AST_Object,function(self,output){if(self.properties.length>0)output.with_block(function(){self.properties.forEach(function(prop,i){if(i){output.print(",");output.newline()}output.indent();prop.print(output)});output.newline()});else print_braced_empty(self,output)});function print_property_name(key,quote,output){if(output.option("quote_keys")){output.print_string(key)}else if(""+ +key==key&&key>=0){output.print(make_num(key))}else if(RESERVED_WORDS[key]?!output.option("ie8"):is_identifier_string(key)){if(quote&&output.option("keep_quoted_props")){output.print_string(key,quote)}else{output.print_name(key)}}else{output.print_string(key,quote)}}DEFPRINT(AST_ObjectKeyVal,function(self,output){print_property_name(self.key,self.quote,output);output.colon();self.value.print(output)});AST_ObjectProperty.DEFMETHOD("_print_getter_setter",function(type,output){output.print(type);output.space();print_property_name(this.key.name,this.quote,output);this.value._do_print(output,true)});DEFPRINT(AST_ObjectSetter,function(self,output){self._print_getter_setter("set",output)});DEFPRINT(AST_ObjectGetter,function(self,output){self._print_getter_setter("get",output)});DEFPRINT(AST_Symbol,function(self,output){var def=self.definition();output.print_name(def?def.mangled_name||def.name:self.name)});DEFPRINT(AST_Hole,noop);DEFPRINT(AST_This,function(self,output){output.print("this")});DEFPRINT(AST_Constant,function(self,output){output.print(self.getValue())});DEFPRINT(AST_String,function(self,output){output.print_string(self.getValue(),self.quote,in_directive)});DEFPRINT(AST_Number,function(self,output){if(use_asm&&self.start&&self.start.raw!=null){output.print(self.start.raw)}else{output.print(make_num(self.getValue()))}});DEFPRINT(AST_RegExp,function(self,output){var regexp=self.getValue();var str=regexp.toString();if(regexp.raw_source){str="/"+regexp.raw_source+str.slice(str.lastIndexOf("/"))}str=output.to_utf8(str);output.print(str);var p=output.parent();if(p instanceof AST_Binary&&/^in/.test(p.operator)&&p.left===self)output.print(" ")});function force_statement(stat,output){if(output.option("braces")){make_block(stat,output)}else{if(!stat||stat instanceof AST_EmptyStatement)output.force_semicolon();else stat.print(output)}}function need_constructor_parens(self,output){if(self.args.length>0)return true;return output.option("beautify")}function best_of(a){var best=a[0],len=best.length;for(var i=1;i<a.length;++i){if(a[i].length<len){best=a[i];len=best.length}}return best}function make_num(num){var str=num.toString(10).replace(/^0\./,".").replace("e+","e");var candidates=[str];if(Math.floor(num)===num){if(num<0){candidates.push("-0x"+(-num).toString(16).toLowerCase())}else{candidates.push("0x"+num.toString(16).toLowerCase())}}var match,len,digits;if(match=/^\.0+/.exec(str)){len=match[0].length;digits=str.slice(len);candidates.push(digits+"e-"+(digits.length+len-1))}else if(match=/0+$/.exec(str)){len=match[0].length;candidates.push(str.slice(0,-len)+"e"+len)}else if(match=/^(\d)\.(\d+)e(-?\d+)$/.exec(str)){candidates.push(match[1]+match[2]+"e"+(match[3]-match[2].length))}return best_of(candidates)}function make_block(stmt,output){if(!stmt||stmt instanceof AST_EmptyStatement)output.print("{}");else if(stmt instanceof AST_BlockStatement)stmt.print(output);else output.with_block(function(){output.indent();stmt.print(output);output.newline()})}function DEFMAP(nodetype,generator){nodetype.forEach(function(nodetype){nodetype.DEFMETHOD("add_source_map",generator)})}DEFMAP([AST_Node,AST_LabeledStatement,AST_Toplevel],noop);DEFMAP([AST_Array,AST_BlockStatement,AST_Catch,AST_Constant,AST_Debugger,AST_Definitions,AST_Directive,AST_Finally,AST_Jump,AST_Lambda,AST_New,AST_Object,AST_StatementWithBody,AST_Symbol,AST_Switch,AST_SwitchBranch,AST_Try],function(output){output.add_mapping(this.start)});DEFMAP([AST_ObjectGetter,AST_ObjectSetter],function(output){output.add_mapping(this.start,this.key.name)});DEFMAP([AST_ObjectProperty],function(output){output.add_mapping(this.start,this.key)})})();"use strict";function Compressor(options,false_by_default){if(!(this instanceof Compressor))return new Compressor(options,false_by_default);TreeTransformer.call(this,this.before,this.after);this.options=defaults(options,{arguments:!false_by_default,booleans:!false_by_default,collapse_vars:!false_by_default,comparisons:!false_by_default,conditionals:!false_by_default,dead_code:!false_by_default,directives:!false_by_default,drop_console:false,drop_debugger:!false_by_default,evaluate:!false_by_default,expression:false,global_defs:false,hoist_funs:false,hoist_props:!false_by_default,hoist_vars:false,ie8:false,if_return:!false_by_default,inline:!false_by_default,join_vars:!false_by_default,keep_fargs:true,keep_fnames:false,keep_infinity:false,loops:!false_by_default,negate_iife:!false_by_default,passes:1,properties:!false_by_default,pure_getters:!false_by_default&&"strict",pure_funcs:null,reduce_funcs:!false_by_default,reduce_vars:!false_by_default,sequences:!false_by_default,side_effects:!false_by_default,switches:!false_by_default,top_retain:null,toplevel:!!(options&&options["top_retain"]),typeofs:!false_by_default,unsafe:false,unsafe_comps:false,unsafe_Function:false,unsafe_math:false,unsafe_proto:false,unsafe_regexp:false,unsafe_undefined:false,unused:!false_by_default,warnings:false},true);var global_defs=this.options["global_defs"];if(typeof global_defs=="object")for(var key in global_defs){if(/^@/.test(key)&&HOP(global_defs,key)){global_defs[key.slice(1)]=parse(global_defs[key],{expression:true})}}if(this.options["inline"]===true)this.options["inline"]=3;var pure_funcs=this.options["pure_funcs"];if(typeof pure_funcs=="function"){this.pure_funcs=pure_funcs}else{this.pure_funcs=pure_funcs?function(node){return pure_funcs.indexOf(node.expression.print_to_string())<0}:return_true}var top_retain=this.options["top_retain"];if(top_retain instanceof RegExp){this.top_retain=function(def){return top_retain.test(def.name)}}else if(typeof top_retain=="function"){this.top_retain=top_retain}else if(top_retain){if(typeof top_retain=="string"){top_retain=top_retain.split(/,/)}this.top_retain=function(def){return top_retain.indexOf(def.name)>=0}}var toplevel=this.options["toplevel"];this.toplevel=typeof toplevel=="string"?{funcs:/funcs/.test(toplevel),vars:/vars/.test(toplevel)}:{funcs:toplevel,vars:toplevel};var sequences=this.options["sequences"];this.sequences_limit=sequences==1?800:sequences|0;this.warnings_produced={}}Compressor.prototype=new TreeTransformer;merge(Compressor.prototype,{option:function(key){return this.options[key]},exposed:function(def){if(def.global)for(var i=0,len=def.orig.length;i<len;i++)if(!this.toplevel[def.orig[i]instanceof AST_SymbolDefun?"funcs":"vars"])return true;return false},compress:function(node){node=node.resolve_defines(this);if(this.option("expression")){node.process_expression(true)}var passes=+this.options.passes||1;var min_count=1/0;var stopping=false;var mangle={ie8:this.option("ie8")};for(var pass=0;pass<passes;pass++){node.figure_out_scope(mangle);if(pass>0||this.option("reduce_vars"))node.reset_opt_flags(this);node=node.transform(this);if(passes>1){var count=0;node.walk(new TreeWalker(function(){count++}));this.info("pass "+pass+": last_count: "+min_count+", count: "+count);if(count<min_count){min_count=count;stopping=false}else if(stopping){break}else{stopping=true}}}if(this.option("expression")){node.process_expression(false)}return node},info:function(){if(this.options.warnings=="verbose"){AST_Node.warn.apply(AST_Node,arguments)}},warn:function(text,props){if(this.options.warnings){var message=string_template(text,props);if(!(message in this.warnings_produced)){this.warnings_produced[message]=true;AST_Node.warn.apply(AST_Node,arguments)}}},clear_warnings:function(){this.warnings_produced={}},before:function(node,descend,in_list){if(node._squeezed)return node;var is_scope=node instanceof AST_Scope;if(is_scope){node.hoist_properties(this);node.hoist_declarations(this)}descend(node,this);descend(node,this);var opt=node.optimize(this);if(is_scope){opt.drop_unused(this);descend(opt,this)}if(opt===node)opt._squeezed=true;return opt}});(function(OPT){OPT(AST_Node,function(self,compressor){return self});AST_Node.DEFMETHOD("equivalent_to",function(node){return this.TYPE==node.TYPE&&this.print_to_string()==node.print_to_string()});AST_Scope.DEFMETHOD("process_expression",function(insert,compressor){var self=this;var tt=new TreeTransformer(function(node){if(insert&&node instanceof AST_SimpleStatement){return make_node(AST_Return,node,{value:node.body})}if(!insert&&node instanceof AST_Return){if(compressor){var value=node.value&&node.value.drop_side_effect_free(compressor,true);return value?make_node(AST_SimpleStatement,node,{body:value}):make_node(AST_EmptyStatement,node)}return make_node(AST_SimpleStatement,node,{body:node.value||make_node(AST_UnaryPrefix,node,{operator:"void",expression:make_node(AST_Number,node,{value:0})})})}if(node instanceof AST_Lambda&&node!==self){return node}if(node instanceof AST_Block){var index=node.body.length-1;if(index>=0){node.body[index]=node.body[index].transform(tt)}}else if(node instanceof AST_If){node.body=node.body.transform(tt);if(node.alternative){node.alternative=node.alternative.transform(tt)}}else if(node instanceof AST_With){node.body=node.body.transform(tt)}return node});self.transform(tt)});function read_property(obj,key){key=get_value(key);if(key instanceof AST_Node)return;var value;if(obj instanceof AST_Array){var elements=obj.elements;if(key=="length")return make_node_from_constant(elements.length,obj);if(typeof key=="number"&&key in elements)value=elements[key]}else if(obj instanceof AST_Object){key=""+key;var props=obj.properties;for(var i=props.length;--i>=0;){var prop=props[i];if(!(prop instanceof AST_ObjectKeyVal))return;if(!value&&props[i].key===key)value=props[i].value}}return value instanceof AST_SymbolRef&&value.fixed_value()||value}function is_modified(compressor,tw,node,value,level,immutable){var parent=tw.parent(level);var lhs=is_lhs(node,parent);if(lhs)return lhs;if(!immutable&&parent instanceof AST_Call&&parent.expression===node&&!parent.is_expr_pure(compressor)&&(!(value instanceof AST_Function)||!(parent instanceof AST_New)&&value.contains_this())){return true}if(parent instanceof AST_Array){return is_modified(compressor,tw,parent,parent,level+1)}if(parent instanceof AST_ObjectKeyVal&&node===parent.value){var obj=tw.parent(level+1);return is_modified(compressor,tw,obj,obj,level+2)}if(parent instanceof AST_PropAccess&&parent.expression===node){var prop=read_property(value,parent.property);return!immutable&&is_modified(compressor,tw,parent,prop,level+1)}}(function(def){def(AST_Node,noop);function reset_def(tw,compressor,def){def.assignments=0;def.chained=false;def.direct_access=false;def.escaped=false;def.fixed=!def.scope.pinned()&&!compressor.exposed(def)&&!(def.init instanceof AST_Function&&def.init!==def.scope)&&def.init;if(def.fixed instanceof AST_Defun&&!all(def.references,function(ref){var scope=ref.scope;do{if(def.scope===scope)return true}while(scope instanceof AST_Function&&(scope=scope.parent_scope))})){tw.defun_ids[def.id]=false}def.recursive_refs=0;def.references=[];def.should_replace=undefined;def.single_use=undefined}function reset_variables(tw,compressor,scope){scope.variables.each(function(def){reset_def(tw,compressor,def);if(def.fixed===null){def.safe_ids=tw.safe_ids;mark(tw,def,true)}else if(def.fixed){tw.loop_ids[def.id]=tw.in_loop;mark(tw,def,true)}});scope.may_call_this=function(){scope.may_call_this=noop;if(!scope.contains_this())return;scope.functions.each(function(def){if(def.init instanceof AST_Defun&&!(def.id in tw.defun_ids)){tw.defun_ids[def.id]=false}})}}function mark_defun(tw,def){if(def.id in tw.defun_ids){var marker=tw.defun_ids[def.id];if(!marker)return;var visited=tw.defun_visited[def.id];if(marker===tw.safe_ids){if(!visited)return def.fixed}else if(visited){def.init.enclosed.forEach(function(d){if(def.init.variables.get(d.name)===d)return;if(!safe_to_read(tw,d))d.fixed=false})}else{tw.defun_ids[def.id]=false}}else{if(!tw.in_loop){tw.defun_ids[def.id]=tw.safe_ids;return def.fixed}tw.defun_ids[def.id]=false}}function walk_defuns(tw,scope){scope.functions.each(function(def){if(def.init instanceof AST_Defun&&!tw.defun_visited[def.id]){tw.defun_ids[def.id]=tw.safe_ids;def.init.walk(tw)}})}function push(tw){tw.safe_ids=Object.create(tw.safe_ids)}function pop(tw){tw.safe_ids=Object.getPrototypeOf(tw.safe_ids)}function mark(tw,def,safe){tw.safe_ids[def.id]=safe}function safe_to_read(tw,def){if(def.single_use=="m")return false;if(tw.safe_ids[def.id]){if(def.fixed==null){var orig=def.orig[0];if(orig instanceof AST_SymbolFunarg||orig.name=="arguments")return false;def.fixed=make_node(AST_Undefined,orig)}return true}return def.fixed instanceof AST_Defun}function safe_to_assign(tw,def,scope,value){if(def.fixed===undefined)return true;if(def.fixed===null&&def.safe_ids){def.safe_ids[def.id]=false;delete def.safe_ids;return true}if(!HOP(tw.safe_ids,def.id))return false;if(!safe_to_read(tw,def))return false;if(def.fixed===false)return false;if(def.fixed!=null&&(!value||def.references.length>def.assignments))return false;if(def.fixed instanceof AST_Defun){return value instanceof AST_Node&&def.fixed.parent_scope===scope}return all(def.orig,function(sym){return!(sym instanceof AST_SymbolDefun||sym instanceof AST_SymbolLambda)})}function ref_once(tw,compressor,def){return compressor.option("unused")&&!def.scope.pinned()&&def.references.length-def.recursive_refs==1&&tw.loop_ids[def.id]===tw.in_loop}function is_immutable(value){if(!value)return false;return value.is_constant()||value instanceof AST_Lambda||value instanceof AST_This}function mark_escaped(tw,d,scope,node,value,level,depth){var parent=tw.parent(level);if(value&&value.is_constant())return;if(parent instanceof AST_Assign&&parent.operator=="="&&node===parent.right||parent instanceof AST_Call&&(node!==parent.expression||parent instanceof AST_New)||parent instanceof AST_Exit&&node===parent.value&&node.scope!==d.scope||parent instanceof AST_VarDef&&node===parent.value){if(depth>1&&!(value&&value.is_constant_expression(scope)))depth=1;if(!d.escaped||d.escaped>depth)d.escaped=depth;return}else if(parent instanceof AST_Array||parent instanceof AST_Binary&&lazy_op[parent.operator]||parent instanceof AST_Conditional&&node!==parent.condition||parent instanceof AST_Sequence&&node===parent.tail_node()){mark_escaped(tw,d,scope,parent,parent,level+1,depth)}else if(parent instanceof AST_ObjectKeyVal&&node===parent.value){var obj=tw.parent(level+1);mark_escaped(tw,d,scope,obj,obj,level+2,depth)}else if(parent instanceof AST_PropAccess&&node===parent.expression){value=read_property(value,parent.property);mark_escaped(tw,d,scope,parent,value,level+1,depth+1);if(value)return}if(level>0)return;if(parent instanceof AST_Sequence&&node!==parent.tail_node())return;if(parent instanceof AST_SimpleStatement)return;d.direct_access=true}var suppressor=new TreeWalker(function(node){if(!(node instanceof AST_Symbol))return;var d=node.definition();if(!d)return;if(node instanceof AST_SymbolRef)d.references.push(node);d.fixed=false});def(AST_Accessor,function(tw,descend,compressor){push(tw);reset_variables(tw,compressor,this);descend();pop(tw);walk_defuns(tw,this);return true});def(AST_Assign,function(tw,descend,compressor){var node=this;var sym=node.left;if(!(sym instanceof AST_SymbolRef))return;var d=sym.definition();var safe=safe_to_assign(tw,d,sym.scope,node.right);d.assignments++;if(!safe)return;var fixed=d.fixed;if(!fixed&&node.operator!="=")return;var eq=node.operator=="=";var value=eq?node.right:node;if(is_modified(compressor,tw,node,value,0))return;d.references.push(sym);if(!eq)d.chained=true;d.fixed=eq?function(){return node.right}:function(){return make_node(AST_Binary,node,{operator:node.operator.slice(0,-1),left:fixed instanceof AST_Node?fixed:fixed(),right:node.right})};mark(tw,d,false);node.right.walk(tw);mark(tw,d,true);mark_escaped(tw,d,sym.scope,node,value,0,1);return true});def(AST_Binary,function(tw){if(!lazy_op[this.operator])return;this.left.walk(tw);push(tw);this.right.walk(tw);pop(tw);return true});def(AST_Call,function(tw,descend){tw.find_parent(AST_Scope).may_call_this();var exp=this.expression;if(!(exp instanceof AST_SymbolRef))return;var def=exp.definition();if(!(def.fixed instanceof AST_Defun))return;var defun=mark_defun(tw,def);if(!defun)return;descend();defun.walk(tw);return true});def(AST_Case,function(tw){push(tw);this.expression.walk(tw);pop(tw);push(tw);walk_body(this,tw);pop(tw);return true});def(AST_Conditional,function(tw){this.condition.walk(tw);push(tw);this.consequent.walk(tw);pop(tw);push(tw);this.alternative.walk(tw);pop(tw);return true});def(AST_Default,function(tw,descend){push(tw);descend();pop(tw);return true});def(AST_Defun,function(tw,descend,compressor){var id=this.name.definition().id;if(tw.defun_visited[id])return true;if(tw.defun_ids[id]!==tw.safe_ids)return true;tw.defun_visited[id]=true;this.inlined=false;push(tw);reset_variables(tw,compressor,this);descend();pop(tw);walk_defuns(tw,this);return true});def(AST_Do,function(tw){var saved_loop=tw.in_loop;tw.in_loop=this;push(tw);this.body.walk(tw);if(has_break_or_continue(this)){pop(tw);push(tw)}this.condition.walk(tw);pop(tw);tw.in_loop=saved_loop;return true});def(AST_For,function(tw){if(this.init)this.init.walk(tw);var saved_loop=tw.in_loop;tw.in_loop=this;push(tw);if(this.condition)this.condition.walk(tw);this.body.walk(tw);if(this.step){if(has_break_or_continue(this)){pop(tw);push(tw)}this.step.walk(tw)}pop(tw);tw.in_loop=saved_loop;return true});def(AST_ForIn,function(tw){this.init.walk(suppressor);this.object.walk(tw);var saved_loop=tw.in_loop;tw.in_loop=this;push(tw);this.body.walk(tw);pop(tw);tw.in_loop=saved_loop;return true});def(AST_Function,function(tw,descend,compressor){var node=this;node.inlined=false;push(tw);reset_variables(tw,compressor,node);var iife;if(!node.name&&(iife=tw.parent())instanceof AST_Call&&iife.expression===node){node.argnames.forEach(function(arg,i){var d=arg.definition();if(d.fixed===undefined&&(!node.uses_arguments||tw.has_directive("use strict"))){d.fixed=function(){return iife.args[i]||make_node(AST_Undefined,iife)};tw.loop_ids[d.id]=tw.in_loop;mark(tw,d,true)}else{d.fixed=false}})}descend();pop(tw);walk_defuns(tw,node);return true});def(AST_If,function(tw){this.condition.walk(tw);push(tw);this.body.walk(tw);pop(tw);if(this.alternative){push(tw);this.alternative.walk(tw);pop(tw)}return true});def(AST_LabeledStatement,function(tw){push(tw);this.body.walk(tw);pop(tw);return true});def(AST_SymbolCatch,function(){this.definition().fixed=false});def(AST_SymbolRef,function(tw,descend,compressor){var d=this.definition();d.references.push(this);if(d.references.length==1&&!d.fixed&&d.orig[0]instanceof AST_SymbolDefun){tw.loop_ids[d.id]=tw.in_loop}var value;if(d.fixed===undefined||!safe_to_read(tw,d)){d.fixed=false}else if(d.fixed){value=this.fixed_value();if(value instanceof AST_Lambda&&recursive_ref(tw,d)){d.recursive_refs++}else if(value&&ref_once(tw,compressor,d)){d.single_use=value instanceof AST_Lambda&&!value.pinned()||d.scope===this.scope&&value.is_constant_expression()}else{d.single_use=false}if(is_modified(compressor,tw,this,value,0,is_immutable(value))){if(d.single_use){d.single_use="m"}else{d.fixed=false}}}mark_escaped(tw,d,this.scope,this,value,0,1);var parent;if(d.fixed instanceof AST_Defun&&!((parent=tw.parent())instanceof AST_Call&&parent.expression===this)){var defun=mark_defun(tw,d);if(defun)defun.walk(tw)}});def(AST_Toplevel,function(tw,descend,compressor){this.globals.each(function(def){reset_def(tw,compressor,def)});push(tw);reset_variables(tw,compressor,this);descend();pop(tw);walk_defuns(tw,this);return true});def(AST_Try,function(tw){push(tw);walk_body(this,tw);pop(tw);if(this.bcatch){push(tw);this.bcatch.walk(tw);pop(tw)}if(this.bfinally)this.bfinally.walk(tw);return true});def(AST_Unary,function(tw,descend){var node=this;if(node.operator!="++"&&node.operator!="--")return;var exp=node.expression;if(!(exp instanceof AST_SymbolRef))return;var d=exp.definition();var safe=safe_to_assign(tw,d,exp.scope,true);d.assignments++;if(!safe)return;var fixed=d.fixed;if(!fixed)return;d.references.push(exp);d.chained=true;d.fixed=function(){return make_node(AST_Binary,node,{operator:node.operator.slice(0,-1),left:make_node(AST_UnaryPrefix,node,{operator:"+",expression:fixed instanceof AST_Node?fixed:fixed()}),right:make_node(AST_Number,node,{value:1})})};mark(tw,d,true);return true});def(AST_VarDef,function(tw,descend){var node=this;var d=node.name.definition();if(node.value){if(safe_to_assign(tw,d,node.name.scope,node.value)){d.fixed=function(){return node.value};tw.loop_ids[d.id]=tw.in_loop;mark(tw,d,false);descend();mark(tw,d,true);return true}else{d.fixed=false}}});def(AST_While,function(tw,descend){var saved_loop=tw.in_loop;tw.in_loop=this;push(tw);descend();pop(tw);tw.in_loop=saved_loop;return true})})(function(node,func){node.DEFMETHOD("reduce_vars",func)});AST_Toplevel.DEFMETHOD("reset_opt_flags",function(compressor){var tw=new TreeWalker(compressor.option("reduce_vars")?function(node,descend){node._squeezed=false;node._optimized=false;return node.reduce_vars(tw,descend,compressor)}:function(node){node._squeezed=false;node._optimized=false});tw.defun_ids=Object.create(null);tw.defun_visited=Object.create(null);tw.in_loop=null;tw.loop_ids=Object.create(null);tw.safe_ids=Object.create(null);this.walk(tw)});AST_Symbol.DEFMETHOD("fixed_value",function(){var fixed=this.definition().fixed;if(!fixed||fixed instanceof AST_Node)return fixed;return fixed()});AST_SymbolRef.DEFMETHOD("is_immutable",function(){var orig=this.definition().orig;return orig.length==1&&orig[0]instanceof AST_SymbolLambda});function is_lhs_read_only(lhs){if(lhs instanceof AST_This)return true;if(lhs instanceof AST_SymbolRef)return lhs.definition().orig[0]instanceof AST_SymbolLambda;if(lhs instanceof AST_PropAccess){lhs=lhs.expression;if(lhs instanceof AST_SymbolRef){if(lhs.is_immutable())return false;lhs=lhs.fixed_value()}if(!lhs)return true;if(lhs.is_constant())return true;return is_lhs_read_only(lhs)}return false}function find_variable(compressor,name){var scope,i=0;while(scope=compressor.parent(i++)){if(scope instanceof AST_Scope)break;if(scope instanceof AST_Catch){scope=scope.argname.definition().scope;break}}return scope.find_variable(name)}function make_node(ctor,orig,props){if(!props)props={};if(orig){if(!props.start)props.start=orig.start;if(!props.end)props.end=orig.end}return new ctor(props)}function make_sequence(orig,expressions){if(expressions.length==1)return expressions[0];return make_node(AST_Sequence,orig,{expressions:expressions.reduce(merge_sequence,[])})}function make_node_from_constant(val,orig){switch(typeof val){case"string":return make_node(AST_String,orig,{value:val});case"number":if(isNaN(val))return make_node(AST_NaN,orig);if(isFinite(val)){return 1/val<0?make_node(AST_UnaryPrefix,orig,{operator:"-",expression:make_node(AST_Number,orig,{value:-val})}):make_node(AST_Number,orig,{value:val})}return val<0?make_node(AST_UnaryPrefix,orig,{operator:"-",expression:make_node(AST_Infinity,orig)}):make_node(AST_Infinity,orig);case"boolean":return make_node(val?AST_True:AST_False,orig);case"undefined":return make_node(AST_Undefined,orig);default:if(val===null){return make_node(AST_Null,orig,{value:null})}if(val instanceof RegExp){return make_node(AST_RegExp,orig,{value:val})}throw new Error(string_template("Can't handle constant of type: {type}",{type:typeof val}))}}function needs_unbinding(compressor,val){return val instanceof AST_PropAccess||compressor.has_directive("use strict")&&is_undeclared_ref(val)&&val.name=="eval"}function maintain_this_binding(compressor,parent,orig,val){if(parent instanceof AST_UnaryPrefix&&parent.operator=="delete"||parent.TYPE=="Call"&&parent.expression===orig&&needs_unbinding(compressor,val)){return make_sequence(orig,[make_node(AST_Number,orig,{value:0}),val])}return val}function merge_sequence(array,node){if(node instanceof AST_Sequence){array.push.apply(array,node.expressions)}else{array.push(node)}return array}function as_statement_array(thing){if(thing===null)return[];if(thing instanceof AST_BlockStatement)return thing.body;if(thing instanceof AST_EmptyStatement)return[];if(thing instanceof AST_Statement)return[thing];throw new Error("Can't convert thing to statement array")}function is_empty(thing){if(thing===null)return true;if(thing instanceof AST_EmptyStatement)return true;if(thing instanceof AST_BlockStatement)return thing.body.length==0;return false}function loop_body(x){if(x instanceof AST_IterationStatement){return x.body instanceof AST_BlockStatement?x.body:x}return x}function root_expr(prop){while(prop instanceof AST_PropAccess)prop=prop.expression;return prop}function is_iife_call(node){if(node.TYPE!="Call")return false;return node.expression instanceof AST_Function||is_iife_call(node.expression)}function is_undeclared_ref(node){return node instanceof AST_SymbolRef&&node.definition().undeclared}var global_names=makePredicate("Array Boolean clearInterval clearTimeout console Date decodeURI decodeURIComponent encodeURI encodeURIComponent Error escape eval EvalError Function isFinite isNaN JSON Math Number parseFloat parseInt RangeError ReferenceError RegExp Object setInterval setTimeout String SyntaxError TypeError unescape URIError");AST_SymbolRef.DEFMETHOD("is_declared",function(compressor){return!this.definition().undeclared||compressor.option("unsafe")&&global_names[this.name]});var identifier_atom=makePredicate("Infinity NaN undefined");function is_identifier_atom(node){return node instanceof AST_Infinity||node instanceof AST_NaN||node instanceof AST_Undefined}function tighten_body(statements,compressor){var in_loop,in_try,scope;find_loop_scope_try();var CHANGED,max_iter=10;do{CHANGED=false;eliminate_spurious_blocks(statements);if(compressor.option("dead_code")){eliminate_dead_code(statements,compressor)}if(compressor.option("if_return")){handle_if_return(statements,compressor)}if(compressor.sequences_limit>0){sequencesize(statements,compressor);sequencesize_2(statements,compressor)}if(compressor.option("join_vars")){join_consecutive_vars(statements)}if(compressor.option("collapse_vars")){collapse(statements,compressor)}}while(CHANGED&&max_iter-- >0);function find_loop_scope_try(){var node=compressor.self(),level=0;do{if(node instanceof AST_Catch||node instanceof AST_Finally){level++}else if(node instanceof AST_IterationStatement){in_loop=true}else if(node instanceof AST_Scope){scope=node;break}else if(node instanceof AST_Try){in_try=true}}while(node=compressor.parent(level++))}function collapse(statements,compressor){if(scope.pinned())return statements;var args;var candidates=[];var stat_index=statements.length;var scanner=new TreeTransformer(function(node){if(abort)return node;if(!hit){if(node!==hit_stack[hit_index])return node;hit_index++;if(hit_index<hit_stack.length)return handle_custom_scan_order(node);hit=true;stop_after=find_stop(node,0);if(stop_after===node)abort=true;return node}var parent=scanner.parent();if(should_stop(node,parent)){abort=true;return node}if(!stop_if_hit&&in_conditional(node,parent)){stop_if_hit=parent}var hit_lhs,hit_rhs;if(can_replace&&!(node instanceof AST_SymbolDeclaration)&&(scan_lhs&&(hit_lhs=lhs.equivalent_to(node))||scan_rhs&&(hit_rhs=scan_rhs(node,this)))){if(stop_if_hit&&(hit_rhs||!lhs_local||!replace_all)){abort=true;return node}if(is_lhs(node,parent)){if(value_def)replaced++;return node}else{replaced++;if(value_def&&candidate instanceof AST_VarDef)return node}CHANGED=abort=true;compressor.info("Collapsing {name} [{file}:{line},{col}]",{name:node.print_to_string(),file:node.start.file,line:node.start.line,col:node.start.col});if(candidate instanceof AST_UnaryPostfix){return make_node(AST_UnaryPrefix,candidate,candidate)}if(candidate instanceof AST_VarDef){var def=candidate.name.definition();if(def.references.length-def.replaced==1&&!compressor.exposed(def)){def.replaced++;return maintain_this_binding(compressor,parent,node,candidate.value)}return make_node(AST_Assign,candidate,{operator:"=",left:make_node(AST_SymbolRef,candidate.name,candidate.name),right:candidate.value})}candidate.write_only=false;return candidate}var sym;if(is_last_node(node,parent)||may_throw(node)){stop_after=node;if(node instanceof AST_Scope)abort=true}return handle_custom_scan_order(node)},function(node){if(abort)return;if(stop_after===node)abort=true;if(stop_if_hit===node)stop_if_hit=null});var multi_replacer=new TreeTransformer(function(node){if(abort)return node;if(!hit){if(node!==hit_stack[hit_index])return node;hit_index++;if(hit_index<hit_stack.length)return;hit=true;return node}if(node instanceof AST_SymbolRef&&node.name==def.name){if(!--replaced)abort=true;if(is_lhs(node,multi_replacer.parent()))return node;def.replaced++;value_def.replaced--;return candidate.value.clone()}if(node instanceof AST_Default||node instanceof AST_Scope)return node});while(--stat_index>=0){if(stat_index==0&&compressor.option("unused"))extract_args();var hit_stack=[];extract_candidates(statements[stat_index]);while(candidates.length>0){hit_stack=candidates.pop();var hit_index=0;var candidate=hit_stack[hit_stack.length-1];var value_def=null;var stop_after=null;var stop_if_hit=null;var lhs=get_lhs(candidate);var rhs=get_rhs(candidate);var side_effects=lhs&&lhs.has_side_effects(compressor);var scan_lhs=lhs&&!side_effects&&!is_lhs_read_only(lhs);var scan_rhs=rhs&&foldable(rhs);if(!scan_lhs&&!scan_rhs)continue;var lvalues=get_lvalues(candidate);var lhs_local=is_lhs_local(lhs);if(!side_effects)side_effects=value_has_side_effects(candidate);var replace_all=replace_all_symbols();var may_throw=candidate.may_throw(compressor)?in_try?function(node){return node.has_side_effects(compressor)}:side_effects_external:return_false;var funarg=candidate.name instanceof AST_SymbolFunarg;var hit=funarg;var abort=false,replaced=0,can_replace=!args||!hit;if(!can_replace){for(var j=compressor.self().argnames.lastIndexOf(candidate.name)+1;!abort&&j<args.length;j++){args[j].transform(scanner)}can_replace=true}for(var i=stat_index;!abort&&i<statements.length;i++){statements[i].transform(scanner)}if(value_def){var def=candidate.name.definition();if(abort&&def.references.length-def.replaced>replaced)replaced=false;else{abort=false;hit_index=0;hit=funarg;for(var i=stat_index;!abort&&i<statements.length;i++){statements[i].transform(multi_replacer)}value_def.single_use=false}}if(replaced&&!remove_candidate(candidate))statements.splice(stat_index,1)}}function handle_custom_scan_order(node){if(node instanceof AST_Scope)return node;if(node instanceof AST_Switch){node.expression=node.expression.transform(scanner);for(var i=0,len=node.body.length;!abort&&i<len;i++){var branch=node.body[i];if(branch instanceof AST_Case){if(!hit){if(branch!==hit_stack[hit_index])continue;hit_index++}branch.expression=branch.expression.transform(scanner);if(!replace_all)break}}abort=true;return node}}function should_stop(node,parent){if(parent instanceof AST_For)return node!==parent.init;if(node instanceof AST_Assign){return node.operator!="="&&lhs.equivalent_to(node.left)}if(node instanceof AST_Call){return lhs instanceof AST_PropAccess&&lhs.equivalent_to(node.expression)}if(node instanceof AST_Debugger)return true;if(node instanceof AST_IterationStatement)return!(node instanceof AST_For);if(node instanceof AST_LoopControl)return true;if(node instanceof AST_Try)return true;if(node instanceof AST_With)return true;if(replace_all)return false;return node instanceof AST_SymbolRef&&!node.is_declared(compressor)}function in_conditional(node,parent){if(parent instanceof AST_Binary)return lazy_op[parent.operator]&&parent.left!==node;if(parent instanceof AST_Conditional)return parent.condition!==node;return parent instanceof AST_If&&parent.condition!==node}function is_last_node(node,parent){if(node instanceof AST_Call)return true;if(node instanceof AST_Exit){return side_effects||lhs instanceof AST_PropAccess||may_modify(lhs)}if(node instanceof AST_Function){return compressor.option("ie8")&&node.name&&node.name.name in lvalues}if(node instanceof AST_PropAccess){return side_effects||node.expression.may_throw_on_access(compressor)}if(node instanceof AST_SymbolRef){if(symbol_in_lvalues(node,parent)){return!parent||parent.operator!="="||parent.left!==node}return side_effects&&may_modify(node)}if(node instanceof AST_This)return symbol_in_lvalues(node,parent);if(node instanceof AST_VarDef){if(!node.value)return false;return node.name.name in lvalues||side_effects&&may_modify(node.name)}var sym=is_lhs(node.left,node);if(sym&&sym.name in lvalues)return true;if(sym instanceof AST_PropAccess)return true}function extract_args(){var iife,fn=compressor.self();if(fn instanceof AST_Function&&!fn.name&&!fn.uses_arguments&&!fn.pinned()&&(iife=compressor.parent())instanceof AST_Call&&iife.expression===fn){var fn_strict=compressor.has_directive("use strict");if(fn_strict&&!member(fn_strict,fn.body))fn_strict=false;var len=fn.argnames.length;args=iife.args.slice(len);var names=Object.create(null);for(var i=len;--i>=0;){var sym=fn.argnames[i];var arg=iife.args[i];args.unshift(make_node(AST_VarDef,sym,{name:sym,value:arg}));if(sym.name in names)continue;names[sym.name]=true;if(!arg){arg=make_node(AST_Undefined,sym).transform(compressor)}else if(arg instanceof AST_Lambda&&arg.pinned()){arg=null}else{arg.walk(new TreeWalker(function(node){if(!arg)return true;if(node instanceof AST_SymbolRef&&fn.variables.has(node.name)){var s=node.definition().scope;if(s!==scope)while(s=s.parent_scope){if(s===scope)return true}arg=null}if(node instanceof AST_This&&(fn_strict||!this.find_parent(AST_Scope))){arg=null;return true}}))}if(arg)candidates.unshift([make_node(AST_VarDef,sym,{name:sym,value:arg})])}}}function extract_candidates(expr){hit_stack.push(expr);if(expr instanceof AST_Assign){candidates.push(hit_stack.slice());extract_candidates(expr.right)}else if(expr instanceof AST_Binary){extract_candidates(expr.left);extract_candidates(expr.right)}else if(expr instanceof AST_Call){extract_candidates(expr.expression);expr.args.forEach(extract_candidates)}else if(expr instanceof AST_Case){extract_candidates(expr.expression)}else if(expr instanceof AST_Conditional){extract_candidates(expr.condition);extract_candidates(expr.consequent);extract_candidates(expr.alternative)}else if(expr instanceof AST_Definitions){expr.definitions.forEach(extract_candidates)}else if(expr instanceof AST_DWLoop){extract_candidates(expr.condition);if(!(expr.body instanceof AST_Block)){extract_candidates(expr.body)}}else if(expr instanceof AST_Exit){if(expr.value)extract_candidates(expr.value)}else if(expr instanceof AST_For){if(expr.init)extract_candidates(expr.init);if(expr.condition)extract_candidates(expr.condition);if(expr.step)extract_candidates(expr.step);if(!(expr.body instanceof AST_Block)){extract_candidates(expr.body)}}else if(expr instanceof AST_ForIn){extract_candidates(expr.object);if(!(expr.body instanceof AST_Block)){extract_candidates(expr.body)}}else if(expr instanceof AST_If){extract_candidates(expr.condition);if(!(expr.body instanceof AST_Block)){extract_candidates(expr.body)}if(expr.alternative&&!(expr.alternative instanceof AST_Block)){extract_candidates(expr.alternative)}}else if(expr instanceof AST_Sequence){expr.expressions.forEach(extract_candidates)}else if(expr instanceof AST_SimpleStatement){extract_candidates(expr.body)}else if(expr instanceof AST_Switch){extract_candidates(expr.expression);expr.body.forEach(extract_candidates)}else if(expr instanceof AST_Unary){if(expr.operator=="++"||expr.operator=="--"){candidates.push(hit_stack.slice())}else{extract_candidates(expr.expression)}}else if(expr instanceof AST_VarDef){if(expr.value){var def=expr.name.definition();if(def.references.length>def.replaced){candidates.push(hit_stack.slice())}extract_candidates(expr.value)}}hit_stack.pop()}function find_stop(node,level,write_only){var parent=scanner.parent(level);if(parent instanceof AST_Assign){if(write_only&&!(parent.left instanceof AST_PropAccess||parent.left.name in lvalues)){return find_stop(parent,level+1,write_only)}return node}if(parent instanceof AST_Binary){if(write_only&&(!lazy_op[parent.operator]||parent.left===node)){return find_stop(parent,level+1,write_only)}return node}if(parent instanceof AST_Call)return node;if(parent instanceof AST_Case)return node;if(parent instanceof AST_Conditional){if(write_only&&parent.condition===node){return find_stop(parent,level+1,write_only)}return node}if(parent instanceof AST_Definitions){return find_stop(parent,level+1,true)}if(parent instanceof AST_Exit){return write_only?find_stop(parent,level+1,write_only):node}if(parent instanceof AST_If){if(write_only&&parent.condition===node){return find_stop(parent,level+1,write_only)}return node}if(parent instanceof AST_IterationStatement)return node;if(parent instanceof AST_Sequence){return find_stop(parent,level+1,parent.tail_node()!==node)}if(parent instanceof AST_SimpleStatement){return find_stop(parent,level+1,true)}if(parent instanceof AST_Switch)return node;if(parent instanceof AST_Unary)return node;if(parent instanceof AST_VarDef)return node;return null}function mangleable_var(var_def){var value=var_def.value;if(!(value instanceof AST_SymbolRef))return;if(value.name=="arguments")return;var def=value.definition();if(def.undeclared)return;return value_def=def}function get_lhs(expr){if(expr instanceof AST_VarDef){var def=expr.name.definition();if(!member(expr.name,def.orig))return;var referenced=def.references.length-def.replaced;var declared=def.orig.length-def.eliminated;if(declared>1&&!(expr.name instanceof AST_SymbolFunarg)||(referenced>1?mangleable_var(expr):!compressor.exposed(def))){return make_node(AST_SymbolRef,expr.name,expr.name)}}else{return expr[expr instanceof AST_Assign?"left":"expression"]}}function get_rhs(expr){return candidate instanceof AST_Assign&&candidate.operator=="="&&candidate.right}function get_rvalue(expr){return expr[expr instanceof AST_Assign?"right":"value"]}function invariant(expr){if(expr instanceof AST_Array)return false;if(expr instanceof AST_Binary&&lazy_op[expr.operator]){return invariant(expr.left)&&invariant(expr.right)}if(expr instanceof AST_Call)return false;if(expr instanceof AST_Conditional){return invariant(expr.consequent)&&invariant(expr.alternative)}if(expr instanceof AST_Object)return false;return!expr.has_side_effects(compressor)}function foldable(expr){if(expr instanceof AST_SymbolRef){var value=expr.evaluate(compressor);if(value===expr)return rhs_exact_match;return rhs_fuzzy_match(value,rhs_exact_match)}if(expr instanceof AST_This)return rhs_exact_match;if(expr.is_truthy())return rhs_fuzzy_match(true,return_false);if(expr.is_constant()){return rhs_fuzzy_match(expr.evaluate(compressor),rhs_exact_match)}if(!(lhs instanceof AST_SymbolRef))return false;if(!invariant(expr))return false;var circular;var def=lhs.definition();expr.walk(new TreeWalker(function(node){if(circular)return true;if(node instanceof AST_SymbolRef&&node.definition()===def){circular=true}}));return!circular&&rhs_exact_match}function rhs_exact_match(node){return rhs.equivalent_to(node)}function rhs_fuzzy_match(value,fallback){return function(node,tw){if(tw.in_boolean_context()){if(value&&node.is_truthy()&&!node.has_side_effects(compressor)){return true}if(node.is_constant()){return!node.evaluate(compressor)==!value}}return fallback(node)}}function get_lvalues(expr){var lvalues=Object.create(null);if(candidate instanceof AST_VarDef){lvalues[candidate.name.name]=lhs}var tw=new TreeWalker(function(node){var sym=root_expr(node);if(sym instanceof AST_SymbolRef||sym instanceof AST_This){lvalues[sym.name]=lvalues[sym.name]||is_modified(compressor,tw,node,node,0)}});expr.walk(tw);return lvalues}function remove_candidate(expr){if(expr.name instanceof AST_SymbolFunarg){var index=compressor.self().argnames.indexOf(expr.name);var args=compressor.parent().args;if(args[index])args[index]=make_node(AST_Number,args[index],{value:0});return true}var found=false;return statements[stat_index].transform(new TreeTransformer(function(node,descend,in_list){if(found)return node;if(node===expr||node.body===expr){found=true;if(node instanceof AST_VarDef){node.value=null;return node}return in_list?MAP.skip:null}},function(node){if(node instanceof AST_Sequence)switch(node.expressions.length){case 0:return null;case 1:return node.expressions[0]}}))}function is_lhs_local(lhs){var sym=root_expr(lhs);return sym instanceof AST_SymbolRef&&sym.definition().scope===scope&&!(in_loop&&(sym.name in lvalues&&lvalues[sym.name]!==lhs||candidate instanceof AST_Unary||candidate instanceof AST_Assign&&candidate.operator!="="))}function value_has_side_effects(expr){if(expr instanceof AST_Unary)return false;return get_rvalue(expr).has_side_effects(compressor)}function replace_all_symbols(){if(side_effects)return false;if(value_def)return true;if(lhs instanceof AST_SymbolRef){var def=lhs.definition();if(def.references.length-def.replaced==(candidate instanceof AST_VarDef?1:2)){return true}}return false}function symbol_in_lvalues(sym,parent){var lvalue=lvalues[sym.name];if(!lvalue)return;if(lvalue!==lhs)return!(parent instanceof AST_Call);scan_rhs=false}function may_modify(sym){var def=sym.definition();if(def.orig.length==1&&def.orig[0]instanceof AST_SymbolDefun)return false;if(def.scope!==scope)return true;return!all(def.references,function(ref){return ref.scope.resolve()===scope})}function side_effects_external(node,lhs){if(node instanceof AST_Assign)return side_effects_external(node.left,true);if(node instanceof AST_Unary)return side_effects_external(node.expression,true);if(node instanceof AST_VarDef)return node.value&&side_effects_external(node.value);if(lhs){if(node instanceof AST_Dot)return side_effects_external(node.expression,true);if(node instanceof AST_Sub)return side_effects_external(node.expression,true);if(node instanceof AST_SymbolRef)return node.definition().scope!==scope}return false}}function eliminate_spurious_blocks(statements){var seen_dirs=[];for(var i=0;i<statements.length;){var stat=statements[i];if(stat instanceof AST_BlockStatement){CHANGED=true;eliminate_spurious_blocks(stat.body);[].splice.apply(statements,[i,1].concat(stat.body));i+=stat.body.length}else if(stat instanceof AST_EmptyStatement){CHANGED=true;statements.splice(i,1)}else if(stat instanceof AST_Directive){if(seen_dirs.indexOf(stat.value)<0){i++;seen_dirs.push(stat.value)}else{CHANGED=true;statements.splice(i,1)}}else i++}}function handle_if_return(statements,compressor){var self=compressor.self();var multiple_if_returns=has_multiple_if_returns(statements);var in_lambda=self instanceof AST_Lambda;for(var i=statements.length;--i>=0;){var stat=statements[i];var j=next_index(i);var next=statements[j];if(in_lambda&&!next&&stat instanceof AST_Return){if(!stat.value){CHANGED=true;statements.splice(i,1);continue}if(stat.value instanceof AST_UnaryPrefix&&stat.value.operator=="void"){CHANGED=true;statements[i]=make_node(AST_SimpleStatement,stat,{body:stat.value.expression});continue}}if(stat instanceof AST_If){var ab=aborts(stat.body);if(can_merge_flow(ab)){if(ab.label){remove(ab.label.thedef.references,ab)}CHANGED=true;stat=stat.clone();stat.condition=stat.condition.negate(compressor);var body=as_statement_array_with_return(stat.body,ab);stat.body=make_node(AST_BlockStatement,stat,{body:as_statement_array(stat.alternative).concat(extract_functions())});stat.alternative=make_node(AST_BlockStatement,stat,{body:body});statements[i]=stat.transform(compressor);continue}if(ab&&!stat.alternative&&stat.body instanceof AST_BlockStatement&&next instanceof AST_Jump){var negated=stat.condition.negate(compressor);if(negated.print_to_string().length<=stat.condition.print_to_string().length){CHANGED=true;stat=stat.clone();stat.condition=negated;statements[j]=stat.body;stat.body=next;statements[i]=stat.transform(compressor);continue}}var ab=aborts(stat.alternative);if(can_merge_flow(ab)){if(ab.label){remove(ab.label.thedef.references,ab)}CHANGED=true;stat=stat.clone();stat.body=make_node(AST_BlockStatement,stat.body,{body:as_statement_array(stat.body).concat(extract_functions())});var body=as_statement_array_with_return(stat.alternative,ab);stat.alternative=make_node(AST_BlockStatement,stat.alternative,{body:body});statements[i]=stat.transform(compressor);continue}}if(stat instanceof AST_If&&stat.body instanceof AST_Return){var value=stat.body.value;if(!value&&!stat.alternative&&(in_lambda&&!next||next instanceof AST_Return&&!next.value)){CHANGED=true;statements[i]=make_node(AST_SimpleStatement,stat.condition,{body:stat.condition});continue}if(value&&!stat.alternative&&next instanceof AST_Return&&next.value){CHANGED=true;stat=stat.clone();stat.alternative=next;statements.splice(i,1,stat.transform(compressor));statements.splice(j,1);continue}if(value&&!stat.alternative&&(!next&&in_lambda&&multiple_if_returns||next instanceof AST_Return)){CHANGED=true;stat=stat.clone();stat.alternative=next||make_node(AST_Return,stat,{value:null});statements.splice(i,1,stat.transform(compressor));if(next)statements.splice(j,1);continue}var prev=statements[prev_index(i)];if(compressor.option("sequences")&&in_lambda&&!stat.alternative&&prev instanceof AST_If&&prev.body instanceof AST_Return&&next_index(j)==statements.length&&next instanceof AST_SimpleStatement){CHANGED=true;stat=stat.clone();stat.alternative=make_node(AST_BlockStatement,next,{body:[next,make_node(AST_Return,next,{value:null})]});statements.splice(i,1,stat.transform(compressor));statements.splice(j,1);continue}}}function has_multiple_if_returns(statements){var n=0;for(var i=statements.length;--i>=0;){var stat=statements[i];if(stat instanceof AST_If&&stat.body instanceof AST_Return){if(++n>1)return true}}return false}function is_return_void(value){return!value||value instanceof AST_UnaryPrefix&&value.operator=="void"}function can_merge_flow(ab){if(!ab)return false;var lct=ab instanceof AST_LoopControl?compressor.loopcontrol_target(ab):null;return ab instanceof AST_Return&&in_lambda&&is_return_void(ab.value)||ab instanceof AST_Continue&&self===loop_body(lct)||ab instanceof AST_Break&&lct instanceof AST_BlockStatement&&self===lct}function extract_functions(){var tail=statements.slice(i+1);statements.length=i+1;return tail.filter(function(stat){if(stat instanceof AST_Defun){statements.push(stat);return false}return true})}function as_statement_array_with_return(node,ab){var body=as_statement_array(node).slice(0,-1);if(ab.value){body.push(make_node(AST_SimpleStatement,ab.value,{body:ab.value.expression}))}return body}function next_index(i){for(var j=i+1,len=statements.length;j<len;j++){var stat=statements[j];if(!(stat instanceof AST_Var&&declarations_only(stat))){break}}return j}function prev_index(i){for(var j=i;--j>=0;){var stat=statements[j];if(!(stat instanceof AST_Var&&declarations_only(stat))){break}}return j}}function eliminate_dead_code(statements,compressor){var has_quit;var self=compressor.self();for(var i=0,n=0,len=statements.length;i<len;i++){var stat=statements[i];if(stat instanceof AST_LoopControl){var lct=compressor.loopcontrol_target(stat);if(stat instanceof AST_Break&&!(lct instanceof AST_IterationStatement)&&loop_body(lct)===self||stat instanceof AST_Continue&&loop_body(lct)===self){if(stat.label){remove(stat.label.thedef.references,stat)}}else{statements[n++]=stat}}else{statements[n++]=stat}if(aborts(stat)){has_quit=statements.slice(i+1);break}}statements.length=n;CHANGED=n!=len;if(has_quit)has_quit.forEach(function(stat){extract_declarations_from_unreachable_code(compressor,stat,statements)})}function declarations_only(node){return all(node.definitions,function(var_def){return!var_def.value})}function sequencesize(statements,compressor){if(statements.length<2)return;var seq=[],n=0;function push_seq(){if(!seq.length)return;var body=make_sequence(seq[0],seq);statements[n++]=make_node(AST_SimpleStatement,body,{body:body});seq=[]}for(var i=0,len=statements.length;i<len;i++){var stat=statements[i];if(stat instanceof AST_SimpleStatement){if(seq.length>=compressor.sequences_limit)push_seq();var body=stat.body;if(seq.length>0)body=body.drop_side_effect_free(compressor);if(body)merge_sequence(seq,body)}else if(stat instanceof AST_Definitions&&declarations_only(stat)||stat instanceof AST_Defun){statements[n++]=stat}else{push_seq();statements[n++]=stat}}push_seq();statements.length=n;if(n!=len)CHANGED=true}function to_simple_statement(block,decls){if(!(block instanceof AST_BlockStatement))return block;var stat=null;for(var i=0,len=block.body.length;i<len;i++){var line=block.body[i];if(line instanceof AST_Var&&declarations_only(line)){decls.push(line)}else if(stat){return false}else{stat=line}}return stat}function sequencesize_2(statements,compressor){function cons_seq(right){n--;CHANGED=true;var left=prev.body;return make_sequence(left,[left,right]).transform(compressor)}var n=0,prev;for(var i=0;i<statements.length;i++){var stat=statements[i];if(prev){if(stat instanceof AST_Exit){stat.value=cons_seq(stat.value||make_node(AST_Undefined,stat).transform(compressor))}else if(stat instanceof AST_For){if(!(stat.init instanceof AST_Definitions)){var abort=false;prev.body.walk(new TreeWalker(function(node){if(abort||node instanceof AST_Scope)return true;if(node instanceof AST_Binary&&node.operator=="in"){abort=true;return true}}));if(!abort){if(stat.init)stat.init=cons_seq(stat.init);else{stat.init=prev.body;n--;CHANGED=true}}}}else if(stat instanceof AST_ForIn){stat.object=cons_seq(stat.object)}else if(stat instanceof AST_If){stat.condition=cons_seq(stat.condition)}else if(stat instanceof AST_Switch){stat.expression=cons_seq(stat.expression)}else if(stat instanceof AST_With){stat.expression=cons_seq(stat.expression)}}if(compressor.option("conditionals")&&stat instanceof AST_If){var decls=[];var body=to_simple_statement(stat.body,decls);var alt=to_simple_statement(stat.alternative,decls);if(body!==false&&alt!==false&&decls.length>0){var len=decls.length;decls.push(make_node(AST_If,stat,{condition:stat.condition,body:body||make_node(AST_EmptyStatement,stat.body),alternative:alt}));decls.unshift(n,1);[].splice.apply(statements,decls);i+=len;n+=len+1;prev=null;CHANGED=true;continue}}statements[n++]=stat;prev=stat instanceof AST_SimpleStatement?stat:null}statements.length=n}function join_assigns(defn,body){var exprs;if(body instanceof AST_Assign){exprs=[body]}else if(body instanceof AST_Sequence){exprs=body.expressions.slice()}if(!exprs)return;if(defn instanceof AST_Definitions){var def=defn.definitions[defn.definitions.length-1];if(trim_assigns(def.name,def.value,exprs))return exprs}for(var i=exprs.length-1;--i>=0;){var expr=exprs[i];if(!(expr instanceof AST_Assign))continue;if(expr.operator!="=")continue;if(!(expr.left instanceof AST_SymbolRef))continue;var tail=exprs.slice(i+1);if(!trim_assigns(expr.left,expr.right,tail))continue;return exprs.slice(0,i+1).concat(tail)}}function trim_assigns(name,value,exprs){if(!(value instanceof AST_Object))return;var trimmed=false;do{var node=exprs[0];if(!(node instanceof AST_Assign))break;if(node.operator!="=")break;if(!(node.left instanceof AST_PropAccess))break;var sym=node.left.expression;if(!(sym instanceof AST_SymbolRef))break;if(name.name!=sym.name)break;if(!node.right.is_constant_expression(scope))break;var prop=node.left.property;if(prop instanceof AST_Node){prop=prop.evaluate(compressor)}if(prop instanceof AST_Node)break;prop=""+prop;var diff=compressor.has_directive("use strict")?function(node){return node.key!=prop&&node.key.name!=prop}:function(node){return node.key.name!=prop};if(!all(value.properties,diff))break;value.properties.push(make_node(AST_ObjectKeyVal,node,{key:prop,value:node.right}));exprs.shift();trimmed=true}while(exprs.length);return trimmed}function join_consecutive_vars(statements){var defs;for(var i=0,j=-1,len=statements.length;i<len;i++){var stat=statements[i];var prev=statements[j];if(stat instanceof AST_Definitions){if(prev&&prev.TYPE==stat.TYPE){prev.definitions=prev.definitions.concat(stat.definitions);CHANGED=true}else if(defs&&defs.TYPE==stat.TYPE&&declarations_only(stat)){defs.definitions=defs.definitions.concat(stat.definitions);CHANGED=true}else{statements[++j]=stat;defs=stat}}else if(stat instanceof AST_Exit){stat.value=join_assigns_expr(stat.value)}else if(stat instanceof AST_For){var exprs=join_assigns(prev,stat.init);if(exprs){CHANGED=true;stat.init=exprs.length?make_sequence(stat.init,exprs):null;statements[++j]=stat}else if(prev instanceof AST_Var&&(!stat.init||stat.init.TYPE==prev.TYPE)){if(stat.init){prev.definitions=prev.definitions.concat(stat.init.definitions)}stat.init=prev;statements[j]=stat;CHANGED=true}else if(defs&&stat.init&&defs.TYPE==stat.init.TYPE&&declarations_only(stat.init)){defs.definitions=defs.definitions.concat(stat.init.definitions);stat.init=null;statements[++j]=stat;CHANGED=true}else{statements[++j]=stat}}else if(stat instanceof AST_ForIn){stat.object=join_assigns_expr(stat.object)}else if(stat instanceof AST_If){stat.condition=join_assigns_expr(stat.condition)}else if(stat instanceof AST_SimpleStatement){var exprs=join_assigns(prev,stat.body);if(exprs){CHANGED=true;if(!exprs.length)continue;stat.body=make_sequence(stat.body,exprs)}statements[++j]=stat}else if(stat instanceof AST_Switch){stat.expression=join_assigns_expr(stat.expression)}else if(stat instanceof AST_With){stat.expression=join_assigns_expr(stat.expression)}else{statements[++j]=stat}}statements.length=j+1;function join_assigns_expr(value){statements[++j]=stat;var exprs=join_assigns(prev,value);if(!exprs)return value;CHANGED=true;var tail=value.tail_node();if(exprs[exprs.length-1]!==tail)exprs.push(tail.left);return make_sequence(value,exprs)}}}function extract_declarations_from_unreachable_code(compressor,stat,target){if(!(stat instanceof AST_Defun)){compressor.warn("Dropping unreachable code [{file}:{line},{col}]",stat.start)}stat.walk(new TreeWalker(function(node){if(node instanceof AST_Definitions){compressor.warn("Declarations in unreachable code! [{file}:{line},{col}]",node.start);node.remove_initializers();target.push(node);return true}if(node instanceof AST_Defun){target.push(node);return true}if(node instanceof AST_Scope){return true}}))}function get_value(key){if(key instanceof AST_Constant){return key.getValue()}if(key instanceof AST_UnaryPrefix&&key.operator=="void"&&key.expression instanceof AST_Constant){return}return key}function is_undefined(node,compressor){return node.is_undefined||node instanceof AST_Undefined||node instanceof AST_UnaryPrefix&&node.operator=="void"&&!node.expression.has_side_effects(compressor)}(function(def){def(AST_Node,return_false);def(AST_Array,return_true);def(AST_Assign,function(){return this.operator=="="&&this.right.is_truthy()});def(AST_Lambda,return_true);def(AST_Object,return_true);def(AST_RegExp,return_true);def(AST_Sequence,function(){return this.tail_node().is_truthy()});def(AST_SymbolRef,function(){var fixed=this.fixed_value();return fixed&&fixed.is_truthy()})})(function(node,func){node.DEFMETHOD("is_truthy",func)});(function(def){AST_Node.DEFMETHOD("may_throw_on_access",function(compressor){return!compressor.option("pure_getters")||this._dot_throw(compressor)});function is_strict(compressor){return/strict/.test(compressor.option("pure_getters"))}def(AST_Node,is_strict);def(AST_Null,return_true);def(AST_Undefined,return_true);def(AST_Constant,return_false);def(AST_Array,return_false);def(AST_Object,function(compressor){if(!is_strict(compressor))return false;for(var i=this.properties.length;--i>=0;)if(this.properties[i].value instanceof AST_Accessor)return true;return false});def(AST_Lambda,return_false);def(AST_UnaryPostfix,return_false);def(AST_UnaryPrefix,function(){return this.operator=="void"});def(AST_Binary,function(compressor){return(this.operator=="&&"||this.operator=="||")&&(this.left._dot_throw(compressor)||this.right._dot_throw(compressor))});def(AST_Assign,function(compressor){return this.operator=="="&&this.right._dot_throw(compressor)});def(AST_Conditional,function(compressor){return this.consequent._dot_throw(compressor)||this.alternative._dot_throw(compressor)});def(AST_Dot,function(compressor){if(!is_strict(compressor))return false;var exp=this.expression;if(exp instanceof AST_SymbolRef)exp=exp.fixed_value();return!(exp instanceof AST_Lambda&&this.property=="prototype")});def(AST_Sequence,function(compressor){return this.tail_node()._dot_throw(compressor)});def(AST_SymbolRef,function(compressor){if(this.is_undefined)return true;if(!is_strict(compressor))return false;if(is_undeclared_ref(this)&&this.is_declared(compressor))return false;if(this.is_immutable())return false;var fixed=this.fixed_value();return!fixed||fixed._dot_throw(compressor)})})(function(node,func){node.DEFMETHOD("_dot_throw",func)});(function(def){def(AST_Node,return_false);def(AST_Assign,function(compressor){return this.operator=="="&&this.right.is_boolean(compressor)});var binary=makePredicate("in instanceof == != === !== < <= >= >");def(AST_Binary,function(compressor){return binary[this.operator]||lazy_op[this.operator]&&this.left.is_boolean(compressor)&&this.right.is_boolean(compressor)});def(AST_Boolean,return_true);var fn=makePredicate("every hasOwnProperty isPrototypeOf propertyIsEnumerable some");def(AST_Call,function(compressor){if(!compressor.option("unsafe"))return false;var exp=this.expression;return exp instanceof AST_Dot&&(fn[exp.property]||exp.property=="test"&&exp.expression instanceof AST_RegExp)});def(AST_Conditional,function(compressor){return this.consequent.is_boolean(compressor)&&this.alternative.is_boolean(compressor)});def(AST_New,return_false);def(AST_Sequence,function(compressor){return this.tail_node().is_boolean(compressor)});var unary=makePredicate("! delete");def(AST_UnaryPrefix,function(){return unary[this.operator]})})(function(node,func){node.DEFMETHOD("is_boolean",func)});(function(def){def(AST_Node,return_false);var binary=makePredicate("- * / % & | ^ << >> >>>");def(AST_Assign,function(compressor){return binary[this.operator.slice(0,-1)]||this.operator=="="&&this.right.is_number(compressor)});def(AST_Binary,function(compressor){return binary[this.operator]||this.operator=="+"&&this.left.is_number(compressor)&&this.right.is_number(compressor)});var fn=makePredicate(["charCodeAt","getDate","getDay","getFullYear","getHours","getMilliseconds","getMinutes","getMonth","getSeconds","getTime","getTimezoneOffset","getUTCDate","getUTCDay","getUTCFullYear","getUTCHours","getUTCMilliseconds","getUTCMinutes","getUTCMonth","getUTCSeconds","getYear","indexOf","lastIndexOf","localeCompare","push","search","setDate","setFullYear","setHours","setMilliseconds","setMinutes","setMonth","setSeconds","setTime","setUTCDate","setUTCFullYear","setUTCHours","setUTCMilliseconds","setUTCMinutes","setUTCMonth","setUTCSeconds","setYear","toExponential","toFixed","toPrecision"]);def(AST_Call,function(compressor){if(!compressor.option("unsafe"))return false;var exp=this.expression;return exp instanceof AST_Dot&&(fn[exp.property]||is_undeclared_ref(exp.expression)&&exp.expression.name=="Math")});def(AST_Conditional,function(compressor){return this.consequent.is_number(compressor)&&this.alternative.is_number(compressor)});def(AST_New,return_false);def(AST_Number,return_true);def(AST_Sequence,function(compressor){return this.tail_node().is_number(compressor)});var unary=makePredicate("+ - ~ ++ --");def(AST_Unary,function(){return unary[this.operator]})})(function(node,func){node.DEFMETHOD("is_number",func)});(function(def){def(AST_Node,return_false);def(AST_String,return_true);def(AST_UnaryPrefix,function(){return this.operator=="typeof"});def(AST_Binary,function(compressor){return this.operator=="+"&&(this.left.is_string(compressor)||this.right.is_string(compressor))});def(AST_Assign,function(compressor){return(this.operator=="="||this.operator=="+=")&&this.right.is_string(compressor)});def(AST_Sequence,function(compressor){return this.tail_node().is_string(compressor)});def(AST_Conditional,function(compressor){return this.consequent.is_string(compressor)&&this.alternative.is_string(compressor)})})(function(node,func){node.DEFMETHOD("is_string",func)});var lazy_op=makePredicate("&& ||");var unary_side_effects=makePredicate("delete ++ --");function is_lhs(node,parent){if(parent instanceof AST_Unary&&unary_side_effects[parent.operator])return parent.expression;if(parent instanceof AST_Assign&&parent.left===node)return node}(function(def){function to_node(value,orig){if(value instanceof AST_Node)return make_node(value.CTOR,orig,value);if(Array.isArray(value))return make_node(AST_Array,orig,{elements:value.map(function(value){return to_node(value,orig)})});if(value&&typeof value=="object"){var props=[];for(var key in value)if(HOP(value,key)){props.push(make_node(AST_ObjectKeyVal,orig,{key:key,value:to_node(value[key],orig)}))}return make_node(AST_Object,orig,{properties:props})}return make_node_from_constant(value,orig)}function warn(compressor,node){compressor.warn("global_defs "+node.print_to_string()+" redefined [{file}:{line},{col}]",node.start)}AST_Toplevel.DEFMETHOD("resolve_defines",function(compressor){if(!compressor.option("global_defs"))return this;this.figure_out_scope({ie8:compressor.option("ie8")});return this.transform(new TreeTransformer(function(node){var def=node._find_defs(compressor,"");if(!def)return;var level=0,child=node,parent;while(parent=this.parent(level++)){if(!(parent instanceof AST_PropAccess))break;if(parent.expression!==child)break;child=parent}if(is_lhs(child,parent)){warn(compressor,node);return}return def}))});def(AST_Node,noop);def(AST_Dot,function(compressor,suffix){return this.expression._find_defs(compressor,"."+this.property+suffix)});def(AST_SymbolDeclaration,function(compressor){if(!this.global())return;if(HOP(compressor.option("global_defs"),this.name))warn(compressor,this)});def(AST_SymbolRef,function(compressor,suffix){if(!this.global())return;var defines=compressor.option("global_defs");var name=this.name+suffix;if(HOP(defines,name))return to_node(defines[name],this)})})(function(node,func){node.DEFMETHOD("_find_defs",func)});function best_of_expression(ast1,ast2){return ast1.print_to_string().length>ast2.print_to_string().length?ast2:ast1}function best_of_statement(ast1,ast2){return best_of_expression(make_node(AST_SimpleStatement,ast1,{body:ast1}),make_node(AST_SimpleStatement,ast2,{body:ast2})).body}function best_of(compressor,ast1,ast2){return(first_in_statement(compressor)?best_of_statement:best_of_expression)(ast1,ast2)}function convert_to_predicate(obj){for(var key in obj){obj[key]=makePredicate(obj[key])}}var object_fns=["constructor","toString","valueOf"];var native_fns={Array:["indexOf","join","lastIndexOf","slice"].concat(object_fns),Boolean:object_fns,Function:object_fns,Number:["toExponential","toFixed","toPrecision"].concat(object_fns),Object:object_fns,RegExp:["test"].concat(object_fns),String:["charAt","charCodeAt","concat","indexOf","italics","lastIndexOf","match","replace","search","slice","split","substr","substring","toLowerCase","toUpperCase","trim"].concat(object_fns)};convert_to_predicate(native_fns);var static_fns={Array:["isArray"],Math:["abs","acos","asin","atan","ceil","cos","exp","floor","log","round","sin","sqrt","tan","atan2","pow","max","min"],Number:["isFinite","isNaN"],Object:["create","getOwnPropertyDescriptor","getOwnPropertyNames","getPrototypeOf","isExtensible","isFrozen","isSealed","keys"],String:["fromCharCode"]};convert_to_predicate(static_fns);(function(def){AST_Node.DEFMETHOD("evaluate",function(compressor){if(!compressor.option("evaluate"))return this;var cached=[];var val=this._eval(compressor,cached,1);cached.forEach(function(node){delete node._eval});if(!val||val instanceof RegExp)return val;if(typeof val=="function"||typeof val=="object")return this;return val});var unaryPrefix=makePredicate("! ~ - + void");AST_Node.DEFMETHOD("is_constant",function(){if(this instanceof AST_Constant){return!(this instanceof AST_RegExp)}else{return this instanceof AST_UnaryPrefix&&this.expression instanceof AST_Constant&&unaryPrefix[this.operator]}});def(AST_Statement,function(){throw new Error(string_template("Cannot evaluate a statement [{file}:{line},{col}]",this.start))});def(AST_Lambda,return_this);def(AST_Node,return_this);def(AST_Constant,function(){return this.getValue()});def(AST_Function,function(compressor){if(compressor.option("unsafe")){var fn=function(){};fn.node=this;fn.toString=function(){return"function(){}"};return fn}return this});def(AST_Array,function(compressor,cached,depth){if(compressor.option("unsafe")){var elements=[];for(var i=0,len=this.elements.length;i<len;i++){var element=this.elements[i];var value=element._eval(compressor,cached,depth);if(element===value)return this;elements.push(value)}return elements}return this});def(AST_Object,function(compressor,cached,depth){if(compressor.option("unsafe")){var val={};for(var i=0,len=this.properties.length;i<len;i++){var prop=this.properties[i];var key=prop.key;if(key instanceof AST_Symbol){key=key.name}else if(key instanceof AST_Node){key=key._eval(compressor,cached,depth);if(key===prop.key)return this}if(typeof Object.prototype[key]==="function"){return this}if(prop.value instanceof AST_Function)continue;val[key]=prop.value._eval(compressor,cached,depth);if(val[key]===prop.value)return this}return val}return this});var non_converting_unary=makePredicate("! typeof void");def(AST_UnaryPrefix,function(compressor,cached,depth){var e=this.expression;if(compressor.option("typeofs")&&this.operator=="typeof"&&(e instanceof AST_Lambda||e instanceof AST_SymbolRef&&e.fixed_value()instanceof AST_Lambda)){return typeof function(){}}if(!non_converting_unary[this.operator])depth++;e=e._eval(compressor,cached,depth);if(e===this.expression)return this;switch(this.operator){case"!":return!e;case"typeof":if(e instanceof RegExp)return this;return typeof e;case"void":return void e;case"~":return~e;case"-":return-e;case"+":return+e}return this});var non_converting_binary=makePredicate("&& || === !==");def(AST_Binary,function(compressor,cached,depth){if(!non_converting_binary[this.operator])depth++;var left=this.left._eval(compressor,cached,depth);if(left===this.left)return this;var right=this.right._eval(compressor,cached,depth);if(right===this.right)return this;var result;switch(this.operator){case"&&":result=left&&right;break;case"||":result=left||right;break;case"|":result=left|right;break;case"&":result=left&right;break;case"^":result=left^right;break;case"+":result=left+right;break;case"*":result=left*right;break;case"/":result=left/right;break;case"%":result=left%right;break;case"-":result=left-right;break;case"<<":result=left<<right;break;case">>":result=left>>right;break;case">>>":result=left>>>right;break;case"==":result=left==right;break;case"===":result=left===right;break;case"!=":result=left!=right;break;case"!==":result=left!==right;break;case"<":result=left<right;break;case"<=":result=left<=right;break;case">":result=left>right;break;case">=":result=left>=right;break;default:return this}return isNaN(result)&&compressor.find_parent(AST_With)?this:result});def(AST_Conditional,function(compressor,cached,depth){var condition=this.condition._eval(compressor,cached,depth);if(condition===this.condition)return this;var node=condition?this.consequent:this.alternative;var value=node._eval(compressor,cached,depth);return value===node?this:value});def(AST_SymbolRef,function(compressor,cached,depth){var fixed=this.fixed_value();if(!fixed)return this;var value;if(cached.indexOf(fixed)>=0){value=fixed._eval()}else{this._eval=return_this;value=fixed._eval(compressor,cached,depth);delete this._eval;if(value===fixed)return this;fixed._eval=function(){return value};cached.push(fixed)}if(value&&typeof value=="object"){var escaped=this.definition().escaped;if(escaped&&depth>escaped)return this}return value});var global_objs={Array:Array,Math:Math,Number:Number,Object:Object,String:String};var static_values={Math:["E","LN10","LN2","LOG2E","LOG10E","PI","SQRT1_2","SQRT2"],Number:["MAX_VALUE","MIN_VALUE","NaN","NEGATIVE_INFINITY","POSITIVE_INFINITY"]};convert_to_predicate(static_values);def(AST_PropAccess,function(compressor,cached,depth){if(compressor.option("unsafe")){var key=this.property;if(key instanceof AST_Node){key=key._eval(compressor,cached,depth);if(key===this.property)return this}var exp=this.expression;var val;if(is_undeclared_ref(exp)){var static_value=static_values[exp.name];if(!static_value||!static_value[key])return this;val=global_objs[exp.name]}else{val=exp._eval(compressor,cached,depth+1);if(!val||val===exp||!HOP(val,key))return this;if(typeof val=="function")switch(key){case"name":return val.node.name?val.node.name.name:"";case"length":return val.node.argnames.length;default:return this}}return val[key]}return this});def(AST_Call,function(compressor,cached,depth){var exp=this.expression;if(compressor.option("unsafe")&&exp instanceof AST_PropAccess){var key=exp.property;if(key instanceof AST_Node){key=key._eval(compressor,cached,depth);if(key===exp.property)return this}var val;var e=exp.expression;if(is_undeclared_ref(e)){var static_fn=static_fns[e.name];if(!static_fn||!static_fn[key])return this;val=global_objs[e.name]}else{val=e._eval(compressor,cached,depth+1);if(val===e||!val)return this;var native_fn=native_fns[val.constructor.name];if(!native_fn||!native_fn[key])return this}var args=[];for(var i=0,len=this.args.length;i<len;i++){var arg=this.args[i];var value=arg._eval(compressor,cached,depth);if(arg===value)return this;args.push(value)}try{return val[key].apply(val,args)}catch(ex){compressor.warn("Error evaluating {code} [{file}:{line},{col}]",{code:this.print_to_string(),file:this.start.file,line:this.start.line,col:this.start.col})}}return this});def(AST_New,return_this)})(function(node,func){node.DEFMETHOD("_eval",func)});(function(def){function basic_negation(exp){return make_node(AST_UnaryPrefix,exp,{operator:"!",expression:exp})}function best(orig,alt,first_in_statement){var negated=basic_negation(orig);if(first_in_statement){var stat=make_node(AST_SimpleStatement,alt,{body:alt});return best_of_expression(negated,stat)===stat?alt:negated}return best_of_expression(negated,alt)}def(AST_Node,function(){return basic_negation(this)});def(AST_Statement,function(){throw new Error("Cannot negate a statement")});def(AST_Function,function(){return basic_negation(this)});def(AST_UnaryPrefix,function(){if(this.operator=="!")return this.expression;return basic_negation(this)});def(AST_Sequence,function(compressor){var expressions=this.expressions.slice();expressions.push(expressions.pop().negate(compressor));return make_sequence(this,expressions)});def(AST_Conditional,function(compressor,first_in_statement){var self=this.clone();self.consequent=self.consequent.negate(compressor);self.alternative=self.alternative.negate(compressor);return best(this,self,first_in_statement)});def(AST_Binary,function(compressor,first_in_statement){var self=this.clone(),op=this.operator;if(compressor.option("unsafe_comps")){switch(op){case"<=":self.operator=">";return self;case"<":self.operator=">=";return self;case">=":self.operator="<";return self;case">":self.operator="<=";return self}}switch(op){case"==":self.operator="!=";return self;case"!=":self.operator="==";return self;case"===":self.operator="!==";return self;case"!==":self.operator="===";return self;case"&&":self.operator="||";self.left=self.left.negate(compressor,first_in_statement);self.right=self.right.negate(compressor);return best(this,self,first_in_statement);case"||":self.operator="&&";self.left=self.left.negate(compressor,first_in_statement);self.right=self.right.negate(compressor);return best(this,self,first_in_statement)}return basic_negation(this)})})(function(node,func){node.DEFMETHOD("negate",function(compressor,first_in_statement){return func.call(this,compressor,first_in_statement)})});var global_pure_fns=makePredicate("Boolean decodeURI decodeURIComponent Date encodeURI encodeURIComponent Error escape EvalError isFinite isNaN Number Object parseFloat parseInt RangeError ReferenceError String SyntaxError TypeError unescape URIError");AST_Call.DEFMETHOD("is_expr_pure",function(compressor){if(compressor.option("unsafe")){var expr=this.expression;if(is_undeclared_ref(expr)&&global_pure_fns[expr.name])return true;if(expr instanceof AST_Dot&&is_undeclared_ref(expr.expression)){var static_fn=static_fns[expr.expression.name];return static_fn&&static_fn[expr.property]}}return this.pure||!compressor.pure_funcs(this)});AST_Node.DEFMETHOD("is_call_pure",return_false);AST_Dot.DEFMETHOD("is_call_pure",function(compressor){if(!compressor.option("unsafe"))return;var expr=this.expression;var map;if(expr instanceof AST_Array){map=native_fns.Array}else if(expr.is_boolean(compressor)){map=native_fns.Boolean}else if(expr.is_number(compressor)){map=native_fns.Number}else if(expr instanceof AST_RegExp){map=native_fns.RegExp}else if(expr.is_string(compressor)){map=native_fns.String}else if(!this.may_throw_on_access(compressor)){map=native_fns.Object}return map&&map[this.property]});(function(def){function any(list,compressor){for(var i=list.length;--i>=0;)if(list[i].has_side_effects(compressor))return true;return false}def(AST_Node,return_true);def(AST_Array,function(compressor){return any(this.elements,compressor)});def(AST_Assign,return_true);def(AST_Binary,function(compressor){return this.left.has_side_effects(compressor)||this.right.has_side_effects(compressor)});def(AST_Block,function(compressor){return any(this.body,compressor)});def(AST_Call,function(compressor){if(!this.is_expr_pure(compressor)&&(!this.expression.is_call_pure(compressor)||this.expression.has_side_effects(compressor))){return true}return any(this.args,compressor)});def(AST_Case,function(compressor){return this.expression.has_side_effects(compressor)||any(this.body,compressor)});def(AST_Conditional,function(compressor){return this.condition.has_side_effects(compressor)||this.consequent.has_side_effects(compressor)||this.alternative.has_side_effects(compressor)});def(AST_Constant,return_false);def(AST_Definitions,function(compressor){return any(this.definitions,compressor)});def(AST_Dot,function(compressor){return this.expression.may_throw_on_access(compressor)||this.expression.has_side_effects(compressor)});def(AST_EmptyStatement,return_false);def(AST_If,function(compressor){return this.condition.has_side_effects(compressor)||this.body&&this.body.has_side_effects(compressor)||this.alternative&&this.alternative.has_side_effects(compressor)});def(AST_LabeledStatement,function(compressor){return this.body.has_side_effects(compressor)});def(AST_Lambda,return_false);def(AST_Object,function(compressor){return any(this.properties,compressor)});def(AST_ObjectProperty,function(compressor){return this.value.has_side_effects(compressor)});def(AST_Sub,function(compressor){return this.expression.may_throw_on_access(compressor)||this.expression.has_side_effects(compressor)||this.property.has_side_effects(compressor)});def(AST_Sequence,function(compressor){return any(this.expressions,compressor)});def(AST_SimpleStatement,function(compressor){return this.body.has_side_effects(compressor)});def(AST_Switch,function(compressor){return this.expression.has_side_effects(compressor)||any(this.body,compressor)});def(AST_SymbolDeclaration,return_false);def(AST_SymbolRef,function(compressor){return!this.is_declared(compressor)});def(AST_This,return_false);def(AST_Try,function(compressor){return any(this.body,compressor)||this.bcatch&&this.bcatch.has_side_effects(compressor)||this.bfinally&&this.bfinally.has_side_effects(compressor)});def(AST_Unary,function(compressor){return unary_side_effects[this.operator]||this.expression.has_side_effects(compressor)});def(AST_VarDef,function(compressor){return this.value})})(function(node,func){node.DEFMETHOD("has_side_effects",func)});(function(def){def(AST_Node,return_true);def(AST_Constant,return_false);def(AST_EmptyStatement,return_false);def(AST_Lambda,return_false);def(AST_SymbolDeclaration,return_false);def(AST_This,return_false);function any(list,compressor){for(var i=list.length;--i>=0;)if(list[i].may_throw(compressor))return true;return false}def(AST_Array,function(compressor){return any(this.elements,compressor)});def(AST_Assign,function(compressor){if(this.right.may_throw(compressor))return true;if(!compressor.has_directive("use strict")&&this.operator=="="&&this.left instanceof AST_SymbolRef){return false}return this.left.may_throw(compressor)});def(AST_Binary,function(compressor){return this.left.may_throw(compressor)||this.right.may_throw(compressor)});def(AST_Block,function(compressor){return any(this.body,compressor)});def(AST_Call,function(compressor){if(any(this.args,compressor))return true;if(this.is_expr_pure(compressor))return false;if(this.expression.may_throw(compressor))return true;return!(this.expression instanceof AST_Lambda)||any(this.expression.body,compressor)});def(AST_Case,function(compressor){return this.expression.may_throw(compressor)||any(this.body,compressor)});def(AST_Conditional,function(compressor){return this.condition.may_throw(compressor)||this.consequent.may_throw(compressor)||this.alternative.may_throw(compressor)});def(AST_Definitions,function(compressor){return any(this.definitions,compressor)});def(AST_Dot,function(compressor){return this.expression.may_throw_on_access(compressor)||this.expression.may_throw(compressor)});def(AST_If,function(compressor){return this.condition.may_throw(compressor)||this.body&&this.body.may_throw(compressor)||this.alternative&&this.alternative.may_throw(compressor)});def(AST_LabeledStatement,function(compressor){return this.body.may_throw(compressor)});def(AST_Object,function(compressor){return any(this.properties,compressor)});def(AST_ObjectProperty,function(compressor){return this.value.may_throw(compressor)});def(AST_Return,function(compressor){return this.value&&this.value.may_throw(compressor)});def(AST_Sequence,function(compressor){return any(this.expressions,compressor)});def(AST_SimpleStatement,function(compressor){return this.body.may_throw(compressor)});def(AST_Sub,function(compressor){return this.expression.may_throw_on_access(compressor)||this.expression.may_throw(compressor)||this.property.may_throw(compressor)});def(AST_Switch,function(compressor){return this.expression.may_throw(compressor)||any(this.body,compressor)});def(AST_SymbolRef,function(compressor){return!this.is_declared(compressor)});def(AST_Try,function(compressor){return this.bcatch?this.bcatch.may_throw(compressor):any(this.body,compressor)||this.bfinally&&this.bfinally.may_throw(compressor)});def(AST_Unary,function(compressor){if(this.operator=="typeof"&&this.expression instanceof AST_SymbolRef)return false;return this.expression.may_throw(compressor)});def(AST_VarDef,function(compressor){if(!this.value)return false;return this.value.may_throw(compressor)})})(function(node,func){node.DEFMETHOD("may_throw",func)});(function(def){function all(list){for(var i=list.length;--i>=0;)if(!list[i].is_constant_expression())return false;return true}def(AST_Node,return_false);def(AST_Constant,return_true);def(AST_Lambda,function(scope){var self=this;var result=true;self.walk(new TreeWalker(function(node){if(!result)return true;if(node instanceof AST_SymbolRef){if(self.inlined){result=false;return true}var def=node.definition();if(member(def,self.enclosed)&&!self.variables.has(def.name)){if(scope){var scope_def=scope.find_variable(node);if(def.undeclared?!scope_def:scope_def===def){result="f";return true}}result=false}return true}}));return result});def(AST_Unary,function(){return this.expression.is_constant_expression()});def(AST_Binary,function(){return this.left.is_constant_expression()&&this.right.is_constant_expression()});def(AST_Array,function(){return all(this.elements)});def(AST_Object,function(){return all(this.properties)});def(AST_ObjectProperty,function(){return this.value.is_constant_expression()})})(function(node,func){node.DEFMETHOD("is_constant_expression",func)});function aborts(thing){return thing&&thing.aborts()}(function(def){def(AST_Statement,return_null);def(AST_Jump,return_this);function block_aborts(){var n=this.body.length;return n>0&&aborts(this.body[n-1])}def(AST_BlockStatement,block_aborts);def(AST_SwitchBranch,block_aborts);def(AST_If,function(){return this.alternative&&aborts(this.body)&&aborts(this.alternative)&&this})})(function(node,func){node.DEFMETHOD("aborts",func)});var directives=makePredicate(["use asm","use strict"]);OPT(AST_Directive,function(self,compressor){if(compressor.option("directives")&&(!directives[self.value]||compressor.has_directive(self.value)!==self)){return make_node(AST_EmptyStatement,self)}return self});OPT(AST_Debugger,function(self,compressor){if(compressor.option("drop_debugger"))return make_node(AST_EmptyStatement,self);return self});OPT(AST_LabeledStatement,function(self,compressor){if(self.body instanceof AST_Break&&compressor.loopcontrol_target(self.body)===self.body){return make_node(AST_EmptyStatement,self)}return self.label.references.length==0?self.body:self});OPT(AST_Block,function(self,compressor){tighten_body(self.body,compressor);return self});OPT(AST_BlockStatement,function(self,compressor){tighten_body(self.body,compressor);switch(self.body.length){case 1:return self.body[0];case 0:return make_node(AST_EmptyStatement,self)}return self});OPT(AST_Lambda,function(self,compressor){tighten_body(self.body,compressor);if(compressor.option("side_effects")&&self.body.length==1&&self.body[0]===compressor.has_directive("use strict")){self.body.length=0}return self});AST_Scope.DEFMETHOD("drop_unused",function(compressor){if(!compressor.option("unused"))return;if(compressor.has_directive("use asm"))return;var self=this;if(self.pinned())return;var drop_funcs=!(self instanceof AST_Toplevel)||compressor.toplevel.funcs;var drop_vars=!(self instanceof AST_Toplevel)||compressor.toplevel.vars;var assign_as_unused=/keep_assign/.test(compressor.option("unused"))?return_false:function(node,props){var sym;if(node instanceof AST_Assign&&(node.write_only||node.operator=="=")){sym=node.left}else if(node instanceof AST_Unary&&node.write_only){sym=node.expression}if(!/strict/.test(compressor.option("pure_getters")))return sym instanceof AST_SymbolRef&&sym;while(sym instanceof AST_PropAccess&&!sym.expression.may_throw_on_access(compressor)){if(sym instanceof AST_Sub)props.unshift(sym.property);sym=sym.expression}return sym instanceof AST_SymbolRef&&all(sym.definition().orig,function(sym){return!(sym instanceof AST_SymbolLambda)})&&sym};var in_use=[];var in_use_ids=Object.create(null);var fixed_ids=Object.create(null);var value_read=Object.create(null);var value_modified=Object.create(null);if(self instanceof AST_Toplevel&&compressor.top_retain){self.variables.each(function(def){if(compressor.top_retain(def)&&!(def.id in in_use_ids)){in_use_ids[def.id]=true;in_use.push(def)}})}var var_defs_by_id=new Dictionary;var initializations=new Dictionary;var scope=this;var tw=new TreeWalker(function(node,descend){if(node instanceof AST_Lambda&&node.uses_arguments&&!tw.has_directive("use strict")){node.argnames.forEach(function(argname){var def=argname.definition();if(!(def.id in in_use_ids)){in_use_ids[def.id]=true;in_use.push(def)}})}if(node===self)return;if(node instanceof AST_Defun){var node_def=node.name.definition();if(!drop_funcs&&scope===self){if(!(node_def.id in in_use_ids)){in_use_ids[node_def.id]=true;in_use.push(node_def)}}initializations.add(node_def.id,node);return true}if(node instanceof AST_SymbolFunarg&&scope===self){var_defs_by_id.add(node.definition().id,node)}if(node instanceof AST_Definitions&&scope===self){node.definitions.forEach(function(def){var node_def=def.name.definition();if(def.name instanceof AST_SymbolVar){var_defs_by_id.add(node_def.id,def)}if(!drop_vars){if(!(node_def.id in in_use_ids)){in_use_ids[node_def.id]=true;in_use.push(node_def)}}if(def.value){initializations.add(node_def.id,def.value);if(def.value.has_side_effects(compressor)){def.value.walk(tw)}if(!node_def.chained&&def.name.fixed_value()===def.value){fixed_ids[node_def.id]=def}}});return true}return scan_ref_scoped(node,descend)});self.walk(tw);tw=new TreeWalker(scan_ref_scoped);for(var i=0;i<in_use.length;i++){var init=initializations.get(in_use[i].id);if(init)init.forEach(function(init){init.walk(tw)})}var drop_fn_name=compressor.option("keep_fnames")?return_false:compressor.option("ie8")?function(def){return!compressor.exposed(def)&&!def.references.length}:function(def){return!(def.id in in_use_ids)||def.orig.length>1};var tt=new TreeTransformer(function(node,descend,in_list){var parent=tt.parent();if(drop_vars){var props=[],sym=assign_as_unused(node,props);if(sym){var def=sym.definition();var in_use=def.id in in_use_ids;var value=null;if(node instanceof AST_Assign){if(!in_use||node.left===sym&&def.id in fixed_ids&&fixed_ids[def.id]!==node){value=node.right}}else if(!in_use){value=make_node(AST_Number,node,{value:0})}if(value){props.push(value);return maintain_this_binding(compressor,parent,node,make_sequence(node,props.map(function(prop){return prop.transform(tt)})))}}}if(scope!==self)return;if(node instanceof AST_Function&&node.name&&drop_fn_name(node.name.definition())){node.name=null}if(node instanceof AST_Lambda&&!(node instanceof AST_Accessor)){var trim=!compressor.option("keep_fargs");for(var a=node.argnames,i=a.length;--i>=0;){var sym=a[i];if(!(sym.definition().id in in_use_ids)){sym.__unused=true;if(trim){a.pop();compressor[sym.unreferenced()?"warn":"info"]("Dropping unused function argument {name} [{file}:{line},{col}]",template(sym))}}else{trim=false}}}if(drop_funcs&&node instanceof AST_Defun&&node!==self){var def=node.name.definition();if(!(def.id in in_use_ids)){compressor[node.name.unreferenced()?"warn":"info"]("Dropping unused function {name} [{file}:{line},{col}]",template(node.name));def.eliminated++;return make_node(AST_EmptyStatement,node)}}if(node instanceof AST_Definitions&&!(parent instanceof AST_ForIn&&parent.init===node)){var body=[],head=[],tail=[];var side_effects=[];node.definitions.forEach(function(def){if(def.value)def.value=def.value.transform(tt);var sym=def.name.definition();if(!drop_vars||sym.id in in_use_ids){if(def.value&&sym.id in fixed_ids&&fixed_ids[sym.id]!==def){def.value=def.value.drop_side_effect_free(compressor)}if(def.name instanceof AST_SymbolVar){var var_defs=var_defs_by_id.get(sym.id);if(var_defs.length>1&&(!def.value||sym.orig.indexOf(def.name)>sym.eliminated)){compressor.warn("Dropping duplicated definition of variable {name} [{file}:{line},{col}]",template(def.name));if(def.value){var ref=make_node(AST_SymbolRef,def.name,def.name);sym.references.push(ref);var assign=make_node(AST_Assign,def,{operator:"=",left:ref,right:def.value});if(fixed_ids[sym.id]===def){fixed_ids[sym.id]=assign}side_effects.push(assign.transform(tt))}remove(var_defs,def);sym.eliminated++;return}}if(def.value){if(side_effects.length>0){if(tail.length>0){side_effects.push(def.value);def.value=make_sequence(def.value,side_effects)}else{body.push(make_node(AST_SimpleStatement,node,{body:make_sequence(node,side_effects)}))}side_effects=[]}tail.push(def)}else{head.push(def)}}else if(sym.orig[0]instanceof AST_SymbolCatch){var value=def.value&&def.value.drop_side_effect_free(compressor);if(value)side_effects.push(value);def.value=null;head.push(def)}else{var value=def.value&&def.value.drop_side_effect_free(compressor);if(value){compressor.warn("Side effects in initialization of unused variable {name} [{file}:{line},{col}]",template(def.name));side_effects.push(value)}else{compressor[def.name.unreferenced()?"warn":"info"]("Dropping unused variable {name} [{file}:{line},{col}]",template(def.name))}sym.eliminated++}});if(head.length>0||tail.length>0){node.definitions=head.concat(tail);body.push(node)}if(side_effects.length>0){body.push(make_node(AST_SimpleStatement,node,{body:make_sequence(node,side_effects)}))}switch(body.length){case 0:return in_list?MAP.skip:make_node(AST_EmptyStatement,node);case 1:return body[0];default:return in_list?MAP.splice(body):make_node(AST_BlockStatement,node,{body:body})}}if(node instanceof AST_For){descend(node,this);var block;if(node.init instanceof AST_BlockStatement){block=node.init;node.init=block.body.pop();block.body.push(node)}if(node.init instanceof AST_SimpleStatement){node.init=node.init.body}else if(is_empty(node.init)){node.init=null}return!block?node:in_list?MAP.splice(block.body):block}if(node instanceof AST_LabeledStatement&&node.body instanceof AST_For){descend(node,this);if(node.body instanceof AST_BlockStatement){var block=node.body;node.body=block.body.pop();block.body.push(node);return in_list?MAP.splice(block.body):block}return node}if(node instanceof AST_Scope){var save_scope=scope;scope=node;descend(node,this);scope=save_scope;return node}function template(sym){return{name:sym.name,file:sym.start.file,line:sym.start.line,col:sym.start.col}}});self.transform(tt);function verify_safe_usage(def,read,modified){if(def.id in in_use_ids)return;if(read&&modified){in_use_ids[def.id]=true;in_use.push(def)}else{value_read[def.id]=read;value_modified[def.id]=modified}}function scan_ref_scoped(node,descend){var node_def,props=[],sym=assign_as_unused(node,props);if(sym&&self.variables.get(sym.name)===(node_def=sym.definition())){props.forEach(function(prop){prop.walk(tw)});if(node instanceof AST_Assign){node.right.walk(tw);if(node.left===sym){if(!node_def.chained&&sym.fixed_value()===node.right){fixed_ids[node_def.id]=node}if(!node.write_only){verify_safe_usage(node_def,true,value_modified[node_def.id])}}else{var fixed=sym.fixed_value();if(!fixed||!fixed.is_constant()){verify_safe_usage(node_def,value_read[node_def.id],true)}}}return true}if(node instanceof AST_SymbolRef){node_def=node.definition();if(!(node_def.id in in_use_ids)){in_use_ids[node_def.id]=true;in_use.push(node_def)}return true}if(node instanceof AST_Scope){var save_scope=scope;scope=node;descend();scope=save_scope;return true}}});AST_Scope.DEFMETHOD("hoist_declarations",function(compressor){if(compressor.has_directive("use asm"))return;var hoist_funs=compressor.option("hoist_funs");var hoist_vars=compressor.option("hoist_vars");var self=this;if(hoist_vars){var var_decl=0;self.walk(new TreeWalker(function(node){if(var_decl>1)return true;if(node instanceof AST_Scope&&node!==self)return true;if(node instanceof AST_Var){var_decl++;return true}}));if(var_decl<=1)hoist_vars=false}if(!hoist_funs&&!hoist_vars)return;var dirs=[];var hoisted=[];var vars=new Dictionary,vars_found=0;var tt=new TreeTransformer(function(node){if(node===self)return;if(node instanceof AST_Directive){dirs.push(node);return make_node(AST_EmptyStatement,node)}if(hoist_funs&&node instanceof AST_Defun&&(tt.parent()===self||!compressor.has_directive("use strict"))){hoisted.push(node);return make_node(AST_EmptyStatement,node)}if(hoist_vars&&node instanceof AST_Var){node.definitions.forEach(function(def){vars.set(def.name.name,def);++vars_found});var seq=node.to_assignments(compressor);var p=tt.parent();if(p instanceof AST_ForIn&&p.init===node){if(seq)return seq;var def=node.definitions[0].name;return make_node(AST_SymbolRef,def,def)}if(p instanceof AST_For&&p.init===node)return seq;if(!seq)return make_node(AST_EmptyStatement,node);return make_node(AST_SimpleStatement,node,{body:seq})}if(node instanceof AST_Scope)return node});self.transform(tt);if(vars_found>0){var defs=[];vars.each(function(def,name){if(self instanceof AST_Lambda&&!all(self.argnames,function(argname){return argname.name!=name})){vars.del(name)}else{def=def.clone();def.value=null;defs.push(def);vars.set(name,def)}});if(defs.length>0){for(var i=0;i<self.body.length;){if(self.body[i]instanceof AST_SimpleStatement){var expr=self.body[i].body,sym,assign;if(expr instanceof AST_Assign&&expr.operator=="="&&(sym=expr.left)instanceof AST_Symbol&&vars.has(sym.name)){var def=vars.get(sym.name);if(def.value)break;def.value=expr.right;remove(defs,def);defs.push(def);self.body.splice(i,1);continue}if(expr instanceof AST_Sequence&&(assign=expr.expressions[0])instanceof AST_Assign&&assign.operator=="="&&(sym=assign.left)instanceof AST_Symbol&&vars.has(sym.name)){var def=vars.get(sym.name);if(def.value)break;def.value=assign.right;remove(defs,def);defs.push(def);self.body[i].body=make_sequence(expr,expr.expressions.slice(1));continue}}if(self.body[i]instanceof AST_EmptyStatement){self.body.splice(i,1);continue}if(self.body[i]instanceof AST_BlockStatement){var tmp=[i,1].concat(self.body[i].body);self.body.splice.apply(self.body,tmp);continue}break}defs=make_node(AST_Var,self,{definitions:defs});hoisted.push(defs)}}self.body=dirs.concat(hoisted,self.body)});AST_Scope.DEFMETHOD("var_names",function(){var var_names=this._var_names;if(!var_names){this._var_names=var_names=Object.create(null);this.enclosed.forEach(function(def){var_names[def.name]=true});this.variables.each(function(def,name){var_names[name]=true})}return var_names});AST_Scope.DEFMETHOD("make_var_name",function(prefix){var var_names=this.var_names();prefix=prefix.replace(/(?:^[^a-z_$]|[^a-z0-9_$])/gi,"_");var name=prefix;for(var i=0;var_names[name];i++)name=prefix+"$"+i;var_names[name]=true;return name});AST_Scope.DEFMETHOD("hoist_properties",function(compressor){if(!compressor.option("hoist_props")||compressor.has_directive("use asm"))return;var self=this;var top_retain=self instanceof AST_Toplevel&&compressor.top_retain||return_false;var defs_by_id=Object.create(null);self.transform(new TreeTransformer(function(node,descend){if(node instanceof AST_Assign&&node.operator=="="&&node.write_only&&can_hoist(node.left,node.right,1)){descend(node,this);var defs=new Dictionary;var assignments=[];var decls=[];node.right.properties.forEach(function(prop){var decl=make_sym(node.left,prop.key);decls.push(make_node(AST_VarDef,node,{name:decl,value:null}));var sym=make_node(AST_SymbolRef,node,{name:decl.name,scope:self,thedef:decl.definition()});sym.reference({});assignments.push(make_node(AST_Assign,node,{operator:"=",left:sym,right:prop.value}))});defs_by_id[node.left.definition().id]=defs;self.body.splice(self.body.indexOf(this.stack[1])+1,0,make_node(AST_Var,node,{definitions:decls}));return make_sequence(node,assignments)}if(node instanceof AST_VarDef&&can_hoist(node.name,node.value,0)){descend(node,this);var defs=new Dictionary;var var_defs=[];node.value.properties.forEach(function(prop){var_defs.push(make_node(AST_VarDef,node,{name:make_sym(node.name,prop.key),value:prop.value}))});defs_by_id[node.name.definition().id]=defs;return MAP.splice(var_defs)}if(node instanceof AST_PropAccess&&node.expression instanceof AST_SymbolRef){var defs=defs_by_id[node.expression.definition().id];if(defs){var def=defs.get(get_value(node.property));var sym=make_node(AST_SymbolRef,node,{name:def.name,scope:node.expression.scope,thedef:def});sym.reference({});return sym}}function can_hoist(sym,right,count){if(sym.scope!==self)return;var def=sym.definition();if(def.assignments!=count)return;if(def.direct_access)return;if(def.escaped==1)return;if(def.references.length==count)return;if(def.single_use)return;if(top_retain(def))return;if(sym.fixed_value()!==right)return;return right instanceof AST_Object}function make_sym(sym,key){var new_var=make_node(AST_SymbolVar,sym,{name:self.make_var_name(sym.name+"_"+key),scope:self});var def=self.def_variable(new_var);defs.set(key,def);self.enclosed.push(def);return new_var}}))});(function(def){function trim(nodes,compressor,first_in_statement){var len=nodes.length;if(!len)return null;var ret=[],changed=false;for(var i=0;i<len;i++){var node=nodes[i].drop_side_effect_free(compressor,first_in_statement);changed|=node!==nodes[i];if(node){ret.push(node);first_in_statement=false}}return changed?ret.length?ret:null:nodes}def(AST_Node,return_this);def(AST_Accessor,return_null);def(AST_Array,function(compressor,first_in_statement){var values=trim(this.elements,compressor,first_in_statement);return values&&make_sequence(this,values)});def(AST_Assign,function(compressor){var left=this.left;if(left.has_side_effects(compressor)||compressor.has_directive("use strict")&&left instanceof AST_PropAccess&&left.expression.is_constant()){return this}this.write_only=true;if(root_expr(left).is_constant_expression(compressor.find_parent(AST_Scope))){return this.right.drop_side_effect_free(compressor)}return this});def(AST_Binary,function(compressor,first_in_statement){var right=this.right.drop_side_effect_free(compressor);if(!right)return this.left.drop_side_effect_free(compressor,first_in_statement);if(lazy_op[this.operator]){if(right===this.right)return this;var node=this.clone();node.right=right;return node}else{var left=this.left.drop_side_effect_free(compressor,first_in_statement);if(!left)return this.right.drop_side_effect_free(compressor,first_in_statement);return make_sequence(this,[left,right])}});def(AST_Call,function(compressor,first_in_statement){if(!this.is_expr_pure(compressor)){if(this.expression.is_call_pure(compressor)){var exprs=this.args.slice();exprs.unshift(this.expression.expression);exprs=trim(exprs,compressor,first_in_statement);return exprs&&make_sequence(this,exprs)}if(this.expression instanceof AST_Function&&(!this.expression.name||!this.expression.name.definition().references.length)){var node=this.clone();var exp=node.expression;exp.process_expression(false,compressor);exp.walk(new TreeWalker(function(node){if(node instanceof AST_Return&&node.value){node.value=node.value.drop_side_effect_free(compressor);return true}if(node instanceof AST_Scope&&node!==exp)return true}));return node}return this}if(this.pure){compressor.warn("Dropping __PURE__ call [{file}:{line},{col}]",this.start)}var args=trim(this.args,compressor,first_in_statement);return args&&make_sequence(this,args)});def(AST_Conditional,function(compressor){var consequent=this.consequent.drop_side_effect_free(compressor);var alternative=this.alternative.drop_side_effect_free(compressor);if(consequent===this.consequent&&alternative===this.alternative)return this;if(!consequent)return alternative?make_node(AST_Binary,this,{operator:"||",left:this.condition,right:alternative}):this.condition.drop_side_effect_free(compressor);if(!alternative)return make_node(AST_Binary,this,{operator:"&&",left:this.condition,right:consequent});var node=this.clone();node.consequent=consequent;node.alternative=alternative;return node});def(AST_Constant,return_null);def(AST_Dot,function(compressor,first_in_statement){if(this.expression.may_throw_on_access(compressor))return this;return this.expression.drop_side_effect_free(compressor,first_in_statement)});def(AST_Function,function(compressor){return this.name&&compressor.option("ie8")?this:null});def(AST_Unary,function(compressor,first_in_statement){if(unary_side_effects[this.operator]){this.write_only=!this.expression.has_side_effects(compressor);return this}if(this.operator=="typeof"&&this.expression instanceof AST_SymbolRef)return null;var expression=this.expression.drop_side_effect_free(compressor,first_in_statement);if(first_in_statement&&expression&&is_iife_call(expression)){if(expression===this.expression&&this.operator=="!")return this;return expression.negate(compressor,first_in_statement)}return expression});def(AST_Object,function(compressor,first_in_statement){var values=trim(this.properties,compressor,first_in_statement);return values&&make_sequence(this,values)});def(AST_ObjectProperty,function(compressor,first_in_statement){return this.value.drop_side_effect_free(compressor,first_in_statement)});def(AST_Sequence,function(compressor){var last=this.tail_node();var expr=last.drop_side_effect_free(compressor);if(expr===last)return this;var expressions=this.expressions.slice(0,-1);if(expr)expressions.push(expr);return make_sequence(this,expressions)});def(AST_Sub,function(compressor,first_in_statement){if(this.expression.may_throw_on_access(compressor))return this;var expression=this.expression.drop_side_effect_free(compressor,first_in_statement);if(!expression)return this.property.drop_side_effect_free(compressor,first_in_statement);var property=this.property.drop_side_effect_free(compressor);if(!property)return expression;return make_sequence(this,[expression,property])});def(AST_SymbolRef,function(compressor){return this.is_declared(compressor)?null:this});def(AST_This,return_null)})(function(node,func){node.DEFMETHOD("drop_side_effect_free",func)});OPT(AST_SimpleStatement,function(self,compressor){if(compressor.option("side_effects")){var body=self.body;var node=body.drop_side_effect_free(compressor,true);if(!node){compressor.warn("Dropping side-effect-free statement [{file}:{line},{col}]",self.start);return make_node(AST_EmptyStatement,self)}if(node!==body){return make_node(AST_SimpleStatement,self,{body:node})}}return self});OPT(AST_While,function(self,compressor){return compressor.option("loops")?make_node(AST_For,self,self).optimize(compressor):self});function has_break_or_continue(loop,parent){var found=false;var tw=new TreeWalker(function(node){if(found||node instanceof AST_Scope)return true;if(node instanceof AST_LoopControl&&tw.loopcontrol_target(node)===loop){return found=true}});if(parent instanceof AST_LabeledStatement)tw.push(parent);tw.push(loop);loop.body.walk(tw);return found}OPT(AST_Do,function(self,compressor){if(!compressor.option("loops"))return self;var cond=self.condition.is_truthy()||self.condition.tail_node().evaluate(compressor);if(!(cond instanceof AST_Node)){if(cond)return make_node(AST_For,self,{body:make_node(AST_BlockStatement,self.body,{body:[self.body,make_node(AST_SimpleStatement,self.condition,{body:self.condition})]})}).optimize(compressor);if(!has_break_or_continue(self,compressor.parent())){return make_node(AST_BlockStatement,self.body,{body:[self.body,make_node(AST_SimpleStatement,self.condition,{body:self.condition})]}).optimize(compressor)}}if(self.body instanceof AST_SimpleStatement)return make_node(AST_For,self,{condition:make_sequence(self.condition,[self.body.body,self.condition]),body:make_node(AST_EmptyStatement,self)}).optimize(compressor);return self});function if_break_in_loop(self,compressor){var first=self.body instanceof AST_BlockStatement?self.body.body[0]:self.body;if(compressor.option("dead_code")&&is_break(first)){var body=[];if(self.init instanceof AST_Statement){body.push(self.init)}else if(self.init){body.push(make_node(AST_SimpleStatement,self.init,{body:self.init}))}if(self.condition){body.push(make_node(AST_SimpleStatement,self.condition,{body:self.condition}))}extract_declarations_from_unreachable_code(compressor,self.body,body);return make_node(AST_BlockStatement,self,{body:body})}if(first instanceof AST_If){if(is_break(first.body)){if(self.condition){self.condition=make_node(AST_Binary,self.condition,{left:self.condition,operator:"&&",right:first.condition.negate(compressor)})}else{self.condition=first.condition.negate(compressor)}drop_it(first.alternative)}else if(is_break(first.alternative)){if(self.condition){self.condition=make_node(AST_Binary,self.condition,{left:self.condition,operator:"&&",right:first.condition})}else{self.condition=first.condition}drop_it(first.body)}}return self;function is_break(node){return node instanceof AST_Break&&compressor.loopcontrol_target(node)===compressor.self()}function drop_it(rest){rest=as_statement_array(rest);if(self.body instanceof AST_BlockStatement){self.body=self.body.clone();self.body.body=rest.concat(self.body.body.slice(1));self.body=self.body.transform(compressor)}else{self.body=make_node(AST_BlockStatement,self.body,{body:rest}).transform(compressor)}self=if_break_in_loop(self,compressor)}}OPT(AST_For,function(self,compressor){if(!compressor.option("loops"))return self;if(compressor.option("side_effects")&&self.init){self.init=self.init.drop_side_effect_free(compressor)}if(self.condition){var cond=self.condition.evaluate(compressor);if(!(cond instanceof AST_Node)){if(cond)self.condition=null;else if(!compressor.option("dead_code")){var orig=self.condition;self.condition=make_node_from_constant(cond,self.condition);self.condition=best_of_expression(self.condition.transform(compressor),orig)}}if(cond instanceof AST_Node){cond=self.condition.is_truthy()||self.condition.tail_node().evaluate(compressor)}if(!cond){if(compressor.option("dead_code")){var body=[];extract_declarations_from_unreachable_code(compressor,self.body,body);if(self.init instanceof AST_Statement){body.push(self.init)}else if(self.init){body.push(make_node(AST_SimpleStatement,self.init,{body:self.init}))}body.push(make_node(AST_SimpleStatement,self.condition,{body:self.condition}));return make_node(AST_BlockStatement,self,{body:body}).optimize(compressor)}}else if(self.condition&&!(cond instanceof AST_Node)){self.body=make_node(AST_BlockStatement,self.body,{body:[make_node(AST_SimpleStatement,self.condition,{body:self.condition}),self.body]});self.condition=null}}return if_break_in_loop(self,compressor)});OPT(AST_If,function(self,compressor){if(is_empty(self.alternative))self.alternative=null;if(!compressor.option("conditionals"))return self;var cond=self.condition.evaluate(compressor);if(!compressor.option("dead_code")&&!(cond instanceof AST_Node)){var orig=self.condition;self.condition=make_node_from_constant(cond,orig);self.condition=best_of_expression(self.condition.transform(compressor),orig)}if(compressor.option("dead_code")){if(cond instanceof AST_Node){cond=self.condition.is_truthy()||self.condition.tail_node().evaluate(compressor)}if(!cond){compressor.warn("Condition always false [{file}:{line},{col}]",self.condition.start);var body=[];extract_declarations_from_unreachable_code(compressor,self.body,body);body.push(make_node(AST_SimpleStatement,self.condition,{body:self.condition}));if(self.alternative)body.push(self.alternative);return make_node(AST_BlockStatement,self,{body:body}).optimize(compressor)}else if(!(cond instanceof AST_Node)){compressor.warn("Condition always true [{file}:{line},{col}]",self.condition.start);var body=[];if(self.alternative){extract_declarations_from_unreachable_code(compressor,self.alternative,body)}body.push(make_node(AST_SimpleStatement,self.condition,{body:self.condition}));body.push(self.body);return make_node(AST_BlockStatement,self,{body:body}).optimize(compressor)}}var negated=self.condition.negate(compressor);var self_condition_length=self.condition.print_to_string().length;var negated_length=negated.print_to_string().length;var negated_is_best=negated_length<self_condition_length;if(self.alternative&&negated_is_best){negated_is_best=false;self.condition=negated;var tmp=self.body;self.body=self.alternative||make_node(AST_EmptyStatement,self);self.alternative=tmp}if(is_empty(self.body)&&is_empty(self.alternative)){return make_node(AST_SimpleStatement,self.condition,{body:self.condition.clone()}).optimize(compressor)}if(self.body instanceof AST_SimpleStatement&&self.alternative instanceof AST_SimpleStatement){return make_node(AST_SimpleStatement,self,{body:make_node(AST_Conditional,self,{condition:self.condition,consequent:self.body.body,alternative:self.alternative.body})}).optimize(compressor)}if(is_empty(self.alternative)&&self.body instanceof AST_SimpleStatement){if(self_condition_length===negated_length&&!negated_is_best&&self.condition instanceof AST_Binary&&self.condition.operator=="||"){negated_is_best=true}if(negated_is_best)return make_node(AST_SimpleStatement,self,{body:make_node(AST_Binary,self,{operator:"||",left:negated,right:self.body.body})}).optimize(compressor);return make_node(AST_SimpleStatement,self,{body:make_node(AST_Binary,self,{operator:"&&",left:self.condition,right:self.body.body})}).optimize(compressor)}if(self.body instanceof AST_EmptyStatement&&self.alternative instanceof AST_SimpleStatement){return make_node(AST_SimpleStatement,self,{body:make_node(AST_Binary,self,{operator:"||",left:self.condition,right:self.alternative.body})}).optimize(compressor)}if(self.body instanceof AST_Exit&&self.alternative instanceof AST_Exit&&self.body.TYPE==self.alternative.TYPE){return make_node(self.body.CTOR,self,{value:make_node(AST_Conditional,self,{condition:self.condition,consequent:self.body.value||make_node(AST_Undefined,self.body),alternative:self.alternative.value||make_node(AST_Undefined,self.alternative)}).transform(compressor)}).optimize(compressor)}if(self.body instanceof AST_If&&!self.body.alternative&&!self.alternative){self=make_node(AST_If,self,{condition:make_node(AST_Binary,self.condition,{operator:"&&",left:self.condition,right:self.body.condition}),body:self.body.body,alternative:null})}if(aborts(self.body)){if(self.alternative){var alt=self.alternative;self.alternative=null;return make_node(AST_BlockStatement,self,{body:[self,alt]}).optimize(compressor)}}if(aborts(self.alternative)){var body=self.body;self.body=self.alternative;self.condition=negated_is_best?negated:self.condition.negate(compressor);self.alternative=null;return make_node(AST_BlockStatement,self,{body:[self,body]}).optimize(compressor)}return self});OPT(AST_Switch,function(self,compressor){if(!compressor.option("switches"))return self;var branch;var value=self.expression.evaluate(compressor);if(!(value instanceof AST_Node)){var orig=self.expression;self.expression=make_node_from_constant(value,orig);self.expression=best_of_expression(self.expression.transform(compressor),orig)}if(!compressor.option("dead_code"))return self;if(value instanceof AST_Node){value=self.expression.tail_node().evaluate(compressor)}var decl=[];var body=[];var default_branch;var exact_match;for(var i=0,len=self.body.length;i<len&&!exact_match;i++){branch=self.body[i];if(branch instanceof AST_Default){if(!default_branch){default_branch=branch}else{eliminate_branch(branch,body[body.length-1])}}else if(!(value instanceof AST_Node)){var exp=branch.expression.evaluate(compressor);if(!(exp instanceof AST_Node)&&exp!==value){eliminate_branch(branch,body[body.length-1]);continue}if(exp instanceof AST_Node)exp=branch.expression.tail_node().evaluate(compressor);if(exp===value){exact_match=branch;if(default_branch){var default_index=body.indexOf(default_branch);body.splice(default_index,1);eliminate_branch(default_branch,body[default_index-1]);default_branch=null}}}if(aborts(branch)){var prev=body[body.length-1];if(aborts(prev)&&prev.body.length==branch.body.length&&make_node(AST_BlockStatement,prev,prev).equivalent_to(make_node(AST_BlockStatement,branch,branch))){prev.body=[]}}body.push(branch)}while(i<len)eliminate_branch(self.body[i++],body[body.length-1]);if(body.length>0){body[0].body=decl.concat(body[0].body)}self.body=body;while(branch=body[body.length-1]){var stat=branch.body[branch.body.length-1];if(stat instanceof AST_Break&&compressor.loopcontrol_target(stat)===self)branch.body.pop();if(branch.body.length||branch instanceof AST_Case&&(default_branch||branch.expression.has_side_effects(compressor)))break;if(body.pop()===default_branch)default_branch=null}if(body.length==0){return make_node(AST_BlockStatement,self,{body:decl.concat(make_node(AST_SimpleStatement,self.expression,{body:self.expression}))}).optimize(compressor)}if(body.length==1&&(body[0]===exact_match||body[0]===default_branch)){var has_break=false;var tw=new TreeWalker(function(node){if(has_break||node instanceof AST_Lambda||node instanceof AST_SimpleStatement)return true;if(node instanceof AST_Break&&tw.loopcontrol_target(node)===self)has_break=true});self.walk(tw);if(!has_break){var statements=body[0].body.slice();var exp=body[0].expression;if(exp)statements.unshift(make_node(AST_SimpleStatement,exp,{body:exp}));statements.unshift(make_node(AST_SimpleStatement,self.expression,{body:self.expression}));return make_node(AST_BlockStatement,self,{body:statements}).optimize(compressor)}}return self;function eliminate_branch(branch,prev){if(prev&&!aborts(prev)){prev.body=prev.body.concat(branch.body)}else{extract_declarations_from_unreachable_code(compressor,branch,decl)}}});OPT(AST_Try,function(self,compressor){tighten_body(self.body,compressor);if(self.bcatch&&self.bfinally&&all(self.bfinally.body,is_empty))self.bfinally=null;if(compressor.option("dead_code")&&all(self.body,is_empty)){var body=[];if(self.bcatch){extract_declarations_from_unreachable_code(compressor,self.bcatch,body);body.forEach(function(stat){if(!(stat instanceof AST_Definitions))return;stat.definitions.forEach(function(var_def){var def=var_def.name.definition().redefined();if(!def)return;var_def.name=var_def.name.clone();var_def.name.thedef=def})})}if(self.bfinally)body=body.concat(self.bfinally.body);return make_node(AST_BlockStatement,self,{body:body}).optimize(compressor)}return self});AST_Definitions.DEFMETHOD("remove_initializers",function(){this.definitions.forEach(function(def){def.value=null})});AST_Definitions.DEFMETHOD("to_assignments",function(compressor){var reduce_vars=compressor.option("reduce_vars");var assignments=this.definitions.reduce(function(a,def){if(def.value){var name=make_node(AST_SymbolRef,def.name,def.name);a.push(make_node(AST_Assign,def,{operator:"=",left:name,right:def.value}));if(reduce_vars)name.definition().fixed=false}def=def.name.definition();def.eliminated++;def.replaced--;return a},[]);if(assignments.length==0)return null;return make_sequence(this,assignments)});OPT(AST_Definitions,function(self,compressor){if(self.definitions.length==0)return make_node(AST_EmptyStatement,self);return self});AST_Call.DEFMETHOD("lift_sequences",function(compressor){if(!compressor.option("sequences"))return this;var exp=this.expression;if(!(exp instanceof AST_Sequence))return this;var tail=exp.tail_node();if(needs_unbinding(compressor,tail)&&!(this instanceof AST_New))return this;var expressions=exp.expressions.slice(0,-1);var node=this.clone();node.expression=tail;expressions.push(node);return make_sequence(this,expressions).optimize(compressor)});OPT(AST_Call,function(self,compressor){var seq=self.lift_sequences(compressor);if(seq!==self){return seq}var exp=self.expression;var fn=exp;if(compressor.option("reduce_vars")&&fn instanceof AST_SymbolRef){fn=fn.fixed_value()}var is_func=fn instanceof AST_Lambda;if(compressor.option("unused")&&is_func&&!fn.uses_arguments&&!fn.pinned()){var pos=0,last=0;for(var i=0,len=self.args.length;i<len;i++){var trim=i>=fn.argnames.length;if(trim||fn.argnames[i].__unused){var node=self.args[i].drop_side_effect_free(compressor);if(node){self.args[pos++]=node}else if(!trim){self.args[pos++]=make_node(AST_Number,self.args[i],{value:0});continue}}else{self.args[pos++]=self.args[i]}last=pos}self.args.length=last}if(compressor.option("unsafe")){if(is_undeclared_ref(exp))switch(exp.name){case"Array":if(self.args.length!=1){return make_node(AST_Array,self,{elements:self.args}).optimize(compressor)}break;case"Object":if(self.args.length==0){return make_node(AST_Object,self,{properties:[]})}break;case"String":if(self.args.length==0)return make_node(AST_String,self,{value:""});if(self.args.length<=1)return make_node(AST_Binary,self,{left:self.args[0],operator:"+",right:make_node(AST_String,self,{value:""})}).optimize(compressor);break;case"Number":if(self.args.length==0)return make_node(AST_Number,self,{value:0});if(self.args.length==1)return make_node(AST_UnaryPrefix,self,{expression:self.args[0],operator:"+"}).optimize(compressor);case"Boolean":if(self.args.length==0)return make_node(AST_False,self);if(self.args.length==1)return make_node(AST_UnaryPrefix,self,{expression:make_node(AST_UnaryPrefix,self,{expression:self.args[0],operator:"!"}),operator:"!"}).optimize(compressor);break;case"RegExp":var params=[];if(all(self.args,function(arg){var value=arg.evaluate(compressor);params.unshift(value);return arg!==value})){try{return best_of(compressor,self,make_node(AST_RegExp,self,{value:RegExp.apply(RegExp,params)}))}catch(ex){compressor.warn("Error converting {expr} [{file}:{line},{col}]",{expr:self.print_to_string(),file:self.start.file,line:self.start.line,col:self.start.col})}}break}else if(exp instanceof AST_Dot)switch(exp.property){case"toString":if(self.args.length==0&&!exp.expression.may_throw_on_access(compressor)){return make_node(AST_Binary,self,{left:make_node(AST_String,self,{value:""}),operator:"+",right:exp.expression}).optimize(compressor)}break;case"join":if(exp.expression instanceof AST_Array)EXIT:{var separator;if(self.args.length>0){separator=self.args[0].evaluate(compressor);if(separator===self.args[0])break EXIT}var elements=[];var consts=[];exp.expression.elements.forEach(function(el){var value=el.evaluate(compressor);if(value!==el){consts.push(value)}else{if(consts.length>0){elements.push(make_node(AST_String,self,{value:consts.join(separator)}));consts.length=0}elements.push(el)}});if(consts.length>0){elements.push(make_node(AST_String,self,{value:consts.join(separator)}))}if(elements.length==0)return make_node(AST_String,self,{value:""});if(elements.length==1){if(elements[0].is_string(compressor)){return elements[0]}return make_node(AST_Binary,elements[0],{operator:"+",left:make_node(AST_String,self,{value:""}),right:elements[0]})}if(separator==""){var first;if(elements[0].is_string(compressor)||elements[1].is_string(compressor)){first=elements.shift()}else{first=make_node(AST_String,self,{value:""})}return elements.reduce(function(prev,el){return make_node(AST_Binary,el,{operator:"+",left:prev,right:el})},first).optimize(compressor)}var node=self.clone();node.expression=node.expression.clone();node.expression.expression=node.expression.expression.clone();node.expression.expression.elements=elements;return best_of(compressor,self,node)}break;case"charAt":if(exp.expression.is_string(compressor)){var arg=self.args[0];var index=arg?arg.evaluate(compressor):0;if(index!==arg){return make_node(AST_Sub,exp,{expression:exp.expression,property:make_node_from_constant(index|0,arg||exp)}).optimize(compressor)}}break;case"apply":if(self.args.length==2&&self.args[1]instanceof AST_Array){var args=self.args[1].elements.slice();args.unshift(self.args[0]);return make_node(AST_Call,self,{expression:make_node(AST_Dot,exp,{expression:exp.expression,property:"call"}),args:args}).optimize(compressor)}break;case"call":var func=exp.expression;if(func instanceof AST_SymbolRef){func=func.fixed_value()}if(func instanceof AST_Lambda&&!func.contains_this()){return(self.args.length?make_sequence(this,[self.args[0],make_node(AST_Call,self,{expression:exp.expression,args:self.args.slice(1)})]):make_node(AST_Call,self,{expression:exp.expression,args:[]})).optimize(compressor)}break}}if(compressor.option("unsafe_Function")&&is_undeclared_ref(exp)&&exp.name=="Function"){if(self.args.length==0)return make_node(AST_Function,self,{argnames:[],body:[]});if(all(self.args,function(x){return x instanceof AST_String})){try{var code="n(function("+self.args.slice(0,-1).map(function(arg){return arg.value}).join(",")+"){"+self.args[self.args.length-1].value+"})";var ast=parse(code);var mangle={ie8:compressor.option("ie8")};ast.figure_out_scope(mangle);var comp=new Compressor(compressor.options);ast=ast.transform(comp);ast.figure_out_scope(mangle);ast.compute_char_frequency(mangle);ast.mangle_names(mangle);var fun;ast.walk(new TreeWalker(function(node){if(fun)return true;if(node instanceof AST_Lambda){fun=node;return true}}));var code=OutputStream();AST_BlockStatement.prototype._codegen.call(fun,fun,code);self.args=[make_node(AST_String,self,{value:fun.argnames.map(function(arg){return arg.print_to_string()}).join(",")}),make_node(AST_String,self.args[self.args.length-1],{value:code.get().replace(/^\{|\}$/g,"")})];return self}catch(ex){if(ex instanceof JS_Parse_Error){compressor.warn("Error parsing code passed to new Function [{file}:{line},{col}]",self.args[self.args.length-1].start);compressor.warn(ex.toString())}else{throw ex}}}}var stat=is_func&&fn.body[0];var can_inline=compressor.option("inline")&&!self.is_expr_pure(compressor);if(can_inline&&stat instanceof AST_Return){var value=stat.value;if(!value||value.is_constant_expression()){if(value){value=value.clone(true)}else{value=make_node(AST_Undefined,self)}var args=self.args.concat(value);return make_sequence(self,args).optimize(compressor)}}if(is_func){var def,value,scope,in_loop,level=-1;if(can_inline&&!fn.uses_arguments&&!fn.pinned()&&!(fn.name&&fn instanceof AST_Function)&&(value=can_flatten_body(stat))&&(exp===fn||compressor.option("unused")&&(def=exp.definition()).references.length==1&&!recursive_ref(compressor,def)&&fn.is_constant_expression(exp.scope))&&!self.pure&&!fn.contains_this()&&can_inject_symbols()){fn._squeezed=true;return make_sequence(self,flatten_fn()).optimize(compressor)}if(compressor.option("side_effects")&&all(fn.body,is_empty)){var args=self.args.concat(make_node(AST_Undefined,self));return make_sequence(self,args).optimize(compressor)}}if(compressor.option("drop_console")){if(exp instanceof AST_PropAccess){var name=exp.expression;while(name.expression){name=name.expression}if(is_undeclared_ref(name)&&name.name=="console"){return make_node(AST_Undefined,self).optimize(compressor)}}}if(compressor.option("negate_iife")&&compressor.parent()instanceof AST_SimpleStatement&&is_iife_call(self)){return self.negate(compressor,true)}var ev=self.evaluate(compressor);if(ev!==self){ev=make_node_from_constant(ev,self).optimize(compressor);return best_of(compressor,ev,self)}return self;function return_value(stat){if(!stat)return make_node(AST_Undefined,self);if(stat instanceof AST_Return){if(!stat.value)return make_node(AST_Undefined,self);return stat.value.clone(true)}if(stat instanceof AST_SimpleStatement){return make_node(AST_UnaryPrefix,stat,{operator:"void",expression:stat.body.clone(true)})}}function can_flatten_body(stat){var len=fn.body.length;if(compressor.option("inline")<3){return len==1&&return_value(stat)}stat=null;for(var i=0;i<len;i++){var line=fn.body[i];if(line instanceof AST_Var){if(stat&&!all(line.definitions,function(var_def){return!var_def.value})){return false}}else if(line instanceof AST_EmptyStatement){continue}else if(stat){return false}else{stat=line}}return return_value(stat)}function can_inject_args(catches,safe_to_inject){for(var i=0,len=fn.argnames.length;i<len;i++){var arg=fn.argnames[i];if(arg.__unused)continue;if(!safe_to_inject||catches[arg.name]||identifier_atom[arg.name]||scope.var_names()[arg.name]){return false}if(in_loop)in_loop.push(arg.definition())}return true}function can_inject_vars(catches,safe_to_inject){var len=fn.body.length;for(var i=0;i<len;i++){var stat=fn.body[i];if(!(stat instanceof AST_Var))continue;if(!safe_to_inject)return false;for(var j=stat.definitions.length;--j>=0;){var name=stat.definitions[j].name;if(catches[name.name]||identifier_atom[name.name]||scope.var_names()[name.name]){return false}if(in_loop)in_loop.push(name.definition())}}return true}function can_inject_symbols(){var catches=Object.create(null);do{scope=compressor.parent(++level);if(scope instanceof AST_Catch){catches[scope.argname.name]=true}else if(scope instanceof AST_IterationStatement){in_loop=[]}else if(scope instanceof AST_SymbolRef){if(scope.fixed_value()instanceof AST_Scope)return false}}while(!(scope instanceof AST_Scope));var safe_to_inject=!(scope instanceof AST_Toplevel)||compressor.toplevel.vars;var inline=compressor.option("inline");if(!can_inject_vars(catches,inline>=3&&safe_to_inject))return false;if(!can_inject_args(catches,inline>=2&&safe_to_inject))return false;return!in_loop||in_loop.length==0||!is_reachable(fn,in_loop)}function append_var(decls,expressions,name,value){var def=name.definition();scope.variables.set(name.name,def);scope.enclosed.push(def);if(!scope.var_names()[name.name]){scope.var_names()[name.name]=true;decls.push(make_node(AST_VarDef,name,{name:name,value:null}))}var sym=make_node(AST_SymbolRef,name,name);def.references.push(sym);if(value)expressions.push(make_node(AST_Assign,self,{operator:"=",left:sym,right:value}))}function flatten_args(decls,expressions){var len=fn.argnames.length;for(var i=self.args.length;--i>=len;){expressions.push(self.args[i])}for(i=len;--i>=0;){var name=fn.argnames[i];var value=self.args[i];if(name.__unused||scope.var_names()[name.name]){if(value)expressions.push(value)}else{var symbol=make_node(AST_SymbolVar,name,name);name.definition().orig.push(symbol);if(!value&&in_loop)value=make_node(AST_Undefined,self);append_var(decls,expressions,symbol,value)}}decls.reverse();expressions.reverse()}function flatten_vars(decls,expressions){var pos=expressions.length;for(var i=0,lines=fn.body.length;i<lines;i++){var stat=fn.body[i];if(!(stat instanceof AST_Var))continue;for(var j=0,defs=stat.definitions.length;j<defs;j++){var var_def=stat.definitions[j];var name=var_def.name;var redef=name.definition().redefined();if(redef){name=name.clone();name.thedef=redef}append_var(decls,expressions,name,var_def.value);if(in_loop&&all(fn.argnames,function(argname){return argname.name!=name.name})){var def=fn.variables.get(name.name);var sym=make_node(AST_SymbolRef,name,name);def.references.push(sym);expressions.splice(pos++,0,make_node(AST_Assign,var_def,{operator:"=",left:sym,right:make_node(AST_Undefined,name)}))}}}}function flatten_fn(){var decls=[];var expressions=[];flatten_args(decls,expressions);flatten_vars(decls,expressions);expressions.push(value);if(decls.length){i=scope.body.indexOf(compressor.parent(level-1))+1;scope.body.splice(i,0,make_node(AST_Var,fn,{definitions:decls}))}return expressions}});OPT(AST_New,function(self,compressor){var seq=self.lift_sequences(compressor);if(seq!==self){return seq}if(compressor.option("unsafe")){var exp=self.expression;if(is_undeclared_ref(exp)){switch(exp.name){case"Object":case"RegExp":case"Function":case"Error":case"Array":return make_node(AST_Call,self,self).transform(compressor)}}}return self});OPT(AST_Sequence,function(self,compressor){if(!compressor.option("side_effects"))return self;var expressions=[];filter_for_side_effects();var end=expressions.length-1;trim_right_for_undefined();if(end==0){self=maintain_this_binding(compressor,compressor.parent(),compressor.self(),expressions[0]);if(!(self instanceof AST_Sequence))self=self.optimize(compressor);return self}self.expressions=expressions;return self;function filter_for_side_effects(){var first=first_in_statement(compressor);var last=self.expressions.length-1;self.expressions.forEach(function(expr,index){if(index<last)expr=expr.drop_side_effect_free(compressor,first);if(expr){merge_sequence(expressions,expr);first=false}})}function trim_right_for_undefined(){while(end>0&&is_undefined(expressions[end],compressor))end--;if(end<expressions.length-1){expressions[end]=make_node(AST_UnaryPrefix,self,{operator:"void",expression:expressions[end]});expressions.length=end+1}}});AST_Unary.DEFMETHOD("lift_sequences",function(compressor){if(compressor.option("sequences")&&this.expression instanceof AST_Sequence){var x=this.expression.expressions.slice();var e=this.clone();e.expression=x.pop();x.push(e);return make_sequence(this,x).optimize(compressor)}return this});OPT(AST_UnaryPostfix,function(self,compressor){return self.lift_sequences(compressor)});OPT(AST_UnaryPrefix,function(self,compressor){var e=self.expression;if(self.operator=="delete"&&!(e instanceof AST_SymbolRef||e instanceof AST_PropAccess||is_identifier_atom(e))){if(e instanceof AST_Sequence){e=e.expressions.slice();e.push(make_node(AST_True,self));return make_sequence(self,e).optimize(compressor)}return make_sequence(self,[e,make_node(AST_True,self)]).optimize(compressor)}var seq=self.lift_sequences(compressor);if(seq!==self){return seq}if(compressor.option("side_effects")&&self.operator=="void"){e=e.drop_side_effect_free(compressor);if(e){self.expression=e;return self}else{return make_node(AST_Undefined,self).optimize(compressor)}}if(compressor.option("booleans")){if(self.operator=="!"&&e.is_truthy()){return make_sequence(self,[e,make_node(AST_False,self)]).optimize(compressor)}else if(compressor.in_boolean_context())switch(self.operator){case"!":if(e instanceof AST_UnaryPrefix&&e.operator=="!"){return e.expression}if(e instanceof AST_Binary){self=best_of(compressor,self,e.negate(compressor,first_in_statement(compressor)))}break;case"typeof":compressor.warn("Boolean expression always true [{file}:{line},{col}]",self.start);return(e instanceof AST_SymbolRef?make_node(AST_True,self):make_sequence(self,[e,make_node(AST_True,self)])).optimize(compressor)}}if(self.operator=="-"&&e instanceof AST_Infinity){e=e.transform(compressor)}if(e instanceof AST_Binary&&(self.operator=="+"||self.operator=="-")&&(e.operator=="*"||e.operator=="/"||e.operator=="%")){return make_node(AST_Binary,self,{operator:e.operator,left:make_node(AST_UnaryPrefix,e.left,{operator:self.operator,expression:e.left}),right:e.right})}if(self.operator!="-"||!(e instanceof AST_Number||e instanceof AST_Infinity)){var ev=self.evaluate(compressor);if(ev!==self){ev=make_node_from_constant(ev,self).optimize(compressor);return best_of(compressor,ev,self)}}return self});AST_Binary.DEFMETHOD("lift_sequences",function(compressor){if(compressor.option("sequences")){if(this.left instanceof AST_Sequence){var x=this.left.expressions.slice();var e=this.clone();e.left=x.pop();x.push(e);return make_sequence(this,x).optimize(compressor)}if(this.right instanceof AST_Sequence&&!this.left.has_side_effects(compressor)){var assign=this.operator=="="&&this.left instanceof AST_SymbolRef;var x=this.right.expressions;var last=x.length-1;for(var i=0;i<last;i++){if(!assign&&x[i].has_side_effects(compressor))break}if(i==last){x=x.slice();var e=this.clone();e.right=x.pop();x.push(e);return make_sequence(this,x).optimize(compressor)}else if(i>0){var e=this.clone();e.right=make_sequence(this.right,x.slice(i));x=x.slice(0,i);x.push(e);return make_sequence(this,x).optimize(compressor)}}}return this});var commutativeOperators=makePredicate("== === != !== * & | ^");function is_object(node){return node instanceof AST_Array||node instanceof AST_Lambda||node instanceof AST_Object}OPT(AST_Binary,function(self,compressor){function reversible(){return self.left.is_constant()||self.right.is_constant()||!self.left.has_side_effects(compressor)&&!self.right.has_side_effects(compressor)}function reverse(op){if(reversible()){if(op)self.operator=op;var tmp=self.left;self.left=self.right;self.right=tmp}}if(commutativeOperators[self.operator]){if(self.right.is_constant()&&!self.left.is_constant()){if(!(self.left instanceof AST_Binary&&PRECEDENCE[self.left.operator]>=PRECEDENCE[self.operator])){reverse()}}}self=self.lift_sequences(compressor);if(compressor.option("comparisons"))switch(self.operator){case"===":case"!==":var is_strict_comparison=true;if(self.left.is_string(compressor)&&self.right.is_string(compressor)||self.left.is_number(compressor)&&self.right.is_number(compressor)||self.left.is_boolean(compressor)&&self.right.is_boolean(compressor)||self.left.equivalent_to(self.right)){self.operator=self.operator.substr(0,2)}case"==":case"!=":if(!is_strict_comparison&&is_undefined(self.left,compressor)){self.left=make_node(AST_Null,self.left)}else if(compressor.option("typeofs")&&self.left instanceof AST_String&&self.left.value=="undefined"&&self.right instanceof AST_UnaryPrefix&&self.right.operator=="typeof"){var expr=self.right.expression;if(expr instanceof AST_SymbolRef?expr.is_declared(compressor):!(expr instanceof AST_PropAccess&&compressor.option("ie8"))){self.right=expr;self.left=make_node(AST_Undefined,self.left).optimize(compressor);if(self.operator.length==2)self.operator+="="}}else if(self.left instanceof AST_SymbolRef&&self.right instanceof AST_SymbolRef&&self.left.definition()===self.right.definition()&&is_object(self.left.fixed_value())){return make_node(self.operator[0]=="="?AST_True:AST_False,self)}break;case"&&":case"||":var lhs=self.left;if(lhs.operator==self.operator){lhs=lhs.right}if(lhs instanceof AST_Binary&&lhs.operator==(self.operator=="&&"?"!==":"===")&&self.right instanceof AST_Binary&&lhs.operator==self.right.operator&&(is_undefined(lhs.left,compressor)&&self.right.left instanceof AST_Null||lhs.left instanceof AST_Null&&is_undefined(self.right.left,compressor))&&!lhs.right.has_side_effects(compressor)&&lhs.right.equivalent_to(self.right.right)){var combined=make_node(AST_Binary,self,{operator:lhs.operator.slice(0,-1),left:make_node(AST_Null,self),right:lhs.right});if(lhs!==self.left){combined=make_node(AST_Binary,self,{operator:self.operator,left:self.left.left,right:combined})}return combined}break}if(compressor.option("booleans")&&self.operator=="+"&&compressor.in_boolean_context()){var ll=self.left.evaluate(compressor);var rr=self.right.evaluate(compressor);if(ll&&typeof ll=="string"){compressor.warn("+ in boolean context always true [{file}:{line},{col}]",self.start);return make_sequence(self,[self.right,make_node(AST_True,self)]).optimize(compressor)}if(rr&&typeof rr=="string"){compressor.warn("+ in boolean context always true [{file}:{line},{col}]",self.start);return make_sequence(self,[self.left,make_node(AST_True,self)]).optimize(compressor)}}if(compressor.option("comparisons")&&self.is_boolean(compressor)){if(!(compressor.parent()instanceof AST_Binary)||compressor.parent()instanceof AST_Assign){var negated=make_node(AST_UnaryPrefix,self,{operator:"!",expression:self.negate(compressor,first_in_statement(compressor))});self=best_of(compressor,self,negated)}switch(self.operator){case">":reverse("<");break;case">=":reverse("<=");break}}if(self.operator=="+"){if(self.right instanceof AST_String&&self.right.getValue()==""&&self.left.is_string(compressor)){return self.left}if(self.left instanceof AST_String&&self.left.getValue()==""&&self.right.is_string(compressor)){return self.right}if(self.left instanceof AST_Binary&&self.left.operator=="+"&&self.left.left instanceof AST_String&&self.left.left.getValue()==""&&self.right.is_string(compressor)){self.left=self.left.right;return self.transform(compressor)}}if(compressor.option("evaluate")){switch(self.operator){case"&&":var ll=fuzzy_eval(self.left);if(!ll){compressor.warn("Condition left of && always false [{file}:{line},{col}]",self.start);return maintain_this_binding(compressor,compressor.parent(),compressor.self(),self.left).optimize(compressor)}else if(!(ll instanceof AST_Node)){compressor.warn("Condition left of && always true [{file}:{line},{col}]",self.start);return make_sequence(self,[self.left,self.right]).optimize(compressor)}var rr=self.right.evaluate(compressor);if(!rr){if(compressor.option("booleans")&&compressor.in_boolean_context()){compressor.warn("Boolean && always false [{file}:{line},{col}]",self.start);return make_sequence(self,[self.left,make_node(AST_False,self)]).optimize(compressor)}else self.falsy=true}else if(!(rr instanceof AST_Node)){var parent=compressor.parent();if(parent.operator=="&&"&&parent.left===compressor.self()||compressor.option("booleans")&&compressor.in_boolean_context()){compressor.warn("Dropping side-effect-free && [{file}:{line},{col}]",self.start);return self.left.optimize(compressor)}}if(self.left.operator=="||"){var lr=self.left.right.evaluate(compressor);if(!lr)return make_node(AST_Conditional,self,{condition:self.left.left,consequent:self.right,alternative:self.left.right}).optimize(compressor)}break;case"||":var ll=fuzzy_eval(self.left);if(!ll){compressor.warn("Condition left of || always false [{file}:{line},{col}]",self.start);return make_sequence(self,[self.left,self.right]).optimize(compressor)}else if(!(ll instanceof AST_Node)){compressor.warn("Condition left of || always true [{file}:{line},{col}]",self.start);return maintain_this_binding(compressor,compressor.parent(),compressor.self(),self.left).optimize(compressor)}var rr=self.right.evaluate(compressor);if(!rr){var parent=compressor.parent();if(parent.operator=="||"&&parent.left===compressor.self()||compressor.option("booleans")&&compressor.in_boolean_context()){compressor.warn("Dropping side-effect-free || [{file}:{line},{col}]",self.start);return self.left.optimize(compressor)}}else if(!(rr instanceof AST_Node)){if(compressor.option("booleans")&&compressor.in_boolean_context()){compressor.warn("Boolean || always true [{file}:{line},{col}]",self.start);return make_sequence(self,[self.left,make_node(AST_True,self)]).optimize(compressor)}else self.truthy=true}if(self.left.operator=="&&"){var lr=self.left.right.evaluate(compressor);if(lr&&!(lr instanceof AST_Node))return make_node(AST_Conditional,self,{condition:self.left.left,consequent:self.left.right,alternative:self.right}).optimize(compressor)}break}var associative=true;switch(self.operator){case"+":if(self.left instanceof AST_Constant&&self.right instanceof AST_Binary&&self.right.operator=="+"&&self.right.left instanceof AST_Constant&&self.right.is_string(compressor)){self=make_node(AST_Binary,self,{operator:"+",left:make_node(AST_String,self.left,{value:""+self.left.getValue()+self.right.left.getValue(),start:self.left.start,end:self.right.left.end}),right:self.right.right})}if(self.right instanceof AST_Constant&&self.left instanceof AST_Binary&&self.left.operator=="+"&&self.left.right instanceof AST_Constant&&self.left.is_string(compressor)){self=make_node(AST_Binary,self,{operator:"+",left:self.left.left,right:make_node(AST_String,self.right,{value:""+self.left.right.getValue()+self.right.getValue(),start:self.left.right.start,end:self.right.end})})}if(self.left instanceof AST_Binary&&self.left.operator=="+"&&self.left.is_string(compressor)&&self.left.right instanceof AST_Constant&&self.right instanceof AST_Binary&&self.right.operator=="+"&&self.right.left instanceof AST_Constant&&self.right.is_string(compressor)){self=make_node(AST_Binary,self,{operator:"+",left:make_node(AST_Binary,self.left,{operator:"+",left:self.left.left,right:make_node(AST_String,self.left.right,{value:""+self.left.right.getValue()+self.right.left.getValue(),start:self.left.right.start,end:self.right.left.end})}),right:self.right.right})}if(self.right instanceof AST_UnaryPrefix&&self.right.operator=="-"&&self.left.is_number(compressor)){self=make_node(AST_Binary,self,{operator:"-",left:self.left,right:self.right.expression});break}if(self.left instanceof AST_UnaryPrefix&&self.left.operator=="-"&&reversible()&&self.right.is_number(compressor)){self=make_node(AST_Binary,self,{operator:"-",left:self.right,right:self.left.expression});break}case"*":associative=compressor.option("unsafe_math");case"&":case"|":case"^":if(self.left.is_number(compressor)&&self.right.is_number(compressor)&&reversible()&&!(self.left instanceof AST_Binary&&self.left.operator!=self.operator&&PRECEDENCE[self.left.operator]>=PRECEDENCE[self.operator])){var reversed=make_node(AST_Binary,self,{operator:self.operator,left:self.right,right:self.left});if(self.right instanceof AST_Constant&&!(self.left instanceof AST_Constant)){self=best_of(compressor,reversed,self)}else{self=best_of(compressor,self,reversed)}}if(associative&&self.is_number(compressor)){if(self.right instanceof AST_Binary&&self.right.operator==self.operator){self=make_node(AST_Binary,self,{operator:self.operator,left:make_node(AST_Binary,self.left,{operator:self.operator,left:self.left,right:self.right.left,start:self.left.start,end:self.right.left.end}),right:self.right.right})}if(self.right instanceof AST_Constant&&self.left instanceof AST_Binary&&self.left.operator==self.operator){if(self.left.left instanceof AST_Constant){self=make_node(AST_Binary,self,{operator:self.operator,left:make_node(AST_Binary,self.left,{operator:self.operator,left:self.left.left,right:self.right,start:self.left.left.start,end:self.right.end}),right:self.left.right})}else if(self.left.right instanceof AST_Constant){self=make_node(AST_Binary,self,{operator:self.operator,left:make_node(AST_Binary,self.left,{operator:self.operator,left:self.left.right,right:self.right,start:self.left.right.start,end:self.right.end}),right:self.left.left})}}if(self.left instanceof AST_Binary&&self.left.operator==self.operator&&self.left.right instanceof AST_Constant&&self.right instanceof AST_Binary&&self.right.operator==self.operator&&self.right.left instanceof AST_Constant){self=make_node(AST_Binary,self,{operator:self.operator,left:make_node(AST_Binary,self.left,{operator:self.operator,left:make_node(AST_Binary,self.left.left,{operator:self.operator,left:self.left.right,right:self.right.left,start:self.left.right.start,end:self.right.left.end}),right:self.left.left}),right:self.right.right})}}}}if(self.right instanceof AST_Binary&&self.right.operator==self.operator&&(lazy_op[self.operator]||self.operator=="+"&&(self.right.left.is_string(compressor)||self.left.is_string(compressor)&&self.right.right.is_string(compressor)))){self.left=make_node(AST_Binary,self.left,{operator:self.operator,left:self.left,right:self.right.left});self.right=self.right.right;return self.transform(compressor)}var ev=self.evaluate(compressor);if(ev!==self){ev=make_node_from_constant(ev,self).optimize(compressor);return best_of(compressor,ev,self)}return self;function fuzzy_eval(node){if(node.truthy)return true;if(node.falsy)return false;if(node.is_truthy())return true;return node.evaluate(compressor)}});function recursive_ref(compressor,def){var node;for(var i=0;node=compressor.parent(i);i++){if(node instanceof AST_Lambda){var name=node.name;if(name&&name.definition()===def)break}}return node}OPT(AST_SymbolRef,function(self,compressor){if(!compressor.option("ie8")&&is_undeclared_ref(self)&&!(self.scope.uses_with&&compressor.find_parent(AST_With))){switch(self.name){case"undefined":return make_node(AST_Undefined,self).optimize(compressor);case"NaN":return make_node(AST_NaN,self).optimize(compressor);case"Infinity":return make_node(AST_Infinity,self).optimize(compressor)}}var parent=compressor.parent();if(compressor.option("reduce_vars")&&is_lhs(self,parent)!==self){var def=self.definition();var fixed=self.fixed_value();var single_use=def.single_use&&!(parent instanceof AST_Call&&parent.is_expr_pure(compressor));if(single_use&&fixed instanceof AST_Lambda){if(def.scope!==self.scope&&(!compressor.option("reduce_funcs")||def.escaped==1||fixed.inlined)){single_use=false}else if(recursive_ref(compressor,def)){single_use=false}else if(def.scope!==self.scope||def.orig[0]instanceof AST_SymbolFunarg){single_use=fixed.is_constant_expression(self.scope);if(single_use=="f"){var scope=self.scope;do{if(scope instanceof AST_Defun||scope instanceof AST_Function){scope.inlined=true}}while(scope=scope.parent_scope)}}}if(single_use&&fixed){def.single_use=false;if(fixed instanceof AST_Defun){fixed._squeezed=true;fixed=make_node(AST_Function,fixed,fixed);fixed.name=make_node(AST_SymbolLambda,fixed.name,fixed.name)}var value;if(def.recursive_refs>0){value=fixed.clone(true);var defun_def=value.name.definition();var lambda_def=value.variables.get(value.name.name);var name=lambda_def&&lambda_def.orig[0];if(!(name instanceof AST_SymbolLambda)){name=make_node(AST_SymbolLambda,value.name,value.name);name.scope=value;value.name=name;lambda_def=value.def_function(name)}value.walk(new TreeWalker(function(node){if(!(node instanceof AST_SymbolRef))return;var def=node.definition();if(def===defun_def){node.thedef=lambda_def;lambda_def.references.push(node)}else{def.single_use=false}}))}else{value=fixed.optimize(compressor);if(value===fixed)value=fixed.clone(true)}return value}if(fixed&&def.should_replace===undefined){var init;if(fixed instanceof AST_This){if(!(def.orig[0]instanceof AST_SymbolFunarg)&&all(def.references,function(ref){return def.scope===ref.scope})){init=fixed}}else{var ev=fixed.evaluate(compressor);if(ev!==fixed&&(compressor.option("unsafe_regexp")||!(ev instanceof RegExp))){init=make_node_from_constant(ev,fixed)}}if(init){var value_length=init.optimize(compressor).print_to_string().length;var fn;if(has_symbol_ref(fixed)){fn=function(){var result=init.optimize(compressor);return result===init?result.clone(true):result}}else{value_length=Math.min(value_length,fixed.print_to_string().length);fn=function(){var result=best_of_expression(init.optimize(compressor),fixed);return result===init||result===fixed?result.clone(true):result}}var name_length=def.name.length;var overhead=0;if(compressor.option("unused")&&!compressor.exposed(def)){overhead=(name_length+2+value_length)/(def.references.length-def.assignments)}def.should_replace=value_length<=name_length+overhead?fn:false}else{def.should_replace=false}}if(def.should_replace){return def.should_replace()}}return self;function has_symbol_ref(value){var found;value.walk(new TreeWalker(function(node){if(node instanceof AST_SymbolRef)found=true;if(found)return true}));return found}});function is_atomic(lhs,self){return lhs instanceof AST_SymbolRef||lhs.TYPE===self.TYPE}OPT(AST_Undefined,function(self,compressor){if(compressor.option("unsafe_undefined")){var undef=find_variable(compressor,"undefined");if(undef){var ref=make_node(AST_SymbolRef,self,{name:"undefined",scope:undef.scope,thedef:undef});ref.is_undefined=true;return ref}}var lhs=is_lhs(compressor.self(),compressor.parent());if(lhs&&is_atomic(lhs,self))return self;return make_node(AST_UnaryPrefix,self,{operator:"void",expression:make_node(AST_Number,self,{value:0})})});OPT(AST_Infinity,function(self,compressor){var lhs=is_lhs(compressor.self(),compressor.parent());if(lhs&&is_atomic(lhs,self))return self;if(compressor.option("keep_infinity")&&!(lhs&&!is_atomic(lhs,self))&&!find_variable(compressor,"Infinity"))return self;return make_node(AST_Binary,self,{operator:"/",left:make_node(AST_Number,self,{value:1}),right:make_node(AST_Number,self,{value:0})})});OPT(AST_NaN,function(self,compressor){var lhs=is_lhs(compressor.self(),compressor.parent());if(lhs&&!is_atomic(lhs,self)||find_variable(compressor,"NaN")){return make_node(AST_Binary,self,{operator:"/",left:make_node(AST_Number,self,{value:0}),right:make_node(AST_Number,self,{value:0})})}return self});function is_reachable(self,defs){var reachable=false;var find_ref=new TreeWalker(function(node){if(reachable)return true;if(node instanceof AST_SymbolRef&&member(node.definition(),defs)){return reachable=true}});var scan_scope=new TreeWalker(function(node){if(reachable)return true;if(node instanceof AST_Scope&&node!==self){var parent=scan_scope.parent();if(parent instanceof AST_Call&&parent.expression===node)return;node.walk(find_ref);return true}});self.walk(scan_scope);return reachable}var ASSIGN_OPS=makePredicate("+ - / * % >> << >>> | ^ &");var ASSIGN_OPS_COMMUTATIVE=makePredicate("* | ^ &");OPT(AST_Assign,function(self,compressor){var def;if(compressor.option("dead_code")&&self.left instanceof AST_SymbolRef&&(def=self.left.definition()).scope===compressor.find_parent(AST_Lambda)){var level=0,node,parent=self;do{node=parent;parent=compressor.parent(level++);if(parent instanceof AST_Exit){if(in_try(level,parent))break;if(is_reachable(def.scope,[def]))break;if(self.operator=="=")return self.right;def.fixed=false;return make_node(AST_Binary,self,{operator:self.operator.slice(0,-1),left:self.left,right:self.right}).optimize(compressor)}}while(parent instanceof AST_Binary&&parent.right===node||parent instanceof AST_Sequence&&parent.tail_node()===node)}self=self.lift_sequences(compressor);if(self.operator=="="&&self.left instanceof AST_SymbolRef&&self.right instanceof AST_Binary){if(self.right.left instanceof AST_SymbolRef&&self.right.left.name==self.left.name&&ASSIGN_OPS[self.right.operator]){self.operator=self.right.operator+"=";self.right=self.right.right}else if(self.right.right instanceof AST_SymbolRef&&self.right.right.name==self.left.name&&ASSIGN_OPS_COMMUTATIVE[self.right.operator]&&!self.right.left.has_side_effects(compressor)){self.operator=self.right.operator+"=";self.right=self.right.left}}return self;function in_try(level,node){var right=self.right;self.right=make_node(AST_Null,right);var may_throw=node.may_throw(compressor);self.right=right;var scope=self.left.definition().scope;var parent;while((parent=compressor.parent(level++))!==scope){if(parent instanceof AST_Try){if(parent.bfinally)return true;if(may_throw&&parent.bcatch)return true}}}});OPT(AST_Conditional,function(self,compressor){if(!compressor.option("conditionals"))return self;if(self.condition instanceof AST_Sequence){var expressions=self.condition.expressions.slice();self.condition=expressions.pop();expressions.push(self);return make_sequence(self,expressions)}var cond=self.condition.is_truthy()||self.condition.tail_node().evaluate(compressor);if(!cond){compressor.warn("Condition always false [{file}:{line},{col}]",self.start);return make_sequence(self,[self.condition,self.alternative]).optimize(compressor)}else if(!(cond instanceof AST_Node)){compressor.warn("Condition always true [{file}:{line},{col}]",self.start);return make_sequence(self,[self.condition,self.consequent]).optimize(compressor)}var negated=cond.negate(compressor,first_in_statement(compressor));if(best_of(compressor,cond,negated)===negated){self=make_node(AST_Conditional,self,{condition:negated,consequent:self.alternative,alternative:self.consequent})}var condition=self.condition;var consequent=self.consequent;var alternative=self.alternative;if(condition instanceof AST_SymbolRef&&consequent instanceof AST_SymbolRef&&condition.definition()===consequent.definition()){return make_node(AST_Binary,self,{operator:"||",left:condition,right:alternative})}var seq_tail=consequent.tail_node();if(seq_tail instanceof AST_Assign){var is_eq=seq_tail.operator=="=";var alt_tail=is_eq?alternative.tail_node():alternative;if((is_eq||consequent instanceof AST_Assign)&&alt_tail instanceof AST_Assign&&seq_tail.operator==alt_tail.operator&&seq_tail.left.equivalent_to(alt_tail.left)&&(!condition.has_side_effects(compressor)||is_eq&&!seq_tail.left.has_side_effects(compressor))){return make_node(AST_Assign,self,{operator:seq_tail.operator,left:seq_tail.left,right:make_node(AST_Conditional,self,{condition:condition,consequent:pop_lhs(consequent),alternative:pop_lhs(alternative)})})}}var arg_index;if(consequent instanceof AST_Call&&alternative.TYPE===consequent.TYPE&&consequent.args.length>0&&consequent.args.length==alternative.args.length&&consequent.expression.equivalent_to(alternative.expression)&&!condition.has_side_effects(compressor)&&!consequent.expression.has_side_effects(compressor)&&typeof(arg_index=single_arg_diff())=="number"){var node=consequent.clone();node.args[arg_index]=make_node(AST_Conditional,self,{condition:condition,consequent:consequent.args[arg_index],alternative:alternative.args[arg_index]});return node}if(consequent instanceof AST_Conditional&&consequent.alternative.equivalent_to(alternative)){return make_node(AST_Conditional,self,{condition:make_node(AST_Binary,self,{left:condition,operator:"&&",right:consequent.condition}),consequent:consequent.consequent,alternative:alternative})}if(consequent.equivalent_to(alternative)){return make_sequence(self,[condition,consequent]).optimize(compressor)}if((consequent instanceof AST_Sequence||alternative instanceof AST_Sequence)&&consequent.tail_node().equivalent_to(alternative.tail_node())){return make_sequence(self,[make_node(AST_Conditional,self,{condition:condition,consequent:pop_seq(consequent),alternative:pop_seq(alternative)}),consequent.tail_node()]).optimize(compressor)}if(consequent instanceof AST_Binary&&consequent.operator=="||"&&consequent.right.equivalent_to(alternative)){return make_node(AST_Binary,self,{operator:"||",left:make_node(AST_Binary,self,{operator:"&&",left:condition,right:consequent.left}),right:alternative}).optimize(compressor)}var in_bool=compressor.option("booleans")&&compressor.in_boolean_context();if(is_true(self.consequent)){if(is_false(self.alternative)){return booleanize(condition)}return make_node(AST_Binary,self,{operator:"||",left:booleanize(condition),right:self.alternative})}if(is_false(self.consequent)){if(is_true(self.alternative)){return booleanize(condition.negate(compressor))}return make_node(AST_Binary,self,{operator:"&&",left:booleanize(condition.negate(compressor)),right:self.alternative})}if(is_true(self.alternative)){return make_node(AST_Binary,self,{operator:"||",left:booleanize(condition.negate(compressor)),right:self.consequent})}if(is_false(self.alternative)){return make_node(AST_Binary,self,{operator:"&&",left:booleanize(condition),right:self.consequent})}return self;function booleanize(node){if(node.is_boolean(compressor))return node;return make_node(AST_UnaryPrefix,node,{operator:"!",expression:node.negate(compressor)})}function is_true(node){return node instanceof AST_True||in_bool&&node instanceof AST_Constant&&node.getValue()||node instanceof AST_UnaryPrefix&&node.operator=="!"&&node.expression instanceof AST_Constant&&!node.expression.getValue()}function is_false(node){return node instanceof AST_False||in_bool&&node instanceof AST_Constant&&!node.getValue()||node instanceof AST_UnaryPrefix&&node.operator=="!"&&node.expression instanceof AST_Constant&&node.expression.getValue()}function single_arg_diff(){var a=consequent.args;var b=alternative.args;for(var i=0,len=a.length;i<len;i++){if(!a[i].equivalent_to(b[i])){for(var j=i+1;j<len;j++){if(!a[j].equivalent_to(b[j]))return}return i}}}function pop_lhs(node){if(!(node instanceof AST_Sequence))return node.right;var exprs=node.expressions.slice();exprs.push(exprs.pop().right);return make_sequence(node,exprs)}function pop_seq(node){if(!(node instanceof AST_Sequence))return make_node(AST_Number,node,{value:0});return make_sequence(node,node.expressions.slice(0,-1))}});OPT(AST_Boolean,function(self,compressor){if(!compressor.option("booleans"))return self;if(compressor.in_boolean_context())return make_node(AST_Number,self,{value:+self.value});var p=compressor.parent();if(p instanceof AST_Binary&&(p.operator=="=="||p.operator=="!=")){compressor.warn("Non-strict equality against boolean: {operator} {value} [{file}:{line},{col}]",{operator:p.operator,value:self.value,file:p.start.file,line:p.start.line,col:p.start.col});return make_node(AST_Number,self,{value:+self.value})}return make_node(AST_UnaryPrefix,self,{operator:"!",expression:make_node(AST_Number,self,{value:1-self.value})})});function safe_to_flatten(value,compressor){if(value instanceof AST_SymbolRef){value=value.fixed_value()}if(!value)return false;return!(value instanceof AST_Lambda)||compressor.parent()instanceof AST_New||!value.contains_this()}OPT(AST_Sub,function(self,compressor){var expr=self.expression;var prop=self.property;if(compressor.option("properties")){var key=prop.evaluate(compressor);if(key!==prop){if(typeof key=="string"){if(key=="undefined"){key=undefined}else{var value=parseFloat(key);if(value.toString()==key){key=value}}}prop=self.property=best_of_expression(prop,make_node_from_constant(key,prop).transform(compressor));var property=""+key;if(is_identifier_string(property)&&property.length<=prop.print_to_string().length+1){return make_node(AST_Dot,self,{expression:expr,property:property}).optimize(compressor)}}}var fn;if(compressor.option("arguments")&&expr instanceof AST_SymbolRef&&expr.name=="arguments"&&expr.definition().orig.length==1&&(fn=expr.scope)instanceof AST_Lambda&&prop instanceof AST_Number){var index=prop.getValue();var argname=fn.argnames[index];if(argname&&compressor.has_directive("use strict")){var def=argname.definition();if(!compressor.option("reduce_vars")||def.assignments||def.orig.length>1){argname=null}}else if(!argname&&!compressor.option("keep_fargs")&&index<fn.argnames.length+5){while(index>=fn.argnames.length){argname=make_node(AST_SymbolFunarg,fn,{name:fn.make_var_name("argument_"+fn.argnames.length),scope:fn});fn.argnames.push(argname);fn.enclosed.push(fn.def_variable(argname))}}if(argname&&find_if(function(node){return node.name===argname.name},fn.argnames)===argname){var sym=make_node(AST_SymbolRef,self,argname);sym.reference({});delete argname.__unused;return sym}}if(is_lhs(self,compressor.parent()))return self;if(key!==prop){var sub=self.flatten_object(property,compressor);if(sub){expr=self.expression=sub.expression;prop=self.property=sub.property}}if(compressor.option("properties")&&compressor.option("side_effects")&&prop instanceof AST_Number&&expr instanceof AST_Array){var index=prop.getValue();var elements=expr.elements;var retValue=elements[index];if(safe_to_flatten(retValue,compressor)){var flatten=true;var values=[];for(var i=elements.length;--i>index;){var value=elements[i].drop_side_effect_free(compressor);if(value){values.unshift(value);if(flatten&&value.has_side_effects(compressor))flatten=false}}retValue=retValue instanceof AST_Hole?make_node(AST_Undefined,retValue):retValue;if(!flatten)values.unshift(retValue);while(--i>=0){var value=elements[i].drop_side_effect_free(compressor);if(value)values.unshift(value);else index--}if(flatten){values.push(retValue);return make_sequence(self,values).optimize(compressor)}else return make_node(AST_Sub,self,{expression:make_node(AST_Array,expr,{elements:values}),property:make_node(AST_Number,prop,{value:index})})}}var ev=self.evaluate(compressor);if(ev!==self){ev=make_node_from_constant(ev,self).optimize(compressor);return best_of(compressor,ev,self)}return self});AST_Scope.DEFMETHOD("contains_this",function(){var result;var self=this;self.walk(new TreeWalker(function(node){if(result)return true;if(node instanceof AST_This)return result=true;if(node!==self&&node instanceof AST_Scope)return true}));return result});AST_PropAccess.DEFMETHOD("flatten_object",function(key,compressor){if(!compressor.option("properties"))return;var expr=this.expression;if(expr instanceof AST_Object){var props=expr.properties;for(var i=props.length;--i>=0;){var prop=props[i];if(""+prop.key==key){if(!all(props,function(prop){return prop instanceof AST_ObjectKeyVal}))break;if(!safe_to_flatten(prop.value,compressor))break;return make_node(AST_Sub,this,{expression:make_node(AST_Array,expr,{elements:props.map(function(prop){return prop.value})}),property:make_node(AST_Number,this,{value:i})})}}}});OPT(AST_Dot,function(self,compressor){if(self.property=="arguments"||self.property=="caller"){compressor.warn("Function.protoype.{prop} not supported [{file}:{line},{col}]",{prop:self.property,file:self.start.file,line:self.start.line,col:self.start.col})}if(is_lhs(self,compressor.parent()))return self;if(compressor.option("unsafe_proto")&&self.expression instanceof AST_Dot&&self.expression.property=="prototype"){var exp=self.expression.expression;if(is_undeclared_ref(exp))switch(exp.name){case"Array":self.expression=make_node(AST_Array,self.expression,{elements:[]});break;case"Function":self.expression=make_node(AST_Function,self.expression,{argnames:[],body:[]});break;case"Number":self.expression=make_node(AST_Number,self.expression,{value:0});break;case"Object":self.expression=make_node(AST_Object,self.expression,{properties:[]});break;case"RegExp":self.expression=make_node(AST_RegExp,self.expression,{value:/t/});break;case"String":self.expression=make_node(AST_String,self.expression,{value:""});break}}var sub=self.flatten_object(self.property,compressor);if(sub)return sub.optimize(compressor);var ev=self.evaluate(compressor);if(ev!==self){ev=make_node_from_constant(ev,self).optimize(compressor);return best_of(compressor,ev,self)}return self});OPT(AST_Return,function(self,compressor){if(self.value&&is_undefined(self.value,compressor)){self.value=null}return self})})(function(node,optimizer){node.DEFMETHOD("optimize",function(compressor){var self=this;if(self._optimized)return self;if(compressor.has_directive("use asm"))return self;var opt=optimizer(self,compressor);opt._optimized=true;return opt})});"use strict";function SourceMap(options){options=defaults(options,{file:null,root:null,orig:null,orig_line_diff:0,dest_line_diff:0},true);var generator=new MOZ_SourceMap.SourceMapGenerator({file:options.file,sourceRoot:options.root});var maps=options.orig&&Object.create(null);if(maps)for(var source in options.orig){var map=new MOZ_SourceMap.SourceMapConsumer(options.orig[source]);if(Array.isArray(options.orig[source].sources)){map._sources.toArray().forEach(function(source){var sourceContent=map.sourceContentFor(source,true);if(sourceContent)generator.setSourceContent(source,sourceContent)})}maps[source]=map}return{add:function(source,gen_line,gen_col,orig_line,orig_col,name){var map=maps&&maps[source];if(map){var info=map.originalPositionFor({line:orig_line,column:orig_col});if(info.source===null)return;source=info.source;orig_line=info.line;orig_col=info.column;name=info.name||name}generator.addMapping({name:name,source:source,generated:{line:gen_line+options.dest_line_diff,column:gen_col},original:{line:orig_line+options.orig_line_diff,column:orig_col}})},get:function(){return generator},toString:function(){return JSON.stringify(generator.toJSON())}}}"use strict";(function(){function normalize_directives(body){var in_directive=true;for(var i=0;i<body.length;i++){if(in_directive&&body[i]instanceof AST_Statement&&body[i].body instanceof AST_String){body[i]=new AST_Directive({start:body[i].start,end:body[i].end,value:body[i].body.value})}else if(in_directive&&!(body[i]instanceof AST_Statement&&body[i].body instanceof AST_String)){in_directive=false}}return body}var MOZ_TO_ME={Program:function(M){return new AST_Toplevel({start:my_start_token(M),end:my_end_token(M),body:normalize_directives(M.body.map(from_moz))})},FunctionDeclaration:function(M){return new AST_Defun({start:my_start_token(M),end:my_end_token(M),name:from_moz(M.id),argnames:M.params.map(from_moz),body:normalize_directives(from_moz(M.body).body)})},FunctionExpression:function(M){return new AST_Function({start:my_start_token(M),end:my_end_token(M),name:from_moz(M.id),argnames:M.params.map(from_moz),body:normalize_directives(from_moz(M.body).body)})},ExpressionStatement:function(M){return new AST_SimpleStatement({start:my_start_token(M),end:my_end_token(M),body:from_moz(M.expression)})},TryStatement:function(M){var handlers=M.handlers||[M.handler];if(handlers.length>1||M.guardedHandlers&&M.guardedHandlers.length){throw new Error("Multiple catch clauses are not supported.")}return new AST_Try({start:my_start_token(M),end:my_end_token(M),body:from_moz(M.block).body,bcatch:from_moz(handlers[0]),bfinally:M.finalizer?new AST_Finally(from_moz(M.finalizer)):null})},Property:function(M){var key=M.key;var args={start:my_start_token(key),end:my_end_token(M.value),key:key.type=="Identifier"?key.name:key.value,value:from_moz(M.value)};if(M.kind=="init")return new AST_ObjectKeyVal(args);args.key=new AST_SymbolAccessor({name:args.key});args.value=new AST_Accessor(args.value);if(M.kind=="get")return new AST_ObjectGetter(args);if(M.kind=="set")return new AST_ObjectSetter(args)},ArrayExpression:function(M){return new AST_Array({start:my_start_token(M),end:my_end_token(M),elements:M.elements.map(function(elem){return elem===null?new AST_Hole:from_moz(elem)})})},ObjectExpression:function(M){return new AST_Object({start:my_start_token(M),end:my_end_token(M),properties:M.properties.map(function(prop){prop.type="Property";return from_moz(prop)})})},SequenceExpression:function(M){return new AST_Sequence({start:my_start_token(M),end:my_end_token(M),expressions:M.expressions.map(from_moz)})},MemberExpression:function(M){return new(M.computed?AST_Sub:AST_Dot)({start:my_start_token(M),end:my_end_token(M),property:M.computed?from_moz(M.property):M.property.name,expression:from_moz(M.object)})},SwitchCase:function(M){return new(M.test?AST_Case:AST_Default)({start:my_start_token(M),end:my_end_token(M),expression:from_moz(M.test),body:M.consequent.map(from_moz)})},VariableDeclaration:function(M){return new AST_Var({start:my_start_token(M),end:my_end_token(M),definitions:M.declarations.map(from_moz)})},Literal:function(M){var val=M.value,args={start:my_start_token(M),end:my_end_token(M)};if(val===null)return new AST_Null(args);var rx=M.regex;if(rx&&rx.pattern){args.value=new RegExp(rx.pattern,rx.flags);args.value.raw_source=rx.pattern;return new AST_RegExp(args)}else if(rx){args.value=M.regex&&M.raw?M.raw:val;return new AST_RegExp(args)}switch(typeof val){case"string":args.value=val;return new AST_String(args);case"number":args.value=val;return new AST_Number(args);case"boolean":return new(val?AST_True:AST_False)(args)}},Identifier:function(M){var p=FROM_MOZ_STACK[FROM_MOZ_STACK.length-2];return new(p.type=="LabeledStatement"?AST_Label:p.type=="VariableDeclarator"&&p.id===M?AST_SymbolVar:p.type=="FunctionExpression"?p.id===M?AST_SymbolLambda:AST_SymbolFunarg:p.type=="FunctionDeclaration"?p.id===M?AST_SymbolDefun:AST_SymbolFunarg:p.type=="CatchClause"?AST_SymbolCatch:p.type=="BreakStatement"||p.type=="ContinueStatement"?AST_LabelRef:AST_SymbolRef)({start:my_start_token(M),end:my_end_token(M),name:M.name})}};MOZ_TO_ME.UpdateExpression=MOZ_TO_ME.UnaryExpression=function To_Moz_Unary(M){var prefix="prefix"in M?M.prefix:M.type=="UnaryExpression"?true:false;return new(prefix?AST_UnaryPrefix:AST_UnaryPostfix)({start:my_start_token(M),end:my_end_token(M),operator:M.operator,expression:from_moz(M.argument)})};map("EmptyStatement",AST_EmptyStatement);map("BlockStatement",AST_BlockStatement,"body@body");map("IfStatement",AST_If,"test>condition, consequent>body, alternate>alternative");map("LabeledStatement",AST_LabeledStatement,"label>label, body>body");map("BreakStatement",AST_Break,"label>label");map("ContinueStatement",AST_Continue,"label>label");map("WithStatement",AST_With,"object>expression, body>body");map("SwitchStatement",AST_Switch,"discriminant>expression, cases@body");map("ReturnStatement",AST_Return,"argument>value");map("ThrowStatement",AST_Throw,"argument>value");map("WhileStatement",AST_While,"test>condition, body>body");map("DoWhileStatement",AST_Do,"test>condition, body>body");map("ForStatement",AST_For,"init>init, test>condition, update>step, body>body");map("ForInStatement",AST_ForIn,"left>init, right>object, body>body");map("DebuggerStatement",AST_Debugger);map("VariableDeclarator",AST_VarDef,"id>name, init>value");map("CatchClause",AST_Catch,"param>argname, body%body");map("ThisExpression",AST_This);map("BinaryExpression",AST_Binary,"operator=operator, left>left, right>right");map("LogicalExpression",AST_Binary,"operator=operator, left>left, right>right");map("AssignmentExpression",AST_Assign,"operator=operator, left>left, right>right");map("ConditionalExpression",AST_Conditional,"test>condition, consequent>consequent, alternate>alternative");map("NewExpression",AST_New,"callee>expression, arguments@args");map("CallExpression",AST_Call,"callee>expression, arguments@args");def_to_moz(AST_Toplevel,function To_Moz_Program(M){return to_moz_scope("Program",M)});def_to_moz(AST_Defun,function To_Moz_FunctionDeclaration(M){return{type:"FunctionDeclaration",id:to_moz(M.name),params:M.argnames.map(to_moz),body:to_moz_scope("BlockStatement",M)}});def_to_moz(AST_Function,function To_Moz_FunctionExpression(M){return{type:"FunctionExpression",id:to_moz(M.name),params:M.argnames.map(to_moz),body:to_moz_scope("BlockStatement",M)}});def_to_moz(AST_Directive,function To_Moz_Directive(M){return{type:"ExpressionStatement",expression:{type:"Literal",value:M.value}}});def_to_moz(AST_SimpleStatement,function To_Moz_ExpressionStatement(M){return{type:"ExpressionStatement",expression:to_moz(M.body)}});def_to_moz(AST_SwitchBranch,function To_Moz_SwitchCase(M){return{type:"SwitchCase",test:to_moz(M.expression),consequent:M.body.map(to_moz)}});def_to_moz(AST_Try,function To_Moz_TryStatement(M){return{type:"TryStatement",block:to_moz_block(M),handler:to_moz(M.bcatch),guardedHandlers:[],finalizer:to_moz(M.bfinally)}});def_to_moz(AST_Catch,function To_Moz_CatchClause(M){return{type:"CatchClause",param:to_moz(M.argname),guard:null,body:to_moz_block(M)}});def_to_moz(AST_Definitions,function To_Moz_VariableDeclaration(M){return{type:"VariableDeclaration",kind:"var",declarations:M.definitions.map(to_moz)}});def_to_moz(AST_Sequence,function To_Moz_SequenceExpression(M){return{type:"SequenceExpression",expressions:M.expressions.map(to_moz)}});def_to_moz(AST_PropAccess,function To_Moz_MemberExpression(M){var isComputed=M instanceof AST_Sub;return{type:"MemberExpression",object:to_moz(M.expression),computed:isComputed,property:isComputed?to_moz(M.property):{type:"Identifier",name:M.property}}});def_to_moz(AST_Unary,function To_Moz_Unary(M){return{type:M.operator=="++"||M.operator=="--"?"UpdateExpression":"UnaryExpression",operator:M.operator,prefix:M instanceof AST_UnaryPrefix,argument:to_moz(M.expression)}});def_to_moz(AST_Binary,function To_Moz_BinaryExpression(M){return{type:M.operator=="&&"||M.operator=="||"?"LogicalExpression":"BinaryExpression",left:to_moz(M.left),operator:M.operator,right:to_moz(M.right)}});def_to_moz(AST_Array,function To_Moz_ArrayExpression(M){return{type:"ArrayExpression",elements:M.elements.map(to_moz)}});def_to_moz(AST_Object,function To_Moz_ObjectExpression(M){return{type:"ObjectExpression",properties:M.properties.map(to_moz)}});def_to_moz(AST_ObjectProperty,function To_Moz_Property(M){var key={type:"Literal",value:M.key instanceof AST_SymbolAccessor?M.key.name:M.key};var kind;if(M instanceof AST_ObjectKeyVal){kind="init"}else if(M instanceof AST_ObjectGetter){kind="get"}else if(M instanceof AST_ObjectSetter){kind="set"}return{type:"Property",kind:kind,key:key,value:to_moz(M.value)}});def_to_moz(AST_Symbol,function To_Moz_Identifier(M){var def=M.definition();return{type:"Identifier",name:def?def.mangled_name||def.name:M.name}});def_to_moz(AST_RegExp,function To_Moz_RegExpLiteral(M){var flags=M.value.toString().match(/[gimuy]*$/)[0];var value="/"+M.value.raw_source+"/"+flags;return{type:"Literal",value:value,raw:value,regex:{pattern:M.value.raw_source,flags:flags}}});def_to_moz(AST_Constant,function To_Moz_Literal(M){var value=M.value;if(typeof value==="number"&&(value<0||value===0&&1/value<0)){return{type:"UnaryExpression",operator:"-",prefix:true,argument:{type:"Literal",value:-value,raw:M.start.raw}}}return{type:"Literal",value:value,raw:M.start.raw}});def_to_moz(AST_Atom,function To_Moz_Atom(M){return{type:"Identifier",name:String(M.value)}});AST_Boolean.DEFMETHOD("to_mozilla_ast",AST_Constant.prototype.to_mozilla_ast);AST_Null.DEFMETHOD("to_mozilla_ast",AST_Constant.prototype.to_mozilla_ast);AST_Hole.DEFMETHOD("to_mozilla_ast",function To_Moz_ArrayHole(){return null});AST_Block.DEFMETHOD("to_mozilla_ast",AST_BlockStatement.prototype.to_mozilla_ast);AST_Lambda.DEFMETHOD("to_mozilla_ast",AST_Function.prototype.to_mozilla_ast);function raw_token(moznode){if(moznode.type=="Literal"){return moznode.raw!=null?moznode.raw:moznode.value+""}}function my_start_token(moznode){var loc=moznode.loc,start=loc&&loc.start;var range=moznode.range;return new AST_Token({file:loc&&loc.source,line:start&&start.line,col:start&&start.column,pos:range?range[0]:moznode.start,endline:start&&start.line,endcol:start&&start.column,endpos:range?range[0]:moznode.start,raw:raw_token(moznode)})}function my_end_token(moznode){var loc=moznode.loc,end=loc&&loc.end;var range=moznode.range;return new AST_Token({file:loc&&loc.source,line:end&&end.line,col:end&&end.column,pos:range?range[1]:moznode.end,endline:end&&end.line,endcol:end&&end.column,endpos:range?range[1]:moznode.end,raw:raw_token(moznode)})}function map(moztype,mytype,propmap){var moz_to_me="function From_Moz_"+moztype+"(M){\n";moz_to_me+="return new U2."+mytype.name+"({\n"+"start: my_start_token(M),\n"+"end: my_end_token(M)";var me_to_moz="function To_Moz_"+moztype+"(M){\n";me_to_moz+="return {\n"+"type: "+JSON.stringify(moztype);if(propmap)propmap.split(/\s*,\s*/).forEach(function(prop){var m=/([a-z0-9$_]+)(=|@|>|%)([a-z0-9$_]+)/i.exec(prop);if(!m)throw new Error("Can't understand property map: "+prop);var moz=m[1],how=m[2],my=m[3];moz_to_me+=",\n"+my+": ";me_to_moz+=",\n"+moz+": ";switch(how){case"@":moz_to_me+="M."+moz+".map(from_moz)";me_to_moz+="M."+my+".map(to_moz)";break;case">":moz_to_me+="from_moz(M."+moz+")";me_to_moz+="to_moz(M."+my+")";break;case"=":moz_to_me+="M."+moz;me_to_moz+="M."+my;break;case"%":moz_to_me+="from_moz(M."+moz+").body";me_to_moz+="to_moz_block(M)";break;default:throw new Error("Can't understand operator in propmap: "+prop)}});moz_to_me+="\n})\n}";me_to_moz+="\n}\n}";moz_to_me=new Function("U2","my_start_token","my_end_token","from_moz","return("+moz_to_me+")")(exports,my_start_token,my_end_token,from_moz);me_to_moz=new Function("to_moz","to_moz_block","to_moz_scope","return("+me_to_moz+")")(to_moz,to_moz_block,to_moz_scope);MOZ_TO_ME[moztype]=moz_to_me;def_to_moz(mytype,me_to_moz)}var FROM_MOZ_STACK=null;function from_moz(node){FROM_MOZ_STACK.push(node);var ret=node!=null?MOZ_TO_ME[node.type](node):null;FROM_MOZ_STACK.pop();return ret}AST_Node.from_mozilla_ast=function(node){var save_stack=FROM_MOZ_STACK;FROM_MOZ_STACK=[];var ast=from_moz(node);FROM_MOZ_STACK=save_stack;ast.walk(new TreeWalker(function(node){if(node instanceof AST_LabelRef){for(var level=0,parent;parent=this.parent(level);level++){if(parent instanceof AST_Scope)break;if(parent instanceof AST_LabeledStatement&&parent.label.name==node.name){node.thedef=parent.label;break}}if(!node.thedef){var s=node.start;js_error("Undefined label "+node.name,s.file,s.line,s.col,s.pos)}}}));return ast};function set_moz_loc(mynode,moznode,myparent){var start=mynode.start;var end=mynode.end;if(start.pos!=null&&end.endpos!=null){moznode.range=[start.pos,end.endpos]}if(start.line){moznode.loc={start:{line:start.line,column:start.col},end:end.endline?{line:end.endline,column:end.endcol}:null};if(start.file){moznode.loc.source=start.file}}return moznode}function def_to_moz(mytype,handler){mytype.DEFMETHOD("to_mozilla_ast",function(){return set_moz_loc(this,handler(this))})}function to_moz(node){return node!=null?node.to_mozilla_ast():null}function to_moz_block(node){return{type:"BlockStatement",body:node.body.map(to_moz)}}function to_moz_scope(type,node){var body=node.body.map(to_moz);if(node.body[0]instanceof AST_SimpleStatement&&node.body[0].body instanceof AST_String){body.unshift(to_moz(new AST_EmptyStatement(node.body[0])))}return{type:type,body:body}}})();"use strict";function find_builtins(reserved){["null","true","false","Infinity","-Infinity","undefined"].forEach(add);[Array,Boolean,Date,Error,Function,Math,Number,Object,RegExp,String].forEach(function(ctor){Object.getOwnPropertyNames(ctor).map(add);if(ctor.prototype){Object.getOwnPropertyNames(ctor.prototype).map(add)}});function add(name){push_uniq(reserved,name)}}function reserve_quoted_keys(ast,reserved){ast.walk(new TreeWalker(function(node){if(node instanceof AST_ObjectKeyVal&&node.quote){add(node.key)}else if(node instanceof AST_Sub){addStrings(node.property,add)}}));function add(name){push_uniq(reserved,name)}}function addStrings(node,add){node.walk(new TreeWalker(function(node){if(node instanceof AST_Sequence){addStrings(node.tail_node(),add)}else if(node instanceof AST_String){add(node.value)}else if(node instanceof AST_Conditional){addStrings(node.consequent,add);addStrings(node.alternative,add)}return true}))}function mangle_properties(ast,options){options=defaults(options,{builtins:false,cache:null,debug:false,keep_quoted:false,only_cache:false,regex:null,reserved:null},true);var reserved=options.reserved;if(!Array.isArray(reserved))reserved=[];if(!options.builtins)find_builtins(reserved);var cname=-1;var cache;if(options.cache){cache=options.cache.props;cache.each(function(mangled_name){push_uniq(reserved,mangled_name)})}else{cache=new Dictionary}var regex=options.regex;var debug=options.debug!==false;var debug_suffix;if(debug)debug_suffix=options.debug===true?"":options.debug;var names_to_mangle=[];var unmangleable=[];ast.walk(new TreeWalker(function(node){if(node instanceof AST_ObjectKeyVal){add(node.key)}else if(node instanceof AST_ObjectProperty){add(node.key.name)}else if(node instanceof AST_Dot){add(node.property)}else if(node instanceof AST_Sub){addStrings(node.property,add)}else if(node instanceof AST_Call&&node.expression.print_to_string()=="Object.defineProperty"){addStrings(node.args[1],add)}}));return ast.transform(new TreeTransformer(function(node){if(node instanceof AST_ObjectKeyVal){node.key=mangle(node.key)}else if(node instanceof AST_ObjectProperty){node.key.name=mangle(node.key.name)}else if(node instanceof AST_Dot){node.property=mangle(node.property)}else if(!options.keep_quoted&&node instanceof AST_Sub){node.property=mangleStrings(node.property)}else if(node instanceof AST_Call&&node.expression.print_to_string()=="Object.defineProperty"){node.args[1]=mangleStrings(node.args[1])}}));function can_mangle(name){if(unmangleable.indexOf(name)>=0)return false;if(reserved.indexOf(name)>=0)return false;if(options.only_cache)return cache.has(name);if(/^-?[0-9]+(\.[0-9]+)?(e[+-][0-9]+)?$/.test(name))return false;return true}function should_mangle(name){if(regex&&!regex.test(name))return false;if(reserved.indexOf(name)>=0)return false;return cache.has(name)||names_to_mangle.indexOf(name)>=0}function add(name){if(can_mangle(name))push_uniq(names_to_mangle,name);if(!should_mangle(name))push_uniq(unmangleable,name)}function mangle(name){if(!should_mangle(name)){return name}var mangled=cache.get(name);if(!mangled){if(debug){var debug_mangled="_$"+name+"$"+debug_suffix+"_";if(can_mangle(debug_mangled))mangled=debug_mangled}if(!mangled)do{mangled=base54(++cname)}while(!can_mangle(mangled));cache.set(name,mangled)}return mangled}function mangleStrings(node){return node.transform(new TreeTransformer(function(node){if(node instanceof AST_Sequence){var last=node.expressions.length-1;node.expressions[last]=mangleStrings(node.expressions[last])}else if(node instanceof AST_String){node.value=mangle(node.value)}else if(node instanceof AST_Conditional){node.consequent=mangleStrings(node.consequent);node.alternative=mangleStrings(node.alternative)}return node}))}}"use strict";var to_ascii=typeof atob=="undefined"?function(b64){return new Buffer(b64,"base64").toString()}:atob;var to_base64=typeof btoa=="undefined"?function(str){return new Buffer(str).toString("base64")}:btoa;function read_source_map(name,code){var match=/\n\/\/# sourceMappingURL=data:application\/json(;.*?)?;base64,(.*)/.exec(code);if(!match){AST_Node.warn("inline source map not found: "+name);return null}return to_ascii(match[2])}function parse_source_map(content){try{return JSON.parse(content)}catch(ex){throw new Error("invalid input source map: "+content)}}function set_shorthand(name,options,keys){if(options[name]){keys.forEach(function(key){if(options[key]){if(typeof options[key]!="object")options[key]={};if(!(name in options[key]))options[key][name]=options[name]}})}}function init_cache(cache){if(!cache)return;if(!("props"in cache)){cache.props=new Dictionary}else if(!(cache.props instanceof Dictionary)){cache.props=Dictionary.fromObject(cache.props)}}function to_json(cache){return{props:cache.props.toObject()}}function minify(files,options){var warn_function=AST_Node.warn_function;try{options=defaults(options,{compress:{},enclose:false,ie8:false,keep_fnames:false,mangle:{},nameCache:null,output:{},parse:{},rename:undefined,sourceMap:false,timings:false,toplevel:false,warnings:false,wrap:false},true);var timings=options.timings&&{start:Date.now()};if(options.rename===undefined){options.rename=options.compress&&options.mangle}set_shorthand("ie8",options,["compress","mangle","output"]);set_shorthand("keep_fnames",options,["compress","mangle"]);set_shorthand("toplevel",options,["compress","mangle"]);set_shorthand("warnings",options,["compress"]);var quoted_props;if(options.mangle){options.mangle=defaults(options.mangle,{cache:options.nameCache&&(options.nameCache.vars||{}),eval:false,ie8:false,keep_fnames:false,properties:false,reserved:[],toplevel:false},true);if(options.mangle.properties){if(typeof options.mangle.properties!="object"){options.mangle.properties={}}if(options.mangle.properties.keep_quoted){quoted_props=options.mangle.properties.reserved;if(!Array.isArray(quoted_props))quoted_props=[];options.mangle.properties.reserved=quoted_props}if(options.nameCache&&!("cache"in options.mangle.properties)){options.mangle.properties.cache=options.nameCache.props||{}}}init_cache(options.mangle.cache);init_cache(options.mangle.properties.cache)}if(options.sourceMap){options.sourceMap=defaults(options.sourceMap,{content:null,filename:null,includeSources:false,root:null,url:null},true)}var warnings=[];if(options.warnings&&!AST_Node.warn_function){AST_Node.warn_function=function(warning){warnings.push(warning)}}if(timings)timings.parse=Date.now();var source_maps,toplevel;if(files instanceof AST_Toplevel){toplevel=files}else{if(typeof files=="string"){files=[files]}options.parse=options.parse||{};options.parse.toplevel=null;var source_map_content=options.sourceMap&&options.sourceMap.content;if(typeof source_map_content=="string"&&source_map_content!="inline"){source_map_content=parse_source_map(source_map_content)}source_maps=source_map_content&&Object.create(null);for(var name in files)if(HOP(files,name)){options.parse.filename=name;options.parse.toplevel=parse(files[name],options.parse);if(source_maps){if(source_map_content=="inline"){var inlined_content=read_source_map(name,files[name]);if(inlined_content){source_maps[name]=parse_source_map(inlined_content)}}else{source_maps[name]=source_map_content}}}toplevel=options.parse.toplevel}if(quoted_props){reserve_quoted_keys(toplevel,quoted_props)}if(options.wrap){toplevel=toplevel.wrap_commonjs(options.wrap)}if(options.enclose){toplevel=toplevel.wrap_enclose(options.enclose)}if(timings)timings.rename=Date.now();if(options.rename){toplevel.figure_out_scope(options.mangle);toplevel.expand_names(options.mangle)}if(timings)timings.compress=Date.now();if(options.compress)toplevel=new Compressor(options.compress).compress(toplevel);if(timings)timings.scope=Date.now();if(options.mangle)toplevel.figure_out_scope(options.mangle);if(timings)timings.mangle=Date.now();if(options.mangle){toplevel.compute_char_frequency(options.mangle);toplevel.mangle_names(options.mangle)}if(timings)timings.properties=Date.now();if(options.mangle&&options.mangle.properties){toplevel=mangle_properties(toplevel,options.mangle.properties)}if(timings)timings.output=Date.now();var result={};if(options.output.ast){result.ast=toplevel}if(!HOP(options.output,"code")||options.output.code){if(options.sourceMap){options.output.source_map=SourceMap({file:options.sourceMap.filename,orig:source_maps,root:options.sourceMap.root});if(options.sourceMap.includeSources){if(files instanceof AST_Toplevel){throw new Error("original source content unavailable")}else for(var name in files)if(HOP(files,name)){options.output.source_map.get().setSourceContent(name,files[name])}}else{options.output.source_map.get()._sourcesContents=null}}delete options.output.ast;delete options.output.code;var stream=OutputStream(options.output);toplevel.print(stream);result.code=stream.get();if(options.sourceMap){result.map=options.output.source_map.toString();if(options.sourceMap.url=="inline"){result.code+="\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,"+to_base64(result.map)}else if(options.sourceMap.url){result.code+="\n//# sourceMappingURL="+options.sourceMap.url}}}if(options.nameCache&&options.mangle){if(options.mangle.cache)options.nameCache.vars=to_json(options.mangle.cache);if(options.mangle.properties&&options.mangle.properties.cache){options.nameCache.props=to_json(options.mangle.properties.cache)}}if(timings){timings.end=Date.now();result.timings={parse:.001*(timings.rename-timings.parse),rename:.001*(timings.compress-timings.rename),compress:.001*(timings.scope-timings.compress),scope:.001*(timings.mangle-timings.scope),mangle:.001*(timings.properties-timings.mangle),properties:.001*(timings.output-timings.properties),output:.001*(timings.end-timings.output),total:.001*(timings.end-timings.start)}}if(warnings.length){result.warnings=warnings}return result}catch(ex){return{error:ex}}finally{AST_Node.warn_function=warn_function}}exports["Dictionary"]=Dictionary;exports["minify"]=minify;exports["parse"]=parse;exports["push_uniq"]=push_uniq;exports["TreeTransformer"]=TreeTransformer;exports["TreeWalker"]=TreeWalker})(typeof exports=="undefined"?exports={}:exports);
}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},["html-minifier"]);
