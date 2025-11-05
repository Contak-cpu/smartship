import React from 'react'
import { HeroSection } from '../components/landing/HeroSection'
import { PackagingSection } from '../components/landing/PackagingSection'
import { HowItWorksSection } from '../components/landing/HowItWorksSection'
import { BenefitsSection } from '../components/landing/BenefitsSection'
import { CTASection } from '../components/landing/CTASection'
import { Header } from '../components/landing/Header'
import { WhatsAppFloatButton } from '../components/landing/WhatsAppFloatButton'

export default function HeroLandingPage() {
  return (
    <main className="min-h-screen">
      <Header />
      <HeroSection />
      <PackagingSection />
      <HowItWorksSection />
      <BenefitsSection />
      <CTASection />
      <WhatsAppFloatButton />
    </main>
  )
}
