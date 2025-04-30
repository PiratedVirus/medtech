'use client'
import React, { useEffect, useState } from "react"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import Link from "next/link"

interface MediumPost {
  title: string
  link: string
  contentSnippet: string
  guid: string
  thumbnail?: string
  pubDate?: string
  description?: string
}

export default function MediumBlogCarousel() {
  const [posts, setPosts] = useState<MediumPost[]>([])

  useEffect(() => {
    const fetchMediumFeed = async () => {
      const res = await fetch("https://api.rss2json.com/v1/api.json?rss_url=https://medium.com/feed/@kentcdodds")
      const data = await res.json()
      setPosts(
        data.items.slice(0, 3).map((item: any) => ({
          title: item.title || "",
          link: item.link || "#",
          contentSnippet: item.contentSnippet || "",
          guid: item.guid || "",
          thumbnail: item.content ? extractImageFromContent(item.content) || "/images/blog-card-1.png" : "/images/blog-card-1.png",
          pubDate: item.pubDate?.split(" ").slice(0, 3).join(" ") || ""
        }))
      )
    }

    const extractImageFromContent = (html: string): string | undefined => {
      const match = html.match(/<img[^>]+src="([^"]+)"/)
      return match ? match[1] : undefined
    }

    fetchMediumFeed()
  }, [])

  return (
    <div className="">
      <section className="max-w-full px-4 sm:px-6 lg:px-20 py-8">
        <div className="space-y-4 mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-[#2c2e38]">
            Health Corner (Coming Soon)
          </h2>
          <p className="text-xl text-[#696969]">
          Explore insightful articles from leading diabetes specialists
          </p>
        </div>
      </section>
    </div>
  )
}
