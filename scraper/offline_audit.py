import json, os, glob

# Load the original complete data
files_111 = 'data/111_complete.json'
files_112 = 'data/112_complete.json'  
files_113 = 'data/113_complete.json'
missing_file = 'data/missing_questions.json'

all_questions = []
for f in [files_111, files_112, files_113]:
    if os.path.exists(f):
        with open(f, 'r', encoding='utf-8') as fh:
            data = json.load(fh)
            if isinstance(data, list):
                all_questions.extend(data)
            elif isinstance(data, dict):
                for docs in data.values():
                    if isinstance(docs, list):
                        all_questions.extend(docs)

# Also add missing questions
if os.path.exists(missing_file):
    with open(missing_file, 'r', encoding='utf-8') as fh:
        all_questions.extend(json.load(fh))

print(f"Total questions in local data: {len(all_questions)}")

# Count by year-subject
from collections import defaultdict
stats = defaultdict(lambda: {'total': 0, 'ids': []})
for q in all_questions:
    year = q.get('year', 'unknown')
    subj = q.get('subject', 'unknown')
    qn = q.get('questionNumber', 0)
    key = f"{year}-{subj}"
    stats[key]['total'] += 1
    stats[key]['ids'].append(qn)

# Now check which exp scripts we've uploaded (based on file names)
exp_files = glob.glob('exp_*.js') + glob.glob('fix_exp_*.js')
print(f"\nExplanation scripts found: {len(exp_files)}")
for f in sorted(exp_files):
    print(f"  {f}")

# Count questions that should have explanations
# From previous conversations, we know:
# - 111 complete: 70 questions per subject x several subjects (already had explanations from before)
# - 112/113 criminal: 50 each = 100 (we just wrote these)
# - remaining 43 questions (just uploaded)

print("\n========== LOCAL COVERAGE SUMMARY ==========\n")
print(f"{'Year-Subject':<30} {'Total':>6}")
print("-" * 40)
for key in sorted(stats.keys()):
    s = stats[key]
    print(f"{key:<30} {s['total']:>6}")

# Summary by year
year_totals = defaultdict(int)
for key, s in stats.items():
    year = key.split('-')[0]
    year_totals[year] += s['total']

print(f"\n{'Year':<10} {'Total':>6}")
print("-" * 20)
for y in sorted(year_totals.keys()):
    print(f"{y:<10} {year_totals[y]:>6}")
print(f"{'TOTAL':<10} {sum(year_totals.values()):>6}")

# Explanation coverage estimate
# Previously written (from earlier conversation sessions):
# 111: constitutional(30), administrative(30), criminal(50), civil(50), 
#      criminal_procedure(50+1=51), civil_procedure(12), enforcement(3+some), legal_english(15)
# 112: constitutional(30), administrative(30), criminal(50), civil(50),
#      criminal_procedure(20), civil_procedure(12), enforcement(2+some), legal_english(15)  
# 113: same pattern
# Plus all 143 new ones from this session

print("\n========== EXPLANATION STATUS ==========\n")
print("What we've written in THIS session (143 new + 13 fixes):")
print("  112 criminal: Q1-Q50 (50 questions) ✅")
print("  113 criminal: Q1-Q50 (50 questions) ✅")
print("  111 criminal_procedure Q51 (1) ✅")
print("  111 enforcement Q53-55 (3) ✅")
print("  111 legal_english Q56-70 (15) ✅")
print("  112 enforcement Q54-55 (2) ✅")
print("  112 legal_english Q56-70 (15) ✅")
print("  113 criminal_procedure Q51-55 (5) ✅")
print("  113 civil_procedure Q62 (1) ✅")
print("  113 enforcement Q54 (1) ✅")
print(f"\n  Session total: 143 new explanations")
print(f"\nFrom PREVIOUS sessions (approximate):")
print("  111: constitutional(~30), administrative(~30), criminal(~50), civil(~50)")
print("  111: criminal_procedure(~50), civil_procedure(~12)")
print("  112: constitutional(~30), administrative(~30), civil(~50)")
print("  112: criminal_procedure(~20), civil_procedure(~12)")
print("  113: constitutional(~30), administrative(~30), civil(~50)")
print("  113: civil_procedure(~11)")
print("\nNote: Exact counts need Firestore verification (quota currently exceeded)")
print("Recommendation: Re-run audit_coverage.js when quota resets (typically within 1 hour)")
