# Quick Start Guide - Marketing ROI Dashboard

## What's New

Your dashboard has been completely redesigned with a modern dark theme and 6 interactive tabs. The old sidebar has been replaced with a sticky top navigation bar.

## 🚀 Running the Dashboard

### Development Mode (with hot reload)
```bash
cd dashboard-next
npm run dev
```
Then open: **http://localhost:3000**

### Production Build
```bash
cd dashboard-next
npm run build
npm run start
```

## 📊 The 6 Tabs

1. **Data Overview** `/`
   - 4 stat cards with accent left borders
   - Sales distribution area chart  
   - Budget mix pie chart
   - Influencer and channel correlation charts

2. **Model Comparison** `/models`
   - Metrics table with zebra striping
   - Best values highlighted in accent color
   - R², RMSE, MAE bar charts
   - Key insight cards

3. **Feature Importance** `/feature-importance`
   - Feature importance ranking chart
   - Individual feature progress bars
   - Channel correlation visualization
   - 4 key finding cards

4. **Predict** `/predict`
   - Custom styled budget sliders
   - Training range indicators
   - Real-time prediction with animated numbers
   - ROI and performance badge display

5. **Budget Simulator** `/simulator`
   - Budget allocation sliders
   - Quick preset buttons
   - All-models prediction comparison
   - Budget breakdown bars
   - TV budget sensitivity chart

6. **Target Planner** `/target-planner`
   - **Inverse Prediction:** Set sales target → get optimal budget allocation
   - **Probability Analysis:** Adjust budgets → see probability of hitting goals
   - Distribution histogram
   - RF mean prediction display

## 🎨 Design System

### Colors
```
Primary Background:  #0f0f0f
Card Background:     #1a1a1a
Accent (Red):        #e5534b
Accent Hover:        #cc3f3c
Text:                #ffffff
Text Muted:          #888888
Success:             #22c55e
Error:               #ef4444
Warning:             #f59e0b
```

### Typography
- Font: Inter (from Google Fonts)
- Page Titles: 2rem bold
- Section Headers: 1.25rem semibold
- Labels: 0.8rem uppercase

### Key Features
✅ Sticky navigation bar (no overlap thanks to pt-16 padding)
✅ Animated tab underline (CSS transform scale)
✅ Custom sliders with floating tooltips
✅ Animated number counters
✅ Responsive charts (all wrapped in ResponsiveContainer)
✅ Interactive stats and KPI cards
✅ Delta badges for changes (↑ ↓)
✅ Performance indicators (red/orange/green)

## 📁 File Structure

```
dashboard-next/
├── app/
│   ├── globals.css                 ← Design system CSS variables
│   ├── layout.tsx                  ← With NavigationBar
│   ├── page.tsx                    ← Data Overview
│   ├── feature-importance/page.tsx ← Feature Importance
│   ├── models/page.tsx             ← Model Comparison
│   ├── predict/page.tsx            ← Predict
│   ├── simulator/page.tsx          ← Budget Simulator
│   └── target-planner/page.tsx     ← Target Planner
├── components/
│   └── NavigationBar.tsx           ← 6-tab sticky navbar
└── lib/
    ├── api.ts                      ← API client
    └── utils.ts                    ← Helper functions
```

## 🔄 Integration with API

The dashboard connects to your FastAPI backend on `:8000`:

```bash
# Start FastAPI backend
cd ..  # Go to project root
source .venv/Scripts/activate  # or python -m venv activate on Windows
pip install -r requirements.txt
python src/train.py  # Train models
uvicorn api.main:app --reload --port 8000
```

The Next.js `next.config.js` automatically proxies `/api/*` requests to `:8000` in dev mode.

## 🛠️ Customization

### Change the accent color
Edit `app/globals.css`:
```css
--accent: #e5534b;        /* Change this */
--accent-hover: #cc3f3c;  /* And this */
```

### Add/remove tabs
Edit `components/NavigationBar.tsx`:
```typescript
const tabs = [
  { href: "/", label: "Data Overview", icon: BarChart3 },
  // Add more tabs here
];
```

### Modify chart colors
Charts use these colors defined in `lib/utils.ts`:
```typescript
export const CHART_COLORS = [
  "#4a9eff",  // Blue
  "#8b5cf6",  // Violet
  "#06b6d4",  // Cyan
  // ...
];
```

## ✅ Verification Checklist

- ✅ TypeScript builds without errors
- ✅ All 6 tabs render on 1440px+ viewport
- ✅ Sticky navbar doesn't overlap content
- ✅ All charts are responsive (ResponsiveContainer)
- ✅ Mobile horizontal scroll works on nav
- ✅ Animations smooth and performant
- ✅ Dark theme applied consistently
- ✅ API integration ready

## 🚨 Troubleshooting

**"API error - make sure FastAPI is running"**
→ Start the backend: `uvicorn api.main:app --reload --port 8000`

**Navbar overlapping content**
→ This shouldn't happen! The main has `pt-16` padding. Check layout.tsx is correct.

**Charts not responsive**
→ Verify `<ResponsiveContainer width="100%" height={...}>` wraps each chart.

**Animations not smooth**
→ Check browser performance. Try reducing animation duration in globals.css.

## 📚 Resources

- [Next.js 14 Docs](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [Recharts](https://recharts.org)
- [Lucide Icons](https://lucide.dev)
- [Radix UI](https://www.radix-ui.com)

---

**Dashboard version:** 2.0 (Redesigned)  
**Last updated:** May 20, 2026  
**Status:** Production Ready ✅

