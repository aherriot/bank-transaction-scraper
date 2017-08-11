var system = require('system')
var fs = require('fs')

var casper = require('casper')
var config = require('./config')

// Remember, PhantomJS is not the same as NodeJS
// and we don't have access to those APIs

system.stdout.writeLine('Initializing...')
casper = casper.create({
  verbose: false,
  logLevel: 'log'
})

// generate filename for the given account name
function generateName(name) {
  var date = new Date()
  var month = date.getMonth() + 1
  // left pad the month
  if (month < 10) {
    month = '0' + month
  }

  var year = date.getFullYear()

  return year + '-' + month + '-' + name + '.csv'
}

// Download the bank account transactions
function downloadAccountTransactions(account) {
  var fileName = generateName(account.name)
  system.stdout.writeLine('Downloading: "' + fileName + '"')

  var url =
    'https://easyweb.td.com/waw/ezw/servlet/' +
    'ca.tdbank.banking.servlet.DownloadAccountActivityServlet'

  var formData =
    'selaccounts=' +
    account.id +
    '&DateRange=L30&PFM=csv&xptype=PRXP&actiontaken=D' +
    '&referer=AA&commingfrom=AA ' +
    '&ExprtInfo=&filter=f1'

  casper.download(url, 'data/' + fileName, 'POST', formData)
}

// First prompt for password
system.stdout.writeLine('Enter TD Canada Trust password: ')
var password = system.stdin.readLine()

// Clear the terminal with lots of new lines
// Is this a secure way to get the password?
// Probably not, but given the limited API provided
// by CasperJS, I haven't found a better alternative:
// See https://github.com/casperjs/casperjs/issues/1250
// Remember, the PhantomJS environment does not include
// most of the NodeJS APIs, so there are many options
// that are not available to use.
system.stdout.writeLine(
  '\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n' +
    '\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n'
)

// Load the login page
casper.start('https://easyweb.td.com/waw/idp/login.htm', function() {
  system.stdout.writeLine('Waiting for login form...')
  this.waitForSelector('form#login')
})

// fill in the login form
casper.then(function() {
  this.fill(
    'form#login',
    {
      'login:AccessCard': config.username,
      'login:Webpassword': password
    },
    false
  )
})

// submit the login form
casper.then(function() {
  system.stdout.writeLine('Submitting login form...')
  this.click('input#login')
})

// wait for accounts page to load
casper.waitForSelector(
  'frame[name=tddetails]',
  function() {
    system.stdout.writeLine('Logged in')
  },
  function() {
    var url = casper.getCurrentUrl()
    if (url.indexOf('https://easyweb.td.com/waw/idp/login.htm') >= 0) {
      system.stdout.writeLine('Login failed. Please try again.')
    } else {
      system.stdout.writeLine(
        'timeout due to unknown error. See timeout.html' +
          ' and timeout.png for more details.'
      )
      fs.write('timeout.html', this.getHTML(), 'w')
      this.capture('timeout.png')
    }
  }
)

// For whatever reason, even though we are logged in,
// it gives me a 403 (Forbidden) if I don't first
// try to navigate to my credit card page before
// attempting to download files
casper.withFrame('tddetails', function() {
  system.stdout.writeLine('Waiting for data to load...')
  this.click('.td-target-creditcards tr:nth-child(4)  a')
})

// Actually download the transaction files
casper.then(function() {
  system.stdout.writeLine('Downloading transactions...')
  config.accounts.forEach(downloadAccountTransactions)
})

// kick off the whole script
casper.run()

// lines useful for debugging:
// fs.write('frame.html', this.getHTML(), 'w')
// this.capture('screen.png')
