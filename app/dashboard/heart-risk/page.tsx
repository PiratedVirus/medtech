"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectValue, SelectItem } from "@/components/ui/select";
import { HeartIcon } from "lucide-react";

type Gender = "male" | "female";

export default function HeartRiskPredictorPage() {
  // form state
  const [age, setAge] = useState<number>(50);
  const [gender, setGender] = useState<Gender>("male");
  const [totalChol, setTotalChol] = useState<number>(200);
  const [hdlChol, setHdlChol] = useState<number>(50);
  const [systolicBP, setSystolicBP] = useState<number>(120);
  const [smoker, setSmoker] = useState<boolean>(false);
  const [diabetic, setDiabetic] = useState<boolean>(false);

  // risk result
  const [risk, setRisk] = useState<number | null>(null);

  function calculateFraminghamRisk() {
    // Simplified points-based Framingham scoring; real formulas are more complex.
    let points = 0;

    // Age points (example)
    if (gender === "male") {
      if (age < 35) points += -9;
      else if (age < 40) points += -4;
      else if (age < 45) points += 0;
      else if (age < 50) points += 3;
      else if (age < 55) points += 6;
      else if (age < 60) points += 8;
      else if (age < 65) points += 10;
      else if (age < 70) points += 11;
      else if (age < 75) points += 12;
      else points += 13;
    } else {
      // female breakpoints
      if (age < 35) points += -7;
      else if (age < 40) points += -3;
      else if (age < 45) points += 0;
      else if (age < 50) points += 3;
      else if (age < 55) points += 6;
      else if (age < 60) points += 8;
      else if (age < 65) points += 10;
      else if (age < 70) points += 12;
      else if (age < 75) points += 14;
      else points += 16;
    }

    // Cholesterol points
    points += Math.round((totalChol - 160) / 20);
    // HDL points (higher is protective)
    points += hdlChol >= 60 ? -1 : hdlChol >= 50 ? 0 : hdlChol >= 40 ? 1 : 2;
    // Blood pressure points
    points += systolicBP < 120 ? 0 : systolicBP < 130 ? 1 : systolicBP < 140 ? 2 : systolicBP < 160 ? 3 : 4;
    // Smoking
    if (smoker) points += gender === "male" ? 4 : 3;
    // Diabetes
    if (diabetic) points += 2;

    // Convert points to approximate 10-year risk %
    // (These are illustrative thresholds)
    let riskPct: number;
    if (points < 0) riskPct = 1;
    else if (points < 5) riskPct = 5;
    else if (points < 10) riskPct = 10;
    else if (points < 15) riskPct = 15;
    else if (points < 20) riskPct = 20;
    else riskPct = 30;

    setRisk(riskPct);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-6">
        <div className="flex justify-center mb-4">
          <HeartIcon className="h-32 w-32 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold mb-4 text-center">Heart Risk Predictor</h1>

        <Dialog>
          <DialogTrigger asChild>
            <Button className="w-full">Start Assessment</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enter your details</DialogTitle>
              <DialogDescription>
                We'll calculate your 10-year cardiovascular risk.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={age}
                  onChange={(e) => setAge(+e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="gender">Gender</Label>
                <Select value={gender} onValueChange={(v) => setGender(v as Gender)}>
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="totalChol">Total Cholesterol (mg/dL)</Label>
                <Input
                  id="totalChol"
                  type="number"
                  value={totalChol}
                  onChange={(e) => setTotalChol(+e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="hdlChol">HDL Cholesterol (mg/dL)</Label>
                <Input
                  id="hdlChol"
                  type="number"
                  value={hdlChol}
                  onChange={(e) => setHdlChol(+e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="systolicBP">Systolic BP (mmHg)</Label>
                <Input
                  id="systolicBP"
                  type="number"
                  value={systolicBP}
                  onChange={(e) => setSystolicBP(+e.target.value)}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  id="smoker"
                  type="checkbox"
                  checked={smoker}
                  onChange={(e) => setSmoker(e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="smoker">Current Smoker</Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  id="diabetic"
                  type="checkbox"
                  checked={diabetic}
                  onChange={(e) => setDiabetic(e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="diabetic">Diabetes</Label>
              </div>
            </div>

            <DialogFooter className="space-x-2">
              <Button onClick={calculateFraminghamRisk}>Calculate Risk</Button>
            </DialogFooter>

            {risk !== null && (
              <div className="mt-4 text-center">
                <p className="text-lg">
                  Your estimated 10-year risk is{" "}
                  <span className="font-bold">{risk}%</span>
                </p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </Card>
    </div>
  );
}