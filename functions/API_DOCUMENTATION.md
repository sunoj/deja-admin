# API Documentation

This document provides a comprehensive overview of all API endpoints available in the Deja application.

## Base URL

All API endpoints are prefixed with `/api/`.

## Authentication

Most endpoints require authentication through the middleware. Image requests are exempt from authentication requirements.

## Common Response Headers

All API responses include the following headers:
- `Content-Type: application/json`
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Headers: Content-Type, Authorization`

## API Endpoints

### Authentication

#### Login
- **Endpoint**: `/api/auth/login`
- **Method**: POST
- **Description**: Authenticates a user and returns a JWT token
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password"
  }
  ```
- **Response**: 
  ```json
  {
    "token": "jwt-token",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "User Name"
    }
  }
  ```

#### Logout
- **Endpoint**: `/api/auth/logout`
- **Method**: POST
- **Description**: Invalidates the current user's session
- **Headers**:
  - `Authorization: Bearer <token>`
- **Response**: 
  ```json
  {
    "message": "Successfully logged out"
  }
  ```

### Work Orders

#### List Work Orders
- **Endpoint**: `/api/work-orders`
- **Method**: GET
- **Description**: Retrieves a paginated list of all work orders
- **Query Parameters**:
  - `page` (optional): Page number for pagination (default: 1)
  - `limit` (optional): Number of records per page (default: 20)
  - `status` (optional): Filter by work order status
- **Response**: Array of work order objects with pagination metadata
  ```json
  {
    "work_orders": [
      {
        "id": "uuid",
        "title": "Work Order Title",
        "description": "Work Order Description",
        "status": "pending",
        "created_at": "timestamp",
        "updated_at": "timestamp"
      }
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 10,
      "pages": 5
    }
  }
  ```

#### Create Work Order
- **Endpoint**: `/api/work-orders/create`
- **Method**: POST
- **Description**: Creates a new work order
- **Request Body**:
  ```json
  {
    "title": "Work Order Title",
    "description": "Work Order Description",
    "priority": "high",
    "assignee_id": "uuid"
  }
  ```
- **Response**: Created work order object
  ```json
  {
    "id": "uuid",
    "title": "Work Order Title",
    "description": "Work Order Description",
    "status": "pending",
    "created_at": "timestamp"
  }
  ```

#### Get Work Order by ID
- **Endpoint**: `/api/work-orders/{id}`
- **Method**: GET
- **Description**: Retrieves details of a specific work order
- **Response**: Work order object with full details
  ```json
  {
    "id": "uuid",
    "title": "Work Order Title",
    "description": "Work Order Description",
    "status": "pending",
    "priority": "high",
    "assignee": {
      "id": "uuid",
      "name": "Assignee Name"
    },
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
  ```

### General

#### Hello World
- **Endpoint**: `/api/hello`
- **Method**: GET
- **Description**: Simple test endpoint that returns a hello world message
- **Response**: 
  ```json
  {
    "message": "Hello, World!"
  }
  ```

### Workflows

#### List Workflows
- **Endpoint**: `/api/workflows`
- **Method**: GET
- **Description**: Retrieves a list of all workflows
- **Response**: Array of workflow objects
  ```json
  [
    {
      "id": "uuid",
      "name": "Workflow Name",
      "description": "Workflow Description",
      "image_url": "https://example.com/image.jpg",
      "category_id": "uuid",
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
  ]
  ```

#### Start Workflow
- **Endpoint**: `/api/workflows/{id}/start`
- **Method**: POST
- **Description**: Starts a new workflow instance for an employee
- **Request Body**:
  ```json
  {
    "employee_id": "uuid"
  }
  ```
- **Response**: The created record object
  ```json
  {
    "id": "uuid",
    "workflow_id": "uuid",
    "employee_id": "uuid",
    "status": "in_progress",
    "created_at": "timestamp"
  }
  ```

#### Get Workflow Checklist
- **Endpoint**: `/api/workflows/{id}/checklist`
- **Method**: GET
- **Description**: Retrieves the checklist items for a specific workflow
- **Response**: Array of checklist items
  ```json
  [
    {
      "id": "uuid",
      "workflow_id": "uuid",
      "title": "Step Title",
      "description": "Step Description",
      "order": 1
    }
  ]
  ```

### Records

#### List All Records
- **Endpoint**: `/api/records`
- **Method**: GET
- **Description**: Retrieves a paginated list of all records
- **Query Parameters**:
  - `page` (optional): Page number for pagination (default: 1)
  - `limit` (optional): Number of records per page (default: 20)
  - `status` (optional): Filter by record status (e.g., 'in_progress', 'completed')
- **Response**: Array of record objects with pagination metadata
  ```json
  {
    "records": [
      {
        "id": "uuid",
        "workflow_id": "uuid",
        "employee_id": "uuid",
        "status": "in_progress",
        "created_at": "timestamp"
      }
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 10,
      "pages": 5
    }
  }
  ```

#### Get Record by ID
- **Endpoint**: `/api/records/{id}`
- **Method**: GET
- **Description**: Retrieves details of a specific record
- **Response**: Record object with workflow details
  ```json
  {
    "id": "uuid",
    "workflow_id": "uuid",
    "employee_id": "uuid",
    "status": "in_progress",
    "created_at": "timestamp",
    "workflow": {
      "id": "uuid",
      "name": "Workflow Name",
      "description": "Workflow Description"
    }
  }
  ```

#### List Records by Workflow
- **Endpoint**: `/api/records/workflow/{workflow_id}`
- **Method**: GET
- **Description**: Retrieves all records for a specific workflow
- **Response**: Array of record objects

#### List Records by Employee
- **Endpoint**: `/api/records/employee/{employee_id}`
- **Method**: GET
- **Description**: Retrieves all records for a specific employee
- **Response**: Array of record objects

#### Update Record Checklist Item
- **Endpoint**: `/api/records/{id}/checklist/{itemId}`
- **Method**: PATCH
- **Description**: Updates the status of a specific checklist item in a record
- **Request Body**:
  ```json
  {
    "completed": true,
    "value": "Response value",
    "image_url": "https://example.com/image.jpg"
  }
  ```
- **Response**: Updated checklist item
  ```json
  {
    "id": "uuid",
    "record_id": "uuid",
    "checklist_item_id": "uuid",
    "completed": true,
    "value": "Response value",
    "image_url": "https://example.com/image.jpg",
    "updated_at": "timestamp"
  }
  ```

#### Submit Response for Record
- **Endpoint**: `/api/records/{id}/response`
- **Method**: POST
- **Description**: Submits a response for a specific checklist item in a record
- **Request Body**:
  ```json
  {
    "checklist_item_id": "uuid",
    "completed": true,
    "value": "Response value",
    "image_url": "https://example.com/image.jpg"
  }
  ```
- **Response**: Updated record response
  ```json
  {
    "id": "uuid",
    "record_id": "uuid",
    "checklist_item_id": "uuid",
    "completed": true,
    "value": "Response value",
    "image_url": "https://example.com/image.jpg",
    "updated_at": "timestamp"
  }
  ```

#### Complete Record
- **Endpoint**: `/api/records/{id}/complete`
- **Method**: POST
- **Description**: Marks a record as completed
- **Request Body**:
  ```json
  {
    "notes": "Completion notes"
  }
  ```
- **Response**: Completed record
  ```json
  {
    "id": "uuid",
    "workflow_id": "uuid",
    "employee_id": "uuid",
    "status": "completed",
    "notes": "Completion notes",
    "completed_at": "timestamp"
  }
  ```

### Images

#### List Images
- **Endpoint**: `/api/images`
- **Method**: GET
- **Description**: Lists all images in the storage bucket
- **Query Parameters**:
  - `limit` (optional): Maximum number of images to return (default: 50)
  - `cursor` (optional): Pagination cursor for fetching next set of results
- **Response**:
  ```json
  {
    "images": [
      {
        "name": "image.jpg",
        "url": "https://r2.nothingtodo.me/image.jpg",
        "size": 12345,
        "uploaded": "timestamp"
      }
    ],
    "truncated": true,
    "cursor": "next-page-cursor"
  }
  ```

#### Upload Image
- **Endpoint**: `/api/images/upload`
- **Method**: POST
- **Description**: Uploads a new image to the storage bucket
- **Request**: Form data with file
- **Response**: Object with uploaded image details
  ```json
  {
    "success": true,
    "key": "image.jpg",
    "url": "https://r2.nothingtodo.me/image.jpg"
  }
  ```

#### Get Image by ID
- **Endpoint**: `/api/images/{id}`
- **Method**: GET
- **Description**: Retrieves a specific image by ID
- **Response**: Image file with appropriate content type

### Employees

#### List Employees
- **Endpoint**: `/api/employees`
- **Method**: GET
- **Description**: Retrieves a paginated list of all employees
- **Query Parameters**:
  - `page` (optional): Page number for pagination (default: 1)
  - `limit` (optional): Number of employees per page (default: 20)
- **Response**: Array of employee objects with pagination metadata
  ```json
  {
    "employees": [
      {
        "id": "uuid",
        "name": "Employee Name",
        "created_at": "timestamp",
        "updated_at": "timestamp"
      }
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 10,
      "pages": 5
    }
  }
  ```

#### Get Employee by ID
- **Endpoint**: `/api/employees/{id}`
- **Method**: GET
- **Description**: Retrieves details of a specific employee
- **Response**: Employee object
  ```json
  {
    "id": "uuid",
    "name": "Employee Name",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
  ```

#### Create Employee
- **Endpoint**: `/api/employees/create`
- **Method**: POST
- **Description**: Creates a new employee
- **Request Body**:
  ```json
  {
    "name": "Employee Name"
  }
  ```
- **Response**: Created employee object
  ```json
  {
    "id": "uuid",
    "name": "Employee Name",
    "created_at": "timestamp"
  }
  ```

#### Recover Employee
- **Endpoint**: `/api/employees/recover`
- **Method**: POST
- **Description**: Recovers an employee account using a token
- **Request Body**:
  ```json
  {
    "token": "recovery-token"
  }
  ```
- **Response**: Employee details with authentication token
  ```json
  {
    "employee": {
      "id": "uuid",
      "name": "Employee Name"
    },
    "token": "auth-token"
  }
  ```

### Check-ins

#### Record Check-in
- **Endpoint**: `/api/checkins/record`
- **Method**: POST
- **Description**: Records a new check-in for an employee
- **Request Body**:
  ```json
  {
    "employee_id": "uuid",
    "type": "check_in",
    "location": {
      "latitude": 37.7749,
      "longitude": -122.4194
    },
    "notes": "Optional check-in notes"
  }
  ```
- **Response**: Created check-in record
  ```json
  {
    "id": "uuid",
    "employee_id": "uuid",
    "type": "check_in",
    "location": {
      "latitude": 37.7749,
      "longitude": -122.4194
    },
    "notes": "Optional check-in notes",
    "created_at": "timestamp"
  }
  ```

#### Get Check-in History
- **Endpoint**: `/api/checkins/history`
- **Method**: GET
- **Description**: Retrieves check-in history for an employee
- **Query Parameters**:
  - `employee_id` (required): ID of the employee
  - `start_date` (optional): Start date for filtering (ISO format)
  - `end_date` (optional): End date for filtering (ISO format)
  - `type` (optional): Filter by check-in type (check_in/check_out)
- **Response**: Array of check-in records
  ```json
  {
    "checkins": [
      {
        "id": "uuid",
        "employee_id": "uuid",
        "type": "check_in",
        "location": {
          "latitude": 37.7749,
          "longitude": -122.4194
        },
        "notes": "Optional check-in notes",
        "created_at": "timestamp"
      }
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 10,
      "pages": 5
    }
  }
  ```

#### Get All Check-ins
- **Endpoint**: `/api/checkins/all`
- **Method**: GET
- **Description**: Retrieves all check-ins across all employees
- **Query Parameters**:
  - `page` (optional): Page number for pagination (default: 1)
  - `limit` (optional): Number of records per page (default: 20)
  - `start_date` (optional): Start date for filtering (ISO format)
  - `end_date` (optional): End date for filtering (ISO format)
  - `type` (optional): Filter by check-in type (check_in/check_out)
- **Response**: Array of check-in records with employee details
  ```json
  {
    "checkins": [
      {
        "id": "uuid",
        "employee_id": "uuid",
        "employee_name": "Employee Name",
        "type": "check_in",
        "location": {
          "latitude": 37.7749,
          "longitude": -122.4194
        },
        "notes": "Optional check-in notes",
        "created_at": "timestamp"
      }
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 10,
      "pages": 5
    }
  }
  ```

## Error Responses

All API endpoints return standardized error responses:

```json
{
  "error": "Error message",
  "details": "Detailed error information (optional)"
}
```

Common HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 405: Method Not Allowed
- 409: Conflict
- 422: Unprocessable Entity
- 500: Internal Server Error

## Rate Limiting

API requests are limited to:
- 100 requests per minute per IP address
- 1000 requests per hour per user

## Notes

- All date/time values are returned in ISO 8601 format
- All IDs are UUIDs
- Pagination is supported on list endpoints using cursor-based pagination
- Authentication tokens should be included in the Authorization header as `Bearer <token>`
- File uploads are limited to 10MB per file
- Image uploads support JPG, PNG, and GIF formats 