import { Activity, Dumbbell, Users } from "lucide-react";
import { redirect } from "next/navigation";
import { getAdminStats } from "@/app/actions/admin";
import { getCurrentUser } from "@/app/actions/auth";
import { AppShell } from "@/components/layout/AppShell";
import { isAdminUser } from "@/lib/auth";
import type { AdminStats } from "@/types/trackr";

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Users;
}) {
  return (
    <article className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4">
      <Icon className="h-4 w-4 text-lime-400/80" />
      <p className="mt-3 text-2xl font-semibold tracking-tight text-neutral-50">
        {value.toLocaleString()}
      </p>
      <p className="mt-1 text-xs font-medium text-neutral-300">{label}</p>
    </article>
  );
}

function UsersTable({ users }: { users: AdminStats["users"] }) {
  if (users.length === 0) {
    return (
      <p className="rounded-2xl border border-neutral-800 bg-neutral-900/40 px-4 py-8 text-center text-sm text-neutral-400">
        No registered users yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-neutral-800 bg-neutral-900/40">
      <table className="w-full min-w-[36rem] text-left text-sm">
        <thead className="border-b border-neutral-800 text-xs uppercase tracking-[0.14em] text-neutral-500">
          <tr>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Joined</th>
            <th className="px-4 py-3 font-medium">Workouts</th>
            <th className="px-4 py-3 font-medium">Last Active</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr
              key={user.id}
              className="border-b border-neutral-800/80 last:border-b-0"
            >
              <td className="px-4 py-3 font-medium text-neutral-100">
                {user.name?.trim() || "—"}
              </td>
              <td className="px-4 py-3 text-neutral-400">{user.email}</td>
              <td className="px-4 py-3 whitespace-nowrap text-neutral-400">
                {formatDate(user.createdAt)}
              </td>
              <td className="px-4 py-3 text-neutral-200">
                {user.totalWorkoutsCount}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-neutral-400">
                {formatDate(user.lastActiveDate)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user || !isAdminUser(user)) {
    redirect("/");
  }

  const stats = await getAdminStats();

  return (
    <AppShell wide subtitle="Users and activity across Trackr">
      <div className="space-y-2">
        <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-neutral-500">
          Admin
        </h2>
        <p className="text-sm text-neutral-400">
          Overview of registered users and logged sessions.
        </p>
      </div>

      <section className="grid grid-cols-3 gap-3">
        <StatCard label="Total Users" value={stats.totalUsers} icon={Users} />
        <StatCard
          label="Total Workouts Logged"
          value={stats.totalWorkouts}
          icon={Dumbbell}
        />
        <StatCard
          label="Total Cardio Sessions"
          value={stats.totalCardio}
          icon={Activity}
        />
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-medium text-neutral-300">Registered users</h3>
        <UsersTable users={stats.users} />
      </section>
    </AppShell>
  );
}
