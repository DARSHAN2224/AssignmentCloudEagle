# GitHub Organization Access Report

This is a full-stack application that generates an access report showing which users have access to which repositories within a given GitHub organization.

## Architecture
- **Backend:** Java Spring Boot 3 + Spring WebFlux for highly concurrent, non-blocking API calls to GitHub.
- **Frontend:** React + TypeScript + Vite with TailwindCSS for a modern, responsive UX.

## Prerequisites
- Java 17+
- Maven 3.8+
- Node.js 18+
- A GitHub Personal Access Token (PAT)

### Generating a GitHub Token
1. Go to GitHub -> Settings -> Developer Settings -> Personal access tokens -> Tokens (classic).
2. Generate a new token with at least `read:org` and `repo` permissions.

---

## 🚀 Running the Backend

1. Navigate to the backend directory:
   ```bash
   cd backend/github-report
   ```
2. Set your GitHub token as an environment variable (Required, otherwise rate limits will hit quickly or private repos won't show).
   - **Mac/Linux:** `export GITHUB_TOKEN=your_token_here`
   - **Windows (PowerShell):** `$env:GITHUB_TOKEN="your_token_here"`
3. Run the Spring Boot application:
   ```bash
   mvn spring-boot:run
   ```
   *The backend will start on `http://localhost:8080`.*

---

## 🎨 Running the Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   *The frontend will typically start on `http://localhost:5173`. Open this in your browser.*

---

## ⚙️ How it Works & Assumptions

### Design Decisions
1. **Concurrency:** The requirements stated the app needs to handle 100+ repos and 1000+ users efficiently.
   - The Spring Boot backend uses `Spring WebFlux` (`WebClient`) to perform non-blocking HTTP requests.
   - It fetches repositories with pagination, and then *concurrently* fetches the collaborators for all those repositories.
2. **Rate Limiting Handling:** WebClient is configured with an automatic retry mechanism (exponential backoff) specifically for 429 Too Many Requests or 503 Service Unavailable responses from GitHub.
3. **Skipping 404/403s:** If the application encounters an error fetching collaborators for a specific repository (e.g., due to fine-grained access limits on the token), it gracefully logs a warning and skips that repo instead of crashing the entire report generation.

### Assumptions
- A user executing the search query expects an exact match of the GitHub organization slug (e.g., `netflix`, `microsoft`).
- The user running the app provides a valid PAT. Unauthenticated requests to GitHub's API are severely rate-limited (60 per hour) and cannot access private org data.
