"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { UsageMeter } from "@/components/ui/UsageMeter";
import {
  BookOpen,
  FileText,
  Settings,
  CreditCard,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut, loading } = useAuth();
  const { usage, subscriptionStatus } = useSubscription();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Note: Prompt usage is tracked via localStorage in useAIPrompt hook
  // The SubscriptionContext will update on next page navigation or refresh
  // No need to reload the page - that was causing crashes

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const navigation = [
    { name: "New Entry", href: "/journal/new", icon: BookOpen },
    { name: "Entries", href: "/entries", icon: FileText },
    { name: "Settings", href: "/settings", icon: Settings },
    { name: "Billing", href: "/billing", icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/20 to-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-72 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-white/80 backdrop-blur-xl border-r border-gray-200/60 shadow-xl">
          <div className="flex-1 flex flex-col pt-6 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-6 mb-8">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                AI Journaling
              </h1>
            </div>
            <nav className="flex-1 px-3 space-y-1.5">
              {subscriptionStatus === "free" && (
                <div className="mb-6 px-4 py-3 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200/60 shadow-sm">
                  <UsageMeter
                    current={usage.promptsUsed}
                    limit={usage.promptsLimit}
                    label="AI Prompts"
                  />
                </div>
              )}
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200
                      ${
                        isActive
                          ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30"
                          : "text-gray-700 hover:bg-indigo-50/50 hover:text-indigo-700"
                      }
                    `}
                  >
                    <Icon
                      className={`mr-3 h-5 w-5 transition-transform group-hover:scale-110 ${
                        isActive ? "text-white" : "text-gray-400 group-hover:text-indigo-600"
                      }`}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-200/60 p-4 bg-gray-50/50">
            <div className="flex-shrink-0 w-full group block">
              <div className="flex items-center">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">
                    {user?.email}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="ml-2 hover:bg-red-50 hover:text-red-600 transition-colors"
                  aria-label="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="md:hidden">
        <div className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-xl border-b border-gray-200/60 shadow-sm">
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            AI Journaling
          </h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            className="hover:bg-indigo-50"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>
        {mobileMenuOpen && (
          <div className="bg-white/95 backdrop-blur-xl border-b border-gray-200/60 shadow-lg">
            <nav className="px-3 pt-2 pb-3 space-y-1.5">
              {subscriptionStatus === "free" && (
                <div className="mb-4 px-4 py-3 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200/60 mx-2">
                  <UsageMeter
                    current={usage.promptsUsed}
                    limit={usage.promptsLimit}
                    label="AI Prompts"
                  />
                </div>
              )}
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`
                      group flex items-center px-4 py-3 text-base font-medium rounded-xl transition-all duration-200
                      ${
                        isActive
                          ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                          : "text-gray-700 hover:bg-indigo-50/50 hover:text-indigo-700"
                      }
                    `}
                  >
                    <Icon
                      className={`mr-3 h-6 w-6 ${
                        isActive ? "text-white" : "text-gray-400 group-hover:text-indigo-600"
                      }`}
                    />
                    {item.name}
                  </Link>
                );
              })}
              <button
                onClick={handleSignOut}
                className="group flex items-center px-4 py-3 text-base font-medium rounded-xl text-gray-700 hover:bg-red-50 hover:text-red-600 w-full transition-colors"
              >
                <LogOut className="mr-3 h-6 w-6 text-gray-400 group-hover:text-red-600" />
                Sign Out
              </button>
            </nav>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="md:pl-72 flex flex-col flex-1">
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

