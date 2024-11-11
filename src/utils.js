const fs = require('fs')
const { PrismaClient } = require('@prisma/client')
const { faker } = require('@faker-js/faker');

const prisma = new PrismaClient()
// faker.setLocale('en_US');

let zips = [
  "43230",
  "63021",
  "01970",
  "07920",
  "14609",
  "08054",
  "01453",
  "01085",
  "46322",
  "18062",
]

function fakeUser() {
  let firstName = faker.person.firstName()
  let lastName = faker.person.lastName()
  return {
    fullname: firstName + ' ' + lastName,
    email: faker.internet.email({
      firstName,
      lastName,
    }).toLowerCase(),
    phone: faker.phone.number({ style: 'national' }),
    zip: zips[Math.floor(Math.random() * zips.length)],
  }
}

async function upsert(data){
  let record = await prisma.listings.findFirst({ where: {source: data.source, thirdPartyId: data.thirdPartyId} })
  if(record){
    delete data.id
    record = await prisma.listings.update({
      where: {
        id: record.id
      },
      data: { ...data, updatedAt: new Date() },
    })
  } else {
    record = await prisma.listings.create({
      data: { ...data, createdAt: new Date(), updatedAt: new Date() },
    })
  }
  return record
}

const _visited = new Set()
const visited = (str) => {
  if(_visited.has(str)) return true
  _visited.add(str)
  return false
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const download = async (url, filename) => {
  if(!fs.existsSync(filename)){
    let buffer = await fetch(url).then(r => r.arrayBuffer())
    fs.writeFileSync(filename, Buffer.from(buffer))
  }
}

async function fetchWithRetries(url, retries = 3) {
  if (retries < 0) throw new Error("No more retries")
  try {
    let r = await fetch(url)
    let status = r.status
    if (status === 200) {
      return r
    } else {
      throw new Error(`bad status ${status} for ${url}`)
    }
  } catch (e) {
    console.log(e.message)
    return await fetchWithRetries(url, retries - 1)
  }
}

// make strings into numbers mostly

const intFields = [
  "cashFlow",
  "revenue",
  "employees",
  "ffAndE",
  "netProfit",
  "realEstate",
  "totalDebt",
  "yearEstablished",
  "minimumInvestment",
  "netWorthRequired",
  "franchiseFee",
  "existingUnits",

]

function sanitize(data){
  let ret = {}
  for (let key of Object.keys(data)) {
    if (data[key] === "Not Disclosed") {
      ret[key] = null
    } else if (!intFields.includes(key)) {
      ret[key] = data[key]
    } else if (typeof data[key] === "string" && data[key].match(/^\$?\d[\d.,]*$/)) {
      ret[key] = Number(data[key].replace(/[^\d.]/g, ''))
    }
  }
  return ret
}

module.exports = { visited, delay, download, fetchWithRetries, upsert, fakeUser, sanitize }

// npm i -s csv-write-stream csvtojson