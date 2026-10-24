# Troubleshooting

| Error | Cause | Fix |
|---|---|---|
| `Access denied for user 'root'@'localhost'` | Wrong MySQL password | Fix `spring.datasource.password` in `application.properties` |
| `Communications link failure` | MySQL isn't running | Start the MySQL service (`services.msc` → MySQL84 → Start) |
| `Port 8080 was already in use` | The app is already running, or another program uses the port | Stop the other one, or set `server.port=8081` |
| `'mvn' is not recognized` | Maven isn't installed | Use the wrapper instead: `.\mvnw.cmd spring-boot:run` |
| `JAVA_HOME not found` / `release version 17 not supported` | JDK missing or too old | Install JDK 17+ with "Set JAVA_HOME" ticked, then reopen the terminal |
| `mvnw.cmd not recognized` / `No plugin found for prefix 'spring-boot'` | Command run from the wrong folder | Run it inside `BillEase/backend` |
| VS Code: "file is not on the classpath" | VS Code opened the wrong folder or remembers an old layout | Open the `BillEase` folder, then Command Palette → **Java: Clean Java Language Server Workspace** → Restart |
| Page loads but tables are empty | Backend error, or the backend isn't running | Start the backend; check the red alert on the page and the terminal logs |
| `Failed to fetch` / CORS error in the browser console | Backend not running, or the frontend calls the wrong address | Start the backend; check `API_BASE` in `frontend/assets/js/core/api.js` |
| Pages show 404 at `localhost:8080` | Backend can't find the `frontend` folder | Start it from `BillEase/backend` (or `BillEase`) so `../frontend` or `frontend` exists |
| Icons or dashboard charts missing | No internet (Bootstrap Icons and Chart.js load from a CDN) | Connect to the internet |
