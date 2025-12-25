# Product Requirements Document  
## AI-Guided Journaling Application

---

## 1. Executive Summary

### 1.1 Product Overview

The **AI-Guided Journaling Application** is a secure, web-based journaling platform designed to help users reflect, process emotions, and build consistent journaling habits through intelligent AI-driven prompts.

Unlike traditional journaling apps, this product dynamically responds to what a user writes. As users begin a journal entry, AI analyzes the content in real time and generates personalized follow-up prompts and reflective questions that encourage deeper self-exploration.

The application leverages modern frontend frameworks, secure backend infrastructure, and generative AI to create a private, thoughtful, and habit-forming journaling experience.

---

### 1.2 Business Objectives

- **Mental Wellness Support**: Encourage healthy emotional processing through guided reflection  
- **Consistency & Habit Formation**: Reduce friction and writer’s block for journaling  
- **Personalization at Scale**: Use AI to adapt prompts to each user’s emotional context  
- **Privacy & Trust**: Ensure user data is secure, encrypted, and never shared  
- **Monetization Foundation**: Support subscription-based access via Stripe  
- **Scalable Architecture**: Build a foundation for rapid iteration and long-term growth  

---

## 2. Problem Statement & Opportunity

### 2.1 Problem Statement

Many people struggle to journal consistently due to:
- Not knowing what to write
- Feeling overwhelmed by emotions
- Writer’s block after the first few sentences
- Static prompts that feel generic or repetitive

Existing journaling apps often provide either blank pages with no guidance or prewritten prompts that do not adapt to the user’s real thoughts. This leads to low engagement, abandoned habits, and limited emotional benefit.

---

### 2.2 Opportunity

Advances in generative AI make it possible to:
- Respond intelligently to user-written content in real time
- Ask meaningful follow-up questions that deepen reflection
- Create a conversational journaling experience rather than a static one

The opportunity is to build a trusted AI-powered reflection companion that helps users think more clearly, understand their emotions, and journal more consistently without replacing human introspection.

---

## 3. Target Users & User Personas

### 3.1 Primary Personas

**Persona 1 – Sam (College Student, Age 21)**  
Sam experiences academic pressure and social stress. They want to journal but often stop after a few sentences because they do not know how to go deeper. They want something supportive, private, and non-judgmental.

**Persona 2 – Maya (Young Professional, Age 28)**  
Maya journals to manage stress after work. She values structure and reflection but finds generic prompts repetitive. She wants personalized questions that help her understand patterns in her thinking.

**Persona 3 – Alex (Therapy-Adjacent User, Age 35)**  
Alex journals as a supplement to therapy. They want thoughtful prompts that encourage introspection without offering diagnoses or advice. Privacy and data security are critical.

---

## 4. MVP Feature Specifications

| Feature | User Story | Acceptance Criteria |
|-------|-----------|---------------------|
| User Authentication | As a user, I want to log in securely with Google | Google OAuth via Supabase Auth works reliably |
| Journal Entry Creation | As a user, I want to write journal entries freely | Entries autosave and persist correctly |
| AI Prompt Generation | As a user, I want AI to ask follow-up questions based on what I write | Prompts are contextually relevant and non-repetitive |
| Conversational Journaling | As a user, I want journaling to feel guided | AI prompts appear inline or sequentially |
| Entry Storage | As a user, I want my past entries saved securely | Entries stored in Supabase PostgreSQL |
| Subscription Billing | As a user, I want to upgrade to premium features | Stripe checkout works securely |
| Free Tier Limits | As a user, I want clarity on free vs paid usage | Usage limits clearly communicated |
| Performance | As a user, I want the app to feel fast | Edge Functions reduce latency |

---

## 5. Future Roadmap

### 5.1 Short-Term (v1.1–1.5)

- Emotion tagging and summaries
- Prompt style customization (gentle, probing, philosophical)
- Daily reflection streaks
- Entry search and filters
- Export entries as PDF

### 5.2 Long-Term (v2.0+)

- Long-term insight summaries and patterns
- Mood visualization dashboards
- Therapist-shareable summaries (opt-in)
- Voice-to-text journaling
- On-device AI for enhanced privacy

---

## 6. Success Metrics

| Metric | Target | Measurement Method |
|------|--------|-------------------|
| Average session length | ≥ 5 minutes | Analytics |
| Journaling frequency | ≥ 3 entries/week | Database analysis |
| AI response latency | < 1 second | Edge Function logs |
| 30-day retention | ≥ 40% | Cohort analysis |
| Paid conversion rate | ≥ 5% | Stripe analytics |
| User trust rating | ≥ 90% positive | In-app surveys |

---

## 7. Product Requirements

### 7.1 Functional Requirements

#### Core Features

- **FR-001**: Create, edit, and delete journal entries
- **FR-002**: Generate AI prompts based on journal content
- **FR-003**: Store journal entries in Supabase PostgreSQL
- **FR-004**: Authenticate users via Google OAuth
- **FR-005**: Process subscriptions via Stripe
- **FR-006**: Enforce usage limits for free-tier users
- **FR-007**: Use Supabase Edge Functions for AI requests

#### AI Behavior

- **FR-008**: AI must ask reflective questions, not give advice
- **FR-009**: AI must avoid medical or diagnostic claims
- **FR-010**: AI tone should be neutral, supportive, and non-judgmental
- **FR-011**: AI should minimize repetition and generic prompts

---

### 7.2 Non-Functional Requirements

#### Technical

- **NFR-001**: Frontend built with Next.js (Node.js, npm)
- **NFR-002**: Backend powered by Supabase (PostgreSQL, Auth, Buckets)
- **NFR-003**: OpenAI API keys stored server-side only
- **NFR-004**: Stripe keys never exposed client-side
- **NFR-005**: Edge Functions handle AI requests securely

#### Performance

- **NFR-006**: AI response time < 1 second
- **NFR-007**: Page load time < 2 seconds
- **NFR-008**: Autosave latency < 300 ms

#### Security & Privacy

- **NFR-009**: All user data encrypted at rest
- **NFR-010**: Row-level security enforced in Supabase
- **NFR-011**: Journal content is not used to train AI models
- **NFR-012**: Clear and transparent privacy disclosures

---

## 8. Technical Specifications

### 8.1 Technology Stack

| Component | Technology |
|---------|------------|
| Frontend | Next.js, Node.js, npm |
| Backend | Supabase (PostgreSQL, Auth, Buckets) |
| AI | OpenAI API |
| Authentication | Supabase Auth (Google OAuth) |
| Payments | Stripe |
| Server Logic | Supabase Edge Functions |
| Deployment | Vercel |
| Development Environment | Cursor |

---

### 8.2 Data Models (High-Level)

#### Users
- id
- email
- subscription_status
- created_at

#### Journal Entries
- id
- user_id
- content
- created_at
- updated_at

#### AI Prompts
- id
- entry_id
- prompt_text
- created_at

---

## 9. User Experience Requirements

### 9.1 Design Principles

- Calm, minimal, non-clinical aesthetic
- Distraction-free writing environment
- Conversational UI for AI prompts
- Clear visual distinction between user text and AI prompts

### 9.2 Accessibility

- Keyboard-friendly navigation
- Screen reader compatibility
- WCAG 2.1 AA compliance
- Adjustable text size and contrast

---

## 10. Implementation Phases

### Phase 1: Authentication & Database Setup
- Supabase Auth with Google OAuth
- Database schema creation
- Row-level security policies

### Phase 2: Journaling UI
- Journal editor and autosave
- Entry history and retrieval
- Responsive layout

### Phase 3: AI Prompting
- Edge Function integration
- OpenAI prompt engineering
- Usage and rate limiting

### Phase 4: Payments & Gating
- Stripe checkout integration
- Subscription tiers
- Feature access control

---

## 11. Open Questions

1. How conversational should AI prompts feel?
2. Should AI generate summaries automatically?
3. What usage limits make sense for free users?
4. Can users regenerate or edit AI prompts?
5. How explicit should privacy disclosures be during onboarding?

---

## 12. Appendices

### 12.1 Ethical AI Guidelines

- No medical, psychological, or diagnostic advice
- No emotional manipulation or dependency
- User retains full ownership of all content

### 12.2 References

- Supabase Documentation  
- OpenAI API Documentation  
- Stripe API Documentation  
- WCAG 2.1 Accessibility Guidelines  

---
