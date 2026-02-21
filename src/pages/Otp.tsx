import { useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "@/components/ui/sonner";
import { postJson } from "@/lib/api";

type OtpLocationState = {
  email?: string;
};

const OtpPage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [otpDigits, setOtpDigits] = useState<string[]>(Array.from({ length: 6 }, () => ""));
  const [isVerifying, setIsVerifying] = useState(false);

  const email = (location.state as OtpLocationState | null)?.email;
  const otp = useMemo(() => otpDigits.join(""), [otpDigits]);
  const isComplete = otp.length === 6;
  const hasEmail = Boolean(email);

  const setDigit = (index: number, value: string) => {
    setOtpDigits((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleChange = (index: number, value: string) => {
    const clean = value.replace(/\D/g, "");
    if (clean.length === 0) {
      setDigit(index, "");
      return;
    }

    if (clean.length === 1) {
      setDigit(index, clean);
      if (index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
      return;
    }

    const nextDigits = clean.slice(0, 6 - index).split("");
    setOtpDigits((prev) => {
      const next = [...prev];
      nextDigits.forEach((digit, offset) => {
        next[index + offset] = digit;
      });
      return next;
    });
    const nextIndex = Math.min(index + nextDigits.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace") {
      if (otpDigits[index]) {
        setDigit(index, "");
        return;
      }
      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
        setDigit(index - 1, "");
      }
    }
    if (event.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isComplete || !hasEmail) return;

    const run = async () => {
      setIsVerifying(true);
      try {
        const response = await postJson<{ message?: string }>("/api/auth/verify-otp", {
          email,
          otp,
        });
        if (response.message) {
          toast.success(response.message);
        } else {
          toast.success(t("account.otpVerified"));
        }
        navigate("/account", { state: { mode: "login", email } });
      } catch (error) {
        const message = error instanceof Error ? error.message : t("account.otpFailed");
        toast.error(message);
      } finally {
        setIsVerifying(false);
      }
    };

    void run();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container-page py-16">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-foreground mb-2 text-center">{t("account.otpTitle")}</h1>
          <p className="text-sm text-muted-foreground text-center mb-6">
            {t("account.otpSubtitle")}
            {email ? <span className="block mt-1 text-foreground font-medium">{email}</span> : null}
            {!hasEmail ? <span className="block mt-2 text-destructive">{t("account.otpMissingEmail")}</span> : null}
          </p>
          <form onSubmit={handleSubmit} className="bg-card rounded-lg border border-border p-6 space-y-4">
            <div className="flex justify-center">
              <div className="flex items-center gap-2">
                {otpDigits.map((digit, index) => (
                  <input
                    key={`otp-${index}`}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    value={digit}
                    onChange={(event) => handleChange(index, event.target.value)}
                    onKeyDown={(event) => handleKeyDown(index, event)}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    autoFocus={index === 0}
                    maxLength={1}
                    className="h-10 w-10 rounded-md border border-input bg-background text-center text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                ))}
              </div>
            </div>
            <p className="text-center text-xs text-muted-foreground">{t("account.otpHint")}</p>
            <button
              type="submit"
              disabled={!isComplete || !hasEmail || isVerifying}
              className="w-full bg-primary text-primary-foreground py-3 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {t("account.sendOtp")}
            </button>
            <p className="text-center text-sm text-muted-foreground">
              <Link to="/account" className="text-primary hover:underline">
                {t("account.login")}
              </Link>
            </p>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default OtpPage;
