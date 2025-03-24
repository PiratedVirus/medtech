import Image from "next/image"

interface TestimonialProps {
  quote: string
  name: string
  imageSrc: string
}

const Testimonial = ({ quote, name, imageSrc }: TestimonialProps) => {
  return (
    <div className="bg-[#f0f9ff] border border-[#56a67c] rounded-3xl p-6 flex gap-4">
      <div className="flex-shrink-0">
        <Image
          src={imageSrc || "/placeholder.svg"}
          alt={name}
          width={80}
          height={80}
          className="rounded-md w-20 h-20 object-cover"
        />
      </div>
      <div>
        <p className="text-[#3d3d3d] mb-2">"{quote}"</p>
        <p className="text-[#3d3d3d]">- {name}</p>
      </div>
    </div>
  )
}

export default function PatientTestimonials() {
  const testimonials = [
    {
      quote:
        "After my knee surgery, the convenience of online consultations made my recovery smoother than I could have imagined.",
      name: "Samantha Ruth.",
      imageSrc: "/placeholder.svg?height=80&width=80",
    },
    {
      quote:
        "Managing chronic conditions like diabetes requires a lot of vigilance, but the medicine refill system has simplified my life.",
      name: "John Abrahim.",
      imageSrc: "/placeholder.svg?height=80&width=80",
    },
    {
      quote:
        "The prescription refill system is a game-changer for managing my diabetes. It's really efficient and completely hassle-free.",
      name: "Mike Tyson.",
      imageSrc: "/placeholder.svg?height=80&width=80",
    },
    {
      quote:
        "Finding a doctor who really understands all of my health needs has never been easier. This platform has changed my life.",
      name: "Arjun A.",
      imageSrc: "/placeholder.svg?height=80&width=80",
    },
  ]

  return (
    <section className="py-16 px-4 relative overflow-hidden">
      {/* Decorative dots - top left */}
      <div className="absolute top-0 left-0 w-40 h-40">
        <svg width="160" height="160" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="10" cy="10" r="5" fill="#56a67c" fillOpacity="0.5" />
          <circle cx="30" cy="10" r="5" fill="#56a67c" fillOpacity="0.5" />
          <circle cx="50" cy="10" r="5" fill="#56a67c" fillOpacity="0.5" />
          <circle cx="70" cy="10" r="5" fill="#56a67c" fillOpacity="0.5" />
          <circle cx="90" cy="10" r="5" fill="#56a67c" fillOpacity="0.5" />
          <circle cx="110" cy="10" r="5" fill="#56a67c" fillOpacity="0.5" />
          <circle cx="130" cy="10" r="5" fill="#56a67c" fillOpacity="0.5" />
          <circle cx="10" cy="30" r="5" fill="#56a67c" fillOpacity="0.5" />
          <circle cx="30" cy="30" r="5" fill="#56a67c" fillOpacity="0.5" />
          <circle cx="50" cy="30" r="5" fill="#56a67c" fillOpacity="0.5" />
          <circle cx="70" cy="30" r="5" fill="#56a67c" fillOpacity="0.5" />
          <circle cx="90" cy="30" r="5" fill="#56a67c" fillOpacity="0.5" />
          <circle cx="110" cy="30" r="5" fill="#56a67c" fillOpacity="0.5" />
          <circle cx="130" cy="30" r="5" fill="#56a67c" fillOpacity="0.5" />
          <circle cx="10" cy="50" r="5" fill="#56a67c" fillOpacity="0.5" />
          <circle cx="30" cy="50" r="5" fill="#56a67c" fillOpacity="0.5" />
          <circle cx="50" cy="50" r="5" fill="#56a67c" fillOpacity="0.5" />
          <circle cx="70" cy="50" r="5" fill="#56a67c" fillOpacity="0.5" />
          <circle cx="90" cy="50" r="5" fill="#56a67c" fillOpacity="0.5" />
          <circle cx="110" cy="50" r="5" fill="#56a67c" fillOpacity="0.5" />
          <circle cx="130" cy="50" r="5" fill="#56a67c" fillOpacity="0.5" />
        </svg>
      </div>

      {/* Decorative dots - bottom right */}
      <div className="absolute bottom-0 right-0 w-40 h-40">
        <svg width="160" height="160" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="10" cy="10" r="5" fill="#56a67c" fillOpacity="0.5" />
          <circle cx="30" cy="10" r="5" fill="#56a67c" fillOpacity="0.5" />
          <circle cx="50" cy="10" r="5" fill="#56a67c" fillOpacity="0.5" />
          <circle cx="70" cy="10" r="5" fill="#56a67c" fillOpacity="0.5" />
          <circle cx="90" cy="10" r="5" fill="#56a67c" fillOpacity="0.5" />
          <circle cx="110" cy="10" r="5" fill="#56a67c" fillOpacity="0.5" />
          <circle cx="130" cy="10" r="5" fill="#56a67c" fillOpacity="0.5" />
          <circle cx="10" cy="30" r="5" fill="#56a67c" fillOpacity="0.5" />
          <circle cx="30" cy="30" r="5" fill="#56a67c" fillOpacity="0.5" />
          <circle cx="50" cy="30" r="5" fill="#56a67c" fillOpacity="0.5" />
          <circle cx="70" cy="30" r="5" fill="#56a67c" fillOpacity="0.5" />
          <circle cx="90" cy="30" r="5" fill="#56a67c" fillOpacity="0.5" />
          <circle cx="110" cy="30" r="5" fill="#56a67c" fillOpacity="0.5" />
          <circle cx="130" cy="30" r="5" fill="#56a67c" fillOpacity="0.5" />
          <circle cx="10" cy="50" r="5" fill="#56a67c" fillOpacity="0.5" />
          <circle cx="30" cy="50" r="5" fill="#56a67c" fillOpacity="0.5" />
          <circle cx="50" cy="50" r="5" fill="#56a67c" fillOpacity="0.5" />
          <circle cx="70" cy="50" r="5" fill="#56a67c" fillOpacity="0.5" />
          <circle cx="90" cy="50" r="5" fill="#56a67c" fillOpacity="0.5" />
          <circle cx="110" cy="50" r="5" fill="#56a67c" fillOpacity="0.5" />
          <circle cx="130" cy="50" r="5" fill="#56a67c" fillOpacity="0.5" />
        </svg>
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-[#56a67c] text-3xl md:text-4xl font-medium mb-2">Patient Testimonials:</h2>
          <h3 className="text-[#3d3d3d] text-2xl md:text-3xl font-medium mb-4">Hear from Those We've Cared For</h3>
          <p className="text-[#6d6d6d] text-lg">
            Discover the difference we make through the voices of those we've served:
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {testimonials.map((testimonial, index) => (
            <Testimonial
              key={index}
              quote={testimonial.quote}
              name={testimonial.name}
              imageSrc={testimonial.imageSrc}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

