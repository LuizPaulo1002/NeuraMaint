# Equipment Management System

## Overview
The Equipment Management system provides comprehensive CRUD functionality for managing industrial pumps with admin-only access controls, real-time validation, and responsive design.

## Features

### 1. Admin-Only Access
- Protected routes with `ProtectedRoute` component
- Required admin role for all equipment management operations
- Automatic redirect for unauthorized users

### 2. Pump Listing & Management
- Sortable and paginated data table
- Real-time search functionality
- Status-based filtering (Active/Inactive/Maintenance)
- Statistics dashboard with equipment counts
- Bulk operations support

### 3. CRUD Operations
- **Create**: Add new pumps with validation
- **Read**: View detailed pump information
- **Update**: Edit existing pump data
- **Delete**: Remove pumps with confirmation

### 4. Form Validation
- Real-time field validation
- Required field enforcement
- Length and format validation
- Pre-defined location options
- Status selection with radio buttons

### 5. Data Management
- SWR integration for caching and revalidation
- Optimistic updates
- Error handling and recovery
- Mock data fallbacks for development

## Components

### Core Components

#### `EquipmentTable.tsx`
- Displays pump data in sortable table format
- Action buttons for view, edit, delete operations
- Status indicators with color coding
- Loading and empty states

#### `PumpForm.tsx`
- Unified form for create/edit operations
- Real-time validation with error messaging
- Dirty state tracking with unsaved changes warning
- Responsive design with accessibility support

#### `DataTable.tsx`
- Generic reusable table component
- Sorting, pagination, and search capabilities
- Customizable columns with render functions
- Loading states and empty message support

### Pages

#### `/equipment/page.tsx`
- Main equipment listing page
- Search and filter functionality
- Statistics cards display
- Admin-only access protection

#### `/equipment/new/page.tsx`
- New pump creation page
- Form validation and submission
- Breadcrumb navigation
- Success/error handling

#### `/equipment/[id]/page.tsx`
- Detailed pump view
- Complete pump information display
- Edit and delete action buttons
- Created/updated timestamps

#### `/equipment/[id]/edit/page.tsx`
- Pump editing interface
- Pre-populated form with existing data
- Update validation and submission
- Navigation breadcrumbs

### Services

#### `equipmentService.ts`
- Complete API integration layer
- CRUD operations with error handling
- Data validation utilities
- Mock data for development/testing
- TypeScript interfaces and types

## Business Rules

### 1. Access Control
- Only administrators can access equipment management
- All routes protected with role-based middleware
- Automatic authentication checks

### 2. Data Validation
- **Name**: Required, 3-50 characters
- **Location**: Required, must be from predefined list
- **Status**: Active/Inactive/Maintenance options

### 3. Predefined Options
- **Locations**: Setor A-E, Warehouse, Production, Maintenance
- **Status**: Active, Inactive, Maintenance with visual indicators

### 4. User Experience
- Confirmation dialogs for destructive actions
- Toast notifications for all operations
- Loading states during API calls
- Form dirty state warnings

## API Endpoints

The system expects the following REST API endpoints:

```
GET    /api/bombas           - List all pumps
GET    /api/bombas/:id       - Get pump details
POST   /api/bombas           - Create new pump
PUT    /api/bombas/:id       - Update pump
DELETE /api/bombas/:id       - Delete pump
```

### Request/Response Format

#### Pump Object
```typescript
interface Pump {
  id: number;
  nome: string;
  localizacao: string;
  status: 'ativo' | 'inativo' | 'manutencao';
  createdAt: string;
  updatedAt: string;
}
```

#### Create/Update Request
```typescript
interface CreatePumpData {
  nome: string;
  localizacao: string;
  status: 'ativo' | 'inativo' | 'manutencao';
}
```

## Usage Examples

### Basic Equipment List
```tsx
import EquipmentPage from '@/app/equipment/page';

// Automatically handles admin authentication
// Shows equipment list with filters and actions
```

### Custom DataTable
```tsx
import { DataTable } from '@/components/common/DataTable';

const columns = [
  { key: 'nome', header: 'Name', sortable: true },
  { key: 'status', header: 'Status', render: (value) => <StatusBadge status={value} /> }
];

<DataTable 
  data={pumps} 
  columns={columns}
  pagination={{ enabled: true, pageSize: 10 }}
  onRowClick={handleRowClick}
/>
```

### Pump Form Integration
```tsx
import { PumpForm } from '@/components/equipment/PumpForm';

<PumpForm
  pump={existingPump}
  isEditing={true}
  onSubmit={handleUpdate}
  onCancel={handleCancel}
/>
```

## Error Handling

### Client-Side
- Form validation with real-time feedback
- API error display with user-friendly messages
- Loading states during operations
- Confirmation dialogs for destructive actions

### Fallback Behavior
- Mock data when API unavailable
- Graceful degradation of functionality
- Retry mechanisms for failed requests
- Cache persistence during navigation

## Security Features

### Authentication
- HTTPOnly cookie-based authentication
- Role-based access control (admin only)
- Protected route components
- Automatic redirect on auth failure

### Input Validation
- Client-side form validation
- Server-side validation expected
- SQL injection prevention through parameterized queries
- XSS protection through proper escaping

## Performance Optimizations

### Data Fetching
- SWR caching and revalidation
- Background updates
- Optimistic UI updates
- Request deduplication

### UI Performance
- Pagination for large datasets
- Lazy loading of components
- Debounced search inputs
- Optimized re-rendering

## Testing

### Component Tests
- Unit tests for all components
- Form validation testing
- User interaction testing
- Error state validation

### Integration Tests
- API integration testing
- Authentication flow testing
- Navigation testing
- Data persistence validation

### Running Tests
```bash
cd frontend
npm test Equipment.test.tsx
```

## Deployment Considerations

### Environment Variables
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### Build Requirements
- Node.js 18+
- Next.js 14 with App Router
- TypeScript 5.0+
- Tailwind CSS 3.x

### Production Optimizations
- Static site generation where possible
- Image optimization
- Bundle splitting
- CDN integration for assets