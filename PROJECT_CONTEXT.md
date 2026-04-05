# Procast — Master Project Context

## 1) Project Overview
Procast is a demand forecasting and planning platform built to help companies move away from fragmented manual forecasting workflows, especially those done in spreadsheets. The goal is to provide a centralized system where users can upload business data, generate forecasts, simulate scenarios, and view results in dashboards that support decision-making.

The product is positioned as a forecasting and S&OP support platform, especially relevant for FMCG-style businesses where demand planning, promotions, seasonality, and business assumptions affect forecasting quality.

---

## 2) Core Problem
Many businesses still rely on Excel-based forecasting processes that are:
- manual
- slow
- inconsistent across teams
- difficult to audit
- weak at scenario analysis
- disconnected from reporting and decision dashboards

Procast is meant to solve this by combining data ingestion, forecasting, scenario simulation, and reporting in one product.

---

## 3) Product Vision
Procast should become a smart business platform where a company can:
- upload historical sales/demand data
- generate forecasts across different time horizons
- compare actual vs predicted demand
- evaluate forecast accuracy
- simulate business scenarios such as promotion, inflation, or price changes
- view insights through clean dashboards
- support decision-making for planning and operations

The product should feel practical, business-oriented, and modern rather than purely technical.

---

## 4) Target Users
Primary users may include:
- demand planners
- sales planning teams
- supply chain teams
- finance teams
- category managers
- business analysts
- managers and decision-makers

User expectations:
- easy file upload
- understandable forecasting output
- clear charts and KPI cards
- simple scenario controls
- secure handling of company sales data

---

## 5) Frontend Purpose
The frontend is the user-facing application layer. Its role is to make forecasting workflows easy and visually clear.

Frontend responsibilities:
- landing/product presentation
- authentication and protected access
- upload flow for Excel/CSV files
- forecast configuration UI
- dashboards and KPI cards
- scenario simulation inputs
- result visualization
- drill-down analytics
- business summary display

The frontend should emphasize:
- simplicity
- professionalism
- business clarity
- confidence in data/security

---

## 6) Backend Purpose
The backend is the data and forecasting engine. It handles the logic that powers the product.

Backend responsibilities:
- file ingestion
- schema/column validation
- preprocessing and cleaning
- time-series preparation
- model execution
- forecast generation
- scenario simulation logic
- metrics calculation
- API responses to frontend
- persistence of uploaded and generated data

The backend should be structured to support clean APIs and future model expansion.

---

## 7) Main Product Flows
### A. Upload Data
1. User enters upload page
2. User uploads Excel/CSV data
3. System validates columns and structure
4. System stores or stages the dataset
5. User proceeds to forecasting flow

### B. Generate Forecast
1. User selects relevant filters or forecast settings
2. User chooses time horizon
3. Frontend sends request to backend
4. Backend prepares data and runs model(s)
5. Backend returns forecast results
6. Frontend displays charts, tables, and KPIs

### C. Analyze Results
1. User views demand trend charts
2. User compares historical and forecasted values
3. User checks KPI cards such as total demand or forecast error
4. User drills down by product/category/region if supported

### D. Run Scenario Simulation
1. User adjusts assumptions such as price, promotion, inflation, or other business drivers
2. Frontend sends scenario inputs to backend
3. Backend recalculates projected output or adjusted forecast
4. Frontend shows scenario impact visually

---

## 8) Forecasting Scope
Potential forecasting capabilities include:
- short-term forecasting (monthly / near-term planning)
- annual planning / AOP forecasting
- multi-level forecasting by SKU, category, region, or channel
- comparison between baseline and adjusted forecast
- future support for model comparison or model selection

Potential models mentioned in project vision:
- Prophet
- XGBoost
- LSTM

These are part of the broader concept and may be implemented incrementally.

---

## 9) Scenario Simulation Scope
A key value proposition of Procast is not only forecasting demand from historical data, but also supporting contextual business forecasting.

Scenario examples:
- promotion uplift
- price increase/decrease
- inflation effect
- marketing activity effect
- seasonality-aware changes

This part of the system should help users answer questions like:
- What happens if we increase promotions?
- How does price affect projected demand?
- What does the forecast look like under inflation pressure?

---

## 10) Dashboard / Reporting Direction
The dashboard should present business-friendly outputs, not just raw charts.

Likely dashboard elements:
- total forecasted demand
- demand by month
- forecast vs actual comparison
- forecast accuracy / MAPE
- best/worst performing categories
- trend visualizations
- topline summary cards
- drill-down capability

Possible example KPI copy:
- "Total Demand (Dec 2025)"
- "Last Forecast Cycle Accuracy"
- "MAPE"
- "Forecasted Revenue Impact"

---

## 11) Data Requirements (Prototype Level)
Minimum likely data structure:
- date
- product / SKU
- sales or demand value

Additional useful columns:
- category
- region
- channel
- promotion flag
- price
- brand
- customer segment
- inflation or macro factor if available

At prototype stage, the system can work with a simpler schema first and expand later.

---

## 12) Security and Trust
Security is important because the platform may handle company sales data.

Security expectations:
- authenticated access
- restricted access to company/project data
- encrypted transport/storage where applicable
- careful handling of uploaded files
- no accidental exposure of business-sensitive information
- clear confidence-building language in UI

The product should communicate trust and professionalism.

---

## 13) Product Personality / UX Direction
Procast should feel:
- modern
- reliable
- intelligent
- clean
- business-ready
- not overwhelming

The UX should avoid making forecasting feel too technical for business users.
It should translate technical outputs into business insight.

---

## 14) Frontend Page Concepts
Possible page breakdown:
- Landing page
- Login / auth
- Upload page
- Forecast page
- Scenario page
- Dashboard page
- Reports/export page
- Settings / organization page

### Upload page intent
Should encourage action with clear copy such as:
- "Upload your data now to start forecasting."

### Forecast page intent
Should focus on configuration and forecast generation.

### Dashboard page intent
Should focus on outcomes, KPIs, and decision support.

---

## 15) Backend Architecture Direction
The backend should likely be designed around:
- API endpoints for upload / forecast / results
- services for preprocessing and model execution
- validation layer for input datasets
- storage for datasets and outputs
- modular forecasting engine
- future extensibility for more models and rules

Potential backend concerns:
- long-running forecast jobs
- data validation errors
- scenario parameter handling
- metrics generation
- consistent API contracts with frontend

---

## 16) Business Value Proposition
Procast helps businesses:
- reduce manual planning effort
- improve forecast consistency
- analyze demand more intelligently
- test assumptions before acting
- centralize reporting
- support better planning decisions

---

## 17) Current High-Level Positioning
Procast is not just a machine learning demo.
It is meant to be a real business tool that combines:
- forecasting
- business assumptions
- dashboards
- decision support
- secure data handling

---

## 18) Suggested Repository Documentation Set
Recommended supporting files for long-term clarity:
- `PROJECT_CONTEXT.md` → master overview and product definition
- `ARCHITECTURE.md` → technical structure of frontend/backend
- `ROADMAP.md` → upcoming milestones and priorities
- `API_CONTRACT.md` → endpoint definitions and payloads
- `DATA_SCHEMA.md` → expected upload columns and meanings

---

## 19) Suggested Next Priorities
Potential next steps for the project:
1. define exact frontend stack and page structure
2. define backend stack and API contract
3. define upload schema for MVP
4. implement upload + validation flow
5. implement first forecasting pipeline
6. build dashboard with initial KPI cards and charts
7. add scenario simulation logic
8. improve auth and security messaging

---

## 20) One-Sentence Summary
Procast is a business-focused demand forecasting platform that combines data upload, predictive modeling, scenario simulation, and dashboard-driven decision support in one centralized product.
