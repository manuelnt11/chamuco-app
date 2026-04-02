'use client';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Separator,
  ThemeToggle,
} from '@/components';
import {
  AirplaneTiltIcon,
  HeartIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  StarIcon,
  UsersIcon,
  CalendarCheckIcon,
} from '@phosphor-icons/react';

export default function TestShadcnPage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8 transition-colors">
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="max-w-6xl mx-auto space-y-12">
        <header>
          <h1 className="text-4xl font-bold mb-2">shadcn/ui + Horizonte Integration Test</h1>
          <p className="text-muted-foreground">
            Testing all components with Horizonte palette in light and dark modes
          </p>
        </header>

        <Separator />

        {/* Button Variants */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Button Variants</h2>
          <div className="flex flex-wrap gap-4">
            <Button>Default (Primary - Cielo)</Button>
            <Button variant="secondary">Secondary (Naranja)</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
            <Button variant="destructive">Destructive</Button>
          </div>
        </section>

        <Separator />

        {/* Button Sizes */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Button Sizes</h2>
          <div className="flex flex-wrap items-center gap-4">
            <Button size="sm">Small</Button>
            <Button>Default</Button>
            <Button size="lg">Large</Button>
            <Button size="icon">
              <AirplaneTiltIcon className="h-5 w-5" weight="regular" />
            </Button>
          </div>
        </section>

        <Separator />

        {/* Phosphor Icons */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Phosphor Icons - Weight Examples</h2>
          <p className="text-muted-foreground mb-4">
            Demonstrating icon weights: Regular (navigation), Bold (active states), Fill (selected),
            Duotone (empty states)
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Search & Navigation Icons</CardTitle>
                <CardDescription>Regular weight for navigation elements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6 text-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <MagnifyingGlassIcon className="h-8 w-8" weight="regular" />
                    <span className="text-xs">Regular</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <MagnifyingGlassIcon className="h-8 w-8" weight="bold" />
                    <span className="text-xs">Bold</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <MagnifyingGlassIcon className="h-8 w-8" weight="fill" />
                    <span className="text-xs">Fill</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <MagnifyingGlassIcon className="h-8 w-8" weight="duotone" />
                    <span className="text-xs">Duotone</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Action Icons</CardTitle>
                <CardDescription>Fill weight for selected states</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-center gap-2">
                    <HeartIcon className="h-8 w-8 text-muted-foreground" weight="regular" />
                    <span className="text-xs">Inactive</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <HeartIcon className="h-8 w-8 text-primary" weight="fill" />
                    <span className="text-xs">Active</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <StarIcon className="h-8 w-8 text-muted-foreground" weight="regular" />
                    <span className="text-xs">Unrated</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <StarIcon className="h-8 w-8 text-secondary" weight="fill" />
                    <span className="text-xs">Rated</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Location & Travel</CardTitle>
                <CardDescription>Travel-specific icon examples</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-center gap-2">
                    <MapPinIcon className="h-8 w-8 text-primary" weight="fill" />
                    <span className="text-xs">Destination</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <AirplaneTiltIcon className="h-8 w-8 text-secondary" weight="bold" />
                    <span className="text-xs">Flight</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <CalendarCheckIcon
                      className="h-8 w-8 text-accent-foreground"
                      weight="regular"
                    />
                    <span className="text-xs">Schedule</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <UsersIcon className="h-8 w-8 text-foreground" weight="bold" />
                    <span className="text-xs">Group</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Button Integration</CardTitle>
                <CardDescription>Icons in button components</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Button>
                    <MagnifyingGlassIcon className="mr-2 h-4 w-4" weight="regular" />
                    Search Trips
                  </Button>
                  <Button variant="secondary">
                    <AirplaneTiltIcon className="mr-2 h-4 w-4" weight="bold" />
                    Book Flight
                  </Button>
                  <Button variant="outline">
                    <MapPinIcon className="mr-2 h-4 w-4" weight="regular" />
                    Add Location
                  </Button>
                  <Button size="icon" variant="ghost">
                    <HeartIcon className="h-4 w-4" weight="regular" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator />

        {/* Cards */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Card Components</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Simple Card</CardTitle>
                <CardDescription>Basic card with header and content</CardDescription>
              </CardHeader>
              <CardContent>
                <p>This is the card content area with adaptive background.</p>
              </CardContent>
            </Card>

            <Card className="bg-primary text-primary-foreground">
              <CardHeader>
                <CardTitle>Primary Card (Cielo)</CardTitle>
                <CardDescription className="text-primary-foreground/80">
                  Using Horizonte Cielo as primary
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Primary colored card with Horizonte branding.</p>
              </CardContent>
            </Card>

            <Card className="bg-secondary text-secondary-foreground">
              <CardHeader>
                <CardTitle>Secondary Card (Naranja)</CardTitle>
                <CardDescription className="text-secondary-foreground/80">
                  Using Horizonte Naranja as secondary
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Secondary colored card with Horizonte branding.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator />

        {/* Form Inputs */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Form Components</h2>
          <Card>
            <CardHeader>
              <CardTitle>Sample Form</CardTitle>
              <CardDescription>Testing input and label components</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Enter your name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="Enter your email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="Enter your password" />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Cancel</Button>
              <Button>Submit</Button>
            </CardFooter>
          </Card>
        </section>

        <Separator />

        {/* Direct Horizonte Classes */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Horizonte Color Palette</h2>
          <p className="text-muted-foreground mb-4">
            Testing direct Horizonte color classes with all variants
          </p>

          <div className="space-y-6">
            {/* Cielo - Sky Blue */}
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Cielo (Sky Blue) - Primary Brand Color</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="h-24 rounded-lg bg-horizonte-cielo-light flex items-center justify-center">
                    <span className="text-horizonte-oceano font-semibold">Light</span>
                  </div>
                  <code className="text-xs text-muted-foreground">bg-horizonte-cielo-light</code>
                </div>
                <div className="space-y-2">
                  <div className="h-24 rounded-lg bg-horizonte-cielo flex items-center justify-center">
                    <span className="text-white font-semibold">Default</span>
                  </div>
                  <code className="text-xs text-muted-foreground">bg-horizonte-cielo</code>
                </div>
                <div className="space-y-2">
                  <div className="h-24 rounded-lg bg-horizonte-cielo-dark flex items-center justify-center">
                    <span className="text-white font-semibold">Dark</span>
                  </div>
                  <code className="text-xs text-muted-foreground">bg-horizonte-cielo-dark</code>
                </div>
              </div>
            </div>

            {/* Naranja - Orange */}
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Naranja (Orange) - Secondary Accent</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="h-24 rounded-lg bg-horizonte-naranja-light flex items-center justify-center">
                    <span className="text-horizonte-oceano font-semibold">Light</span>
                  </div>
                  <code className="text-xs text-muted-foreground">bg-horizonte-naranja-light</code>
                </div>
                <div className="space-y-2">
                  <div className="h-24 rounded-lg bg-horizonte-naranja flex items-center justify-center">
                    <span className="text-white font-semibold">Default</span>
                  </div>
                  <code className="text-xs text-muted-foreground">bg-horizonte-naranja</code>
                </div>
                <div className="space-y-2">
                  <div className="h-24 rounded-lg bg-horizonte-naranja-dark flex items-center justify-center">
                    <span className="text-white font-semibold">Dark</span>
                  </div>
                  <code className="text-xs text-muted-foreground">bg-horizonte-naranja-dark</code>
                </div>
              </div>
            </div>

            {/* Oceano - Ocean */}
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Oceano (Ocean) - Dark Theme Base</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="h-24 rounded-lg bg-horizonte-oceano-light flex items-center justify-center">
                    <span className="text-white font-semibold">Light</span>
                  </div>
                  <code className="text-xs text-muted-foreground">bg-horizonte-oceano-light</code>
                </div>
                <div className="space-y-2">
                  <div className="h-24 rounded-lg bg-horizonte-oceano flex items-center justify-center">
                    <span className="text-white font-semibold">Default</span>
                  </div>
                  <code className="text-xs text-muted-foreground">bg-horizonte-oceano</code>
                </div>
                <div className="space-y-2">
                  <div className="h-24 rounded-lg bg-horizonte-oceano-dark flex items-center justify-center">
                    <span className="text-white font-semibold">Dark</span>
                  </div>
                  <code className="text-xs text-muted-foreground">bg-horizonte-oceano-dark</code>
                </div>
              </div>
            </div>

            {/* Nube & Brisa - Neutrals */}
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Nube & Brisa (Neutrals)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="h-24 rounded-lg bg-horizonte-nube border-2 border-border flex items-center justify-center">
                    <span className="text-foreground font-semibold">Nube (Cloud)</span>
                  </div>
                  <code className="text-xs text-muted-foreground">bg-horizonte-nube</code>
                </div>
                <div className="space-y-2">
                  <div className="h-24 rounded-lg bg-horizonte-brisa border-2 border-border flex items-center justify-center">
                    <span className="text-foreground font-semibold">Brisa (Breeze)</span>
                  </div>
                  <code className="text-xs text-muted-foreground">bg-horizonte-brisa</code>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Separator />

        {/* Dark Mode Test Instructions */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Dark Mode Verification</h2>
          <Card>
            <CardHeader>
              <CardTitle>Testing Checklist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <p>Light mode: Primary button shows Horizonte Cielo (#38BDF8)</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <p>Light mode: Secondary button shows Horizonte Naranja (#FB923C)</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <p>Dark mode: Background switches to Oceano-based dark theme</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <p>Dark mode toggle cycles smoothly (light → dark → system)</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <p>Direct Horizonte classes still work (bg-horizonte-oceano)</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <p>Input focus rings use Horizonte Cielo</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <p>Card backgrounds adapt to theme</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <p>All text remains readable in both modes</p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
