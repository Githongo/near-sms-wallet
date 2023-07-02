const { generateSeedPhrase } = require('near-seed-phrase');

export const createWallet = async()=>{
    try {
        // to create a seed phrase with its corresponding Keys
        const {seedPhrase, publicKey, secretKey} = generateSeedPhrase()

        console.log({
            seedPhrase,
            publicKey,
            secretKey
        })

        return {
            seedPhrase: seedPhrase,
            publicKey: publicKey,
            secretKey: secretKey
        }
    } catch (error) {
        return error
    }

}
