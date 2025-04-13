import { LoginForm } from "@/components/login-form"

export default function Home() {
  // This would check for an authenticated session
  // If authenticated, redirect to dashboard
  // const session = await getServerSession()
  // if (session) redirect("/dashboard")

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Ward Member Tools</h1>
          <p className="mt-2 text-muted-foreground">Sign in to access ward management tools</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
