module.exports = {
  // Bank card number or TD Canada Trust bank website username
  username: '123456',

  // Accounts that you want to download

  // id: To determine what your account ids are, you can manually
  // download your transaction history and look at the browser's
  // network traffic to extract the id.

  // name: defines the name that will be saved
  accounts: [
    { id: '123456', name: 'visa' },
    { id: '111111', name: 'chequeing' }
  ]
}
