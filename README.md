# Async Race

Deployment link: `https://epam-race.vercel.app`

Self-score: `395 / 400` (without discretionary code quality points)

## Run

Frontend:

```bash
npm install
npm run dev
```

Backend mock:

```bash
cd async-race-api-main
npm install
npm start
```

Backend should run on `http://127.0.0.1:3000`.

## Scripts

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run format`
- `npm run ci:format`

## Checklist 395/400

### UI Deployment

- [x] Deployment platform configured

### Requirements to Commits and Repository

- [ ] Commit guidelines compliance (Conventional Commits)
- [x] Checklist included in README.md
- [x] Score calculation added
- [x] UI deployment link added to README.md

### Basic Structure (80)

- [x] Two views: Garage and Winners
- [x] Garage view contains: title, create/edit panel, race controls, garage list
- [x] Winners view contains: title, table, pagination
- [x] Persistent state between views (page/input state in Redux store)

### Garage View (90)

- [x] CRUD operations for cars
- [x] Color selection supported
- [x] Random car creation (100 cars, 10x10 name parts, random colors)
- [x] Car management buttons (select/delete)
- [x] Pagination (7 cars per page)
- [x] Empty garage message
- [x] Empty page after delete handled (move to previous page)

### Winners View (50)

- [x] Winners displayed
- [x] Winners pagination (10 per page)
- [x] Winners table columns: №, image, name, wins, best time
- [x] Sorting by wins/time asc/desc via API query params

### Race (170)

- [x] Start engine + animation + drive request
- [x] Stop engine + return to start
- [x] Responsive animation validated for 500px screens
- [x] Start race button
- [x] Reset race button
- [x] Winner announcement
- [x] Button states for start/stop
- [x] Predictable actions during race (buttons/pagination/edit/delete blocked)

### Prettier and ESLint (10)

- [x] Prettier configured (`format`, `ci:format`)
- [x] ESLint configured (Airbnb + TypeScript)

### Overall Code Quality (100, reviewer)

- [ ] Evaluated by reviewer

## Pre-submit Manual Check

- [ ] Backend is running on `http://127.0.0.1:3000`
- [ ] Frontend opens and works on deployed URL
- [ ] Garage CRUD works (create, update, delete)
- [ ] `Generate 100 cars` works
- [ ] Single car start/stop works (`A` / `B`)
- [ ] Race/Reset works for all cars on page
- [ ] Winner is shown and saved in Winners table
- [ ] Winners sorting and pagination work
- [ ] App remains usable on 500px width
