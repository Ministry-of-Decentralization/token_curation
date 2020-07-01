const getIntPairs = (ints) => {
  const pairs = []

  while (ints.length) {
    const pair = ints.splice(ints.length - 2)
    pairs.unshift(pair.length === 2 ? pair : [0,pair[0]])
  }

  return pairs
}

const getIntAsBytes = (int) => {
  const intPairs = getIntPairs(int.toString().split(""))

  const intBytes = new Array(32 - intPairs.length).fill("0x00")
    .concat(intPairs.map((pair) => "0x" + pair.join('')))
  return intBytes
}

const getIntAsByteString = (int) => {
  const intPairs = getIntPairs(int.toString().split(""))

  const intBytes = new Array(32 - intPairs.length).fill("00")
    .concat(intPairs.map((pair) => pair.join('')))
  return '0x' + intBytes.join('')
}

module.exports = {
  getIntAsBytes,
  getIntAsByteString
}