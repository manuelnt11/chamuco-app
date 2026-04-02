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
            <Button size="icon">🚀</Button>
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
          <h2 className="text-2xl font-semibold mb-4">Direct Horizonte Classes</h2>
          <p className="text-muted-foreground mb-4">
            Testing backward compatibility with direct Horizonte color classes
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-6 rounded-lg bg-horizonte-cielo text-white text-center">
              <p className="font-semibold">Cielo</p>
              <p className="text-sm">Sky Blue</p>
            </div>
            <div className="p-6 rounded-lg bg-horizonte-naranja text-white text-center">
              <p className="font-semibold">Naranja</p>
              <p className="text-sm">Orange</p>
            </div>
            <div className="p-6 rounded-lg bg-horizonte-nube border border-border text-center">
              <p className="font-semibold">Nube</p>
              <p className="text-sm">Cloud</p>
            </div>
            <div className="p-6 rounded-lg bg-horizonte-oceano text-white text-center">
              <p className="font-semibold">Oceano</p>
              <p className="text-sm">Ocean</p>
            </div>
            <div className="p-6 rounded-lg bg-horizonte-brisa text-center">
              <p className="font-semibold">Brisa</p>
              <p className="text-sm">Breeze</p>
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
