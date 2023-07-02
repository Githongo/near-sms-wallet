import express from 'express';
import dotenv from 'dotenv';
import UssdMenu from 'ussd-menu-builder'
import mongoose from 'mongoose';
import { User } from './models/user';
import { encryptData, decryptData } from './services/encryption';

import { createWallet } from './services/createWallet';
import { sendToken } from './services/sendTokens';
import { sendSms } from './services/sendSms';

dotenv.config();

const dbString:any=process.env.DATABASE_URL;

mongoose.connect(dbString)
const database=mongoose.connection

database.on('error', (error)=>{
    console.error(error)
})

database.once('connected', ()=>{
    console.log('Database connected...')
})

let menu = new UssdMenu();

const router = express.Router();
let recipentName:string=''
let recipientAmount:number;
let user:any = null;
let addressId: string;
let pin:number;

menu.startState({
  run: () => {},
  next: {
    '': async () => {
        //TODO: Create and store session
        let phone = menu.args.phoneNumber;
        const query = await User.findOne({ 'phone': phone }).exec();
        console.log('retreived user'+query)
        user = query;
        if(user){
            return 'userMenu';
        }
        else {
            return 'registerMenu';
        }
    }
}
})

menu.state('registerMenu', {
  run: async() => {

    menu.con('Welcome to Dhamana Wallet. To access services, we need you to opt in for services'+
            '\n1. Opt in' +
            '\n2. No thanks');
  },
  next: {
    '1': 'newUser',
    '2': 'optedOut'
  }

})

menu.state('newUser', {
  run: ()=>{
      //TODO: Check that addressId isn't taken
      menu.con("Please enter your preferred name (accountId) e.g. john.testnet")
  },
  next: {
      '*[.\w]+':'newUser.pin'
  }
})

menu.state('newUser.pin', {
  run: () => {
      menu.con('Enter a 4 digit PIN you will be using for verification')
      let addressName=menu.val
      console.log('addressId: ',addressName)
      addressId = addressName;
  },
  next:{
    '*^[0-9]*$':'createUser'
  }
})

menu.state('createUser', {
  run: async () => {
      let userPin=parseInt(menu.val);
      console.log('pin: ',userPin);
      pin = userPin;

      const wallet:any = await createWallet();

      let userDetails = {
        phone: menu.args.phoneNumber,
        address: addressId,
        publicKey: wallet.publicKey,
        privateKey: encryptData(pin.toString(), wallet.secretKey),
        seedPhrase: encryptData(pin.toString(), wallet.seedPhrase),
        createdAt: Date.now()
      };

      let user = new User(userDetails);
      await user.save();
      // sendSms(`Hi there. Your Dhamana Wallet has been set up. It is active and linked to your number ending with XXXXXX${user.phone.slice(-3)}. \n ~Dhamana Team.`)
      menu.end("Thank you. Your request is being processed. \n A notification will be sent once registration is complete.");
  }
})

menu.state('userMenu', {
  run: async ()=>{

      let phone = menu.args.phoneNumber
      
      console.log('current user phone: ', phone)
      menu.con('Welcome to the Dhamana Menu' + 
      '\n1. Send Money' +
      '\n2. My Account' +
      '\n3. Withdraw to Mobile Money'
      );
  },
  next: {
      '1': 'sendMoney',
      '2': 'myAccount',
      '3': 'WithdrawToMobileMoney'
  }
})

menu.state('WithdrawToMobileMoney', {
    run: ()=>{
        // fetch account details (resolve celo name)
        menu.end('Coming Soon')
    }
})

// Send Money flow
menu.state('sendMoney', {
    run: ()=>{
        menu.con('Enter near account Id of the recipent')
    },
    next: {
        '*[.\w]+':'sendMoney.name'
    }
})

menu.state('sendMoney.name', {
    run: () => {
        menu.con('Enter amount')

        recipentName = menu.val
        console.log('recipent name is: ',recipentName)
    },
    next:{
        '*^[0-9]*$': 'amount',
    }
})

menu.state('amount', {
    run: () => {
        menu.con('Enter Pin')
        recipientAmount=parseInt(menu.val)
        console.log('amount: ',recipientAmount)
    },
    next:{
        '*^[0-9]*$':'pin'
    }
})

menu.state('pin', {
    run: async () => {
        console.log('pin: ', menu.val)
        let pin = menu.val;
        const query = await User.findOne({ 'phone': menu.args.phoneNumber }).exec();
        console.log('Sending user: '+query)
        user = query;
        let key = decryptData(pin, user.privateKey)
        //TODO: Check if recipient's address exists
        if(typeof(key) == 'string'){
            const receipt:any = sendToken(
              recipentName,
              user.address,
              key,
              recipientAmount,
              menu.args.phoneNumber,
          )
            menu.end('The transaction is being processed. A notification will be sent')
        }else{
          menu.end('Error verifying your request.')
        }
        
    }
})

menu.state('myAccount', {
    run: ()=>{
        menu.con('Account' + 
        '\n1. Check Balance'+
        '\n2. Account Details')
    },
    next: {
        '1':'checkBalance',
        '2':'accountDetails'
    }
})

menu.state('checkBalance', {
    run: ()=>{
        //TODO: fetch balance using address 
        menu.end('Your account balance will be sent to you')
    }
})

menu.state('accountDetails', {
    run: ()=>{
        //TODO: fetch account details
        menu.end('Your account details will be sent to you')
    }
})

menu.state('optedOut', {
  run: ()=>{
      menu.end('If you change your mind, dial the shortcode again')
  }
})



router.post("/", (req, res) => {
    let args ={
        sessionId: req.body.sessionId,
        serviceCode: req.body.serviceCode,
        phoneNumber: req.body.phoneNumber,
        text: req.body.text
    }
    menu.run(args, (ussdResult: any) => {
        res.send(ussdResult);
    });

  });
  
module.exports = router;