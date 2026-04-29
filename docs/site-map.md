# QuestLab Site Map and Product Structure

## Vision

QuestLab - programming, mathematics, physics, logic and future technical fields uchun global problem-solving platforma. Maqsad Brilliantning interaktiv konsept o'qitishi, LeetCodening kuchli coding judge tajribasi, Khan Academy uslubidagi learning path, Kaggle/Codeforces uslubidagi challenge community va o'zimizning adaptive skill graph tizimini bitta platformada birlashtirish.

Platforma boshidan modular quriladi:

- Web app: user-facing learning, practice, competition and creator interfaces.
- Content system: problems, lessons, hints, solutions, simulations, tests, rubrics.
- Assessment engine: attempts, grading, adaptive difficulty, review scheduling.
- Judge service: programming tasks, test cases, sandbox execution, benchmarking.
- Learning graph: subjects, skills, prerequisites, mastery and recommendations.
- Analytics: learner progress, cohort metrics, content quality, question health.
- AI tutor: hints, explanation variants, mistake diagnosis, personalized drills.
- Creator ecosystem: teachers, experts, reviewers and organizations.

## Primary User Roles

### Learner

Platformaning asosiy foydalanuvchisi. U mavzu o'rganadi, masala yechadi, code submit qiladi, progress ko'radi, challenge va contestlarda qatnashadi.

### Creator

Savol, lesson, hint, solution, testcase, simulation va course yaratadigan mutaxassis yoki o'qituvchi.

### Reviewer

Kontent sifatini tekshiradi: xatolik, duplicate, noto'g'ri javob, yomon hint, test weakness, plagiarism.

### Mentor

Learnerlarga feedback beradi, class yoki cohort yuritadi, assignment beradi.

### Organization

School, university, bootcamp yoki company. Team, class, curriculum, hiring test, analytics va billing boshqaradi.

### Admin

Platforma moderation, content governance, user support, system health va policy boshqaradi.

## Top-Level Navigation

### Public

- Home
- Explore
- Subjects
- Problems
- Courses
- Challenges
- Pricing
- For Schools
- For Companies
- Creators
- Login
- Sign up

### Authenticated Learner

- Dashboard
- Learn
- Practice
- Code Arena
- Labs
- Review
- Challenges
- Progress
- Community
- Profile

### Creator

- Creator Studio
- My Content
- Drafts
- Problem Builder
- Lesson Builder
- Testcase Builder
- Review Queue
- Content Analytics
- Payouts

### Organization

- Organization Dashboard
- Classes
- Members
- Assignments
- Curriculums
- Reports
- Hiring Tests
- Billing
- Settings

### Admin

- Admin Dashboard
- Users
- Content Moderation
- Reports
- Taxonomy
- System Health
- Feature Flags
- Audit Logs

## Public Site Structure

### `/`

Landing and product overview.

Main sections:

- Platform promise
- Subject coverage
- Product modules
- How adaptive learning works
- Code judge preview
- Concept lab preview
- Creator ecosystem
- Organization use cases
- Roadmap or credibility markers
- Sign up CTA

### `/explore`

Global discovery page.

Content:

- Featured subjects
- Trending problem sets
- New interactive labs
- Beginner paths
- Contest calendar
- Community picks
- Recommended by goal: interview, olympiad, university, curiosity, school

### `/subjects`

All domains and subjects.

Initial subjects:

- Programming
- Mathematics
- Physics
- Logic
- Algorithms
- Data Structures
- Statistics
- Computer Science Foundations

Future subjects:

- Chemistry
- Biology
- Economics
- AI and Machine Learning
- Electronics
- Engineering
- Finance
- Language logic

### `/subjects/[subject]`

Subject hub.

Examples:

- `/subjects/programming`
- `/subjects/mathematics`
- `/subjects/physics`

Sections:

- Skill map
- Recommended path
- Popular problems
- Courses
- Labs
- Challenges
- Mastery levels
- Community discussions

### `/problems`

Problem bank discovery.

Filters:

- Subject
- Skill
- Difficulty
- Type
- Duration
- Language
- Source
- Verified status
- Free or premium
- Has interactive lab
- Has official solution

Problem types:

- Multiple choice
- Numeric answer
- Proof
- Coding
- Debugging
- Simulation-based
- Drag-and-drop ordering
- Graph/diagram reasoning
- Open response
- Case study

### `/problems/[slug]`

Problem solving page.

Core areas:

- Problem statement
- Input/output or answer panel
- Hints
- Scratchpad
- Code editor if coding problem
- Simulation panel if lab problem
- Discussion after solve
- Official solution
- Similar problems
- Skill impact
- Mistake tags

### `/courses`

Structured courses.

Course examples:

- Algorithms from Zero
- Calculus for Problem Solvers
- Physics Mechanics Lab
- Competitive Programming Foundations
- Mathematical Proofs
- Data Structures Interview Track

### `/courses/[slug]`

Course detail and learning path.

Sections:

- Overview
- Prerequisites
- Syllabus
- Lessons
- Practice sets
- Projects or labs
- Completion certificate
- Reviews

### `/challenges`

Time-based and goal-based challenges.

Types:

- Daily challenge
- Weekly sprint
- Interview set
- Olympiad set
- Physics lab challenge
- Math proof challenge
- Company-sponsored hiring challenge
- Community challenge

### `/challenges/[slug]`

Challenge detail.

Sections:

- Rules
- Problem list
- Timer
- Leaderboard
- Submission history
- Editorial after challenge

### `/pricing`

Plans:

- Free
- Pro learner
- Creator
- School
- Company
- Enterprise

### `/for-schools`

School and university offering.

Features:

- Classes
- Assignments
- Curriculum mapping
- Progress reports
- Teacher dashboards
- Plagiarism signals
- Private content

### `/for-companies`

Hiring and workforce learning.

Features:

- Technical assessments
- Role-based test templates
- Proctored challenges
- Team upskilling
- Skill analytics
- Candidate reports

### `/creators`

Creator ecosystem landing.

Features:

- Create problems
- Publish courses
- Earn payouts
- Collaborate with reviewers
- Analytics on content quality

## Authenticated Learner App

### `/dashboard`

Main learner home.

Widgets:

- Continue learning
- Daily goal
- Weak skills
- Review due
- Active streak
- Recent submissions
- Recommended next problems
- Upcoming contests
- Mastery progress

### `/learn`

Learning path hub.

Views:

- My paths
- Recommended paths
- Subject paths
- Goal paths
- Saved courses

### `/learn/[path]`

Path player.

Content:

- Current lesson
- Concept explanation
- Interactive checks
- Practice blocks
- Summary
- Next step

### `/practice`

Practice session setup.

Options:

- Subject
- Skill
- Difficulty
- Session length
- Problem type
- Goal: learn, speed, accuracy, review, exam prep

### `/practice/session/[id]`

Live adaptive practice.

Areas:

- Problem card
- Answer area
- Hint ladder
- Confidence marker
- Timer
- Explanation after answer
- Next recommendation

### `/review`

Spaced review and mistake correction.

Sections:

- Due now
- Repeated mistakes
- Concept gaps
- Recently failed
- Bookmarked
- AI-generated drills

### `/code`

Code Arena home.

Sections:

- Problems
- Tracks
- Interview prep
- Contests
- Submissions
- Language setup

### `/code/problems/[slug]`

Coding problem page.

Core areas:

- Statement
- Constraints
- Examples
- Code editor
- Test runner
- Submit
- Verdict
- Complexity notes
- Editorial
- Discussion

### `/labs`

Interactive concept labs.

Lab examples:

- Projectile motion
- Conservation of energy
- Graph traversal visualizer
- Binary search visual proof
- Derivative intuition
- Probability simulator

### `/labs/[slug]`

Interactive lab page.

Areas:

- Simulation
- Controls
- Guided questions
- Checkpoints
- Explanation
- Related practice

### `/progress`

Learner analytics.

Metrics:

- Mastery by subject
- Skill graph
- Accuracy
- Speed
- Review retention
- Submission history
- Heatmap
- Certificates
- Goal progress

### `/community`

Community hub.

Features:

- Discussions
- Problem comments
- Study rooms
- Creator posts
- Solution explanations
- Moderated Q&A

### `/profile/[username]`

Public or semi-public profile.

Includes:

- Bio
- Badges
- Solved count
- Skill strengths
- Contest history
- Published solutions
- Creator content if applicable

### `/settings`

User settings.

Sections:

- Account
- Profile
- Learning preferences
- Notification preferences
- Coding languages
- Privacy
- Billing
- Connected accounts

## Creator Studio

### `/creator`

Creator dashboard.

Widgets:

- Drafts
- Review status
- Published content
- Quality score
- Learner performance
- Revenue
- Feedback

### `/creator/problems/new`

Problem builder.

Problem fields:

- Title
- Slug
- Subject
- Skills
- Difficulty
- Statement
- Answer type
- Hints
- Solution
- Explanation variants
- Test cases
- Rubric
- Source and license
- Review notes

### `/creator/problems/[id]/edit`

Edit existing problem.

Includes:

- Version history
- Preview
- Validation
- Review submission

### `/creator/lessons/new`

Lesson builder.

Blocks:

- Text
- Formula
- Image
- Video
- Interactive question
- Simulation embed
- Code snippet
- Checkpoint

### `/creator/testcases`

Coding testcase builder.

Features:

- Public examples
- Hidden tests
- Stress tests
- Generators
- Validators
- Expected outputs
- Runtime limits
- Memory limits

### `/creator/reviews`

Content review queue.

States:

- Draft
- Submitted
- Needs changes
- Approved
- Published
- Deprecated

### `/creator/analytics`

Content analytics.

Metrics:

- Solve rate
- Drop-off points
- Hint usage
- Average time
- Report count
- Skill effectiveness
- Revenue

## Organization Area

### `/org/[orgSlug]`

Organization dashboard.

Sections:

- Active classes
- Assignments
- Learner progress
- Risk alerts
- Upcoming deadlines
- Content usage

### `/org/[orgSlug]/classes`

Class management.

Features:

- Create class
- Invite students
- Assign teachers
- Group learners
- Import roster

### `/org/[orgSlug]/assignments`

Assignment builder and tracking.

Assignment types:

- Problem set
- Course module
- Timed quiz
- Coding assessment
- Lab report
- Review session

### `/org/[orgSlug]/reports`

Reports.

Views:

- Learner report
- Class report
- Skill report
- Assignment report
- Export CSV/PDF

### `/org/[orgSlug]/hiring`

Company hiring tests.

Features:

- Role templates
- Candidate invites
- Time windows
- Anti-cheat signals
- Review rubric
- Candidate comparison

## Admin Area

### `/admin`

Admin overview.

Widgets:

- System health
- New reports
- Pending reviews
- Abuse signals
- Content growth
- User growth

### `/admin/taxonomy`

Subject, topic and skill graph management.

Entities:

- Domain
- Subject
- Topic
- Skill
- Prerequisite edge
- Difficulty calibration

### `/admin/content`

Content governance.

Actions:

- Approve
- Reject
- Deprecate
- Merge duplicates
- Feature content
- Lock content

### `/admin/users`

User management.

Actions:

- Search users
- View activity
- Manage roles
- Suspend
- Restore
- Support impersonation with audit log

### `/admin/reports`

Reports and moderation.

Report types:

- Incorrect answer
- Ambiguous wording
- Broken testcase
- Inappropriate content
- Plagiarism
- Abuse

## Core Content Model

### Domain

Large area such as STEM, Computer Science, Mathematics.

### Subject

Programming, Physics, Mathematics, Logic.

### Topic

Algorithms, Mechanics, Calculus, Graph Theory.

### Skill

Atomic learnable unit.

Examples:

- Binary search invariant
- Conservation of mechanical energy
- Chain rule
- Modular arithmetic

### Problem

Assessable item connected to skills.

Important fields:

- Type
- Difficulty
- Estimated time
- Skills
- Prerequisites
- Statement
- Answer schema
- Hints
- Solution
- Explanation
- Review status
- Quality metrics

### Lesson

Concept teaching unit.

### Lab

Interactive simulation or visualization.

### Path

Ordered learning route built from lessons, labs and problem sets.

### Session

Learner practice attempt sequence.

### Attempt

One user answer or code submission.

### Verdict

Result of attempt: correct, wrong, partial, timeout, runtime error, compile error, skipped.

## Question Types

### Knowledge and Concept

- Single choice
- Multiple choice
- True/false
- Numeric
- Short text
- Formula

### Reasoning

- Proof step ordering
- Diagram interpretation
- Graph reasoning
- Case analysis
- Estimate and justify

### Programming

- Function implementation
- Full program
- SQL query
- Debugging
- Output prediction
- Complexity analysis

### Interactive

- Simulation parameter tuning
- Drag-and-drop
- Visual construction
- Geometry interaction
- Circuit or physics lab

### Assessment

- Timed quiz
- Adaptive test
- Contest
- Interview assessment
- Assignment

## Main User Flows

### New Learner Onboarding

1. Sign up
2. Choose goals
3. Select subjects
4. Take diagnostic
5. Receive skill graph baseline
6. Start recommended path

### Daily Practice

1. Open dashboard
2. See review due and next skill
3. Start adaptive session
4. Solve 5-15 problems
5. Receive mistake diagnosis
6. Update mastery

### Coding Problem Flow

1. Open Code Arena
2. Filter problem
3. Read statement
4. Run sample tests
5. Submit
6. Receive verdict
7. Review hidden case category
8. Read editorial after sufficient effort

### Concept Lab Flow

1. Open lab
2. Change parameters
3. Answer guided checkpoints
4. See explanation
5. Solve related problems
6. Add skill mastery

### Creator Publishing Flow

1. Create draft
2. Add taxonomy and difficulty
3. Add hints and solution
4. Validate answer schema or testcases
5. Submit review
6. Reviewer approves or requests changes
7. Publish
8. Monitor analytics

### Organization Assignment Flow

1. Create class
2. Select path or problem set
3. Configure deadline and rules
4. Assign learners
5. Track attempts
6. Review reports

## MVP Scope

MVP should not try to build the whole global platform immediately. First version should prove the learning loop.

### MVP Pages

- `/`
- `/dashboard`
- `/subjects`
- `/subjects/[subject]`
- `/problems`
- `/problems/[slug]`
- `/practice`
- `/practice/session/[id]`
- `/review`
- `/code`
- `/code/problems/[slug]`
- `/progress`
- `/creator`
- `/creator/problems/new`

### MVP Features

- Static or seeded question bank
- Subject and skill taxonomy
- Problem solving UI
- Basic answer checking
- Practice session flow
- Coding problem UI mock or local judge placeholder
- Progress summary
- Creator problem builder draft
- Responsive layout and design system

### Not MVP Yet

- Full AI tutor
- Real secure code sandbox
- Payments
- Organization billing
- Marketplace payouts
- Advanced anti-cheat
- Mobile native app
- Complex moderation tooling

## Recommended Next.js App Structure

```txt
src/
  app/
    (public)/
      page.tsx
      explore/
      subjects/
      problems/
      courses/
      challenges/
    (learner)/
      dashboard/
      learn/
      practice/
      review/
      code/
      labs/
      progress/
      community/
      settings/
    (creator)/
      creator/
    (org)/
      org/
    (admin)/
      admin/
    api/
  entities/
    problem/
    skill/
    subject/
    attempt/
    user/
  features/
    adaptive-practice/
    answer-checking/
    code-runner/
    learning-graph/
    progress-tracking/
    creator-studio/
  shared/
    ui/
    lib/
    config/
    types/
```

## Long-Term Platform Modules

### Learning Graph Service

Responsible for taxonomy, prerequisites, mastery and recommendation signals.

### Assessment Service

Responsible for sessions, attempts, grading and review scheduling.

### Judge Service

Responsible for code execution, testcases, verdicts and sandboxing.

### Content Service

Responsible for problems, lessons, labs, courses and publishing workflow.

### User and Organization Service

Responsible for auth, profiles, roles, teams, classes and permissions.

### Analytics Service

Responsible for dashboards, insights, content quality and learner metrics.

### AI Tutor Service

Responsible for hint generation, mistake diagnosis, explanation variants and personalized drills.

## Success Metrics

### Learner Metrics

- Daily active learners
- Session completion rate
- Problems solved per learner
- Review return rate
- Mastery improvement
- Time to first correct solve

### Content Metrics

- Solve rate
- Hint usage
- Report rate
- Drop-off rate
- Difficulty calibration accuracy
- Duplicate rate

### Platform Metrics

- Activation rate
- Retention
- Creator publish rate
- Organization adoption
- Judge reliability
- Page performance

## First Build Order

1. Define design system and app shell.
2. Build public subject and problem discovery.
3. Create local seed data for subjects, skills and problems.
4. Build problem solving page.
5. Build practice session engine in frontend.
6. Add progress model.
7. Add creator draft builder.
8. Add backend persistence.
9. Add real answer checking and judge service.
10. Add AI tutor and organization features.
