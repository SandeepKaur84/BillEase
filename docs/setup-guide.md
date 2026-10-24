# Setup Guide

## Step 1: Install the tools (one time)

1. **JDK 17 or newer**: install [Eclipse Temurin 17](https://adoptium.net/). During setup, tick **"Set JAVA_HOME variable"**. Check it with `java -version`.
2. **Maven: not needed.** The `backend` folder includes the Maven Wrapper (`mvnw.cmd`), which downloads the right Maven version by itself on first use. If you already have Maven, `mvn` works too.
3. **MySQL 8**: make sure the MySQL server is running and you know the `root` password.
   If you installed MySQL from the ZIP or skipped configuration, run **MySQL Configurator** from the Start menu to set it up as a Windows service.
4. **VS Code extensions**: *Extension Pack for Java*, *Spring Boot Extension Pack*, and optionally *Live Server* and *Thunder Client*.

> **Tip:** in VS Code use **File → Open Folder** and open the `BillEase` folder itself, so the Java extension finds the project.

## Step 2: Configure the database

Open `backend/src/main/resources/application.properties` and set your password:

```properties
spring.datasource.username=root
spring.datasource.password=YOUR_MYSQL_PASSWORD
```

The database `billease_db` is created automatically (`createDatabaseIfNotExist=true`). Spring Boot also creates the tables (`ddl-auto=update`). To create them by hand instead, run `database/schema.sql` in MySQL Workbench.

## Step 3: Start the backend

```bash
cd backend
.\mvnw.cmd spring-boot:run
```

(In Command Prompt use `mvnw.cmd spring-boot:run`; on Mac/Linux use `./mvnw spring-boot:run`.)

Or in VS Code, open `backend/src/main/java/com/billease/BillEaseApplication.java` and click **Run** above `main()`.

Wait for `Started BillEaseApplication`. On the first run, 8 sample products are added automatically.

## Step 4: Open the frontend (choose one)

- **Option A (easiest):** open **http://localhost:8080**. The backend also serves the `frontend/` folder, so nothing else needs to run.
- **Option B (separate frontend server):** right-click `frontend/index.html` → **Open with Live Server**. It opens at `http://127.0.0.1:5500` (the home page) and calls the backend at `http://localhost:8080/api`. Saving a frontend file reloads the browser instantly.

The backend must be running for either option.

## Step 5: Try it

1. **Sign up:** on the home page click **Sign up**, enter your name, email and a password (6+ characters). You land on the dashboard. Next time use **Log in**.
2. **Products:** add a product, edit it, search for it.
3. **Billing:** click a few products, change the quantities, then click **Generate Bill**.
4. **Invoice:** check the invoice, then click **Print Invoice**.
5. **Stock** and **Dashboard:** confirm that stock went down and the sale appears.
