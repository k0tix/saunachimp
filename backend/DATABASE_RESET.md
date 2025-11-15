# Easy Ways to Rerun init.sql

## Method 1: Using the API (Recommended - Works on All Platforms)

Simply call the database reset endpoint:

```bash
curl -X POST http://localhost:3000/api/database/reset
```

This will:
- Read the `init.sql` file
- Execute all SQL statements in order
- Return a success message with the number of statements executed

**Response:**
```json
{
  "success": true,
  "message": "Database reinitialized successfully",
  "statementsExecuted": 5
}
```

## Method 2: Using Docker Exec

Run the init.sql directly in the MySQL container:

### Windows PowerShell
```powershell
Get-Content init.sql | docker exec -i backend_mysql mysql -uroot -prootpassword apidb
```

### Linux/Mac
```bash
docker exec -i backend_mysql mysql -uroot -prootpassword apidb < init.sql
```

## Method 3: Full Database Reset

If you want to completely drop and recreate the database:

### Windows PowerShell
```powershell
# Drop and recreate database
docker exec backend_mysql mysql -uroot -prootpassword -e "DROP DATABASE IF EXISTS apidb; CREATE DATABASE apidb;"

# Then run init.sql
Get-Content init.sql | docker exec -i backend_mysql mysql -uroot -prootpassword apidb
```

### Linux/Mac
```bash
# Drop and recreate database
docker exec backend_mysql mysql -uroot -prootpassword -e "DROP DATABASE IF EXISTS apidb; CREATE DATABASE apidb;"

# Then run init.sql
docker exec -i backend_mysql mysql -uroot -prootpassword apidb < init.sql
```

## Method 4: NPM Script (Redirects to API)

```bash
npm run db:reset
```

This will display the recommended API curl command for cross-platform compatibility.

## When to Use Each Method

- **API Method (Recommended)**: Best for all platforms, works while the API is running, no password needed
- **Docker Exec**: When you need to run init.sql after making changes to the file
- **Full Reset**: When you want a completely fresh database (removes all data)

## Notes

- The API method is recommended because it works on all platforms (Windows, Mac, Linux)
- The API method executes statements in the same order as they appear in `init.sql`
- Make sure your Docker containers are running before using these commands
- The root password (`rootpassword`) is defined in your `.env` file as `DB_ROOT_PASSWORD`
- Replace `rootpassword` in the commands above if you've changed it in your `.env` file

