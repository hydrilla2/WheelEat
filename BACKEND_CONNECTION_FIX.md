# 🔧 How to Fix Backend Data Loading Issues

## Common Issues and Solutions

### Issue 1: Backend Server Not Running

**Symptoms:**
- Frontend shows "Failed to load malls" error
- Network errors in browser console (connection refused)
- No data appears in the frontend

**Solution:**

1. **Start the backend server:**
   ```bash
   cd backend
   
   # Activate virtual environment (if not already activated)
   # Windows:
   venv\Scripts\activate
   # Mac/Linux:
   source venv/bin/activate
   
   # Start the server
   uvicorn main:app --reload --port 8000
   ```

2. **Verify the backend is running:**
   - You should see: `INFO:     Uvicorn running on http://127.0.0.1:8000`
   - Open http://localhost:8000 in your browser - you should see: `{"message":"WheelEat API is running","status":"ok"}`
   - Open http://localhost:8000/docs to see the API documentation

---

### Issue 2: CORS (Cross-Origin Resource Sharing) Errors

**Symptoms:**
- Browser console shows: "CORS policy: No 'Access-Control-Allow-Origin' header"
- Network requests fail with CORS errors
- Data requests return 200 but are blocked by browser

**Solution:**

The CORS configuration has been updated in `backend/main.py` to allow common frontend ports. If you're using a different port, add it to the `allow_origins` list:

```python
# In backend/main.py, line 22-28
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",      # React default
        "http://localhost:5173",      # Vite default
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        # Add your frontend URL here if different
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**After updating, restart the backend server!**

---

### Issue 3: Wrong API URL Configuration

**Symptoms:**
- Frontend tries to connect to wrong URL
- 404 errors for API endpoints
- Backend is running but frontend can't find it

**Solution:**

1. **Check the frontend API URL** in `frontend/src/App.js`:
   ```javascript
   const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
   ```

2. **For development**, the default `http://localhost:8000` should work if:
   - Backend is running on port 8000
   - Both are running on the same machine

3. **If backend is on a different port**, create a `.env` file in the `frontend` directory:
   ```
   REACT_APP_API_URL=http://localhost:8000
   ```

4. **For production**, set the environment variable:
   ```bash
   # Windows PowerShell
   $env:REACT_APP_API_URL="https://your-backend-url.com"
   
   # Mac/Linux
   export REACT_APP_API_URL="https://your-backend-url.com"
   ```

---

### Issue 4: Backend Dependencies Not Installed

**Symptoms:**
- Error when starting backend: "ModuleNotFoundError: No module named 'fastapi'"
- Import errors in backend logs

**Solution:**

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Activate virtual environment:**
   ```bash
   # Windows:
   venv\Scripts\activate
   # Mac/Linux:
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   # Option 1: Use the installation script (recommended)
   python install.py
   
   # Option 2: Install directly
   pip install -r requirements.txt
   ```

---

### Issue 5: Database Issues

**Symptoms:**
- Backend crashes with database errors
- "Table doesn't exist" errors
- SQLAlchemy errors

**Solution:**

1. **Reset the database:**
   ```bash
   cd backend
   python reset_database.py
   ```

2. **Or manually delete and recreate:**
   ```bash
   # Delete the database file
   rm wheeleat.db  # Mac/Linux
   del wheeleat.db  # Windows
   
   # Restart the backend - it will create a new database
   uvicorn main:app --reload --port 8000
   ```

---

### Issue 6: Port Already in Use

**Symptoms:**
- Error: "Address already in use"
- Backend won't start

**Solution:**

1. **Find and kill the process using port 8000:**
   ```bash
   # Windows PowerShell:
   netstat -ano | findstr :8000
   # Note the PID from the output, then:
   taskkill /PID <PID> /F
   
   # Mac/Linux:
   lsof -ti:8000 | xargs kill -9
   ```

2. **Or use a different port:**
   ```bash
   uvicorn main:app --reload --port 8001
   ```
   Then update `API_BASE_URL` in frontend to `http://localhost:8001`

---

## Step-by-Step Troubleshooting Checklist

Follow these steps in order:

### ✅ Step 1: Verify Backend is Running

1. Open a terminal
2. Navigate to `backend` directory
3. Activate virtual environment
4. Run: `uvicorn main:app --reload --port 8000`
5. Open http://localhost:8000 in browser
6. You should see: `{"message":"WheelEat API is running","status":"ok"}`

### ✅ Step 2: Test API Endpoints Directly

Test these URLs in your browser or using curl:

- http://localhost:8000/ → Should return API status
- http://localhost:8000/api/malls → Should return list of malls
- http://localhost:8000/api/categories → Should return categories
- http://localhost:8000/docs → Should show API documentation

If these don't work, the backend has an issue.

### ✅ Step 3: Check Frontend Console

1. Open frontend in browser (usually http://localhost:3000)
2. Open browser Developer Tools (F12)
3. Go to Console tab
4. Look for errors, especially:
   - CORS errors
   - Network errors
   - 404 errors
   - Connection refused errors

### ✅ Step 4: Check Network Tab

1. Open browser Developer Tools (F12)
2. Go to Network tab
3. Refresh the page
4. Look for requests to `/api/malls`, `/api/categories`, etc.
5. Click on failed requests and check:
   - Status code (should be 200)
   - Response tab (should show JSON data)
   - Headers tab (check for CORS headers)

### ✅ Step 5: Verify API URL

1. Check `frontend/src/App.js` line 9:
   ```javascript
   const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
   ```

2. Make sure it matches where your backend is running

### ✅ Step 6: Check Backend Logs

When the backend is running, watch the terminal output. It should show:
- Successful requests with status codes
- Any error messages
- Traceback if there are crashes

---

## Quick Fix Commands

Copy and paste these commands to quickly fix common issues:

### Windows PowerShell:

```powershell
# Navigate to backend
cd backend

# Activate virtual environment
.\venv\Scripts\activate

# Install/update dependencies
python install.py

# Reset database if needed
python reset_database.py

# Start backend
uvicorn main:app --reload --port 8000
```

### Mac/Linux:

```bash
# Navigate to backend
cd backend

# Activate virtual environment
source venv/bin/activate

# Install/update dependencies
python install.py

# Reset database if needed
python reset_database.py

# Start backend
uvicorn main:app --reload --port 8000
```

---

## Still Having Issues?

1. **Check backend logs** - Look for error messages in the terminal where backend is running
2. **Check browser console** - Look for JavaScript errors or network errors
3. **Verify both are running** - Backend on port 8000, Frontend on port 3000 (or check what port it's using)
4. **Try the API directly** - Open http://localhost:8000/api/malls in browser to test backend independently
5. **Check firewall** - Make sure your firewall isn't blocking localhost connections

---

## Fixed Issues in This Update

✅ **Fixed duplicate endpoint** - Removed duplicate `/api/spins/export` definition  
✅ **Updated CORS** - Added more allowed origins (including port 5173 for Vite)  
✅ **Improved error handling** - Better error messages in the code

