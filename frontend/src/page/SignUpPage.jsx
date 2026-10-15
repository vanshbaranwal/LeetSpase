import {useState} from 'react'
import {useForm} from "react-hook-form"
import {zodResolver} from "@hookform/resolvers/zod"
import { Link } from 'react-router-dom'
import {
  Code,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
} from "lucide-react";

import {z} from "zod";
import AuthImagePattern from '../components/AuthImagePattern';
import GoogleAuthButton from '../components/GoogleAuthButton';
import { useAuthStore } from "../store/useAuthStore";

const SignUpSchema = z.object({
  email:z.string().email("Enter a valid email"),
  password:z.string().min(6 , "Password must be at least 6 characters"),
  name:z.string().min(3 , "Name must be at least 3 characters")
})

const SignUpPage = () => {

  const [showPassword , setShowPassword] = useState(false);

  const {signup , isSigninUp} = useAuthStore()

  const {
    register,
    handleSubmit,
    formState:{errors},
  } = useForm({
    resolver:zodResolver(SignUpSchema)
  })

  const onSubmit = async (data)=>{
   try {
    await signup(data)
   } catch (error) {
     console.error("SignUp failed:", error);
   }
  }


  return (
    <div className='grid min-h-dvh lg:grid-cols-2'>
        <div className="flex items-center justify-center px-6 py-10 sm:px-12 sm:py-14">
        <div className="w-full max-w-md space-y-7">
          {/* Logo */}
          <div className="text-center">
            <Link to="/" className="group mx-auto flex w-fit items-center gap-2.5 text-white">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] transition-colors group-hover:bg-white/[0.09]">
                <Code className="w-6 h-6 text-primary" />
              </div>
              <span className="text-xl font-semibold tracking-[-0.03em]">LeetSpase</span>
            </Link>
            <h1 className="mt-8 text-3xl font-semibold tracking-[-0.04em]">Create your account</h1>
            <p className="mt-2 text-sm text-white/40">Start solving and track your progress.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            
            {/* name */}
            <div className="form-control">
              <label htmlFor="signup-name" className="label">
                <span className="label-text font-medium">Name</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Code className="h-5 w-5 text-base-content/40" />
                </div>
                <input
                  type="text"
                  id="signup-name"
                  autoComplete="name"
                  {...register("name")}
                  className={`h-12 w-full rounded-xl border bg-[#111111] pl-10 pr-4 text-sm text-white outline-none transition-colors placeholder:text-white/25 ${
                    errors.name ? "border-red-400/60" : "border-white/10 hover:border-white/20 focus:border-white/30"
                  }`}
                  placeholder="John Doe"
                />
              </div>
              {errors.name && (
                <p className="mt-1.5 text-xs text-red-400">{errors.name.message}</p>
              )}              
            </div>

            {/* Email */}
            <div className="form-control">
              <label htmlFor="signup-email" className="label">
                <span className="label-text font-medium">Email</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-base-content/40" />
                </div>
                <input
                  type="email"
                  id="signup-email"
                  autoComplete="email"
                  {...register("email")}
                  className={`h-12 w-full rounded-xl border bg-[#111111] pl-10 pr-4 text-sm text-white outline-none transition-colors placeholder:text-white/25 ${
                    errors.email ? "border-red-400/60" : "border-white/10 hover:border-white/20 focus:border-white/30"
                  }`}
                  placeholder="you@example.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-400">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="form-control">
              <label htmlFor="signup-password" className="label">
                <span className="label-text font-medium">Password</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-base-content/40" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="signup-password"
                  autoComplete="new-password"
                  {...register("password")}
                  className={`h-12 w-full rounded-xl border bg-[#111111] pl-10 pr-12 text-sm text-white outline-none transition-colors placeholder:text-white/25 ${
                    errors.password ? "border-red-400/60" : "border-white/10 hover:border-white/20 focus:border-white/30"
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-base-content/40" />
                  ) : (
                    <Eye className="h-5 w-5 text-base-content/40" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-400">{errors.password.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white text-sm font-semibold text-black transition-colors hover:bg-[#e6e6e6] disabled:cursor-wait disabled:opacity-55"
             disabled={isSigninUp}
            >
               {isSigninUp ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Sign up"
              )}
            </button>
          </form>

          <div className="flex items-center gap-3" aria-hidden="true">
            <span className="h-px flex-1 bg-base-content/15" />
            <span className="text-xs font-medium uppercase tracking-widest text-base-content/50">
              or
            </span>
            <span className="h-px flex-1 bg-base-content/15" />
          </div>

          <GoogleAuthButton />

          {/* Footer */}
          <div className="text-center">
            <p className="text-sm text-white/45">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold text-white transition-colors hover:text-white/70">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

       {/* Right Side - Image/Pattern */}
      <AuthImagePattern
        title={"Welcome to our platform!"}
        subtitle={
          "Sign up to access our platform and start using our services."
        }
      />
    </div>
  )
}

export default SignUpPage
