import { Activity, Dumbbell, Users } from "lucide-react";
import { redirect } from "next/navigation";
import { getAdminStats } from "@/app/actions/admin";
import { getCurrentUser } from "@/app/actions/auth";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { isAdminUser } from "@/lib/auth";
import { CARD_CLS, LABEL_CLS } from "@/lib/ui";
import type { AdminStats } from "@/types/trackr";

function formatDate(value: string): string {
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
    <article className={`${CARD_CLS} p-4`}>
      <Icon className="h-4 w-4 text-brand" />
      <p className="mt-3 text-2xl font-extrabold tracking-tight text-ink tabular-nums">
        {value.toLocaleString()}
      </p>
      <p className="mt-1 text-xs font-semibold text-muted">{label}</p>
    </article>
  );
}

function UsersTable({ users }: { users: AdminStats["usersList"] }) {
  if (users.length === 0) {
    return (
      <p className={`${CARD_CLS} border-dashed px-4 py-8 text-center text-sm text-muted`}>
        No registered users yet.
      </p>
    );
  }

  return (
    <div className={`${CARD_CLS} overflow-x-auto`}>
      <table className="w-full min-w-[36rem] text-left text-sm">
        <thead className={`border-b border-line ${LABEL_CLS}`}>
          <tr>
            <th className="px-4 py-3 font-bold">Username</th>
            <th className="px-4 py-3 font-bold">Role</th>
            <th className="px-4 py-3 font-bold">Joined</th>
            <th className="px-4 py-3 font-bold">Total Workouts</th>
            <th className="px-4 py-3 font-bold">Total Sports</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b border-line last:border-b-0">
              <td className="px-4 py-3 font-semibold text-ink">{user.username}</td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    user.role === "ADMIN"
                      ? "bg-brand-soft text-brand"
                      : "bg-chip text-muted"
                  }`}
                >
                  {user.role}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-muted">
                {formatDate(user.createdAt)}
              </td>
              <td className="px-4 py-3 font-medium text-ink tabular-nums">
                {user._count.sessions}
              </td>
              <td className="px-4 py-3 font-medium text-ink tabular-nums">
                {user._count.activities}
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
    <AppShell wide>
      <PageHeader
        title="Admin"
        subtitle="Overview of registered users and logged sessions."
      />

      <section className="grid grid-cols-3 gap-3">
        <StatCard label="Users" value={stats.totalUsers} icon={Users} />
        <StatCard
          label="Workouts"
          value={stats.totalWorkouts}
          icon={Dumbbell}
        />
        <StatCard label="Cardio" value={stats.totalCardio} icon={Activity} />
      </section>

      <section className="space-y-3">
        <h3 className={LABEL_CLS}>Registered users</h3>
        <UsersTable users={stats.usersList} />
      </section>
    </AppShell>
  );
}
