# CodeMap - Your Personal Learning Roadmap

CodeMap is an intelligent learning platform that creates personalized roadmaps for programming topics. It curates high-quality resources including GitHub repositories, blog articles, and YouTube videos to help you master any programming concept effectively.

## 🚀 Current Features

- 🎯 Generate personalized learning roadmaps for any programming topic
- 📚 Get curated resources from multiple sources:
  - GitHub repositories with practical examples
  - Blog articles for in-depth understanding
  - YouTube videos for visual learning
- 🔒 Secure authentication with Supabase
- 📱 Responsive design for all devices
- 🌙 Dark mode support
- 📊 Track your learning progress
- 💾 Save and revisit your roadmaps

## 🏗️ Architecture Overview

### Tech Stack
- **Framework**: Next.js 14 with App Router
- **Database & Auth**: Supabase
- **Styling**: Tailwind CSS
- **AI Integration**: Google Gemini
- **Form Handling**: React Hook Form with Zod
- **UI Components**: Radix UI
- **API Integration**: YouTube Data API, GitHub API

### Project Structure
```
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── login/             # Login page
│   ├── signup/            # Signup page
│   ├── history/           # User history pages
│   └── private/           # Protected routes
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   └── [feature].tsx     # Feature-specific components
├── lib/                  # Utility functions and helpers
├── hooks/                # Custom React hooks
├── utils/                # Additional utilities
└── public/               # Static assets
```

## 🔧 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Google Gemini API key
- YouTube Data API key
- GitHub Personal Access Token

### Environment Setup

1. Clone the repository:
```bash
git clone https://github.com/shekhar9837/code-map.git
cd code-map
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Fill in the required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `GEMINI_API_KEY`: Google's Gemini AI API key
- `YOUTUBE_API_KEY`: YouTube Data API key
- `GITHUB_TOKEN`: GitHub Personal Access Token

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📊 Code Quality Analysis & Improvement Recommendations

### 🟡 Current Issues Identified

#### 1. **Code Organization & Structure**
- **Issue**: Large monolithic components (e.g., `app/page.tsx` - 234 lines)
- **Impact**: Hard to maintain, test, and debug
- **Recommendation**: Break down into smaller, focused components

#### 2. **Error Handling**
- **Issue**: Inconsistent error handling patterns across the codebase
- **Impact**: Poor user experience, difficult debugging
- **Recommendation**: Implement centralized error handling with proper error boundaries

#### 3. **Type Safety**
- **Issue**: `noImplicitAny: false` in TypeScript config
- **Impact**: Reduced type safety, potential runtime errors
- **Recommendation**: Enable strict TypeScript settings

#### 4. **Performance Issues**
- **Issue**: Multiple API calls in sequence, no caching strategy
- **Impact**: Slow loading times, poor user experience
- **Recommendation**: Implement caching, parallel API calls, and loading states

#### 5. **Code Duplication**
- **Issue**: Repeated patterns in API routes and components
- **Impact**: Maintenance overhead, inconsistency
- **Recommendation**: Create reusable utilities and components

### 🟢 Strengths
- Good use of modern React patterns (hooks, functional components)
- Proper authentication implementation with Supabase
- Clean UI component structure with Radix UI
- Rate limiting implementation
- Responsive design with Tailwind CSS

## 🚀 Recommended Improvements

### 1. **Component Architecture Refactoring**

#### Current Issues:
```typescript
// app/page.tsx - 234 lines, multiple responsibilities
export default function Home() {
  // State management
  // API calls
  // UI rendering
  // Event handling
}
```

#### Recommended Structure:
```typescript
// components/HomePage/index.tsx
export default function HomePage() {
  return (
    <HomePageProvider>
      <HomePageHeader />
      <ResourceSearch />
      <ResourceDisplay />
    </HomePageProvider>
  );
}

// components/ResourceSearch/index.tsx
export function ResourceSearch() {
  // Focused on search functionality only
}

// components/ResourceDisplay/index.tsx
export function ResourceDisplay() {
  // Focused on displaying results only
}
```

### 2. **Error Handling Enhancement**

#### Current Issues:
```typescript
// Inconsistent error handling
catch (error) {
  console.error("Error fetching resources:", error);
  toast.error("An error occurred");
}
```

#### Recommended Implementation:
```typescript
// lib/errorHandler.ts
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
  }
}

// components/ErrorBoundary.tsx
export class ErrorBoundary extends React.Component {
  // Centralized error boundary
}

// hooks/useErrorHandler.ts
export function useErrorHandler() {
  // Centralized error handling hook
}
```

### 3. **Performance Optimizations**

#### Current Issues:
- Sequential API calls
- No caching mechanism
- Large bundle sizes

#### Recommended Solutions:

```typescript
// lib/cache.ts
export class CacheManager {
  static async get<T>(key: string): Promise<T | null> {
    // Implement caching logic
  }
  
  static async set<T>(key: string, value: T, ttl: number): Promise<void> {
    // Implement cache setting
  }
}

// hooks/useResourceFetch.ts
export function useResourceFetch() {
  // Implement parallel API calls
  // Add caching
  // Add loading states
}

// next.config.mjs - Bundle optimization
const nextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  webpack: (config) => {
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    };
    return config;
  },
};
```

### 4. **Type Safety Improvements**

#### Current Issues:
```json
// tsconfig.json
{
  "noImplicitAny": false,  // ❌ Reduces type safety
  "strict": true           // ✅ Good
}
```

#### Recommended Configuration:
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,           // ✅ Enable
    "noImplicitReturns": true,       // ✅ Add
    "noUnusedLocals": true,          // ✅ Add
    "noUnusedParameters": true,      // ✅ Add
    "exactOptionalPropertyTypes": true // ✅ Add
  }
}
```

### 5. **API Route Optimization**

#### Current Issues:
```typescript
// app/api/fetchResources/route.ts
export async function POST(req: Request) {
  // Multiple sequential operations
  const [githubRepos, blogArticles, roadmapSteps] = await fetchAllResources(topic);
  const stepsWithVideos = await enrichStepsWithYouTube(topic, roadmapSteps);
  await saveRoadmapHistory(supabase, user, topic, stepsWithVideos, githubRepos, blogArticles);
}
```

#### Recommended Implementation:
```typescript
// lib/services/ResourceService.ts
export class ResourceService {
  async fetchAllResources(topic: string) {
    // Parallel execution
    const [githubRepos, blogArticles, roadmapSteps] = await Promise.all([
      this.fetchGitHubRepos(topic),
      this.fetchBlogArticles(topic),
      this.generateRoadmap(topic)
    ]);
    
    return { githubRepos, blogArticles, roadmapSteps };
  }
}

// app/api/fetchResources/route.ts
export async function POST(req: Request) {
  try {
    const service = new ResourceService();
    const resources = await service.fetchAllResources(topic);
    // Handle response
  } catch (error) {
    return handleApiError(error);
  }
}
```

### 6. **Testing Strategy**

#### Current Issues:
- No test files found
- No testing framework configured

#### Recommended Implementation:
```bash
# Install testing dependencies
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
npm install --save-dev @types/jest
```

```typescript
// __tests__/components/ResourceSearch.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ResourceSearch } from '@/components/ResourceSearch';

describe('ResourceSearch', () => {
  it('should render search input', () => {
    render(<ResourceSearch />);
    expect(screen.getByPlaceholderText(/enter topic/i)).toBeInTheDocument();
  });
});
```

### 7. **Code Quality Tools**

#### Recommended Additions:
```json
// package.json
{
  "scripts": {
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "prettier": "^3.0.0",
    "husky": "^8.0.0",
    "lint-staged": "^14.0.0"
  }
}
```

### 8. **Documentation Improvements**

#### Recommended Additions:
- API documentation with OpenAPI/Swagger
- Component documentation with Storybook
- Architecture decision records (ADRs)
- Contributing guidelines
- Code style guide

## 📈 Performance Metrics to Track

1. **Core Web Vitals**
   - Largest Contentful Paint (LCP)
   - First Input Delay (FID)
   - Cumulative Layout Shift (CLS)

2. **Application Metrics**
   - API response times
   - Bundle size
   - Memory usage
   - Error rates

3. **User Experience Metrics**
   - Time to interactive
   - Search success rate
   - User engagement

## 🔒 Security Considerations

### Current Security Measures:
- ✅ Rate limiting implemented
- ✅ Authentication with Supabase
- ✅ Environment variables for sensitive data

### Recommended Enhancements:
- Input validation and sanitization
- CORS configuration
- Security headers
- API key rotation strategy
- Audit logging

## 🚀 Deployment & CI/CD

### Current Setup:
- Deployed on Vercel
- Manual deployment process

### Recommended Improvements:
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm run test
      - run: npm run build
```

## 📝 Next Steps Priority

### High Priority (Week 1-2):
1. ✅ Enable strict TypeScript settings
2. ✅ Implement error boundaries
3. ✅ Break down large components
4. ✅ Add basic testing setup

### Medium Priority (Week 3-4):
1. ✅ Implement caching strategy
2. ✅ Optimize API routes
3. ✅ Add performance monitoring
4. ✅ Improve error handling

### Low Priority (Month 2):
1. ✅ Add comprehensive testing
2. ✅ Implement CI/CD pipeline
3. ✅ Add monitoring and analytics
4. ✅ Performance optimization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

Created by [Shekhar](https://github.com/shekhar9837)

## 🌐 Live Demo

The application is deployed on Vercel: [https://code-map.shekharcodes.tech](https://code-map.shekharcodes.tech)

---

**Note**: This README serves as both documentation and a roadmap for improving the codebase. Follow the recommendations in order of priority to enhance code quality, performance, and maintainability.
