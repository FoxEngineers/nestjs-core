# Role-Based Access Control (RBAC)

## Overview
The authentication system implements role-based access control using the `is_admin` field in the user entity.

## Role Logic
- **`is_admin === true`** → Admin privileges
- **`is_admin === false`** → Regular user privileges

## Implementation Methods

### Method 1: Guards with @Roles Decorator (Recommended)

```typescript
@Controller('api/admin')
@UseGuards(JwtAuthGuard) // Ensure user is authenticated
export class AdminController {
  
  @Get('dashboard')
  @UseGuards(RolesGuard)  // Check roles
  @Roles('admin')         // Require admin role
  async getDashboard(@CurrentUser() user: any) {
    // Only accessible if user.is_admin === true
    return { message: 'Admin dashboard' };
  }
}
```

### Method 2: Middleware Approach

```typescript
// Apply to specific routes
export class SomeModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AdminMiddleware)
      .forRoutes('api/admin/*');
  }
}
```

### Method 3: Manual Check (Not Recommended)

```typescript
@Get('reports')
async getReports(@CurrentUser() user: any) {
  if (user.is_admin !== true) {
    throw new ForbiddenException('Admin access required');
  }
  // Admin logic here
}
```

## Available Roles

### 'admin' Role
- Requires `user.is_admin === true`
- Full system access
- Can manage users, settings, reports

### 'user' Role  
- Available to all authenticated users
- Basic functionality access
- Personal data management

### Multiple Roles
```typescript
@Roles('user', 'admin') // Both users and admins can access
```

## Usage Examples

### Admin-Only Endpoints
```typescript
@Controller('api/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  
  @Get('users')
  async getUsers() {
    // Only admins can access
  }
  
  @Get('settings')
  async getSettings() {
    // Only admins can access
  }
}
```

### User Endpoints
```typescript
@Controller('api/user')
@UseGuards(JwtAuthGuard)
export class UserController {
  
  @Get('profile')
  async getProfile() {
    // All authenticated users can access
  }
  
  @Get('dashboard')
  @UseGuards(RolesGuard)
  @Roles('user')
  async getDashboard() {
    // Explicitly require user role
  }
}
```

### Mixed Access
```typescript
@Get('orders')
@UseGuards(RolesGuard)
@Roles('user', 'admin') // Both can access
async getOrders(@CurrentUser() user: any) {
  if (user.is_admin) {
    // Admin sees all orders
    return this.getAllOrders();
  } else {
    // User sees only their orders
    return this.getUserOrders(user.id);
  }
}
```

## API Endpoints

### Admin Endpoints
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/dashboard` | admin | Admin dashboard |
| GET | `/api/admin/users` | admin | User management |
| GET | `/api/admin/settings` | admin | System settings |
| GET | `/api/admin/reports` | admin | System reports |

### User Endpoints
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/user/profile` | user | User profile |
| GET | `/api/user/dashboard` | user | User dashboard |
| GET | `/api/user/orders` | user, admin | User orders |

## Testing Role Access

### Admin User Test
```bash
# Login as admin
curl -X POST /api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "password"}'

# Use token to access admin endpoint
curl -X GET /api/admin/dashboard \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Regular User Test
```bash
# Login as regular user
curl -X POST /api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'

# Try to access admin endpoint (should fail)
curl -X GET /api/admin/dashboard \
  -H "Authorization: Bearer USER_JWT_TOKEN"
# Response: 403 Forbidden
```

## Error Responses

### Insufficient Privileges
```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

### Not Authenticated
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

## Best Practices

1. **Always use Guards**: Prefer `@UseGuards(RolesGuard)` over manual checks
2. **Combine with JWT**: Always use `JwtAuthGuard` first, then `RolesGuard`
3. **Explicit Roles**: Use `@Roles('admin')` to be explicit about requirements
4. **Controller Level**: Apply guards at controller level for consistency
5. **Error Handling**: Let NestJS handle 403/401 responses automatically

## Security Notes

- Role checks happen after authentication
- `is_admin` field is the single source of truth for admin privileges
- Guards automatically handle error responses
- JWT tokens contain role information for quick access 