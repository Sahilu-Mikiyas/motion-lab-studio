-- Add optional file URLs for cover letter and qualifications PDFs
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS cover_letter_url text,
  ADD COLUMN IF NOT EXISTS qualifications_url text;

-- Allow text fields to be empty when only a PDF is provided
ALTER TABLE public.applications ALTER COLUMN cover_letter DROP NOT NULL;
ALTER TABLE public.applications ALTER COLUMN qualifications DROP NOT NULL;

-- Seed lessons (idempotent: clear and reseed)
DELETE FROM public.lessons;
INSERT INTO public.lessons (title, description, youtube_url, module, sort_order, required_level) VALUES
('Day 1 — Interface + Principles', '12 Principles of Animation foundations. Teaching layer: explain what a keyframe is and why it matters.', 'https://youtu.be/uDqjIdI4bF4', 'Week 1 — Foundations', 1, 0),
('Day 1 — Animate basics (TipTut)', 'Companion video for foundational interface and basic motion.', 'https://youtu.be/d9H7c3K7l5s', 'Week 1 — Foundations', 2, 0),
('Day 2 — Weight & Timing', 'Squash & stretch, bouncing ball. Teach timing vs spacing.', 'https://youtu.be/haa7n3UGyDc', 'Week 1 — Foundations', 3, 0),
('Day 2 — Bouncing ball (BaM)', 'Companion bouncing ball walkthrough.', 'https://youtu.be/6XvFHG0HT7w', 'Week 1 — Foundations', 4, 0),
('Day 3 — Arcs', 'Arcs in motion. Teach why straight lines look unnatural.', 'https://youtu.be/zBLQcO2d0Fg', 'Week 1 — Foundations', 5, 0),
('Day 3 — Motion Arcs (Wimshurst)', 'Companion arcs deep-dive.', 'https://youtu.be/KRVhtMxQWRs', 'Week 1 — Foundations', 6, 0),
('Day 4 — Facial Expression', 'Facial acting fundamentals. Teach 3 expressions you used.', 'https://youtu.be/Wr6K9Kz0XfM', 'Week 1 — Foundations', 7, 0),
('Day 5 — Acting & Posing', 'Follow-through and readable poses.', 'https://youtu.be/5VOYjzE3OpY', 'Week 1 — Foundations', 8, 0),
('Day 6 — Symbols & Structure', 'Symbols explained — why rigs save time.', 'https://youtu.be/OnlU40b1lOA', 'Week 2 — Rigging', 9, 1),
('Day 7 — Rig Creation', 'Build a simple rig. Explain pivot points.', 'https://youtu.be/EetloQGJ2yM', 'Week 2 — Rigging', 10, 1),
('Day 8 — Tween vs Frame-by-Frame', 'Workflow comparison. When to use each.', 'https://youtu.be/kdY8Wn8q9G4', 'Week 2 — Rigging', 11, 1),
('Day 9 — Walk Cycle', 'Walk cycle basics. Break down key poses.', 'https://youtu.be/8g6jQzX4f8Y', 'Week 2 — Rigging', 12, 1),
('Day 10 — Hybrid Animation', 'Add secondary motion to your rig.', NULL, 'Week 2 — Rigging', 13, 1),
('Day 11 — Lip Sync', 'Lip sync basics and phonemes.', 'https://youtu.be/9sXcAJ7r8cY', 'Week 2 — Rigging', 14, 1),
('Day 12 — Mini Scene (30s)', 'Combine everything; record yourself explaining your workflow.', NULL, 'Week 2 — Rigging', 15, 1),
('Day 13 — Silent Acting', 'Study Paperman. Body-language breakdown.', NULL, 'Week 3 — Storytelling', 16, 2),
('Day 14 — Visual Metaphor', 'Study Kurzgesagt. Meaning through visuals.', NULL, 'Week 3 — Storytelling', 17, 2),
('Day 15 — Camera Movement', 'Pans & zooms. Emotional impact.', NULL, 'Week 3 — Storytelling', 18, 2),
('Day 16 — Clean Workflow', 'Organize files. Pipeline explanation.', NULL, 'Week 3 — Storytelling', 19, 2),
('Day 17 — Sound Design', 'Add audio. Timing with sound.', NULL, 'Week 3 — Storytelling', 20, 2),
('Day 18 — Speed Test', 'Redo faster. Efficiency tricks.', NULL, 'Week 3 — Storytelling', 21, 2),
('Day 19–20 — Practice Short (45s)', 'Full mini film. Explain decisions step-by-step.', NULL, 'Week 3 — Storytelling', 22, 2),
('Day 21 — Idea + Concept', 'Define message, emotion, main character.', NULL, 'Final Project', 23, 2),
('Day 22 — Script', 'Hook, build, shift, ending.', NULL, 'Final Project', 24, 2),
('Day 23 — Storyboard', 'Draw full sequence.', NULL, 'Final Project', 25, 2),
('Day 24 — Animatic', 'Rough timed version (very important).', NULL, 'Final Project', 26, 2),
('Day 25 — Asset Creation', 'Characters, backgrounds, props.', NULL, 'Final Project', 27, 2),
('Day 26 — Blocking', 'Key poses only.', NULL, 'Final Project', 28, 2),
('Day 27 — Animation Pass', 'Motion + timing.', NULL, 'Final Project', 29, 2),
('Day 28 — Polish', 'Secondary motion, clean lines.', NULL, 'Final Project', 30, 2),
('Day 29 — Sound + Final Render', 'Voice / SFX / music.', NULL, 'Final Project', 31, 2),
('Day 30 — Review + Teaching Output', 'Explain full process; mistakes, improvements, principles used.', NULL, 'Final Project', 32, 2);

-- Seed tasks tied to each day
DELETE FROM public.tasks;
INSERT INTO public.tasks (title, brief, required_level, payout, is_paid) VALUES
('Day 1 — Animate a simple ball movement', 'Apply basic principles. Submit a short clip plus a written note: what is a keyframe and why it matters.', 0, 0, false),
('Day 2 — Light vs heavy ball', 'Two bouncing balls of different weight. Teach timing vs spacing in your write-up.', 0, 0, false),
('Day 3 — Pendulum + emotional head turn', 'Show arcs in motion. Explain why straight lines look unnatural.', 0, 0, false),
('Day 4 — Talking head (1 sentence)', 'Animate a single sentence. Break down 3 expressions you used.', 0, 0, false),
('Day 5 — Emotional pose scene', 'Single emotional pose. Explain what makes a pose readable.', 0, 0, false),
('Day 6 — Break character into parts', 'Symbol-based decomposition for a simple character.', 1, 0, false),
('Day 7 — Build a simple rig', 'Functional rig with explained pivot points.', 1, 0, false),
('Day 8 — Same animation, two methods', 'Tween version + frame-by-frame version. Note when to use each.', 1, 0, false),
('Day 9 — Loop walk cycle', 'Loopable walk cycle. Break down the key poses.', 1, 0, false),
('Day 10 — Add secondary motion to rig', 'Hybrid animation pass on your rig.', 1, 0, false),
('Day 11 — One spoken line (lip sync)', 'A single line synced with audio. Explain the phonemes.', 1, 0, false),
('Day 12 — Mini scene (30 sec)', 'Combine everything from Week 1 & 2. Record a workflow explanation.', 1, 0, false),
('Day 13 — Silent acting scene', 'Convey one emotion silently. Body-language breakdown.', 2, 0, false),
('Day 14 — Visual metaphor', 'Symbolic animation. Explain meaning through visuals.', 2, 0, false),
('Day 15 — Camera movement', 'Add pans and zooms. Explain emotional impact.', 2, 0, false),
('Day 16 — Clean workflow', 'Organized file structure. Pipeline explanation.', 2, 0, false),
('Day 17 — Sound design', 'Add audio. Timing with sound.', 2, 0, false),
('Day 18 — Speed test', 'Redo a previous task faster. Efficiency tricks.', 2, 0, false),
('Day 19–20 — Practice short (45s)', 'Full mini film. Explain decisions step-by-step.', 2, 0, false),
('Day 21 — Final film: idea + concept', 'Message, emotion, main character.', 2, 0, false),
('Day 22 — Final film: script', 'Hook, build, shift, ending.', 2, 0, false),
('Day 23 — Final film: storyboard', 'Full sequence drawn.', 2, 0, false),
('Day 24 — Final film: animatic', 'Rough timed version.', 2, 0, false),
('Day 25 — Final film: asset creation', 'Characters, backgrounds, props.', 2, 0, false),
('Day 26 — Final film: blocking', 'Key poses only.', 2, 0, false),
('Day 27 — Final film: animation pass', 'Motion + timing pass.', 2, 0, false),
('Day 28 — Final film: polish', 'Secondary motion + clean lines.', 2, 0, false),
('Day 29 — Final film: sound + render', 'Voice, SFX, music, final render.', 2, 0, false),
('Day 30 — Review + teaching output', 'Explain your full process: mistakes, improvements, principles used.', 2, 0, false);