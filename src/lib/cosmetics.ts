import { 
  Mountain, Dumbbell, Brain, Target, 
  Sun, Moon, Rocket, Leaf, Trophy, Crown, 
  Star, Zap, Award, Medal, Shield,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface AvatarOption {
  id: string;
  name: string;
  icon: LucideIcon;
  gradient: string;
  description: string;
}

export const avatars: AvatarOption[] = [
  { id: 'monk', name: 'Monk', icon: Mountain, gradient: 'from-amber-500 to-orange-600', description: 'Inner peace & focus' },
  { id: 'athlete', name: 'Athlete', icon: Dumbbell, gradient: 'from-red-500 to-rose-600', description: 'Strength & endurance' },
  { id: 'scholar', name: 'Scholar', icon: Brain, gradient: 'from-violet-500 to-purple-600', description: 'Knowledge & wisdom' },
  { id: 'sharpshooter', name: 'Sharpshooter', icon: Target, gradient: 'from-cyan-500 to-blue-600', description: 'Precision & aim' },
  { id: 'sunrise', name: 'Sunrise', icon: Sun, gradient: 'from-yellow-400 to-amber-500', description: 'Early riser' },
  { id: 'nightowl', name: 'Night Owl', icon: Moon, gradient: 'from-indigo-500 to-slate-700', description: 'After-hours focus' },
  { id: 'pioneer', name: 'Pioneer', icon: Rocket, gradient: 'from-fuchsia-500 to-pink-600', description: 'Trailblazer' },
  { id: 'naturalist', name: 'Naturalist', icon: Leaf, gradient: 'from-emerald-500 to-green-600', description: 'In tune with nature' },
];

export interface BadgeOption {
  id: string;
  name: string;
  icon: LucideIcon;
  description: string;
  requirement: string;
  tier: 'bronze' | 'silver' | 'gold' | 'legendary';
  gradient: string;
}

export const badges: BadgeOption[] = [
  { id: 'first-step', name: 'First Step', icon: Star, description: 'Complete your first habit', requirement: '1 completion', tier: 'bronze', gradient: 'from-amber-600 to-orange-700' },
  { id: 'consistent', name: 'Consistent', icon: Award, description: 'Maintain a 3-day streak', requirement: '3-day streak', tier: 'bronze', gradient: 'from-orange-500 to-amber-600' },
  { id: 'week-warrior', name: 'Week Warrior', icon: Medal, description: 'Complete all habits for 7 days', requirement: '7-day streak', tier: 'silver', gradient: 'from-slate-400 to-slate-600' },
  { id: 'monk-mode', name: 'Monk Mode', icon: Mountain, description: 'Complete all habits for 30 days straight', requirement: '30-day streak', tier: 'gold', gradient: 'from-yellow-400 to-amber-500' },
  { id: 'orbit-master', name: 'Orbit Master', icon: Crown, description: 'Complete all habits for 100 days', requirement: '100-day streak', tier: 'legendary', gradient: 'from-fuchsia-500 to-violet-600' },
  { id: 'speed-demon', name: 'Speed Demon', icon: Zap, description: 'Complete 10 habits before noon', requirement: '10 morning habits', tier: 'silver', gradient: 'from-cyan-400 to-blue-500' },
  { id: 'centurion', name: 'Centurion', icon: Trophy, description: 'Reach 100 total completions', requirement: '100 completions', tier: 'gold', gradient: 'from-yellow-500 to-orange-500' },
  { id: 'unbreakable', name: 'Unbreakable', icon: Shield, description: 'Never miss a day for 60 days', requirement: '60-day streak', tier: 'gold', gradient: 'from-emerald-500 to-teal-600' },
];

export const tierColors: Record<BadgeOption['tier'], { text: string; border: string; bg: string; label: string }> = {
  bronze: { text: 'text-amber-500', border: 'border-amber-600/30', bg: 'bg-amber-600/10', label: 'Bronze' },
  silver: { text: 'text-slate-300', border: 'border-slate-400/30', bg: 'bg-slate-400/10', label: 'Silver' },
  gold: { text: 'text-yellow-400', border: 'border-yellow-500/30', bg: 'bg-yellow-500/10', label: 'Gold' },
  legendary: { text: 'text-fuchsia-400', border: 'border-fuchsia-500/30', bg: 'bg-fuchsia-500/10', label: 'Legendary' },
};
