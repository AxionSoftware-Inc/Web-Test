# QuestLab Route Notes

## School Routes

School ichki sahifalari list -> detail oqimida ishlaydi.

### `/school/home`

School dashboard:
- umumiy class/teacher/student metrikalar
- class performance
- teacher activity
- weak skills
- portal ma'lumotlari

### `/school/classes`

School class list:
- barcha classlar table/list ko'rinishida
- class nomi, teacher, student count, assignment count, average score
- har bir class bosilganda detail ochiladi

Detail route:

```text
/school/classes/[classId]
```

Class detail ichida:
- class teachers
- class students
- student progress
- recent test results
- weak skills
- class settings

### `/school/teachers`

School teacher list:
- barcha teacherlar
- active/inactive status
- class count

Detail route:

```text
/school/teachers/[teacherId]
```

Teacher detail ichida:
- teacher profile
- teacherga biriktirilgan classlar
- umumiy student count
- attempts
- average score
- recent student test results
- weak skills

### `/school/students`

School student directory:
- butun school bo'yicha studentlar
- search mavjud
- student name/code
- class names
- status
- completed tests
- average score
- last submit

Detail route:

```text
/school/students/[studentId]
```

Student detail ichida:
- student classlari
- completed tests
- average score
- last submit
- test result history
- class bo'yicha progress

## Current School Flow

```text
/school/classes
  -> /school/classes/[classId]
      -> /school/teachers/[teacherId]
      -> /school/students/[studentId]

/school/teachers
  -> /school/teachers/[teacherId]
      -> /school/classes/[classId]
      -> /school/students/[studentId]

/school/students
  -> /school/students/[studentId]
      -> /school/classes/[classId]
      -> /school/results/[resultId]
```

## Teacher Routes

Teacher ichki sahifalari ham list -> detail oqimida ishlaydi va QuestLab design system komponentlariga ulangan.

### `/teacher/classes`

Teacher class workspace:
- class yaratish
- class list
- search
- student count
- assignment count
- visibility

Detail route:

```text
/teacher/classes/[classSlug]
```

Class detail ichida:
- assignments
- students
- recent submissions
- weak skills
- class result analytics
- assign test action

Assignment detail route:

```text
/teacher/classes/[classSlug]/assignments/[assignmentId]
```

Assignment detail ichida:
- assignment settings
- submissions
- score summary
- affected/submitted students
- test preview action
- classga qaytish action

Assign route:

```text
/teacher/classes/[classSlug]/assign
```

### `/teacher/students`

Teacher student directory:
- barcha teacher classlaridagi studentlar
- search
- class
- completed tests
- average score
- last submit
- no-result roster students ham ko'rinadi

Detail route:

```text
/teacher/students/[studentId]
```

Student detail ichida:
- student classlari
- completed tests
- average score
- submission history
- weak topic signals
- class averages

### `/teacher/results`

Teacher results table:
- submitted results
- class
- test
- student
- correct count
- score
- weak topic summary

Detail route:

```text
/teacher/results/[resultId]
```

Result detail ichida:
- student
- class
- test score
- question-by-question result
- student answer
- correct answer
- explanation
- weak skills in this result
- actions to open class/student

## Current Teacher Flow

```text
/teacher/classes
  -> /teacher/classes/[classSlug]
      -> /teacher/classes/[classSlug]/assign
      -> /teacher/students/[studentId]
      -> /teacher/results/[resultId]

/teacher/students
  -> /teacher/students/[studentId]
      -> /teacher/results/[resultId]

/teacher/results
  -> /teacher/results/[resultId]
      -> /teacher/classes/[classSlug]
      -> /teacher/students/[studentId]
```
