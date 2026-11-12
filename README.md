# TaskFlow — Trello Clone (Task Management Application)

A responsive full-stack Trello-like task management web application built with **React**, **Plain CSS**, **dnd-kit**, and **Supabase** (PostgreSQL + Authentication + Row Level Security).

---

## Technologies Used

- **Frontend:** React.js (Vite)
- **Language:** JavaScript (ES Modules)
- **Routing:** React Router (`react-router-dom`)
- **Styling:** Plain CSS (CSS variables, Flexbox, Grid, responsive media queries)
- **Drag and Drop:** `dnd-kit` (`@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`)
- **Backend & Database:** Supabase PostgreSQL with Row Level Security (RLS)
- **Authentication:** Supabase Auth (Email/Password)
- **Hosting / Deployment:** Vercel

---

## Architecture Overview

```text
trello-clone/
├── supabase/
│   └── schema.sql                # PostgreSQL schema, triggers, indexes & RLS policies
├── src/
│   ├── components/
│   │   ├── BoardCard.jsx         # Board tile with inline edit & delete actions
│   │   ├── Navbar.jsx            # Top navigation bar & logout button
│   │   ├── ProtectedRoute.jsx    # Auth guard for private routes
│   │   ├── TaskCard.jsx          # Sortable/draggable task card
│   │   ├── TaskColumn.jsx        # Droppable list column
│   │   └── TaskModal.jsx         # Create/edit task modal (title, description, list)
│   ├── context/
│   │   └── AuthContext.jsx       # Supabase Auth session & auth methods
│   ├── lib/
│   │   └── supabaseClient.js     # Supabase JS client initialization
│   ├── pages/
│   │   ├── LoginPage.jsx         # User login page
│   │   ├── RegisterPage.jsx      # User registration page
│   │   ├── DashboardPage.jsx     # User boards dashboard (CRUD)
│   │   └── BoardDetailsPage.jsx  # Kanban columns, dnd-kit, search & list filtering
│   ├── services/
│   │   ├── boardService.js       # Board CRUD + automatic default lists creation
│   │   ├── listService.js        # List CRUD
│   │   └── cardService.js        # Task CRUD & position persistence
│   ├── App.jsx                   # Application routes
│   ├── index.css                 # Design tokens & global base styles
│   └── main.jsx                  # Entry point
├── .env.example                  # Required environment variables
├── vercel.json                   # SPA fallback rewrites for Vercel
└── package.json
```

### Database Design (Supabase PostgreSQL)

- **`profiles`** — Stores user profile metadata linked 1:1 to `auth.users(id)` (populated via database trigger on signup).
- **`boards`** — Stores user-owned boards (`user_id` FK -> `profiles.id`).
- **`lists`** — Stores ordered columns per board (`board_id` FK -> `boards.id`). New boards automatically receive `To Do`, `In Progress`, and `Done`.
- **`cards`** — Stores task title, description, `list_id`, `board_id`, and `position` for persistent drag-and-drop ordering.
- **Row Level Security (RLS)** — Enabled on all tables so authenticated users can only read and modify their own boards, lists, and tasks.

---

## Features Implemented

- **User Authentication:** Sign up, log in, log out, persistent session, and protected routes via Supabase Auth.
- **Board Management:** Create boards, view all personal boards on the dashboard, rename boards inline, and delete boards.
- **Task & List Management:** Create tasks inside lists, edit task title/description/list, delete tasks, and add custom lists.
- **Drag and Drop (`dnd-kit`):** Reorder tasks within a column or drag tasks across columns (including empty columns) with optimistic UI updates persisted to Supabase.
- **Search & Filtering:** Filter tasks dynamically by title and by list/status.
- **Responsive Design:** Adapts cleanly across desktop, tablet, and mobile viewports using Plain CSS.

---

## Setup Instructions

### 1. Clone & Install Dependencies

```bash
git clone <your-github-repo-url>
cd trello-clone
npm install
```

### 2. Configure Supabase

1. Create a new project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard, paste the contents of [`supabase/schema.sql`](./supabase/schema.sql), and run it.
3. Copy your **Project URL** and **Anon Public Key** from **Project Settings -> API**.
4. Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

> Note: If you want immediate login right after signup during testing, you can disable "Confirm email" under **Authentication -> Providers -> Email** in Supabase.

### 3. Run Locally

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

### 4. Build for Production

```bash
npm run build
```

---

## Deploying to Vercel

1. Push the `trello-clone` project to a GitHub repository.
2. Import the repository in [vercel.com](https://vercel.com).
3. Add environment variables in Vercel Project Settings:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy. `vercel.json` is included so client-side routes (`/dashboard`, `/boards/:boardId`) resolve properly on refresh.

---

## Application Screenshots

> Replace or add captured screenshots from your live deployment in a `docs/screenshots/` folder:
>
> - `docs/screenshots/login.png` — Login & Registration Page
> - `docs/screenshots/dashboard.png` — Boards Dashboard
> - `docs/screenshots/board-details.png` — Kanban Board with Drag & Drop and Search/Filter
