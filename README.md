# API Documentation

Piano Progression is a platform designed to support piano learning, particularly for users aiming to achieve ABRSM (Associated Board of the Royal Schools of Music) certification, assisting them on their journey to mastering the piano from Grade 1 to Grade 8.

## Table of Contents
- [Endpoints Table](#endpoints-table)
- [Detailed Endpoints](#detailed-endpoints)
  - [Tasks](#tasks)
  - [Schedules](#schedules)
  - [Flashcards](#flashcards)
  - [Protected Services](#protected-services)

---

## Deployment Instructions

## Running the Application Locally

### Frontend
To start the frontend, run the following command:
```bash
npm run dev
```

### Backend
To start the backend, run the following command:
```bash
npm run start
```

---

## Using Docker

### Build the Backend Docker Image
To create a Docker image for the backend, use the following command:
```bash
docker build . -t motoran
```

### Run with Docker Compose
To start the application using Docker Compose, use the following command:
```bash
docker-compose up
```

---

## Notes

- Ensure all dependencies are installed before running the commands:
  ```bash
  npm install
  ```

- Adjust the `docker-compose.yml` file as necessary for your environment (e.g., updating ports, environment variables, or volumes).

- For production, consider setting environment variables or a `.env` file for secure configuration.

---

## Endpoints Table

| Method | Endpoint                                | Description                                   |
|--------|----------------------------------------|-----------------------------------------------|
| PATCH  | `/tasks/:idAccount`                    | Update an existing task for an account       |
| DELETE | `/tasks/:idTask/:idAccount`            | Delete a task from an account                |
| PUT    | `/tasks/:idTask/:idAccount/status`     | Update the status of a specific task         |
| POST   | `/schedule/generate/:idAccount`        | Generate a schedule for an account           |
| GET    | `/schedule/:idAccount`                | Retrieve the schedule for an account         |
| DELETE | `/schedule/:idAccount`                | Delete the schedule for an account           |
| PATCH  | `/schedule/:idSchedule/:idAccount/update` | Update a schedule for an account             |
| POST   | `/flashcard/:idAccount`               | Create a flashcard for an account            |
| GET    | `/flashcard/:idAccount`               | Retrieve flashcards for an account           |
| DELETE | `/flashcard/:idFlashcard/:idAccount`  | Delete a flashcard from an account           |
| POST   | `/protected/signup`                   | Signup for a protected service               |
| POST   | `/protected/add`                      | Add a new protected service                  |

---

## Detailed Endpoints

### POST `/register`
- **Description**: Register a new user.
- **Request Body**:
  ```json
  {
      "name": "string",
      "email": "string",
      "password": "string"
  }
  ```
- **Success Response (200)**:
  ```json
  {
      "status": "success",
      "message": "User registered successfully"
  }
  ```
- **Error Response (400)**:
  ```json
  {
      "status": "error",
      "message": "Invalid input"
  }
  ```
- **URL**: `http://localhost:8080/register`

### POST `/login`
- **Description**: Login for an existing user.
- **Request Body**:
  ```json
  {
      "email": "string",
      "password": "string"
  }
  ```
- **Success Response (200)**:
  ```json
  {
      "status": "success",
      "message": "Login successful",
      "token": "string"
  }
  ```
- **Error Response (401)**:
  ```json
  {
      "status": "error",
      "message": "Invalid credentials"
  }
  ```
- **URL**: `http://localhost:8080/login`

### GET `/login/verify`
- **Description**: Verify the user login.
- **Success Response (200)**:
  ```json
  {
      "status": "success",
      "message": "Token is valid"
  }
  ```
- **Error Response (401)**:
  ```json
  {
      "status": "error",
      "message": "Token is invalid"
  }
  ```
- **URL**: `http://localhost:8080/login/verify`

### POST `/logout`
- **Description**: Logout the current user.
- **Success Response (200)**:
  ```json
  {
      "status": "success",
      "message": "Logged out successfully"
  }
  ```
- **Error Response (400)**:
  ```json
  {
      "status": "error",
      "message": "Logout failed"
  }
  ```
- **URL**: `http://localhost:8080/logout`

### Tasks

### GET `/tasks/:idAccount`
- **Description**: Retrieve tasks for a specific account.
- **Success Response (200)**:
  ```json
  {
      "status": "success",
      "tasks": [
          {
              "id": "string",
              "title": "string",
              "status": "string",
              "notes": "string"
          }
      ]
  }
  ```
- **Error Response (404)**:
  ```json
  {
      "status": "error",
      "message": "Tasks not found"
  }
  ```
- **URL**: `http://localhost:8080/tasks/:idAccount`

### POST `/tasks/:idAccount`
- **Description**: Add a new task to an account.
- **Request Body**:
  ```json
  {
      "title": "string",
      "status": "string",
      "notes": "string"
  }
  ```
- **Success Response (201)**:
  ```json
  {
      "status": "success",
      "message": "Task created successfully"
  }
  ```
- **Error Response (400)**:
  ```json
  {
      "status": "error",
      "message": "Invalid input"
  }
  ```
- **URL**: `http://localhost:8080/tasks/:idAccount`

#### PATCH `/tasks/:idAccount`
- **Description**: Update an existing task for an account.
- **Request Body**:
  ```json
  {
    "title": "string",
    "status": "string",
    "notes": "string"
  }
  ```
- **Success Response (200)**:
  ```json
  {
    "status": "success",
    "message": "Task updated successfully"
  }
  ```
- **Error Response (404)**:
  ```json
  {
    "status": "error",
    "message": "Task not found"
  }
  ```
- **URL**: `http://localhost:8080/tasks/:idAccount`

#### DELETE `/tasks/:idTask/:idAccount`
- **Description**: Delete a task from an account.
- **Success Response (200)**:
  ```json
  {
    "status": "success",
    "message": "Task deleted successfully"
  }
  ```
- **Error Response (404)**:
  ```json
  {
    "status": "error",
    "message": "Task not found"
  }
  ```
- **URL**: `http://localhost:8080/tasks/:idTask/:idAccount`

#### PUT `/tasks/:idTask/:idAccount/status`
- **Description**: Update the status of a specific task.
- **Request Body**:
  ```json
  {
    "status": "string"
  }
  ```
- **Success Response (200)**:
  ```json
  {
    "status": "success",
    "message": "Task status updated successfully"
  }
  ```
- **Error Response (404)**:
  ```json
  {
    "status": "error",
    "message": "Task not found"
  }
  ```
- **URL**: `http://localhost:8080/tasks/:idTask/:idAccount/status`

---

### Schedules

#### POST `/schedule/generate/:idAccount`
- **Description**: Generate a schedule for an account.
- **Success Response (201)**:
  ```json
  {
    "status": "success",
    "message": "Schedule generated successfully",
    "data": [
      {
        "taskId": "string",
        "date": "string"
      }
    ]
  }
  ```
- **Error Response (400)**:
  ```json
  {
    "status": "error",
    "message": "No tasks available for scheduling"
  }
  ```
- **URL**: `http://localhost:8080/schedule/generate/:idAccount`

#### GET `/schedule/:idAccount`
- **Description**: Retrieve the schedule for an account.
- **Success Response (200)**:
  ```json
  {
    "status": "success",
    "message": "Schedules fetched successfully",
    "data": [
      {
        "taskId": "string",
        "date": "string"
      }
    ]
  }
  ```
- **Error Response (404)**:
  ```json
  {
    "status": "error",
    "message": "Schedules not found"
  }
  ```
- **URL**: `http://localhost:8080/schedule/:idAccount`

#### DELETE `/schedule/:idAccount`
- **Description**: Delete the schedule for an account.
- **Success Response (200)**:
  ```json
  {
    "status": "success",
    "message": "All schedules deleted successfully"
  }
  ```
- **Error Response (404)**:
  ```json
  {
    "status": "error",
    "message": "Schedules not found"
  }
  ```
- **URL**: `http://localhost:8080/schedule/:idAccount`

#### PATCH `/schedule/:idSchedule/:idAccount/update`
- **Description**: Update a schedule for an account.
- **Request Body**:
  ```json
  {
    "date": "2025-01-15T10:00:00.000Z",
    "notes": "Updated schedule notes"
  }
  ```
- **Success Response (200)**:
  ```json
  {
    "status": "success",
    "message": "Schedule updated successfully",
    "data": {}
  }
  ```
- **Error Response (404)**:
  ```json
  {
    "status": "error",
    "message": "Schedule not found"
  }
  ```
- **URL**: `http://localhost:8080/schedule/:idSchedule/:idAccount/update`

---

### Flashcards

#### POST `/flashcard/:idAccount`
- **Description**: Create a flashcard for an account.
- **Request Body**:
  ```json
  {
    "title": "string",
    "description": "string"
  }
  ```
- **Success Response (201)**:
  ```json
  {
    "status": "success",
    "message": "Flashcard created successfully"
  }
  ```
- **Error Response (400)**:
  ```json
  {
    "status": "error",
    "message": "Invalid input"
  }
  ```
- **URL**: `http://localhost:8080/flashcard/:idAccount`

#### GET `/flashcard/:idAccount`
- **Description**: Retrieve flashcards for an account.
- **Success Response (200)**:
  ```json
  {
    "status": "success",
    "message": "Flashcards retrieved successfully",
    "data": [
      {
        "id": "string",
        "title": "string",
        "description": "string"
      }
    ]
  }
  ```
- **Error Response (404)**:
  ```json
  {
    "status": "error",
    "message": "No flashcards found"
  }
  ```
- **URL**: `http://localhost:8080/flashcard/:idAccount`

#### DELETE `/flashcard/:idFlashcard/:idAccount`
- **Description**: Delete a flashcard from an account.
- **Success Response (200)**:
  ```json
  {
    "status": "success",
    "message": "Flashcard deleted successfully"
  }
  ```
- **Error Response (404)**:
  ```json
  {
    "status": "error",
    "message": "Flashcard not found"
  }
  ```
- **URL**: `http://localhost:8080/flashcard/:idFlashcard/:idAccount`

---

### Protected Services

#### POST `/protected/signup`
- **Description**: Signup for a protected service.
- **Request Body**:
  ```json
  {
    "name": "string",
    "email": "string",
    "password": "string"
  }
  ```
- **Success Response (201)**:
  ```json
  {
    "status": "success",
    "message": "Signup successful"
  }
  ```
- **Error Response (400)**:
  ```json
  {
    "status": "error",
    "message": "Signup failed"
  }
  ```
- **URL**: `http://localhost:8080/protected/signup`

#### POST `/protected/add`
- **Description**: Add a new protected service.
- **Request Body**:
  ```json
  {
    "serviceName": "string",
    "details": "string"
  }
  ```
- **Success Response (201)**:
  ```json
  {
    "status": "success",
    "message": "Protected service added successfully"
  }
  ```
- **Error Response (400)**:
  ```json
  {
    "status": "error",
    "message": "Invalid input"
  }
  ```
- **URL**: `http://localhost:8080/protected/add`

---

© 2025 PianoProgressionTST API Documentation