import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Phone, ChevronRight, Star, CheckCircle, Menu } from "lucide-react"
import HowCareDiabeticsWorks from "@/components/common/landing-page/HowCardDBWorks"

export default function CareDiabeticsLanding() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-white border-b">
        <div className="container flex items-center justify-between h-16 px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/placeholder.svg?height=40&width=40"
              alt="Care Diabetics Logo"
              width={40}
              height={40}
              className="h-10 w-10"
            />
            <span className="text-xl font-bold text-green-700">Care Diabetics</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#" className="text-sm font-medium hover:text-green-600">
              Home
            </Link>
            <Link href="#" className="text-sm font-medium hover:text-green-600">
              About
            </Link>
            <Link href="#" className="text-sm font-medium hover:text-green-600">
              Services
            </Link>
            <Link href="#" className="text-sm font-medium hover:text-green-600">
              Blog
            </Link>
            <Link href="#" className="text-sm font-medium hover:text-green-600">
              Testimonials
            </Link>
            <Link href="#" className="text-sm font-medium hover:text-green-600">
              Contact Us
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Button className="hidden md:flex bg-orange-500 hover:bg-orange-600">Login</Button>
            <Button variant="outline" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-white">
          <div className="container px-4 py-12 md:py-16 lg:py-20 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="space-y-4">
                <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-green-100 text-green-900 hover:bg-green-100/80">
                  <span className="text-xs">New</span>
                </div>
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-green-700">
                  Care Diabetics
                </h1>
                <p className="text-xl text-gray-600 md:text-2xl">Programs tailored for your diabetes care</p>
                <p className="text-gray-500">Trusted Experts Dedicated to Your Well-being</p>
                <div>
                  <Button className="bg-orange-500 hover:bg-orange-600">
                    Get Started
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="relative h-[400px] w-full overflow-hidden rounded-3xl bg-green-500">
                <div className="absolute inset-0 bg-green-500 rounded-3xl">
                  <Image
                    src="/placeholder.svg?height=400&width=400"
                    alt="Doctor"
                    width={400}
                    height={400}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* App Promo Section */}
        <section className="bg-gray-50 py-12">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-900">We care for you to be free</h2>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-gray-600">Free telemedicine with care plan</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-gray-600">Personalized care plan</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-gray-600">Detailed Reports & Diabetes management tools</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-gray-600">Diabetes discounts on OTC Programs & Drugs</span>
                  </li>
                </ul>
              </div>
              <div className="flex justify-center">
                <div className="relative w-[200px] h-[400px]">
                  <Image
                    src="/placeholder.svg?height=400&width=200"
                    alt="Mobile App"
                    width={200}
                    height={400}
                    className="object-contain"
                  />
                  <div className="mt-4 flex justify-center gap-4">
                    <Link href="#" className="block">
                      <Image
                        src="/placeholder.svg?height=40&width=120"
                        alt="App Store"
                        width={120}
                        height={40}
                        className="h-10"
                      />
                    </Link>
                    <Link href="#" className="block">
                      <Image
                        src="/placeholder.svg?height=40&width=120"
                        alt="Google Play"
                        width={120}
                        height={40}
                        className="h-10"
                      />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-12 md:py-16 lg:py-20">
         <HowCareDiabeticsWorks/>
        </section>

        {/* Services Section */}
        <section className="py-12 bg-gray-50">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-green-700">Our Services</h2>
              <p className="text-gray-600 mt-2">We offer comprehensive diabetes management services</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "Diabetes Management & Consultation",
                  description: "Personalized care plans",
                  icon: "🩺",
                },
                {
                  title: "Continuous Glucose Monitoring",
                  description: "Real-time glucose tracking",
                  icon: "📊",
                },
                {
                  title: "Nutrition & Exercise Plans",
                  description: "Customized lifestyle guidance",
                  icon: "🥗",
                },
              ].map((service, index) => (
                <Card key={index} className="bg-green-50 border-0">
                  <CardContent className="p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-4">
                      <span className="text-2xl">{service.icon}</span>
                    </div>
                    <h3 className="text-lg font-bold">{service.title}</h3>
                    <p className="text-gray-600 mt-2">{service.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Top Doctors Section */}
        <section className="py-12 bg-green-700 text-white">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold">Top Doctors</h2>
              <p className="mt-2">Meet our experienced specialists</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((doctor, index) => (
                <div key={index} className="relative overflow-hidden rounded-lg bg-white/10 p-1">
                  <div className="aspect-[3/4] overflow-hidden rounded-lg">
                    <Image
                      src="/placeholder.svg?height=300&width=225"
                      alt={`Doctor ${index + 1}`}
                      width={225}
                      height={300}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white">View All</Button>
            </div>
          </div>
        </section>

        {/* Video Consultation Section */}
        <section className="py-12 bg-green-100">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 items-center">
              <div>
                <h2 className="text-3xl font-bold text-green-700 mb-4">Video Consultation</h2>
                <p className="text-gray-700 mb-6">Connect with our specialists from the comfort of your home</p>
                <Button className="bg-green-700 hover:bg-green-800">Book Now</Button>
              </div>
              <div className="relative aspect-video overflow-hidden rounded-lg">
                <Image
                  src="/placeholder.svg?height=315&width=560"
                  alt="Video Consultation"
                  width={560}
                  height={315}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="rounded-full bg-white/80 p-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-8 w-8 text-green-700"
                    >
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Meet Our Team Section */}
        <section className="py-12">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-green-700">Meet Our Team</h2>
            </div>
            <div className="relative overflow-hidden rounded-lg">
              <Image
                src="/placeholder.svg?height=400&width=1200"
                alt="Medical Team"
                width={1200}
                height={400}
                className="w-full object-cover"
              />
            </div>
            <div className="mt-6 text-center">
              <p className="text-gray-700">
                Expert doctors, nurses and healthcare specialists dedicated to the management of chronic conditions and
                specialized care for diabetes. Our team is committed to your health and wellbeing.
              </p>
              <Button className="mt-4 bg-orange-500 hover:bg-orange-600">Learn More</Button>
            </div>
          </div>
        </section>

        {/* Doctor Cards Section */}
        <section className="py-12 bg-gray-50">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[
                { name: "Dr. James Peterson", specialty: "Endocrinologist" },
                { name: "Dr. Michael Johnson", specialty: "Diabetologist" },
                { name: "Dr. Robert Williams", specialty: "Nutritionist" },
                { name: "Dr. Thomas Anderson", specialty: "Diabetes Specialist" },
              ].map((doctor, index) => (
                <Card key={index} className="overflow-hidden bg-green-600 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-full overflow-hidden bg-white/20">
                        <Image
                          src="/placeholder.svg?height=64&width=64"
                          alt={doctor.name}
                          width={64}
                          height={64}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="font-bold">{doctor.name}</h3>
                        <p className="text-green-100">{doctor.specialty}</p>
                      </div>
                    </div>
                    <Button className="mt-4 w-full bg-white text-green-700 hover:bg-green-50">Book Appointment</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Video Call Section */}
        <section className="py-12">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-green-700">Prioritizing Your Health</h2>
            </div>
            <div className="flex justify-center">
              <div className="relative aspect-video w-full max-w-3xl overflow-hidden rounded-lg">
                <Image
                  src="/placeholder.svg?height=315&width=560"
                  alt="Video Call"
                  width={560}
                  height={315}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-12 bg-gray-50">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-green-700">Hear From Those We've Cared For</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  name: "Sarah Johnson",
                  text: "The care and attention I received from Care Diabetics has transformed my life. My blood sugar levels are now under control.",
                },
                {
                  name: "Michael Brown",
                  text: "The team at Care Diabetics provided me with a personalized care plan that was easy to follow and effective.",
                },
                {
                  name: "Emily Davis",
                  text: "The mobile app makes it so easy to track my glucose levels and medications. Highly recommended!",
                },
              ].map((testimonial, index) => (
                <Card key={index} className="border border-green-100">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="h-10 w-10 rounded-full overflow-hidden bg-green-100">
                        <Image
                          src="/placeholder.svg?height=40&width=40"
                          alt={testimonial.name}
                          width={40}
                          height={40}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="font-medium">{testimonial.name}</h3>
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-current" />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-600">{testimonial.text}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Expert Health Advice Section */}
        <section className="py-12">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-green-700">Expert Health Advice For Your Life</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="aspect-square overflow-hidden rounded-lg">
                <Image
                  src="/placeholder.svg?height=300&width=300"
                  alt="Healthy Food"
                  width={300}
                  height={300}
                  className="h-full w-full object-cover"
                />
                <div className="mt-2">
                  <h3 className="font-medium">Healthy Eating Tips</h3>
                </div>
              </div>
              <div className="aspect-square overflow-hidden rounded-lg">
                <Image
                  src="/placeholder.svg?height=300&width=300"
                  alt="Exercise"
                  width={300}
                  height={300}
                  className="h-full w-full object-cover"
                />
                <div className="mt-2">
                  <h3 className="font-medium">Exercise Routines</h3>
                </div>
              </div>
              <div className="aspect-square overflow-hidden rounded-lg">
                <Image
                  src="/placeholder.svg?height=300&width=300"
                  alt="Medical Advice"
                  width={300}
                  height={300}
                  className="h-full w-full object-cover"
                />
                <div className="mt-2">
                  <h3 className="font-medium">Medical Guidance</h3>
                </div>
              </div>
            </div>
            <div className="mt-8 text-center">
              <Button className="bg-orange-500 hover:bg-orange-600">View All Articles</Button>
            </div>
          </div>
        </section>

        {/* Consultation Booking Section */}
        <section className="py-12 bg-green-600 text-white">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold">Book a Consultation with Care Diabetics</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 rounded-lg bg-white/10 p-4">
                  <Image
                    src="/placeholder.svg?height=80&width=80"
                    alt="Mobile App"
                    width={80}
                    height={80}
                    className="h-20 w-20"
                  />
                </div>
                <h3 className="font-medium">Download the App</h3>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 rounded-lg bg-white/10 p-4">
                  <Image
                    src="/placeholder.svg?height=80&width=80"
                    alt="Register"
                    width={80}
                    height={80}
                    className="h-20 w-20"
                  />
                </div>
                <h3 className="font-medium">Register</h3>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 rounded-lg bg-white/10 p-4">
                  <Image
                    src="/placeholder.svg?height=80&width=80"
                    alt="Book Appointment"
                    width={80}
                    height={80}
                    className="h-20 w-20"
                  />
                </div>
                <h3 className="font-medium">Book Appointment</h3>
              </div>
            </div>
            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              <div>
                <p className="mb-4 text-lg">
                  Leave your details below and a Care Diabetics expert will reach out to you to schedule your
                  consultation.
                </p>
                <Button className="bg-orange-500 hover:bg-orange-600">Request Appointment</Button>
              </div>
              <div className="rounded-lg bg-white p-6">
                <form className="space-y-4">
                  <input
                    type="text"
                    placeholder="Name"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900"
                  />
                  <input
                    type="tel"
                    placeholder="Phone"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900"
                  />
                  <Button className="w-full bg-orange-500 hover:bg-orange-600">Submit</Button>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* App Download Section */}
        <section className="py-12">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 items-center">
              <div className="relative h-[500px] w-full overflow-hidden rounded-3xl border">
                <Image
                  src="/placeholder.svg?height=500&width=400"
                  alt="Mobile App"
                  width={400}
                  height={500}
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="space-y-4">
                <h2 className="text-3xl font-bold text-green-700">Download the Care Diabetics App</h2>
                <p className="text-gray-600">
                  Take control of your diabetes management with our comprehensive mobile app
                </p>
                <div className="flex gap-4">
                  <Link href="#" className="block">
                    <Image
                      src="/placeholder.svg?height=40&width=120"
                      alt="App Store"
                      width={120}
                      height={40}
                      className="h-10"
                    />
                  </Link>
                  <Link href="#" className="block">
                    <Image
                      src="/placeholder.svg?height=40&width=120"
                      alt="Google Play"
                      width={120}
                      height={40}
                      className="h-10"
                    />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 py-12">
        <div className="container px-4 md:px-6">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Image
                  src="/placeholder.svg?height=40&width=40"
                  alt="Care Diabetics Logo"
                  width={40}
                  height={40}
                  className="h-10 w-10"
                />
                <span className="text-xl font-bold text-green-700">Care Diabetics</span>
              </div>
              <p className="text-gray-600">Comprehensive diabetes care and management</p>
            </div>
            <div>
              <h3 className="font-bold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="text-gray-600 hover:text-green-700">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-gray-600 hover:text-green-700">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-gray-600 hover:text-green-700">
                    Services
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-gray-600 hover:text-green-700">
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Contact Info</h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span>+1 (123) 456-7890</span>
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  <span>info@carediabetics.com</span>
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span>123 Main St, City, Country</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Follow Us</h3>
              <div className="flex gap-4">
                {["facebook", "twitter", "instagram", "linkedin"].map((social) => (
                  <Link
                    key={social}
                    href="#"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-gray-600 hover:bg-green-600 hover:text-white"
                  >
                    <span className="sr-only">{social}</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                    </svg>
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-200 pt-8 text-center">
            <p className="text-gray-600">&copy; {new Date().getFullYear()} Care Diabetics. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

