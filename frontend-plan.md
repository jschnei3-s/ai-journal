# Frontend Development Plan
## AI-Guided Journaling Application

---

## 1. Project Setup & Architecture

### 1.1 Technology Stack
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + CSS Modules (or styled-components)
- **State Management**: React Context API + React Query (TanStack Query)
- **Form Handling**: React Hook Form + Zod validation
- **UI Components**: shadcn/ui or Radix UI primitives
- **Icons**: Lucide React or Heroicons
- **Date Handling**: date-fns
- **HTTP Client**: Built-in fetch with React Query

### 1.2 Project Structure
```
/app
  /(auth)
    /login
    /callback
  /(dashboard)
    /journal
      /[id]
      /new
    /entries
    /settings
    /billing
  /api (API routes if needed)
/components
  /ui (reusable UI components)
  /journal (journal-specific components)
  /auth (authentication components)
  /layout (layout components)
/lib
  /supabase (Supabase client & utilities)
  /stripe (Stripe utilities)
  /ai (AI-related utilities)
  /hooks (custom React hooks)
  /utils (general utilities)
  /types (TypeScript types)
/styles
  globals.css
  tailwind.config.js
/public
  /icons
  /images
```

---

## 2. Core Pages & Routes

### 2.1 Authentication Pages
- **`/login`**: Google OAuth login page
  - Clean, minimal design
  - "Sign in with Google" button
  - Privacy statement
  - Loading states

- **`/callback`**: OAuth callback handler
  - Processes Supabase auth callback
  - Redirects to dashboard on success
  - Error handling

### 2.2 Dashboard Pages
- **`/journal/new`**: New journal entry page
  - Full-screen writing interface
  - Rich text editor (or markdown)
  - Autosave indicator
  - AI prompt display area
  - Save/delete actions

- **`/journal/[id]`**: Edit existing entry
  - Same interface as new entry
  - Pre-populated with entry content
  - Entry metadata (date, word count)

- **`/entries`**: Entry history/list view
  - Grid or list layout
  - Search and filter functionality
  - Date-based grouping
  - Pagination or infinite scroll
  - Quick preview on hover

- **`/settings`**: User settings
  - Profile information
  - Subscription status
  - Privacy preferences
  - Account deletion

- **`/billing`**: Subscription management
  - Current plan display
  - Upgrade/downgrade options
  - Stripe checkout integration
  - Usage limits display
  - Payment history

---

## 3. Component Architecture

### 3.1 Layout Components
- **`AppLayout`**: Main application wrapper
  - Navigation sidebar/header
  - User menu
  - Subscription status indicator
  - Responsive mobile menu

- **`AuthLayout`**: Authentication wrapper
  - Centered content
  - Minimal navigation

### 3.2 Journal Components
- **`JournalEditor`**: Main writing interface
  - Textarea or rich text editor
  - Autosave functionality
  - Word/character count
  - Focus mode toggle
  - Keyboard shortcuts

- **`AIPromptDisplay`**: AI prompt component
  - Animated appearance
  - Clear visual distinction from user text
  - Accept/dismiss actions
  - Loading state during generation

- **`PromptSuggestions`**: Multiple prompt options
  - List of generated prompts
  - Selection mechanism
  - Regenerate option

- **`EntryCard`**: Entry preview card
  - Truncated content preview
  - Date and metadata
  - Quick actions (edit, delete)
  - Entry status indicators

- **`EntryList`**: Entry listing container
  - Grid/list view toggle
  - Grouping by date
  - Empty state
  - Loading states

### 3.3 UI Components (shadcn/ui or custom)
- **`Button`**: Primary, secondary, ghost variants
- **`Input`**: Text inputs with validation
- **`Textarea`**: Multi-line text input
- **`Card`**: Container component
- **`Dialog`**: Modal dialogs
- **`Dropdown`**: Dropdown menus
- **`Toast`**: Notification system
- **`LoadingSpinner`**: Loading indicators
- **`Badge`**: Status badges
- **`Separator`**: Visual dividers

### 3.4 Auth Components
- **`LoginForm`**: Google OAuth button
- **`UserMenu`**: User profile dropdown
- **`ProtectedRoute`**: Route guard wrapper

### 3.5 Billing Components
- **`SubscriptionCard`**: Current plan display
- **`UsageMeter`**: Usage limit visualization
- **`CheckoutButton`**: Stripe checkout trigger
- **`PlanComparison`**: Free vs. Premium comparison

---

## 4. State Management Strategy

### 4.1 React Context
- **`AuthContext`**: User authentication state
  - Current user
  - Session management
  - Login/logout functions

- **`SubscriptionContext`**: Subscription state
  - Current plan
  - Usage limits
  - Usage tracking

### 4.2 React Query (TanStack Query)
- **Journal Entries**: CRUD operations
  - `useJournalEntries()`: List entries
  - `useJournalEntry(id)`: Single entry
  - `useCreateEntry()`: Create mutation
  - `useUpdateEntry()`: Update mutation
  - `useDeleteEntry()`: Delete mutation

- **AI Prompts**: Prompt generation
  - `useGeneratePrompt()`: Generate AI prompt
  - Cache and invalidation strategy

- **User Data**: Profile and settings
  - `useUserProfile()`: User profile
  - `useUpdateProfile()`: Update mutation

### 4.3 Local State
- Form state (React Hook Form)
- UI state (modals, dropdowns, toggles)
- Editor state (draft content, cursor position)

---

## 5. Styling Approach

### 5.1 Design System
- **Color Palette**: Calm, minimal colors
  - Primary: Soft blue or green
  - Background: Off-white or light gray
  - Text: Dark gray/charcoal
  - Accent: Subtle highlight colors
  - AI prompts: Distinct color (e.g., soft purple)

- **Typography**: 
  - Headings: Sans-serif (Inter, System UI)
  - Body: Serif or sans-serif for readability
  - Monospace: Code/technical text

- **Spacing**: Consistent spacing scale (4px base)

- **Shadows**: Subtle, soft shadows

### 5.2 Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Touch-friendly targets (min 44x44px)
- Adaptive layouts for journal editor

### 5.3 Dark Mode (Future)
- System preference detection
- Toggle in settings
- Consistent color scheme

---

## 6. Key Features Implementation

### 6.1 Authentication Flow
1. User clicks "Sign in with Google"
2. Redirect to Supabase OAuth
3. Handle callback in `/callback`
4. Store session in context
5. Redirect to dashboard
6. Protect routes with middleware

### 6.2 Journal Entry Creation
1. Navigate to `/journal/new`
2. Load empty editor
3. User types content
4. Debounced autosave (every 2-3 seconds or 500ms after typing stops)
5. Show autosave indicator
6. Trigger AI prompt generation after threshold (e.g., 50 words)
7. Display prompts inline or in sidebar
8. User can accept/dismiss prompts

### 6.3 AI Prompt Generation
1. Monitor editor content
2. Debounce content analysis (wait for pause in typing)
3. Call Supabase Edge Function
4. Show loading state
5. Display generated prompts
6. Handle errors gracefully
7. Rate limiting on client side (prevent spam)

### 6.4 Autosave Implementation
- Use React Hook Form's `watch` or manual state
- Debounce save function
- Optimistic updates
- Error handling and retry logic
- Visual feedback (saved/unsaved indicator)

### 6.5 Subscription & Usage Limits
- Check subscription status on mount
- Display usage meter in header/sidebar
- Block features if limit reached
- Show upgrade prompt when limit reached
- Track usage in real-time

---

## 7. Integration Points

### 7.1 Supabase Integration
- **Client Setup**: Initialize Supabase client
- **Auth**: `supabase.auth` methods
- **Database**: `supabase.from('entries')` queries
- **Realtime**: Optional realtime subscriptions for collaboration (future)
- **Storage**: If needed for attachments (future)

### 7.2 Stripe Integration
- **Checkout**: Redirect to Stripe Checkout
- **Webhooks**: Handle subscription updates (backend)
- **Customer Portal**: Link to Stripe customer portal
- **Usage Tracking**: Track API calls for billing

### 7.3 AI Integration (via Edge Functions)
- **API Calls**: Fetch to Edge Function endpoint
- **Error Handling**: Network errors, rate limits, API errors
- **Loading States**: Skeleton loaders or spinners
- **Caching**: Cache prompts per entry to avoid regeneration

---

## 8. Development Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Next.js project setup with TypeScript
- [ ] Tailwind CSS configuration
- [ ] Project structure creation
- [ ] Supabase client setup
- [ ] Basic layout components
- [ ] Authentication flow (Google OAuth)
- [ ] Protected route middleware
- [ ] User context setup

### Phase 2: Journaling Core (Week 3-4)
- [ ] Journal editor component
- [ ] Autosave functionality
- [ ] Entry CRUD operations
- [ ] Entry list/history page
- [ ] Entry detail/edit page
- [ ] Database integration
- [ ] React Query setup for data fetching

### Phase 3: AI Integration (Week 5-6)
- [ ] AI prompt display component
- [ ] Edge Function integration
- [ ] Prompt generation logic
- [ ] Loading and error states
- [ ] Prompt interaction (accept/dismiss)
- [ ] Rate limiting UI
- [ ] Usage tracking

### Phase 4: Subscription & Polish (Week 7-8)
- [ ] Stripe checkout integration
- [ ] Subscription status display
- [ ] Usage limits UI
- [ ] Billing page
- [ ] Settings page
- [ ] Error boundaries
- [ ] Loading states throughout
- [ ] Accessibility audit
- [ ] Responsive design testing

### Phase 5: Testing & Optimization (Week 9-10)
- [ ] Unit tests for utilities
- [ ] Integration tests for critical flows
- [ ] E2E tests for main user journeys
- [ ] Performance optimization
- [ ] SEO optimization
- [ ] Analytics integration
- [ ] Error tracking (Sentry or similar)

---

## 9. Technical Considerations

### 9.1 Performance
- **Code Splitting**: Route-based and component-based
- **Image Optimization**: Next.js Image component
- **Lazy Loading**: Dynamic imports for heavy components
- **Memoization**: React.memo, useMemo, useCallback where needed
- **Bundle Size**: Monitor and optimize

### 9.2 Security
- **Environment Variables**: Never expose API keys
- **XSS Prevention**: Sanitize user input
- **CSRF Protection**: Next.js built-in protection
- **Secure Cookies**: HttpOnly, Secure flags
- **Content Security Policy**: Configure CSP headers

### 9.3 Accessibility
- **Semantic HTML**: Proper heading hierarchy
- **ARIA Labels**: Screen reader support
- **Keyboard Navigation**: Full keyboard support
- **Focus Management**: Visible focus indicators
- **Color Contrast**: WCAG AA compliance
- **Screen Reader Testing**: Test with VoiceOver/NVDA

### 9.4 Error Handling
- **Error Boundaries**: Catch React errors
- **API Error Handling**: User-friendly error messages
- **Offline Support**: Service worker (future)
- **Retry Logic**: Automatic retry for failed requests
- **Error Logging**: Track errors for debugging

---

## 10. Testing Strategy

### 10.1 Unit Tests
- Utility functions
- Custom hooks
- Form validation
- Data transformation functions

### 10.2 Integration Tests
- Authentication flow
- Entry CRUD operations
- AI prompt generation
- Subscription checkout flow

### 10.3 E2E Tests (Playwright or Cypress)
- Complete user journeys
- Authentication
- Creating and editing entries
- AI prompt interaction
- Subscription upgrade

### 10.4 Manual Testing Checklist
- [ ] All pages load correctly
- [ ] Authentication works on all browsers
- [ ] Autosave functions properly
- [ ] AI prompts appear and work
- [ ] Mobile responsiveness
- [ ] Keyboard navigation
- [ ] Screen reader compatibility
- [ ] Error states display correctly

---

## 11. Dependencies to Install

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "@supabase/supabase-js": "^2.0.0",
    "@supabase/auth-helpers-nextjs": "^0.8.0",
    "@tanstack/react-query": "^5.0.0",
    "react-hook-form": "^7.0.0",
    "zod": "^3.22.0",
    "@hookform/resolvers": "^3.3.0",
    "date-fns": "^2.30.0",
    "lucide-react": "^0.294.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/react": "^18.0.0",
    "@types/node": "^20.0.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "eslint": "^8.0.0",
    "eslint-config-next": "^14.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "jest": "^29.0.0",
    "playwright": "^1.40.0"
  }
}
```

---

## 12. Key Files to Create

### 12.1 Configuration Files
- `next.config.js`: Next.js configuration
- `tailwind.config.js`: Tailwind CSS configuration
- `tsconfig.json`: TypeScript configuration
- `.env.local.example`: Environment variables template
- `.eslintrc.json`: ESLint configuration

### 12.2 Core Files
- `lib/supabase/client.ts`: Supabase client
- `lib/supabase/server.ts`: Server-side Supabase client
- `lib/supabase/middleware.ts`: Auth middleware
- `lib/hooks/useAuth.ts`: Authentication hook
- `lib/hooks/useJournal.ts`: Journal operations hook
- `lib/hooks/useAIPrompt.ts`: AI prompt hook
- `lib/types/index.ts`: TypeScript type definitions
- `lib/utils/cn.ts`: Class name utility (for Tailwind)

### 12.3 Context Providers
- `contexts/AuthContext.tsx`: Authentication context
- `contexts/SubscriptionContext.tsx`: Subscription context
- `providers/QueryProvider.tsx`: React Query provider

---

## 13. Design Mockups Considerations

### 13.1 Journal Editor Page
- Full-width or centered editor (max-width: 800px)
- Minimal chrome (distraction-free)
- AI prompts appear below or in sidebar
- Autosave indicator in top-right
- Entry metadata (date, word count) subtle display

### 13.2 Entry List Page
- Card-based or list-based layout
- Search bar at top
- Date filters/grouping
- Empty state illustration
- Loading skeleton states

### 13.3 Navigation
- Sidebar (desktop) or bottom nav (mobile)
- Current page indicator
- User avatar/menu
- Subscription status badge

---

## 14. Success Criteria

- [ ] All MVP features implemented
- [ ] Authentication works reliably
- [ ] Autosave functions without data loss
- [ ] AI prompts generate within 1 second
- [ ] Mobile-responsive design
- [ ] WCAG 2.1 AA compliant
- [ ] Page load time < 2 seconds
- [ ] Zero critical security vulnerabilities
- [ ] Error handling covers all edge cases
- [ ] User testing feedback incorporated

---

## 15. Next Steps

1. **Review and Approve Plan**: Ensure alignment with PRD
2. **Set Up Development Environment**: Install dependencies, configure tools
3. **Create Design System**: Define colors, typography, spacing
4. **Build Foundation**: Phase 1 implementation
5. **Iterate**: Follow phases sequentially, test as you go
6. **Gather Feedback**: User testing after each phase

---

## 16. Open Questions to Resolve

1. **Editor Choice**: Rich text editor (Tiptap, Lexical) or plain textarea?
2. **Prompt Display**: Inline in editor or separate sidebar?
3. **Mobile UX**: Bottom sheet for prompts or full-screen?
4. **Offline Support**: Service worker for offline editing?
5. **Export Format**: Markdown, HTML, or plain text?
6. **Entry Organization**: Tags, folders, or date-based only?

---

This plan provides a comprehensive roadmap for building the frontend of the AI-Guided Journaling Application. Adjust timelines and priorities based on team size and resources.

