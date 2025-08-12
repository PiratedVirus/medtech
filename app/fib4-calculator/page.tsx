"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function Fib4CalculatorPage() {
  const [age, setAge] = useState<string>("");
  const [ast, setAst] = useState<string>("");
  const [alt, setAlt] = useState<string>("");
  const [platelets, setPlatelets] = useState<string>("");
  const [fib4, setFib4] = useState<number | null>(null);
  const [risk, setRisk] = useState<string>("");

  function computeFib4() {
    const ageNum = parseFloat(age);
    const astNum = parseFloat(ast);
    const altNum = parseFloat(alt);
    const plateNum = parseFloat(platelets);
    if ([ageNum, astNum, altNum, plateNum].some((v) => !isFinite(v) || v <= 0)) {
      setFib4(null);
      setRisk("Please enter valid positive values.");
      return;
    }
    // FIB-4 formula: (Age × AST) / (Platelets × sqrt(ALT))
    const value = (ageNum * astNum) / (plateNum * Math.sqrt(altNum));
    setFib4(value);
    // Standard adult cutoffs (>= 35 years often used; here we show general bands)
    if (ageNum < 35) {
      setRisk(value < 0.4 ? "Low risk" : value < 1.0 ? "Intermediate risk" : "High risk");
    } else {
      setRisk(value < 1.3 ? "Low risk" : value <= 2.67 ? "Intermediate risk" : "High risk");
    }
  }

  function reset() {
    setAge("");
    setAst("");
    setAlt("");
    setPlatelets("");
    setFib4(null);
    setRisk("");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-muted">
      <Card className="w-full max-w-xl p-6">
        <h1 className="text-2xl font-bold mb-4">FIB-4 Calculator</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <Label htmlFor="age">Age (years)</Label>
            <Input id="age" value={age} onChange={(e) => setAge(e.target.value)} placeholder="e.g. 50" />
          </div>
          <div>
            <Label htmlFor="ast">AST (U/L)</Label>
            <Input id="ast" value={ast} onChange={(e) => setAst(e.target.value)} placeholder="e.g. 55" />
          </div>
          <div>
            <Label htmlFor="alt">ALT (U/L)</Label>
            <Input id="alt" value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="e.g. 45" />
          </div>
          <div>
            <Label htmlFor="platelets">Platelets (10^9/L)</Label>
            <Input id="platelets" value={platelets} onChange={(e) => setPlatelets(e.target.value)} placeholder="e.g. 200" />
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <Button onClick={computeFib4}>Calculate</Button>
          <Button variant="outline" onClick={reset}>Reset</Button>
        </div>

        {fib4 !== null && (
          <div className="rounded-lg border p-4 bg-white">
            <div className="text-lg font-semibold">FIB-4 Score: {fib4.toFixed(2)}</div>
            <div className="text-sm text-gray-600 mt-1">Risk Category: {risk}</div>
            <div className="text-xs text-gray-500 mt-2">
              Formula: (Age × AST) / (Platelets × √ALT). Cutoffs may vary by guideline and age.
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}


