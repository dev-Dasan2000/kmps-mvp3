"use client"

import { useRouter } from 'next/navigation';
import React, { useContext, useEffect, useState } from 'react';
import { LoadingButton } from "@/components/ui/loading-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import Link from "next/link"
import Image from 'next/image';
import { AuthContext } from '@/context/auth-context';
import axios from 'axios';
import { Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import Logo from "@/app/logo.png";

export default function LoginPage() {

  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [remember, setRemember] = useState(false);
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { isLoggedIn, user, setUser, setAccessToken, isLoadingAuth } = useContext(AuthContext);

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    try {
      const response = await axios.post(
        `${backendURL}/auth/login`,
        {
          id: id,
          password: password,
          checked: remember
        },
        {
          withCredentials: true,
          headers: {
            "Content-type": "application/json"
          }
        }
      );
      if (response.data.successful) {
        setUser(response.data.user);
        setAccessToken(response.data.accessToken);
      }
      else {
        console.log(response.data)
        throw new Error("Invalid Credentials");
      }
    }
    catch (error: any) {
      if (error.response?.status === 404) {
        toast.error("Login Failed", {
          description: "User not found"
        });
      } else {
        toast.error("Login Failed", {
          description: error.response?.data?.message || error.message || "Invalid credentials"
        });
      }
    }
    finally {
      setIsLoading(false);
    }
  };

  const handleRedirection = (role: string) => {
    toast.success("Login Successful", {
      description: `Logged in as a ${role}`
    });
    router.push(`/${role}`);
  };

  const handleForgotPassword = (e: React.MouseEvent<HTMLAnchorElement>) => {

  };

  const handleAutoLogin = async () => {
    if (isLoggedIn) {
      console.log(user);
      router.push(`/${user.role}`);
    }
  }

  useEffect(() => {
    if (!isLoadingAuth) {
      handleAutoLogin();
    }
  }, [isLoadingAuth]);

  useEffect(() => {
    if (user) {
      handleRedirection(user.role);
    }
  }, [user]);


  return (
    <div className="min-h-screen bg-[#003e34] flex items-center justify-center p-4">
      <form onSubmit={handleLogin} className="w-full max-w-md">
      <Card className="w-full shadow-lg">
        <CardHeader className="text-center pb-6">
          <div className="w-full flex justify-center mb-2">
            <Image
              src={Logo}
              alt="DentX Logo"
              width={110}
              height={110}
              className="object-contain"
            />
          </div>
          <p className="text-gray-600 text-sm">Welcome back! Please login to your account.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              ID
            </Label>
            <Input
              id="email"
              type="text"
              placeholder="Enter your ID"
              className="w-full"
              value={id}
              onChange={(e) => { setId(e.target.value) }}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                className="w-full pr-10"
                value={password}
                onChange={(e) => { setPassword(e.target.value) }}
                disabled={isLoading}
              />
              {password && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                className='cursor-pointer'
                id="remember"
                checked={remember}
                onCheckedChange={(checked) => setRemember(checked === true)}
                disabled={isLoading}
              />
              <Label htmlFor="remember" className="text-sm text-[#0eb882] cursor-pointer">
                Remember me
              </Label>
            </div>
            <Link
              href={""}
              className="text-sm text-[#12D598] hover:text-[#0eb882]"
              onClick={handleForgotPassword}
            >
              Forgot Password?
            </Link>
          </div>

          <LoadingButton
            className="w-full bg-[#059669] hover:bg-[#0eb882] text-white cursor-pointer transition-colors duration-200 flex items-center justify-center gap-2 py-2 text-sm"
            onClick={handleLogin}
            isLoading={isLoading}
            loadingText="Logging in..."
          >
            Login
          </LoadingButton>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300" />
            </div>
          </div>

          <p className="text-center text-sm text-gray-600">
            {"Don't have an account? "}
            <Link href="/patientSignup" className="text-[#12D598] hover:text-green-700">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
      </form>
    </div>
  )
}
