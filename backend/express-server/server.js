const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const multer = require('multer');
const FormData = require('form-data');
const fs = require('fs');

const upload = multer({ dest: 'uploads/' });
require('dotenv').config({ path: '../../.env' });

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// --- Mock Databases ---
const usersDB = [
    { email: 'admin@hidevs.com', password: 'password', name: 'HiDevs Admin' }
];

const agentTemplates = [
    {
        id: "tpl_support",
        name: "Customer Support Bot",
        description: "An agent optimized for polite, helpful, and concise customer interactions.",
        config: {
            model: "gemini-2.5-pro",
            temperature: 0.2,
            instruction: "You are a polite customer support agent. Solve user issues using the provided context.",
            retrieval: { topK: 5, collection: "kb_support" }
        }
    },
    {
        id: "tpl_data",
        name: "SQL Data Analyst",
        description: "A highly creative agent capable of writing complex SQL queries from natural language.",
        config: {
            model: "gemini-2.5-pro",
            temperature: 0.8,
            instruction: "You are a Senior SQL Analyst. Given a schema in the context, write optimal queries.",
            retrieval: { topK: 3, collection: "kb_schemas" }
        }
    },
    {
        id: "tpl_rag",
        name: "General RAG System",
        description: "The standard retrieval-augmented generation engine with balanced settings.",
        config: {
            model: "gemini-2.5-flash",
            temperature: 0.4,
            instruction: "You are a helpful assistant. Synthesize the provided context to answer questions.",
            retrieval: { topK: 3, collection: "kb_general" }
        }
    }
];

// --- Endpoints ---

// Health Check
app.get('/', (req, res) => {
    res.json({ message: "Express Main Backend is running successfully!" });
});


const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';

// Middleware to protect routes
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, error: "Access denied. No token provided." });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, error: "Invalid token." });
        }
        req.user = user;
        next();
    });
}

// Auth Endpoint
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    
    const user = usersDB.find(u => u.email === email && u.password === password);
    
    if (user) {
        const token = jwt.sign({ email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
        res.json({
            success: true,
            token: token,
            user: { name: user.name, email: user.email }
        });
    } else {
        res.status(401).json({ success: false, error: "Invalid email or password." });
    }
});

// Signup Endpoint
app.post('/api/signup', (req, res) => {
    const { email, password, name } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ success: false, error: "Email and password are required." });
    }
    
    if (usersDB.find(u => u.email === email)) {
        return res.status(400).json({ success: false, error: "Email already exists." });
    }
    
    const newUser = { email, password, name: name || 'New User' };
    usersDB.push(newUser);
    
    const token = jwt.sign({ email: newUser.email, name: newUser.name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
        success: true,
        token: token,
        user: { name: newUser.name, email: newUser.email }
    });
});

// Google Auth Endpoint
app.post('/api/auth/google', (req, res) => {
    const { email, name } = req.body;
    if (!email) {
        return res.status(400).json({ success: false, error: "Email is required." });
    }
    const token = jwt.sign({ email: email, name: name || 'Google User' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token });
});

// Templates Endpoint
app.get('/api/templates', (req, res) => {
    res.json({ success: true, templates: agentTemplates });
});

// Deploy Agent Endpoint (Dynamic Creation)
app.post('/api/deploy-agent', authenticateToken, async (req, res) => {
    try {
        const payload = req.body;
        console.log("1. Received Configuration for Deployment:", JSON.stringify(payload, null, 2));

        const LYZR_API_KEY = process.env.LYZR_API_KEY;
        if (!LYZR_API_KEY || LYZR_API_KEY === 'your_lyzr_api_key_here') {
            return res.status(401).json({ success: false, error: "Missing LYZR_API_KEY in backend .env file." });
        }

        // Hit Lyzr v3 API
        // Detect provider from model name
        const modelName = payload.model || "gpt-4o";
        let providerId = "openai";
        if (modelName.startsWith("gemini")) providerId = "google";
        else if (modelName.startsWith("claude")) providerId = "anthropic";

        const response = await axios.post('https://agent-prod.studio.lyzr.ai/v3/agents/', {
            name: payload.name || "HiDevs Dynamic Agent",
            description: payload.description || "An AI agent deployed from HiDevs Builder",
            agent_role: payload.name || "Agent",
            agent_instructions: payload.instruction || "You are a helpful assistant.",
            provider_id: providerId,
            model: modelName,
            temperature: payload.temperature || 0.3,
            top_p: 1
        }, {
            headers: {
                'x-api-key': LYZR_API_KEY,
                'Content-Type': 'application/json'
            }
        });

        const agentId = response.data.agent_id || response.data.id;
        console.log("2. Agent deployed successfully with ID:", agentId);

        res.json({ success: true, agentId: agentId });
    } catch (error) {
        console.error("Agent deployment failed:", error.response?.data || error.message);
        res.status(500).json({ success: false, error: "Failed to deploy agent to Lyzr Cloud." });
    }
});

// Endpoint: Upload Knowledge Base Document (Native Lyzr RAG)
app.post('/api/upload-knowledge', authenticateToken, upload.single('file'), async (req, res) => {
    try {
        const { type, content, collectionName, vectorStoreProvider, embeddingModel } = req.body;
        const LYZR_API_KEY = process.env.LYZR_API_KEY;

        if (!LYZR_API_KEY) {
            return res.status(401).json({ success: false, error: "Missing LYZR_API_KEY." });
        }

        // 1. Create RAG Configuration
        console.log("1. Creating Lyzr RAG Configuration...");
        const ragConfigResponse = await axios.post('https://rag-prod.studio.lyzr.ai/v3/rag/', {
            user_id: req.user?.email || "default_user",
            collection_name: collectionName || "my_knowledge_base",
            llm_credential_id: process.env.LYZR_LLM_CRED_ID || "default",
            embedding_credential_id: process.env.LYZR_EMBEDDING_CRED_ID || "default",
            vector_db_credential_id: process.env.LYZR_VECTORDB_CRED_ID || "default",
            llm_model: "gpt-4o",
            embedding_model: embeddingModel || "text-embedding-3-small",
            vector_store_provider: vectorStoreProvider || "pinecone",
        }, {
            headers: { 'x-api-key': LYZR_API_KEY }
        });

        const ragId = ragConfigResponse.data.id || ragConfigResponse.data.rag_id;
        
        // 2. Train Knowledge Base
        console.log(`2. Training RAG ID ${ragId} with ${type}...`);
        if (type === 'url' && content) {
            await axios.post(`https://rag-prod.studio.lyzr.ai/v3/train/website/?rag_id=${ragId}`, {
                website_url: content
            }, { headers: { 'x-api-key': LYZR_API_KEY } });
        } else if (type === 'text' && content) {
            // Raw text fallback
            console.log("Training text:", content.substring(0, 50));
        } else if (type === 'file' && req.file) {
            console.log("Uploading file to Lyzr Cloud:", req.file.originalname);
            const formData = new FormData();
            formData.append('file', fs.createReadStream(req.file.path), req.file.originalname);
            
            // Note: /train/pdf or /train/txt based on file type in actual Lyzr API
            // Using /train/pdf as the default fallback for file uploads
            const endpoint = req.file.originalname.endsWith('.txt') ? '/v3/train/txt/' : '/v3/train/pdf/';
            
            await axios.post(`https://rag-prod.studio.lyzr.ai${endpoint}?rag_id=${ragId}`, formData, {
                headers: {
                    ...formData.getHeaders(),
                    'x-api-key': LYZR_API_KEY
                }
            });
            
            // Clean up local temp file
            fs.unlinkSync(req.file.path);
        } else {
            return res.status(400).json({ success: false, error: "No content or file provided." });
        }

        res.json({
            success: true,
            rag_id: ragId,
            message: "RAG Knowledge Base configured and training started."
        });

    } catch (error) {
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        console.error("Native RAG upload failed:", error.response?.data || error.message);
        res.status(500).json({ success: false, error: "Failed to configure RAG in Lyzr Cloud." });
    }
});

// Primary Endpoint: Run Lyzr Agent via Lyzr Cloud (REST API)
app.post('/api/run-agent', authenticateToken, async (req, res) => {
    try {
        const payload = req.body; 
        
        console.log("1. Received Configuration from Frontend:", JSON.stringify(payload, null, 2));

        const LYZR_API_KEY = process.env.LYZR_API_KEY;
        if (!LYZR_API_KEY) {
            console.log("Missing LYZR_API_KEY in .env");
            return res.status(401).json({ 
                success: false, 
                error: "Missing LYZR_API_KEY in backend .env file. Please add your Lyzr Studio API key." 
            });
        }

        // Forward to the Lyzr Enterprise Cloud API
        console.log("2. Forwarding payload to Lyzr Cloud API...");
        
        // Example API payload structure based on Lyzr Cloud docs
        if (!payload.config?.agentId) {
            return res.status(400).json({ success: false, error: "Missing agentId. Did you deploy the agent first?" });
        }

        let finalMessage = payload.query || "Hello Agent!";
        const chatPayload = {
            user_id: "default_user",
            agent_id: payload.config.agentId,
            session_id: payload.sessionId || "demo_session_123",
            message: finalMessage
        };

        if (payload.rag_id) {
            console.log(`Attaching rag_id: ${payload.rag_id}`);
            chatPayload.rag_id = payload.rag_id;
        }

        const pythonResponse = await axios.post('https://agent-prod.studio.lyzr.ai/v3/inference/chat/', chatPayload, {
            headers: {
                'x-api-key': LYZR_API_KEY,
                'Content-Type': 'application/json'
            }
        });

        console.log("3. Received response from Lyzr Cloud!");

        // Send back to Frontend
        const promptTokens = Math.floor(payload.query.length / 4);
        const completionTokens = Math.floor((pythonResponse.data.response || "").length / 4);
        const totalTokens = promptTokens + completionTokens;

        res.json({
            success: true,
            agentReply: pythonResponse.data.response || "No response received.",
            tokenUsage: pythonResponse.data.usage || {
                prompt_tokens: promptTokens,
                completion_tokens: completionTokens,
                total_tokens: totalTokens
            }
        });

    } catch (error) {
        console.error("Agent execution failed:", error.message);
        res.status(500).json({ 
            success: false, 
            error: "Agent execution failed in the Lyzr Cloud layer. Verify your API Key." 
        });
    }
});

// Endpoint: Stream Chat (Server-Sent Events)
app.post('/api/stream-agent', authenticateToken, async (req, res) => {
    try {
        const payload = req.body; 
        const LYZR_API_KEY = process.env.LYZR_API_KEY;
        
        if (!LYZR_API_KEY) {
            return res.status(401).json({ success: false, error: "Missing LYZR_API_KEY" });
        }
        if (!payload.config?.agentId) {
            return res.status(400).json({ success: false, error: "Missing agentId." });
        }

        const chatPayload = {
            user_id: "default_user",
            agent_id: payload.config.agentId,
            session_id: payload.sessionId || "demo_session_123",
            message: payload.query || "Hello Agent!"
        };
        if (payload.rag_id) chatPayload.rag_id = payload.rag_id;

        // NOTE: The dedicated streaming endpoint is /v3/inference/stream/
        // (older /v3/inference/stream-chat/ returns 405 Method Not Allowed)
        const pythonResponse = await axios.post('https://agent-prod.studio.lyzr.ai/v3/inference/stream/', chatPayload, {
            headers: {
                'x-api-key': LYZR_API_KEY,
                'Content-Type': 'application/json',
                'Accept': 'text/event-stream'
            },
            responseType: 'stream',
            timeout: 60000
        });

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        // Forward upstream errors gracefully instead of crashing the process
        pythonResponse.data.on('error', (err) => {
            console.error("Upstream stream error:", err.message);
            if (!res.writableEnded) {
                res.write(`data: ${JSON.stringify({ error: err.message || 'stream error' })}\n\n`);
                res.end();
            }
        });

        pythonResponse.data.pipe(res);

        // Stop consuming the upstream stream if the client disconnects.
        // NOTE: use res 'close' (not req) — req 'close' fires as soon as the
        // request body is consumed, which would kill the stream prematurely.
        res.on('close', () => {
            if (!res.writableEnded) pythonResponse.data.destroy();
        });
    } catch (error) {
        const status = error.response?.status || 500;
        // NOTE: with responseType 'stream' a non-2xx body arrives as a stream,
        // not parsed JSON, so response.data.detail is usually unavailable.
        const rawDetail = error.response?.data?.detail;
        const detail = Array.isArray(rawDetail)
            ? rawDetail.map(d => d.msg).join('; ')
            : (typeof rawDetail === 'string' ? rawDetail : error.response?.data?.message);
        console.error("Agent stream failed:", status, detail || error.message);
        res.status(status).json({
            success: false,
            error: typeof detail === 'string' && detail !== "An unexpected error occurred."
                ? `Agent streaming failed: ${detail}`
                : `Agent streaming failed (HTTP ${status}). Please verify the agent ID and your LYZR_API_KEY.`
        });
    }
});

// Endpoint: Get Agent Versions
app.get('/api/versions/:agentId', authenticateToken, async (req, res) => {
    try {
        // Mocking version history for now since Lyzr API docs for this specific endpoint might vary
        // In a real production setup, this would fetch from Lyzr's /enterprise/api/agents/versions/list
        const versions = [
            { id: "v1", createdAt: new Date(Date.now() - 86400000).toISOString(), description: "Initial Deployment" },
            { id: "v2", createdAt: new Date().toISOString(), description: "Latest Update" }
        ];
        res.json({ success: true, versions: versions.reverse() });
    } catch (error) {
        res.status(500).json({ success: false, error: "Failed to fetch versions." });
    }
});

// Endpoint: Rollback Agent
app.post('/api/versions/rollback', authenticateToken, async (req, res) => {
    try {
        const { agentId, versionId } = req.body;
        // In production, this would call Lyzr's update/revert endpoint.
        console.log(`Rolling back agent ${agentId} to version ${versionId}`);
        res.json({ success: true, message: `Successfully rolled back to ${versionId}` });
    } catch (error) {
        res.status(500).json({ success: false, error: "Failed to rollback." });
    }
});

// Endpoint: Execute Workspace Task
app.post('/api/run-workspace', authenticateToken, async (req, res) => {
    const { task, agentIds, workspaceName } = req.body;
    const LYZR_API_KEY = process.env.LYZR_API_KEY;
    
    if (!task || !agentIds || agentIds.length === 0) {
        return res.status(400).json({ success: false, error: "Missing task or agents." });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sendEvent = (data) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    let currentContext = task;
    const session_id = `workspace_${Date.now()}`;

    try {
        for (let i = 0; i < agentIds.length; i++) {
            const agentId = agentIds[i];
            sendEvent({ type: 'agent_start', agentId });

            const chatPayload = {
                user_id: "default_user",
                agent_id: agentId,
                session_id: session_id,
                message: i === 0 
                  ? currentContext 
                  : `Continue working on the following task with this context from the previous agent:\n\n${currentContext}`
            };

            const response = await axios.post('https://agent-prod.studio.lyzr.ai/v3/inference/chat/', chatPayload, {
                headers: {
                    'x-api-key': LYZR_API_KEY,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data && response.data.response) {
                currentContext = response.data.response;
                sendEvent({ type: 'agent_done', agentId, result: currentContext });
            } else {
                throw new Error("Invalid response from Lyzr API");
            }
        }

        sendEvent({ type: 'final_result', result: currentContext });
        res.write('data: [DONE]\n\n');
        res.end();

    } catch (error) {
        console.error("Workspace execution failed:", error.response?.data || error.message);
        const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message;
        sendEvent({ type: 'error', message: errorMessage });
        res.write('data: [DONE]\n\n');
        res.end();
    }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Express Main Backend running on port ${PORT}`);
});
