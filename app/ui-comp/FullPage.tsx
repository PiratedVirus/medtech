import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export default function FullPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      <header className="w-full py-6 px-4 bg-white shadow">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Care Diabetics</h1>
          <nav className="space-x-4">
            <a href="#" className="text-gray-600 hover:text-gray-800">
              Home
            </a>
            <a href="#" className="text-gray-600 hover:text-gray-800">
              Services
            </a>
            <a href="#" className="text-gray-600 hover:text-gray-800">
              Doctors
            </a>
            <a href="#" className="text-gray-600 hover:text-gray-800">
              Blogs
            </a>
            <a href="#" className="text-gray-600 hover:text-gray-800">
              Testimonials
            </a>
            <a href="#" className="text-gray-600 hover:text-gray-800">
              About Us
            </a>
          </nav>
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center py-12">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-800">
            Care Diabetics: Sweet Life, Better Control
          </h2>
          <p className="mt-4 text-gray-600">
            India’s leading virtual platform for diabetes care.
          </p>
        </div>
        <div className="mt-8 w-full max-w-md">
          <Card>
            <CardContent>
              <h3 className="text-lg font-medium text-gray-800 mb-4">Sign in</h3>
              <form className="space-y-4">
                <label className="block text-sm font-medium text-gray-600">
                  Enter 10-Digit mobile number
                </label>
                <div className="flex items-center">
                  <span className="px-4 py-2 bg-gray-100 text-gray-600 border border-gray-300 rounded-l">
                    +91
                  </span>
                  <Input
                    type="tel"
                    placeholder="Enter your number"
                    className="rounded-none rounded-r border-gray-300 flex-1"
                  />
                </div>
                <Button className="w-full bg-orange-500 hover:bg-orange-600">
                  Get OTP
                </Button>
              </form>
              <p className="text-sm text-gray-500 mt-4">
                By signing in you agree to our{" "}
                <a href="#" className="text-blue-600 underline">
                  Terms and Conditions
                </a>{" "}
                and{" "}
                <a href="#" className="text-blue-600 underline">
                  Privacy Policy
                </a>
                .
              </p>
              <p className="mt-2 text-sm text-gray-600">
                Are you a doctor?{" "}
                <a href="#" className="text-blue-600 underline">
                  Sign In here
                </a>
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="mt-8">
          <p className="text-sm text-gray-500 mb-2">Download the app:</p>
          <div className="flex space-x-4">
            <img
              src="/google-play-badge.png"
              alt="Google Play"
              className="h-10"
            />
            <img src="/app-store-badge.png" alt="App Store" className="h-10" />
          </div>
        </div>
      </main>
    </div>
  );
}