import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/studio-card';
import { ArrowLeft, ArrowRight, Check, Upload } from 'lucide-react';

const steps = ['Identity', 'Craft', 'Portfolio', 'Review'];

export default function Application() {
  const [step, setStep] = useState(0);
  return (
    <>
      <Header title="Application" subtitle="Apply to the Furii Operator program" />
      <div className="p-6 lg:p-10 max-w-3xl mx-auto">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((label, i) => (
            <div key={label} className="flex-1 flex items-center gap-2">
              <div className={`h-7 w-7 grid place-items-center rounded-full text-xs font-mono border transition-colors ${
                i < step ? 'bg-primary text-primary-foreground border-primary' :
                i === step ? 'border-primary text-primary' :
                'border-border text-muted-foreground'
              }`}>
                {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <div className={`text-xs ${i === step ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</div>
              {i < steps.length - 1 && <div className="flex-1 h-px bg-border" />}
            </div>
          ))}
        </div>

        <Card hover={false}>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              {step === 0 && (
                <div className="space-y-4">
                  <div>
                    <div className="text-xs uppercase tracking-widest text-primary font-mono">Step 1</div>
                    <h2 className="font-display text-3xl mt-1">Tell us who you are</h2>
                  </div>
                  <Field label="Full name" placeholder="Aiden Vossberg" />
                  <Field label="Email" placeholder="you@studio.com" />
                  <Field label="Location" placeholder="Berlin, DE" />
                </div>
              )}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <div className="text-xs uppercase tracking-widest text-primary font-mono">Step 2</div>
                    <h2 className="font-display text-3xl mt-1">What do you craft?</h2>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-2">Primary disciplines</div>
                    <div className="flex flex-wrap gap-2">
                      {['Motion', '3D', 'Branding', 'UI/UX', 'Sound', 'Direction'].map((t) => (
                        <button key={t} className="px-3 py-1.5 rounded-full border border-border bg-secondary text-sm hover:border-primary/60 hover:text-primary transition-colors">
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Field label="Years of experience" placeholder="5" />
                  <Field label="Tools you live in" placeholder="After Effects, Cinema 4D, Figma…" />
                </div>
              )}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <div className="text-xs uppercase tracking-widest text-primary font-mono">Step 3</div>
                    <h2 className="font-display text-3xl mt-1">Show your work</h2>
                  </div>
                  <Field label="Portfolio URL" placeholder="https://" />
                  <Field label="Showreel URL" placeholder="https://vimeo.com/…" />
                  <motion.div
                    whileHover={{ scale: 1.005 }}
                    className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/60 transition-colors cursor-pointer"
                  >
                    <Upload className="h-6 w-6 mx-auto text-primary" />
                    <div className="text-sm mt-3">Drop your case study PDF here</div>
                    <div className="text-xs text-muted-foreground mt-1">or click to browse · max 50MB</div>
                  </motion.div>
                </div>
              )}
              {step === 3 && (
                <div className="text-center py-6">
                  <motion.div
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 120 }}
                    className="h-20 w-20 mx-auto rounded-full bg-gradient-gold grid place-items-center glow-gold"
                  >
                    <Check className="h-9 w-9 text-primary-foreground" />
                  </motion.div>
                  <h2 className="font-display text-3xl mt-6">Application ready</h2>
                  <p className="text-muted-foreground mt-2 max-w-md mx-auto text-sm">
                    Your file is locked in. Our directors review every applicant within 5 business days.
                    You'll get a craft brief if shortlisted.
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            <button
              disabled={step === 0}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-30"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
              className="bg-gradient-gold text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 glow-gold"
            >
              {step === steps.length - 1 ? 'Submit application' : 'Continue'} <ArrowRight className="h-4 w-4" />
            </motion.button>
          </div>
        </Card>
      </div>
    </>
  );
}

const Field = ({ label, placeholder }: { label: string; placeholder: string }) => (
  <div>
    <div className="text-xs text-muted-foreground mb-1.5">{label}</div>
    <input
      placeholder={placeholder}
      className="w-full bg-input border border-border focus:border-primary outline-none rounded-lg px-3 py-2.5 text-sm transition-colors"
    />
  </div>
);
