import { requireUser } from "@/lib/auth";
import { Card, CardHeader, PageHeader } from "@/components/ui";
import { PasswordForm, ProfileForm } from "./forms";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await requireUser();
  return (
    <div className="max-w-3xl">
      <PageHeader title="Profile" description={user.email} />
      <div className="space-y-6">
        <Card>
          <CardHeader title="Personal details" />
          <div className="p-5 sm:p-6">
            <ProfileForm fullName={user.full_name} group={user.group_name} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Change password" />
          <div className="p-5 sm:p-6">
            <PasswordForm />
          </div>
        </Card>
      </div>
    </div>
  );
}
