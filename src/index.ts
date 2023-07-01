import express from 'express';
import dotenv from 'dotenv';
import UssdMenu from 'ussd-menu-builder'
import mongoose from 'mongoose';
import { User } from './models/user';
import { encryptData, decryptData } from './services/encryption';

import { createWallet } from './services/createWallet';
import { sendToken } from './services/sendTokens';

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

const privKey = process.env.SENDER_PRIVATE_KEY2
menu.startState({
    run: async ()=>{
        //TODO logic to create account and verifying if account exists

        let phone = menu.args.phoneNumber;

        // TODO create wallet and save encrypted hashes of the keys  also verify if account exists

        const wallet:any = await createWallet();
        
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

        // TODO decrypt stored seedPhrase hash and store in a variable
        // TODO pass the seedPhrase hash to retrieve public key and secret key
        // TODO use this keys to send amount

        // send money here
        const receipt:any = sendToken(
            recipentName,
            'notmutebi.testnet',
            privKey!,
            recipientAmount,
            menu.args.phoneNumber,
        )
        
        menu.end('The transaction is being processed. A notification will be sent')
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
        // fetch balance using address 
        menu.end('Balance: 1000cUSD')
    }
})

menu.state('accountDetails', {
    run: ()=>{
        // fetch account details (resolve celo name)
        menu.end('Your account details will be sent to you')
    }
})


router.post("/", (req, res) => {
    let args ={
        sessionId: req.body.sessionId,
        serviceCode: req.body.serviceCode,
        phoneNumber: req.body.phoneNumber,
        text: req.body.text
    }

    // check if user exists in db first
    menu.run(args, (ussdResult: any) => {
        res.send(ussdResult);
    });


  });

  
module.exports = router;