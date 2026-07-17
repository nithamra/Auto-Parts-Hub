import { useGetCurrentUser, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { User, LogOut, Settings, Package, Heart, MapPin, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AccountPage() {
  const [, setLocation] = useLocation();
  // Using a mock logged-in state since auth implementation details aren't fully fleshed out
  // In a real app we'd use useLoginUser mutation and rely on cookies
  
  const { data: user, isLoading } = useGetCurrentUser({
    query: { 
      queryKey: getGetCurrentUserQueryKey(),
      retry: false,
      staleTime: 1000 * 60 * 5
    }
  });

  // Since we don't have a robust mock auth system in place that sets cookies,
  // we'll render a static "My Account" view that simulates being logged in for the demo
  const mockUser = user || {
    id: 1,
    name: "John Gearhead",
    email: "john@example.com",
    phone: "555-0198",
    role: "customer",
    createdAt: new Date().toISOString()
  };

  const handleLogout = () => {
    // Mock logout
    setLocation("/");
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 shrink-0 space-y-6">
          <div className="bg-card border border-border p-6 rounded-sm text-center">
            <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
              <User className="w-10 h-10" />
            </div>
            <h2 className="font-display font-bold text-xl uppercase tracking-wider">{mockUser.name}</h2>
            <p className="text-sm text-muted-foreground">{mockUser.email}</p>
            
            {mockUser.role === 'admin' && (
              <Button 
                variant="outline" 
                className="w-full mt-4 bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive hover:text-white"
                onClick={() => setLocation("/admin")}
              >
                <Shield className="w-4 h-4 mr-2" /> Admin Dashboard
              </Button>
            )}
          </div>

          <div className="bg-card border border-border rounded-sm overflow-hidden">
            <nav className="flex flex-col">
              <Button variant="ghost" className="justify-start px-6 py-4 h-auto rounded-none border-b border-border/50 text-primary bg-primary/5">
                <Settings className="w-4 h-4 mr-3" /> Profile Settings
              </Button>
              <Button variant="ghost" className="justify-start px-6 py-4 h-auto rounded-none border-b border-border/50 font-normal hover:bg-muted/50" onClick={() => setLocation("/orders")}>
                <Package className="w-4 h-4 mr-3" /> Order History
              </Button>
              <Button variant="ghost" className="justify-start px-6 py-4 h-auto rounded-none border-b border-border/50 font-normal hover:bg-muted/50" onClick={() => setLocation("/wishlist")}>
                <Heart className="w-4 h-4 mr-3" /> Saved Parts
              </Button>
              <Button variant="ghost" className="justify-start px-6 py-4 h-auto rounded-none font-normal hover:bg-muted/50 text-destructive hover:text-destructive" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-3" /> Sign Out
              </Button>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-muted p-1">
              <TabsTrigger value="profile">Personal Info</TabsTrigger>
              <TabsTrigger value="addresses">Addresses</TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile" className="space-y-6 animate-in fade-in">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Details</CardTitle>
                  <CardDescription>Update your personal information and contact details.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" defaultValue={mockUser.name} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input id="email" type="email" defaultValue={mockUser.email} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input id="phone" type="tel" defaultValue={mockUser.phone || ""} />
                    </div>
                  </div>
                  <div className="pt-4">
                    <Button>Save Changes</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>Ensure your account remains secure.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 max-w-md">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input id="current-password" type="password" />
                  </div>
                  <div className="space-y-2 max-w-md">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input id="new-password" type="password" />
                  </div>
                  <div className="pt-4">
                    <Button variant="secondary">Update Password</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="addresses" className="space-y-6 animate-in fade-in">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Saved Addresses</CardTitle>
                    <CardDescription>Manage your shipping and billing addresses.</CardDescription>
                  </div>
                  <Button size="sm">Add New</Button>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="border border-border p-4 rounded-sm relative">
                      <div className="absolute top-4 right-4 text-xs font-bold text-primary uppercase bg-primary/10 px-2 py-1 rounded-sm">Default</div>
                      <MapPin className="w-5 h-5 text-muted-foreground mb-2" />
                      <h4 className="font-bold mb-1">Home Garage</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        1234 Gearhead Lane<br />
                        Detroit, MI 48201<br />
                        United States
                      </p>
                      <div className="mt-4 flex gap-2">
                        <Button variant="outline" size="sm" className="h-8">Edit</Button>
                        <Button variant="ghost" size="sm" className="h-8 text-destructive">Delete</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
