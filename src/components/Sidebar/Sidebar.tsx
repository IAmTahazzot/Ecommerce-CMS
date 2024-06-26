'use client'

import { cn } from '@/lib/utils'
import { MdKeyboardArrowRight, MdKeyboardArrowDown } from 'react-icons/md'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLayout } from '@/hooks/useLayout'
import { useUser, UserButton } from '@clerk/nextjs'
import { Skeleton } from '../ui/skeleton'

export type navItem = {
  name: string
  href: string
  icon?: React.ReactNode
  children?: navItem[]
}

export type navList = {
  title: string
  navItems: navItem[]
}

interface SidebarProps {
  navigation?: navList[]
  activeShopUrl: string
}

/**
 *
 * @Component Sidebar
 *
 * @description
 * This component is a sidebar navigation component that displays a list of navigation items.
 * It also supports submenus for each navigation item, [WARNING]: However, it only supports one level of nesting.
 *
 * @todo
 * - Add infinite nesting for submenus
 */
export const Sidebar = ({ navigation, activeShopUrl }: SidebarProps) => {
  const fullPath = usePathname()
  const { user, isLoaded } = useUser()
  const [activeRoot, setActiveRoot] = useState<number | null>(null)
  const [activeSubmenu, setActiveSubmenu] = useState<number | null>(null)
  const { sidebar } = useLayout()
  const shopUrl = 'http://localhost:3000/' + activeShopUrl
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubMenu = (rootIndex: number, index: number) => {
    setActiveRoot(rootIndex)
    setActiveSubmenu(index === activeSubmenu ? null : index)
  }

  const path = '/' + fullPath.slice(1).split('/').slice(1).join('/')

  return (
    <aside
      className={cn(
        'fixed top-0 flex flex-col w-[212px] h-full p-4 z-10 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 transition-transform',
        sidebar ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      <div className="flex items-center gap-x-2 h-8 mb-4">
        {user && isLoaded && (
          <>
            <UserButton />
            <h3 className="font-medium text-sm">
              {(user?.firstName || 'Unknown user') + ' ' + (user?.lastName || '')}
            </h3>
          </>
        )}
        {!isLoaded && <Skeleton className="w-6 h-6 rounded-full bg-slate-100" />}
        {!isLoaded && <Skeleton className="w-[130px] h-4 rounded-lg bg-slate-100" />}
      </div>

      <div className="flex flex-col gap-y-8 mt-6">
        {navigation?.map((nav, rootIndex) => (
          <div key={rootIndex}>
            <h3 className="text-[13px] text-neutral-400">{nav.title}</h3>

            <ul className="space-y-2 my-2">
              {nav.navItems.map((item, index) => (
                <li key={index}>
                  <Link
                    href={shopUrl + item.href}
                    className={cn(
                      'grid grid-cols-[24px_1fr_20px] items-center gap-x-1 h-8 text-sm text-neutral-900 dark:text-neutral-200 px-2 rounded-lg',
                      path === item.href ? 'bg-neutral-200/60 dark:bg-neutral-700' : ''
                    )}
                  >
                    <div className={cn('h-5 w-5 grid items-center justify-center')}>{item.icon}</div>
                    <span>{item.name}</span>

                    <div>
                      {item.children && (
                        <div
                          onClick={(e) => {
                            e.preventDefault()
                            handleSubMenu(rootIndex, index)
                          }}
                          className="h-5 w-5 grid items-center justify-center"
                        >
                          {activeSubmenu === index && activeRoot === rootIndex ? (
                            <MdKeyboardArrowDown className="w-5 h-5" />
                          ) : (
                            <MdKeyboardArrowRight className="w-5 h-5" />
                          )}
                        </div>
                      )}
                    </div>
                  </Link>

                  {item.children && (
                    <ul
                      className={cn(
                        'space-y-2 my-2',
                        activeSubmenu === index && activeRoot === rootIndex ? 'block' : 'hidden'
                      )}
                    >
                      {item.children.map((child, index) => (
                        <li key={index}>
                          <Link
                            href={shopUrl + child.href}
                            className={cn(
                              'grid grid-cols-[24px_1fr] items-center gap-x-1 h-8 text-sm text-neutral-900 dark:text-neutral-200 px-2 rounded-lg',
                              path === child.href ? 'bg-neutral-200/60 dark:bg-neutral-800' : ''
                            )}
                          >
                            <span className="col-start-2">{child.name}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </aside>
  )
}
