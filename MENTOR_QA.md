# StockScanner Mentor Q&A Pack

This pack is grounded in the current codebase under `frontend/` and `python-service/`. It is split into two tracks:
- Interview/mentor-style questions.
- Code review and deep-dive questions.

Each question includes a crisp sample answer that matches how this repo currently works.

**Project Summary**
Q: What does this project do?
A: It is a full-stack stock analysis app. The frontend (React + Vite) lets users register/login, search tickers, and visualize indicators. The backend (Flask) handles auth, fetches Yahoo Finance data via `yfinance`, computes RSI/MA/golden cross, and returns a signal summary.

Q: What are the main directories?
A: `frontend/` contains the React UI, `python-service/` contains the Flask API and SQLite database.

Q: What is the tech stack?
A: React + Vite + Recharts + Axios on the frontend; Flask + Flask-JWT-Extended + SQLite + yfinance + pandas/numpy on the backend.

**User Flow**
Q: Walk me through the typical user flow.
A: User registers or logs in, a JWT is stored in localStorage, user enters a ticker in the dashboard, frontend calls `/api/stocks/analyze`, backend fetches data and returns indicators, and the UI displays a signal, chart, and cards.

Q: How is the dashboard protected?
A: A `ProtectedRoute` checks for a token in `frontend/src/App.jsx` and redirects to `/login` if missing.

Q: Where is state persisted?
A: Token and user in localStorage (`ss_token`, `ss_user`), and search history in localStorage (`ss_search_history`).

**Backend API**
Q: What endpoints exist?
A: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `GET /api/stocks/search`, `POST /api/stocks/analyze`, `GET /health`.

Q: How is authentication implemented?
A: JWTs are created with Flask-JWT-Extended. Protected routes use `@jwt_required()` and tokens expire after 7 days.

Q: Where do user credentials live?
A: In SQLite at `python-service/stockscanner.db`, in a `users` table created by `init_db()`.

Q: How do you hash passwords?
A: With `bcrypt.hashpw()` and verify with `bcrypt.checkpw()`.

Q: How does stock search work?
A: `/api/stocks/search` proxies Yahoo Finance’s search API via `urllib.request` and returns symbol/name/exchange/type.

Q: How does stock analysis work?
A: `/api/stocks/analyze` uses `yfinance` to load history, computes RSI/MA50/MA200, detects golden/death cross, builds chart data, and returns a signal with reasons.

Q: What happens when data is missing?
A: If history is empty or too short, it returns 404. If `ticker.info` fails, it falls back to `fast_info` for basic fields.

**Indicators & Signal Logic**
Q: How is RSI calculated?
A: A custom function in `python-service/app.py` uses a 14-period smoothed average of gains/losses.

Q: How do you derive the overall signal?
A: It counts bullish vs bearish reasons from RSI, price vs MA50/MA200, and golden cross status. More bullish reasons yields “Bullish,” more bearish yields “Bearish,” otherwise “Neutral.”

Q: What triggers golden/death cross?
A: 50-day MA crossing above 200-day MA is golden; below is death. The backend checks the sign of the MA difference.

**Frontend UI**
Q: How are charts displayed?
A: With Recharts `AreaChart` in `frontend/src/components/StockChart.jsx`, showing the last 30 days of close prices.

Q: How are filters applied?
A: Signal filters (`All/Bullish/Bearish/Neutral`) via `FilterPanel`. Advanced numeric filters are applied in `Dashboard.jsx`.

Q: How does search autocomplete work?
A: `SearchBar.jsx` debounces input and calls `/api/stocks/search`, rendering a dropdown of suggestions.

Q: How is recent history shown?
A: `RecentStockGrid.jsx` shows last 20 scanned tickers from localStorage.

**Security & Compliance**
Q: Any security concerns?
A: JWT is stored in localStorage (vulnerable to XSS). The JWT secret has a fallback string and should be set via env in production.

Q: How is CORS configured?
A: CORS is allowed for localhost ports using a regex. Production should restrict origins.

Q: Is there rate limiting?
A: No. There is no rate limiting or brute-force protection currently.

**Performance**
Q: What are the bottlenecks?
A: Each analysis hits Yahoo Finance via `yfinance`. There is no caching, so repeated calls can be slow and rate-limited.

Q: What would you optimize first?
A: Add caching for analysis results and search suggestions, and consider background prefetch or batching.

**Testing & Quality**
Q: Are there tests?
A: No tests exist currently.

Q: What tests should be added first?
A: Unit tests for `calculate_rsi()` and `generate_signal()` on the backend, and component tests for SearchBar, Dashboard filtering, and Auth flows.

**Deployment & Ops**
Q: How do you run it locally?
A: Backend: run `python-service/app.py` (default port 5001). Frontend: `npm run dev` in `frontend/`.

Q: What configuration is missing for production?
A: No Dockerfile, no env examples, no HTTPS or reverse-proxy setup, and CORS/JWT secrets are not production-hardened.

**Data Integrity & Edge Cases**
Q: What happens if marketCap is missing?
A: `marketCap` can be `None` and some calculations in `Dashboard.jsx` assume it exists; that can cause edge-case errors.

Q: Is the currency filter fully implemented?
A: The UI has a currency filter, but `isStockPassingFilters()` does not enforce it, so it is effectively unused.

**Mentor Deep-Dive Questions**
Q: If you had to make this multi-user and production-grade, what would you change first?
A: Replace localStorage auth with HttpOnly cookies, add rate limiting, add caching, move from SQLite to a managed DB, and deploy behind a reverse proxy with strict CORS.

Q: How would you validate signal quality?
A: Backtest RSI/MA signals over historical periods, compare against a baseline strategy, and measure precision/recall for signal outcomes.

Q: How would you handle scale?
A: Add caching, use a queue for heavy analysis, and introduce a separate data service instead of querying Yahoo Finance per request.

Q: Where are the weakest points in the current code?
A: Error handling is minimal, there is no caching, and some filters can break when fields are missing.

**Code Review Questions**
Q: Can you identify a correctness bug from reading the code?
A: The currency filter is defined in the UI but never applied to results in `Dashboard.jsx`.

Q: Any data-type issues?
A: `marketCap / 1e9` is computed without checking for null, which can throw if marketCap is missing.

Q: Any encoding issues?
A: Several emoji and box-drawing chars are mis-encoded (showing `ðŸ`), indicating a file encoding mismatch.

**Quick Answer Bank**
Q: What is RSI?
A: A momentum oscillator that measures recent price gains/losses on a 0-100 scale; below 30 is often oversold, above 70 overbought.

Q: What is a golden cross?
A: When the 50-day moving average crosses above the 200-day moving average, indicating potential bullish trend.

Q: Why use MA50 and MA200?
A: They are common trend indicators used to identify medium and long-term direction.
