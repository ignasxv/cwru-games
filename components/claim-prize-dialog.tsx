"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gift, Loader2 } from "lucide-react";
import { claimUserProfile } from "@/lib/actions/claim-profile";
import { useToast } from "@/hooks/use-toast";

interface ClaimPrizeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: number;
  currentUsername: string;
}

export function ClaimPrizeDialog({ open, onOpenChange, userId, currentUsername }: ClaimPrizeDialogProps) {
  const [igHandle, setIgHandle] = useState("");
  const [caseId, setCaseId] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!igHandle.trim() || !caseId.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both your Instagram handle and Case ID.",
        variant: "destructive",
      });
      return;
    }

    // Basic email validation for Case ID
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(caseId)) {
      toast({
        title: "Invalid Case ID",
        description: "Please enter a valid Case email address (e.g., abc123@case.edu).",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const result = await claimUserProfile(userId, igHandle, caseId);

      if (result.success) {
        toast({
          title: "🎉 Prize Claimed!",
          description: "Your info has been submitted. Check your email for your prize details!",
        });
        onOpenChange(false);
        // Reload to refresh user data
        window.location.reload();
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to claim prize. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gray-800 border-gray-700 text-gray-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-yellow-400 text-xl">
            <Gift className="h-6 w-6" />
            Claim Your Prize !
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            🎊 Congratulations 🎊  Keep an eye on our stories and your inbox for more details!
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 my-4">
          <div className="space-y-2">
            <Label htmlFor="igHandle" className="text-gray-200 font-mono">
              Instagram Handle
            </Label>
            <Input
              id="igHandle"
              type="text"
              placeholder="yourhandle"
              value={igHandle}
              onChange={(e) => setIgHandle(e.target.value)}
              className="bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400 font-mono"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="caseId" className="text-gray-200 font-mono">
              Case ID (Email)
            </Label>
            <Input
              id="caseId"
              type="email"
              placeholder="abc123@case.edu"
              value={caseId}
              onChange={(e) => setCaseId(e.target.value)}
              className="bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400 font-mono"
              disabled={loading}
            />
          </div>

          <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-lg p-3">
            <p className="text-xs text-gray-300 font-mono">
              <strong className="text-yellow-400">Note:</strong> Your current username ({currentUsername}) will be
              preserved. You will be able to use your case id to stack your progress across any devices!
            </p>
          </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="text-gray-300 hover:text-gray-100"
          >
            Maybe Later
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 font-bold hover:from-yellow-500 hover:to-yellow-600"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Gift className="h-4 w-4 mr-2" />
                Submit
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
