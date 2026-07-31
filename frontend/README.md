<div align="center">
  <h1>Lyzr Forge - Frontend</h1>
  <p><strong>The Premium Glassmorphic UI for Lyzr Forge</strong></p>
  
  <p>
    <img src="https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js" alt="Next.js" />
    <img src="https://img.shields.io/badge/React-18-blue?style=flat-square&logo=react" alt="React" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat-square&logo=tailwind-css" alt="Tailwind CSS" />
  </p>
</div>

<br />

## Overview

This directory contains the **Next.js frontend** for Lyzr Forge. It features a state-of-the-art, premium glassmorphic UI designed to provide an unparalleled developer experience for orchestrating and deploying AI agents.

Key features include:
- **Interactive Dual-Pane Editor**
- **Live Sandbox Chat**
- **Immersive 3D Environments (via Spline)**

---

## Getting Started

### Prerequisites
- **Node.js** (v18 or higher recommended)
- **npm** or **yarn**

### Installation

1. Navigate to the frontend directory (if you aren't already here):
   ```bash
   cd frontend
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```

### Running Locally

Start the development server:
```bash
npm run dev
```
The application will be available at [http://localhost:3000](http://localhost:3000).

---

## 🛠 Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (React)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **3D Elements**: [@splinetool/react-spline](https://spline.design/)

---

##  Project Structure

- `src/app/` - Next.js App Router layout and pages.
- `src/components/` - Reusable React components (UI elements, blocks, Agent Sandbox).
- `public/` - Static assets and icons.

---

## 🏛 Architecture & Component Flow

```mermaid
graph TD
    classDef primary fill:#7C3AED,stroke:#5B21B6,stroke-width:2px,color:#fff,rx:8px,ry:8px;
    classDef secondary fill:#F3F4F6,stroke:#D1D5DB,stroke-width:2px,color:#111827,rx:8px,ry:8px;
    classDef next fill:#000,stroke:#333,stroke-width:2px,color:#fff,rx:8px,ry:8px;

    User[User / Developer]:::secondary
    AppRouter[Next.js App Router]:::next
    Context[State Management]:::secondary
    Editor[Interactive Agent Editor]:::primary
    Sandbox[Live Sandbox Chat]:::primary
    API[Backend API]:::next

    User -->|Interacts| AppRouter
    AppRouter --> Editor
    AppRouter --> Sandbox
    Editor <-->|Updates Config| Context
    Sandbox <-->|Sends Messages| API
    Context -->|Syncs State| API
```

### Detailed Explanation

The frontend architecture relies on a highly performant **Next.js App Router** structure. 
1. **Interactive Agent Editor:** As the user tweaks agent parameters (like LLM settings or instructions), the React State captures these inputs in real-time. This dynamic syncing allows the UI to reflect changes instantly with micro-animations.
2. **State Management:** Core configuration states are managed via React contexts or hooks, ensuring the dual-pane layout remains perfectly synchronized.
3. **Live Sandbox Chat:** This component operates as an isolated execution environment. Once the agent is configured, it sends simulated chat messages directly to the Express backend (and onto Lyzr Automata) to test the agent's RAG knowledge before deployment.
