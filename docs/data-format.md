# UniPlan Data Format

UniPlan uses JSON as its canonical data format. The complete plan is stored in
browser `localStorage` and can be exported from the **Import & backup** page.

## Top-Level Object

```json
{
  "schemaVersion": 1,
  "profile": {},
  "modules": []
}
```

| Field | Type | Description |
| --- | --- | --- |
| `schemaVersion` | number | Format version. The current value is `1`. |
| `profile` | object | Student-independent degree settings plus optional display name. |
| `modules` | array | Credit requirement groups and their courses. |

## Profile

```json
{
  "name": "",
  "university": "Example University",
  "program": "Computer Science B.Sc.",
  "regulation": "2026",
  "totalCredits": 180,
  "semesterCount": 6,
  "gradingSystem": "german",
  "language": "en"
}
```

| Field | Allowed values |
| --- | --- |
| `gradingSystem` | `german`, `us`, or `percentage` |
| `language` | `en`, `zh`, or `de` |

`name` is optional and should normally be empty in a public curriculum template.

## Module

```json
{
  "id": "core",
  "name": "Core modules",
  "requiredCredits": 120,
  "color": "#315b72",
  "courses": []
}
```

Module IDs must be unique within the plan. `requiredCredits` describes the
credits required from that module, not necessarily the sum of every available
course listed in it.

## Course

```json
{
  "id": "course-unique-id",
  "code": "CS101",
  "name": "Introduction to Computer Science",
  "credits": 6,
  "status": "available",
  "semester": null,
  "grade": "",
  "countsTowardGpa": true,
  "offered": "winter",
  "prerequisite": ""
}
```

| Field | Type or values | Notes |
| --- | --- | --- |
| `id` | string | Stable unique internal ID. Do not use the course code as the only ID. |
| `code` | string | Human-facing official or local course code. May be empty or duplicated. |
| `name` | string | Course title. |
| `credits` | number | Credits or ECTS awarded by the course. |
| `status` | `available`, `planned`, `completed` | Current planning state. |
| `semester` | number or `null` | Planned semester number. |
| `grade` | string | Empty or a numeric value stored as text. |
| `countsTowardGpa` | boolean | Exclude pass/fail courses by setting this to `false`. |
| `offered` | `every`, `winter`, `summer` | Expected availability. |
| `prerequisite` | string | Optional free-text prerequisite or recommendation. |

## CSV Import

CSV imports use the following header:

```csv
module,moduleRequiredCredits,moduleColor,code,course,credits,status,semester,grade,countsTowardGpa,offered,prerequisite
```

Example:

```csv
module,moduleRequiredCredits,moduleColor,code,course,credits,status,semester,grade,countsTowardGpa,offered,prerequisite
Core,120,#315b72,CS101,Introduction to Computer Science,6,planned,1,,true,winter,
Electives,45,#c87941,EL201,Example Elective,5,available,,,true,every,
Thesis,15,#6c6f93,THESIS,Bachelor Thesis,15,available,,,false,every,120 credits recommended
```

Required columns are `module`, `course`, and `credits`. Unknown status or offered
values fall back to `available` and `every`.

Rows with the same `module` value are grouped into one module. The importer uses
the first encountered module requirement and color for that group.

## Import Safety

Importing replaces the current plan. Export a JSON backup first. UniPlan performs
basic structural validation, but it does not verify that academic rules or course
facts are correct.

Avoid importing files from untrusted sources. Although the current UI renders
values as text, imported files may contain misleading curriculum information or
private data.
