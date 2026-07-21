# AI Customer Support Automation SaaS 🚀

A production-ready, multi-tenant AI Customer Support Automation platform built with React, TypeScript, Node.js, Express, PostgreSQL, Qdrant Vector DB, and LangChain.

---

## 🌟 Overview & Features

- **🏢 Multi-Tenant Architecture**: Complete data isolation across PostgreSQL models and Qdrant vector database collections filtered by `companyId`.
- **🔐 Secure Dual-Token Authentication**:
  - In-Memory Access Tokens (no `localStorage` exposure to prevent XSS).
  - HTTP-Only `refreshToken` and `accessToken` cookies for seamless session restoration and CSRF protection.
- **🛡️ Enterprise Role-Based Access Control (RBAC)**:
  - **Company Owner / Admin**: Full access to Knowledge Base, Bot & Widget settings, Admin Analytics, Team Directory, and Settings.
  - **Support Agent**: Access restricted strictly to **assigned tickets**, live conversations, customer roster, and personal reporting. Cannot view or edit company settings, bot configurations, or admin analytics.
- **🤖 RAG-Powered AI Chatbot**:
  - Document processing worker (PDF, DOCX, TXT, MD) using `@langchain/textsplitters` (`RecursiveCharacterTextSplitter`).
  - High-performance vector embeddings stored in **Qdrant**.
  - Intelligent context retrieval with confidence scoring and automatic fallback/escalation.
- **🚨 Automated Human Handoff & Support Tickets**:
  - Unresolved or low-confidence AI queries automatically generate structured support tickets.
  - Intelligent round-robin or least-busy ticket auto-assignment to active agents.
- **💻 Embeddable Chat Widget**:
  - Floating script widget easily embedded via a single `<script>` snippet.
  - **Domain Whitelisting Security**: Origin/Referer headers validated against whitelisted domains (`403 Forbidden` on unauthorized websites).
- **📊 Tenant Analytics & Audit Trail**:
  - Real-time token usage, daily resolution rates, ticket trends, and detailed security audit logs isolated per tenant.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 19 + TypeScript + Vite
- **Styling**: TailwindCSS 4 (Dark Theme Default)
- **Icons**: Lucide React
- **Routing**: React Router v7
- **HTTP Client**: Axios with interceptors for token refresh

### Backend
- **Runtime**: Node.js (ESM Module System) + Express
- **Database & ORM**: PostgreSQL + Sequelize ORM
- **Vector Database**: Qdrant (`@langchain/qdrant`)
- **AI Engine**: LangChain (`@langchain/core`, `@langchain/openai`, `@langchain/groq`)
- **Document Parsing**: `pdf-parse`, `mammoth`
- **Cache & Queue**: Redis + BullMQ (with fallback handling)

### Infrastructure & Deployment
- **Containerization**: Docker & Docker Compose

---

## 📁 Repository Structure

```
.
├── backend/
│   ├── src/
│   │   ├── database/          # Sequelize models, migrations & DB setup
│   │   ├── middleware/        # Auth, audit logging & domain whitelist middlewares
│   │   ├── modules/           # Feature routes & controllers (admin, bot, company, ticket, user, webhook, widget)
│   │   ├── services/          # RAG pipeline, queue processor & webhook dispatcher
│   │   ├── utils/             # JWT generators & helper utilities
│   │   └── widget/            # Embeddable widget JS bundle
│   ├── server.js              # Express app entry point & database sync
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/        # Sidebar, layout guards & modals
│   │   ├── context/           # AuthContext & ToastContext
│   │   ├── pages/             # Home, BotSettings, AdminDashboard, Tickets, KnowledgeBase, Settings, etc.
│   │   ├── service/           # API client & domain services
│   │   └── index.css          # Global CSS tokens
│   └── package.json
├── docker-compose.yml         # Container orchestration
└── README.md
```

---

## 🚀 Quickstart with Docker Compose

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/ai-customer-support-saas.git
   cd ai-customer-support-saas
   ```

2. **Configure Environment Variables**:
   Create a `.env` file in the root directory (or update `docker-compose.yml` environment section):
   ```env
   POSTGRES_DB=helpflow_db
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=postgres
   JWT_SECRET=your-super-secret-jwt-key
   REFRESH_TOKEN_SECRET=your-super-secret-refresh-token-key
   ACCESS_TOKEN_SECRET=your-super-secret-access-token-key
   OPENAI_API_KEY=your-openai-api-key
   ```

3. **Spin up services**:
   ```bash
   docker-compose up --build
   ```

4. **Access Applications**:
   - **Frontend Console**: `http://localhost:3000`
   - **Backend API**: `http://localhost:5000`
   - **Qdrant Dashboard**: `http://localhost:6333/dashboard`

---

## 💻 Local Development Setup

### 1. Backend Setup

```bash
cd backend
npm install
```

Create `backend/.env`:
```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=helpflow_db
DB_USER=postgres
DB_PASSWORD=postgres
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION=knowledge_base
ACCESS_TOKEN_SECRET=dev-access-secret-key-123!
REFRESH_TOKEN_SECRET=dev-refresh-secret-key-123!
OPENAI_API_KEY=your-openai-api-key
```

Run database migrations:
```bash
npm run db:migrate
```

Start the backend development server:
```bash
npm run dev
```

### 2. Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env`:
```env
VITE_BACKEND_URL=http://localhost:5000
```

Start the frontend development server:
```bash
npm run dev
```

---

## 🔒 Security & Tenant Isolation Rules

The system follows strict security guarantees:

1. **No Client-Side Secrets**:
   - LLM API Keys, Database Credentials, JWT Secrets, Qdrant API Keys, and HMAC Webhook Secrets stay **100% server-side**.
   - Frontend only receives public bot IDs, public widget keys, theme settings, and chat responses.

2. **Tenant Scoping**:
   - PostgreSQL queries enforce `where: { companyId }`.
   - Qdrant similarity searches apply filter metadata: `{ companyId: tenantCompanyId }`.

3. **Domain Whitelisting**:
   - The embeddable widget validates `Origin` and `Referer` headers against the bot's configured `allowedDomains`.

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).
