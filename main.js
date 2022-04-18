const fs = require('fs');
const pdf = require('html-pdf');
const path = require('path');
const katex = require('katex')
const katexStyle = require("./style/katex-css")

function renderKatex (match) {
  let finalMatch
  if (match.includes('$$')) {
    finalMatch = match.slice(2, -2)
  } else if (match.includes('$')) {
    finalMatch = match.slice(1, -1)
  } else {
    finalMatch = match.slice(2, -2)
  }
  finalMatch = finalMatch.replaceAll(/&lt;/g, '<').replaceAll(/&gt;/g, '>').replaceAll('&amp;', '&').replaceAll('&nbsp;', ' ')
  return katex.renderToString(finalMatch, {
    throwOnError: false,
    safe: true,
    trust: true
  })
}

function resizeImage (str) {
  const re = /<img[^>]*>/gm;
  str = str.replace(re, match => {
    const queryIndex = match.indexOf('?')
    const endQueryIndex = match.slice(queryIndex).indexOf('"')
    match = match.slice(0, queryIndex) + match.slice(queryIndex + endQueryIndex)
    const wIndex = match.indexOf('width="')
    const endWIndex = match.slice(wIndex + 8).indexOf('"')
    match = match.slice(0, wIndex) + match.slice(wIndex + endWIndex + 10)
    const hIndex = match.indexOf('height="')
    const endHIndex = match.slice(hIndex + 8).indexOf('"')
    match = match.slice(0, hIndex) + match.slice(hIndex + endHIndex + 10)
    return match
  })
  return str

}

function addFonts () {
  fontPath = fs.readFileSync(path.resolve(__dirname, './style/fonts/IRANSans/fonts/ttf/IRANSansWeb.ttf'));
  const iranSans = fontPath.toString('base64');
  
  const style = `@font-face {
    font-family: 'IRANSans';
    src: url('data:font/truetype;charset=utf-8;base64,${iranSans}');
    font-weight: normal;
    font-style: normal;
  }`
  
  fontPath = fs.readFileSync(path.resolve(__dirname, './style/fonts/IRANSans/farsi_numeral/ttf/IRANSansWeb(FaNum).ttf'));
  const iranSansNumeral = fontPath.toString('base64');
  
  const styleNumeral = `@font-face {
    font-family: 'IRANSans';
    src: url('data:font/truetype;charset=utf-8;base64,${iranSansNumeral}');
    font-weight: normal;
    font-style: normal;
  }`

  return `<style>${style}</style>` + `<style>${styleNumeral}</style>`
}

const regex = /(\${1}((?!\$).)+?\${1})|(\${2}((?!\$).)+?\${2})|(\\\[((?! ).){1}((?!\$).)*?((?! ).){1}\\\])/gms
const regexP = /<p[^>]*>/
const map = {
  1: 'الف',
  2: 'ب',
  3: 'ج',
  4: 'د'
}

// const json = JSON.parse(process.argv[2])
const json = require(process.argv[2])
const output_file = process.argv[3]

var html = `<style>${katexStyle}</style>`
  + addFonts()
  + '<div id="pageHeader"><img src="http://neo-server.ir/d/header.jpg"></div>'
  + '<div id="pageFooter" style="margin-top: -8px !important;"><img src="http://neo-server.ir/d/footer.jpg"></div>'
  + `<div
      style="font-family: IRANSans; font-size: 40px; display: -webkit-box;
      display: -ms-flexbox;
      display: flex;
      -webkit-box-orient: horizontal;
      -webkit-box-direction: normal;
          -ms-flex-direction: row;
              flex-direction: row;"
    >`

html += '<div style="background: #f9c657; width: 70px;"></div>'

html += '<div class="question" style="width: calc(100% - 140px);">'

json.forEach((quest, index) => {
  html += '<div style="display: inline-block; margin-top: 50px; width: 96%; padding: 0 2%;">'
  quest.statement = quest.statement.replace(regex, renderKatex)
  quest.statement = quest.statement.replaceAll('class="katex"', 'class="katex" dir="ltr" style=" font-family: IRANSans;"')
  quest.statement = quest.statement.replaceAll('[object Object]', 'auto')
  quest.statement = quest.statement.replace(regexP, match => match + (index + 1) + ') ')
  quest.statement = resizeImage(quest.statement)
  html += quest.statement
  quest.choices.forEach((choice, cIndex) => {
    choice.title = choice.title.replace(regex, renderKatex)
    choice.title = choice.title.replaceAll('class="katex"', 'class="katex" dir="ltr" style=" font-family: IRANSans;"')
    choice.title = choice.title.replaceAll('[object Object]', 'auto')
    choice.title = resizeImage(choice.title)
    html += '<span dir="rtl" style="direction: rtl; float: right; margin-left: 10px;">' + (map[cIndex + 1]) + ') </span>' + choice.title
  })
  html += '</div>'
})

html += `</div>`


html += '<div style="background: #f9c657; width: 70px;"></div>'

html += `</div>`

const options = { 
    width: "3855px",
    height: "2169px",
    "border": {
      "top": "0",
      "right": "0",
      "bottom": "0",
      "left": "0"
    },
    quality: "250",
    phantomArgs: ['--ignore-ssl-errors=yes'],
    orientation: "landscape",
    header: {
      height: "115mm",

    },
    footer: {
      height: "75mm",
    },
}

pdf.create(html, options).toFile(output_file, function(err, res) {
  if (err) {
    console.log(JSON.stringify({ status: 500, error: err }))
  } else {
    console.log(JSON.stringify({ status: 200, file: output_file }));
  }
})