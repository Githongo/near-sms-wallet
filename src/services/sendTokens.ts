import { sendSms } from "./sendSms";
const nearAPI  = require('near-api-js');
const { connect, KeyPair, keyStores, utils } = nearAPI;
require("dotenv").config();


/**
 * @param receiverAccountId
 * @param senderAccountId
 * @param privateKey
 * @param amount
 * @param	phoneNumber
 * */ 
export const sendToken = async(
  receiverAccountId:string,
  senderAccountId:string,
  privateKey:string,
  amount:number,
  phoneNumber:string 
  )=>{
    const networkId = process.env.NETWORK
    const keyStore = new keyStores.InMemoryKeyStore();
    const keyPair = KeyPair.fromString(privateKey);
    await keyStore.setKey(networkId, senderAccountId, keyPair);

    const config = {
      networkId,
      keyStore,
      nodeUrl: `https://rpc.${networkId}.near.org`,
      walletUrl: `https://wallet.${networkId}.near.org`,
      helperUrl: `https://helper.${networkId}.near.org`,
      explorerUrl: `https://explorer.${networkId}.near.org`
    };

  const near = await connect(config);
  const senderAccount = await near.account(senderAccountId);

    try {
      // here we are using near-api-js utils to convert yoctoNEAR back into a floating point
      console.log(`Sending ${utils.format.formatNearAmount(amount)}Ⓝ from ${senderAccountId} to ${receiverAccountId}...`);
      // send those tokens! :)
      const result = await senderAccount.sendMoney(receiverAccountId, amount);
      // console results
      console.log('Transaction Results: ', result.transaction);
      console.log('--------------------------------------------------------------------------------------------');
      console.log('OPEN LINK BELOW to see transaction in NEAR Explorer!');
      console.log(`${config.explorerUrl}/transactions/${result.transaction.hash}`);
      console.log('--------------------------------------------------------------------------------------------');

      const smsData = {
        to: phoneNumber,
        message: `Confirmed  ${amount} Ⓝ has been sent to ${receiverAccountId}
        \n Transaction Hash: ${result?.transaction?.hash}`
      }

    sendSms(smsData)
    } catch(error) {
      // return an error if unsuccessful
      console.log(error);
      return error
    }
}