import { redirect } from "next/navigation";
import { getUserById } from "@/lib/repos/users";
import { LoginForm } from "./login-form";

interface Props {
  params: Promise<{ userId: string }>;
}

export default async function LoginPage({ params }: Props) {
  const { userId } = await params;
  const user = await getUserById(userId);

  if (!user || user.disabledAt || !user.showOnLoginRoster) {
    redirect("/");
  }

  return <LoginForm userId={userId} displayName={user.displayName} />;
}
