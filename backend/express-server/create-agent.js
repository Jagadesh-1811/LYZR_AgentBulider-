const axios = require('axios');
require('dotenv').config({ path: '../../frontend/.env' });

async function createLyzrAgent() {
    const LYZR_API_KEY = process.env.LYZR_API_KEY;

    if (!LYZR_API_KEY || LYZR_API_KEY === 'your_lyzr_api_key_here') {
        console.error("Error: You must add your real LYZR_API_KEY to the .env file first!");
        return;
    }

    console.log("Creating your Lyzr Agent via the API...");

    try {
        const response = await axios.post('https://agent-prod.studio.lyzr.ai/v3/agents/', {
            name: "HiDevs Support Bot",
            description: "An AI agent for the HiDevs platform.",
            agent_role: "Customer Support Representative",
            agent_instructions: "You are a helpful and polite customer support assistant.",
            provider_id: "openai",
            model: "gpt-4o",
            temperature: 0.3,
            top_p: 1
        }, {
            headers: {
                'x-api-key': LYZR_API_KEY,
                'Content-Type': 'application/json'
            }
        });

        const agentId = response.data.agent_id || response.data.id;
        
        console.log(" Success! Your new Agent has been created.");
        console.log(`YOUR NEW AGENT ID IS: ${agentId}`);
        console.log("\nNext Steps:");
        console.log(`1. Open backend/express-server/server.js`);
        console.log(`2. Replace "YOUR_AGENT_ID" on line 105 with "${agentId}"`);
        console.log(`3. Restart your server!`);

    } catch (error) {
        if (error.response && error.response.data && error.response.data.detail) {
            console.error("❌ API Validation Error:");
            console.error(JSON.stringify(error.response.data.detail, null, 2));
        } else {
            console.error("❌ Failed to create agent:", error.response?.data || error.message);
        }
    }
}

createLyzrAgent();
