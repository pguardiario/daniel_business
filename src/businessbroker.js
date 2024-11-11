const { upsert, delay, fakeUser } = require('./utils')
const cheerio = require('cheerio')
const puppeteer = require('puppeteer')

let keys = []

async function addDetails(record) {
  let html = await fetch(record.url, {
    "headers": {
      "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "accept-language": "en-PH,en-US;q=0.9,en;q=0.8,zh-CN;q=0.7,zh;q=0.6",
      "cache-control": "no-cache",
      "pragma": "no-cache",
      "priority": "u=0, i",
      "sec-ch-ua": "\"Chromium\";v=\"130\", \"Google Chrome\";v=\"130\", \"Not?A_Brand\";v=\"99\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"Windows\"",
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "same-origin",
      "sec-fetch-user": "?1",
      "upgrade-insecure-requests": "1"
    },
    "referrer": "https://www.businessbroker.net/listings/bfs_result.aspx?By=AdvancedSearch&r_id=33&ind_id=0&ask_price_l=&ask_price_h=&map_id=0&lcity=&keyword=&lst_no=&time=0&bprice=0&fresale=0&ownerfi=0&county_id=0&page=178",
    "referrerPolicy": "strict-origin-when-cross-origin",
    "body": null,
    "method": "GET",
    "mode": "cors",
    "credentials": "include"
  }).then(r => r.text())
  let $ = cheerio.load(html)

  // let category = $('#breadcrumbs li').get().map(x => $(x).text()).slice(1, -1).join(' > ')
  let industry = $('.industry a').text()
  // let str = $('.additionalDetails').text()
  // let isLeased = !!str.match('is Leased')
  // let isHomebased = !!str.match('is homebased')
  // let isFranchise = !!str.match('is a franchise')

  let props = $('.quickFacts td:nth-child(2)').get().reduce((acc, el) => {
    let key = $(el).text().trim().replace(':')
    let value = $(el).next().text().trim()
    acc[key] = value
    return acc
  }, {})


  for (let key of Object.keys(props)) {
    if (!keys.includes(key)) {
      console.log(`new key ${key}`)
      keys.push(key)
    }
  }

  let bbnNumber = props["BBN Listing #"]
  let brokerNumber = props["Broker Reference #"]
  let employees = props["Employees"]
  let ffAndE = props["FF&E"]
  let netProfit = props["Net Profit"]
  let realEstate = props["Real Estate"]
  let totalDebt = props["Total Debt"]
  let yearEstablished = props["Year Established"]

  let financingAssistance = props["Financing Assistance"]
  let minimumInvestment = props["Minimum Cash Required"]
  let totalInvestment = props["Total Investment"]
  let trainingAndSupport = props["Training & Support"]

  let netWorthRequired = props["Net Worth Required"]
  let franchiseFee = props["Franchise Fee"]
  let existingUnits = props["# of Existing Units"]

  let reasinForSelling = $('h3:contains(Reason for Selling)').get().pop()?.nextSibling.data.trim()
  let additionalDetails = $('.additionalDetails li').get().map(x => $(x).text()).join('|')

  if($('.item1.listing')[0]){
    debugger
  }

  let image = $('#profile_banner img').attr('data-src')

  let data = {
    image,
    industry,
    // isLeased,
    // isHomebased,
    // isFranchise,
    bbnNumber,
    brokerNumber,
    employees,
    ffAndE,
    netProfit,
    realEstate,
    totalDebt,
    yearEstablished,
    financingAssistance,
    minimumInvestment,
    totalInvestment,
    trainingAndSupport,
    netWorthRequired,
    franchiseFee,
    existingUnits,
    reasinForSelling,
    additionalDetails,
  }


  // sanitize these values
  for (let key of Object.keys(data)) {
    if (data[key] === "Not Disclosed") {
      data[key] = null
    } else if (typeof data[key] === "string" && data[key].match(/^\$?\d[\d.,]*$/)) {
      data[key] = Number(data[key].replace(/[^\d.]/g, ''))
    }
  }

  let x = await upsert({ ...record, ...data })
  // debugger
}

async function run() {
  for (let i = 1; i < 9999; i++) {
    let html = await fetch(`https://www.businessbroker.net/listings/bfs_result.aspx?By=AdvancedSearch&r_id=33&ind_id=0&ask_price_l=&ask_price_h=&map_id=0&lcity=&keyword=&lst_no=&time=0&bprice=0&fresale=0&ownerfi=0&county_id=0&page=${i}`, {
      "headers": {
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "accept-language": "en-PH,en-US;q=0.9,en;q=0.8,zh-CN;q=0.7,zh;q=0.6",
        "cache-control": "no-cache",
        "pragma": "no-cache",
        "priority": "u=0, i",
        "sec-ch-ua": "\"Chromium\";v=\"130\", \"Google Chrome\";v=\"130\", \"Not?A_Brand\";v=\"99\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "same-origin",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1"
      },
      "referrer": "https://www.businessbroker.net/listings/bfs_result.aspx?By=AdvancedSearch&r_id=33&ind_id=0&ask_price_l=&ask_price_h=&map_id=0&lcity=&keyword=&lst_no=&time=0&bprice=0&fresale=0&ownerfi=0&county_id=0&page=178",
      "referrerPolicy": "strict-origin-when-cross-origin",
      "body": null,
      "method": "GET",
      "mode": "cors",
      "credentials": "include"
    }).then(r => r.text())
    let $ = cheerio.load(html)

    for (let div of $('.listing').get()) {

      let thirdPartyId = $(div).attr('id').replace('listing_', '')
      let price = Number($(div).attr('data-invest'))
      let name = $(div).attr('data-name').trim().replace(/\s+/g, ' ')
      let [city_state, county] = $(div).find('.location').get().map(x => $(x).text())
      let [city, state] = city_state?.split(', ') || []
      let description = $(div).find('.summary').text()
      let cashFlow = $(div).find('.financials span:contains("Cash Flow")').get().pop()?.nextSibling?.data.trim()
      let revenue = $(div).find('.financials span:contains("Revenue")').get().pop()?.nextSibling?.data.trim()
      let url = new URL($(div).find('.read a').attr('href'), "https://www.businessbroker.net").href

      revenue = revenue?.match(/^\$\d[\d,]+$/) ? Number(revenue.replace(/[^\d]/g, '')) : null
      cashFlow = cashFlow?.match(/^\$\d[\d,]+$/) ? Number(cashFlow.replace(/[^\d]/g, '')) : null

      let item = {
        name,
        description,
        price,
        thirdPartyId,
        county,
        city,
        state,
        cashFlow,
        revenue,
        url,
        source: 'businessbroker.net'
      }

      // sanitize these values
      for (let key of Object.keys(item)) {
        if (item[key] === "Not Disclosed") {
          item[key] = null
        }
      }

      let record = await upsert(item)
      if (record.createdAt.toISOString() === record.updatedAt.toISOString()) {
        // this is a new record
        await addDetails(record)
      }
      console.log(record)
    }

    if ($('.listing').length < 30) break

  }

}

// function to get info sent to an email
// todo: write express app to do this
async function getDetails(row, user) {
  let browser = await puppeteer.launch({
    // headless: false
  })

  let success = false
  let error = false

  try {
    let page = await browser.newPage()
    await page.goto(row.url)
    let button = await page.waitForSelector('.basket')
    await button.click()
    await delay(1000)
    button = await page.waitForSelector('button#cart')
    await button.click()
    await delay(1000)
    await page.waitForSelector('[id="pre_email"]')
    await page.type('[id="pre_email"]', user.email)
    await delay(1000)
    button = await page.waitForSelector('button::-p-text(Proceed To Step 2)')

    // flaky button
    for (let i = 0; i < 3; i++) {
      await button.evaluate(b => b.click()).catch(e => { })
      await delay(1000)
    }

    await page.waitForSelector('[data-step="2"].lf-good')

    let input = await page.waitForSelector('[name="fullname"]')
    await input.focus()
    await delay(1000)

    await page.evaluate(user => {
      console.log({ user })
      document.querySelector('[name="fullname"]').value = user.fullname
      document.querySelector('[name="phone"]').value = user.phone
      document.querySelector('[name="zipcode"]').value = user.zip
    }, user).catch(e => {
      debugger
    })

    await delay(1000)
    button = await page.waitForSelector('[onclick="sendRequest(); return false;"]')
    await button.click()
    await delay(1000)


    // let validatorResponse = await page.waitForResponse(r => r.url().includes('validator.json'), {timeout: 10000}).catch(e => {

    // })
    // if(validatorResponse){
    //   let validation = await validatorResponse.json()
    //   debugger
    // }

    let thankYou = await page.waitForSelector('h3::-p-text(Thank You)').catch(e => { })
    success = !!thankYou

  } catch (e) {
    error = e.message
  } finally {
    browser.close()
  }

  return { success, error }

}

module.exports = { run, getDetails }

if (process.argv[1].includes('businessbroker.js')) {
  run()
}

// let row = {
//   name: "Specialty Landscaping Business In Coastal Bend TX",
//   description: "Fast Growing Business.South Texas Coastal Bend Location.Owner operated.Asking price includes Business & Equipment.Inventory is to be compensated separately at cost.",
//   price: 595000,
//   thirdPartyId: "948402",
//   county: "Not disclosed",
//   city: null,
//   state: "TX",
//   cashFlow: 250000,
//   revenue: 935000,
//   url: "https://www.businessbroker.net/business-for-sale/specialty-landscaping-business-in-coastal-bend-texas/948402.aspx",
//   source: "businessbroker.net",
// }
// let user = fakeUser()
// getDetails(row, user)
