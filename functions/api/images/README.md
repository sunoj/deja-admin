# SOP Images API

This directory contains the API endpoints for handling SOP (Standard Operating Procedure) related images.

## Endpoints

### GET /api/images

Lists all images in the system with pagination support.

Query parameters:
- `limit` (optional): Maximum number of images to return (default: 50)
- `cursor` (optional): Pagination cursor for fetching the next set of results

Response format:
```json
{
  "images": [
    {
      "name": "image_filename.jpg",
      "url": "https://example.com/api/images/image_filename.jpg",
      "size": 123456,
      "uploaded": "2023-03-01T12:00:00.000Z"
    }
  ],
  "truncated": true,
  "cursor": "cursor_for_next_page"
}
```

### GET /api/images/[id]

Serves an individual image by ID.

Response:
- Image file with appropriate Content-Type header
- 404 if image is not found

### POST /api/images/upload

Uploads a new image to the system.

Request:
- Content-Type: multipart/form-data
- Form field: `image` containing the image file

Response format:
```json
{
  "url": "https://example.com/api/images/image_filename.jpg"
}
```

## Error Handling

All API endpoints return appropriate error responses in JSON format:

```json
{
  "error": "Error message describing what went wrong"
}
```

Common HTTP status codes:
- 200: Success
- 400: Bad request (invalid input)
- 404: Resource not found
- 500: Server error 