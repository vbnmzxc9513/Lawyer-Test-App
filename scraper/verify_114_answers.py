import json, sys
sys.stdout.reconfigure(encoding='utf-8')

data = json.load(open('data/114_complete.json', 'r', encoding='utf-8'))

# Official answers from the image (2301 = 綜合法學一: 憲法+行政法+國際公法+國際私法)
official_2301 = {
    1:'A',2:'D',3:'B',4:'D',5:'A',6:'D',7:'A',8:'D',9:'A',10:'B',
    11:'A',12:'D',13:'B',14:'D',15:'A',16:'D',17:'B',18:'D',19:'D',20:'C',
    21:'A',22:'D',23:'B',24:'D',25:'C',26:'C',27:'D',28:'B',29:'D',30:'B',
    31:'C',32:'D',33:'C',34:'D',35:'A',36:'B',37:'D',38:'A',39:'B',40:'C',
    41:'B',42:'C',43:'D',44:'A',45:'C',46:'D',47:'A',48:'D',49:'C',50:'C',
    51:'D',52:'A',53:'D',54:'C',55:'D',56:'A',57:'D',58:'D',59:'D',60:'D',
    61:'C',62:'A',63:'C',64:'D',65:'C',66:'A',67:'C',68:'A',69:'C',70:'C',
    71:'B',72:'C',73:'D',74:'C',75:'C'
}

paper301 = [q for q in data if '301' in q.get('id','')]
paper301.sort(key=lambda x: x.get('questionNumber',0))

print("=== 2301 answers ===")
mismatches = []
for q in paper301:
    qnum = q.get('questionNumber', 0)
    db_ans = q.get('answer', '?')
    official = official_2301.get(qnum, '?')
    if db_ans != official:
        mismatches.append((qnum, db_ans, official, q['id']))
        print(f"Q{qnum:02d}: DB={db_ans} Official={official} ** WRONG **")

print(f"\nMismatches: {len(mismatches)}/{len(paper301)}")
if mismatches:
    print("\nWrong questions:")
    for qnum, db, off, qid in mismatches:
        print(f"  {qid}: DB={db} -> should be {off}")
