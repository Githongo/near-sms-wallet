const { parseSeedPhrase } = require('near-seed-phrase');

/**
 * 
 * @param seedPhrase 
 * @returns {object}
 */ 
export const recoverKeys = async(seedPhrase:string)=>{
    try {
    // To recover keys from the seed phrase
    const { publicKey, secretKey } = parseSeedPhrase(seedPhrase);

        return {
            publicKey: publicKey,
            secretKey: secretKey
        }
    } catch (error) {
        return error
    }

}