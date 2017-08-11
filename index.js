var system = require('system')
var fs = require('fs')

var casper = require('casper')
var config = require('./config')

casper = casper.create({
  verbose: false,
  logLevel: 'log'
})

// Download the transactions and save as JSON
function downloadTransactions(account) {
  system.stdout.writeLine('Downloading: "' + account.outputFile + '"')
  var url =
    'https://easyweb.td.com/waw/api' +
    '/account/creditcard/transactions?accountKey=' +
    account.id +
    '&cycleId=1'
  this.download(url, 'data/' + account.outputFile)
}

// First prompt for password
system.stdout.writeLine('Enter TD password: ')
var password = system.stdin.readLine()

// Clear the terminal with lots of new lines
// Is this a secure way to get the password?
// Probably not, but given the limited API provided
// by CasperJS, I haven't found a better alternative:
// See https://github.com/casperjs/casperjs/issues/1250
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
    system.stdout.writeLine('logged in')
  },
  function() {
    system.stdout.writeLine('timeout :(')
    fs.write('timeout.html', this.getHTML(), 'w')
    this.capture('timeout.png')
  }
)

// For whatever reason, even though we are logged in,
// it gives me a 403 (Forbidden) if I don't first
// try to navigate to my credit card page before
// attempting to download files
casper.withFrame('tddetails', function() {
  this.click('div.td-target-creditcards tr:nth-child(4)  a')
})

// Actually download the transaction files
casper.then(function() {
  system.stdout.writeLine('Downloading transactions')
  config.accounts.forEach(downloadTransactions, this)
})

// kick off the whole script
casper.run()

// lines useful for debugging:
// fs.write('frame.html', this.getHTML(), 'w')
// this.capture('screen.png')
