import { LoginForm } from "../../../src/components/login-form";
import { BackgroundIntegrations } from "../../../src/components/background-integration";

export default function LoginPage() {
  return (
    <div
      className="relative flex min-h-svh items-center justify-center overflow-hidden p-6 md:p-10"
      style={{
        backgroundColor: "#F5EFE6",
        backgroundImage:
          "linear-gradient(135deg, #FFF8F0 0%, #F5EFE6 45%, #E8DDD0 100%)",
      }}
    >
      <BackgroundIntegrations />

      <div className="relative z-10 w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}