# Retreat Meal Manager

A web application designed to manage meal planning and preparation for group retreats. Organize menus, track ingredients, manage attendee groups, and generate shopping lists and preparation instructions based on actual attendance and dietary needs.

## Features

- **Session Management** - Create and manage retreat sessions with customizable date ranges
- **Group Management** - Add multiple groups to a session with arrival/departure dates and attendee counts (adults, youth, kids)
- **Menu Management** - Create reusable menus composed of menu items
- **Ingredient Management** - Define ingredients with age-specific portion sizes (adult, youth, kid portions)
- **Meal Period Assignment** - Assign menus to specific meal periods (breakfast, lunch, dinner) for each day
- **Automatic Headcount Calculation** - Dynamically calculate attendee numbers for each day based on group arrival/departure dates
- **Prep List Generation** - Auto-generate preparation lists showing ingredients needed for each day based on actual attendance
- **Purchase List Generation** - Create shopping lists aggregating ingredients across the entire session with correct quantities
- **User Authentication** - Basic user registration and login system with role-based access
- **Persistent Storage** - SQLite database for reliable data persistence

## Technology Stack

### Backend
- **Java 21**
- **Spring Boot 4.0.0**
  - Spring Web (MVC)
  - Spring Data JPA
  - Spring Boot Actuator
  - Spring Validation
  - Spring DevTools
- **SQLite** with Hibernate Community Dialect
- **Lombok** for code generation
- **Maven** for build management

### Frontend
- **Thymeleaf** template engine
- **Responsive CSS** with mobile support
- **Vanilla JavaScript**

## Prerequisites

Before running the application, ensure you have the following installed:

- **Java Development Kit (JDK) 21 or higher**
  - Download from [Oracle](https://www.oracle.com/java/technologies/downloads/) or [OpenJDK](https://openjdk.org/)
  - Verify installation: `java -version`

**Note:** Maven is NOT required to be installed separately - the project includes the Maven Wrapper (`mvnw`).

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd retreat-meal-manager
```

### 2. Build the Application

Using the included Maven Wrapper (recommended):

```bash
# On macOS/Linux
./mvnw clean package

# On Windows
mvnw.cmd clean package
```

Alternatively, if you have Maven installed:

```bash
mvn clean package
```

### 3. Create the Database Directory

Before running the application for the first time, create the `data/` directory:

```bash
# On macOS/Linux
mkdir data

# On Windows
mkdir data
```

**Note:** This step is required for SQLite to create the database file. The directory should be created in the project root.

### 4. Run the Application

There are three ways to run the application:

**Option 1: Using Maven Wrapper (recommended for development)**

```bash
# On macOS/Linux
./mvnw spring-boot:run

# On Windows
mvnw.cmd spring-boot:run
```

**Option 2: Using Maven**

```bash
mvn spring-boot:run
```

**Option 3: Run the JAR file directly**

```bash
java -jar target/retreat-meal-manager-0.0.1-SNAPSHOT.jar
```

### 5. Access the Application

Once the application starts successfully, open your web browser and navigate to:

```
http://localhost:8080
```

The application will be running on port 8080 by default.

## Database

The application uses SQLite as its database:

- **Database Location:** `./data/retreatdb.sqlite` (relative to project root)
- **Auto-Creation:** The database and schema are created automatically on first run
- **Persistence:** Data persists between application restarts
- **No Setup Required:** SQLite is file-based and requires no separate database server

The `data/` directory is automatically created when you first run the application.

## Development

### Hot Reload

The application includes Spring Boot DevTools for automatic restart during development:

1. Run the application using `./mvnw spring-boot:run`
2. Make changes to your source code
3. The application will automatically restart with your changes

### Project Structure

```
retreat-meal-manager/
├── src/main/java/com/cpsc464/retreat_meal_manager/
│   ├── RetreatMealManagerApplication.java  # Application entry point
│   ├── application/                         # Business logic layer
│   ├── domain/                              # Domain entities and models
│   ├── infrastructure/                      # Data persistence layer
│   └── presentation/                        # Web controllers and REST API
├── src/main/resources/
│   ├── application.properties               # Configuration
│   ├── templates/                           # Thymeleaf HTML templates
│   └── static/                              # CSS and JavaScript files
├── archdocs/                                # Architecture documentation
├── pom.xml                                  # Maven configuration
└── mvnw, mvnw.cmd                          # Maven Wrapper scripts
```

### Configuration

The application configuration is located in `src/main/resources/application.properties`. Key settings include:

- **Server Port:** 8080 (default)
- **Database URL:** `jdbc:sqlite:./data/retreatdb.sqlite`
- **Hibernate DDL:** `update` (auto-updates schema)
- **SQL Logging:** Enabled for development

## Architecture

The application follows a **Clean Layered Architecture** pattern:

1. **Presentation Layer** - Web controllers (Thymeleaf-based UI) and REST API
2. **Application Layer** - Business logic and service orchestration
3. **Domain Layer** - Core business entities and domain services
4. **Infrastructure Layer** - Data persistence with Spring Data JPA

For more details, see the architecture documentation in `archdocs/Logical View.docx`.

## Troubleshooting

### Port Already in Use

If port 8080 is already in use, you can change it by adding this to `application.properties`:

```properties
server.port=8081
```

### Java Version Issues

Ensure you're using Java 21 or higher:

```bash
java -version
```

If you have multiple Java versions installed, set `JAVA_HOME` to point to JDK 21+.

### Build Failures

If you encounter build issues, try cleaning and rebuilding:

```bash
./mvnw clean install
```

### Database Issues

If you experience database problems, you can delete the database file and let it be recreated:

```bash
rm -rf data/
./mvnw spring-boot:run
```

## License

This project was created as a demo for Software Architecture (CPSC464).

## Contributing

This is a demonstration project. For questions or issues, please contact the project maintainers.
