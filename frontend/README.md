# NeuraMaint Frontend

Frontend application for NeuraMaint - Industrial Equipment Predictive Maintenance System.

## 🚀 Quick Start

### Prerequisites
- Node.js 18.0.0 or higher
- npm or yarn
- Backend API running on port 3001

### Installation

1. **Clone and navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` file with your actual configuration values.

4. **Start development server:**
   ```bash
   npm run dev
   ```

The application will run on `http://localhost:3000`

## 📋 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run type-check` - Check TypeScript types
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report

## 🏗️ Architecture

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── dashboard/         # Dashboard pages and layouts
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   ├── components/            # Reusable components
│   │   ├── layout/           # Layout components (navbar, sidebar)
│   │   └── ui/               # UI components (buttons, cards, etc.)
│   ├── hooks/                # Custom React hooks
│   ├── services/             # API services and utilities
│   ├── store/                # Zustand state management
│   ├── styles/               # Global styles and Tailwind config
│   ├── types/                # TypeScript type definitions
│   └── utils/                # Utility functions
├── public/                   # Static assets
├── next.config.js           # Next.js configuration
├── tailwind.config.js       # Tailwind CSS configuration
└── tsconfig.json            # TypeScript configuration
```

## 🎨 Design System

### Color Palette
- **Primary**: `#1E40AF` (Blue)
- **Secondary**: `#0EA5E9` (Light Blue)
- **Status Colors**:
  - 🟢 **Normal**: `#10B981` (Green)
  - 🟡 **Warning**: `#F59E0B` (Amber)
  - 🔴 **Critical**: `#EF4444` (Red)

### Typography
- **Font Family**: Inter (Google Fonts)
- **Font Weights**: 100-900
- **Responsive Typography**: Tailwind CSS utility classes

### Components
All components follow atomic design principles:
- **Atoms**: Basic UI elements (buttons, inputs, icons)
- **Molecules**: Component combinations (search bars, form fields)
- **Organisms**: Complex components (navbar, sidebar, data tables)

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:3001` |
| `NEXT_PUBLIC_APP_NAME` | Application name | `NeuraMaint` |
| `NEXT_PUBLIC_APP_VERSION` | Application version | `1.0.0` |
| `NEXT_PUBLIC_ML_SERVICE_URL` | ML Service URL | `http://localhost:5000` |

## 📱 Features

### Dashboard
- **Real-time monitoring** with live sensor data
- **RAG status indicators** (Red-Amber-Green)
- **Interactive charts** using Chart.js
- **Alert notifications** with toast messages

### Navigation
- **Responsive sidebar** with collapsible menu
- **Mobile-friendly** hamburger menu
- **Active state highlighting** for current page

### Responsive Design
- **Mobile-first** approach using Tailwind CSS
- **Breakpoints**:
  - `xs`: 475px (extra small phones)
  - `sm`: 640px (small tablets)
  - `md`: 768px (tablets)
  - `lg`: 1024px (desktops)
  - `xl`: 1280px (large desktops)

### Accessibility
- **WCAG 2.1 compliant** color contrast ratios
- **Screen reader support** with proper ARIA labels
- **Keyboard navigation** support
- **Focus management** for interactive elements

## 🚀 Deployment

### Vercel Deployment (Recommended)

1. **Connect GitHub repository to Vercel**
2. **Set environment variables in Vercel dashboard:**
   - `NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app`
   - Other required environment variables
3. **Deploy automatically triggers on push to main branch**

### Manual Deployment

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Start production server:**
   ```bash
   npm start
   ```

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### Test Coverage
```bash
npm run test:coverage
```

### E2E Tests (Coming soon)
- Cypress for end-to-end testing
- Component testing with React Testing Library

## 📊 Performance

### Optimizations
- **Image optimization** with Next.js Image component
- **Code splitting** automatic with Next.js
- **Tree shaking** to eliminate unused code
- **Compression** enabled for production builds

### Lighthouse Scores (Target)
- **Performance**: > 90
- **Accessibility**: > 95
- **Best Practices**: > 90
- **SEO**: > 85

## 🔍 Development Tools

### Code Quality
- **ESLint** for code linting
- **TypeScript** for type safety
- **Prettier** for code formatting (recommended)

### Development Experience
- **Hot reload** for instant updates during development
- **TypeScript IntelliSense** for better developer experience
- **Path aliases** for cleaner imports (`@/components/*`)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Follow coding standards and run tests
4. Commit changes: `git commit -am 'Add new feature'`
5. Push to branch: `git push origin feature/new-feature`
6. Submit pull request

### Coding Standards
- Use TypeScript for all new components
- Follow atomic design principles
- Use Tailwind CSS for styling
- Add proper TypeScript types
- Include JSDoc comments for complex functions

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For development support and questions:
- Check the backend README for API documentation
- Review component documentation in Storybook (coming soon)
- Create GitHub issues for bugs and feature requests