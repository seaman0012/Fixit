# Testing Recommendations for Fixit

## 1. Testing Framework & Tools

### Recommended Stack

```
├── Unit Tests: Vitest (Fast, ESM-native, optimized for TypeScript/React)
├── Component Tests: Vitest + React Testing Library
├── Integration Tests: Vitest + Supabase Local (supabase/supabase-js testing utilities)
├── E2E Tests: Playwright (Cross-browser, visual debugging, API mocking)
├── Performance: Lighthouse CI (for Next.js pages)
└── Coverage: Vitest built-in (aim for 70%+ coverage initially)
```

**Why these choices:**

- **Vitest**: ⚡️ 5-10x faster than Jest, works great with Next.js 16, no babel setup needed
- **React Testing Library**: Tests components like users would use them (accessibility-first)
- **Playwright**: Better than Cypress for Next.js, better for testing realtime features
- **Supabase Local**: Test RLS policies locally before deployment

---

## 2. Testing Architecture by Layer

### A. Unit Tests (70% of test time)

**What to test:**

- Utility functions (`lib/utils.ts`, `lib/constants.ts`)
- Business logic functions (category formatting, status transitions)
- Supabase client initialization
- Authentication helpers

**Example:**

```typescript
// lib/__tests__/utils.test.ts
import { describe, it, expect } from 'vitest'
import { formatCategoryLabel } from '../utils'

describe('formatCategoryLabel', () => {
  it('should format electrical category correctly', () => {
    expect(formatCategoryLabel('electrical')).toBe('ไฟฟ้า')
  })
})
```

**Priority: HIGH** - Quick feedback, easy maintenance

---

### B. Component Tests (15% of test time)

**What to test:**

- Form components (login, ticket creation, status updates)
- Data table (sorting, filtering, pagination)
- Combobox, Select, Input components
- Modal/Dialog behavior

**Example:**

```typescript
// components/ui/__tests__/data-table.test.tsx
import { render, screen } from '@testing-library/react'
import { DataTable } from '../data-table'

describe('DataTable', () => {
  it('should display ticket categories correctly', () => {
    const tickets = [{
      id: '1',
      categories: { name: 'ไฟฟ้า' },
      // ... other fields
    }]
    render(<DataTable tickets={tickets} detailBasePath="/tickets" />)
    expect(screen.getByText('ไฟฟ้า')).toBeInTheDocument()
  })
})
```

**Priority: HIGH** - Catches UI bugs early

---

### C. Integration Tests (10% of test time)

**What to test:**

- RLS policies enforcement
- Ticket creation flow (authentication → form → database)
- Comment creation with realtime subscription setup
- User permission checks

**Example:**

```typescript
// __tests__/integration/ticket-creation.test.ts
import { createClient } from '@supabase/supabase-js'

describe('Ticket Creation - Integration', () => {
  it('should respect RLS: resident can only create own tickets', async () => {
    const residentClient = createClient(SUPABASE_URL, RESIDENT_KEY)
    const { data, error } = await residentClient
      .from('tickets')
      .insert({ user_id: OTHER_USER_ID, title: 'test' })

    expect(error).toBeDefined() // RLS should reject
  })

  it('should auto-log status change in ticket_history', async () => {
    const adminClient = createClient(SUPABASE_URL, ADMIN_KEY)

    // Create ticket
    const { data: ticket } = await adminClient
      .from('tickets')
      .insert({ ... })

    // Update status
    await adminClient
      .from('tickets')
      .update({ status: 'in_progress' })
      .eq('id', ticket.id)

    // Check trigger worked
    const { data: history } = await adminClient
      .from('ticket_history')
      .select('*')
      .eq('ticket_id', ticket.id)

    expect(history).toHaveLength(1)
  })
})
```

**Priority: MEDIUM** - Test critical business logic and security

---

### D. E2E Tests (5% of test time - initially)

**What to test:**

- Complete user journeys: login → create ticket → add comment → see update
- Realtime comment updates between two browsers
- Admin status update workflow
- LINE notification trigger (mock webhook)

**Example:**

```typescript
// e2e/ticket-creation.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Resident Ticket Creation Flow', () => {
  test('should create ticket and see realtime admin response', async ({ page, context }) => {
    // Resident browser
    await page.goto('/auth/login')
    await page.fill('[name="email"]', 'resident@test.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button:has-text("เข้าสู่ระบบ")')

    // Create ticket
    await page.goto('/resident/tickets/new')
    await page.fill('[name="title"]', 'AC not working')
    await page.selectOption('[name="category"]', 'air_conditioning')
    await page.click('button:has-text("สร้างแจ้งซ่อม")')

    const ticketId = page.url().match(/\/resident\/tickets\/(.+)/)[1]

    // Admin browser (new context - separate login)
    const adminPage = await context.newPage()
    await adminPage.goto('/admin/tickets/' + ticketId)

    // Resident adds comment
    await page.fill('[name="comment"]', 'Please fix ASAP')
    await page.click('button:has-text("ส่งความเห็น")')

    // Admin should see it realtime
    await expect(adminPage.locator(':has-text("Please fix ASAP")')).toBeVisible({ timeout: 5000 })
  })
})
```

**Priority: LOW initially** - Set up after unit/integration tests pass

---

## 3. Critical Areas to Test First (MVP Focus)

### TIER 1 - Security & Data Integrity (Must Have)

- [ ] RLS policies: Resident cannot see other residents' tickets
- [ ] RLS policies: Residents cannot update admin fields (assigned_to, completed_at)
- [ ] RLS policies: Categories table readable by all authenticated users
- [ ] Authentication: Password reset flow works end-to-end
- [ ] Auth trigger: New user automatically gets profile created

### TIER 2 - Core Features (Must Have)

- [ ] Ticket creation with categories joins correctly
- [ ] Comment creation and realtime subscription works
- [ ] Status update trigger logs to ticket_history correctly
- [ ] Image uploads to storage bucket work
- [ ] File storage RLS allows public read, auth-user write

### TIER 3 - User Experience (Should Have)

- [ ] Data table sorting by created_at DESC works
- [ ] Data table search filters title/description/room correctly
- [ ] Status filter tabs work (pending/in_progress/completed/cancelled)
- [ ] Date formatting respects Asia/Bangkok timezone
- [ ] Form validation shows proper error messages (Thai language)

### TIER 4 - Integration Features (Nice to Have)

- [ ] LINE notification sends when new ticket created
- [ ] LINE webhook payload parses correctly
- [ ] Admin receives LINE message with ticket category (now fixed!)
- [ ] Analytics page counts categories correctly (from joined data)

---

## 4. Setup Instructions

### 4.1 Install Testing Dependencies

```bash
npm install --save-dev \
  vitest \
  @vitest/ui \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  @playwright/test \
  @supabase/supabase-js \
  jsdom
```

### 4.2 Create Test Configuration Files

**vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'test/'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
```

**vitest.setup.ts**

```typescript
import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'

// Mock Next.js router
vi.mock('next/router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    pathname: '/',
    query: {},
  }),
}))
```

### 4.3 Add Test Scripts to package.json

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

---

## 5. Structure & File Organization

```
project/
├── __tests__/
│   ├── unit/
│   │   ├── lib/
│   │   │   ├── utils.test.ts
│   │   │   └── constants.test.ts
│   │   └── helpers/
│   │       └── category.test.ts
│   ├── integration/
│   │   ├── rls-policies.test.ts
│   │   ├── ticket-creation.test.ts
│   │   └── comments-realtime.test.ts
│   └── setup.ts
├── components/
│   ├── ui/
│   │   ├── __tests__/
│   │   │   ├── data-table.test.tsx
│   │   │   ├── combobox.test.tsx
│   │   │   └── input.test.tsx
│   │   └── data-table.tsx
│   └── ...
├── e2e/
│   ├── ticket-creation.spec.ts
│   ├── comments-realtime.spec.ts
│   ├── admin-workflow.spec.ts
│   └── fixtures/
│       ├── test-user.ts
│       └── test-data.ts
├── vitest.config.ts
├── vitest.setup.ts
└── playwright.config.ts
```

---

## 6. Testing Timeline (Recommendation)

### Week 1: Foundation

- [ ] Set up Vitest, React Testing Library
- [ ] Create 10-15 unit tests for utils & constants
- [ ] Setup coverage reporting

### Week 2: Components

- [ ] Write component tests for forms (login, ticket creation)
- [ ] Test data-table sorting/filtering
- [ ] 20-25 component tests

### Week 3: Integration & RLS

- [ ] Setup Supabase local for integration testing
- [ ] Write RLS policy tests (5-10 tests)
- [ ] Test ticket creation workflow (3-5 tests)
- [ ] Test comment subscription setup

### Week 4: E2E & CI

- [ ] Setup Playwright
- [ ] Create 3-5 critical user journey tests
- [ ] Setup GitHub Actions CI pipeline
- [ ] Aim for 70%+ code coverage

---

## 7. CI/CD Integration (GitHub Actions)

**`.github/workflows/test.yml`**

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - run: npm ci
      - run: npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install
      - run: npm run test:e2e

      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 8. Key Testing Considerations for Fixit

### Realtime Testing

- Use Vitest's `vi.waitFor()` or Playwright's `waitForFunction()`
- Test subscription cleanup on unmount
- Mock postgres_changes events in unit tests
- Use separate browser contexts for E2E realtime tests

### RLS Policy Testing

- Create separate Supabase clients with different roles
- Verify each policy: SELECT, INSERT, UPDATE, DELETE
- Test column-level security (e.g., only admins can update certain columns)
- Verify trigger permissions (user creation, history logging)

### Category Fixes Validation

- Test that categories join returns { name: string } correctly
- Verify old tests expecting string category are updated
- Check data-table displays category name (not UUID)
- Verify admin/resident pages both show categories

### File Upload Testing

- Mock Storage API responses
- Test error handling (file too large, wrong format)
- Verify image URLs stored correctly in tickets table
- Test RLS bucket policies in local environment

---

## 9. Tools Reference

| Tool                          | Purpose                     | Installation                               |
| ----------------------------- | --------------------------- | ------------------------------------------ |
| **Vitest**                    | Fast unit test runner       | `npm install -D vitest`                    |
| **@testing-library/react**    | Component testing utilities | `npm install -D @testing-library/react`    |
| **@testing-library/jest-dom** | Custom matchers             | `npm install -D @testing-library/jest-dom` |
| **Playwright**                | E2E browser automation      | `npm install -D @playwright/test`          |
| **jsdom**                     | DOM simulation for Node.js  | `npm install -D jsdom`                     |
| **@vitest/coverage-v8**       | Coverage reporting          | `npm install -D @vitest/coverage-v8`       |

---

## 10. Best Practices for This Project

1. **Test RLS First**: Before testing any UI, ensure RLS policies work correctly
   - This is critical for multi-user/multi-role security

2. **Use Realistic Data**: Create fixtures with Thai text, valid timestamps, real category IDs
   - Catches bugs with localization and timezone issues

3. **Test the User's Perspective**:
   - Test what a resident sees (can create, view own tickets)
   - Test what an admin sees (can create, view all, update)
   - Test denied actions (resident can't access admin features)

4. **Mock External Services**:
   - Mock LINE API in tests
   - Mock storage in unit tests
   - Use real Supabase local for integration tests

5. **Keep Tests Close to Code**: Place component tests next to components
   - `components/ui/data-table.tsx` + `components/ui/__tests__/data-table.test.tsx`

---

## Next Steps

1. **Create initial test setup** (vitest.config.ts + setup files)
2. **Write 5-10 basic unit tests** for utils (quick wins)
3. **Test the recent category fixes** - verify joins work correctly
4. **Establish testing culture** - review tests in PRs
5. **Expand incrementally** - categorize/prioritize by business impact

Would you like me to create:

- [ ] A sample unit test file?
- [ ] Integration test setup for local Supabase?
- [ ] Example E2E test for ticket creation?
- [ ] GitHub Actions CI configuration?
