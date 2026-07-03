# Bacterial Growth Virtual Simulation

A virtual microbiology lab: grow **E. coli**, **Pseudomonas aeruginosa**, or
**Bacillus subtilis** on a simulated agar plate and see how temperature,
nutrient level, antibiotic type (Ampicillin / Ciprofloxacin / Streptomycin)
and antibiotic concentration affect growth — including the emergence of
antibiotic-resistant colonies.

```
bacterial-sim/
├── backend/                 Python simulation engine + Flask API
│   ├── app.py                Flask server (routes)
│   ├── growth_model.py       Logistic growth / antibiotic kill model
│   ├── requirements.txt
│   └── config/
│       ├── bacteria.json     Species growth parameters
│       ├── antibiotics.json  Drug MIC / kill-rate / clearance parameters
│       └── nutrients.json    Nutrient level parameters
│
└── frontend/                 React + Vite app
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx / App.css
        ├── index.css
        ├── api/simulationApi.js
        ├── config/simulationOptions.json
        └── components/
            ├── Header.jsx / .css
            ├── SetupPanel.jsx / .css        (experiment controls)
            ├── PetriDish.jsx / .css         (animated canvas petri dish)
            ├── Dashboard.jsx / .css         (metrics + charts screen)
            ├── GrowthChart.jsx              (Recharts logistic curve)
            └── ClearanceChart.jsx           (Recharts decay curve)
```

## 1. Set up MongoDB (for experiment history & comparison)

You have two options — pick one:

**Option A — Free cloud database (recommended, no install needed):**
1. Create a free cluster at https://www.mongodb.com/cloud/atlas/register
2. *Database Access* → add a database user (username + password)
3. *Network Access* → allow your current IP (or `0.0.0.0/0` for quick local testing)
4. *Connect* → *Drivers* → copy the connection string (looks like
   `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`)

**Option B — Local MongoDB:** install MongoDB Community Server and use
`mongodb://localhost:27017`.

Then, in `backend/`:
```bash
cp .env.example .env
```
Open `.env` and paste your connection string into `MONGODB_URI`. That's it —
the `experiments` collection is created automatically the first time you run
a simulation. If `.env` is missing or unreachable, the app still works —
simulations just won't be saved to history (you'll see a small warning in
the API response, and History will show a friendly "database not
configured" message instead of crashing).

## 2. Run the backend (Python)

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS / Linux

pip install -r requirements.txt
python app.py
```

The API starts on **http://localhost:5000**. Leave this terminal running.

## 3. Run the frontend (React + Vite)

Open a **second** terminal (or a second VS Code integrated terminal):

```bash
cd frontend
npm install
npm run dev
```

Open the URL Vite prints (usually **http://localhost:5173**).
The Vite dev server proxies `/api/*` calls to the Flask backend automatically
(see `vite.config.js`), so no CORS setup is needed in development.

## How it works

1. **Setup screen** — choose species, temperature, nutrient level, antibiotic
   type and concentration, and duration, then click **Start Experiment**.
2. The frontend sends these parameters to `POST /api/simulate`. The Python
   `growth_model.py` runs a logistic-growth simulation with two
   sub-populations (antibiotic-sensitive "normal" bacteria and a small
   antibiotic-tolerant "resistant" mutant fraction), plus an exponentially
   decaying live antibiotic concentration on the plate. The result is also
   saved to MongoDB automatically (see `backend/db.py`).
3. The petri dish **animates** through the returned time series: colonies
   (green = normal, purple = resistant) grow, shrink, or get wiped out live
   on the canvas, while Population / Growth Rate / Time / Status update in
   real time.
4. Click **View Simulation Dynamics Dashboard** to see growth-phase status,
   survival rate, net decline velocity, colony sizes, peak density,
   doubling time, and two Recharts graphs (logistic growth curve +
   antibiotic clearance curve). Clicking **← Back to Setup Panel** clears
   the finished run so the petri dish resets to an idle "Ready" plate
   instead of continuing or replaying.
5. **Learning Center** (top-right button) — 5 flip flashcards covering what
   each of the 3 species is, and how temperature/antibiotics affect growth.
   Click a card to flip it and reveal the answer.
6. **Help** (top-right button) — a numbered step-by-step guide to running an
   experiment, from choosing a species through comparing past runs.
7. **History** (top-right button) — lists every experiment ever run, saved
   in MongoDB. Select 2–4 of them and click **Compare Selected** to see
   their growth curves overlaid on one chart plus a side-by-side metrics
   table (peak density, survival rate, doubling time, etc.). Each entry can
   also be deleted with the 🗑 button.

## Tuning the biology

All growth-rate, temperature-tolerance, MIC (minimum inhibitory
concentration), and carrying-capacity numbers live in the JSON files under
`backend/config/`. Edit those to change how a species/drug combination
behaves — no code changes needed.

## New API endpoints (experiment history)

| Method | Route                        | Purpose                                   |
|--------|------------------------------|--------------------------------------------|
| GET    | `/api/experiments`           | List saved experiments (summaries only)   |
| GET    | `/api/experiments/<id>`      | Full experiment detail (incl. time series) |
| POST   | `/api/experiments/compare`   | Body `{ "ids": [...] }` → full docs for comparison |
| DELETE | `/api/experiments/<id>`      | Delete one saved experiment                |
