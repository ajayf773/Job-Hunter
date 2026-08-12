import { GoogleGenerativeAI } from '@google/generative-ai';

const key = 'AQ.Ab8RN6LU4iPSX6v21Zn1RiTTPlRVbQcr_BSwPa06Zz-671kP2A';
const genAI = new GoogleGenerativeAI(key);

async function testTokens(modelName, targetTokens) {
    console.log(`\n======================================`);
    console.log(`Testing ${modelName} with ~${targetTokens} tokens...`);
    
    const dummyText = 'apple '.repeat(targetTokens);
    
    try {
        const model = genAI.getGenerativeModel({ 
            model: modelName,
            systemInstruction: "You are a helpful assistant.",
            tools: [{ googleSearch: {} }],
        });
        const result = await model.generateContent(dummyText);
        
        console.log(`✅ SUCCESS! Tokens Used:`, result.response.usageMetadata.promptTokenCount);
        return true;
    } catch (err) {
        console.error(`❌ FAILED! Error: ${err.message}`);
        return false;
    }
}

async function runAll() {
    console.log("Running isolated tests directly to Google's API to bypass all project code...");
    // Test 10 tokens (Very small)
    await testTokens('gemini-3.5-flash-lite', 10);
    // Test 1000 tokens (Medium)
    await testTokens('gemini-3.5-flash-lite', 10);
}

runAll();
