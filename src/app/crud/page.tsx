import { TestCrudForm } from "@/features/crud/ui/test-crud-form";
import { questApi } from "@/shared/api/questlab-api";

export const dynamic = "force-dynamic";

export default async function CrudPage() {
  const [subjects, topics, tests, skills] = await Promise.all([
    questApi.subjects(),
    questApi.topics(),
    questApi.tests(),
    questApi.skills(),
  ]);

  return (
    <main className="min-h-screen bg-[#f7f7ef] px-5 py-8 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <TestCrudForm subjects={subjects} topics={topics} tests={tests} skills={skills} />
      </div>
    </main>
  );
}
