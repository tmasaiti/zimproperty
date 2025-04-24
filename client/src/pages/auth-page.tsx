import React, { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(9, "Please enter a valid phone number"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password is required"),
  role: z.enum(["seller", "agent", "admin"]),
  whatsappPreferred: z.boolean().optional(),
  agencyName: z.string().optional(),
  licenseDocument: z.string().optional(),
  terms: z.boolean().refine((value) => value === true, {
    message: "You must agree to the terms and conditions",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine(
  (data) => {
    if (data.role === "agent") {
      return !!data.agencyName && !!data.licenseDocument;
    }
    return true;
  },
  {
    message: "Agency name and license document are required for agents",
    path: ["agencyName"],
  }
);

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

const AuthPage: React.FC = () => {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/auth?:query");
  const { user, loginMutation, registerMutation } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("login");
  const [isAgent, setIsAgent] = useState<boolean>(false);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      username: "",
      password: "",
      confirmPassword: "",
      role: "seller",
      whatsappPreferred: false,
      agencyName: "",
      licenseDocument: "",
      terms: false,
    },
  });

  useEffect(() => {
    // Parse the query parameters for initial tab and role
    if (params && params.query) {
      const queryParams = new URLSearchParams(params.query);
      const mode = queryParams.get("mode");
      const role = queryParams.get("role");

      if (mode && (mode === "login" || mode === "register")) {
        setActiveTab(mode);
      }

      if (role && (role === "seller" || role === "agent")) {
        registerForm.setValue("role", role);
        setIsAgent(role === "agent");
      }
    }
  }, [params, registerForm]);

  useEffect(() => {
    // Redirect if user is already logged in
    if (user) {
      setLocation(`/${user.role}`);
    }
  }, [user, setLocation]);

  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data, {
      onSuccess: (user) => {
        // Redirect to the appropriate dashboard based on user role
        setLocation(`/${user.role}`);
      }
    });
  };

  const onRegisterSubmit = (data: RegisterFormValues) => {
    const { terms, ...formData } = data;
    // Keep confirmPassword in the payload as the server expects it for validation
    registerMutation.mutate(formData, {
      onSuccess: (user) => {
        // Redirect to the appropriate dashboard based on user role
        setLocation(`/${user.role}`);
      },
      onError: (error) => {
        // The toast notifications will be handled by the auth context
        console.error("Registration error:", error);
      }
    });
  };

  const handleRoleChange = (value: string) => {
    setIsAgent(value === "agent");
    registerForm.setValue("role", value as "seller" | "agent" | "admin");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Column - Auth Forms */}
          <div className="md:w-1/2">
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-2xl text-center">Welcome to ZimProperty</CardTitle>
                <CardDescription className="text-center">
                  Connect with the best real estate agents in Zimbabwe
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="register">Register</TabsTrigger>
                  </TabsList>

                  <TabsContent value="login">
                    <Form {...loginForm}>
                      <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                        <FormField
                          control={loginForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your username" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={loginForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            <Checkbox id="remember" />
                            <label
                              htmlFor="remember"
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              Remember me
                            </label>
                          </div>
                          <a href="#" className="text-sm text-primary-700 hover:underline">
                            Forgot password?
                          </a>
                        </div>

                        <Button
                          type="submit"
                          className="w-full bg-primary-700"
                          disabled={loginMutation.isPending}
                        >
                          {loginMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Log In
                        </Button>

                        <p className="text-center text-sm text-gray-600 mt-4">
                          Don't have an account?{" "}
                          <button
                            type="button"
                            className="text-primary-700 hover:underline"
                            onClick={() => setActiveTab("register")}
                          >
                            Register
                          </button>
                        </p>
                      </form>
                    </Form>
                  </TabsContent>

                  <TabsContent value="register">
                    <Form {...registerForm}>
                      <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={registerForm.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>First Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter your first name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={registerForm.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Last Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter your last name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={registerForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="your.email@example.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500 sm:text-sm">+263</span>
                                  </div>
                                  <Input className="pl-12" placeholder="7X XXX XXXX" {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input placeholder="Choose a username" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={registerForm.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                  <Input type="password" placeholder="••••••••" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={registerForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Confirm Password</FormLabel>
                                <FormControl>
                                  <Input type="password" placeholder="••••••••" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={registerForm.control}
                          name="role"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Register as</FormLabel>
                              <Select
                                onValueChange={handleRoleChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select your role" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="seller">Seller</SelectItem>
                                  <SelectItem value="agent">Agent</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerForm.control}
                          name="whatsappPreferred"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>I prefer to be contacted via WhatsApp</FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />

                        {isAgent && (
                          <>
                            <FormField
                              control={registerForm.control}
                              name="agencyName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Agency Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Enter your agency name" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={registerForm.control}
                              name="licenseDocument"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>License Document</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="text"
                                      placeholder="Upload or enter license document ID"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </>
                        )}

                        <FormField
                          control={registerForm.control}
                          name="terms"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>
                                  I agree to the{" "}
                                  <a href="#" className="text-primary-700 hover:underline">
                                    Terms of Service
                                  </a>{" "}
                                  and{" "}
                                  <a href="#" className="text-primary-700 hover:underline">
                                    Privacy Policy
                                  </a>
                                </FormLabel>
                                <FormMessage />
                              </div>
                            </FormItem>
                          )}
                        />

                        <Button
                          type="submit"
                          className="w-full bg-primary-700"
                          disabled={registerMutation.isPending}
                        >
                          {registerMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Create Account
                        </Button>

                        <p className="text-center text-sm text-gray-600 mt-4">
                          Already have an account?{" "}
                          <button
                            type="button"
                            className="text-primary-700 hover:underline"
                            onClick={() => setActiveTab("login")}
                          >
                            Log in
                          </button>
                        </p>
                      </form>
                    </Form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Hero Section */}
          <div className="md:w-1/2 flex items-center">
            <div className="bg-gradient-to-br from-primary-700 to-primary-800 text-white p-8 rounded-lg shadow-md">
              <h2 className="text-3xl font-bold mb-6">Join Zimbabwe's Premier Real Estate Network</h2>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary-200 text-primary-800 flex items-center justify-center mr-3">
                    ✓
                  </div>
                  <p>
                    <span className="font-bold">For Sellers:</span> List your property and get contacted by verified agents within 24 hours
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary-200 text-primary-800 flex items-center justify-center mr-3">
                    ✓
                  </div>
                  <p>
                    <span className="font-bold">For Agents:</span> Access quality leads and grow your real estate business
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary-200 text-primary-800 flex items-center justify-center mr-3">
                    ✓
                  </div>
                  <p>Simple, transparent pricing with flexible payment options</p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary-200 text-primary-800 flex items-center justify-center mr-3">
                    ✓
                  </div>
                  <p>Trusted by hundreds of satisfied users across Zimbabwe</p>
                </li>
              </ul>
              <div className="mt-8 bg-white/10 rounded-lg p-4">
                <p className="italic text-primary-100">
                  "ZimProperty transformed my selling experience. I received multiple offers within days of listing my property!" — Tendai M.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
