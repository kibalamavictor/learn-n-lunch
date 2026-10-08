// Source of truth for the KIU food insecurity questionnaire (research/KIU_Food_Insecurity_Questionnaire_.docx).
// The form (scripts/lib/pages/research-study.js) and the Google Sheet script (scripts/kiu-food-study.gs)
// are both generated from this file. Question wording, option order and codes must stay verbatim;
// FIES (Section D) and IDDS (Section F) are standardised FAO instruments.

const MAIN_CAMPUS = "Main Campus (Kansanga, Kampala)";
const WESTERN_CAMPUS = "Western Campus (Ishaka, Bushenyi)";
const SCHOOLS_BY_CAMPUS = {
  [MAIN_CAMPUS]: [
    "College of Economics and Management",
    "College of Humanities and Social Sciences",
    "College of Education, Open and Distance Learning",
    "School of Law",
    "School of Public Health",
    "School of Mathematics and Computing",
    "School of Natural and Applied Sciences",
    "School of Digital, Distance and E-Learning"
  ],
  [WESTERN_CAMPUS]: [
    "Faculty of Clinical Medicine and Dentistry",
    "Faculty of Biomedical Sciences",
    "School of Allied Health Sciences",
    "School of Nursing Sciences",
    "School of Pharmacy",
    "School of Engineering and Applied Sciences",
    "School of Agriculture Sciences"
  ]
};

const CONSENT_YES = "Yes, I consent";
const CONSENT_NO = "No, I do not consent";
const AGE_YES = "Yes";
const AGE_NO = "No";

const FIVE_POINT_AGREE = ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"];
const FIVE_POINT_FREQUENCY = ["Never", "Rarely", "Sometimes", "Often", "Always"];
const PAST_30_DAYS = "In the past 30 days:";
const RECALL_HINT = 'List all foods and beverages consumed (or write "None").';

const FIES_ROWS = [
  ["D1", "Worried about not having enough food", "During the last 12 months, was there a time when you worried you would not have enough food to eat because of a lack of money or other resources?"],
  ["D2", "Unable to eat healthy and nutritious food", "During the last 12 months, was there a time when you were unable to eat healthy and nutritious food because of a lack of money or other resources?"],
  ["D3", "Ate only a few kinds of foods", "During the last 12 months, was there a time when you ate only a few kinds of foods because of a lack of money or other resources?"],
  ["D4", "Skipped a meal", "During the last 12 months, was there a time when you had to skip a meal because there was not enough money or other resources to get food?"],
  ["D5", "Ate less than you should", "During the last 12 months, was there a time when you ate less than you thought you should because of a lack of money or other resources?"],
  ["D6", "Household ran out of food", "During the last 12 months, was there a time when your household ran out of food because of a lack of money or other resources?"],
  ["D7", "Hungry but did not eat", "During the last 12 months, was there a time when you felt hungry but did not eat because there was not enough money or other resources for food?"],
  ["D8", "Went without eating for a whole day", "During the last 12 months, was there a time when you went without eating for a whole day because of a lack of money or other resources?"]
].map(([id, short, text]) => ({ id, short, text }));

const IDDS_GROUPS = [
  "Starchy staples (e.g., posho, matooke, rice, bread, potatoes, cassava)",
  "Dark green leafy vegetables (e.g., dodo, nakati, spinach)",
  "Other vitamin A-rich fruits/vegetables (e.g., mango, pumpkin, carrots, papaya)",
  "Other vegetables (e.g., tomatoes, onions, cabbage, eggplant)",
  "Other fruits (e.g., banana, orange, pineapple, jackfruit)",
  "Organ meat (e.g., liver, kidney)",
  "Meat and fish (e.g., beef, chicken, fish, goat)",
  "Eggs",
  "Legumes, nuts and seeds (e.g., beans, groundnuts, peas, simsim)",
  "Milk and milk products (e.g., milk, yogurt, cheese)"
];

function rows(prefix, items) {
  return items.map(([short, text], index) => ({ id: `${prefix}.${index + 1}`, short, text }));
}

function recall(id, short, label) {
  return { id, type: "textarea", short, text: label, hint: RECALL_HINT, required: true };
}

const study = {
  id: "kiu-food-study",
  version: "2026-10-07",
  title: "Structured questionnaire on prevalence, determinants and consequences of food insecurity among students",
  institution: "Kampala International University (KIU)",
  consent: { question: "A1", yes: CONSENT_YES, ageQuestion: "A2", ageYes: AGE_YES },
  scoring: {
    fies: {
      items: FIES_ROWS.map((row) => row.id),
      yes: "Yes",
      categories: [
        { max: 0, label: "Food secure" },
        { max: 3, label: "Mildly food insecure" },
        { max: 6, label: "Moderately food insecure" },
        { max: 8, label: "Severely food insecure" }
      ]
    },
    idds: {
      question: "F",
      categories: [
        { max: 3, label: "Low dietary diversity" },
        { max: 5, label: "Medium dietary diversity" },
        { max: 10, label: "High dietary diversity" }
      ]
    }
  },
  // Drives the live dashboard (/kiu-food-study/dashboard/). Food insecurity "insecure" = moderate or severe.
  analysis: {
    publicMinCell: 5,
    fastMinutes: 5,
    filters: ["CAMPUS", "B2", "B3", "B4", "B5", "B6"],
    ageBands: [
      { max: 20, label: "18–20" },
      { max: 23, label: "21–23" },
      { max: 26, label: "24–26" },
      { max: 200, label: "27+" }
    ],
    sample: ["CAMPUS", "B2", "AGE_BAND", "B3", "B4", "B5", "B6"],
    determinants: [
      { group: "Demographic factors", ids: ["CAMPUS", "AGE_BAND", "B2", "B3", "B4", "B5", "B6", "B7"] },
      { group: "Socio-economic factors", ids: ["C1", "C2", "C3", "C4", "C5", "C6", "C7"] }
    ],
    outcomes: [
      { id: "H1", label: "Missed at least one lecture due to hunger (30 days)", not: ["None"] },
      { id: "G1", label: "Typically eats only one meal a day", any: ["1 meal"] },
      { id: "H3.1", label: "Difficulty concentrating in class due to hunger", any: ["Agree", "Strongly Agree"] },
      { id: "H3.3", label: "Academic performance affected by food insecurity", any: ["Agree", "Strongly Agree"] },
      { id: "H3.4", label: "Too tired to study because of lack of food", any: ["Agree", "Strongly Agree"] },
      { id: "H4.1", label: "Often or always stressed about having enough food", any: ["Often", "Always"] },
      { id: "H4.2", label: "Often or always depressed or sad about food situation", any: ["Often", "Always"] },
      { id: "H4.4", label: "Sleep often or always affected", any: ["Often", "Always"] },
      { id: "H5.1", label: "Often or always physically weak from lack of food", any: ["Often", "Always"] },
      { id: "H5.3", label: "Often or always dizzy or faint from not eating", any: ["Often", "Always"] },
      { id: "H6", label: "Rates own health as fair or poor", any: ["Fair", "Poor"] },
      { id: "H7.1", label: "Felt isolated from peers due to food situation", any: ["Yes"] }
    ],
    scales: ["H3", "H4", "H5"],
    diet: { meals: "G1", places: "G2" },
    consequences: { lectures: "H1", coping: "H2", health: "H6", social: "H7" },
    support: { awareness: "I1", accessed: "I2" },
    voices: { recommendations: "J1", programmes: "I2_which" },
    textFields: ["J1", "I2_which", "C2_other", "C5_other"]
  },
  sections: [
    {
      id: "A",
      title: "Informed consent",
      intro:
        "We are student researchers at Kampala International University conducting a study on food insecurity among students at KIU. Your participation is voluntary, and all information you provide will be kept confidential and used only for academic purposes. You may withdraw at any time without penalty.",
      questions: [
        {
          id: "A1",
          type: "radio",
          short: "Enrolled undergraduate and consents",
          text: "Are you currently an enrolled undergraduate student at KIU, and do you consent to participate in this study?",
          options: [CONSENT_YES, CONSENT_NO],
          required: true,
          screenOut: { [CONSENT_NO]: "consent" }
        },
        {
          id: "A2",
          type: "radio",
          short: "Aged 18 or older",
          text: "Are you 18 years of age or older?",
          options: [AGE_YES, AGE_NO],
          required: true,
          screenOut: { [AGE_NO]: "age" }
        }
      ]
    },
    {
      id: "B",
      title: "Demographic and background information",
      questions: [
        {
          id: "CAMPUS",
          code: "Campus",
          type: "radio",
          short: "Campus",
          text: "Campus",
          options: [MAIN_CAMPUS, WESTERN_CAMPUS],
          required: true
        },
        { id: "B1", type: "number", short: "Age", text: "Age (in completed years)", min: 18, max: 80, required: true },
        { id: "B2", type: "radio", short: "Sex", text: "Sex", options: ["Male", "Female"], required: true },
        {
          id: "B3",
          type: "radio",
          short: "Year of study",
          text: "Year of study",
          options: ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5+"],
          required: true
        },
        {
          id: "B4",
          type: "radio",
          short: "College / school",
          text: "Which College or School do you belong to?",
          dependsOn: "CAMPUS",
          dependsHint: "Select your campus above to see its colleges and schools.",
          optionsBy: SCHOOLS_BY_CAMPUS,
          options: [].concat(SCHOOLS_BY_CAMPUS[MAIN_CAMPUS], SCHOOLS_BY_CAMPUS[WESTERN_CAMPUS]),
          required: true
        },
        {
          id: "B5",
          type: "radio",
          short: "Sponsorship status",
          text: "Sponsorship status",
          options: ["KIU-sponsored", "Privately/self-sponsored"],
          required: true
        },
        {
          id: "B6",
          type: "radio",
          short: "Residence status",
          text: "Residence status during academic sessions",
          options: ["Resident (on-campus/university hostel)", "Non-resident (off-campus)"],
          required: true
        },
        { id: "B7", type: "radio", short: "Marital status", text: "Marital status", options: ["Single", "Married", "Other"], required: true }
      ]
    },
    {
      id: "C",
      title: "Socio-economic determinants of food insecurity",
      questions: [
        {
          id: "C1",
          type: "radio",
          short: "Monthly income / allowance (UGX)",
          text: "What is your average monthly income/allowance (UGX)?",
          options: [
            "Below UGX 50,000",
            "UGX 50,000–100,000",
            "UGX 100,001–200,000",
            "UGX 200,001–300,000",
            "UGX 300,001–500,000",
            "Above UGX 500,000"
          ],
          required: true
        },
        {
          id: "C2",
          type: "radio",
          short: "Main source of income",
          text: "What is the main source of this income/allowance?",
          options: ["Family/parents", "Guardian/sponsor", "Personal employment", "Scholarship/bursary", "Other (specify)"],
          other: "Other (specify)",
          required: true
        },
        {
          id: "C3",
          type: "radio",
          short: "Employment status",
          text: "What is your employment status?",
          options: ["Employed (part-time)", "Employed (full-time)", "Unemployed / not working"],
          required: true
        },
        {
          id: "C4",
          type: "radio",
          short: "Parent / guardian education",
          text: "What is the highest education level attained by your parent/guardian?",
          options: ["No formal education", "Primary", "Secondary", "Tertiary/University", "Postgraduate"],
          required: true
        },
        {
          id: "C5",
          type: "radio",
          short: "Parent / guardian occupation",
          text: "What is the main occupation of your parent/guardian?",
          options: ["Formal employment", "Business/self-employed", "Peasant farming", "Unemployed", "Other (specify)"],
          other: "Other (specify)",
          required: true
        },
        {
          id: "C6",
          type: "radio",
          short: "Household income level",
          text: "How would you describe your household's monthly income level?",
          options: ["Low", "Middle", "High", "Not sure"],
          required: true
        },
        {
          id: "C7",
          type: "radio",
          short: "Weekly food spending (UGX)",
          text: "On average, how much do you spend on food per week?",
          options: ["Below UGX 10,000", "UGX 10,001–20,000", "UGX 20,001–30,000", "UGX 30,001–50,000", "Above UGX 50,000"],
          required: true
        }
      ]
    },
    {
      id: "D",
      title: "Food Insecurity Experience Scale (FIES)",
      intro: "Please answer Yes or No for each statement.",
      questions: [
        {
          id: "D",
          code: "D1–D8",
          type: "matrix",
          short: "FIES",
          text: "FIES items (FAO Food Insecurity Experience Scale)",
          columns: ["Yes", "No"],
          rows: FIES_ROWS,
          required: true
        }
      ]
    },
    {
      id: "E",
      title: "24-hour dietary recall",
      intro:
        "Think about everything you ate and drank YESTERDAY, from when you woke up to when you went to sleep. Include snacks and drinks. Write 'None' if you had nothing at that time.",
      questions: [
        recall("E1", "Early morning", "Early morning (on waking)"),
        recall("E2", "Breakfast", "Breakfast"),
        recall("E3", "Mid-morning snack", "Mid-morning snack"),
        recall("E4", "Lunch", "Lunch"),
        recall("E5", "Afternoon snack", "Afternoon snack"),
        recall("E6", "Supper / dinner", "Supper/Dinner"),
        recall("E7", "Late evening / before bed", "Late evening / before bed")
      ]
    },
    {
      id: "F",
      title: "Individual Dietary Diversity Score (IDDS)",
      intro:
        "Thinking about YESTERDAY (from waking up to sleeping), select every food group you ate or drank from. Condiments, spices, and beverages of negligible nutritional value are not counted.",
      questions: [
        {
          id: "F",
          code: "F1–F10",
          type: "checkbox",
          short: "Food groups consumed yesterday",
          text: "Food Group (FAO Individual Dietary Diversity Score)",
          hint: "Select if consumed. Leave unselected any group you did not eat or drink from.",
          options: IDDS_GROUPS,
          flagPrefix: "F",
          required: false
        }
      ]
    },
    {
      id: "G",
      title: "Dietary factors",
      questions: [
        {
          id: "G1",
          type: "radio",
          short: "Meals per day",
          text: "How many meals do you typically eat per day?",
          options: ["1 meal", "2 meals", "3 meals", "More than 3 meals"],
          required: true
        },
        {
          id: "G2",
          type: "checkbox",
          short: "Where meals are eaten",
          text: "Where do you usually eat your meals?",
          hint: "You may select more than one.",
          options: [
            "University cafeteria",
            "Off-campus restaurant/food vendor",
            "Self-prepared at residence",
            "At friends'/relatives' place",
            "Don't eat regular meals"
          ],
          required: true
        }
      ]
    },
    {
      id: "H",
      title: "Consequences of food insecurity",
      questions: [
        {
          id: "H1",
          type: "radio",
          short: "Lectures missed (30 days)",
          text: "In the past 30 days, how many lectures have you missed due to hunger or lack of food?",
          options: ["None", "1–2", "3–5", "More than 5"],
          required: true
        },
        {
          id: "H2",
          type: "checkbox",
          short: "Coping strategies (30 days)",
          text: "In the past 30 days, which of the following coping strategies have you used when food was not available?",
          hint: "Select all that apply.",
          options: [
            "Borrowed money to buy food",
            "Borrowed/asked others for food",
            "Reduced number/size of meals",
            "Took on casual labor for food/money",
            "Sold personal possessions",
            "Relied on a transactional relationship for food or money",
            "Relied on student union/religious group/organization support",
            "None of the above"
          ],
          exclusive: "None of the above",
          required: true
        },
        {
          id: "H3",
          type: "matrix",
          short: "Academic impact",
          text: "Academic Impact",
          prompt: PAST_30_DAYS,
          columns: FIVE_POINT_AGREE,
          rows: rows("H3", [
            ["Difficulty concentrating", "I have had difficulty concentrating in class due to hunger"],
            ["Missed classes, no food", "I have missed classes because I had no food to eat"],
            ["Academic performance affected", "My academic performance has been affected by food insecurity"],
            ["Too tired to study", "I have been too tired to study because of lack of food"],
            ["Skipped library / study sessions", "I have skipped library or study sessions due to hunger"]
          ]),
          required: true
        },
        {
          id: "H4",
          type: "matrix",
          short: "Mental health impact",
          text: "Mental Health Impact",
          prompt: PAST_30_DAYS,
          columns: FIVE_POINT_FREQUENCY,
          rows: rows("H4", [
            ["Stressed about food", "I have felt stressed about having enough food"],
            ["Depressed or sad", "I have felt depressed or sad about my food situation"],
            ["Embarrassed", "I have felt embarrassed about my food situation"],
            ["Sleep affected", "Food insecurity has affected my sleep"]
          ]),
          required: true
        },
        {
          id: "H5",
          type: "matrix",
          short: "Physical health impact",
          text: "Physical Health Impact",
          prompt: PAST_30_DAYS,
          columns: FIVE_POINT_FREQUENCY,
          rows: rows("H5", [
            ["Physically weak", "I have felt physically weak due to lack of food"],
            ["Headaches", "I have experienced headaches due to hunger"],
            ["Dizzy or faint", "I have felt dizzy or faint from not eating enough"],
            ["Sick more often", "I have fallen sick more often than usual"]
          ]),
          required: true
        },
        {
          id: "H6",
          type: "radio",
          short: "Overall health rating",
          text: "How would you rate your overall health?",
          options: ["Excellent", "Very good", "Good", "Fair", "Poor"],
          required: true
        },
        {
          id: "H7",
          type: "matrix",
          short: "Social impact",
          text: "Social Impact",
          prompt: PAST_30_DAYS,
          columns: ["Yes", "No"],
          rows: rows("H7", [
            ["Isolated from peers", "I have felt isolated from peers due to my food situation"],
            ["Friendships affected", "My relationships with friends have been affected"],
            ["Ashamed to ask for help", "I have felt ashamed to ask for help with food"]
          ]),
          required: true
        }
      ]
    },
    {
      id: "I",
      title: "Institutional support and awareness",
      questions: [
        {
          id: "I1",
          type: "matrix",
          short: "Food support programs available",
          text: "Does your university have any of the following food support programs?",
          columns: ["Yes", "No", "Don't Know"],
          rows: rows("I1", [
            ["Subsidized cafeteria", "Subsidized cafeteria/dining hall"],
            ["Food vouchers / meal plans", "Food vouchers or meal plans"],
            ["Emergency food assistance", "Emergency food assistance"],
            ["Food bank", "Food bank"],
            ["Bursary / welfare fund for food", "Bursary/welfare fund for food"]
          ]),
          required: true
        },
        {
          id: "I2",
          type: "radio",
          short: "Accessed food support",
          text: "Have you ever accessed any food support programs at your university?",
          options: ["Yes", "No", "Not available"],
          required: true,
          followUp: {
            id: "I2_which",
            when: "Yes",
            short: "Which program(s)",
            text: "Which one(s)?",
            required: true
          }
        }
      ]
    },
    {
      id: "J",
      title: "Recommendations and suggestions",
      questions: [
        {
          id: "J1",
          type: "textarea",
          short: "Recommended interventions",
          text: "What interventions do you think would be most helpful to address food insecurity among students?",
          required: false
        }
      ]
    }
  ]
};

module.exports = { study, CONSENT_YES, CONSENT_NO, AGE_YES, AGE_NO };
