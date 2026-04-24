"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  Library,
  Loader2,
  Lock,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  Github,
} from "lucide-react";

function AmbientOrbs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        animate={{
          x: [0, 60, -40, 0],
          y: [0, -50, 30, 0],
          scale: [1, 1.15, 0.95, 1],
        }}
        transition={{ repeat: Infinity, duration: 22, ease: "easeInOut" }}
        className="absolute -left-[15%] -top-[20%] h-[60%] w-[60%] rounded-full bg-[var(--accent)]/25 blur-[130px]"
      />
      <motion.div
        animate={{
          x: [0, -50, 30, 0],
          y: [0, 40, -30, 0],
          scale: [1, 0.9, 1.2, 1],
        }}
        transition={{ repeat: Infinity, duration: 26, ease: "easeInOut", delay: 3 }}
        className="absolute -bottom-[20%] -right-[15%] h-[55%] w-[55%] rounded-full bg-[var(--chart-2)]/20 blur-[130px]"
      />
      <motion.div
        animate={{
          x: [0, 40, -30, 0],
          y: [0, -40, 50, 0],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{ repeat: Infinity, duration: 20, ease: "easeInOut", delay: 5 }}
        className="absolute left-[30%] top-[40%] h-[40%] w-[40%] rounded-full bg-[var(--accent)]/15 blur-[120px]"
      />
    </div>
  );
}

function GridPattern() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div
        className="absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage: `
            linear-gradient(to right, var(--card-border) 1px, transparent 1px),
            linear-gradient(to bottom, var(--card-border) 1px, transparent 1px)
          `,
          backgroundSize: "56px 56px",
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 50%, black 30%, transparent 85%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 60% at 50% 50%, black 30%, transparent 85%)",
        }}
      />
    </div>
  );
}

function Particles() {
  const particles = React.useMemo(
    () =>
      Array.from({ length: 24 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: Math.random() * 3 + 1,
        duration: Math.random() * 10 + 12,
        delay: Math.random() * 8,
      })),
    []
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-[var(--accent)]"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: [0, -40, 0],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            repeat: Infinity,
            duration: p.duration,
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

function ShootingStar({ delay }: { delay: number }) {
  return (
    <motion.div
      className="absolute h-px w-[120px] bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent"
      initial={{ x: "-10%", y: "20%", opacity: 0, rotate: 15 }}
      animate={{
        x: ["-10%", "110%"],
        y: ["20%", "60%"],
        opacity: [0, 1, 0],
      }}
      transition={{
        repeat: Infinity,
        duration: 2.5,
        delay,
        repeatDelay: 8 + delay * 2,
        ease: "easeOut",
      }}
    />
  );
}

function TiltLogo() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-40, 40], [10, -10]), {
    stiffness: 150,
    damping: 15,
  });
  const rotateY = useSpring(useTransform(mouseX, [-40, 40], [-10, 10]), {
    stiffness: 150,
    damping: 15,
  });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative"
      style={{ perspective: "1000px" }}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 50, ease: "linear" }}
        className="absolute -inset-14 rounded-full border border-dashed border-[var(--accent)]/15"
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ repeat: Infinity, duration: 35, ease: "linear" }}
        className="absolute -inset-8 rounded-full border border-[var(--accent)]/10"
      >
        <div className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--accent)] shadow-[0_0_12px_var(--accent)]" />
        <div className="absolute right-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 translate-x-1/2 rounded-full bg-[var(--chart-2)] shadow-[0_0_10px_var(--chart-2)]" />
      </motion.div>

      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        animate={{ y: [-4, 4, -4] }}
        transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
        className="relative flex h-28 w-28 items-center justify-center rounded-[2rem] border border-[var(--card-border)] bg-[var(--card)] shadow-2xl shadow-[var(--accent)]/15"
      >
        <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-[var(--accent)]/10 via-transparent to-[var(--chart-2)]/10" />
        <Library
          className="relative z-10 h-12 w-12 text-[var(--accent)] drop-shadow-[0_0_20px_var(--accent)]"
          strokeWidth={1.5}
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 15, -15, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          className="absolute -right-3 -top-3 flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--card-border)] bg-[var(--card)] shadow-lg"
        >
          <Sparkles className="h-4 w-4 text-[var(--chart-2)]" />
        </motion.div>
      </motion.div>
    </div>
  );
}

function FeaturePill({
  icon: Icon,
  label,
  delay,
}: {
  icon: React.ElementType;
  label: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2, scale: 1.03 }}
      className="group flex items-center gap-2 rounded-full border border-[var(--card-border)] bg-[var(--card)]/60 px-3.5 py-1.5 text-xs font-medium text-[var(--muted)] backdrop-blur-sm transition-colors hover:text-[var(--foreground)]"
    >
      <Icon className="h-3.5 w-3.5 text-[var(--accent)] transition-transform group-hover:scale-110" />
      <span>{label}</span>
    </motion.div>
  );
}

function InputField({
  type,
  icon: Icon,
  label,
  placeholder,
  value,
  onChange,
  focused,
  onFocus,
  onBlur,
  autoComplete,
  rightSlot,
}: {
  type: string;
  icon: React.ElementType;
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  focused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  autoComplete: string;
  rightSlot?: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
        {label}
      </label>
      <div className="relative">
        <motion.div
          initial={false}
          animate={{ opacity: focused ? 1 : 0, scale: focused ? 1 : 0.98 }}
          transition={{ duration: 0.3 }}
          className="pointer-events-none absolute -inset-[1.2px] rounded-2xl bg-gradient-to-r from-[var(--accent)] via-[var(--chart-2)] to-[var(--accent)] opacity-[0.18] blur-sm"
        />
        <div
          className={`relative overflow-hidden rounded-2xl border transition-all ${focused
            ? "border-[var(--accent)]/60 bg-[var(--background)]"
            : "border-[var(--card-border)] bg-[var(--background)]/80"
            }`}
        >
          <motion.div
            initial={false}
            animate={{ x: focused ? ["-100%", "100%"] : "-100%" }}
            transition={{
              duration: 1.5,
              repeat: focused ? Infinity : 0,
              repeatDelay: 2,
              ease: "easeInOut",
            }}
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-[var(--accent)]/10 to-transparent"
          />
          <div
            className={`pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 transition-colors ${focused ? "text-[var(--accent)]" : "text-[var(--muted)]"
              }`}
          >
            <Icon className="h-[18px] w-[18px]" />
          </div>
          <div className="relative w-full">
            <input
              type={type}
              className="relative w-full bg-transparent py-3.5 pl-12 pr-12 text-sm font-medium text-[var(--foreground)] outline-none"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onFocus={onFocus}
              onBlur={onBlur}
              autoComplete={autoComplete}
              required
            />
            {!value && (
              <div className="pointer-events-none absolute inset-y-0 left-12 flex items-center">
                {placeholder.split("").map((char, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, filter: "blur(4px)", x: -2 }}
                    animate={{ opacity: 1, filter: "blur(0px)", x: 0 }}
                    transition={{
                      delay: 0.6 + i * 0.08,
                      duration: 0.4,
                      ease: "easeOut",
                    }}
                    className="text-sm font-medium text-[var(--muted)]/50"
                  >
                    {char === " " ? "\u00A0" : char}
                  </motion.span>
                ))}
              </div>
            )}
          </div>
          {rightSlot && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              {rightSlot}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function GirisPage() {
  const router = useRouter();
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [shakeKey, setShakeKey] = React.useState(0);
  const [focused, setFocused] = React.useState<"user" | "pass" | null>(null);

  const isReady = username.trim() !== "" && password.trim() !== "";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isReady) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Giriş başarısız");
        setShakeKey((n) => n + 1);
        return;
      }
      router.push("/panel");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[var(--background)]">
      <AmbientOrbs />
      <GridPattern />
      <Particles />
      <ShootingStar delay={0} />
      <ShootingStar delay={3} />

      <div className="relative hidden flex-col lg:flex lg:w-[55%] xl:w-[58%]">
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-12 xl:px-20">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center text-center"
          >
            <div className="mb-14">
              <TiltLogo />
            </div>



            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="max-w-xl text-5xl font-black leading-[1.05] tracking-tight text-[var(--foreground)] xl:text-6xl"
            >
              <motion.span
                animate={{ backgroundPosition: ["0% center", "200% center"] }}
                transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                className="bg-gradient-to-r from-[var(--accent)] via-[var(--chart-2)] to-[var(--accent)] bg-[length:200%_auto] bg-clip-text text-transparent"
              >
                Dijital Kütüphanem
              </motion.span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.7 }}
              className="mt-6 max-w-md text-base leading-relaxed text-[var(--muted)]"
            >
              Kitaplar, öğrenciler ve ödünç işlemleri — tek bir zarif platformda.
            </motion.p>

            <div className="mt-10 flex flex-wrap justify-center gap-2.5">
              <a href="https://github.com/cinarxdev" target="_blank" rel="noopener noreferrer">
                <FeaturePill icon={Github} label="cinarxdev" delay={0.7} />
              </a>
            </div>
          </motion.div>
        </div>


      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center border-l border-[var(--card-border)] bg-[var(--card)]/40 px-6 py-12 backdrop-blur-xl sm:px-10 lg:px-14">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--accent)]/30 to-transparent" />
          <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-[var(--accent)]/20 to-transparent" />
          <motion.div
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ repeat: Infinity, duration: 4 }}
            className="absolute -right-[30%] -top-[30%] h-[70%] w-[70%] rounded-full bg-[var(--accent)]/[0.05] blur-[80px]"
          />
        </div>

        <motion.div
          key={shakeKey}
          animate={shakeKey > 0 ? { x: [0, -10, 10, -8, 8, -4, 4, 0] } : {}}
          transition={{ duration: 0.5 }}
          className="relative z-10 w-full max-w-[400px]"
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="mb-8 flex flex-col items-center text-center lg:hidden">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--card-border)] bg-[var(--card)] shadow-lg shadow-[var(--accent)]/10">
                <Library className="h-7 w-7 text-[var(--accent)]" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
                Kütüphane Yönetimi
              </h1>
            </div>

            <motion.div
              className="mb-8"
            >
              <h2 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
                {"Hoş Geldiniz".split("").map((char, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, filter: "blur(4px)", y: 4 }}
                    animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                    transition={{
                      delay: 0.5 + i * 0.04,
                      duration: 0.4,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="inline-block"
                  >
                    {char === " " ? "\u00A0" : char}
                  </motion.span>
                ))}
              </h2>
              <p className="mt-1.5 text-sm text-[var(--muted)]">
                {"Devam etmek için oturum açın.".split("").map((char, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{
                      delay: 1.1 + i * 0.02,
                      duration: 0.3,
                    }}
                  >
                    {char}
                  </motion.span>
                ))}
              </p>
            </motion.div>

            <form onSubmit={onSubmit} className="space-y-5">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                <InputField
                  type="text"
                  icon={User}
                  label="Kullanıcı Adı"
                  placeholder="Kullanıcı Adınız"
                  value={username}
                  onChange={setUsername}
                  focused={focused === "user"}
                  onFocus={() => setFocused("user")}
                  onBlur={() => setFocused(null)}
                  autoComplete="username"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.58, duration: 0.5 }}
              >
                <InputField
                  type={showPassword ? "text" : "password"}
                  icon={Lock}
                  label="Şifre"
                  placeholder="••••••••"
                  value={password}
                  onChange={setPassword}
                  focused={focused === "pass"}
                  onFocus={() => setFocused("pass")}
                  onBlur={() => setFocused(null)}
                  autoComplete="current-password"
                  rightSlot={
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      tabIndex={-1}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--muted)] transition-colors hover:bg-[var(--background)] hover:text-[var(--accent)]"
                    >
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                          key={showPassword ? "on" : "off"}
                          initial={{ opacity: 0, rotate: -90 }}
                          animate={{ opacity: 1, rotate: 0 }}
                          exit={{ opacity: 0, rotate: 90 }}
                          transition={{ duration: 0.2 }}
                        >
                          {showPassword ? (
                            <EyeOff className="h-[18px] w-[18px]" />
                          ) : (
                            <Eye className="h-[18px] w-[18px]" />
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </button>
                  }
                />
              </motion.div>

              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, height: 0, y: -4 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -4 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center justify-center gap-2 rounded-xl border border-[var(--danger)]/25 bg-[var(--danger)]/10 px-4 py-3 text-center text-sm font-medium text-[var(--danger)]">
                      <motion.span
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--danger)]"
                      />
                      {error}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.66, duration: 0.5 }}
              >
                <motion.button
                  type="submit"
                  disabled={loading || !isReady}
                  initial={false}
                  animate={{
                    opacity: isReady ? 1 : 0.4,
                    scale: isReady ? 1 : 0.98,
                  }}
                  whileHover={isReady && !loading ? { scale: 1.015 } : {}}
                  whileTap={isReady && !loading ? { scale: 0.985 } : {}}
                  className="group relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-[var(--accent)] py-3.5 text-sm font-semibold text-white shadow-lg shadow-[var(--accent)]/25 transition-shadow hover:shadow-xl hover:shadow-[var(--accent)]/35 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
                  <div className={`absolute inset-0 bg-gradient-to-r from-[var(--accent)] via-[var(--chart-2)] to-[var(--accent)] transition-opacity duration-500 ${isReady ? "opacity-100 group-hover:opacity-80" : "opacity-0"}`} />
                  <span className="relative z-10 flex items-center gap-2.5">
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Giriş yapılıyor…
                      </>
                    ) : (
                      <>
                        Giriş Yap
                        <ArrowRight className={`h-4 w-4 transition-transform ${isReady ? "group-hover:translate-x-1" : ""}`} />
                      </>
                    )}
                  </span>
                </motion.button>
              </motion.div>
            </form>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.85, duration: 0.6 }}
              className="mt-8 text-center text-sm text-[var(--muted)]"
            >
              Kayıtlı değil misiniz?{" "}
              <a
                href="/basvuru"
                className="font-semibold text-[var(--accent)] transition-colors hover:text-[var(--accent-hover)]"
              >
                Hemen Dijital Kütüphanem&apos;e katılın.
              </a>
            </motion.div>

          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}