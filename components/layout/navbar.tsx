"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, ChevronRight, LogIn, UserPlus, Sun, Moon } from "lucide-react"
import Image from "next/image"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet"
import { motion } from "framer-motion"
import { navigationLinks } from "@/lib/navigation"
import { useTheme } from "next-themes"

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0 }
}

export function Navbar() {
  const { setTheme, theme } = useTheme()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
        <div className="flex w-full justify-between items-center">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center space-x-2 group cursor-pointer">
              <Image src="/logo.svg" alt="Odoo" width={24} height={24} className="w-6 h-6 group-hover:opacity-80 transition-opacity" />
              <span className="font-bold text-lg tracking-tight sm:inline-block">
                Odoo
              </span>
            </Link>
            <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
              {navigationLinks.map((link) => (
                <Link key={link.href} href={link.href} className="flex items-center gap-2 transition-colors hover:text-primary text-foreground/70 cursor-pointer">
                  <link.icon className="h-4 w-4" /> {link.title}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button asChild variant="outline" size="sm" className="font-medium rounded-none px-4 cursor-pointer shadow-sm">
                  <Link href="/login">Log in</Link>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button asChild size="sm" className="font-medium rounded-none px-4 cursor-pointer shadow-sm">
                  <Link href="/signup">Sign up</Link>
                </Button>
              </motion.div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "light" ? "dark" : "light")} className="cursor-pointer rounded-none md:mr-2">
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden cursor-pointer">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle className="text-left font-bold text-lg flex items-center gap-2">
                    <Image src="/logo.svg" alt="Odoo" width={24} height={24} className="w-6 h-6" /> Odoo
                  </SheetTitle>
                </SheetHeader>
                <motion.nav
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="flex flex-col space-y-3 mt-10 text-sm font-medium"
                >
                  {navigationLinks.map((link) => (
                    <motion.div key={link.href} variants={itemVariants}>
                      <Link href={link.href} className="flex items-center gap-3 p-3 rounded-none bg-muted/30 border border-transparent hover:border-border transition-colors cursor-pointer text-foreground/80 hover:text-primary">
                        <link.icon className="h-4 w-4" />
                        <span className="flex-1">{link.title}</span>
                        <ChevronRight className="h-4 w-4 opacity-50" />
                      </Link>
                    </motion.div>
                  ))}

                  <motion.div variants={itemVariants} className="pt-4 mt-4 border-t border-border/40 space-y-3">
                    <Link href="/login" className="flex items-center gap-3 p-3 rounded-none bg-muted/30 border border-transparent hover:border-border transition-colors cursor-pointer text-foreground/80 hover:text-primary">
                      <LogIn className="h-4 w-4" />
                      <span className="flex-1">Log in</span>
                      <ChevronRight className="h-4 w-4 opacity-50" />
                    </Link>
                    <Link href="/signup" className="flex items-center gap-3 p-3 rounded-none bg-muted/30 border border-transparent hover:border-border transition-colors cursor-pointer text-foreground/80 hover:text-primary">
                      <UserPlus className="h-4 w-4" />
                      <span className="flex-1">Sign up</span>
                      <ChevronRight className="h-4 w-4 opacity-50" />
                    </Link>
                  </motion.div>
                </motion.nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
