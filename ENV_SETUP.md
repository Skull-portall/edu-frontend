# Frontend Environment Setup

Create a `.env` file in `migration/frontend/` with the following content:

```env
VITE_API_URL=http://localhost:5000/api/v1
```

**Note:** Vite uses `VITE_*` prefix for environment variables (not `REACT_APP_*` like Create React App).

This tells the frontend where to find the backend API.
