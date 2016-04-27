const parseString = require('./parseString.js')
const {mergeAttributes, normalizeAttributes} = require('./helpers.js')

// Counts how many of each rune we have while parsing items
let runeCount

function parseItems (items) {
  let attributes = {}
  runeCount = {}
  items = [].concat(items)

  items.map(item => {
    attributes = mergeAttributes(attributes, parseItem(item))
  })

  return normalizeAttributes(attributes)
}

function parseItem (item) {
  let attributes = {}
  let details = item.details

  if (!details) {
    return attributes
  }

  // Armor rating -> integer
  if (details.defense) {
    attributes.Armor = (attributes.Armor || 0) + details.defense
  }

  // Official attributes -> array of {attribute: 'type', modifier: value}
  if (details.infix_upgrade && details.infix_upgrade.attributes) {
    attributes = mergeAttributes(attributes, convertOfficial(details.infix_upgrade.attributes))
  }

  // Buff description (condition duration, ascended items, infusions) -> string
  if (details.infix_upgrade && details.infix_upgrade.buff) {
    attributes = mergeAttributes(attributes, parseString(details.infix_upgrade.buff.description))
  }

  // Rune buffs -> array of 6 strings, 1 per equipped rune count
  if (details.bonuses) {
    runeCount[item.id] = runeCount[item.id] !== undefined ? runeCount[item.id] + 1 : 0
    if (runeCount[item.id] <= 5) {
      attributes = mergeAttributes(attributes, parseString(details.bonuses[runeCount[item.id]]))
    }
  }

  // Remove the resistance that some legacy items still have hardcoded in them.
  // They also have the agony infusions giving the actual resistance
  if (item.rarity === 'Ascended' && details.type !== 'Default') {
    delete attributes.AgonyResistance
  }

  return attributes
}

// Map the official attribute keys to our representation that
// makes it clearer which attribute is which
const officialAttributeMap = {
  BoonDuration: 'Concentration',
  ConditionDamage: 'ConditionDamage',
  ConditionDuration: 'Expertise',
  CritDamage: 'Ferocity',
  Healing: 'HealingPower',
  Power: 'Power',
  Precision: 'Precision',
  Toughness: 'Toughness',
  Vitality: 'Vitality'
}

function convertOfficial (attributes) {
  let map = {}
  attributes.map(attribute => {
    let key = officialAttributeMap[attribute.attribute]
    map[key] = attribute.modifier
  })
  return map
}

module.exports = parseItems
