import { ProfileForm } from "@/components/patients/profile/ProfilePlan";

export default function ProfilePage() {
  return (
    <div className="container px-4 sm:px-6 lg:px-20 max-w-screen-xl py-10">
      <div className="mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences.</p>
        </div>
        <div className="rounded-lg border shadow-sm">
            <ProfileForm />
        </div>
      </div>
    </div>
  )
}
