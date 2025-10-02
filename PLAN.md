# Blog & Reporting System - Technical Specification

## 📋 Project Overview
A comprehensive content management and reporting system built with Next.js 15, shadcn ui, and modern web technologies.

## 🏗️ Technology Stack

### Core Framework
- **Next.js 15** with App Router
- **TypeScript 5** for type safety
- **React 18** with Server Components
- **ES6+** modern JavaScript standards

### API Architecture
- **tRPC** for type-safe API calls
- **Socket.io** for real-time communication
- **Zod** for shared schema validation
- **Prisma** as database ORM
- **SQLite** as database

### UI Components & Styling
- **shadcn ui** Primary UI library
- **Tailwind CSS** for custom styling
- **Lucide React** for icons

### Authentication & Authorization
- **Auth.js** (formerly NextAuth.js) for authentication
- **Google OAuth** provider
- **Role-based access control** (Admin, Operator, User)

### Database & ORM
- **SQLite** as database
- **Prisma ORM** for database operations
- **Soft delete implementation**
- **Type-safe database access with tRPC integration**

### Image & Media Processing
- **browser-image-compression** - Client-side image processing
- **WebP conversion** with JPG fallback
- **Sharp** (server-side fallback if needed)

### Rich Text Editors
- **CKEditor 5** (Open Source) for post editing
- **TinaCMS** (Open Source) for page editing

### File Handling & Storage
- **Multer** for file uploads
- **Mime-types** for file validation
- **UUID** for unique filenames

### State Management & Data Fetching
- **tRPC** for type-safe client-server communication
- **Zustand** for client state management
- **Socket.io-client** for real-time updates
- **React Hook Form** for form management

### Additional Libraries
- **Zod** for schema validation (shared between client/server)
- **Date-fns** for date manipulation
- **JSPDF** for PDF export
- **XLSX** for Excel export
- **Node-cron** for scheduled tasks

## 🗄️ Database Schema

```sql
-- Users Table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'operator', 'user')),
  avatar_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME
);

-- Categories Table
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('post', 'page')),
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME
);

-- Tags Table
CREATE TABLE tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME
);

-- Posts Table
CREATE TABLE posts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  category_id TEXT REFERENCES categories(id),
  type TEXT NOT NULL CHECK (type IN ('post', 'page')),
  status TEXT NOT NULL CHECK (status IN ('draft', 'published')),
  meta_title TEXT,
  meta_description TEXT,
  author_id TEXT REFERENCES users(id),
  published_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME
);

-- Post Tags Junction Table
CREATE TABLE post_tags (
  post_id TEXT REFERENCES posts(id) ON DELETE CASCADE,
  tag_id TEXT REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

-- Comments Table
CREATE TABLE comments (
  id TEXT PRIMARY KEY,
  post_id TEXT REFERENCES posts(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id TEXT REFERENCES comments(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME
);

-- Media Folders Table
CREATE TABLE media_folders (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  parent_id TEXT REFERENCES media_folders(id),
  path TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME
);

-- Media Table
CREATE TABLE media (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  path TEXT NOT NULL,
  folder_id TEXT REFERENCES media_folders(id),
  alt_text TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME
);

-- Statuses Table (Dynamic)
CREATE TABLE statuses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  color TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME
);

-- Reports Table
CREATE TABLE reports (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location_lat REAL,
  location_lng REAL,
  location_address TEXT,
  status_id TEXT REFERENCES statuses(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME
);

-- Report Attachments Table
CREATE TABLE report_attachments (
  id TEXT PRIMARY KEY,
  report_id TEXT REFERENCES reports(id) ON DELETE CASCADE,
  media_id TEXT REFERENCES media(id) ON DELETE CASCADE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Report Responses Table
CREATE TABLE report_responses (
  id TEXT PRIMARY KEY,
  report_id TEXT REFERENCES reports(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME
);

-- Settings Table
CREATE TABLE settings (
  id TEXT PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('string', 'number', 'boolean', 'json')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME
);

-- Notifications Table
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  data TEXT, -- JSON for additional data
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME
);

-- Activity Logs Table
CREATE TABLE activity_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT,
  old_data TEXT, -- JSON
  new_data TEXT, -- JSON
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Backups Table
CREATE TABLE backups (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  path TEXT NOT NULL,
  size INTEGER NOT NULL,
  created_by TEXT REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME
);
```

## 🔐 Authentication & Authorization

### User Roles & Permissions
- **Admin**: Full access to all features
- **Operator**: Can manage reports, create/edit posts/pages
- **User**: Can create reports, comment on posts, view content

### Auth.js Configuration
```javascript
// Google OAuth + Email/Password registration
// Custom callbacks for role management
// Session management with JWT
```

## 📁 File Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── admin/
│   │   ├── dashboard/
│   │   ├── posts/
│   │   ├── pages/
│   │   ├── categories/
│   │   ├── tags/
│   │   ├── media/
│   │   ├── reports/
│   │   ├── users/
│   │   ├── settings/
│   │   └── backups/
│   ├── api/
│   │   ├── trpc/
│   │   │   └── [trpc]/
│   │   └── socket/
│   │       └── socket.ts
│   └── globals.css
├── components/
│   ├── ui/
│   ├── admin/
│   ├── forms/
│   └── layout/
├── lib/
│   ├── auth.ts
│   ├── db.ts
│   ├── utils.ts
│   ├── trpc/
│   │   ├── index.ts
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── procedures/
│   ├── socket/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── events.ts
│   ├── validations/
│   │   └── schemas/
│   └── hooks/
├── shared/
│   ├── types/
│   │   └── index.ts
│   ├── schemas/
│   │   ├── user.ts
│   │   ├── post.ts
│   │   ├── page.ts
│   │   ├── media.ts
│   │   ├── report.ts
│   │   └── index.ts
│   └── constants/
│       └── index.ts
└── middleware.ts
```

## 🔌 API Architecture

### tRPC Setup
```typescript
// Shared schemas using Zod
import { z } from 'zod';

// Example shared schema
export const PostSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  slug: z.string(),
  content: z.string(),
  categoryId: z.string().optional(),
  status: z.enum(['draft', 'published']),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// tRPC procedure
export const postRouter = t.router({
  getAll: t.procedure
    .input(z.object({ 
      page: z.number().default(1),
      limit: z.number().default(10),
      search: z.string().optional()
    }))
    .query(async ({ input }) => {
      // Type-safe database access
      return await db.post.findMany({
        where: {
          deletedAt: null,
          ...(input.search && {
            OR: [
              { title: { contains: input.search } },
              { content: { contains: input.search } }
            ]
          })
        },
        include: { category: true, author: true },
        skip: (input.page - 1) * input.limit,
        take: input.limit
      });
    }),
    
  create: t.procedure
    .input(z.object({
      title: z.string().min(1),
      content: z.string(),
      categoryId: z.string().optional(),
      status: z.enum(['draft', 'published']).default('draft')
    }))
    .mutation(async ({ input, ctx }) => {
      // Type-safe mutation with user context
      return await db.post.create({
        data: {
          ...input,
          authorId: ctx.user.id,
          slug: generateSlug(input.title)
        }
      });
    })
});
```

### Socket.io Integration
```typescript
// Server-side socket events
import { Server } from 'socket.io';
import { ZodSocketSchema } from '@/shared/schemas';

export const setupSocket = (io: Server) => {
  io.on('connection', (socket) => {
    // Type-safe socket events
    socket.on('join_room', (data) => {
      const validated = ZodSocketSchema.joinRoom.parse(data);
      socket.join(validated.roomId);
    });
    
    socket.on('notification_read', (data) => {
      const validated = ZodSocketSchema.notificationRead.parse(data);
      // Handle notification read event
      io.to(`user_${validated.userId}`).emit('notification_updated', {
        id: validated.notificationId,
        read: true
      });
    });
  });
};

// Real-time notification system
export const sendNotification = async (userId: string, notification: NotificationData) => {
  // Save to database
  const saved = await db.notification.create({
    data: { ...notification, userId }
  });
  
  // Send real-time via Socket.io
  io.to(`user_${userId}`).emit('notification', saved);
  
  return saved;
};
```

### Client-side Usage
```typescript
// Type-safe tRPC client
import { trpc } from '@/lib/trpc/client';

export const PostList = () => {
  const { data, isLoading } = trpc.post.getAll.useQuery({
    page: 1,
    limit: 10,
    search: ''
  });
  
  const createPost = trpc.post.create.useMutation();
  
  const handleCreate = async (postData: CreatePostData) => {
    await createPost.mutateAsync(postData);
    // Automatically refetch data
  };
  
  return (
    // JSX with type-safe data
  );
};

// Socket.io client
import { useSocket } from '@/lib/socket/client';

export const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const socket = useSocket();
  
  useEffect(() => {
    socket.on('notification', (notification) => {
      setNotifications(prev => [notification, ...prev]);
    });
    
    return () => socket.off('notification');
  }, [socket]);
  
  return (
    // JSX with real-time notifications
  );
};
```

## 🎨 Admin Dashboard Features

### 1. Dashboard Overview
- Statistics cards (posts, pages, reports, users)
- Recent activity feed
- Chart analytics
- Quick actions

### 2. Posts Management
- List view with filtering & search
- Create/Edit with CKEditor 5
- Category & tag management
- Draft/Published status
- Bulk actions

### 3. Pages Management
- List view with filtering
- Create/Edit with TinaCMS
- Page hierarchy support
- Draft/Published status

### 4. Media Management
- Folder organization
- Upload with client-side processing
- Image optimization settings
- File type validation
- Bulk operations

### 5. Reports Management
- List view with status filtering
- Dynamic status management
- Response system
- Location mapping
- Export to PDF/Excel

### 6. User Management
- User list with role filtering
- Role assignment
- Activity monitoring
- User statistics

### 7. Settings
- Image processing settings
- System configuration
- Status management
- Backup settings

## 🖼️ Image Processing Pipeline

### Client-side Processing
```javascript
// browser-image-compression configuration
{
  maxSizeMB: 2,
  maxWidthOrHeight: 1200, // Dynamic from settings
  useWebWorker: true,
  fileType: 'webp', // with fallback to jpg
  quality: 0.8 // Dynamic from settings (10%-100%)
}
```

### Supported Formats
- **Images**: JPG, PNG, GIF, WebP
- **Documents**: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX
- **Max file size**: 50MB (configurable)

## 🔔 Notification System

### Notification Types
- Report status changes
- New operator responses
- New comments on posts
- System announcements

### Real-time Implementation
- Socket.io for instant notifications
- In-app notification center
- Email notifications (optional)

## 📊 Export Features

### Reports Export
- **PDF**: Custom template with charts
- **Excel**: Raw data with formatting

### Data Export
- Users, posts, pages, reports
- Filtered export options
- Scheduled exports

## 🔍 SEO Optimization

### Meta Tags
- Dynamic meta titles
- Meta descriptions
- Open Graph tags
- Twitter Cards

### Structured Data
- JSON-LD for articles
- Breadcrumb markup
- Organization data

## 📈 Performance Optimization

### Caching Strategy
- Redis for session storage
- File system caching for media
- Database query optimization
- CDN integration ready

### Code Splitting
- Route-based splitting
- Component lazy loading
- Dynamic imports

## 📝 Activity Logging

### Logged Actions
- User login/logout
- CRUD operations
- Settings changes
- File uploads
- Status changes

### Audit Trail
- Before/after values
- User identification
- Timestamp & IP tracking

## 🔄 Backup System

### Backup Types
- Database backups
- Media files backup
- Configuration backup

### Features
- Automated scheduling
- Manual backup creation
- Restore functionality
- Backup encryption

## 🛠️ Development Tools

### Code Quality
- ESLint + Prettier
- TypeScript strict mode
- Husky pre-commit hooks
- Automated testing setup

### Development Experience
- Hot reload
- Error boundaries
- Debugging tools
- Performance monitoring

## 📦 Package Dependencies

### Core Dependencies
```json
{
  "next": "^15.0.0",
  "react": "^18.0.0",
  "react-dom": "^18.0.0",
  "typescript": "^5.0.0",
  "tailwindcss": "^3.0.0",
  "prisma": "^5.0.0",
  "@prisma/client": "^5.0.0",
  "auth": "^5.0.0",
  "@trpc/server": "^10.0.0",
  "@trpc/client": "^10.0.0",
  "@trpc/react-query": "^10.0.0",
  "socket.io": "^4.0.0",
  "socket.io-client": "^4.0.0",
  "zod": "^3.0.0",
  "browser-image-compression": "^2.0.0",
  "@ckeditor/ckeditor5-react": "^6.0.0",
  "@ckeditor/ckeditor5-build-classic": "^39.0.0",
  "tinacms": "^1.0.0",
  "react-hook-form": "^7.0.0",
  "zustand": "^4.0.0",
  "date-fns": "^2.0.0",
  "jspdf": "^2.0.0",
  "xlsx": "^0.18.0"
}
```

### Development Dependencies
```json
{
  "@types/node": "^20.0.0",
  "@types/react": "^18.0.0",
  "@types/react-dom": "^18.0.0",
  "eslint": "^8.0.0",
  "prettier": "^3.0.0",
  "husky": "^8.0.0",
  "lint-staged": "^13.0.0"
}
```

---

## 🔌 API Architecture Details

### Data Flow Architecture
```
Client (React) → tRPC → Zod Validation → Prisma → SQLite
Client (React) → Socket.io → Zod Validation → Prisma → SQLite
Shared Schemas (Zod) ← Client & Server
```

### Type Safety Benefits
- **End-to-end type safety**: From database to UI
- **Shared validation**: Same Zod schemas on client and server
- **Auto-completion**: Full TypeScript support
- **Runtime validation**: Zod ensures data integrity
- **Reduced boilerplate**: tRPC eliminates API route definitions

### Real-time Features
- **Notifications**: Instant delivery via Socket.io
- **Live updates**: Report status changes, user activities
- **Collaboration**: Multi-user awareness (future feature)
- **System alerts**: Critical updates in real-time

---

**Status**: ✅ Ready for implementation with tRPC + Socket.io + Zod architecture
**Next Step**: Waiting for your command to begin development