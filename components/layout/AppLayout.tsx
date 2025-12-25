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

  // Listen for prompt usage events to update UI
  useEffect(() => {
    const handlePromptUsed = () => {
      // Force a re-render by updating a state or triggering a context update
      // In production, this would be handled by the subscription context
      window.location.reload(); // Simple approach for now
    };
    window.addEventListener("prompt-used", handlePromptUsed);
    return () => window.removeEventListener("prompt-used", handlePromptUsed);
  }, []);

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
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <h1 className="text-2xl font-bold text-gray-900">
                AI Journaling
              </h1>
            </div>
            <nav className="mt-8 flex-1 px-2 space-y-1">
              {subscriptionStatus === "free" && (
                <div className="mb-4 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
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
                      group flex items-center px-3 py-2 text-sm font-medium rounded-md
                      ${
                        isActive
                          ? "bg-blue-50 text-blue-700"
                          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                      }
                    `}
                  >
                    <Icon
                      className={`mr-3 h-5 w-5 ${
                        isActive ? "text-blue-500" : "text-gray-400 group-hover:text-gray-500"
                      }`}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
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
                  className="ml-2"
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
        <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">AI Journaling</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>
        {mobileMenuOpen && (
          <div className="bg-white border-b border-gray-200">
            <nav className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`
                      group flex items-center px-3 py-2 text-base font-medium rounded-md
                      ${
                        isActive
                          ? "bg-blue-50 text-blue-700"
                          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                      }
                    `}
                  >
                    <Icon
                      className={`mr-3 h-6 w-6 ${
                        isActive ? "text-blue-500" : "text-gray-400 group-hover:text-gray-500"
                      }`}
                    />
                    {item.name}
                  </Link>
                );
              })}
              <button
                onClick={handleSignOut}
                className="group flex items-center px-3 py-2 text-base font-medium rounded-md text-gray-700 hover:bg-gray-50 hover:text-gray-900 w-full"
              >
                <LogOut className="mr-3 h-6 w-6 text-gray-400 group-hover:text-gray-500" />
                Sign Out
              </button>
            </nav>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

