import type { LatexTestSource } from "@/features/test-generator/model/test-generator-types";

export const latexTestBank: LatexTestSource[] = [
  {
    id: "math-quadratic-beginner",
    title: "Quadratic Equations Basics",
    subject: "mathematics",
    category: "Algebra",
    difficulty: "beginner",
    estimatedMinutes: 8,
    latex: String.raw`\section{Quadratic equations}

\begin{question}
Solve the equation \(x^2 - 5x + 6 = 0\).
\begin{choices}
\choice \(x=1,2\)
\choice \(x=2,3\)
\choice \(x=3,4\)
\choice \(x=0,6\)
\end{choices}
\answer{\(x=2,3\)}
\explanation{Factor the expression: \(x^2 - 5x + 6=(x-2)(x-3)\).}
\end{question}

\begin{question}
Find the discriminant of \(2x^2-4x+1=0\).
\begin{choices}
\choice 4
\choice 8
\choice 12
\choice 16
\end{choices}
\answer{8}
\explanation{Use \(b^2-4ac=(-4)^2-4\cdot2\cdot1=16-8=8\).}
\end{question}

\begin{question}
If \(f(x)=2x+1\), find \(f(4)\).
\answer{9}
\explanation{Substitute \(x=4\): \(2\cdot4+1=9\).}
\end{question}`,
  },
  {
    id: "physics-mechanics-beginner",
    title: "Mechanics Quick Check",
    subject: "physics",
    category: "Mechanics",
    difficulty: "beginner",
    estimatedMinutes: 7,
    latex: String.raw`\section{Mechanics}

\begin{question}
A body moves with constant velocity \(v=5m/s\) for \(4s\). Find the distance.
\begin{choices}
\choice \(10m\)
\choice \(15m\)
\choice \(20m\)
\choice \(25m\)
\end{choices}
\answer{\(20m\)}
\explanation{Distance is \(s=vt=5\cdot4=20m\).}
\end{question}

\begin{question}
What is the SI unit of force?
\begin{choices}
\choice Joule
\choice Newton
\choice Watt
\choice Pascal
\end{choices}
\answer{Newton}
\explanation{Force is measured in Newtons.}
\end{question}

\begin{question}
If mass is \(2kg\) and acceleration is \(3m/s^2\), find force.
\answer{6N}
\explanation{Newton's second law: \(F=ma=2\cdot3=6N\).}
\end{question}`,
  },
  {
    id: "programming-arrays-intermediate",
    title: "Arrays and Complexity",
    subject: "programming",
    category: "Data Structures",
    difficulty: "intermediate",
    estimatedMinutes: 10,
    latex: String.raw`\section{Arrays}

\begin{question}
What is the time complexity of accessing an array element by index?
\begin{choices}
\choice \(O(1)\)
\choice \(O(\log n)\)
\choice \(O(n)\)
\choice \(O(n \log n)\)
\end{choices}
\answer{\(O(1)\)}
\explanation{Array indexing computes the memory offset directly.}
\end{question}

\begin{question}
Which operation is usually expensive in the middle of a dynamic array?
\begin{choices}
\choice Reading by index
\choice Updating by index
\choice Inserting an element
\choice Checking length
\end{choices}
\answer{Inserting an element}
\explanation{Middle insertion shifts following elements, so it is \(O(n)\).}
\end{question}

\begin{question}
For a sorted array, binary search has what time complexity?
\answer{O(log n)}
\explanation{Each step halves the search interval.}
\end{question}`,
  },
  {
    id: "math-calculus-intermediate",
    title: "Derivative Fundamentals",
    subject: "mathematics",
    category: "Calculus",
    difficulty: "intermediate",
    estimatedMinutes: 9,
    latex: String.raw`\section{Derivatives}

\begin{question}
Find the derivative of \(x^3\).
\begin{choices}
\choice \(x^2\)
\choice \(2x^2\)
\choice \(3x^2\)
\choice \(3x\)
\end{choices}
\answer{\(3x^2\)}
\explanation{Use the power rule: \(\frac{d}{dx}x^n=nx^{n-1}\).}
\end{question}

\begin{question}
Find \(\frac{d}{dx}(5x+7)\).
\answer{5}
\explanation{The derivative of \(ax+b\) is \(a\).}
\end{question}`,
  },
  {
    id: "math-algebra-functions-intermediate",
    title: "Algebra Functions and Systems",
    subject: "mathematics",
    category: "Algebra",
    difficulty: "intermediate",
    estimatedMinutes: 11,
    latex: String.raw`\section{Algebra functions}

\begin{question}
If \(f(x)=x^2-3x\), find \(f(5)\).
\begin{choices}
\choice 5
\choice 10
\choice 15
\choice 20
\end{choices}
\answer{10}
\explanation{Substitute \(x=5\): \(25-15=10\).}
\end{question}

\begin{question}
Solve the system: \(x+y=7\), \(x-y=1\). Find \(x\).
\answer{4}
\explanation{Add the equations: \(2x=8\), so \(x=4\).}
\end{question}

\begin{question}
Which expression is equivalent to \((x+2)^2\)?
\begin{choices}
\choice \(x^2+2x+4\)
\choice \(x^2+4x+4\)
\choice \(x^2+4\)
\choice \(2x^2+4\)
\end{choices}
\answer{\(x^2+4x+4\)}
\explanation{Use \((a+b)^2=a^2+2ab+b^2\).}
\end{question}`,
  },
  {
    id: "math-number-theory-advanced",
    title: "Number Theory Challenge",
    subject: "mathematics",
    category: "Number Theory",
    difficulty: "advanced",
    estimatedMinutes: 12,
    latex: String.raw`\section{Number theory}

\begin{question}
Find the remainder when \(7^{4}\) is divided by \(10\).
\begin{choices}
\choice 1
\choice 3
\choice 7
\choice 9
\end{choices}
\answer{1}
\explanation{\(7^2=49\) ends in 9 and \(7^4\) ends in \(9^2=81\), so the remainder is 1.}
\end{question}

\begin{question}
If \(a\equiv 2 \pmod 5\) and \(b\equiv 3 \pmod 5\), find \(ab \pmod 5\).
\answer{1}
\explanation{\(ab\equiv 2\cdot3=6\equiv1\pmod5\).}
\end{question}`,
  },
  {
    id: "math-algebra-polynomials-advanced",
    title: "Advanced Algebra Patterns",
    subject: "mathematics",
    category: "Algebra",
    difficulty: "advanced",
    estimatedMinutes: 14,
    latex: String.raw`\section{Advanced algebra}

\begin{question}
If \(x+\frac{1}{x}=3\), find \(x^2+\frac{1}{x^2}\).
\begin{choices}
\choice 5
\choice 7
\choice 9
\choice 11
\end{choices}
\answer{7}
\explanation{Square both sides: \(x^2+2+\frac{1}{x^2}=9\), so the value is 7.}
\end{question}

\begin{question}
Find the sum of roots of \(2x^2-6x+5=0\).
\answer{3}
\explanation{For \(ax^2+bx+c=0\), sum of roots is \(-b/a=6/2=3\).}
\end{question}

\begin{question}
If \(a-b=4\) and \(ab=5\), find \(a^2+b^2\).
\answer{26}
\explanation{\((a-b)^2=a^2-2ab+b^2\). So \(16=a^2+b^2-10\), hence \(a^2+b^2=26\).}
\end{question}`,
  },
];
