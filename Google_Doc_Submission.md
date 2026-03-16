# Instructions: Copy Everything Below This Line into Your Google Doc

---

### **1. Approach Overview**
To satisfy the requirements of viewing 100+ repositories and mapping access for 1000+ users efficiently without excessive sequential calls, I adopted a **Java Spring Boot (Backend) + React TypeScript (Frontend)** Architecture. This ensures a true full-stack solution.

**Backend Architecture (Spring WebFlux):**
Instead of simple blocking connections (`RestTemplate`), the backend is implemented using `Spring Webflux` with `WebClient`.
1. The service first requests the paginated list of all repositories for an organization.
2. It then creates a stream (`Flux`) to *concurrently* fetch the collaborators for each of those repositories, greatly reducing total network time.
3. Once all async streams complete, it processes the pairs of `(User, Repository)` and groups them into a structured `Map<User, List<Repository>>`.

**Frontend Architecture (React + Vite + TailwindCSS):**
The frontend displays this mapping gracefully. Instead of dumping a massive JSON object on the screen, it visualizes the user mappings on a data table. A `lucide-react` icon system alongside Tailwind CSS gives it a premium and responsive feel.

### **2. Setup & Execution Instructions**

**Obtaining a GitHub Token**
This app relies heavily on GitHub APIs which allow 60 requests/hr unauthenticated. You **must** generate a token:
- Go to GitHub -> Settings -> Developer Settings -> Personal Access Tokens (classic).
- Generate a token with the `read:org` and `repo` scopes.

**Starting the Backend (Java):**
1. Have Java 17+ and Maven installed.
2. Open terminal and navigate to the backend folder:
   ```bash
   cd backend/github-report
   ```
3. Pass your token via the `GITHUB_TOKEN` environment variable and run:
   ```bash
   # MacOS / Linux
   export GITHUB_TOKEN="your_classic_token_here"

   # Windows PowerShell
   $env:GITHUB_TOKEN="your_classic_token_here"
   ```
4. Start the application:
   ```bash
   mvn spring-boot:run
   ```
   *(Server starts on `localhost:8080`)*

**Starting the Frontend (React):**
1. Have Node.js 18+ installed.
2. Open a separate terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the app:
   ```bash
   npm run dev
   ```
   *(App starts on `localhost:5173`. Open your browser to view the dashboard).*

### **3. How to Call the API Endpoint Directly**

If you wish to bypass the React frontend and hit the API directly (e.g., using Postman or cURL), wait until the backend is running, then use:

```bash
curl -i http://localhost:8080/api/reports/org/{organization_name}
```
**Example:**
```bash
curl -i http://localhost:8080/api/reports/org/netflix
```

### **4. Assumptions & Edge Cases**
1. **API Rate Limits:** Even with a token, GitHub imposes limits (e.g., 5000 requests/hr). An exponential-backoff retry mechanism is programmed into the `WebClient` for 429 warnings. If the token expires or lacks permission to view collaborators for certain private repos, the API silently skips that repo (logging a warning) rather than crashing the whole aggregation process.
2. **Users Over 1,000:** Since the backend aggregates data from paginated `link` headers programmatically until exhaustion (no arbitrary maximum page limit specified in the logic), it will naturally scale to sizes of 100+ repos and 1000+ users without truncating the results natively.
3. **Public vs. Private:** If the GitHub token executing the query does not have administrative scope over a private repository, it likely cannot view its collaborators.
4. **Link to Repository:** *(Insert your GitHub URL here once you push the code)*
