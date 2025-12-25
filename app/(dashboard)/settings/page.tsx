"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Trash2, User, Bell, Shield } from "lucide-react";

export default function SettingsPage() {
  const { user, appUser, signOut } = useAuth();
  const { subscriptionStatus } = useSubscription();

  const handleDeleteAccount = () => {
    if (
      confirm(
        "Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted."
      )
    ) {
      alert("Account deletion will be implemented when backend is ready");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Manage your account and preferences</p>
      </div>

      {/* Profile Section */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <User className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={user?.email || ""}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
            <p className="text-xs text-gray-500 mt-1">
              Your email is managed through Google OAuth
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subscription Status
            </label>
            <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
              <span className="text-gray-900 capitalize">{subscriptionStatus}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Privacy Section */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Shield className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Privacy & Security</h2>
        </div>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Your journal entries are encrypted and stored securely. We never share your
            data with third parties.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Privacy Promise:</strong> Your journal entries are private and
              secure. We use encryption to protect your data, and AI prompts are
              generated without storing your content for training purposes.
            </p>
          </div>
        </div>
      </Card>

      {/* Account Actions */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Bell className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Account Actions</h2>
        </div>
        <div className="space-y-4">
          <Button variant="secondary" onClick={signOut} className="w-full md:w-auto">
            Sign Out
          </Button>
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-red-600 mb-2">
              Danger Zone
            </h3>
            <Button
              variant="danger"
              onClick={handleDeleteAccount}
              className="w-full md:w-auto"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Account
            </Button>
            <p className="text-xs text-gray-500 mt-2">
              Permanently delete your account and all associated data. This action
              cannot be undone.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

