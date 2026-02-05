# Alpine Ministries Event Meal Planner

A web-based meal planning and purchasing system for Alpine Ministries. Manages event meal plans, group reservations, menu catalogs, kitchen prep tracking, and purchase list generation.

## Tech Stack

- **Java 21** / **Spring Boot 4.0.0**
- **SQLite** (via sqlite-jdbc, embedded — no separate install needed)
- **Hibernate JPA** with Spring Data
- **Thymeleaf** server-side templates
- **Maven** (wrapper included, no install needed)

## Prerequisites

- **Java 21** — the only thing you need to install

  Verify with:
  ```bash
  java -version
  ```

  If you don't have Java 21, install it via:
  - macOS: `brew install openjdk@21`
  - Windows: Download from [Adoptium](https://adoptium.net/)
  - Linux: `sudo apt install openjdk-21-jdk` (Debian/Ubuntu)

> **Note on SQLite:** You do **not** need to install SQLite separately. The JDBC driver included in the project embeds the SQLite engine. The database file (`data/eventdb.sqlite`) is created automatically on first run.

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Alpine-Ministries-Event-Meal-Planner
   ```

2. **Run the application**
   ```bash
   ./mvnw spring-boot:run
   ```
   On Windows:
   ```bash
   mvnw.cmd spring-boot:run
   ```

3. **Open in your browser**
   ```
   http://localhost:8080
   ```

That's it. Maven downloads dependencies automatically, and the database is created on startup.

## Database

The SQLite database lives at `data/eventdb.sqlite`. Hibernate manages the schema automatically (`ddl-auto=update`), so tables are created and updated based on the JPA entity definitions when the application starts.

- The `data/` directory is included in the repo but the `.sqlite` file is gitignored, so each developer gets their own local database.
- To reset your database, stop the app and delete `data/eventdb.sqlite`. A fresh one will be created on next startup.

## Building

Build an executable JAR:
```bash
./mvnw clean package
```

Run the built JAR:
```bash
java -jar target/event-meal-plannerv2-0.0.1-SNAPSHOT.jar
```

## Running Tests

```bash
./mvnw test
```

Tests use an H2 in-memory database, so they don't affect your local SQLite data.

## Project Structure

```
src/main/java/com/event_meal_manager/
├── presentation/     # REST and web controllers
├── application/      # Service / business logic layer
├── domain/           # Entities, value objects, domain services
└── infrastructure/   # JPA repositories

src/main/resources/
├── application.properties
├── templates/        # Thymeleaf HTML templates
└── static/           # CSS and JavaScript
```

Organized into domain modules: **catalog** (menus, items, ingredients), **planning** (meal plans, event days), **reservation** (groups, attendance), **purchasing** (purchase lists), and **dashboard**.

## Configuration

All configuration is in `src/main/resources/application.properties`. Key settings:

| Property | Default | Description |
|----------|---------|-------------|
| `spring.datasource.url` | `jdbc:sqlite:./data/eventdb.sqlite` | Database file path |
| `spring.jpa.hibernate.ddl-auto` | `update` | Auto-manage schema from entities |
| `server.port` | `8080` | HTTP port (Spring Boot default) |
