import { GoogleGenerativeAI } from '@google/generative-ai';

const key = 'AQ.Ab8RN6LU4iPSX6v21Zn1RiTTPlRVbQcr_BSwPa06Zz-671kP2A';
const genAI = new GoogleGenerativeAI(key);

async function testTokens(modelName, targetTokens) {
    console.log(`\n======================================`);
    console.log(`Testing ${modelName} with ~${targetTokens} tokens...`);
    
    // 'apple ' is typically 1 token.
    const dummyText = 'apple '.repeat(targetTokens);
    
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        
        console.log(`Sending request... (payload size: ${Math.round(dummyText.length / 1024)} KB)`);
        const result = await model.generateContent(`Count the number of times the word apple appears in the following text, and nothing else: ${dummyText}`);
        
        console.log(`✅ SUCCESS!`);
        console.log(`Response: ${result.response.text()}`);
        if (result.response.usageMetadata) {
            console.log(`Tokens Used:`, result.response.usageMetadata);
        }
    } catch (err) {
        console.error(`❌ FAILED!`);
        console.error(`Error: ${err.message}`);
    }
}

async function runAll() {
    await testTokens('gemini-3.5-flash-lite', 50000);
    await testTokens('gemini-3.5-flash', 100000);
    await testTokens('gemini-2.0-flash', 150000);
}

runAll();
