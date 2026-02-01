'use client';
import { ChefHat, Menu } from "lucide-react";
import { ModeToggle } from "./ThemeSwitcher";
import { Link } from '@/i18n/routing';
import { slide as MenuSlide } from "react-burger-menu";
import { useState } from "react";
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from './LanguageSwitcher';

export default function Header() {
   const [isOpen, setIsOpen] = useState(false);
   const t = useTranslations('navigation');

   return (
      <header className="border-b border-border relative">
         <div className="mx-auto w-full max-w-[2000px] px-6 lg:px-10 h-16 grid grid-cols-[1fr_auto_1fr] md:grid-cols-[1fr_auto_1fr_auto] items-center">
            <div className="flex items-center gap-2 text-primary">
               <ChefHat size={30} />
               <h2>NutriTrack</h2>
            </div>
            <nav className="justify-self-center hidden md:block">
               <ul className="flex items-center gap-8 text-muted-foreground font-semibold">
                  <li className="transition-colors hover:text-primary">
                     <Link href="/">{t('dashboard')}</Link>
                  </li>
                  <li className="transition-colors hover:text-primary">
                     <Link href="/ingredients">{t('ingredients')}</Link>
                  </li>
                  <li className="transition-colors hover:text-primary">
                     <Link href="/recipes">{t('recipes')}</Link>
                  </li>
                  <li className="transition-colors hover:text-primary">
                     <Link href="/cooking-history">{t('history')}</Link>
                  </li>
               </ul>
            </nav>
            <div className="absolute right-20 hidden md:flex items-center gap-4">
               <LanguageSwitcher />
               <ModeToggle />
            </div>
            <button
               type="button"
               className="md:hidden rounded-md p-2 absolute right-4"
               aria-expanded={isOpen}
               aria-label="Toggle navigation"
               onClick={() => setIsOpen((prev) => !prev)}>
               <Menu size={24} />
            </button>
            <MenuSlide
               right
               isOpen={isOpen}
               onStateChange={(s) => setIsOpen(s.isOpen)}
               customBurgerIcon={false}
               customCrossIcon={false}
               width={"80%"}
               overlayClassName="absolute top-0 left-0"
               disableAutoFocus>
               <ul className="flex items-center gap-8 font-semibold">
                  <li className="transition-colors hover:text-primary active:text-primary" onClick={() => setIsOpen(false)}>
                     <Link href="/">{t('dashboard')}</Link>
                  </li>
                  <li className="transition-colors hover:text-primary active:text-primary" onClick={() => setIsOpen(false)}>
                     <Link href="/ingredients">{t('ingredients')}</Link>
                  </li>
                  <li className="transition-colors hover:text-primary active:text-primary" onClick={() => setIsOpen(false)}>
                     <Link href="/recipes">{t('recipes')}</Link>
                  </li>
                  <li className="transition-colors hover:text-primary active:text-primary" onClick={() => setIsOpen(false)}>
                     <Link href="/cooking-history">{t('history')}</Link>
                  </li>
               </ul>
               <div className="md:hidden flex flex-col gap-4">
                  <LanguageSwitcher />
                  <ModeToggle />
               </div>
            </MenuSlide>
         </div>
      </header>
   );
}
