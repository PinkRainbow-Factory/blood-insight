export const defaultProfile = {
  displayName: "",
  age: "",
  sex: "female",
  mode: "general",
  diseaseQuery: "",
  diseaseCode: "",
  notes: "",
  doctorMemo: "",
  medications: "",
  careContext: "",
  nextLabDate: "",
  reminderTime: "09:00",
  reminderStrategy: "day-before-and-day-of",
  medicationReminderTime: "08:00",
  medicationSchedules: [
    { id: "morning", label: "아침 복약", dose: "", note: "", time: "08:00", daysPreset: "daily", mealTiming: "after_meal", color: "rose" }
  ],
  symptomSummary: "",
  symptomSeverity: "mild",
  symptomOnset: "within_days",
  symptomDurationDays: "",
  symptomTriggers: "",
  symptomRelief: "",
  symptomTags: [],
  symptomWatch: "",
  ocrTemplate: "general",
  ocrInstitutionPreset: "generic"
};

export const diseaseCatalog = [
  { code: "C91.00", name: "급성 림프모구성 백혈병", group: "혈액암", focus: ["WBC", "HGB", "PLT", "CRP"], note: "백혈구 이상과 빈혈, 혈소판 저하 패턴을 함께 추적합니다.", keywords: ["ALL", "급성 림프구성 백혈병", "림프모구"] },
  { code: "C92.00", name: "급성 골수성 백혈병", group: "혈액암", focus: ["WBC", "HGB", "PLT", "CRP"], note: "골수 기능 저하와 감염 지표를 같이 보는 것이 중요합니다.", keywords: ["AML", "급성 골수성", "백혈병"] },
  { code: "C92.10", name: "만성 골수성 백혈병", group: "혈액암", focus: ["WBC", "PLT", "HGB"], note: "백혈구와 혈소판 증감, 치료 반응 추이를 길게 봅니다.", keywords: ["CML", "만성 골수성", "백혈구"] },
  { code: "C91.10", name: "만성 림프구성 백혈병", group: "혈액암", focus: ["WBC", "HGB", "PLT"], note: "림프구 증가와 빈혈, 혈소판 저하 여부를 함께 확인합니다.", keywords: ["CLL", "만성 림프구성"] },
  { code: "C90.00", name: "다발골수종", group: "혈액암", focus: ["HGB", "CREAT", "CRP"], note: "빈혈과 신장기능, 염증성 변화를 함께 보는 편이 좋습니다.", keywords: ["multiple myeloma", "골수종"] },
  { code: "C83.30", name: "미만성 거대 B세포 림프종", group: "혈액암", focus: ["CRP", "HGB", "WBC"], note: "치료 중 염증 반응과 골수 억제 여부를 같이 추적합니다.", keywords: ["DLBCL", "림프종"] },
  { code: "C81.90", name: "호지킨 림프종", group: "혈액암", focus: ["CRP", "HGB", "WBC"], note: "전신 염증과 빈혈 양상을 함께 보는 데 의미가 있습니다.", keywords: ["Hodgkin", "호지킨"] },
  { code: "D46.9", name: "골수형성이상증후군", group: "혈액질환", focus: ["WBC", "HGB", "PLT"], note: "골수 기능 저하 패턴을 장기적으로 추적합니다.", keywords: ["MDS", "골수이형성"] },
  { code: "D61.9", name: "재생불량성 빈혈", group: "혈액질환", focus: ["WBC", "HGB", "PLT"], note: "전반적인 혈구 감소 여부가 가장 중요합니다.", keywords: ["aplastic anemia", "재생불량"] },
  { code: "D50.9", name: "철결핍성 빈혈", group: "혈액질환", focus: ["HGB", "RBC", "FERRITIN"], note: "혈색소와 저장철 수치를 함께 확인합니다.", keywords: ["iron deficiency", "철결핍"] },
  { code: "D64.9", name: "빈혈", group: "혈액질환", focus: ["HGB", "RBC", "FERRITIN"], note: "원인에 따라 철 저장, 만성질환, 출혈 맥락을 같이 봅니다.", keywords: ["anemia", "혈색소"] },
  { code: "D69.6", name: "혈소판감소증", group: "혈액질환", focus: ["PLT", "CRP"], note: "출혈 위험과 염증성 원인을 함께 점검합니다.", keywords: ["thrombocytopenia", "혈소판 감소"] },
  { code: "D69.3", name: "면역성 혈소판감소증", group: "혈액질환", focus: ["PLT", "CRP"], note: "혈소판 수치 변화와 출혈 증상을 같이 기록하는 것이 좋습니다.", keywords: ["ITP", "면역성 혈소판"] },
  { code: "N18.9", name: "만성 신장질환", group: "신장", focus: ["CREAT", "BUN", "HGB"], note: "신장 기능 저하와 동반 빈혈을 함께 추적합니다.", keywords: ["CKD", "신부전", "신장"] },
  { code: "N17.9", name: "급성 신손상", group: "신장", focus: ["CREAT", "BUN", "CRP"], note: "급격한 수치 변화 여부가 중요합니다.", keywords: ["AKI", "급성 신부전"] },
  { code: "K74.60", name: "간경변증", group: "간질환", focus: ["AST", "ALT", "PLT"], note: "간기능 이상과 혈소판 감소 경향을 같이 살핍니다.", keywords: ["cirrhosis", "간경화"] },
  { code: "K76.0", name: "지방간", group: "간질환", focus: ["AST", "ALT", "GLU"], note: "간효소와 대사성 수치를 같이 보는 편이 유용합니다.", keywords: ["fatty liver", "지방간"] },
  { code: "B18.1", name: "만성 B형간염", group: "간질환", focus: ["AST", "ALT", "CRP"], note: "간세포 손상과 염증성 변화를 같이 봅니다.", keywords: ["B형간염", "hepatitis b"] },
  { code: "B18.2", name: "만성 C형간염", group: "간질환", focus: ["AST", "ALT", "CRP"], note: "간효소의 변화 폭과 추세를 보는 것이 중요합니다.", keywords: ["C형간염", "hepatitis c"] },
  { code: "E11.9", name: "제2형 당뇨병", group: "대사", focus: ["GLU", "CRP", "ALT"], note: "혈당과 염증, 지방간 경향을 함께 볼 수 있습니다.", keywords: ["type 2 diabetes", "당뇨", "혈당"] },
  { code: "E10.9", name: "제1형 당뇨병", group: "대사", focus: ["GLU", "CRP"], note: "혈당 변동성과 저혈당 위험 증상을 함께 기록하면 좋습니다.", keywords: ["type 1 diabetes", "제1형 당뇨"] },
  { code: "E03.9", name: "갑상선기능저하증", group: "내분비", focus: ["HGB", "GLU", "CRP"], note: "피로와 빈혈 경향이 동반되는지 함께 살펴봅니다.", keywords: ["hypothyroidism", "갑상선 저하"] },
  { code: "E05.9", name: "갑상선기능항진증", group: "내분비", focus: ["WBC", "GLU", "ALT"], note: "체중 변화와 간효소, 혈당 변화 맥락을 같이 봅니다.", keywords: ["hyperthyroidism", "갑상선 항진"] },
  { code: "M32.9", name: "전신홍반루푸스", group: "자가면역", focus: ["WBC", "HGB", "PLT", "CRP"], note: "혈구 감소와 염증 소견을 함께 보는 경우가 많습니다.", keywords: ["SLE", "루푸스"] },
  { code: "M06.9", name: "류마티스관절염", group: "자가면역", focus: ["CRP", "HGB", "PLT"], note: "염증 활성도와 만성염증성 빈혈 경향을 함께 봅니다.", keywords: ["RA", "류마티스"] },
  { code: "K50.90", name: "크론병", group: "염증성 장질환", focus: ["CRP", "HGB", "FERRITIN"], note: "염증 활성도와 영양·철 결핍 경향을 같이 봅니다.", keywords: ["Crohn", "크론"] },
  { code: "K51.90", name: "궤양성 대장염", group: "염증성 장질환", focus: ["CRP", "HGB", "PLT"], note: "출혈과 염증 반응을 함께 추적하는 편이 좋습니다.", keywords: ["ulcerative colitis", "궤양성 대장염"] },
  { code: "J18.9", name: "폐렴", group: "감염", focus: ["WBC", "CRP"], note: "감염성 염증 신호가 얼마나 강한지 확인합니다.", keywords: ["pneumonia", "감염"] },
  { code: "A41.9", name: "패혈증", group: "감염", focus: ["WBC", "CRP", "PLT", "CREAT"], note: "염증, 응고, 장기 기능 변화를 종합적으로 추적합니다.", keywords: ["sepsis", "패혈증"] },
  { code: "I50.9", name: "심부전", group: "심혈관", focus: ["BUN", "CREAT", "HGB"], note: "신장 기능과 빈혈 경향이 같이 영향을 줄 수 있습니다.", keywords: ["heart failure", "심부전"] },
  { code: "I10", name: "고혈압", group: "심혈관", focus: ["CREAT", "GLU"], note: "신장 기능과 대사 위험도를 장기적으로 보는 편이 좋습니다.", keywords: ["hypertension", "고혈압"] },
  { code: "C92.50", name: "급성 골수단핵구성 백혈병", group: "혈액암", focus: ["WBC", "HGB", "PLT", "LDH"], note: "백혈구 계열 변화와 골수 억제, 세포 turnover를 함께 추적합니다.", keywords: ["AMML", "골수단핵구성", "단핵구성 백혈병"] },
  { code: "C92.40", name: "급성 전골수구성 백혈병", group: "혈액암", focus: ["WBC", "PLT", "CRP", "LDH"], note: "응고·출혈 위험과 치료 반응을 빠르게 추적하는 맥락이 중요합니다.", keywords: ["APL", "전골수구성", "급성 전골수구"] },
  { code: "C91.40", name: "털세포백혈병", group: "혈액암", focus: ["WBC", "HGB", "PLT"], note: "범혈구 감소 양상과 비장 관련 맥락을 함께 살핍니다.", keywords: ["hairy cell leukemia", "털세포"] },
  { code: "C88.00", name: "왈덴스트룀 마크로글로불린혈증", group: "혈액암", focus: ["HGB", "PLT", "CREAT"], note: "빈혈과 점도 증가 관련 증상, 신기능 맥락을 함께 봅니다.", keywords: ["Waldenstrom", "마크로글로불린혈증"] },
  { code: "C82.90", name: "여포림프종", group: "혈액암", focus: ["LDH", "HGB", "WBC"], note: "종양 활성과 골수 영향 여부를 함께 추적합니다.", keywords: ["follicular lymphoma", "여포 림프종"] },
  { code: "C84.40", name: "말초 T세포 림프종", group: "혈액암", focus: ["LDH", "CRP", "HGB"], note: "염증과 종양 활성도를 장기 추적으로 보는 편이 좋습니다.", keywords: ["PTCL", "T세포 림프종"] },
  { code: "C85.90", name: "비호지킨 림프종", group: "혈액암", focus: ["LDH", "HGB", "WBC"], note: "림프종 활성도와 골수 영향 징후를 함께 확인합니다.", keywords: ["NHL", "비호지킨"] },
  { code: "D57.1", name: "겸상적혈구병", group: "혈액질환", focus: ["HGB", "RBC", "LDH"], note: "용혈과 빈혈 맥락을 함께 보는 데 도움이 됩니다.", keywords: ["sickle cell", "겸상적혈구"] },
  { code: "D56.9", name: "지중해빈혈", group: "혈액질환", focus: ["HGB", "MCV", "RBC"], note: "소구성 빈혈 양상과 장기 추적이 중요합니다.", keywords: ["thalassemia", "지중해빈혈"] },
  { code: "D59.1", name: "자가면역용혈성빈혈", group: "혈액질환", focus: ["HGB", "LDH", "TBIL"], note: "용혈 신호와 빈혈 정도를 함께 추적합니다.", keywords: ["AIHA", "용혈성 빈혈"] },
  { code: "D70.9", name: "호중구감소증", group: "혈액질환", focus: ["WBC", "NEUT", "ANC"], note: "감염 취약성과 치료 영향 여부를 함께 확인하는 것이 중요합니다.", keywords: ["neutropenia", "호중구 감소"] },
  { code: "D72.8", name: "호산구증가증", group: "혈액질환", focus: ["WBC", "EOS", "CRP"], note: "알레르기, 약물 반응, 기저질환 맥락을 함께 봅니다.", keywords: ["eosinophilia", "호산구 증가"] },
  { code: "N18.5", name: "말기 신부전", group: "신장", focus: ["CREAT", "BUN", "K", "HGB"], note: "신기능 저하와 전해질, 빈혈을 함께 보는 것이 중요합니다.", keywords: ["ESRD", "말기 신부전", "투석"] },
  { code: "N04.9", name: "신증후군", group: "신장", focus: ["ALB", "CREAT", "BUN"], note: "저알부민혈증과 신기능 맥락을 함께 추적합니다.", keywords: ["nephrotic syndrome", "신증후군"] },
  { code: "K75.81", name: "비알코올성 지방간염", group: "간질환", focus: ["AST", "ALT", "GLU", "HBA1C"], note: "대사성 위험도와 간효소 상승을 함께 보는 것이 좋습니다.", keywords: ["NASH", "지방간염"] },
  { code: "K72.90", name: "간부전", group: "간질환", focus: ["AST", "ALT", "ALB", "TBIL"], note: "간 합성 기능과 손상 지표를 함께 추적합니다.", keywords: ["liver failure", "간부전"] },
  { code: "E78.5", name: "이상지질혈증", group: "대사", focus: ["GLU", "ALT", "CRP"], note: "대사 염증성과 지방간 위험을 함께 보기에 유용합니다.", keywords: ["dyslipidemia", "고지혈증", "지질이상"] },
  { code: "E66.9", name: "비만", group: "대사", focus: ["GLU", "ALT", "CRP", "HBA1C"], note: "대사성 염증과 지방간, 당대사 변화를 함께 추적합니다.", keywords: ["obesity", "비만"] },
  { code: "E06.3", name: "하시모토 갑상선염", group: "내분비", focus: ["HGB", "CRP", "GLU"], note: "피로와 염증, 빈혈 경향을 함께 보는 데 도움이 됩니다.", keywords: ["Hashimoto", "하시모토"] },
  { code: "M35.3", name: "쇼그렌증후군", group: "자가면역", focus: ["CRP", "WBC", "HGB"], note: "만성 염증과 혈구 변화를 함께 추적합니다.", keywords: ["Sjogren", "쇼그렌"] },
  { code: "M31.3", name: "다발혈관염을 동반한 육아종증", group: "자가면역", focus: ["CRP", "CREAT", "HGB"], note: "염증과 신장 침범 가능성을 함께 보는 것이 중요합니다.", keywords: ["GPA", "베게너", "혈관염"] },
  { code: "M34.9", name: "전신경화증", group: "자가면역", focus: ["CRP", "CREAT", "HGB"], note: "염증과 장기 침범 여부를 함께 추적합니다.", keywords: ["scleroderma", "전신경화증"] },
  { code: "K52.3", name: "미분류 염증성 장질환", group: "염증성 장질환", focus: ["CRP", "HGB", "PLT", "ALB"], note: "염증과 출혈, 영양 상태를 함께 보는 것이 좋습니다.", keywords: ["IBD", "염증성 장질환"] },
  { code: "U07.1", name: "코로나19", group: "감염", focus: ["WBC", "CRP", "LYM"], note: "염증 강도와 림프구 변화를 함께 보는 데 도움이 됩니다.", keywords: ["COVID", "코로나", "covid-19"] },
  { code: "J15.9", name: "세균성 폐렴", group: "감염", focus: ["WBC", "CRP", "NEUT"], note: "염증과 호중구 반응을 함께 추적합니다.", keywords: ["세균성 폐렴"] },
  { code: "I25.10", name: "관상동맥질환", group: "심혈관", focus: ["CRP", "GLU", "CREAT"], note: "염증과 대사 위험, 신장 기능을 함께 보는 편이 좋습니다.", keywords: ["coronary artery disease", "협심증", "관상동맥"] },
  { code: "I48.91", name: "심방세동", group: "심혈관", focus: ["HGB", "CREAT", "K"], note: "빈혈, 신기능, 전해질 변화가 증상과 연결되는지 확인합니다.", keywords: ["atrial fibrillation", "AF", "심방세동"] },
  { code: "C34.90", name: "폐암", group: "고형암", focus: ["CRP", "HGB", "WBC"], note: "염증과 빈혈, 치료 관련 골수 영향 여부를 함께 추적합니다.", keywords: ["lung cancer", "폐암"] },
  { code: "C50.90", name: "유방암", group: "고형암", focus: ["HGB", "WBC", "PLT"], note: "항암치료에 따른 골수 억제 패턴을 함께 기록하면 유용합니다.", keywords: ["breast cancer", "유방암"] },
  { code: "C18.90", name: "대장암", group: "고형암", focus: ["HGB", "CRP", "PLT"], note: "출혈성 빈혈과 염증 반응을 함께 보는 데 도움이 됩니다.", keywords: ["colon cancer", "대장암"] },
  { code: "C61", name: "전립선암", group: "고형암", focus: ["HGB", "ALP", "CRP"], note: "빈혈과 뼈 전이 맥락에서 ALP 변화를 함께 추적합니다.", keywords: ["prostate cancer", "전립선암"] }
];

export const diseasePlaybooks = {
  default: {
    summary: "혈액검사 수치를 단독으로 보지 말고 증상, 치료 일정, 최근 감염/수혈/입원 여부와 함께 읽는 것이 중요합니다.",
    symptomWatch: ["발열", "출혈", "피로감", "호흡곤란"],
    questions: ["이 수치 변화가 현재 증상과 연결되는지", "추가 검사나 재검 간격을 당겨야 하는지"],
    carePoints: ["최근 치료 일정과 함께 비교", "이전 검사와 방향성 확인", "증상 변화와 함께 기록"]
  },
  groups: {
    "혈액암": {
      summary: "골수 억제, 감염 취약성, 출혈 위험, 치료 반응을 동시에 보는 접근이 중요합니다.",
      symptomWatch: ["38도 이상 발열", "멍/출혈", "심한 피로", "구내염"],
      questions: ["현재 수치가 치료 반응인지 부작용인지", "수혈/성장인자/항생제 판단에 참고되는지"],
      carePoints: ["WBC-ANC-CRP 동시 확인", "HGB와 PLT를 함께 보기", "치료 주기 직전/직후 패턴 비교"]
    },
    "혈액질환": {
      summary: "혈구 감소 또는 용혈/철대사 신호를 장기 추세로 보는 것이 핵심입니다.",
      symptomWatch: ["어지러움", "심계항진", "창백함", "출혈"],
      questions: ["현재 빈혈/혈구감소 원인이 무엇인지", "영양/약물/자가면역 영향이 있는지"],
      carePoints: ["HGB, RBC, MCV, FERRITIN 연결", "반복 측정으로 회복 속도 확인"]
    },
    "감염": {
      summary: "염증 강도와 면역반응, 장기 기능 변화를 함께 추적하는 것이 좋습니다.",
      symptomWatch: ["고열", "오한", "호흡곤란", "의식저하"],
      questions: ["염증 수치가 호전 중인지", "추가 배양/영상/재검이 필요한지"],
      carePoints: ["WBC-CRP 추세 비교", "신장 기능과 전해질 동반 확인"]
    },
    "염증성 장질환": {
      summary: "염증 활성도와 출혈·영양 상태를 함께 보는 접근이 중요합니다.",
      symptomWatch: ["복통", "혈변", "설사 악화", "체중감소"],
      questions: ["염증 활성도가 올라간 상태인지", "철 결핍이나 저알부민이 동반되는지"],
      carePoints: ["CRP-HGB-ALB 연결", "장 증상 악화 시기와 비교"]
    },
    "신장": {
      summary: "신장 기능 저하와 동반 빈혈, 전해질 변화를 한 세트로 읽는 편이 좋습니다.",
      symptomWatch: ["부종", "소변량 감소", "무기력", "호흡곤란"],
      questions: ["현재 변화가 탈수인지 신기능 저하인지", "재검 또는 투석/약 조정과 연결되는지"],
      carePoints: ["CREAT-BUN-K-NA 묶어서 보기", "혈압/체중 변화도 같이 기록"]
    },
    "간질환": {
      summary: "간 손상 수치와 합성 기능, 염증 또는 담즙 정체 신호를 함께 봐야 합니다.",
      symptomWatch: ["황달", "복부팽만", "식욕저하", "피로"],
      questions: ["약물/음주/기저질환 영향이 있는지", "추가 간기능 패널이 필요한지"],
      carePoints: ["AST-ALT-ALB-TBIL 연결", "체중과 복수/부종 여부 같이 기록"]
    },
    "대사": {
      summary: "혈당, 간효소, 염증성 지표를 생활습관과 연결해 보는 접근이 유용합니다.",
      symptomWatch: ["갈증", "체중변화", "다뇨", "심한 피로"],
      questions: ["식사/운동/약물 조정이 필요한지", "장기 추세를 위해 어떤 항목을 같이 볼지"],
      carePoints: ["GLU-HBA1C-ALT 연결", "공복 여부를 함께 기록"]
    },
    "자가면역": {
      summary: "염증 활성도와 혈구 변화, 장기 침범 가능성을 같이 추적하는 것이 중요합니다.",
      symptomWatch: ["관절통", "발진", "발열", "부종"],
      questions: ["현재 활성도 상승 신호인지", "면역억제제/스테로이드 영향이 있는지"],
      carePoints: ["CRP와 혈구계 수치 함께 보기", "증상 일지와 묶어서 기록"]
    },
    "고형암": {
      summary: "암 자체의 염증 신호와 항암치료에 따른 골수 영향, 영양 상태를 같이 살핍니다.",
      symptomWatch: ["체중감소", "심한 피로", "발열", "출혈"],
      questions: ["치료 부작용인지 병세 변화인지", "추가 영상/종양표지자와 연결해 봐야 하는지"],
      carePoints: ["HGB-WBC-PLT와 염증 수치 연결", "항암 주기별 패턴 비교"]
    },
    "심혈관": {
      summary: "대사 위험도, 신장 기능, 빈혈·전해질 변화를 함께 보는 것이 증상 해석에 도움이 됩니다.",
      symptomWatch: ["흉통", "호흡곤란", "부종", "심계항진"],
      questions: ["현재 변화가 심혈관 증상과 연결되는지", "신장 기능이나 전해질 교정이 필요한지"],
      carePoints: ["CREAT-K-HGB를 함께 보기", "혈압과 체중 변화를 같이 기록"]
    }
  },
  codes: {
    "C92.00": {
      summary: "AML에서는 감염 위험, 골수 억제, 치료 직후 nadir 패턴을 특히 민감하게 봅니다.",
      questions: ["현재 수치가 항암 후 expected nadir인지", "수혈/성장인자/입원 판단과 연결되는지"],
      carePoints: ["ANC와 PLT를 별도로 체크", "발열 여부를 반드시 같이 기록"]
    },
    "C91.00": {
      summary: "ALL에서는 백혈구 변화뿐 아니라 치료 단계에 따른 혈구 감소 패턴을 같이 읽습니다.",
      questions: ["유지요법/유도요법 단계와 수치가 맞는 흐름인지", "감염 예방 조치가 필요한지"],
      carePoints: ["WBC-HGB-PLT 동시 비교", "스테로이드 사용 시 혈당도 함께 확인"]
    },
    "N18.5": {
      summary: "말기 신부전은 신기능 수치와 전해질, 빈혈이 함께 움직이는지 보는 것이 핵심입니다.",
      questions: ["투석 일정과 현재 수치가 어떻게 연결되는지", "칼륨/빈혈 관리 조정이 필요한지"],
      carePoints: ["K, CREAT, BUN, HGB를 한 화면에서 비교", "투석 전후 수치 구분 기록"]
    },
    "U07.1": {
      summary: "코로나19는 염증과 림프구 변화, 증상 악화 신호를 함께 보는 것이 좋습니다.",
      questions: ["현재 염증 반응이 호전 추세인지", "호흡기 증상과 연결해 추가 평가가 필요한지"],
      carePoints: ["CRP와 LYM 추세 함께 보기", "산소포화도/발열과 함께 기록"]
    },
    "D46.9": {
      summary: "골수형성이상증후군은 여러 혈구계가 함께 흔들리는지 장기적으로 추적하는 것이 중요합니다.",
      questions: ["현재 변화가 병의 경과인지 치료 영향인지", "수혈이나 감염 예방 전략과 연결되는지"],
      carePoints: ["WBC-HGB-PLT 삼중 추세 보기", "최근 수혈/감염 여부 같이 기록"]
    },
    "C90.00": {
      summary: "다발골수종은 빈혈, 신장 기능, 염증 반응이 함께 움직이는지 보는 접근이 유용합니다.",
      questions: ["현재 빈혈과 신기능 변화가 치료 반응과 어떤 관계인지", "추가 단백/신장 관련 검사 필요 여부"],
      carePoints: ["HGB-CREAT-CRP 연결", "통증/탈수/감염 증상과 함께 기록"]
    },
    "M32.9": {
      summary: "루푸스는 염증과 혈구 감소, 장기 침범 가능성을 동시에 추적하는 것이 중요합니다.",
      questions: ["현재 염증 활성도 상승인지", "약물 영향과 질환 활성도를 어떻게 구분할지"],
      carePoints: ["CRP-WBC-HGB-PLT 같이 보기", "관절통/발진/부종과 연결"]
    },
    "K74.60": {
      summary: "간경변증은 간 손상뿐 아니라 합성 기능 저하와 혈소판 감소를 함께 읽어야 합니다.",
      questions: ["현재 수치 변화가 간기능 저하와 어떤 관련이 있는지", "추가 간 기능 추적이 필요한지"],
      carePoints: ["AST-ALT-ALB-PLT 연결", "복수/황달/출혈 경향과 함께 기록"]
    },
    "E11.9": {
      summary: "제2형 당뇨병은 현재 혈당뿐 아니라 장기 추세와 간대사/염증 신호를 같이 보는 것이 좋습니다.",
      questions: ["식사/운동/약물 조정이 필요한 단계인지", "당화혈색소나 추가 대사 검사와 연결해 볼지"],
      carePoints: ["GLU-HBA1C-ALT-CRP 연결", "공복 여부를 꼭 같이 남기기"]
    },
    "C34.90": {
      summary: "폐암은 염증 신호와 치료 관련 골수 억제, 체력 저하를 함께 보는 해석이 중요합니다.",
      questions: ["현재 변화가 치료 부작용인지 병세와 관련된 것인지", "다음 치료 일정 전 추가 확인이 필요한지"],
      carePoints: ["CRP-HGB-WBC 같이 보기", "발열/기침/호흡곤란과 연결"]
    },
    "C91.10": {
      summary: "CLL은 림프구 증가, 빈혈, 혈소판 감소를 장기 추세로 읽는 것이 중요합니다.",
      questions: ["현재 변화가 치료 개입이 필요한 흐름인지", "감염 취약성과 연결되는지"],
      carePoints: ["WBC-HGB-PLT 장기 추세 비교", "감염 증상 동반 여부 기록"]
    },
    "D50.9": {
      summary: "철결핍성 빈혈은 혈색소 저하만이 아니라 Ferritin과 적혈구 지표를 함께 보는 편이 좋습니다.",
      questions: ["철 저장이 얼마나 떨어진 상태인지", "출혈 또는 흡수장애를 같이 평가해야 하는지"],
      carePoints: ["HGB-RBC-MCV-FERRITIN 연결", "어지럼/피로/월경량 변화 기록"]
    },
    "D69.3": {
      summary: "ITP는 혈소판 수치 자체와 출혈 증상, 치료 반응의 연결을 같이 보는 해석이 중요합니다.",
      questions: ["현재 수치가 치료 조정이 필요한 단계인지", "멍·잇몸출혈과 수치 변화가 연결되는지"],
      carePoints: ["PLT 변화 폭 기록", "출혈 증상 여부 같이 남기기"]
    },
    "N18.9": {
      summary: "CKD는 신장 기능 저하와 빈혈, 전해질 흔들림을 장기적으로 같이 보는 접근이 유용합니다.",
      questions: ["현재 변화가 탈수/약물 영향인지, 실제 신기능 변화인지", "빈혈 관리가 필요한 단계인지"],
      carePoints: ["CREAT-BUN-HGB-K 같이 보기", "혈압/체중/부종 기록"]
    },
    "B18.1": {
      summary: "만성 B형간염은 간수치 상승의 폭보다 추세와 증상, 약물/생활 맥락을 함께 읽는 편이 좋습니다.",
      questions: ["현재 AST/ALT 변화가 활동성 상승을 시사하는지", "추가 간 패널 확인이 필요한지"],
      carePoints: ["AST-ALT-TBIL-ALB 연결", "피로/식욕저하/황달과 같이 기록"]
    },
    "K50.90": {
      summary: "크론병은 염증 활성도와 출혈/영양 상태를 같이 추적하는 방식이 더 임상적입니다.",
      questions: ["현재 염증 활성도가 올라간 상태인지", "철 결핍 또는 저알부민이 동반되는지"],
      carePoints: ["CRP-HGB-FERRITIN-ALB 연결", "복통/설사/혈변 변화 기록"]
    },
    "U07.1": {
      summary: "코로나19는 염증 수치, 림프구 감소, 임상 증상 진행 속도를 같이 보는 접근이 유용합니다.",
      questions: ["현재 반응이 회복 국면인지 악화 신호인지", "호흡기 증상과 연결해 추가 평가가 필요한지"],
      carePoints: ["CRP-WBC-LYM 동시 확인", "발열/기침/산소포화도 같이 기록"]
    }
  }
};

export const diseaseExpertGuides = {
  groups: {
    "혈액암": {
      angle: "골수 억제, 감염 취약성, 수혈/성장인자 필요성, 치료 주기(nadir)와의 연결을 우선 판단합니다.",
      checkpoints: ["발열 여부", "ANC와 CRP 동시 변화", "혈소판 저하에 따른 출혈 징후", "최근 항암/표적치료 일정"],
      caution: "혈액암에서는 숫자 하나보다 여러 혈구계와 치료 시점을 함께 읽어야 해석 오차를 줄일 수 있습니다."
    },
    "혈액질환": {
      angle: "빈혈 유형, 혈구 감소 패턴, 철대사/용혈 신호를 장기 추세 중심으로 보는 접근이 핵심입니다.",
      checkpoints: ["HGB-RBC-MCV 연결", "Ferritin/LDH/TBIL 동반 변화", "출혈·영양·자가면역 맥락", "수혈 여부"],
      caution: "혈액질환은 단일 시점보다 이전 결과와의 방향성을 함께 봐야 실제 상태에 더 가깝습니다."
    },
    "신장": {
      angle: "Creatinine, BUN, Na, K와 같은 신장/전해질 축을 한 묶음으로 읽고, 체액 상태와 약물 영향을 함께 봅니다.",
      checkpoints: ["탈수/부종", "이뇨제/신독성 약물", "투석 여부", "빈혈 동반 여부"],
      caution: "신장 관련 수치는 당일 수분 상태나 입원 치료 내용에 따라 크게 흔들릴 수 있습니다."
    },
    "간질환": {
      angle: "AST/ALT 같은 손상 수치와 Albumin/TBIL 같은 합성·담즙 정체 신호를 같이 해석합니다.",
      checkpoints: ["황달/복수", "음주/약물", "영양 상태", "혈소판 감소 동반 여부"],
      caution: "간질환은 간효소만 보지 말고 합성 기능과 임상 증상까지 함께 보는 편이 안전합니다."
    },
    "대사": {
      angle: "혈당과 장기 대사 조절 상태를 생활 패턴, 스테로이드·치료 영향과 함께 읽는 것이 중요합니다.",
      checkpoints: ["공복/비공복 여부", "최근 식사", "운동/체중 변화", "약물 조정 필요성"],
      caution: "혈당 수치는 검사 전 식사, 스트레스, 약물에 영향을 많이 받아 단정적으로 해석하면 오차가 큽니다."
    },
    "자가면역": {
      angle: "염증 활성도와 혈구 변화, 장기 침범 가능성을 함께 추적하는 식으로 읽습니다.",
      checkpoints: ["발진/관절통/부종", "면역억제제 사용", "신장 기능 변화", "빈혈·혈소판 변화"],
      caution: "자가면역 질환은 검사 수치가 증상 강도와 항상 일치하지 않을 수 있어 임상 증상 기록이 중요합니다."
    },
    "감염": {
      angle: "염증 강도, 호중구 반응, 장기 기능 흔들림을 동시에 확인하는 것이 기본입니다.",
      checkpoints: ["발열/호흡곤란", "항생제 사용", "수액/입원 여부", "WBC-CRP-ANC 추세"],
      caution: "감염 해석은 증상 진행 속도와 치료 반응을 함께 봐야 실제 위험도에 더 가깝습니다."
    },
    "고형암": {
      angle: "암 자체의 염증 신호와 치료에 따른 골수 억제, 영양 저하를 함께 읽는 방식이 적절합니다.",
      checkpoints: ["항암 주기", "체중 감소", "발열", "WBC-HGB-PLT 변화"],
      caution: "고형암 치료 중 검사수치는 치료 부작용과 질환 진행이 섞여 보일 수 있어 단일 수치로 판단하면 오차가 생깁니다."
    }
  },
  codes: {
    "C92.00": {
      angle: "AML에서는 nadir 구간인지, 회복 국면인지, 감염 신호가 겹치는지 구분해서 읽는 것이 핵심입니다.",
      checkpoints: ["ANC 회복 속도", "PLT 저하 폭", "발열 동반 여부", "최근 항암 시작일"],
      caution: "AML은 치료 시점에 따라 같은 수치라도 의미가 달라질 수 있습니다."
    },
    "C90.00": {
      angle: "다발골수종에서는 빈혈과 신장 기능, 염증/종양 활성 신호를 한 세트로 보는 편이 유용합니다.",
      checkpoints: ["HGB 저하", "Creatinine 상승", "통증/탈수", "감염 여부"],
      caution: "골수종은 체액 상태와 신장 기능에 따라 수치 해석이 크게 달라질 수 있습니다."
    },
    "N18.5": {
      angle: "말기 신부전에서는 투석 전후 시점과 전해질 변화를 같이 보지 않으면 해석 오차가 커질 수 있습니다.",
      checkpoints: ["투석 전/후 여부", "K 상승", "빈혈 관리", "체중/부종"],
      caution: "같은 Creatinine 수치라도 투석 일정과 임상 상태에 따라 의미가 달라질 수 있습니다."
    },
    "K74.60": {
      angle: "간경변에서는 손상 수치보다 합성 기능 저하와 혈소판 감소, 황달 징후를 같이 보는 것이 더 중요할 수 있습니다.",
      checkpoints: ["Albumin 저하", "TBIL 상승", "PLT 감소", "복수/황달"],
      caution: "간경변은 AST/ALT가 심하지 않아도 실제 임상 상태가 나쁠 수 있습니다."
    },
    "E11.9": {
      angle: "제2형 당뇨는 공복혈당과 장기 조절 상태(HbA1c), 지방간/염증 신호를 같이 보면 더 정확합니다.",
      checkpoints: ["공복 여부", "최근 식사", "HbA1c", "ALT/체중 변화"],
      caution: "당일 혈당 하나만으로 장기 조절 상태를 단정하기 어렵습니다."
    },
    "M32.9": {
      angle: "루푸스는 염증 수치뿐 아니라 혈구 감소와 신장 침범 가능성을 같이 추적하는 접근이 중요합니다.",
      checkpoints: ["WBC/HGB/PLT 변화", "Creatinine", "부종/발진", "면역억제제 변화"],
      caution: "루푸스는 증상과 검사수치가 완전히 같은 방향으로 움직이지 않을 수 있습니다."
    },
    "C91.10": {
      angle: "CLL은 림프구 증가 자체보다 빈혈, 혈소판 변화, 감염 취약성까지 함께 보는 해석이 실제 진료에 가깝습니다.",
      checkpoints: ["WBC 절대치", "HGB/PLT 저하", "감염 증상", "최근 치료 여부"],
      caution: "CLL은 수치가 천천히 변해도 임상적 의미가 있을 수 있어 장기 추세가 중요합니다."
    },
    "D50.9": {
      angle: "철결핍성 빈혈은 HGB만이 아니라 MCV, RBC, Ferritin을 같이 봐야 원인 해석 오차를 줄일 수 있습니다.",
      checkpoints: ["Ferritin 저하", "MCV 감소", "출혈 의심", "피로/어지럼"],
      caution: "철결핍은 염증 동반 시 Ferritin 해석이 달라질 수 있습니다."
    },
    "D69.3": {
      angle: "ITP는 혈소판 수치 그 자체와 실제 출혈 증상이 얼마나 연결되는지 함께 보는 것이 임상적으로 중요합니다.",
      checkpoints: ["PLT 절대치", "멍/코피/잇몸출혈", "스테로이드/면역치료 반응", "감염 동반 여부"],
      caution: "혈소판 수치만으로 실제 출혈 위험을 완전히 설명하지 못할 수 있습니다."
    },
    "N18.9": {
      angle: "CKD는 Creatinine/BUN과 전해질, 빈혈을 묶어서 보고 체액 상태를 함께 읽는 것이 적절합니다.",
      checkpoints: ["Creatinine 추세", "K/Na 변화", "HGB 저하", "부종/탈수"],
      caution: "신장 관련 수치는 탈수나 수액, 약물 조정에 따라 단기간에도 흔들릴 수 있습니다."
    },
    "B18.1": {
      angle: "만성 B형간염은 AST/ALT 상승 폭보다 추세, 증상, 약물·생활 요인을 함께 보는 편이 현실적입니다.",
      checkpoints: ["AST/ALT", "TBIL/ALB", "피로/식욕", "최근 약물/음주"],
      caution: "간효소가 심하지 않아도 임상 증상이나 다른 간기능 지표가 더 중요할 수 있습니다."
    },
    "K50.90": {
      angle: "크론병은 염증 활성도와 출혈/영양 저하가 같이 움직이는지 보는 접근이 적절합니다.",
      checkpoints: ["CRP 상승", "HGB/Ferritin 감소", "Albumin 저하", "복통/설사/혈변"],
      caution: "장 증상 악화가 검사수치보다 먼저 드러나는 경우도 많습니다."
    },
    "U07.1": {
      angle: "코로나19는 염증 강도와 림프구 감소, 증상 진행 속도를 함께 묶어서 보는 편이 해석에 유리합니다.",
      checkpoints: ["CRP", "LYM", "발열", "호흡기 증상"],
      caution: "검사수치보다 임상 증상 변화가 더 중요해지는 구간이 있을 수 있습니다."
    }
  }
};

export const metricDefinitions = [
  {
    code: "WBC",
    name: "백혈구",
    unit: "x10^3/uL",
    range: { low: 4.0, high: 10.0 },
    meaning: "감염, 염증, 면역 상태를 해석할 때 자주 보는 기본 혈액수치입니다.",
    highText: "높으면 염증이나 감염 반응, 일부 혈액질환 맥락을 함께 살펴봐야 합니다.",
    lowText: "낮으면 면역 방어력이 약해졌는지, 치료 영향이 있는지 확인이 필요할 수 있습니다.",
    generalTip: "급격한 변화가 있으면 최근 감염, 투약, 치료 일정과 함께 의료진에게 보여주는 것이 좋습니다."
  },
  {
    code: "RBC",
    name: "적혈구",
    unit: "x10^6/uL",
    range: { low: 3.8, high: 5.2 },
    meaning: "혈색소와 함께 빈혈과 골수 기능 상태를 보는 데 참고합니다.",
    highText: "높으면 탈수나 농축 상태를 포함해 전체 맥락을 같이 봐야 합니다.",
    lowText: "낮으면 빈혈, 출혈, 치료 영향, 영양 상태 등을 함께 확인합니다.",
    generalTip: "혈색소와 같이 해석하는 것이 더 정확합니다."
  },
  {
    code: "HGB",
    name: "혈색소",
    unit: "g/dL",
    range: { low: 12.0, high: 16.0 },
    meaning: "산소를 운반하는 핵심 지표로 피로감, 어지러움, 빈혈 해석에 중요합니다.",
    highText: "높으면 탈수나 농축 상태를 포함해 전체 맥락을 같이 봐야 합니다.",
    lowText: "낮으면 빈혈 가능성, 출혈, 치료 영향, 영양 상태 등을 폭넓게 확인합니다.",
    generalTip: "피로감이 반복되면 철분, 출혈 여부, 질환 경과를 함께 점검하는 것이 좋습니다."
  },
  {
    code: "PLT",
    name: "혈소판",
    unit: "x10^3/uL",
    range: { low: 150, high: 400 },
    meaning: "출혈과 응고 균형을 볼 때 핵심이 되는 수치입니다.",
    highText: "높으면 염증성 반응이나 회복 과정, 드물게 혈액질환 맥락을 같이 해석합니다.",
    lowText: "낮으면 멍, 출혈 경향, 치료 영향과의 관련성을 확인해야 할 수 있습니다.",
    generalTip: "수치가 크게 낮을 때는 멍, 잇몸 출혈, 코피 등의 증상을 기록해두면 도움이 됩니다."
  },
  {
    code: "CRP",
    name: "CRP",
    unit: "mg/L",
    range: { low: 0, high: 5.0 },
    meaning: "몸 안의 염증 반응을 반영하는 대표적인 지표입니다.",
    highText: "높으면 감염, 염증, 조직 손상 가능성을 다른 증상과 함께 살펴야 합니다.",
    lowText: "정상 또는 낮은 편이면 뚜렷한 전신 염증 신호가 강하지 않을 수 있습니다.",
    generalTip: "최근 감기, 통증, 수술, 염증성 질환 악화 여부를 함께 기록하면 해석에 유리합니다."
  },
  {
    code: "AST",
    name: "AST",
    unit: "U/L",
    range: { low: 10, high: 40 },
    meaning: "간과 근육 등 여러 조직 손상 시 참고하는 효소입니다.",
    highText: "높으면 간세포 손상, 약물 영향, 근육 손상 등 다양한 가능성을 함께 봅니다.",
    lowText: "낮다고 해서 큰 의미가 없는 경우가 많으며 전체 패널과 같이 해석합니다.",
    generalTip: "음주, 운동, 복용약, 간질환 여부가 해석에 영향을 줄 수 있습니다."
  },
  {
    code: "ALT",
    name: "ALT",
    unit: "U/L",
    range: { low: 7, high: 56 },
    meaning: "간 기능과 관련해서 AST와 함께 자주 확인하는 수치입니다.",
    highText: "높으면 간세포 손상 가능성을 생각하며 약물, 지방간, 간염 맥락을 같이 확인합니다.",
    lowText: "낮은 값 자체보다는 전체 간기능 패널 흐름이 더 중요합니다.",
    generalTip: "체중 변화, 음주, 복용약, 피로감과 함께 해석하면 좋습니다."
  },
  {
    code: "BUN",
    name: "BUN",
    unit: "mg/dL",
    range: { low: 7, high: 20 },
    meaning: "신장 기능과 탈수 상태를 볼 때 함께 참고하는 수치입니다.",
    highText: "높으면 탈수, 신장 기능 저하, 단백 대사 증가 맥락을 살펴봅니다.",
    lowText: "낮으면 영양 상태나 간 기능 맥락을 함께 확인하는 경우가 있습니다.",
    generalTip: "크레아티닌과 함께 추세를 보는 편이 더 유용합니다."
  },
  {
    code: "CREAT",
    name: "크레아티닌",
    unit: "mg/dL",
    range: { low: 0.5, high: 1.2 },
    meaning: "신장 기능을 볼 때 중요한 기본 수치입니다.",
    highText: "높으면 신장 기능 저하 가능성을 포함해 탈수, 약물 영향, 기저질환을 함께 봅니다.",
    lowText: "낮으면 근육량이 적은 경우처럼 개인차가 반영될 수 있습니다.",
    generalTip: "수분 섭취, 복용약, 기존 신장질환 여부가 해석에 중요합니다."
  },
  {
    code: "GLU",
    name: "포도당",
    unit: "mg/dL",
    range: { low: 70, high: 99 },
    meaning: "공복 혈당 상태를 빠르게 확인하는 지표입니다.",
    highText: "높으면 혈당 조절 상태를 더 자세히 확인해볼 필요가 있습니다.",
    lowText: "낮으면 식사 간격, 저혈당 증상, 복용약 여부를 함께 보아야 합니다.",
    generalTip: "공복 여부와 최근 식사 시간을 꼭 같이 기록해야 의미가 분명해집니다."
  },
  {
    code: "FERRITIN",
    name: "페리틴",
    unit: "ng/mL",
    range: { low: 15, high: 150 },
    meaning: "체내 철 저장 상태를 보는 데 중요한 지표입니다.",
    highText: "높으면 염증 반응이나 철 과부하 가능성을 전체 맥락과 함께 확인합니다.",
    lowText: "낮으면 철결핍 가능성을 생각해볼 수 있습니다.",
    generalTip: "혈색소, 적혈구와 같이 보면 해석이 더 쉬워집니다."
  },
  {
    code: "HCT",
    name: "헤마토크릿",
    unit: "%",
    range: { low: 36, high: 48 },
    meaning: "적혈구가 혈액에서 차지하는 비율로, 빈혈과 탈수 맥락에서 참고합니다.",
    highText: "높으면 탈수나 혈액 농축 상태를 함께 봅니다.",
    lowText: "낮으면 빈혈 가능성과 출혈·영양 상태를 함께 확인합니다.",
    generalTip: "혈색소, 적혈구와 함께 보면 해석이 더 좋아집니다."
  },
  {
    code: "MCV",
    name: "MCV",
    unit: "fL",
    range: { low: 80, high: 100 },
    meaning: "적혈구 크기를 보는 지표로 빈혈 유형 해석에 자주 쓰입니다.",
    highText: "높으면 거대적혈구성 빈혈, 간질환, 약물 영향 등을 함께 봅니다.",
    lowText: "낮으면 철결핍성 빈혈 같은 맥락을 의심할 수 있습니다.",
    generalTip: "혈색소와 페리틴을 함께 보면 더 도움이 됩니다."
  },
  {
    code: "MCH",
    name: "MCH",
    unit: "pg",
    range: { low: 27, high: 34 },
    meaning: "적혈구 1개가 담고 있는 혈색소 양을 보는 지표입니다.",
    highText: "높으면 다른 적혈구 지표와 함께 큰 적혈구 패턴인지 확인합니다.",
    lowText: "낮으면 저색소성 빈혈 맥락을 함께 봅니다.",
    generalTip: "MCV, MCHC와 같이 해석하는 편이 좋습니다."
  },
  {
    code: "MCHC",
    name: "MCHC",
    unit: "g/dL",
    range: { low: 32, high: 36 },
    meaning: "적혈구 안의 혈색소 농도를 나타냅니다.",
    highText: "높은 값은 검사 조건과 전체 적혈구 지표를 함께 보는 것이 좋습니다.",
    lowText: "낮으면 저색소성 빈혈 맥락을 확인합니다.",
    generalTip: "빈혈 해석 보조 지표로 자주 함께 봅니다."
  },
  {
    code: "RDW",
    name: "RDW",
    unit: "%",
    range: { low: 11.5, high: 14.5 },
    meaning: "적혈구 크기 분포를 보는 지표입니다.",
    highText: "높으면 철결핍성 빈혈이나 회복기 변화 등을 같이 봅니다.",
    lowText: "낮은 값 자체는 임상 의미가 크지 않을 때가 많습니다.",
    generalTip: "MCV와 같이 보면 빈혈 유형 해석에 유리합니다."
  },
  {
    code: "NEUT",
    name: "호중구",
    unit: "%",
    range: { low: 40, high: 74 },
    meaning: "세균 감염과 면역 반응 해석에 자주 등장합니다.",
    highText: "높으면 감염, 염증, 스트레스 반응 맥락을 함께 봅니다.",
    lowText: "낮으면 면역 저하와 치료 영향 여부를 확인합니다.",
    generalTip: "절대호중구수와 같이 보면 더 정확합니다."
  },
  {
    code: "LYM",
    name: "림프구",
    unit: "%",
    range: { low: 19, high: 48 },
    meaning: "바이러스 감염과 면역 상태 해석에 참고합니다.",
    highText: "높으면 바이러스성 반응이나 림프계 질환 맥락을 함께 봅니다.",
    lowText: "낮으면 면역 억제 상태나 치료 영향이 있는지 확인합니다.",
    generalTip: "전체 백혈구와 함께 해석하는 것이 좋습니다."
  },
  {
    code: "ANC",
    name: "절대호중구수",
    unit: "x10^3/uL",
    range: { low: 1.5, high: 7.5 },
    meaning: "감염 방어 능력 판단에 중요한 핵심 지표가 될 수 있습니다.",
    highText: "높으면 염증이나 감염 반응 가능성을 전체 혈구와 함께 봅니다.",
    lowText: "낮으면 감염 취약성이 커질 수 있어 특히 주의 깊게 봅니다.",
    generalTip: "치료 중이면 일정과 함께 의료진에게 바로 보여주는 편이 좋습니다."
  },
  {
    code: "ALP",
    name: "ALP",
    unit: "U/L",
    range: { low: 44, high: 147 },
    meaning: "간담도계와 뼈 대사 해석에 참고하는 효소입니다.",
    highText: "높으면 담도계 문제나 뼈 대사 변화 맥락을 함께 봅니다.",
    lowText: "낮은 값 자체보다는 전체 맥락이 더 중요합니다.",
    generalTip: "AST, ALT, 빌리루빈과 함께 보는 편이 좋습니다."
  },
  {
    code: "TBIL",
    name: "총빌리루빈",
    unit: "mg/dL",
    range: { low: 0.2, high: 1.2 },
    meaning: "황달과 간기능, 적혈구 파괴 맥락 해석에 참고합니다.",
    highText: "높으면 간기능이나 담즙 흐름, 용혈 가능성을 같이 봅니다.",
    lowText: "낮은 값은 임상적으로 큰 의미가 없는 경우가 많습니다.",
    generalTip: "간수치와 함께 추세를 보세요."
  },
  {
    code: "ALB",
    name: "알부민",
    unit: "g/dL",
    range: { low: 3.5, high: 5.2 },
    meaning: "영양 상태와 간기능, 만성 질환 상태를 볼 때 참고합니다.",
    highText: "높으면 탈수 가능성을 먼저 생각해볼 수 있습니다.",
    lowText: "낮으면 영양 저하, 간기능, 신장 손실 등을 같이 봅니다.",
    generalTip: "총단백, 간기능, 부종 여부와 함께 해석하면 좋습니다."
  },
  {
    code: "NA",
    name: "나트륨",
    unit: "mmol/L",
    range: { low: 135, high: 145 },
    meaning: "체액 균형과 신경학적 증상 해석에 중요한 전해질입니다.",
    highText: "높으면 탈수 가능성과 체액 부족을 함께 확인합니다.",
    lowText: "낮으면 수분 불균형과 약물, 질환 맥락을 같이 봅니다.",
    generalTip: "어지러움, 혼동, 부종 여부를 같이 기록하면 좋습니다."
  },
  {
    code: "K",
    name: "칼륨",
    unit: "mmol/L",
    range: { low: 3.5, high: 5.1 },
    meaning: "심장과 근육 기능에 중요한 전해질입니다.",
    highText: "높으면 신장 기능, 약물, 검사 조건을 함께 확인해야 합니다.",
    lowText: "낮으면 부정맥, 근력 저하 위험을 고려해 주의가 필요할 수 있습니다.",
    generalTip: "심장질환이나 신장질환이 있으면 특히 함께 보여주세요."
  },
  {
    code: "LDH",
    name: "LDH",
    unit: "U/L",
    range: { low: 140, high: 280 },
    meaning: "세포 손상과 혈액질환 맥락에서 보조적으로 참고합니다.",
    highText: "높으면 조직 손상이나 혈액질환 활동성 맥락을 함께 봅니다.",
    lowText: "낮은 값 자체는 의미가 적을 수 있습니다.",
    generalTip: "질환 맥락과 다른 염증 지표를 함께 보세요."
  },
  {
    code: "ESR",
    name: "적혈구침강속도",
    unit: "mm/hr",
    range: { low: 0, high: 20 },
    meaning: "만성 염증성 질환과 자가면역 질환 해석에 참고합니다.",
    highText: "높으면 염증성 질환 활동성을 다른 증상과 함께 봅니다.",
    lowText: "낮은 값은 보통 큰 의미가 적습니다.",
    generalTip: "CRP와 함께 보는 편이 좋습니다."
  },
  {
    code: "HBA1C",
    name: "당화혈색소",
    unit: "%",
    range: { low: 4.0, high: 5.6 },
    meaning: "최근 수개월 평균 혈당 흐름을 보는 대표 지표입니다.",
    highText: "높으면 장기 혈당 조절 상태를 재점검할 필요가 있습니다.",
    lowText: "낮으면 저혈당 위험과 검사 맥락을 함께 봅니다.",
    generalTip: "공복 혈당과 같이 보면 해석이 쉬워집니다."
  },
  {
    code: "MONO",
    name: "단핵구",
    unit: "%",
    range: { low: 2, high: 10 },
    meaning: "회복기 감염, 만성 염증, 면역 반응 맥락에서 참고하는 백혈구 분획입니다.",
    highText: "높으면 감염 회복기나 염증성 질환, 혈액질환 맥락을 같이 봅니다.",
    lowText: "낮은 값 자체만으로 큰 의미가 없을 수도 있어 다른 백혈구 분획과 함께 봅니다.",
    generalTip: "호중구와 림프구 분획, 전체 백혈구 수치와 함께 보는 편이 좋습니다."
  },
  {
    code: "EOS",
    name: "호산구",
    unit: "%",
    range: { low: 0, high: 6 },
    meaning: "알레르기, 약물 반응, 기생충 감염 등과 연결될 수 있는 백혈구 분획입니다.",
    highText: "높으면 알레르기나 약물 반응, 호산구 증가증 맥락을 함께 봅니다.",
    lowText: "낮은 값 자체는 임상 의미가 크지 않은 경우가 많습니다.",
    generalTip: "피부 증상, 천식, 복용약 변화와 함께 기록하면 해석에 도움이 됩니다."
  },
  {
    code: "BASO",
    name: "호염구",
    unit: "%",
    range: { low: 0, high: 2 },
    meaning: "알레르기와 일부 골수증식성 질환 맥락에서 참고하는 백혈구 분획입니다.",
    highText: "높으면 알레르기나 드문 혈액질환 맥락을 같이 살펴볼 수 있습니다.",
    lowText: "낮은 값 자체만으로는 의미가 크지 않을 때가 많습니다.",
    generalTip: "다른 백혈구 분획과 전체 혈구 패턴을 같이 보는 것이 좋습니다."
  },
  {
    code: "RETIC",
    name: "망상적혈구",
    unit: "%",
    range: { low: 0.5, high: 2.5 },
    meaning: "골수가 새 적혈구를 얼마나 만들고 있는지 참고하는 지표입니다.",
    highText: "높으면 용혈이나 출혈 후 회복 반응처럼 적혈구 생산이 증가한 맥락을 생각해볼 수 있습니다.",
    lowText: "낮으면 골수 생산 저하나 영양 결핍 가능성을 함께 봅니다.",
    generalTip: "혈색소, LDH, 빌리루빈과 함께 보면 빈혈 유형 해석이 더 수월해집니다."
  },
  {
    code: "DBIL",
    name: "직접빌리루빈",
    unit: "mg/dL",
    range: { low: 0, high: 0.3 },
    meaning: "담즙 정체와 간담도계 흐름을 볼 때 총빌리루빈과 함께 참고합니다.",
    highText: "높으면 담즙 배출 문제나 간담도계 이상 가능성을 같이 확인합니다.",
    lowText: "낮은 값 자체는 보통 큰 의미가 없습니다.",
    generalTip: "AST, ALT, ALP, 총빌리루빈과 함께 보는 편이 좋습니다."
  },
  {
    code: "TOTAL_PROTEIN",
    name: "총단백",
    unit: "g/dL",
    range: { low: 6.0, high: 8.3 },
    meaning: "영양 상태와 염증, 탈수, 면역글로불린 변화를 넓게 보는 기초 지표입니다.",
    highText: "높으면 탈수나 단백 증가 상태를 함께 고려합니다.",
    lowText: "낮으면 영양 저하, 간기능 저하, 신장 손실 등을 같이 봅니다.",
    generalTip: "알부민과 함께 보면 해석이 더 좋아집니다."
  },
  {
    code: "MG",
    name: "마그네슘",
    unit: "mg/dL",
    range: { low: 1.7, high: 2.2 },
    meaning: "근육, 신경, 심장 리듬과 관련된 중요한 전해질입니다.",
    highText: "높으면 신장 기능과 보충제/약물 사용 여부를 함께 봅니다.",
    lowText: "낮으면 근육 경련, 부정맥, 설사나 영양 문제와 연결될 수 있습니다.",
    generalTip: "칼륨, 칼슘과 함께 보면 전해질 해석이 더 좋아집니다."
  },
  {
    code: "TSH",
    name: "갑상선자극호르몬",
    unit: "uIU/mL",
    range: { low: 0.4, high: 4.5 },
    meaning: "갑상선 기능 상태를 볼 때 가장 기본이 되는 호르몬 지표입니다.",
    highText: "높으면 갑상선 기능저하 맥락을, 낮으면 기능항진 맥락을 함께 봅니다.",
    lowText: "낮으면 갑상선 기능항진이나 약물 조절 상태를 같이 생각해볼 수 있습니다.",
    generalTip: "Free T4, 증상 변화, 복용 중인 갑상선 약과 함께 해석하면 좋습니다."
  },
  {
    code: "GGT",
    name: "감마지티피",
    unit: "U/L",
    range: { low: 8, high: 61 },
    meaning: "간담도계와 음주, 지방간 맥락 해석에 자주 참고하는 효소입니다.",
    highText: "높으면 음주, 지방간, 담도계 이상, 약물 영향을 같이 봅니다.",
    lowText: "낮은 값 자체는 보통 큰 의미가 적습니다.",
    generalTip: "AST, ALT, ALP와 함께 보는 편이 좋습니다."
  },
  {
    code: "CALCIUM",
    name: "칼슘",
    unit: "mg/dL",
    range: { low: 8.6, high: 10.2 },
    meaning: "근육과 신경, 뼈 대사에 중요한 전해질입니다.",
    highText: "높으면 탈수, 부갑상선 문제, 악성질환 맥락을 함께 확인합니다.",
    lowText: "낮으면 영양 상태, 비타민 D, 신장 문제와 연결해 봅니다.",
    generalTip: "알부민과 함께 해석하는 편이 더 정확합니다."
  },
  {
    code: "PHOSPHORUS",
    name: "인",
    unit: "mg/dL",
    range: { low: 2.5, high: 4.5 },
    meaning: "신장 기능과 뼈 대사, 세포 에너지 대사와 관련된 전해질입니다.",
    highText: "높으면 신장 기능 저하나 세포 파괴 맥락을 함께 확인합니다.",
    lowText: "낮으면 영양 상태나 호흡성/대사성 변화와 연결될 수 있습니다.",
    generalTip: "칼슘, 크레아티닌과 함께 보는 것이 좋습니다."
  },
  {
    code: "TCO2",
    name: "총이산화탄소",
    unit: "mmol/L",
    range: { low: 22, high: 29 },
    meaning: "대사성 산염기 균형을 참고하는 지표로 입원 chemistry에서 자주 봅니다.",
    highText: "높으면 대사성 알칼리증이나 보상 반응 맥락을 같이 살펴봅니다.",
    lowText: "낮으면 대사성 산증 가능성과 신장/호흡기 맥락을 같이 봅니다.",
    generalTip: "전해질, 크레아티닌, 임상 증상과 함께 보는 편이 좋습니다."
  },
  {
    code: "TOTAL_CHOLESTEROL",
    name: "총콜레스테롤",
    unit: "mg/dL",
    range: { low: 0, high: 200 },
    meaning: "지질 대사와 심혈관 위험도를 넓게 보는 기본 지표입니다.",
    highText: "높으면 식습관, 체중, 약물 복용 여부와 함께 장기 위험도를 봅니다.",
    lowText: "낮은 값은 영양 상태나 체질을 함께 고려할 수 있습니다.",
    generalTip: "HDL, LDL, 중성지방과 같이 보는 편이 좋습니다."
  },
  {
    code: "TRIGLYCERIDE",
    name: "중성지방",
    unit: "mg/dL",
    range: { low: 0, high: 150 },
    meaning: "대사 증후군과 지방간, 식이 영향 맥락에서 자주 참고하는 지표입니다.",
    highText: "높으면 당대사, 체중 변화, 식사 상태와 함께 보는 것이 좋습니다.",
    lowText: "낮은 값은 보통 큰 의미가 적지만 영양 상태와 함께 해석할 수 있습니다.",
    generalTip: "공복 여부를 꼭 같이 확인하는 것이 중요합니다."
  },
  {
    code: "HDL",
    name: "HDL",
    unit: "mg/dL",
    range: { low: 40, high: 100 },
    meaning: "심혈관 보호와 관련해 참고하는 콜레스테롤 지표입니다.",
    highText: "높은 편은 보통 보호적 의미로 해석되기도 하지만 전체 지질 패널을 같이 봅니다.",
    lowText: "낮으면 대사증후군과 심혈관 위험 맥락을 함께 살핍니다.",
    generalTip: "운동, 체중, 흡연 여부와 연결해 보는 편이 좋습니다."
  },
  {
    code: "LDL",
    name: "LDL",
    unit: "mg/dL",
    range: { low: 0, high: 130 },
    meaning: "심혈관 위험도 평가에서 자주 참고하는 콜레스테롤 지표입니다.",
    highText: "높으면 장기 혈관 위험도와 약물/식습관 조절 여부를 같이 봅니다.",
    lowText: "낮은 값은 치료 목표 달성 여부를 확인하는 맥락일 수 있습니다.",
    generalTip: "총콜레스테롤, HDL, 중성지방과 함께 보는 것이 좋습니다."
  },
  {
    code: "URIC_ACID",
    name: "요산",
    unit: "mg/dL",
    range: { low: 3.5, high: 7.2 },
    meaning: "통풍과 신장 기능, 세포 turnover 맥락에서 참고하는 지표입니다.",
    highText: "높으면 통풍 위험, 탈수, 신장 기능, 세포 파괴 맥락을 같이 봅니다.",
    lowText: "낮은 값은 영양 상태나 체질적 요인을 함께 고려할 수 있습니다.",
    generalTip: "신장 기능, 관절 통증, 약물 복용 여부와 함께 기록하면 좋습니다."
  }
];

export const sampleValues = {
  WBC: 13.8,
  RBC: 3.42,
  HGB: 9.8,
  PLT: 118,
  CRP: 16.2,
  AST: 42,
  ALT: 58,
  BUN: 24,
  CREAT: 1.1,
  GLU: 114,
  FERRITIN: 18
};
