"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, Link, usePathname } from '@/i18n/routing';
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from 'next-intl';
import {
  ArrowRight,
  Check,
  Clock,
  Coffee,
  FileText,
  Layout,
  ListTodo,
  Menu,
  Music,
  PlaySquare,
  Star,
  X,
  CloudSun,
  DollarSign,
  Languages,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import YouTube from "react-youtube";
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

const transitionVariants = {
  item: {
    hidden: {
      opacity: 0,
      filter: "blur(12px)",
      y: 12,
    },
    visible: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: {
        type: "spring",
        bounce: 0.3,
        duration: 1.5,
      },
    },
  },
};

interface TextRotateProps {
  texts: string | string[];
  rotationInterval?: number;
  mainClassName?: string;
}

function TextRotate({
  texts,
  rotationInterval = 3000,
  mainClassName,
}: TextRotateProps) {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const textArray = Array.isArray(texts) ? texts : [texts];

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTextIndex((prevIndex) =>
        prevIndex === textArray.length - 1 ? 0 : prevIndex + 1
      );
    }, rotationInterval);

    return () => clearInterval(intervalId);
  }, [textArray, rotationInterval]);

  return (
    <span className={`overflow-hidden inline-block ${mainClassName}`}>
      <AnimatePresence mode="wait">
        <motion.span
          key={currentTextIndex}
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{ type: "spring", damping: 30, stiffness: 400 }}
          className="inline-block"
        >
          {textArray[currentTextIndex]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  const router = useRouter();

  return (
    <Card className="p-6 border border-border/50 hover:border-primary/20 transition-all hover:shadow-md group flex flex-col justify-between h-full">
      <div>
        <div className="mb-4 p-3 w-14 h-14 flex items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
          {icon}
        </div>
        <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-muted-foreground mb-4">{description}</p>
      </div>
    </Card>
  );
}

interface TestimonialProps {
  name: string;
  role: string;
  company?: string;
  testimonial: string;
  rating?: number;
  image?: string;
}

function Testimonial({
  name,
  role,
  company,
  testimonial,
  rating = 5,
  image,
}: TestimonialProps) {
  const starIds = ["first", "second", "third", "fourth", "fifth"];

  return (
    <Card className="p-6 border border-primary/10 bg-background hover:shadow-lg transition-all">
      <div className="absolute right-6 top-6 text-6xl font-serif text-muted-foreground/20">
        "
      </div>

      <div className="flex flex-col gap-4 justify-between h-full">
        {rating > 0 && (
          <div className="flex gap-1">
            {starIds.map((id, index) => (
              <Star
                key={id}
                size={16}
                className={
                  index < rating
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-muted text-muted"
                }
              />
            ))}
          </div>
        )}

        <p className="text-pretty text-base text-muted-foreground">
          {testimonial}
        </p>

        <div className="flex items-center gap-4 justify-start">
          <div className="flex items-center gap-4">
            {image && (
              <Avatar>
                <AvatarImage src={image} alt={name} height={48} width={48} />
                <AvatarFallback>{name[0]}</AvatarFallback>
              </Avatar>
            )}

            <div className="flex flex-col">
              <h3 className="font-semibold text-foreground">{name}</h3>
              <p className="text-sm text-muted-foreground">
                {role}
                {company && ` @ ${company}`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

interface MenuItem {
  name: string;
  href: string;
}

const menuItems: MenuItem[] = [
  { name: "nav.features", href: "#features-section" },
  { name: "nav.preview", href: "#preview-section" },
];

const HeroHeader = () => {
  const [menuState, setMenuState] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('landing');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      const element = document.getElementById(href.substring(1));
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
        setMenuState(false);
      }
    }
  };

  return (
    <header>
      <nav
        data-state={menuState ? "active" : undefined}
        className="fixed z-50 w-full px-2 group"
      >
        <motion.div
          className={cn(
            "mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:px-12",
            isScrolled &&
              "bg-background/80 max-w-4xl rounded-2xl border backdrop-blur-lg lg:px-5 shadow-md"
          )}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
            <motion.div
              className="flex w-full justify-between lg:w-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Link
                href="/"
                aria-label="home"
                className="flex items-center space-x-2 group"
              >
                <motion.div
                  animate={{ rotate: [0, 15, 0] }}
                  transition={{
                    duration: 5,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                >
                  <Coffee className="h-6 w-6 text-primary mr-2 group-hover:scale-110 transition-transform" />
                </motion.div>
                <span className="text-xl font-bold">
                  Focus
                  <motion.span
                    className="text-primary"
                    animate={{
                      color: [
                        "hsl(var(--primary))",
                        "hsl(var(--primary-foreground))",
                        "hsl(var(--primary))",
                      ],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "easeInOut",
                    }}
                  >
                    Brew
                  </motion.span>
                </span>
              </Link>

              <button
                type="button"
                onClick={() => setMenuState(!menuState)}
                aria-label={menuState ? "Close Menu" : "Open Menu"}
                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden"
              >
                <Menu
                  className={cn(
                    "m-auto size-6 duration-200",
                    menuState && "rotate-180 scale-0 opacity-0"
                  )}
                />
                <X
                  className={cn(
                    "absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200",
                    menuState && "rotate-0 scale-100 opacity-100"
                  )}
                />
              </button>
            </motion.div>

            <div className="absolute inset-0 m-auto hidden size-fit lg:block">
              <motion.ul
                className="flex gap-8 text-sm"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                {menuItems.map((item) => (
                  <motion.li
                    key={item.name}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.3,
                      delay: 0.2 + menuItems.indexOf(item) * 0.1,
                    }}
                  >
                    <Link
                      href={item.href}
                      className="text-muted-foreground hover:text-primary block duration-150 relative"
                      onClick={(e) => handleNavClick(e, item.href)}
                      onMouseEnter={(e) => {
                        const underline =
                          e.currentTarget.querySelector("[data-underline]");
                        if (underline) {
                          (underline as HTMLElement).style.width = "100%";
                        }
                      }}
                      onMouseLeave={(e) => {
                        const underline =
                          e.currentTarget.querySelector("[data-underline]");
                        if (underline) {
                          (underline as HTMLElement).style.width = "0";
                        }
                      }}
                    >
                      <span>{t(item.name)}</span>
                      <span
                        data-underline
                        className="absolute -bottom-1 left-0 w-0 h-[1px] bg-primary/30 transition-all duration-300"
                      />
                    </Link>
                  </motion.li>
                ))}
              </motion.ul>
            </div>

            <motion.div
              className={cn(
                "bg-background/90 mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-2xl border p-6 shadow-2xl shadow-zinc-300/20 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:shadow-none dark:lg:bg-transparent backdrop-blur-md",
                menuState && "block"
              )}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className="lg:hidden">
                <ul className="space-y-6 text-base">
                  {menuItems.map((item: MenuItem) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className="text-muted-foreground hover:text-primary block duration-150 relative"
                        onClick={(e) => handleNavClick(e, item.href)}
                        onMouseEnter={(e) => {
                          const underline =
                            e.currentTarget.querySelector("[data-underline]");
                          if (underline) {
                            (underline as HTMLElement).style.width = "100%";
                          }
                        }}
                        onMouseLeave={(e) => {
                          const underline =
                            e.currentTarget.querySelector("[data-underline]");
                          if (underline) {
                            (underline as HTMLElement).style.width = "0";
                          }
                        }}
                      >
                        <span>{t(item.name)}</span>
                        <span
                          data-underline
                          className="absolute -bottom-1 left-0 w-0 h-[1px] bg-primary/30 transition-all duration-300"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all duration-300"
                  onClick={() =>
                    window.open(
                      "https://github.com/birobirobiro/focus-brew",
                      "_blank"
                    )
                  }
                >
                  <GitHubLogoIcon className="h-4 w-4" />
                  <span className="hidden md:inline">{t('nav.github')}</span>
                </Button>
                <LanguageSwitcher />
              </div>
            </motion.div>
          </div>
        </motion.div>
      </nav>
    </header>
  );
};

function HeroSection() {
  const router = useRouter();
  const t = useTranslations('landing');

  return (
    <div className="min-h-screen">
      <HeroHeader />
      <main className="overflow-hidden">
        <div
          aria-hidden
          className="z-[2] absolute inset-0 pointer-events-none isolate opacity-60 contain-strict hidden lg:block"
        >
          <div className="w-[35rem] h-[80rem] -translate-y-[350px] absolute left-0 top-0 -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsla(var(--primary)/0.15)_0,hsla(var(--primary)/0.10)_50%,hsla(var(--primary)/0)_80%)]" />
          <div className="h-[80rem] absolute right-0 top-0 w-56 -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsla(var(--primary)/0.10)_0,hsla(var(--primary)/0.02)_80%,transparent_100%)] [translate:5%_-50%]" />
          <div className="h-[60rem] w-[60rem] absolute -right-10 top-[20%] rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsla(var(--secondary)/0.08)_0,hsla(var(--secondary)/0.03)_50%,transparent_100%)]" />

          {/* Floating elements */}
          <motion.div
            className="absolute top-[30%] left-[20%] w-16 h-16 rounded-full bg-primary/10 backdrop-blur-xl"
            animate={{
              y: [0, -30, 0],
              x: [0, 15, 0],
              rotate: [0, 5, 0],
            }}
            transition={{
              duration: 10,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute top-[45%] right-[25%] w-24 h-24 rounded-xl bg-secondary/10 backdrop-blur-xl"
            animate={{
              y: [0, 40, 0],
              x: [0, -20, 0],
              rotate: [0, -10, 0],
            }}
            transition={{
              duration: 12,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 2,
            }}
          />
          <motion.div
            className="absolute top-[25%] right-[15%] w-12 h-12 rounded-full border border-primary/20 backdrop-blur-xl"
            animate={{
              y: [0, -20, 0],
              x: [0, -15, 0],
              rotate: [0, 15, 0],
            }}
            transition={{
              duration: 8,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 1,
            }}
          />
        </div>

        <div
          aria-hidden
          className="absolute inset-0 -z-10 size-full [background:radial-gradient(125%_145%_at_50%_10%,transparent_0%,hsl(var(--primary)/0.08)_30%,var(--background)_75%)]"
        />

        <section className="relative">
          <div className="relative pt-20 sm:pt-28 md:pt-44">
            <motion.div
              className="absolute inset-0 -z-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, delay: 0.5 }}
            >
              <div
                className="absolute inset-x-0 top-56 -z-20 hidden lg:top-32 dark:block bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-background to-background"
                style={{ height: "70vh" }}
              />
            </motion.div>

            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <div className="text-center sm:mx-auto lg:mr-auto lg:mt-0">
                <motion.h1
                  className="mt-6 sm:mt-10 max-w-4xl mx-auto text-balance text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-[5.25rem] font-bold"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  {t('hero.title.prefix')}{" "}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
                    Focus
                  </span>
                  <TextRotate
                    texts={t.raw('hero.title.rotating')}
                    mainClassName="bg-clip-text text-transparent bg-gradient-to-r from-primary/70 to-primary ml-2"
                  />
                </motion.h1>

                <motion.p
                  className="mx-auto mt-10 max-w-2xl text-balance text-lg text-muted-foreground"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                >
                  {t('hero.description')}
                </motion.p>

                <motion.div
                  className="mt-14 flex flex-col items-center justify-center gap-4 md:flex-row md:gap-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                >
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-primary/60 rounded-xl blur opacity-60 group-hover:opacity-100 transition duration-300" />
                    <Button
                      size="lg"
                      className="relative rounded-xl px-8 py-6 text-base font-medium bg-background text-foreground hover:text-background hover:bg-primary border border-primary/20 transition-all duration-300 flex items-center gap-2"
                      onClick={() => router.push('/app')}
                    >
                      <span>{t('hero.cta.primary')}</span>
                      <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </div>
                </motion.div>
              </div>
            </div>

            <motion.div
              className="relative mx-auto lg:mx-auto xl:mx-auto mt-20 sm:mt-32 md:mt-40 overflow-hidden px-2 sm:px-4 md:px-6"
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                duration: 0.8,
                delay: 0.6,
                type: "spring",
                bounce: 0.2,
              }}
            >
              <div
                aria-hidden
                className="bg-gradient-to-b to-background absolute inset-0 z-10 from-transparent from-35%"
              />
              <div className="bg-background relative mx-auto max-w-[90vw] sm:max-w-[95%] md:max-w-6xl overflow-hidden rounded-2xl border p-2 sm:p-5 shadow-lg shadow-black/15 ring-1 ring-white/10">
                <div className="aspect-video bg-muted flex items-center justify-center overflow-hidden rounded-lg relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent z-10" />
                  <Image
                    src="/images/preview.png"
                    alt="FocusBrew App Preview"
                    width={1200}
                    height={675}
                    className="w-full h-auto object-contain rounded-lg"
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 90vw, (max-width: 1024px) 80vw, 1200px"
                    priority
                    loading="eager"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* App Stats Section */}
        <section className="py-16 mt-24 md:mt-40 bg-background/80 backdrop-blur-sm relative z-10">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <Badge variant="outline" className="mb-4 px-3 py-1">
                <span className="text-muted-foreground">{t('stats.badge')}</span>
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {t('stats.title')}
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                {t('stats.subtitle')}
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-10 max-w-4xl mx-auto">
              {Object.entries(t.raw('stats.items') as Record<string, { value: string; label: string }>).map(([key, item], index) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * index }}
                  className="flex flex-col items-center justify-center text-center"
                >
                  <h3 className="text-4xl font-bold text-primary mb-2">{item.value}</h3>
                  <p className="text-muted-foreground">{item.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function FocusBrewLanding() {
  const router = useRouter();
  const t = useTranslations('landing');

  const features = [
    {
      icon: <ListTodo className="h-6 w-6 text-primary" />,
      title: t('features.todo.title'),
      description: t('features.todo.description'),
    },
    {
      icon: <Clock className="h-6 w-6 text-primary" />,
      title: t('features.pomodoro.title'),
      description: t('features.pomodoro.description'),
    },
    {
      icon: <Layout className="h-6 w-6 text-primary" />,
      title: t('features.kanban.title'),
      description: t('features.kanban.description'),
    },
    {
      icon: <Music className="h-6 w-6 text-primary" />,
      title: t('features.ambient.title'),
      description: t('features.ambient.description'),
    },
    {
      icon: <FileText className="h-6 w-6 text-primary" />,
      title: t('features.notepad.title'),
      description: t('features.notepad.description'),
    },
    {
      icon: <PlaySquare className="h-6 w-6 text-primary" />,
      title: t('features.youtube.title'),
      description: t('features.youtube.description'),
    },
    {
      icon: <Check className="h-6 w-6 text-primary" />,
      title: t('features.habits.title'),
      description: t('features.habits.description'),
    },
    {
      icon: <CloudSun className="h-6 w-6 text-primary" />,
      title: t('features.weather.title'),
      description: t('features.weather.description'),
    },
    {
      icon: <DollarSign className="h-6 w-6 text-primary" />,
      title: t('features.currency.title'),
      description: t('features.currency.description'),
    },
  ];

  const appPreviews = {
    todo: [
      "/images/todo-preview-1.jpg",
      "/images/todo-preview-2.jpg",
      "/images/todo-preview-3.jpg",
    ],
    pomodoro: [
      "/images/pomodoro-preview-1.jpg",
      "/images/pomodoro-preview-2.jpg",
      "/images/pomodoro-preview-3.jpg",
    ],
    kanban: [
      "/images/kanban-preview-1.jpg",
      "/images/kanban-preview-2.jpg",
      "/images/kanban-preview-3.jpg",
    ],
    ambient: [
      "/images/ambient-preview-1.jpg",
      "/images/ambient-preview-2.jpg",
      "/images/ambient-preview-3.jpg",
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <HeroSection />

      {/* Features Section */}
      <section
        id="features-section"
        className="py-20 md:py-28 bg-background/50 relative z-10 mt-10"
      >
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: features.indexOf(feature) * 0.1,
                }}
                viewport={{ once: true }}
              >
                <FeatureCard
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* App Preview Section */}
      <section
        id="preview-section"
        className="py-24 bg-background relative z-20"
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 px-3 py-1">
              <span className="text-muted-foreground">{t('preview.badge')}</span>
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('preview.title')}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('preview.subtitle')}
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="relative rounded-xl overflow-hidden border border-border/50 shadow-lg"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 z-10 pointer-events-none" />

              {/* YouTube Video */}
              <div className="aspect-video bg-muted">
                <YouTube
                  videoId="DUh3Cu3ZewU"
                  className="w-full h-full"
                  opts={{
                    height: "100%",
                    width: "100%",
                    playerVars: {
                      autoplay: 0,
                      modestbranding: 1,
                      rel: 0,
                    },
                  }}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="max-w-3xl mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              {t('contribute.title')}
            </h2>

            <p className="text-lg text-muted-foreground mb-10">
              {t('contribute.description')}
            </p>
            <div className="inline-block relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-secondary/30 rounded-xl blur opacity-30 group-hover:opacity-70 transition duration-300" />
              <Button
                size="lg"
                variant="outline"
                className="relative rounded-xl flex items-center gap-2 bg-background border-primary/20 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all duration-300"
                onClick={() =>
                  window.open(
                    "https://github.com/birobirobiro/focus-brew",
                    "_blank"
                  )
                }
              >
                <GitHubLogoIcon className="w-5 h-5" />
                <span>{t('contribute.cta')}</span>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-muted/30 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <h3 className="text-2xl font-bold">
                Focus<span className="text-primary">Brew</span>
              </h3>
              <p className="text-muted-foreground">{t('footer.slogan')}</p>
            </div>
            <div className="flex flex-wrap gap-4 md:gap-8 justify-center">
              <Link
                href="#features-section"
                className="text-muted-foreground hover:text-foreground transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  const element = document.getElementById("features-section");
                  if (element) {
                    element.scrollIntoView({ behavior: "smooth" });
                  }
                }}
              >
                {t('footer.nav.features')}
              </Link>
              <Link
                href="#preview-section"
                className="text-muted-foreground hover:text-foreground transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  const element = document.getElementById("preview-section");
                  if (element) {
                    element.scrollIntoView({ behavior: "smooth" });
                  }
                }}
              >
                {t('footer.nav.preview')}
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border text-center text-muted-foreground">
            <p>{t('footer.copyright', { year: new Date().getFullYear() })}</p>
          </div>
          <div className="mt-4 text-center text-muted-foreground text-sm opacity-80">
            {t('footer.vibe')}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default FocusBrewLanding;