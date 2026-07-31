<div align="center">
  <h1>Lyzr Forge - Backend Services</h1>
  <p><strong>The Core Intelligence & API Layer for Lyzr Forge</strong></p>

  <p>
    <img src="https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js" alt="Express" />
    <img src="https://img.shields.io/badge/Python-Agent-3776AB?style=flat-square&logo=python" alt="Python" />
    <img src="https://img.shields.io/badge/Lyzr_Automata-2.0-7C3AED?style=flat-square&logo=probot&logoColor=white" alt="Lyzr Automata" />
  </p>
</div>

<br />

##  Overview

This directory contains the robust backend architecture for Lyzr Forge. It handles agent telemetry, native RAG (Retrieval-Augmented Generation) document parsing, and provides scalable REST API endpoints to bridge the premium UI with Lyzr's Automata engine.

It is split into two main services:
- `express-server`: The Node.js API server handling frontend requests, routing, file uploads, and session telemetry.
- `python-agent`: The core intelligence layer powered by Lyzr Automata (used for configuring and orchestrating AI agents).

---

## Getting Started (Express Server)

### Prerequisites
- **Node.js** (v18 or higher recommended)
- **npm** or **yarn**

### Installation

1. Navigate to the Express server directory:
   ```bash
   cd backend/express-server
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```

### Running Locally

Start the Express backend:
```bash
node server.js
```
The API server will typically start on [http://localhost:4000](http://localhost:4000).

---

##  Tech Stack

- **Node.js & Express**: Core routing and REST API services.
- **Multer**: For handling knowledge base file uploads (RAG documents).
- **PDF-Parse**: Extracting and vectoring PDF document content.
- **Python / Lyzr Automata**: Dedicated AI agent orchestration and logic.

---

## Architecture Flow

```mermaid
graph TD
    classDef primary fill:#7C3AED,stroke:#5B21B6,stroke-width:2px,color:#fff,rx:8px,ry:8px;
    classDef secondary fill:#F3F4F6,stroke:#D1D5DB,stroke-width:2px,color:#111827,rx:8px,ry:8px;
    classDef db fill:#10B981,stroke:#047857,stroke-width:2px,color:#fff,rx:8px,ry:8px;

    Client[Next.js Frontend]:::secondary
    Express[Express Server]:::primary
    Python[Python Lyzr Agent]:::primary
    VectorDB[(Knowledge / Vector DB)]:::db
    LLM[Language Model]:::db

    Client -->|REST API Requests| Express
    Express -->|Validates & Routes| Python
    Python <-->|Retrieves Docs| VectorDB
    Python <-->|Generates Response| LLM
    Python -->|Agent Telemetry| Express
    Express -->|JSON Response| Client
```

### Detailed Explanation

The backend acts as the critical bridge connecting the frontend interface to the Lyzr Automata engine.

1. **Express Server (The Gateway):** All API requests from the Next.js frontend arrive here. The Express server validates payloads, manages document uploads (via Multer), and handles preliminary data parsing before forwarding it to the orchestration layer.
2. **Python Agent (The Brain):** Leveraging Lyzr Automata, this service processes natural language requests. When a user tests their agent in the Sandbox, this Python module interacts directly with the configured Language Model (LLM).
3. **Native RAG & Vector DB:** For context-aware responses, uploaded documents are converted into vector embeddings. When queried, the Python Agent retrieves relevant document chunks from the Vector DB and injects them into the prompt, ensuring the generated responses are highly accurate and domain-specific.
