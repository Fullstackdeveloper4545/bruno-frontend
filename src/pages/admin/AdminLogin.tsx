import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { login } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const success = login(email.trim(), password.trim());
    if (success) {
      setError("");
      navigate("/admin", { replace: true });
      return;
    }
    setError("Invalid admin credentials. Redirecting to the user dashboard.");
    navigate("/", { replace: true });
  };

  return (
    <div className="flex min-h-svh items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.25),_transparent_60%)] px-4">
      <Card className="w-full max-w-md border-border/60 bg-card/95 shadow-lg">
        <CardHeader>
          <CardTitle className="font-display text-2xl">Admin Sign In</CardTitle>
          <CardDescription>Enter admin credentials to access the dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium">Admin Email</label>
              <Input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="username@gmail.com"
                type="email"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <Input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="********"
                type="password"
                required
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button className="w-full" type="submit">
              Sign In
            </Button>
            <Button
              className="w-full"
              variant="outline"
              type="button"
              onClick={() => navigate("/", { replace: true })}
            >
              Continue as User
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
