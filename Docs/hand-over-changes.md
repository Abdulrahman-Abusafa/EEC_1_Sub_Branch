# Hand-Over Branch — CMS Key Changes (v2, code-verified)

This document is the working guideline for three key changes to the EEC Club CMS
(admin course editor + public course page). All changes are scoped to the
**course management** flow.

Branch: `hand-over`

> **v2 note.** Every claim in v1 was checked against the source in `app.zip`.
> Line numbers and the general plan were correct. Four issues were found that
> would have caused silent data loss or a failed acceptance criterion; they are
> marked **⚠ BLOCKER** below. A list of pre-existing bugs found during the review
> is in Appendix B — read it before you start, because two of them sit directly
> on the code paths you are about to touch.

**Path note:** the archive uses `front_end/` and `back_end/` (underscores). This
document uses `front-end/` and `back-end/` to match the repo layout. Same files.

---

## Current State Summary

- **Courses** — `courses` table (`back-end/schema.sql`). Fields: `course_id`,
  `title`, `description`, `level`, `credits`, `difficulty`, `prerequisites`,
  `objectives`, `books` (JSON as TEXT), `major_1_date`, `major_2_date`,
  `final_date`.
- **Resources** — `resources` table, linked via `course_id`. Columns:
  `category` (CHECK: `Lecture` | `Exam` | `Material` | `Quiz` | `Other`),
  `sub_category` (`Videos`, `Quizzes`, `Books & Notes`, `Major 1`, `Major 2`,
  `Final`, `Chapter`), `unit`, `semester`, `chapter`.
- **No ordering column exists** — `GET /resources` returns `ORDER BY id`.
- **CMS** (`front-end/app/admin/courses/page.tsx`): on save,
  `saveAllResources()` deletes **all** existing resources for the course and
  re-creates them from local state.
- **Public course page** (`front-end/app/academics/[courseId]/page.tsx`):
  groups resources via `groupResources()` and renders Videos, Quizzes,
  Books & Notes, Old Exams, By Chapter, Other. A "Learning Objectives" box sits
  above the resources grid (ends line 642).

### Three facts v1 got wrong or omitted — read these first

1. **Insertion order is not actually preserved today.** `saveAllResources()`
   ends with `await Promise.all(allResources.map(r => createResource(r)))`
   (line ~570). Those POSTs are concurrent, so the `SERIAL` ids they receive are
   in **nondeterministic order**. `ORDER BY id` therefore already produces
   arbitrary ordering across saves. v1's claim that "array order in the CMS =
   insertion order = display order" is not true. This makes Change 1 a bug fix,
   not just a feature — and it means you must not lean on `id` as a tiebreaker.

2. **The public course page never calls `GET /courses/:courseId`.** It calls
   `fetchCourses()` (the list endpoint) and then `.find()` on the result
   (line ~510–521). `GET /courses` is **Redis-cached for one hour**
   (`cacheKey = "all_courses"`). Any course-level field you add must be in the
   **list** query, and the cache must be invalidated correctly or Change 3 will
   appear not to work.

3. **`saveAllResources()` destroys anything `fetchResources()` didn't parse.**
   The save path is delete-everything-then-recreate-from-state. If a resource
   category exists in the DB but has no parsing branch in `fetchResources()`, it
   is absent from local state and is **permanently deleted on the next save of
   that course**. This is the single biggest risk in Change 2.

---

## Change 1 — Reorder Lectures (Videos) in the CMS

### Goal
The admin must be able to reorder video/lecture entries explicitly and
persistently.

### What "lectures" means here
The **Videos** section is the lecture content (`category = 'Lecture'`,
`sub_category = 'Videos'`) — links to video playlists.

### Database changes (`back-end/schema.sql` + migration in `server.js`)

1. Add `sort_order` to the `resources` table in `schema.sql` (inside the
   `CREATE TABLE` body, for fresh installs):
   ```sql
   sort_order  INTEGER NOT NULL DEFAULT 0,
   ```
2. Add the migration to the auto-migration block in `back-end/server.js`
   (line ~46, alongside the existing `ALTER TABLE resources ...` statements):
   ```sql
   ALTER TABLE resources ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
   ```
3. Optional but recommended, since every query filters by course:
   ```sql
   CREATE INDEX IF NOT EXISTS resources_course_sort_idx ON resources (course_id, sort_order, id);
   ```

> **Migration safety.** The whole block is one `pool.query()` with a single
> `try/catch` that only does `console.error`. If **any** statement in it fails,
> **all** of them are rolled back and the server still boots looking healthy.
> After deploying, confirm `✓ DB migrations applied` appears in the log — do not
> assume it ran.

### Backend changes (`back-end/server.js`)

1. **GET `/resources`** (line 271): change `query += " ORDER BY id"` to
   `query += " ORDER BY sort_order ASC, id ASC"`.
2. **POST `/resources`** (line 290): accept `sort_order`, add it to the INSERT
   column list and values, default `0`:
   ```js
   const { course_id, resource_title, url, category, sub_category, semester, chapter, unit, sort_order } = req.body;
   // ...
   `INSERT INTO resources (course_id, resource_title, url, category, sub_category, semester, chapter, unit, sort_order)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
   [course_id, resource_title, url, category, sub_category || null, semester || null,
    chapter || null, unit || null, Number.isFinite(sort_order) ? sort_order : 0]
   ```
   Use `Number.isFinite`, **not** `sort_order || 0` — the latter is fine here
   but the same idiom elsewhere silently converts a legitimate `0` into a
   default, so keep the habit explicit.
3. **PUT `/resources/:id`** (line 306): add `sort_order=$8` to the SET clause and
   shift `WHERE id=$9`. Use `sort_order ?? 0` so an omitted field doesn't crash.

### CMS changes (`front-end/app/admin/courses/page.tsx`)

1. Add `ChevronUp` to the `lucide-react` import on **line 4** (`ChevronDown` is
   already imported).
2. In the **Videos Section** of the edit modal (line 715, rows render at
   line ~750), add up/down buttons to each row. Insert them next to the existing
   red `X` delete button (line ~776) so the row layout stays intact:
   ```tsx
   <div className="flex flex-col shrink-0">
     <button type="button" disabled={i === 0} onClick={() => moveVideo(i, -1)}
       className="p-0.5 disabled:opacity-25 hover:bg-black/5 dark:hover:bg-white/5 rounded"
       aria-label="Move video up">
       <ChevronUp size={14} />
     </button>
     <button type="button" disabled={i === videos.length - 1} onClick={() => moveVideo(i, 1)}
       className="p-0.5 disabled:opacity-25 hover:bg-black/5 dark:hover:bg-white/5 rounded"
       aria-label="Move video down">
       <ChevronDown size={14} />
     </button>
   </div>
   ```
3. One handler is enough — v1's two handlers duplicate the same swap:
   ```ts
   const moveVideo = (index: number, delta: -1 | 1) => {
     setVideos(prev => {
       const target = index + delta;
       if (target < 0 || target >= prev.length) return prev;
       const next = [...prev];
       [next[index], next[target]] = [next[target], next[index]];
       return next;
     });
   };
   ```
4. In `saveAllResources()` (line 432), set `sort_order` when pushing resources.

   **⚠ BLOCKER — do not use the entry index.** v1 says `sort_order: index`.
   For Videos that is correct (flat array). For Quizzes, Books & Notes, Old
   Exams and By Chapter the arrays hold *entries*, and a folder entry expands
   into N resource rows — so every file inside one folder would get the **same**
   `sort_order`, and their relative order would fall back to `id`, which (see
   fact 1 above) is nondeterministic. Use a running counter that increments per
   **pushed resource**, not per entry:
   ```ts
   let order = 0;

   videos.forEach(video => {
     allResources.push({
       course_id: courseId,
       resource_title: video.title,
       url: video.url,
       category: 'Lecture',
       sub_category: 'Videos',
       sort_order: order++,
     });
   });
   ```
   Then thread `sort_order: order++` through every other `allResources.push(...)`
   call in the function (quizzes single + folder items, books & notes single +
   list items, the three exam buckets, by-chapter). A single counter across all
   sections is fine: `groupResources()` buckets by category before rendering, so
   cross-section values never collide in practice, and a global counter
   guarantees uniqueness.

5. **Optional but strongly recommended:** replace the final
   `await Promise.all(allResources.map(r => createResource(r)))` (line ~570)
   with a sequential loop. `Promise.all` fires every POST at once; with a course
   that has 40 resources that is 40 concurrent connections against a single `pg`
   `Pool`, and any failure is swallowed by the outer `catch` (Appendix B.3).
   ```ts
   for (const resource of allResources) {
     await createResource(resource);
   }
   ```
   Slower, but ordering, error reporting and pool pressure all improve. With
   `sort_order` in place, correctness no longer depends on this — but it's the
   right time to fix it.

### ⚠ BLOCKER — the reload round-trip loses order for grouped sections

Acceptance criterion "reloading the edit modal preserves the saved order" will
**fail for everything except Videos** as written.

`fetchResources()` (line 202) collects folder items into plain objects
(`quizFolders`, `listGroups`, `examBuckets`, `chapterBuckets`) and then appends
the reconstructed folders **after** all the singles:
```ts
Object.entries(quizFolders).forEach(([folderName, items]) => {
  quizEntries.push({ type: 'folder', folderName, items });
});
```
So a saved list of `[single A, folder B, single C]` reloads as
`[single A, single C, folder B]`. The next save then persists that wrong order.
The same pattern exists in `groupResources()` on the public page (line 99) for
`booksAndNotes`.

Videos are unaffected — `videosList.push(...)` runs in API order, which is now
`sort_order` order.

**Two acceptable resolutions — pick one and record it:**

- **(a) Scope Change 1 to Videos only.** Still write `sort_order` for all
  resource types (it's free and fixes the nondeterminism from fact 1), but
  narrow the acceptance criterion to "video order round-trips". Leave grouped
  sections alone. *Recommended for this branch.*
- **(b) Fix the round-trip.** In `fetchResources()`, track the minimum
  `sort_order` seen per folder, build a combined array of
  `{ order, entry }` for singles and folders together, sort by `order`, then
  map to entries. Same treatment in `groupResources()` for `booksAndNotes`.
  Roughly 30 lines across the two files, and it changes the shape of a function
  Change 2 also touches — so if you do this, do it **before** Change 2.

### Front-end API type changes (`front-end/lib/api.ts`)
Add to the `Resource` type (line 74):
```ts
sort_order?: number;
```

### Public course page
No change needed. `groupResources()` preserves API order, which is now
`sort_order`-based.

### Acceptance criteria
- [ ] Admin can move a video up/down in the CMS edit modal.
- [ ] First item's up arrow and last item's down arrow are disabled.
- [ ] After saving, the public course page shows videos in the new order.
- [ ] Reloading the edit modal preserves the saved **video** order.
- [ ] `sort_order` is written for every resource type (non-zero, no duplicates
      within a course) — verify with
      `SELECT sort_order, sub_category, resource_title FROM resources WHERE course_id='EE201' ORDER BY sort_order;`
- [ ] Saving the same course twice produces the same public-page order both
      times (regression test for the `Promise.all` nondeterminism).

---

## Change 2 — Add a Homeworks Section

### Goal
A new "Homeworks" section: admin adds homework files (single or grouped) in the
CMS; it renders as its own section on the public course page.

### Database changes

Widen the `resources.category` CHECK constraint to include `Homework`.

1. **`back-end/schema.sql`** — update the inline constraint in the `CREATE TABLE`
   (line 30) so fresh installs get it:
   ```sql
   category TEXT NOT NULL CHECK (category IN ('Lecture','Exam','Material','Quiz','Homework','Other')),
   ```
2. **`back-end/server.js`** — the migration block already drops and recreates
   this constraint (lines 55–56). Just add `'Homework'` to the list:
   ```sql
   ALTER TABLE resources DROP CONSTRAINT IF EXISTS resources_category_check;
   ALTER TABLE resources ADD CONSTRAINT resources_category_check
     CHECK (category IN ('Lecture','Exam','Material','Quiz','Homework','Other'));
   ```

No new table. Homeworks reuse `resources` with `category = 'Homework'`,
`sub_category = 'Homeworks'`, and `unit` as the folder name (same pattern as
Quizzes and Books & Notes).

> **⚠ BLOCKER — failure mode if the backend isn't restarted.** If the migration
> hasn't run, `POST /resources` with `category: 'Homework'` returns a 500
> violating the CHECK. `saveAllResources()` catches that error, logs it, and
> **deliberately does not rethrow** (line ~575: *"Don't throw - allow course to
> be saved even if resources fail"*). The result: the admin sees a green
> "Course saved successfully" toast, and **every resource on the course is gone**
> — they were deleted at the top of `saveAllResources()` before the failing
> insert. Restart the backend and confirm `✓ DB migrations applied` **before**
> anyone touches the CMS. Consider also making that catch block push an error
> toast (Appendix B.3).

### Backend changes (`back-end/server.js`)
None beyond the CHECK constraint. The existing resource CRUD endpoints are
category-agnostic.

### CMS changes (`front-end/app/admin/courses/page.tsx`)

1. Add the state and types alongside the Quizzes types (line ~118):
   ```ts
   type SingleHomework = { type: 'single'; title: string; url: string; file?: File };
   type HomeworkFolder = { type: 'folder'; folderName: string; items: ExamFileItem[] };
   type HomeworkEntry  = SingleHomework | HomeworkFolder;
   const [homeworks, setHomeworks] = useState<HomeworkEntry[]>([]);
   ```
2. Add a **Homeworks Section** UI block in the modal, modeled on the Quizzes
   Section (line 788): collapsible header, "Add Single" / "Add Folder" buttons,
   `ExamFileDrop` per item, folder collapse via `collapsedExamFolders`.
3. **⚠ BLOCKER — `fetchResources()` must parse homeworks in the same commit as
   the save logic.** Add a branch to the `resourcesData.forEach` chain
   (line ~213), mirroring the Quizzes branch:
   ```ts
   } else if (resource.sub_category === 'Homeworks') {
     if (resource.unit) {
       if (!homeworkFolders[resource.unit]) homeworkFolders[resource.unit] = [];
       homeworkFolders[resource.unit].push({ title: resource.resource_title, url: resource.url });
     } else {
       homeworkEntries.push({ type: 'single', title: resource.resource_title, url: resource.url });
     }
   }
   ```
   plus the `Object.entries(homeworkFolders)` reconstruction and
   `setHomeworks(homeworkEntries)`. **If save ships without parse, the first
   edit of any course after homeworks exist silently deletes every homework** —
   see fact 3 in the Current State Summary. Do not split these across commits.
4. In `saveAllResources()`, add a homework loop modeled on the quiz loop
   (line ~482), using the shared `order++` counter from Change 1:
   ```ts
   for (const entry of homeworks) {
     if (entry.type === 'single') {
       let url = entry.url;
       if (entry.file) url = await doUpload(entry.file, 'Homework PDF');
       if (!url) continue;
       allResources.push({ course_id: courseId, resource_title: entry.title, url,
         category: 'Homework', sub_category: 'Homeworks', sort_order: order++ });
     } else {
       for (const item of entry.items) {
         let url = item.url;
         if (item.file) url = await doUpload(item.file, 'Homework PDF');
         if (!url) continue;
         allResources.push({ course_id: courseId, resource_title: item.title, url,
           category: 'Homework', sub_category: 'Homeworks', unit: entry.folderName,
           sort_order: order++ });
       }
     }
   }
   ```
5. **Missed in v1:** add homeworks to the `filesTotal` upload counter
   (line ~447). Without it, `doUpload` divides by a total that excludes homework
   PDFs and the progress bar overshoots 100% or divides by zero:
   ```ts
   homeworks.forEach(e => e.type === 'single' ? (e.file && filesTotal++) : e.items.forEach(it => it.file && filesTotal++));
   ```
6. Add `setHomeworks([])` to `resetForm()` (line ~282).
7. Add `homeworks: true` to the `collapsedExams` initial state (line 137).

### Front-end API type changes (`front-end/lib/api.ts`)
Add `'Homework'` to the `Resource.category` union (line 76):
```ts
category: "Lecture" | "Exam" | "Material" | "Quiz" | "Homework" | "Other" | string;
```

### Public course page (`front-end/app/academics/[courseId]/page.tsx`)

1. **`groupResources()` (line 56)** — add a `homeworks` bucket and a branch.
   Placement matters: the chain ends in a catch-all `else { other.push(item) }`,
   so without a branch every homework silently renders under "Other Resources".
   Put it after the quizzes branch:
   ```ts
   } else if (subCat === 'homeworks' || cat === 'homework') {
     homeworks.push(item);
   }
   ```
   Return it from the function alongside the other buckets.
2. **Missed in v1 — two type declarations must be updated or the build fails:**
   - `CourseMeta.resources` (line 23) — add `homeworks: { title: string; href: string }[];`
   - the inline `useState` generic for `resources` (line 503) — add
     `homeworks: {title:string;href:string}[]` to the type **and**
     `homeworks: []` to the initial value.
3. Add a `HomeworksSection` component copied from `QuizzesSection` (line 295) —
   collapsible, `FileText` row icons, `if (!items || items.length === 0) return null;`
   at the top so the section hides when empty. Use `ClipboardList` for the header
   icon and add it to the `lucide-react` import on line 4.
4. Render it in the Course Resources grid (line ~647), after `<QuizzesSection>`:
   ```tsx
   <HomeworksSection items={data.resources.homeworks} />
   ```

> **Known limitation, inherited from Quizzes:** the CMS supports homework
> *folders*, but `QuizzesSection` — and therefore `HomeworksSection` — renders a
> flat list. Folder structure is stored in `unit` and round-trips through the CMS
> correctly, but it is not visible to students. This matches existing Quizzes
> behaviour. If folders must be visible publicly, copy `BooksAndNotesSection`
> (line 246) instead, which does render groups — decide before implementing.

### Acceptance criteria
- [ ] Admin can add single homework PDFs and homework folders in the CMS.
- [ ] Homeworks persist across saves **and across a modal close/reopen**.
- [ ] Editing and saving a course that already has homeworks does not delete
      them (regression test for the parse/save split).
- [ ] Public course page shows a Homeworks section when homeworks exist.
- [ ] Homeworks section is hidden when no homeworks exist.
- [ ] Homeworks do **not** appear in the "Other Resources" section.
- [ ] Upload progress bar reaches exactly 100% when homework PDFs are included.

---

## Change 3 — Syllabus & Industry Overview Boxes on Course Page

### Goal
On the public course page, directly under the Learning Objectives box, add two
side-by-side boxes: **Syllabus** and **Industry Overview**. These are
course-level fields, so they belong on the `courses` table.

### Database changes

1. `back-end/schema.sql` — add to the `courses` `CREATE TABLE` body:
   ```sql
   syllabus           TEXT,
   industry_overview  TEXT
   ```
2. `back-end/server.js` auto-migration block (line ~46):
   ```sql
   ALTER TABLE courses ADD COLUMN IF NOT EXISTS syllabus TEXT;
   ALTER TABLE courses ADD COLUMN IF NOT EXISTS industry_overview TEXT;
   ```

### Backend changes (`back-end/server.js`)

1. **GET `/courses`** (line 130) — **this is the one that matters.** The public
   course page and the CMS list both use it; `GET /courses/:courseId` is not
   called by any front-end code in this repo. Add both columns to the SELECT.
2. **GET `/courses/:courseId`** (line 160) — add them too, for API consistency.
3. **POST `/courses`** (line 179) — destructure both from `req.body`, add to the
   INSERT column list and values as `$13`/`$14`, passing `syllabus || null`.
4. **PUT `/courses/:courseId`** (line 224) — destructure both, add
   `syllabus=$12, industry_overview=$13` to the SET clause, and shift
   `WHERE course_id=$14`. Double-check the parameter renumbering: the array
   currently ends with `req.params.courseId` at `$12`.

5. **⚠ BLOCKER — the Redis cache will make this look broken.** `GET /courses`
   caches under `all_courses` for 3600s. POST and PUT do invalidate it, but the
   call is placed **after** the response is sent:
   ```js
   res.json(rows[0]);
   await delCache("all_courses");   // ← runs after the client already has its reply
   ```
   The CMS calls `fetchCourses()` immediately after the modal closes
   (line ~421), which races that `delCache` and can repopulate the cache with
   pre-update data — the admin saves, the list refreshes, and the new text is
   gone for up to an hour. Swap the order in both handlers:
   ```js
   await delCache("all_courses");
   res.json(rows[0]);
   ```
   Also flush the key once manually after deploying the migration
   (`redis-cli DEL all_courses`), or the pre-migration payload — which has no
   `syllabus` field at all — will serve until it expires.

### Front-end API type changes (`front-end/lib/api.ts`)

Add to the `Course` type (line 37). Use nullable optionals — the columns are
nullable `TEXT`, so existing rows serialise as `null`, and a non-optional
`string` would be a lie the compiler happily accepts and then trips over at
runtime:
```ts
syllabus?: string | null;
industry_overview?: string | null;
```

### CMS changes (`front-end/app/admin/courses/page.tsx`)

1. Add state next to `objStr` (line ~112):
   ```ts
   const [syllabus, setSyllabus] = useState("");
   const [industryOverview, setIndustryOverview] = useState("");
   ```
2. Add two `<textarea>` fields below the Objectives field (line 704–707), inside
   the same `col-span-2` grid pattern, `rows={4}`. Reuse the exact class string
   from the Objectives textarea so the styling matches.
3. `openEditModal()` (line ~305): `setSyllabus(c.syllabus || "")` and
   `setIndustryOverview(c.industry_overview || "")`.
4. `resetForm()` (line ~282): reset both to `""`.
5. `handleSubmit()` (line ~370): add `syllabus` and
   `industry_overview: industryOverview` to the `payload` object. Note the case
   change — state is camelCase, the wire format is snake_case.
6. Update the CMS-local `Course` type (line 88) to include both fields as
   `syllabus?: string | null` / `industry_overview?: string | null`.

> **Related pre-existing bug — see Appendix B.1.** `PUT /courses/:courseId` uses
> full-replacement semantics: any field the CMS omits is written as `NULL`. The
> CMS already omits `major_1_date`/`major_2_date`/`final_date`, so every course
> edit silently wipes the exam dates. Your two new fields join the same contract
> — if any other caller ever PUTs a course without them, they'll be nulled too.
> Worth fixing while you're in this handler.

### Public course page (`front-end/app/academics/[courseId]/page.tsx`)

1. **Missed in v1 — the `data` object needs the fields.** v1's JSX reads
   `data.syllabus` and `data.industryOverview`, but `data` (line 584) is an
   explicit object literal that contains neither. Following the existing
   `display*` convention (lines 558–582):
   ```ts
   const displaySyllabus = course?.syllabus ?? "";
   const displayIndustryOverview = course?.industry_overview ?? "";
   ```
   then add `syllabus: displaySyllabus, industryOverview: displayIndustryOverview`
   to the `data` literal. Note the API field is snake_case
   (`industry_overview`) while `data` uses camelCase — that inconsistency in v1
   was the source of the confusion.
2. Add the two-column grid immediately after the Learning Objectives box closes
   (line 642), before the `{/* Course Content Grid */}` comment:
   ```tsx
   {(data.syllabus || data.industryOverview) && (
     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
       {/* Syllabus box */}
       <div className="p-8 rounded-3xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10">
         <div className="flex items-center gap-3 mb-6">
           <FileText className="w-6 h-6 text-neon-blue" />
           <h2 className="text-2xl font-bold font-[family-name:var(--font-orbitron)]">Syllabus</h2>
         </div>
         <p className="text-gray-700 dark:text-white/70 leading-relaxed whitespace-pre-line">
           {data.syllabus || "No syllabus available."}
         </p>
       </div>
       {/* Industry Overview box */}
       <div className="p-8 rounded-3xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10">
         <div className="flex items-center gap-3 mb-6">
           <Briefcase className="w-6 h-6 text-neon-blue" />
           <h2 className="text-2xl font-bold font-[family-name:var(--font-orbitron)]">Industry Overview</h2>
         </div>
         <p className="text-gray-700 dark:text-white/70 leading-relaxed whitespace-pre-line">
           {data.industryOverview || "No industry overview available."}
         </p>
       </div>
     </div>
   )}
   ```
   The outer guard means the grid disappears entirely when both fields are
   empty (consistent with how every resource section hides itself), while a
   course with only one filled still renders both boxes for visual balance.
3. Add `Briefcase` to the `lucide-react` import on line 4. `FileText` is already
   imported.

### Acceptance criteria
- [ ] Admin can enter syllabus and industry overview text in the course form.
- [ ] Both fields persist across saves and reloads.
- [ ] **Saving in the CMS makes the new text visible on the public page
      immediately** — not after the Redis TTL expires. (Tests the `delCache`
      ordering fix.)
- [ ] Public course page shows two side-by-side boxes under Learning Objectives.
- [ ] `whitespace-pre-line` preserves newlines in the rendered text.
- [ ] Layout stacks on mobile, side-by-side on `md+`.
- [ ] A course with both fields empty shows no boxes at all.
- [ ] Editing a course does not blank out its syllabus (or, if B.1 is fixed, its
      exam dates).

---

## Implementation Order

1. **Change 3 (Syllabus & Industry Overview)** — simplest, isolated to the
   course form + course page, no resource logic. Includes the `delCache`
   ordering fix.
2. **Change 1 (Reorder lectures)** — adds `sort_order` and the reorder UI.
   Decide resolution (a) or (b) for the round-trip issue *before* starting; if
   (b), the `fetchResources()`/`groupResources()` rework lands here.
3. **Change 2 (Homeworks)** — builds on `sort_order` and the Quizzes/folder
   pattern. Parse and save logic must ship together.

Changes 1 and 2 both edit `saveAllResources()` and `fetchResources()`. Keep them
in separate commits but the same PR, and rebase 2 on 1 rather than developing
them in parallel.

---

## Files to Modify

| File | Changes |
|------|---------|
| `back-end/schema.sql` | Add `sort_order` to resources; `syllabus`, `industry_overview` to courses; add `Homework` to the inline category CHECK. |
| `back-end/server.js` | Auto-migrations (+ optional index); `delCache` before `res.json` in course POST/PUT; GET/POST/PUT courses (2 new fields, param renumbering); POST/PUT resources (`sort_order`); `GET /resources` ORDER BY; widen category CHECK. |
| `front-end/lib/api.ts` | `sort_order?: number` on `Resource`; `Homework` in the category union; `syllabus?`, `industry_overview?` on `Course`. |
| `front-end/app/admin/courses/page.tsx` | Video reorder UI + handler; `ChevronUp` import; homeworks state, section UI, parse branch, save loop, `filesTotal`, `resetForm`, `collapsedExams`; syllabus & industry-overview state, textareas, `openEditModal`, `resetForm`, `handleSubmit`, local `Course` type; `sort_order` counter through all pushes; sequential resource creation. |
| `front-end/app/academics/[courseId]/page.tsx` | `homeworks` bucket in `groupResources`; `CourseMeta.resources` and the `useState` generic both updated; `HomeworksSection`; `display*` consts and `data` literal for the two new fields; Syllabus/Industry Overview grid; `Briefcase` + `ClipboardList` imports. |

---

## Testing Notes

**Before anything else:** restart the backend and confirm `✓ DB migrations
applied` in the log. Then verify the columns actually exist:
```sql
\d resources
\d courses
```
The migration block is one statement with a silent catch — a green log line is
the only evidence you get.

Then flush the course cache once: `redis-cli DEL all_courses`.

- Test each change independently by creating/editing a course in the CMS and
  verifying the public course page.
- **Reordering:** add 3+ videos, reorder, save, confirm the public page matches.
  Then save the *same course* a second time without changes and confirm the
  order is still identical — that's the regression test for the concurrent-insert
  nondeterminism.
- **Homeworks:** add one single homework and one folder, save, confirm both
  appear publicly. Then reopen the modal, change only the course title, save
  again, and confirm the homeworks are still there. That second save is the test
  that actually matters.
- **Syllabus / Industry Overview:** enter multi-line text, save, confirm
  newlines render. Reload the public page immediately (do not wait) to verify
  the cache invalidation ordering.
- **Full-course regression:** create a course with every section populated
  (videos, quizzes, books & notes, all three exam buckets, by-chapter,
  homeworks, syllabus, industry overview), save, reopen, save again unchanged,
  and diff `SELECT * FROM resources WHERE course_id=... ORDER BY sort_order`
  between the two saves. They should be identical apart from `id`.

---

## Appendix A — Rollback

All three schema changes are additive and safe to leave in place if the
front-end is reverted:
- `sort_order` defaults to `0`; with `ORDER BY sort_order, id` reverted to
  `ORDER BY id`, behaviour is unchanged.
- The widened CHECK constraint accepts a strict superset of the old values.
- `syllabus` / `industry_overview` are nullable and ignored by older SELECTs.

Do **not** drop the widened CHECK constraint while `Homework` rows exist — the
`ADD CONSTRAINT` will fail on the next boot and, because the migration block is
a single statement, that takes *every other migration* down with it.

---

## Appendix B — Pre-existing bugs found during review

Not in scope for this branch, but B.1 and B.3 sit on code paths these changes
touch. Raise them as separate tickets.

**B.1 — Editing a course wipes its exam dates.**
`PUT /courses/:courseId` (line 224) writes `major_1_date || null` etc. The CMS
`handleSubmit()` payload never includes those three fields (confirmed: no
occurrence of `major_1_date` anywhere in `admin/courses/page.tsx`), so they
arrive `undefined` and are written as `NULL`. Every course edit through the CMS
silently clears the exam dates, which breaks the `ExamTimer` on the public page.
There is currently no UI to set them at all. Fix: either add the date inputs to
the course form, or make the PUT patch-style (`COALESCE($n, column)`).

**B.2 — `PUT /courses/:courseId/books` never invalidates the cache.**
Line 652 updates `courses.books` but omits `delCache("all_courses")`, so book
changes can take up to an hour to appear. One-line fix.

**B.3 — Resource save failures are invisible.**
`saveAllResources()` ends with a `catch` that logs and deliberately does not
rethrow (line ~575). Combined with the delete-first strategy, a failed insert
means resources are gone while the admin sees a success toast. Minimum fix: call
`pushToast('error', ...)` in that catch. Better fix: build `allResources`,
create them, and only then delete the old rows — or wrap the whole swap in a
transaction behind a single bulk endpoint.

**B.4 — Orphaned PDF uploads.**
Deleting a resource or a course removes the DB row but never the file under
`back-end/files/`. Uploads accumulate indefinitely. A periodic reconciliation
job comparing `files/` against `resources.url` would clear them.

**B.5 — Resource save is not atomic.**
Between the delete loop and the create loop, a visitor loading the public course
page sees a course with zero resources. The window is short but real, and grows
with PDF upload time since uploads happen *after* the deletes.
