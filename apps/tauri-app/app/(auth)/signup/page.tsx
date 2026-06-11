import { SignupForm } from "../../../src/components/signup-form"

export default function SignupPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10"
      style={{
        backgroundColor: "#152331",
        backgroundImage: "linear-gradient(to right, #000000, #152331)",
      }}
    >
      <div className="w-full max-w-sm">
        <SignupForm />
      </div>
    </div>
  )
}
